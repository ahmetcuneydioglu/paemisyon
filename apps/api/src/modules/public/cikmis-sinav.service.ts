import { Injectable, NotFoundException } from '@nestjs/common';
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

  async detail(slug: string) {
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
      if (!q.publicly) continue;
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

  private ozetle(s: {
    slug: string;
    name: string;
    institution: string;
    term: number | null;
    heldOn: Date | null;
    kind: string;
    summary: string | null;
    questionCount: number | null;
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
