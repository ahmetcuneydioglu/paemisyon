import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { iptalSoruIdleri } from '../../common/iptal-soru';
import { tekrarKaydiFiltresi, yanlisTuruSoruFiltresi } from '../quiz/yanlis-havuzu';
import { gunBaslangici } from '../../common/gun';

/** Liste üst sınırları (istemci sözleşmesi: yanlışlar 50, favoriler 100). */
const LISTE_UST_SINIRI = { yanlis: 50, favori: 100 } as const;
/** Yayından kalkan sorular süzülünce sayfa kısalmasın diye fazladan okunan kayıt payı. */
const YAYINDAN_KALKAN_PAYI = 30;

/// Yanlışlarım & favoriler (Doc 7 §4.6).
@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getWrongAnswers(userId: string) {
    // İptal edilmiş soru defterde durmaz: kurumun geçersiz saydığı soruyu
    // "tekrar et" diye önümüze koymak yanlışı kullanıcıya mal etmek olur.
    // Yayından kalkan soru da durmaz (Doc 55 F3): arşivlenen ya da merkezden geri
    // çekilen soru turda zaten çıkmıyordu (`yanlisTuruSoruFiltresi`); defterin
    // "4 yanlışın var" derken turun 3 soru kurması tutarsızlıktı. Kayıt silinmez,
    // yalnız listelenmez — tur incelemesi cevaplanan sürümü okumaya devam eder.
    const rows = await this.prisma.wrongAnswer.findMany({
      where: {
        userId,
        resolvedAt: null,
        questionId: { notIn: await iptalSoruIdleri(this.prisma) },
      },
      orderBy: { lastWrongAt: 'desc' },
      take: LISTE_UST_SINIRI.yanlis + YAYINDAN_KALKAN_PAYI,
    });
    const stems = await this.stems(rows.map((r) => r.questionId));
    return rows
      .filter((r) => stems.has(r.questionId))
      .slice(0, LISTE_UST_SINIRI.yanlis)
      .map((r) => ({
        questionId: r.questionId,
        wrongCount: r.wrongCount,
        stem: stems.get(r.questionId)?.stem ?? null,
        topicName: stems.get(r.questionId)?.topicName ?? null,
      }));
  }

  /**
   * Süresi gelen tekrar özeti (Doc 49 S1-A). Sayım ve örnek, tur havuzuyla aynı süzgeçten
   * (tek tanım); `nextDueAt` bugün boşsa bir sonraki vadeyi söyler. İstemci "N soru hazır /
   * sıradaki yarın" diyebilir; sıfır uydurulmaz.
   */
  async getDue(user: { id: string; isPremium: boolean }) {
    const now = Date.now();
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { preferredModuleId: true },
    });
    const soruSuzgeci = yanlisTuruSoruFiltresi({
      isPremium: user.isPremium,
      preferredModuleId: profile?.preferredModuleId ?? null,
    });
    const due = await this.prisma.questionReview.findMany({
      where: tekrarKaydiFiltresi(user.id, user.isPremium, now),
      orderBy: { dueAt: 'asc' },
      select: { questionId: true, dueAt: true },
      take: 500,
    });
    const uygun = due.length
      ? await this.prisma.question.findMany({
          where: { id: { in: due.map((d) => d.questionId) }, ...soruSuzgeci },
          select: { id: true },
        })
      : [];
    const uygunSet = new Set(uygun.map((q) => q.id));
    const liste = due.filter((d) => uygunSet.has(d.questionId));
    const bugunBasi = gunBaslangici(new Date(now)).getTime();
    const dueToday = liste.filter((d) => d.dueAt.getTime() >= bugunBasi).length;
    const sample = liste.slice(0, 5);
    const stems = await this.stems(sample.map((s) => s.questionId));
    const next = liste.length
      ? null
      : await this.prisma.questionReview.findFirst({
          where: { userId: user.id, dueAt: { gt: new Date(now) } },
          orderBy: { dueAt: 'asc' },
          select: { dueAt: true },
        });
    return {
      count: liste.length,
      dueToday,
      nextDueAt: liste.length ? liste[0]!.dueAt.toISOString() : (next?.dueAt.toISOString() ?? null),
      sample: sample.map((s) => ({
        questionId: s.questionId,
        stem: stems.get(s.questionId)?.stem ?? null,
        topicName: stems.get(s.questionId)?.topicName ?? null,
        dueAt: s.dueAt.toISOString(),
      })),
    };
  }

  /** Favoriler; yayından kalkan soru listelenmez (kayıt durur, soru geri gelirse görünür). */
  async getBookmarks(userId: string) {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: LISTE_UST_SINIRI.favori + YAYINDAN_KALKAN_PAYI,
    });
    const stems = await this.stems(rows.map((r) => r.questionId));
    return rows
      .filter((r) => stems.has(r.questionId))
      .slice(0, LISTE_UST_SINIRI.favori)
      .map((r) => ({
        questionId: r.questionId,
        stem: stems.get(r.questionId)?.stem ?? null,
        topicName: stems.get(r.questionId)?.topicName ?? null,
      }));
  }

  async addBookmark(userId: string, questionId: string) {
    await this.prisma.bookmark.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {},
      create: { userId, questionId },
    });
    return { bookmarked: true };
  }

  async removeBookmark(userId: string, questionId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, questionId } });
    return { bookmarked: false };
  }

  /**
   * Soru id'lerinden kök metin + konu adı (tek sorgu). Yalnız YAYINDAKİ sorular döner:
   * `deletedAt` dolu (arşiv / merkezden geri çekme) ya da güncel sürümü olmayan soru haritada
   * yoktur; çağıran bunu "listelenmez" diye okur.
   */
  private async stems(ids: string[]) {
    if (ids.length === 0)
      return new Map<string, { stem: string | null; topicName: string | null }>();
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids }, deletedAt: null, currentVersionId: { not: null } },
      select: {
        id: true,
        currentVersion: { select: { stem: true } },
        topic: { select: { name: true } },
      },
    });
    return new Map(
      questions.map((q) => [
        q.id,
        { stem: q.currentVersion?.stem ?? null, topicName: q.topic?.name ?? null },
      ]),
    );
  }
}
