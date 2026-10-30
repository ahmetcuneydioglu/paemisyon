import type { UnitRecipe } from '../summaries/unite-recete';
import type { DailyFocusView, Readiness, TodayTask, TodayTaskAction } from './home-v2.types';
import type { ForYouItem, HomeV3, NextStep, RouteItem } from './home-v3.types';
import { TAZE_TUR_MS, type YarimTur } from './today-task.logic';

/**
 * Bugün v3 (Doc 49/16): tek adım + rota + senin için. Saf fonksiyon; veri bağlamı
 * `CoachService.buildContext` toplar. İlke: ekranda tek birincil eylem; rota 2–6 madde,
 * sayıyı gün yoğunluğu belirler; "Senin için" en çok 3 satır, her biri tek dokunuş.
 */
export interface BugunV3Input {
  now: Date;
  goal: number;
  answeredToday: number;
  dailyQuizPlayed: boolean;
  activeSession: YarimTur | null;
  /** Doc 48 görev kartı — deneme/dönüş/ilk kullanım durumları buradan devralınır. */
  todayTask: TodayTask;
  weakestUnit: UnitRecipe | null;
  readiness: Readiness;
  /** Bugün konu başına cevaplanan soru; rota "N soru" adımı bununla tamamlanır. */
  todayTopicAnswered: Record<string, number>;
  /** Bugün tamamlanmış yanlış turu var mı. */
  reviewDoneToday: boolean;
  /** Okunmamış ilk yayındaki özet ünitesi; reçete özet vermiyorsa rotaya bu girer. */
  nextSummary: { slug: string; title: string; topicId: string; readingMinutes: number } | null;
  /** Favori soru sayısı. */
  bookmarkCount: number;
  exams: {
    live: { id: string; title: string; attempted?: boolean } | null;
    todayUpcoming: { id: string; title: string; startAt: Date; questionCount: number } | null;
    /** Bugünden sonra, 7 gün içinde başlayacak ilk deneme. */
    nextUpcoming: { id: string; title: string; startAt: Date; questionCount: number } | null;
  };
  plan: {
    items: {
      id: string;
      kind: 'topic' | 'review' | 'mock';
      topicId: string | null;
      topicName: string | null;
      remainingMinutes: number;
      status: 'done' | 'active' | 'pending' | string;
    }[];
  } | null;
}

export const ROTA_EN_AZ = 2;
export const ROTA_EN_COK = 6;
/** Senin için: yanlışlar, favoriler, ikinci zayıf konu, deneme (kullanıcı kararı 30 Eki: 4). */
export const FOR_YOU_EN_COK = 4;
const OZET_DK = 4;
const SORU_SN = 20;

const dk = (count: number) => Math.max(1, Math.round((count * SORU_SN) / 60));

const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function gunSaat(d: Date, now: Date): string {
  const tr = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const nowTr = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const saat = d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
  const ayniGun = tr.toDateString() === nowTr.toDateString();
  return ayniGun ? `bugün ${saat}` : `${GUNLER[tr.getDay()]} ${saat}`;
}

function topicFocus(topicId: string, label: string): DailyFocusView {
  return { kind: 'topic', courseId: null, topicId, label };
}

function soruBaslat(
  count: number,
  focus: DailyFocusView | null,
  source: TodayTaskAction['source'],
  articleNos?: string[],
): TodayTaskAction {
  return {
    type: 'start_session',
    label: `Başla · ${count} soru${focus?.label ? ` · ${focus.label}` : ''}`,
    count,
    recipe: 'coach',
    ...(focus ? { focus } : {}),
    ...(articleNos && articleNos.length > 0 ? { articleNos } : {}),
    source,
  };
}

/** Ünite başlığı "Yürütme — Anayasa" biçimindeyse ilk parça. */
const kisaUnite = (title: string) => title.split(' — ')[0]!.trim();

function sıradaki(input: BugunV3Input): NextStep {
  const t = input.todayTask;
  // 1) Deneme ve dönüş/ilk kullanım durumları: Doc 48 kartı zaten doğru kararı veriyor.
  if (t.kind === 'exam') {
    return {
      kind: 'exam',
      eyebrow: 'DENEME',
      title: t.title,
      reason: t.reason,
      badge: null,
      estimateMin: null,
      action: { ...t.action, source: 'home_next' },
    };
  }
  // 2) Taze yarım tur: devam et.
  const tur = input.activeSession;
  if (
    tur &&
    tur.answered > 0 &&
    input.now.getTime() - tur.lastActivityAt.getTime() < TAZE_TUR_MS &&
    t.kind === 'resume'
  ) {
    const kalan = Math.max(0, tur.total - tur.answered);
    return {
      kind: 'resume',
      eyebrow: `SIRADAKİ · ${tur.scopeName}`,
      title: `${tur.scopeName} turuna devam et`,
      reason: `${tur.answered}/${tur.total} · ${zamanOnce(tur.lastActivityAt, input.now)}`,
      badge: null,
      estimateMin: kalan > 0 ? dk(kalan) : null,
      action: { ...t.action, source: 'home_next' },
    };
  }
  if (t.kind === 'comeback' || t.kind === 'first') {
    return {
      kind: 'questions',
      eyebrow: t.kind === 'first' ? 'İLK TUR' : 'GERİ DÖNÜŞ',
      title: t.title,
      reason: t.reason,
      badge: null,
      estimateMin: t.action.count ? dk(t.action.count) : null,
      action: { ...t.action, source: 'home_next' },
    };
  }
  // 3) Zayıf konunun ünite reçetesi: özet → sorular, ya da yalnız sorular.
  const u = input.weakestUnit;
  const zayif = input.readiness.weakest[0] ?? null;
  if (u && zayif) {
    const unite = kisaUnite(u.unit.title);
    const eyebrow = `SIRADAKİ · ${zayif.courseName} · ${unite}`;
    const badge = u.unit.accuracyPct != null ? `%${u.unit.accuracyPct} · en zayıf` : 'en zayıf';
    if (u.kind === 'summary_then_questions') {
      return {
        kind: 'summary_then_questions',
        eyebrow,
        title: `${OZET_DK} dk özet, sonra ${u.session.count} soru`,
        reason:
          u.unit.solved > 0
            ? `Bu ünitede ${u.unit.solved} soruda %${u.unit.accuracyPct ?? 0}; önce özeti oku, sonra soruları çöz.`
            : 'Henüz ölçülmedi; önce özeti oku, sonra sorularla pekiştir.',
        badge,
        estimateMin: OZET_DK + dk(u.session.count),
        action: {
          type: 'open_summary',
          label: 'Başla',
          route: `/ozet/${u.unit.slug}`,
          source: 'home_next',
        },
      };
    }
    return {
      kind: 'questions',
      eyebrow,
      title: `${u.session.count} soru · ${unite}`,
      reason: 'Özetini okudun; şimdi maddeleriyle pekiştir.',
      badge,
      estimateMin: dk(u.session.count),
      action: soruBaslat(
        u.session.count,
        topicFocus(u.session.topicId, zayif.name),
        'home_next',
        u.session.articleNos,
      ),
    };
  }
  // 4) Hedef dolduysa: yanlış tekrarı ya da dinlen.
  if (t.kind === 'done') {
    const n = input.readiness.unresolvedWrongCount;
    if (n > 0) {
      const count = Math.min(n, 20);
      return {
        kind: 'review',
        eyebrow: 'SIRADAKİ · YANLIŞ TEKRARI',
        title: `${count} yanlışını temizle`,
        reason: 'Günlük hedefin tamam; yanlışlar doğru çözülünce kuyruktan düşer.',
        badge: null,
        estimateMin: dk(count),
        action: soruBaslat(
          count,
          { kind: 'wrongs', courseId: null, topicId: null, label: 'Yanlışlar' },
          'home_next',
        ),
      };
    }
    return {
      kind: 'done',
      eyebrow: 'BUGÜN',
      title: t.title,
      reason: t.reason,
      badge: null,
      estimateMin: null,
      action: { ...t.action, source: 'home_next' },
    };
  }
  // 5) Genel: Doc 48 kartının önerisi (zayıf konu / koç turu).
  return {
    kind: 'questions',
    eyebrow: zayif ? `SIRADAKİ · ${zayif.courseName} · ${zayif.name}` : 'SIRADAKİ · KOÇ TURU',
    title: t.title,
    reason: t.reason,
    badge: zayif ? `%${Math.round(zayif.accuracy * 100)} · en zayıf` : null,
    estimateMin: t.action.count ? dk(t.action.count) : null,
    action: { ...t.action, source: 'home_next' },
  };
}

function zamanOnce(d: Date, now: Date): string {
  const dak = Math.max(1, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (dak < 60) return `${dak} dk önce`;
  const sa = Math.round(dak / 60);
  return sa < 24 ? `${sa} sa önce` : 'dün';
}

function rota(input: BugunV3Input, next: NextStep): RouteItem[] {
  const items: RouteItem[] = [];
  const ex = input.exams.live ?? input.exams.todayUpcoming;
  if (ex) {
    const up = input.exams.todayUpcoming;
    items.push({
      key: `exam:${ex.id}`,
      kind: 'exam',
      label: ex.title,
      detail: up ? gunSaat(up.startAt, input.now) : 'şimdi',
      estimateMin: null,
      done: Boolean(input.exams.live?.attempted),
      action: {
        type: 'open_exams',
        label: 'Aç',
        route: `/denemeler/${ex.id}`,
        source: 'home_route',
      },
    });
  }
  const u = input.weakestUnit;
  const zayif = input.readiness.weakest[0] ?? null;
  if (u && zayif) {
    const unite = kisaUnite(u.unit.title);
    // Özet adımı her zaman listelenir: reçete `questions` ise özet okunmuştur (tamamlandı).
    items.push({
      key: `summary:${u.unit.slug}`,
      kind: 'summary',
      label: `${unite} özeti`,
      detail: null,
      estimateMin: OZET_DK,
      done: u.kind === 'questions',
      action: {
        type: 'open_summary',
        label: 'Oku',
        route: `/ozet/${u.unit.slug}`,
        source: 'home_route',
      },
    });
    const cevaplanan = input.todayTopicAnswered[u.session.topicId] ?? 0;
    items.push({
      key: `questions:${u.unit.slug}`,
      kind: 'questions',
      label: `${u.session.count} soru · ${zayif.name}`,
      detail:
        cevaplanan > 0 && cevaplanan < u.session.count ? `${cevaplanan}/${u.session.count}` : null,
      estimateMin: dk(u.session.count),
      done: cevaplanan >= u.session.count,
      action: soruBaslat(
        u.session.count,
        topicFocus(u.session.topicId, zayif.name),
        'home_route',
        u.session.articleNos,
      ),
    });
  } else if (next.kind === 'questions' || next.kind === 'resume') {
    items.push({
      key: 'questions:next',
      kind: 'questions',
      label: next.action.count ? `${next.action.count} soru` : 'Soru turu',
      detail: zayif?.courseName ?? null,
      estimateMin: next.action.count ? dk(next.action.count) : null,
      done: input.answeredToday >= input.goal,
      action: { ...next.action, source: 'home_route' },
    });
  }
  // Özet adımı (kullanıcı kararı 30 Eki): reçete özet vermese de okunmamış ünite varsa rotada yer alır.
  if (!items.some((i) => i.kind === 'summary') && input.nextSummary) {
    const ns = input.nextSummary;
    items.push({
      key: `summary:${ns.slug}`,
      kind: 'summary',
      label: `${kisaUnite(ns.title)} özeti`,
      detail: null,
      estimateMin: ns.readingMinutes,
      done: false,
      action: {
        type: 'open_summary',
        label: 'Oku',
        route: `/ozet/${ns.slug}`,
        source: 'home_route',
      },
    });
  }
  const n = input.readiness.unresolvedWrongCount;
  if (n > 0 || input.reviewDoneToday) {
    const count = Math.min(Math.max(n, 1), 20);
    items.push({
      key: 'review',
      kind: 'review',
      label: 'Yanlış tekrarı',
      detail: n > 0 ? `${n} soru` : 'kuyruk temiz',
      estimateMin: n > 0 ? dk(count) : null,
      done: input.reviewDoneToday,
      action:
        n > 0
          ? soruBaslat(
              count,
              { kind: 'wrongs', courseId: null, topicId: null, label: 'Yanlışlar' },
              'home_route',
            )
          : null,
    });
  }
  items.push({
    key: 'daily',
    kind: 'daily',
    label: 'Günün Quizi',
    detail: input.dailyQuizPlayed ? 'tamam' : '10 soru',
    estimateMin: input.dailyQuizPlayed ? null : dk(10),
    done: input.dailyQuizPlayed,
    action: input.dailyQuizPlayed
      ? null
      : {
          type: 'start_session',
          label: 'Başla · 10 soru',
          count: 10,
          recipe: 'coach',
          source: 'home_route',
        },
  });
  // Plan kalemleri: bitmemiş konu/tekrar/deneme kalemleri, rota dolana kadar (sıradaki konu tekrarlanmaz).
  for (const k of input.plan?.items ?? []) {
    if (items.length >= ROTA_EN_COK) break;
    if (k.status === 'done') continue;
    if (k.kind === 'topic' && k.topicId && k.topicId === u?.session.topicId) continue;
    if (k.kind === 'topic' && k.topicId) {
      const cevaplanan = input.todayTopicAnswered[k.topicId] ?? 0;
      items.push({
        key: `plan:${k.id}`,
        kind: 'plan_topic',
        label: k.topicName ?? 'Plan konusu',
        detail: cevaplanan > 0 ? `${cevaplanan} soru çözüldü` : null,
        estimateMin: k.remainingMinutes,
        done: cevaplanan >= 10,
        action: soruBaslat(10, topicFocus(k.topicId, k.topicName ?? ''), 'home_route'),
      });
    } else if (k.kind === 'review' && !items.some((i) => i.kind === 'review')) {
      items.push({
        key: `plan:${k.id}`,
        kind: 'plan_review',
        label: 'Plan tekrarı',
        detail: null,
        estimateMin: k.remainingMinutes,
        done: input.reviewDoneToday,
        action: null,
      });
    } else if (k.kind === 'mock') {
      items.push({
        key: `plan:${k.id}`,
        kind: 'plan_mock',
        label: 'Deneme (plan)',
        detail: null,
        estimateMin: k.remainingMinutes,
        done: false,
        action: {
          type: 'open_exams',
          label: 'Denemeler',
          route: '/denemeler',
          source: 'home_route',
        },
      });
    }
  }
  // Yoğunluğa göre kes: en az 2, en çok 6. Sıra korunur (adımlar numaralı); tamamlananlar yerinde kalır.
  return items.slice(0, Math.max(ROTA_EN_AZ, Math.min(ROTA_EN_COK, items.length)));
}

function seninIcin(input: BugunV3Input, next: NextStep): ForYouItem[] {
  const out: ForYouItem[] = [];
  const n = input.readiness.unresolvedWrongCount;
  if (n > 0 && next.kind !== 'review') {
    const count = Math.min(n, 20);
    out.push({
      kind: 'wrongs',
      label: `Yanlış kuyruğu · ${n} soru`,
      ctaLabel: 'Çöz',
      action: soruBaslat(
        count,
        { kind: 'wrongs', courseId: null, topicId: null, label: 'Yanlışlar' },
        'home_for_you',
      ),
    });
  }
  // Favoriler (kullanıcı kararı 30 Eki): hızlı tekrar alanı; favori varsa her zaman.
  if (input.bookmarkCount > 0) {
    const count = Math.min(input.bookmarkCount, 20);
    out.push({
      kind: 'favorites',
      label: `Favorilerim · ${input.bookmarkCount} soru`,
      ctaLabel: 'Tekrar et',
      action: {
        type: 'start_session',
        label: `Başla · ${count} soru · Favoriler`,
        count,
        recipe: 'coach',
        fromBookmarks: true,
        source: 'home_for_you',
      },
    });
  }
  const nextTopicId = input.weakestUnit?.session.topicId ?? null;
  const ikinci = input.readiness.weakest.find((w) => w.topicId !== nextTopicId) ?? null;
  if (ikinci) {
    out.push({
      kind: 'weak_topic',
      label: `${ikinci.name} · %${Math.round(ikinci.accuracy * 100)}`,
      ctaLabel: '10 soru',
      action: soruBaslat(10, topicFocus(ikinci.topicId, ikinci.name), 'home_for_you'),
    });
  }
  const ex = input.exams.todayUpcoming ?? input.exams.nextUpcoming;
  if (ex && next.kind !== 'exam') {
    out.push({
      kind: 'exam',
      label: `${ex.title} · ${gunSaat(ex.startAt, input.now)} · ${ex.questionCount} soru`,
      ctaLabel: 'Hatırlat',
      action: {
        type: 'open_exams',
        label: 'Denemeler',
        route: `/denemeler/${ex.id}`,
        source: 'home_for_you',
      },
    });
  }
  if (out.length < 3) {
    out.push({
      kind: 'mixed',
      label: 'Karışık 10 soru · koç karışımı',
      ctaLabel: 'Başla',
      action: {
        type: 'start_session',
        label: 'Başla · 10 soru',
        count: 10,
        recipe: 'coach',
        source: 'home_for_you',
      },
    });
  }
  return out.slice(0, FOR_YOU_EN_COK);
}

/** `week` servis katmanında eklenir (hacim/rütbe bağlamı burada yok). */
export function computeHomeV3(input: BugunV3Input): Omit<HomeV3, 'week'> {
  const nextStep = sıradaki(input);
  return { nextStep, route: rota(input, nextStep), forYou: seninIcin(input, nextStep) };
}
