import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type DuelKind, type DuelMatch, type DuelParticipant } from '@prisma/client';
import { publicName } from '../../common/kisi-adi';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SORU_OZETI_SELECT, soruOzeti } from '../quiz/soru-ozeti';
import { DUEL_RULES, duelTopic, duelUserTopic } from './duel.config';
import type { DuelScope, PickedQuestion } from './duel-questions.service';
import { DuelRealtimeService, type DuelBroadcast } from './duel-realtime.service';
import {
  advance,
  answerWindow,
  duelOutcome,
  duelXp,
  eloDelta,
  nextHost,
  nextStreak,
  rankStandings,
  roomRatingDelta,
  roomStartBlocker,
  roomXp,
  scoreAnswer,
  type EngineRules,
  type EngineState,
  type Outcome,
} from './duel.logic';

export type Tx = Prisma.TransactionClient;

export interface DuelPlayerView {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isHost: boolean;
  isReady: boolean;
  /** Maçtan ayrıldı (bağlantı kopması DEĞİL; kopan oyuncu geri dönebilir). */
  left: boolean;
  score: number;
  correctCount: number;
  /** Açık soruyu cevapladı mı? Hangi şıkkı seçtiği soru kapanana kadar gizlidir. */
  answered: boolean;
  placement: number | null;
  outcome: string | null;
  xp: number | null;
  ratingDelta: number | null;
  wrongCount: number;
  blankCount: number;
  avgAnswerMs: number | null;
}

export interface DuelSnapshot {
  matchId: string;
  kind: DuelKind;
  phase: DuelMatch['phase'];
  seq: number;
  /** İstemci saat farkını bununla hesaplar; sayaçlar sunucu saatine göre çizilir. */
  serverNow: string;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  index: number;
  questionCount: number;
  secondsPerQuestion: number;
  maxPlayers: number;
  name: string | null;
  isPublic: boolean;
  /** Yalnız lobide ve süresi dolmamışsa. */
  code: string | null;
  codeExpiresAt: string | null;
  scope: DuelScope;
  players: DuelPlayerView[];
  question: {
    index: number;
    stem: string;
    mediaUrl: string | null;
    options: { id: string; label: string; text: string }[];
  } | null;
  /** Yalnız soru KAPANDIKTAN sonra dolar. */
  reveal: {
    correctOptionId: string;
    results: { userId: string; optionId: string | null; isCorrect: boolean; points: number }[];
  } | null;
}

export interface DuelStateForUser extends DuelSnapshot {
  /** Açık soruda benim seçimim (yeniden bağlanınca seçim geri gelsin). */
  myOptionId: string | null;
}

const YASAYAN: DuelMatch['phase'][] = ['countdown', 'question', 'reveal'];

function engineState(m: DuelMatch): EngineState {
  return {
    phase: m.phase,
    index: m.currentIndex,
    phaseStartedAt: m.phaseStartedAt?.getTime() ?? null,
    phaseEndsAt: m.phaseEndsAt?.getTime() ?? null,
  };
}

function engineRules(m: DuelMatch): EngineRules {
  return {
    questionCount: m.questionCount,
    secondsPerQuestion: m.secondsPerQuestion,
    revealMs: DUEL_RULES.revealMs,
    graceMs: DUEL_RULES.answerGraceMs,
  };
}

const iceride = (p: DuelParticipant) => p.leftAt == null && p.kickedAt == null;

/**
 * Maç motorunun veritabanı yüzü. HER değişiklik aynı kalıptan geçer:
 *   1) maç satırı kilitlenir (SELECT … FOR UPDATE) → aynı maça eşzamanlı istekler sıraya girer,
 *   2) `sync` maçı sunucu saatine taşır (süresi dolan soru kapanır, maç biter),
 *   3) işlem uygulanır, `seq` artar,
 *   4) commit'ten SONRA anlık görüntü özel kanala yayınlanır.
 * Böylece çift cevap, dolu salona çift katılım ve çift ödül yarışları veritabanında kapanır.
 */
@Injectable()
export class DuelEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: DuelRealtimeService,
  ) {}

  // ── Kilit + işlem + yayın ────────────────────────────────────────────────

  /** Maçı kilitler, günceller, `fn`'i çalıştırır; sonuç commit edilince durumu yayınlar. */
  async withMatch<T>(
    matchId: string,
    fn: (tx: Tx, match: DuelMatch, now: Date) => Promise<{ match: DuelMatch; result: T }>,
    now: Date = new Date(),
  ): Promise<T> {
    const { result, snapshot, changed } = await this.prisma.$transaction(
      async (tx) => {
        const kilitli = await this.lock(tx, matchId);
        const guncel = await this.sync(tx, kilitli, now);
        const { match, result } = await fn(tx, guncel, now);
        const changed = match.seq !== kilitli.seq;
        return { result, changed, snapshot: changed ? await this.snapshot(tx, match, now) : null };
      },
      { timeout: 15_000 },
    );
    if (changed && snapshot) await this.publish(snapshot);
    return result;
  }

  async lock(tx: Tx, matchId: string): Promise<DuelMatch> {
    await tx.$queryRaw`SELECT 1 FROM duel_matches WHERE id = ${matchId}::uuid FOR UPDATE`;
    const m = await tx.duelMatch.findUnique({ where: { id: matchId } });
    if (!m) throw new NotFoundException('Maç bulunamadı.');
    return m;
  }

  async publish(snapshot: DuelSnapshot, extra: DuelBroadcast[] = []): Promise<void> {
    await this.realtime.send([
      { topic: duelTopic(snapshot.matchId), event: 'state', payload: { ...snapshot } },
      ...extra,
    ]);
  }

  /** Kullanıcının kişisel kanalına haber (eşleşme bulundu, davet geldi). */
  async notifyUsers(userIds: string[], event: string, payload: Record<string, unknown>) {
    await this.realtime.send(userIds.map((id) => ({ topic: duelUserTopic(id), event, payload })));
  }

  // ── Zaman: tembel ilerleme ───────────────────────────────────────────────

  /** Maçı `now` anına taşır. Kilit ÇAĞIRANDA olmalıdır. */
  async sync(tx: Tx, match: DuelMatch, now: Date): Promise<DuelMatch> {
    if (!YASAYAN.includes(match.phase)) return match;
    const herkesCevapladi = match.phase === 'question' ? await this.allAnswered(tx, match) : false;
    const { state, events } = advance(
      engineState(match),
      engineRules(match),
      now.getTime(),
      herkesCevapladi,
    );
    if (events.length === 0) return match;

    for (const e of events) {
      if (e.type === 'question_closed') await this.applyClose(tx, match.id, e.index);
    }
    const bitti = events.find((e) => e.type === 'finished');
    let guncel = await tx.duelMatch.update({
      where: { id: match.id },
      data: {
        phase: state.phase,
        currentIndex: state.index,
        phaseStartedAt: state.phaseStartedAt == null ? null : new Date(state.phaseStartedAt),
        phaseEndsAt: state.phaseEndsAt == null ? null : new Date(state.phaseEndsAt),
        seq: { increment: 1 },
      },
    });
    if (bitti) guncel = await this.finalize(tx, guncel, new Date(bitti.at));
    return guncel;
  }

  private async allAnswered(tx: Tx, match: DuelMatch): Promise<boolean> {
    const oyuncular = await tx.duelParticipant.findMany({
      where: { matchId: match.id, leftAt: null, kickedAt: null },
      select: { userId: true },
    });
    if (oyuncular.length === 0) return false;
    const cevap = await tx.duelAnswer.count({
      where: {
        matchId: match.id,
        index: match.currentIndex,
        userId: { in: oyuncular.map((o) => o.userId) },
      },
    });
    return cevap >= oyuncular.length;
  }

  /** Kapanan sorunun puanlarını katılımcılara işler (açık sorunun puanı görünmez). */
  private async applyClose(tx: Tx, matchId: string, index: number): Promise<void> {
    const cevaplar = await tx.duelAnswer.findMany({ where: { matchId, index } });
    for (const c of cevaplar) {
      await tx.duelParticipant.update({
        where: { matchId_userId: { matchId, userId: c.userId } },
        data: {
          score: { increment: c.points },
          correctCount: { increment: c.isCorrect ? 1 : 0 },
          wrongCount: { increment: c.isCorrect ? 0 : 1 },
          correctMs: { increment: c.isCorrect ? c.elapsedMs : 0 },
          answerMs: { increment: c.elapsedMs },
        },
      });
    }
  }

  // ── Bitiş ve ödül (idempotent) ───────────────────────────────────────────

  /**
   * Sıralama, XP, lig puanı ve istatistik TEK transaction'da ve yalnız bir kez işlenir.
   * İki kapı: maç kilidi altındaki `rewardedAt` ve `xp_events` tekil anahtarı.
   */
  async finalize(tx: Tx, match: DuelMatch, at: Date): Promise<DuelMatch> {
    if (match.rewardedAt) return match;
    const hepsi = await tx.duelParticipant.findMany({ where: { matchId: match.id } });
    const oyuncular = hepsi.filter((p) => p.kickedAt == null);
    const sirali = rankStandings(
      oyuncular.map((p) => ({
        userId: p.userId,
        score: p.score,
        correctCount: p.correctCount,
        correctMs: p.correctMs,
        forfeited: p.leftAt != null,
      })),
    );

    await tx.duelStats.createMany({
      data: oyuncular.map((p) => ({ userId: p.userId })),
      skipDuplicates: true,
    });
    const istatistik = new Map(
      (
        await tx.duelStats.findMany({ where: { userId: { in: oyuncular.map((p) => p.userId) } } })
      ).map((s) => [s.userId, s]),
    );
    const cevapSayisi = new Map(
      (
        await tx.duelAnswer.groupBy({
          by: ['userId'],
          where: { matchId: match.id },
          _count: { _all: true },
        })
      ).map((r) => [r.userId, r._count._all]),
    );
    const satir = new Map(oyuncular.map((p) => [p.userId, p]));
    const kaynak = match.kind === 'duel' ? 'duel' : 'room';

    for (const me of sirali) {
      const st = istatistik.get(me.userId)!;
      const digerleri = sirali.filter((o) => o.userId !== me.userId);
      let outcome: Outcome;
      let xp: number;
      let delta: number;
      if (match.kind === 'duel') {
        const rakip = digerleri[0];
        outcome = rakip ? duelOutcome(me, rakip) : 'win';
        xp = duelXp(outcome);
        delta = rakip ? eloDelta(st.rating, istatistik.get(rakip.userId)!.rating, outcome) : 0;
      } else {
        outcome = me.placement === 1 ? 'win' : 'loss';
        xp = roomXp(me.placement);
        delta = roomRatingDelta(
          { rating: st.roomRating, placement: me.placement },
          digerleri.map((o) => ({
            rating: istatistik.get(o.userId)!.roomRating,
            placement: o.placement,
          })),
        );
      }

      const yazilan = await tx.xpEvent.createMany({
        data: [{ userId: me.userId, source: kaynak, sourceId: match.id, amount: xp }],
        skipDuplicates: true,
      });
      await tx.duelParticipant.update({
        where: { matchId_userId: { matchId: match.id, userId: me.userId } },
        data: {
          placement: me.placement,
          outcome,
          xpAwarded: xp,
          ratingDelta: delta,
          active: false,
        },
      });
      if (yazilan.count === 0) continue; // bu maçın ödülü daha önce yazılmış: istatistik de işlenmiş

      const p = satir.get(me.userId)!;
      const seri = nextStreak(st.currentStreak, outcome);
      await tx.duelStats.update({
        where: { userId: me.userId },
        data: {
          correctTotal: { increment: p.correctCount },
          answersTotal: { increment: cevapSayisi.get(me.userId) ?? 0 },
          answerMsTotal: { increment: p.answerMs },
          xpEarned: { increment: xp },
          ...(match.kind === 'duel'
            ? {
                duels: { increment: 1 },
                wins: { increment: outcome === 'win' ? 1 : 0 },
                losses: { increment: outcome === 'loss' ? 1 : 0 },
                draws: { increment: outcome === 'draw' ? 1 : 0 },
                currentStreak: seri,
                bestStreak: Math.max(st.bestStreak, seri),
                rating: { increment: delta },
              }
            : {
                rooms: { increment: 1 },
                roomWins: { increment: outcome === 'win' ? 1 : 0 },
                roomRating: { increment: delta },
              }),
        },
      });
    }

    // atılmış satırlar da serbest kalsın (tek aktif maç indeksi)
    await tx.duelParticipant.updateMany({
      where: { matchId: match.id, active: true },
      data: { active: false },
    });
    return tx.duelMatch.update({
      where: { id: match.id },
      data: {
        phase: 'finished',
        phaseEndsAt: null,
        finishedAt: at,
        rewardedAt: at,
        code: null,
        seq: { increment: 1 },
      },
    });
  }

  /** Ödülsüz kapanış (başlamamış lobi, kimse kalmadı). */
  async cancel(tx: Tx, match: DuelMatch, at: Date): Promise<DuelMatch> {
    await tx.duelParticipant.updateMany({
      where: { matchId: match.id, active: true },
      data: { active: false },
    });
    return tx.duelMatch.update({
      where: { id: match.id },
      data: {
        phase: 'cancelled',
        phaseEndsAt: null,
        finishedAt: at,
        code: null,
        seq: { increment: 1 },
      },
    });
  }

  // ── Kurulum, katılım, ayrılış ────────────────────────────────────────────

  /** Maçı ve SABİT soru setini kurar. `startNow`: doğrudan geri sayıma girer. */
  async create(
    tx: Tx,
    opts: {
      kind: DuelKind;
      moduleId: string;
      scope: DuelScope;
      questions: PickedQuestion[];
      secondsPerQuestion: number;
      maxPlayers: number;
      playerIds: string[];
      hostId?: string | null;
      name?: string | null;
      isPublic?: boolean;
      code?: string | null;
      codeExpiresAt?: Date | null;
      startNow: boolean;
    },
    now: Date,
  ): Promise<DuelMatch> {
    const match = await tx.duelMatch.create({
      data: {
        kind: opts.kind,
        moduleId: opts.moduleId,
        hostId: opts.hostId ?? null,
        name: opts.name ?? null,
        isPublic: opts.isPublic ?? false,
        code: opts.code ?? null,
        codeExpiresAt: opts.codeExpiresAt ?? null,
        scopeKind: opts.scope.kind,
        scopeId: opts.scope.id,
        questionCount: opts.questions.length,
        secondsPerQuestion: opts.secondsPerQuestion,
        maxPlayers: opts.maxPlayers,
        ...(opts.startNow ? this.countdownData(now) : {}),
      },
    });
    await tx.duelMatchQuestion.createMany({
      data: opts.questions.map((q, index) => ({ matchId: match.id, index, ...q })),
    });
    // Aktif maçı olan biri varsa kısmi tekil indeks reddeder → tüm kurulum geri alınır.
    await tx.duelParticipant.createMany({
      data: opts.playerIds.map((userId, i) => ({
        matchId: match.id,
        userId,
        isReady: opts.startNow || userId === opts.hostId,
        // Birlikte kurulanlarda sıra `playerIds` sırasıdır (başkan devri buna bakar).
        joinedAt: new Date(now.getTime() + i),
      })),
    });
    await tx.duelQueue.deleteMany({ where: { userId: { in: opts.playerIds } } });
    return match;
  }

  countdownData(now: Date) {
    return {
      phase: 'countdown' as const,
      phaseStartedAt: now,
      phaseEndsAt: new Date(now.getTime() + DUEL_RULES.countdownMs),
      startedAt: now,
    };
  }

  /** Lobiye ATOMİK katılım: kapasite kontrolü maç kilidi altında yapılır. */
  async join(matchId: string, userId: string, userModuleId: string): Promise<DuelStateForUser> {
    await this.withMatch(matchId, async (tx, match, now) => {
      if (match.phase !== 'lobby') throw new ConflictException('Bu maç başlamış ya da kapanmış.');
      if (match.moduleId !== userModuleId) {
        throw new ForbiddenException('Bu maç başka bir sınavın adayları için açılmış.');
      }
      const hepsi = await tx.duelParticipant.findMany({ where: { matchId } });
      const ben = hepsi.find((p) => p.userId === userId);
      if (ben?.kickedAt) throw new ForbiddenException('Bu salondan çıkarıldın.');
      if (ben && iceride(ben)) return { match, result: null };
      const icerdekiler = hepsi.filter(iceride);
      if (icerdekiler.length >= match.maxPlayers) throw new ConflictException('Salon dolu.');
      if (match.hostId && (await this.blocked(tx, userId, match.hostId))) {
        throw new ForbiddenException('Bu maça katılamazsın.');
      }

      if (ben) {
        await tx.duelParticipant.update({
          where: { matchId_userId: { matchId, userId } },
          data: { leftAt: null, active: true, isReady: false, joinedAt: now },
        });
      } else {
        await tx.duelParticipant.create({ data: { matchId, userId } });
      }
      await tx.duelQueue.deleteMany({ where: { userId } });

      const dolu = match.kind === 'duel' && icerdekiler.length + 1 >= DUEL_RULES.duel.players;
      const guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: {
          seq: { increment: 1 },
          ...(dolu ? { ...this.countdownData(now), code: null } : {}),
        },
      });
      return { match: guncel, result: null };
    });
    return this.state(matchId, userId);
  }

  /**
   * Ayrılış. Lobide: yer boşalır, başkan ayrıldıysa devredilir, kimse kalmazsa kapanır.
   * Oyun sırasında: oyuncu sıralamada kalanların arkasına düşer (ödülü mağlubiyet);
   * 1'e 1'de maç hemen biter, salonda tek kişi kalırsa biter.
   */
  async leave(matchId: string, userId: string): Promise<void> {
    await this.withMatch(matchId, async (tx, match, now) => {
      const hepsi = await tx.duelParticipant.findMany({ where: { matchId } });
      const ben = hepsi.find((p) => p.userId === userId);
      if (!ben || !iceride(ben) || match.phase === 'finished' || match.phase === 'cancelled') {
        return { match, result: null };
      }
      await tx.duelParticipant.update({
        where: { matchId_userId: { matchId, userId } },
        data: { leftAt: now, active: false, isReady: false },
      });
      const kalanlar = hepsi.filter((p) => iceride(p) && p.userId !== userId);

      if (match.phase === 'lobby') {
        if (kalanlar.length === 0 || (match.kind === 'duel' && match.hostId === userId)) {
          return { match: await this.cancel(tx, match, now), result: null };
        }
        const yeniBaskan =
          match.hostId === userId
            ? nextHost(
                hepsi.map((p) => ({
                  userId: p.userId,
                  joinedAt: p.joinedAt.getTime(),
                  gone: !iceride(p),
                })),
                userId,
              )
            : match.hostId;
        if (yeniBaskan && yeniBaskan !== match.hostId) {
          await tx.duelParticipant.update({
            where: { matchId_userId: { matchId, userId: yeniBaskan } },
            data: { isReady: true },
          });
        }
        const guncel = await tx.duelMatch.update({
          where: { id: matchId },
          data: { hostId: yeniBaskan, seq: { increment: 1 } },
        });
        return { match: guncel, result: null };
      }

      // oyun sürüyor
      if (kalanlar.length < 2) {
        if (match.phase === 'question') await this.applyClose(tx, matchId, match.currentIndex);
        return { match: await this.finalize(tx, match, now), result: null };
      }
      let guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: {
          seq: { increment: 1 },
          ...(match.hostId === userId
            ? {
                hostId: nextHost(
                  hepsi.map((p) => ({
                    userId: p.userId,
                    joinedAt: p.joinedAt.getTime(),
                    gone: !iceride(p),
                  })),
                  userId,
                ),
              }
            : {}),
        },
      });
      guncel = await this.sync(tx, guncel, now); // ayrılan son bekleneni ise soru kapanır
      return { match: guncel, result: null };
    });
  }

  // ── Salon: hazır, başlat, çıkar ──────────────────────────────────────────

  /**
   * Hazır / hazır değil. Hızlı salonda (adsız, başkan rastgele ilk giren) en az üç kişi
   * içerideyken HERKES hazır olunca geri sayım kendiliğinden başlar; kurulan salonda başkan başlatır.
   */
  async setReady(matchId: string, userId: string, ready: boolean): Promise<void> {
    await this.withMatch(matchId, async (tx, match, now) => {
      if (match.phase !== 'lobby') throw new ConflictException('Oyun başlamış.');
      const hepsi = await tx.duelParticipant.findMany({ where: { matchId } });
      const ben = hepsi.find((p) => p.userId === userId);
      if (!ben || !iceride(ben)) throw new ForbiddenException('Bu salonda değilsin.');
      await tx.duelParticipant.update({
        where: { matchId_userId: { matchId, userId } },
        data: { isReady: ready },
      });
      const icerdekiler = hepsi.filter(iceride);
      const hepsiHazir = icerdekiler.every((p) => (p.userId === userId ? ready : p.isReady));
      const otomatik =
        match.kind === 'room' &&
        match.name == null &&
        icerdekiler.length >= DUEL_RULES.room.minPlayers &&
        hepsiHazir;
      const guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: {
          seq: { increment: 1 },
          ...(otomatik ? { ...this.countdownData(now), code: null } : {}),
        },
      });
      return { match: guncel, result: null };
    });
  }

  /** Başkan oyunu başlatır: en az üç kişi ve başkan dışında herkes hazır olmalı. */
  async start(matchId: string, userId: string): Promise<void> {
    await this.withMatch(matchId, async (tx, match, now) => {
      if (match.hostId !== userId)
        throw new ForbiddenException('Oyunu yalnız salon başkanı başlatır.');
      if (match.phase !== 'lobby') throw new ConflictException('Oyun zaten başlamış.');
      const icerdekiler = (await tx.duelParticipant.findMany({ where: { matchId } })).filter(
        iceride,
      );
      const engel = roomStartBlocker(
        icerdekiler.map((p) => ({ isReady: p.isReady, isHost: p.userId === match.hostId })),
      );
      if (engel) throw new ConflictException(engel);
      const guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: { ...this.countdownData(now), code: null, seq: { increment: 1 } },
      });
      return { match: guncel, result: null };
    });
  }

  /** Başkan, başlamamış salondan oyuncu çıkarır; çıkarılan aynı salona dönemez. */
  async kick(matchId: string, hostId: string, targetId: string): Promise<void> {
    await this.withMatch(matchId, async (tx, match, now) => {
      if (match.hostId !== hostId)
        throw new ForbiddenException('Yalnız salon başkanı oyuncu çıkarabilir.');
      if (match.phase !== 'lobby')
        throw new ConflictException('Oyun başladıktan sonra oyuncu çıkarılamaz.');
      if (targetId === hostId)
        throw new BadRequestException('Kendini çıkaramazsın; salondan ayrıl.');
      const hedef = await tx.duelParticipant.findUnique({
        where: { matchId_userId: { matchId, userId: targetId } },
      });
      if (!hedef || !iceride(hedef)) throw new NotFoundException('Oyuncu salonda değil.');
      await tx.duelParticipant.update({
        where: { matchId_userId: { matchId, userId: targetId } },
        data: { kickedAt: now, active: false, isReady: false },
      });
      const guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: { seq: { increment: 1 } },
      });
      return { match: guncel, result: null };
    });
    await this.notifyUsers([targetId], 'kicked', { matchId });
  }

  /** Başkan, başlamamış salonun ayarını değiştirir; soru seti yeniden sabitlenir, hazırlar sıfırlanır. */
  async reconfigure(
    matchId: string,
    hostId: string,
    data: {
      name?: string;
      isPublic?: boolean;
      scope: DuelScope;
      secondsPerQuestion: number;
      maxPlayers: number;
      questions: PickedQuestion[];
    },
  ): Promise<void> {
    await this.withMatch(matchId, async (tx, match) => {
      if (match.hostId !== hostId)
        throw new ForbiddenException('Ayarları yalnız salon başkanı değiştirir.');
      if (match.phase !== 'lobby')
        throw new ConflictException('Oyun başladıktan sonra ayar değişmez.');
      const icerde = await tx.duelParticipant.count({
        where: { matchId, leftAt: null, kickedAt: null },
      });
      if (data.maxPlayers < icerde) {
        throw new ConflictException(`Salonda ${icerde} kişi var; sınır bunun altına inemez.`);
      }
      await tx.duelMatchQuestion.deleteMany({ where: { matchId } });
      await tx.duelMatchQuestion.createMany({
        data: data.questions.map((q, index) => ({ matchId, index, ...q })),
      });
      await tx.duelParticipant.updateMany({
        where: { matchId, userId: { not: hostId } },
        data: { isReady: false },
      });
      const guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: {
          name: data.name ?? match.name,
          isPublic: data.isPublic ?? match.isPublic,
          scopeKind: data.scope.kind,
          scopeId: data.scope.id,
          questionCount: data.questions.length,
          secondsPerQuestion: data.secondsPerQuestion,
          maxPlayers: data.maxPlayers,
          seq: { increment: 1 },
        },
      });
      return { match: guncel, result: null };
    });
  }

  // ── Maç sonu inceleme ────────────────────────────────────────────────────

  /**
   * "Yanlışlarım": biten maçta yanlış ya da boş bıraktığım sorular. Açıklama ve madde bağı
   * soru bankasındaki kayıttır (yeni içerik üretilmez). Maç bitmeden anahtar verilmez.
   */
  async review(matchId: string, userId: string) {
    const match = await this.prisma.duelMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Maç bulunamadı.');
    const ben = await this.prisma.duelParticipant.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (!ben || ben.kickedAt) throw new ForbiddenException('Bu maçı göremezsin.');
    if (match.phase !== 'finished') throw new ConflictException('İnceleme maç bitince açılır.');

    const [sorular, cevaplar] = await Promise.all([
      this.prisma.duelMatchQuestion.findMany({
        where: { matchId },
        orderBy: { index: 'asc' },
        select: {
          index: true,
          correctOptionId: true,
          version: { select: { ...SORU_OZETI_SELECT, explanation: true } },
        },
      }),
      this.prisma.duelAnswer.findMany({ where: { matchId, userId } }),
    ]);
    const cevap = new Map(cevaplar.map((c) => [c.index, c]));
    const items = sorular
      .filter((q) => !cevap.get(q.index)?.isCorrect)
      .map((q) => {
        const c = cevap.get(q.index);
        const ozet = soruOzeti(q.version, 'review');
        return {
          index: q.index,
          stem: ozet.stem,
          mediaUrl: ozet.mediaUrl,
          options: ozet.options,
          correctOptionId: q.correctOptionId,
          myOptionId: c?.optionId ?? null,
          myElapsedMs: c?.elapsedMs ?? null,
          explanation: q.version.explanation,
          relatedArticleRef: ozet.relatedArticleRef,
        };
      });
    return { matchId, questionCount: match.questionCount, wrongCount: items.length, items };
  }

  // ── Cevap ────────────────────────────────────────────────────────────────

  /**
   * Cevap kabulü. Doğruluk ve puan SUNUCUDA hesaplanır; istemciye yalnız "alındı" döner —
   * doğru şık soru kapanana kadar hiçbir yanıtta yer almaz.
   */
  async answer(
    matchId: string,
    userId: string,
    index: number,
    optionId: string,
  ): Promise<DuelStateForUser> {
    await this.withMatch(matchId, async (tx, match, now) => {
      const ben = await tx.duelParticipant.findUnique({
        where: { matchId_userId: { matchId, userId } },
      });
      if (!ben || !iceride(ben)) throw new ForbiddenException('Bu maçın oyuncusu değilsin.');

      const pencere = answerWindow(engineState(match), engineRules(match), index, now.getTime());
      if (!pencere.ok) {
        throw new ConflictException(
          pencere.reason === 'late'
            ? 'Süre doldu, cevap alınmadı.'
            : 'Bu soru şu an cevaba açık değil.',
        );
      }
      // Maç kilidi altındayız: bu kontrol ile ekleme arasına başka cevap giremez.
      const onceki = await tx.duelAnswer.findUnique({
        where: { matchId_index_userId: { matchId, index, userId } },
      });
      if (onceki) throw new ConflictException('Bu soruyu zaten cevapladın.');

      const soru = await tx.duelMatchQuestion.findUnique({
        where: { matchId_index: { matchId, index } },
        select: {
          correctOptionId: true,
          version: { select: { options: { select: { id: true } } } },
        },
      });
      if (!soru) throw new NotFoundException('Soru bulunamadı.');
      if (!soru.version.options.some((o) => o.id === optionId)) {
        throw new BadRequestException('Geçersiz şık.');
      }

      const isCorrect = soru.correctOptionId === optionId;
      await tx.duelAnswer.create({
        data: {
          matchId,
          index,
          userId,
          optionId,
          isCorrect,
          elapsedMs: pencere.elapsedMs,
          points: scoreAnswer(isCorrect, pencere.elapsedMs, match.secondsPerQuestion * 1000),
          answeredAt: now,
        },
      });
      let guncel = await tx.duelMatch.update({
        where: { id: matchId },
        data: { seq: { increment: 1 } },
      });
      guncel = await this.sync(tx, guncel, now); // herkes cevapladıysa soru şimdi kapanır
      return { match: guncel, result: null };
    });
    return this.state(matchId, userId);
  }

  // ── Okuma ────────────────────────────────────────────────────────────────

  /** Oyuncunun gördüğü durum; okurken de maç sunucu saatine taşınır. */
  async state(matchId: string, userId: string): Promise<DuelStateForUser> {
    return this.withMatch(matchId, async (tx, match, now) => {
      const ben = await tx.duelParticipant.findUnique({
        where: { matchId_userId: { matchId, userId } },
      });
      if (!ben || ben.kickedAt) throw new ForbiddenException('Bu maçı göremezsin.');
      const snap = await this.snapshot(tx, match, now);
      const benim =
        match.phase === 'question'
          ? await tx.duelAnswer.findUnique({
              where: { matchId_index_userId: { matchId, index: match.currentIndex, userId } },
              select: { optionId: true },
            })
          : null;
      return { match, result: { ...snap, myOptionId: benim?.optionId ?? null } };
    });
  }

  /** Herkese aynı giden anlık görüntü: cevap anahtarı ve seçilen şıklar soru kapanınca eklenir. */
  async snapshot(tx: Tx, match: DuelMatch, now: Date): Promise<DuelSnapshot> {
    const katilimcilar = await tx.duelParticipant.findMany({
      where: { matchId: match.id, kickedAt: null },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { displayName: true, avatarUrl: true } } },
    });
    const soruFazi = match.phase === 'question' || match.phase === 'reveal';
    const cevaplar = soruFazi
      ? await tx.duelAnswer.findMany({ where: { matchId: match.id, index: match.currentIndex } })
      : [];
    const cevap = new Map(cevaplar.map((c) => [c.userId, c]));

    const soruSatiri = soruFazi
      ? await tx.duelMatchQuestion.findUnique({
          where: { matchId_index: { matchId: match.id, index: match.currentIndex } },
          select: {
            correctOptionId: true,
            version: {
              select: {
                stem: true,
                mediaUrl: true,
                options: {
                  select: { id: true, label: true, text: true }, // is_correct SEÇİLMEZ
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        })
      : null;

    const bitti = match.phase === 'finished';
    const lobi = match.phase === 'lobby';
    const kodGecerli = lobi && match.code && (!match.codeExpiresAt || match.codeExpiresAt > now);

    return {
      matchId: match.id,
      kind: match.kind,
      phase: match.phase,
      seq: match.seq,
      serverNow: now.toISOString(),
      phaseStartedAt: match.phaseStartedAt?.toISOString() ?? null,
      phaseEndsAt: match.phaseEndsAt?.toISOString() ?? null,
      index: match.currentIndex,
      questionCount: match.questionCount,
      secondsPerQuestion: match.secondsPerQuestion,
      maxPlayers: match.maxPlayers,
      name: match.name,
      isPublic: match.isPublic,
      code: kodGecerli ? match.code : null,
      codeExpiresAt: kodGecerli ? (match.codeExpiresAt?.toISOString() ?? null) : null,
      scope: { kind: match.scopeKind as DuelScope['kind'], id: match.scopeId },
      players: katilimcilar.map((p) => {
        const cevaplanan = p.correctCount + p.wrongCount;
        return {
          userId: p.userId,
          name: publicName(p.user.displayName),
          avatarUrl: p.user.avatarUrl,
          isHost: match.hostId === p.userId,
          isReady: p.isReady,
          left: p.leftAt != null,
          score: p.score,
          correctCount: p.correctCount,
          answered: match.phase === 'question' ? cevap.has(p.userId) : false,
          placement: p.placement,
          outcome: p.outcome,
          xp: p.xpAwarded,
          ratingDelta: p.ratingDelta,
          wrongCount: p.wrongCount,
          blankCount: bitti ? Math.max(0, match.questionCount - cevaplanan) : 0,
          avgAnswerMs: cevaplanan > 0 ? Math.round(p.answerMs / cevaplanan) : null,
        };
      }),
      question: soruSatiri
        ? {
            index: match.currentIndex,
            stem: soruSatiri.version.stem,
            mediaUrl: soruSatiri.version.mediaUrl,
            options: soruSatiri.version.options,
          }
        : null,
      reveal:
        match.phase === 'reveal' && soruSatiri
          ? {
              correctOptionId: soruSatiri.correctOptionId,
              results: katilimcilar.map((p) => {
                const c = cevap.get(p.userId);
                return {
                  userId: p.userId,
                  optionId: c?.optionId ?? null,
                  isCorrect: c?.isCorrect ?? false,
                  points: c?.points ?? 0,
                };
              }),
            }
          : null,
    };
  }

  /** İki kullanıcıdan biri diğerini engellemiş mi? */
  async blocked(tx: Tx | PrismaService, a: string, b: string): Promise<boolean> {
    const n = await tx.userBlock.count({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return n > 0;
  }
}
