import type { UnitRecipe } from '../summaries/unite-recete';
import type { DailyFocusView, Readiness, TodayTask, TodayTaskAction } from './home-v2.types';
import type { ForYouItem, HomeV3, NextStep, RouteItem } from './home-v3.types';
import { TAZE_TUR_MS, type YarimTur } from './today-task.logic';
import { OTURUM_VARSAYILAN_KART } from '../flashcards/flashcard.constants';

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
  /** Bugün yanlış turlarında cevaplanan soru; günlük porsiyon (en çok 20) bununla tamamlanır. */
  reviewAnsweredToday: number;
  /** Okunmamış ilk yayındaki özet ünitesi; reçete özet vermiyorsa rotaya bu girer. */
  nextSummary: { slug: string; title: string; topicId: string; readingMinutes: number } | null;
  /** Favori soru sayısı. */
  bookmarkCount: number;
  /** Bilgi kartları (Doc 56): vade, bugün çalışılan, günlük kart hedefi; kapalıysa null. */
  flashcards: { due: number; reviewedToday: number; dailyGoal: number } | null;
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
/** Kart başına ortalama süre (sn): ön yüz, çevirme, puan (Doc 56). */
const KART_SN = 12;
const kartDk = (count: number) => Math.max(1, Math.round((count * KART_SN) / 60));

type KartDurumu = NonNullable<BugunV3Input['flashcards']>;

/**
 * Bugünün kart porsiyonu: günlük kart hedefiyle sınırlı, bugün çalışılan + bekleyen. Hedef dolunca
 * ya da kuyruk boşalınca adım tamamlanır; sayı istemcide hesaplanmaz.
 */
function kartPorsiyonu(f: KartDurumu): number {
  return Math.min(Math.max(1, f.dailyGoal), Math.max(1, f.reviewedToday + f.due));
}

function kartAcici(count: number, source: TodayTaskAction['source']): TodayTaskAction {
  return {
    type: 'open_flashcards',
    label: `Tekrara başla · ${count} kart`,
    count,
    route: '/kartlar?mode=due',
    source,
  };
}

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
  // 2b) Hazırlanmış ama başlanmamış tur (Doc 48 "Turun hazır"): üst satır turun KENDİ kapsamı
  // (13 Kas 2026: tur T.C. Anayasası iken üst satır en zayıf konuyu ve "%8 · en zayıf" yazıyordu).
  if (t.kind === 'resume' && tur) {
    const kalan = Math.max(0, tur.total - tur.answered);
    return {
      kind: 'resume',
      eyebrow: `SIRADAKİ · ${tur.scopeName}`,
      title: t.title,
      reason: t.reason,
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
  // 4) Hedef dolduysa: rotanın ilk bitmemiş adımı (yanlış porsiyonu → günün quizi → okunmamış özet), yoksa dinlen.
  if (t.kind === 'done') {
    const n = input.readiness.unresolvedWrongCount;
    const porsiyon = yanlisPorsiyonu(input);
    if (n > 0 && input.reviewAnsweredToday < porsiyon) {
      const kalan = porsiyon - input.reviewAnsweredToday;
      return {
        kind: 'review',
        eyebrow: 'SIRADAKİ · YANLIŞ TEKRARI',
        title: `${kalan} yanlışını temizle`,
        reason: `Günlük hedefin tamam; kuyrukta ${n} yanlış var, bugünkü porsiyon ${porsiyon}.`,
        badge: null,
        estimateMin: dk(kalan),
        action: soruBaslat(
          Math.min(n, 20),
          { kind: 'wrongs', courseId: null, topicId: null, label: 'Yanlışlar' },
          'home_next',
        ),
      };
    }
    // Kart tekrarı (Doc 56): soru hedefi dolmuş, vadesi gelen kart var ve bugünkü porsiyon bitmemiş.
    const f = input.flashcards;
    if (f && f.due > 0 && f.reviewedToday < kartPorsiyonu(f)) {
      const kalan = kartPorsiyonu(f) - f.reviewedToday;
      return {
        kind: 'flashcards',
        eyebrow: 'SIRADAKİ · KART TEKRARI',
        title: `${kalan} kart tekrar bekliyor`,
        reason: `Soru hedefin tamam; ${kalan} kartlık tur ${kartDk(kalan)} dakika sürer, hatırladıkların uzun aralığa geçer.`,
        badge: null,
        estimateMin: kartDk(kalan),
        action: kartAcici(kalan, 'home_next'),
      };
    }
    if (!input.dailyQuizPlayed) {
      return {
        kind: 'questions',
        eyebrow: 'SIRADAKİ · GÜNÜN QUİZİ',
        title: 'Günün Quizi · 10 soru',
        reason: 'Hedef ve yanlış porsiyonu tamam; günün 10 sorusu kaldı.',
        badge: null,
        estimateMin: dk(10),
        action: {
          type: 'start_session',
          label: 'Başla · 10 soru',
          count: 10,
          recipe: 'coach',
          source: 'home_next',
        },
      };
    }
    if (input.nextSummary) {
      const ns = input.nextSummary;
      return {
        kind: 'summary_then_questions',
        eyebrow: `SIRADAKİ · ${kisaUnite(ns.title)}`,
        title: `${kisaUnite(ns.title)} özetini oku`,
        reason: 'Soru payın doldu; bugünü okumayla kapat.',
        badge: null,
        estimateMin: ns.readingMinutes,
        action: {
          type: 'open_summary',
          label: 'Oku',
          route: `/ozet/${ns.slug}`,
          source: 'home_next',
        },
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
  // 5) Genel: Doc 48 kartının önerisi (plan konusu / odak / yanlışlar / koç turu). Üst satır ve
  // rozet Başla'nın GERÇEKTEN başlattığı odaktan gelir (13 Kas 2026: üst satır en zayıf konuyu,
  // düğme planın Genel Kültür odağını gösteriyordu).
  const etiket = odakEtiketi(input, t.action.focus);
  return {
    kind: 'questions',
    eyebrow: etiket.eyebrow,
    title: t.title,
    reason: t.reason,
    badge: etiket.badge,
    estimateMin: t.action.count ? dk(t.action.count) : null,
    action: { ...t.action, source: 'home_next' },
  };
}

/** Bir turun odağı plan kalemi mi (bitmemiş konu kalemi)? */
function planKonusuMu(input: BugunV3Input, topicId: string | null | undefined): boolean {
  if (!topicId) return false;
  return (input.plan?.items ?? []).some(
    (k) => k.kind === 'topic' && k.topicId === topicId && k.status !== 'done',
  );
}

/**
 * Sıradaki adımın üst satırı ve rozeti, eylemin odağına göre: plan konusu → "PLAN · <konu>",
 * konu/ders → "<ad>", yanlışlar → "YANLIŞLAR", koç karışımı → ağırlık verdiği en zayıf konu.
 * "en zayıf" rozeti yalnız başlatılan konu gerçekten en zayıf konuysa (ya da koç onu ağırlıklıyorsa).
 */
export function odakEtiketi(
  input: BugunV3Input,
  focus: DailyFocusView | undefined,
): { eyebrow: string; badge: string | null; detail: string | null } {
  const zayif = input.readiness.weakest[0] ?? null;
  const zayifRozet = zayif ? `%${Math.round(zayif.accuracy * 100)} · en zayıf` : null;
  if (!focus || focus.kind === 'coach') {
    return zayif
      ? {
          eyebrow: `SIRADAKİ · ${zayif.courseName} · ${zayif.name}`,
          badge: zayifRozet,
          detail: zayif.courseName,
        }
      : { eyebrow: 'SIRADAKİ · KOÇ TURU', badge: null, detail: 'Koç karışımı' };
  }
  if (focus.kind === 'wrongs') {
    return { eyebrow: 'SIRADAKİ · YANLIŞLAR', badge: null, detail: 'Yanlışlar' };
  }
  const ad = focus.label ?? 'Odak';
  const plan = focus.kind === 'topic' && planKonusuMu(input, focus.topicId);
  return {
    eyebrow: `SIRADAKİ · ${plan ? 'PLAN · ' : ''}${ad}`,
    badge: zayif && focus.topicId && zayif.topicId === focus.topicId ? zayifRozet : null,
    detail: plan ? `Plan · ${ad}` : ad,
  };
}

/**
 * Haftalık plan kaleminin bugünkü payı (dk): kalan süre ÷ haftanın kalan günü (bugün dahil, TR
 * Pazartesi başı), en az 10 dk, kalan süreyi aşmaz. 13 Kas 2026: rota 90 dk'yı tek güne yazıyordu.
 */
export function gunlukPay(kalanDk: number, now: Date): number {
  if (kalanDk <= 0) return 0;
  const gun = new Date(now.getTime() + 3 * 3600 * 1000).getUTCDay(); // 0 = Pazar
  const kalanGun = gun === 0 ? 1 : 8 - gun;
  return Math.min(kalanDk, Math.max(10, Math.round(kalanDk / kalanGun)));
}

/** Günlük yanlış porsiyonu: kuyruk ve bugün çözülenin büyüğü, en çok 20. */
function yanlisPorsiyonu(input: BugunV3Input): number {
  return Math.min(20, Math.max(input.readiness.unresolvedWrongCount, input.reviewAnsweredToday, 1));
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
    // Canlı deneme varsa satır onundur ("şimdi"); aynı gün ikinci bir deneme varsa saati
    // canlı denemenin başlığına yapışmasın (2 Kas 2026).
    const up = input.exams.live ? null : input.exams.todayUpcoming;
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
      label: next.action.count
        ? `${next.action.count} soru`
        : next.kind === 'resume' && input.activeSession
          ? `${input.activeSession.total} soruluk tur`
          : 'Soru turu',
      // Alt satır adımın başlattığı odak (ana kartla aynı kaynak; 13 Kas 2026). Yarım turda turun kapsamı.
      detail:
        next.kind === 'resume' && input.activeSession
          ? input.activeSession.scopeName
          : odakEtiketi(input, next.action.focus).detail,
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
  if (n > 0 || input.reviewAnsweredToday > 0) {
    // Günlük porsiyon: en çok 20 yanlış; tamamlanma bugün çözülen yanlış sayısından (kuyruk 881 olsa da).
    const porsiyon = yanlisPorsiyonu(input);
    const cozulen = input.reviewAnsweredToday;
    items.push({
      key: 'review',
      kind: 'review',
      label: `Yanlış tekrarı · ${porsiyon} soru`,
      detail:
        n > 0
          ? cozulen > 0 && cozulen < porsiyon
            ? `${cozulen}/${porsiyon} · ${n} kuyrukta`
            : `${n} kuyrukta`
          : 'kuyruk temiz',
      estimateMin: n > 0 && cozulen < porsiyon ? dk(porsiyon - cozulen) : null,
      done: n === 0 || cozulen >= porsiyon,
      action:
        n > 0
          ? soruBaslat(
              Math.min(n, 20),
              { kind: 'wrongs', courseId: null, topicId: null, label: 'Yanlışlar' },
              'home_route',
            )
          : null,
    });
  }
  // Kart tekrarı (Doc 56): vade ya da bugün çalışma varsa rotada; porsiyon günlük kart hedefiyle sınırlı.
  const kart = input.flashcards;
  if (kart && (kart.due > 0 || kart.reviewedToday > 0)) {
    const porsiyon = kartPorsiyonu(kart);
    const bitti = kart.due === 0 || kart.reviewedToday >= porsiyon;
    const kalan = Math.max(0, porsiyon - kart.reviewedToday);
    items.push({
      key: 'flashcards',
      kind: 'flashcards',
      label: `Kart tekrarı · ${porsiyon} kart`,
      detail:
        kart.due === 0
          ? 'kuyruk temiz'
          : kart.reviewedToday > 0 && !bitti
            ? `${kart.reviewedToday}/${porsiyon} · ${kart.due} bekliyor`
            : `${kart.due} bekliyor`,
      estimateMin: bitti ? null : kartDk(kalan),
      done: bitti,
      action: kart.due > 0 ? kartAcici(Math.max(1, kalan), 'home_route') : null,
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
    // Sıradaki adım zaten bu plan konusunu başlatıyorsa rotada ikinci kez yazılmaz (13 Kas 2026).
    if (k.kind === 'topic' && k.topicId && k.topicId === next.action.focus?.topicId) continue;
    if (k.kind === 'topic' && k.topicId) {
      const cevaplanan = input.todayTopicAnswered[k.topicId] ?? 0;
      items.push({
        key: `plan:${k.id}`,
        kind: 'plan_topic',
        label: k.topicName ?? 'Plan konusu',
        detail:
          cevaplanan > 0
            ? `${cevaplanan} soru çözüldü`
            : `Plan · bu hafta ${k.remainingMinutes} dk kaldı`,
        // Bugünün payı: haftanın kalanı ÷ kalan gün (90 dk'lık haftalık kalan tek güne yazılmaz).
        estimateMin: gunlukPay(k.remainingMinutes, input.now),
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

function seninIcin(input: BugunV3Input, next: NextStep, route: RouteItem[]): ForYouItem[] {
  const out: ForYouItem[] = [];
  // Rotada ya da ana kartta olan şey burada tekrar edilmez (13 Kas 2026).
  const rotada = new Set(route.map((r) => r.kind));
  const n = input.readiness.unresolvedWrongCount;
  if (n > 0 && next.kind !== 'review' && !rotada.has('review')) {
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
  const kullanilan = new Set(
    [input.weakestUnit?.session.topicId, next.action.focus?.topicId].filter(Boolean) as string[],
  );
  const ikinci = input.readiness.weakest.find((w) => !kullanilan.has(w.topicId)) ?? null;
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
  // Vadesi gelen kartlar (Doc 56): sıradaki adım kart tekrarı değilse tek dokunuşla tekrar.
  const kart = input.flashcards;
  if (kart && kart.due > 0 && next.kind !== 'flashcards' && !rotada.has('flashcards')) {
    out.push({
      kind: 'flashcards_due',
      label: `Kart tekrarı · ${kart.due} kart`,
      ctaLabel: 'Çalış',
      action: kartAcici(Math.min(kart.due, OTURUM_VARSAYILAN_KART), 'home_for_you'),
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
export function computeHomeV3(input: BugunV3Input): Omit<HomeV3, 'week' | 'today'> {
  const nextStep = sıradaki(input);
  const route = rota(input, nextStep);
  return { nextStep, route, forYou: seninIcin(input, nextStep, route) };
}
