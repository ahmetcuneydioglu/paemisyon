import type {
  DailyFocusView,
  Readiness,
  TodayTask,
  TodayTaskAction,
  TodayTaskSecondary,
} from './home-v2.types';

/**
 * "Bugünün görevi" (Doc 48 §4) — SAF fonksiyon, birim testli.
 *
 * Ekranın TEK birincil eylemi burada seçilir; etiket ve davranış aynı nesnede
 * (bugün "Isınmaya başla (5 soru)" yazan düğme 20 soruluk tur açıyordu).
 * Öncelik (Doc 24 §3: güvenlik > aciliyet > alışkanlık > büyüme):
 *   deneme günü > taze yarım tur > ilk gün > dönüş > haftalık risk > tamam > başla
 *
 * Metinlerde Türkçe hal eki ÜRETİLMEZ ("Anayasa'da"/"Ceza'da" ünlü uyumuna
 * bağlı): yanlış çekimli bir koç cümlesi güven kırar. Kalıplar eksiz kurulur.
 */

/** Yarım tur bu süreden yeniyse görev kartının kendisi olur. */
export const TAZE_TUR_MS = 24 * 3_600_000;
/** Bu süreden eski yarım tur ikincil satır olmaz (sunucu zaten kapatır — 4B). */
export const BAYAT_TUR_MS = 7 * 86_400_000;
/** Dönüş: son aktiviteden bu kadar gün sonra (Doc 24 §3: "5+ gün"). */
export const DONUS_GUN = 5;
/** Akşam eşiği (TR saati) — haftalık risk hatırlatması bundan sonra. */
export const AKSAM_SAATI = 18;
/** Varsayılan tur ve sınırları (persona: 10–20 dk oturum ≈ 10 soru). */
export const TUR_VARSAYILAN = 10;
export const TUR_EN_AZ = 5;
export const KISA_TUR = 5;

/** Haftanın bugün dahil kalan günü (Pzt başlangıçlı UTC hafta; Pazar = 1). */
export function haftadaKalanGun(now: Date): number {
  return 7 - ((now.getUTCDay() + 6) % 7);
}

export interface YarimTur {
  sessionId: string;
  mode: 'practice' | 'review' | 'daily';
  total: number;
  answered: number;
  startedAt: Date;
  /** Son cevap; hiç cevap yoksa başlangıç. */
  lastActivityAt: Date;
  /** "Koç turu", "Anayasa Hukuku", "3 seçili mevzuat", "Yanlış turu"… */
  scopeName: string;
}

export interface TodayTaskInput {
  now: Date;
  trHour: number;
  goal: number;
  answeredToday: number;
  /** Toplam çözülen (ilk gün tespiti). */
  totalSolved: number;
  daysSinceLastActivity: number | null;
  daysToExam: number | null;
  weekly: { activeDays: number; goalDays: number };
  /** Haftanın bugün dahil kalan günü (Pzt başlangıçlı; Pazar = 1). */
  daysLeftInWeek: number;
  exams: {
    live: { id: string; title: string; endAt: Date; attempted: boolean; inProgress: boolean } | null;
    todayUpcoming: { id: string; title: string; startAt: Date } | null;
  };
  /** En yeni yarım alıştırma/tekrar/günlük turu (varsa). */
  activeSession: YarimTur | null;
  focus: DailyFocusView;
  readiness: Readiness;
  /** Dönüş gerekçesi için en güçlü konu (varsa). */
  strongestTopic: { name: string; accuracy: number } | null;
}

const yuzde = (x: number) => `%${Math.round(x * 100)}`;

const saat = (d: Date) =>
  d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

/** Odağın düğme etiketindeki kısa hali ("· Anayasa Hukuku"); koçta yok. */
function odakEki(focus: DailyFocusView): string {
  return focus.label ? ` · ${focus.label}` : '';
}

function baslat(
  count: number,
  focus: DailyFocusView,
  opts: { recipe?: 'coach' | 'comeback'; prefix?: string; source?: TodayTaskAction['source'] } = {},
): TodayTaskAction {
  const birim = focus.kind === 'wrongs' ? 'yanlış' : 'soru';
  return {
    type: 'start_session',
    label: `${opts.prefix ?? 'Başla'} · ${count} ${birim}${odakEki(focus)}`,
    count,
    recipe: opts.recipe ?? 'coach',
    ...(focus.kind === 'coach' ? {} : { focus }),
    source: opts.source ?? 'home_task',
  };
}

function devam(tur: YarimTur): TodayTaskAction {
  const kalan = Math.max(0, tur.total - tur.answered);
  return {
    type: 'resume_session',
    label: kalan > 0 ? `Devam et · ${kalan} soru` : 'Sonucu gör',
    sessionId: tur.sessionId,
    source: 'home_resume',
  };
}

const KOC: DailyFocusView = { kind: 'coach', courseId: null, topicId: null, label: null };

/** Görev kartının altındaki tek ikincil satır (D4). */
function ikincil(input: TodayTaskInput, birincilTur: boolean): TodayTaskSecondary | null {
  const tur = input.activeSession;
  if (tur && !birincilTur) {
    const yas = input.now.getTime() - tur.lastActivityAt.getTime();
    if (yas >= TAZE_TUR_MS && yas < BAYAT_TUR_MS) {
      const gun = Math.max(1, Math.floor(yas / 86_400_000));
      return {
        kind: 'stale_session',
        title: `${gun} gün önce yarım kalan tur`,
        subtitle: `${tur.answered}/${tur.total} soru · ${tur.scopeName}`,
        actionLabel: 'Devam et',
        action: devam(tur),
      };
    }
  }
  const n = input.readiness.unresolvedWrongCount;
  if (n > 0 && input.focus.kind !== 'wrongs') {
    const count = Math.min(n, 20);
    // ~20 sn/soru; en az 1 dk.
    const dk = Math.max(1, Math.round((count * 20) / 60));
    return {
      kind: 'wrongs',
      title: `${n} çözülmemiş yanlış`,
      subtitle: `Yaklaşık ${dk} dakika`,
      actionLabel: 'Tekrar et',
      action: {
        type: 'start_session',
        label: `Tekrar et · ${count} yanlış`,
        count,
        recipe: 'coach',
        focus: { kind: 'wrongs', courseId: null, topicId: null, label: null },
        source: 'home_suggestion',
      },
    };
  }
  return null;
}

export function computeTodayTask(input: TodayTaskInput): TodayTask {
  const { now, goal, answeredToday } = input;
  const gunlukIlerleme = {
    label: `Bugün ${Math.min(answeredToday, goal)}/${goal} soru`,
    answered: Math.min(answeredToday, goal),
    total: goal,
  };

  // 1) Deneme günü — canlı deneme her şeyi ezer (Doc 24 §3).
  const live = input.exams.live;
  if (live && live.inProgress) {
    return {
      kind: 'exam',
      title: 'Denemen yarım kaldı',
      reason: `${live.title} — süre dolmadan dön.`,
      progress: null,
      action: { type: 'open_exams', label: 'Denemeye dön', route: `/denemeler/${live.id}`, source: 'home_task' },
      finishSessionId: null,
      secondary: null,
    };
  }
  if (live && !live.attempted) {
    return {
      kind: 'exam',
      title: 'Canlı deneme şu an açık',
      reason: `${live.title} · ${saat(live.endAt)} kadar katılabilirsin.`,
      progress: null,
      action: { type: 'open_exams', label: 'Denemeye git', route: '/denemeler', source: 'home_task' },
      finishSessionId: null,
      secondary: null,
    };
  }
  const yaklasan = input.exams.todayUpcoming;
  if (yaklasan) {
    return {
      kind: 'exam',
      title: `Deneme bugün ${saat(yaklasan.startAt)}`,
      reason: `${yaklasan.title}. Sabah ağır konu yok — kısa ısınma istersen aşağıda.`,
      progress: null,
      action: { type: 'open_exams', label: 'Denemeyi gör', route: '/denemeler', source: 'home_task' },
      finishSessionId: null,
      secondary: {
        kind: 'warmup',
        title: 'Kısa ısınma',
        subtitle: `${KISA_TUR} soru · yaklaşık 2 dakika`,
        actionLabel: 'Isın',
        action: baslat(KISA_TUR, KOC, { prefix: 'Isın', source: 'home_suggestion' }),
      },
    };
  }

  // 2) Taze yarım tur — görev kartının kendisi (S2: tek devam yolu).
  const tur = input.activeSession;
  if (tur && now.getTime() - tur.lastActivityAt.getTime() < TAZE_TUR_MS) {
    return {
      kind: 'resume',
      title: 'Turun yarım kaldı',
      reason: `${tur.scopeName} · başlangıç ${saat(tur.startedAt)}`,
      // Kartta TEK ilerleme: turunki (günün halkası bu sırada gizli — Faz 2 karar 3).
      progress: { label: `${tur.answered}/${tur.total} soru`, answered: tur.answered, total: tur.total },
      action: devam(tur),
      finishSessionId: tur.sessionId,
      secondary: null,
    };
  }

  // 3) İlk gün — ölçülü ilk temas (S4: 20 değil 10 soru).
  if (input.totalSolved < TUR_VARSAYILAN) {
    return {
      kind: 'first',
      title: 'Seni tanıyalım',
      reason: '10 soruluk ilk tur — koç seviyeni görsün, planını ona göre kursun.',
      progress: null,
      action: baslat(TUR_VARSAYILAN, input.focus),
      finishSessionId: null,
      secondary: null,
    };
  }

  // 4) Uzun aradan dönüş — güçlü konudan kısa tur, suçluluk dili yok (S5).
  if (input.daysSinceLastActivity != null && input.daysSinceLastActivity >= DONUS_GUN) {
    const g = input.strongestTopic;
    return {
      kind: 'comeback',
      title: 'Kısa bir dönüş turu',
      reason: g
        ? `Güçlü konundan 5 soru — 3 dakika. ${g.name}: ${yuzde(g.accuracy)} doğru.`
        : '5 soruluk kısa tur — 3 dakika.',
      progress: null,
      action: baslat(KISA_TUR, KOC, { recipe: 'comeback' }),
      finishSessionId: null,
      secondary: null,
    };
  }

  // 5) Haftalık risk (D1): akşam, bugün 0 cevap ve bugün kaçarsa hedef tutmaz.
  const { activeDays, goalDays } = input.weekly;
  const eksikGun = goalDays - activeDays;
  if (
    input.trHour >= AKSAM_SAATI &&
    answeredToday === 0 &&
    eksikGun > 0 &&
    eksikGun >= input.daysLeftInWeek
  ) {
    return {
      kind: 'weekly_risk',
      title: `Bu haftanın ${activeDays + 1}. günü için`,
      reason: '5 soru yeter — haftalık hedefin yolunda kalır.',
      progress: gunlukIlerleme,
      action: baslat(KISA_TUR, input.focus),
      finishSessionId: null,
      secondary: ikincil(input, false),
    };
  }

  // 6) Hedef tamam — ödül sakin, ekstra isteğe bağlı.
  if (answeredToday >= goal) {
    return {
      kind: 'done',
      title: 'Bugünkü hedef tamam',
      reason: `${goal}/${goal} — yarın görüşürüz.`,
      progress: gunlukIlerleme,
      action: baslat(TUR_VARSAYILAN, input.focus, { prefix: 'Ekstra tur' }),
      finishSessionId: null,
      secondary: ikincil(input, false),
    };
  }

  // 7) Normal: bugünün turu — iki tur ≈ hedef (Doc 48 §4 tur boyu).
  const kalan = goal - answeredToday;
  const focus = input.focus;
  let count = Math.max(TUR_EN_AZ, Math.min(TUR_VARSAYILAN, kalan));
  let reason: string;
  if (focus.kind === 'wrongs') {
    const n = input.readiness.unresolvedWrongCount;
    if (n === 0) {
      // Yanlış kalmadıysa odak boşa düşmez: koç turuna döner ve bunu söyler.
      return {
        kind: 'start',
        title: 'Bugünün turu',
        reason: 'Çözülmemiş yanlışın kalmadı — koç karışık tur kurdu.',
        progress: gunlukIlerleme,
        action: baslat(count, KOC),
        finishSessionId: null,
        secondary: ikincil(input, false),
      };
    }
    count = Math.min(n, 20);
    reason = `${n} çözülmemiş yanlışından — en eskisi önce.`;
  } else if (focus.kind !== 'coach') {
    reason = `Odak: ${focus.label}. Soruları koç seçiyor.`;
  } else if (input.daysToExam != null && input.daysToExam <= 30) {
    reason = `Sınava ${input.daysToExam} gün — yanlışlar ve zayıf konular ağırlıklı.`;
  } else if (input.readiness.weakest[0]) {
    const z = input.readiness.weakest[0];
    reason = `Ağırlık: ${z.name} (${yuzde(z.accuracy)} doğru).`;
  } else {
    reason = 'Yeni sorular ve müfredat ağırlığına göre karışık.';
  }
  return {
    kind: 'start',
    title: focus.kind === 'wrongs' ? 'Yanlış turu' : 'Bugünün turu',
    reason,
    progress: gunlukIlerleme,
    action: baslat(count, focus),
    finishSessionId: null,
    secondary: ikincil(input, false),
  };
}
