import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Çıkmış sınav vitrini (Doc 36) — girişsiz katman.
 *
 * İki tür sınav var ve KARIŞTIRILMAZ:
 *   `resmi`  — kurumun yayımladığı gerçek kitapçık. Sorular bankadadır.
 *   `analiz` — sınav yayımlanmadı; elimizde yalnız aday hatırlatmasından
 *              çıkarılmış konu dağılımı var. Soru YOKTUR.
 * Tür, sayfada rozet olarak görünür; "çıkmış soru" güveni bunun üstünde duruyor.
 *
 * Public sayfada dönem başına yalnız `publiclyVisible` işaretli sorular tam
 * metniyle döner (Doc 36 §3). Kalanların sayısı verilir, içeriği verilmez.
 */

export interface CikmisSinavOzet {
  slug: string;
  ad: string;
  kurum: string;
  donem: number | null;
  tarih: string | null;
  tur: 'resmi' | 'analiz';
  ozet: string | null;
  /** Sınavdaki toplam soru (bankada olmasa da). */
  soruSayisi: number | null;
  /** Public sayfada tam metniyle görünen soru sayısı. */
  acikSoru: number;
  /** Deneme motorundaki karşılığı — "sınav gibi çöz" bunu kullanır. */
  examId: string | null;
  /** Dönem Premium'a özel mi (vitrinde kilit rozeti). */
  isPremium: boolean;
  dersDagilimi: { ders: string; adet: number }[];
}

export interface CikmisSinavSoru {
  sira: number;
  iptal: boolean;
  ders: string;
  konu: string;
  kok: string;
  gorselUrl: string | null;
  siklar: { harf: string; metin: string; dogru: boolean }[];
  aciklama: string | null;
  dayanak: { baslik: string; url: string | null }[];
}

@Injectable()
export class CikmisSinavService {
  constructor(private readonly prisma: PrismaService) {}

  /** Vitrin listesi — yayımlanmış dönemler, yeniden eskiye. */
  async list(): Promise<CikmisSinavOzet[]> {
    const sinavlar = await this.prisma.pastExam.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: [{ sortOrder: 'desc' }, { heldOn: 'desc' }],
      include: {
        questions: {
          select: {
            publicly: true,
            question: { select: { topic: { select: { course: { select: { name: true } } } } } },
          },
        },
      },
    });
    return sinavlar.map((s) => this.ozetle(s));
  }

  /**
   * Girişli kullanıcı için TAM dönem: bütün sorular, cevaplarıyla ve
   * açıklamalarıyla (çalışma modu, Doc 36 §4).
   *
   * Public sayfadaki 10 soruluk sınır bir pazarlama kararı; hesabı olan
   * kullanıcıya aynı sınırı uygulamak, ona zaten verdiğimiz şeyi saklamak
   * olurdu. Yayına alınmamış sürüm burada da GÖSTERİLMEZ.
   */
  async detailFull(slug: string, user: { id: string; isPremium: boolean }) {
    const sinav = await this.prisma.pastExam.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      select: { isPremium: true, examId: true },
    });
    if (!sinav) throw new NotFoundException('Sınav bulunamadı.');
    // Premium kapısı SUNUCUDA (Doc 8). Public sayfadaki 10 soru bundan
    // etkilenmez — orası huninin girişi.
    if (sinav.isPremium && !user.isPremium) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'Bu dönem Premium üyelere özeldir.',
      });
    }
    const [detay, durum] = await Promise.all([
      this.detail(slug, { hepsi: true }),
      this.kullaniciDurumu(user.id, sinav.examId),
    ]);
    return { ...detay, ...durum };
  }

  /**
   * Kullanıcının bu dönemdeki durumu (7 Eyl 2026 kullanıcı bildirimi).
   *
   * Ekran bunu bilmeden "Sınav gibi çöz" diyordu ve sınavı bitirmiş biri
   * dokununca SIFIRDAN yeni bir sınav başlıyordu. Tekrar çözmek meşru bir
   * ihtiyaç ama SESSİZCE olmamalı: aday önce sonucunu görmeli, tekrarı
   * bilerek seçmeli.
   */
  private async kullaniciDurumu(userId: string, examId: string | null) {
    if (!examId) return { devamEden: null, benimSonucum: null };
    const [devam, enIyi] = await Promise.all([
      this.prisma.quizSession.findFirst({
        where: { userId, archiveExamId: examId, status: 'in_progress' },
        // En çok ilerleyen: eski hatanın bıraktığı mükerrer oturumlarda
        // "en son" kuralı az cevaplı olanı seçebiliyordu.
        orderBy: [{ answers: { _count: 'desc' } }, { startedAt: 'desc' }],
        select: {
          id: true,
          startedAt: true,
          plannedDurationSeconds: true,
          totalQuestions: true,
          _count: { select: { answers: true } },
        },
      }),
      // EN İYİ sonuç gösterilir, en sonuncusu değil: kullanıcı arşivde birden
      // çok kez çözebiliyor ve "en son" kuralı ona kendi boş oturumunu
      // gösterirdi (6 Eylül 2026 dersi).
      this.prisma.quizSession.findFirst({
        where: { userId, archiveExamId: examId, status: 'completed' },
        orderBy: [{ correctCount: 'desc' }, { completedAt: 'desc' }],
        select: {
          id: true,
          correctCount: true,
          wrongCount: true,
          blankCount: true,
          score: true,
          totalQuestions: true,
          completedAt: true,
        },
      }),
    ]);
    return {
      devamEden: devam
        ? {
            attemptId: devam.id,
            cevaplanan: devam._count.answers,
            toplamSoru: devam.totalQuestions,
            kalanSaniye:
              devam.plannedDurationSeconds != null
                ? Math.max(
                    0,
                    devam.plannedDurationSeconds -
                      Math.floor((Date.now() - devam.startedAt.getTime()) / 1000),
                  )
                : null,
          }
        : null,
      benimSonucum: enIyi
        ? {
            attemptId: enIyi.id,
            correctCount: enIyi.correctCount,
            wrongCount: enIyi.wrongCount,
            blankCount: enIyi.blankCount,
            score: enIyi.score != null ? Number(enIyi.score) : null,
            totalQuestions: enIyi.totalQuestions,
            completedAt: enIyi.completedAt,
          }
        : null,
    };
  }

  async detail(slug: string, secenek?: { hepsi?: boolean }) {
    const s = await this.prisma.pastExam.findFirst({
      where: { slug, status: 'published', deletedAt: null },
      include: {
        questions: {
          orderBy: { orderNo: 'asc' },
          include: {
            question: {
              select: {
                topic: { select: { name: true, course: { select: { name: true } } } },
                currentVersion: {
                  select: {
                    status: true,
                    stem: true,
                    explanation: true,
                    mediaUrl: true,
                    options: { orderBy: { sortOrder: 'asc' }, select: { label: true, text: true, isCorrect: true } },
                    legalReferences: { select: { citation: true, url: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Sınav bulunamadı.');

    const acik: CikmisSinavSoru[] = [];
    for (const q of s.questions) {
      if (!secenek?.hepsi && !q.publicly) continue;
      const v = q.question.currentVersion;
      // Sürümü yayına alınmamış soru public sayfaya ÇIKMAZ: onay kuyruğundaki
      // metni sızdırmak, gözden geçirilmemiş içeriği yayımlamak olur.
      if (!v || v.status !== 'published') continue;
      acik.push({
        sira: q.orderNo,
        iptal: q.cancelled,
        ders: q.question.topic.course.name,
        konu: q.question.topic.name,
        kok: v.stem,
        gorselUrl: v.mediaUrl,
        siklar: v.options.map((o) => ({ harf: o.label, metin: o.text, dogru: o.isCorrect })),
        aciklama: v.explanation,
        dayanak: v.legalReferences.map((r) => ({ baslik: r.citation, url: r.url })),
      });
    }

    return {
      ...this.ozetle(s),
      analiz: s.analysis ?? null,
      sorular: acik,
      /** Uygulamada çözülebilen, public sayfada gösterilmeyen soru sayısı. */
      kapaliSoru: s.questions.length - acik.length,
      iptalSayisi: s.questions.filter((q) => q.cancelled).length,
    };
  }

  /**
   * Çalışma modunda verilen YANLIŞ cevabı defterine yazar (7 Eyl 2026 kararı).
   *
   * Çalışma modu sunucuda oturum açmaz — doğru cevap ve açıklama zaten yükte
   * gelir, değerlendirme istemcide olur. Sonuç şuydu: aday 100 gerçek sınav
   * sorusu çözüyor ama yanlışları çalışma defterine düşmüyordu. "Yanlışın
   * defterine düşer" uygulamanın çekirdek döngüsü ve buradaki sorular bankanın
   * en kıymetlileri.
   *
   * Yalnız yanlış defteri beslenir: günlük kota HARCANMAZ, puan/seri/hâkimiyet
   * İŞLEMEZ. Ölçüm isteyen "Sınav gibi çöz"e gider; iki ölçümü karıştırmak
   * adayın hangisinin gerçek olduğunu bilememesi olurdu — ayrıca süresiz ve
   * açıklamalı bir moddan puan vermek çiftçiliğe açık kapı bırakırdı.
   *
   * Doğruluk SUNUCUDA belirlenir: istemcinin "yanlıştı" demesine güvenilmez.
   */
  async calismaYanlisi(
    userId: string,
    slug: string,
    dto: { sira: number; harf: string },
  ): Promise<{ kaydedildi: boolean }> {
    const bag = await this.prisma.pastExamQuestion.findFirst({
      where: {
        orderNo: dto.sira,
        pastExam: { slug, status: 'published', deletedAt: null },
      },
      select: {
        questionId: true,
        cancelled: true,
        question: {
          select: {
            currentVersion: {
              select: {
                status: true,
                options: { select: { label: true, isCorrect: true } },
              },
            },
          },
        },
      },
    });
    if (!bag) throw new NotFoundException('Soru bu sınavda bulunamadı.');
    // İptal edilen soru sınavda puanlanmadı; yanlış defterine de yazılmaz.
    if (bag.cancelled) return { kaydedildi: false };
    const v = bag.question.currentVersion;
    if (!v || v.status !== 'published') {
      throw new NotFoundException('Soru yayında değil.');
    }
    const secilen = v.options.find(
      (o) => o.label.toUpperCase() === dto.harf.toUpperCase(),
    );
    if (!secilen) throw new NotFoundException('Şık bu soruda yok.');
    if (secilen.isCorrect) return { kaydedildi: false }; // doğruysa defter dolmaz

    await this.prisma.$executeRaw`
      INSERT INTO wrong_answers (user_id, question_id)
      VALUES (${userId}::uuid, ${bag.questionId}::uuid)
      ON CONFLICT (user_id, question_id) DO UPDATE SET
        wrong_count = wrong_answers.wrong_count + 1,
        last_wrong_at = now(),
        resolved_at = NULL`;
    return { kaydedildi: true };
  }

  private ozetle(s: {
    slug: string;
    name: string;
    institution: string;
    term: number | null;
    heldOn: Date | null;
    kind: string;
    summary: string | null;
    questionCount: number | null;
    examId?: string | null;
    isPremium?: boolean;
    analysis?: unknown;
    questions: { publicly: boolean; question: { topic: { course: { name: string } } } }[];
  }): CikmisSinavOzet {
    const dagilim = new Map<string, number>();
    for (const q of s.questions) {
      const ad = q.question.topic.course.name;
      dagilim.set(ad, (dagilim.get(ad) ?? 0) + 1);
    }
    // `analiz` türünde soru yok; dağılım analiz alanından okunur.
    if (!dagilim.size && s.analysis && typeof s.analysis === 'object') {
      const d = (s.analysis as { dersDagilim?: Record<string, number> }).dersDagilim ?? {};
      for (const [ad, n] of Object.entries(d)) dagilim.set(ad, n);
    }
    return {
      slug: s.slug,
      examId: s.examId ?? null,
      isPremium: s.isPremium ?? false,
      ad: s.name,
      kurum: s.institution,
      donem: s.term,
      tarih: s.heldOn ? s.heldOn.toISOString().slice(0, 10) : null,
      tur: s.kind as 'resmi' | 'analiz',
      ozet: s.summary,
      soruSayisi: s.questionCount ?? (s.questions.length || null),
      acikSoru: s.questions.filter((q) => q.publicly).length,
      dersDagilimi: [...dagilim].sort((a, b) => b[1] - a[1]).map(([ders, adet]) => ({ ders, adet })),
    };
  }
}
