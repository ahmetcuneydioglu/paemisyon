import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PushService } from './push.service';

/**
 * "Seni geçti" akşam dürtmesi (rekabet döngüsü): günün sıralamasında bir üste
 * çıkan rakip, GÜN İÇİNDE gerçekten geçtiyse ("önce sen öndeydin") geçilen
 * kullanıcıya tek push atılır — "Ayşe seni geçti, 3 doğruyla geri al".
 *
 * Tasarım sınırları (Doc 12 tonu — moral bozmaz, kışkırtmaz):
 *  - Yalnız BUGÜN oynamış (puanı olan) kullanıcıya gider: yarışta olmayan
 *    kişiye "geçildin" demek suçlamadır, motivasyon değil.
 *  - Yalnız HEMEN üstteki rakip anlatılır; günde en fazla 1 push (tek cron).
 *  - Fark cümlesi hep kazanılabilir: "N doğruyla geri geçersin".
 *  - 20.30 TR: 19.00 yerel günün-sorusu bildirimiyle çakışmaz.
 *
 * NUDGE_CRON=0 → cron kapalı (lokal geliştirme prod token'larına
 * yanlışlıkla göndermesin diye lokal .env'de kapatılır).
 */
@Injectable()
export class LeaderboardNudgeService {
  private readonly logger = new Logger(LeaderboardNudgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  @Cron('30 20 * * *', { timeZone: 'Europe/Istanbul' })
  async eveningCron() {
    if (process.env.NUDGE_CRON === '0') return;
    const r = await this.run(false);
    this.logger.log(`Geçilme dürtmesi: ${JSON.stringify(r)}`);
  }

  /**
   * Günün geçilme vakalarını bulur; dryRun değilse push'lar.
   * Dönüş: aday listesi (panelden test için de kullanılır).
   */
  async run(dryRun: boolean) {
    if (!dryRun && !this.push.enabled) {
      return { ok: false as const, error: 'Push yapılandırılmadı.' };
    }
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    // Günün puan üreten turları — zaman çizelgesinin ham maddesi.
    const sessions = await this.prisma.quizSession.findMany({
      where: {
        status: 'completed',
        startedAt: { gte: dayStart },
        correctCount: { gt: 0 },
        user: { deletedAt: null },
      },
      select: { userId: true, completedAt: true, correctCount: true },
      orderBy: { completedAt: 'asc' },
    });
    if (sessions.length === 0) return { ok: true as const, candidates: [], sent: 0 };

    // Kullanıcı başına olay listesi + final puan + son tamamlanma anı.
    const events = new Map<string, { t: number; p: number }[]>();
    for (const s of sessions) {
      const list = events.get(s.userId) ?? [];
      list.push({ t: s.completedAt?.getTime() ?? 0, p: s.correctCount });
      events.set(s.userId, list);
    }
    const finals = [...events.entries()].map(([userId, list]) => ({
      userId,
      points: list.reduce((a, e) => a + e.p, 0),
      lastAt: list[list.length - 1].t,
    }));
    // Günün sıralaması (leaderboard 'today' ile aynı: puan ↓, erken bitiren ↑).
    finals.sort((a, b) => b.points - a.points || a.lastAt - b.lastAt);

    // Push token'ı olan kullanıcılar — yalnız onlara bakılır.
    const tokenUsers = new Set(
      (
        await this.prisma.pushToken.findMany({
          where: { userId: { in: finals.map((f) => f.userId) } },
          select: { userId: true },
        })
      ).map((t) => t.userId),
    );

    // Gün içi GERÇEK geçilme: bir an B önde iken gün sonunda A önde.
    const wasAhead = (behind: string, ahead: string): boolean => {
      const b = events.get(behind)!;
      const a = events.get(ahead)!;
      let bi = 0;
      let ai = 0;
      let bSum = 0;
      let aSum = 0;
      while (bi < b.length || ai < a.length) {
        const bt = bi < b.length ? b[bi].t : Infinity;
        const at = ai < a.length ? a[ai].t : Infinity;
        if (bt <= at) {
          bSum += b[bi++].p;
        } else {
          aSum += a[ai++].p;
        }
        if (bSum > aSum) return true; // B bir an öndeydi
      }
      return false;
    };

    const firstName = (dn: string | null) =>
      (dn ?? '').trim().split(/\s+/)[0] || 'Bir rakip';

    const candidates: { userId: string; rivalName: string; need: number }[] = [];
    for (let i = 1; i < finals.length; i++) {
      const me = finals[i]; // geçilen aday (B)
      const rival = finals[i - 1]; // hemen üstü (A)
      if (!tokenUsers.has(me.userId)) continue;
      if (!wasAhead(me.userId, rival.userId)) continue;
      candidates.push({
        userId: me.userId,
        rivalName: rival.userId,
        // Geri geçmek için gereken doğru: fark + 1 (eşitlik yetmez).
        need: rival.points - me.points + 1,
      });
    }
    if (candidates.length === 0) return { ok: true as const, candidates: [], sent: 0 };

    // Rakip adlarını doldur (tek sorgu).
    const names = new Map(
      (
        await this.prisma.user.findMany({
          where: { id: { in: candidates.map((c) => c.rivalName) } },
          select: { id: true, displayName: true },
        })
      ).map((u) => [u.id, firstName(u.displayName)]),
    );

    let sent = 0;
    const out = [];
    for (const c of candidates) {
      const rival = names.get(c.rivalName) ?? 'Bir rakip';
      const body =
        c.need <= 1
          ? `${rival} bugün seni geçti — 1 doğruyla sırayı geri alırsın! 💪`
          : `${rival} bugün seni geçti — ${c.need} doğruyla sırayı geri alırsın! 💪`;
      out.push({ userId: c.userId, rival, need: c.need });
      if (!dryRun) {
        const r = await this.push.sendToUser(c.userId, {
          title: 'Sıralamada hareket var 🏃',
          body,
          route: 'leaderboard',
        });
        if (r.ok) sent += r.sent ?? 0;
      }
    }
    return { ok: true as const, candidates: out, sent };
  }
}
