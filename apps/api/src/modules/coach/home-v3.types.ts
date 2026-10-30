import type { TodayTaskAction } from './home-v2.types';

/**
 * Bugün v3 (Doc 49/16) — "tek adım" ana sayfa ekleri. Hepsi EKLEMELİ ve `homeV3` altında;
 * eski istemciler okumaz. Kural (CLAUDE.md): "bugün ne yapmalı" kararı SUNUCUDA verilir;
 * istemci `nextStep`'i çizer, `route`'u işaretler, `forYou`'yu listeler — sıralama ve
 * seçim mantığı `bugun-v3.logic.ts`'tedir.
 */

export type NextStepKind =
  'exam' | 'resume' | 'summary_then_questions' | 'questions' | 'review' | 'done';

/** Sıradaki kartı: tek birincil eylem. */
export interface NextStep {
  kind: NextStepKind;
  /** Üst etiket: "ANAYASA · YÜRÜTME" (büyük harf istemcide). */
  eyebrow: string;
  /** Lora başlık: "4 dk özet, sonra 10 soru". */
  title: string;
  /** Tek cümle gerekçe. */
  reason: string;
  /** Sağ üst küçük hap: "%42 · en zayıf"; yoksa null. */
  badge: string | null;
  /** Tahminî süre (dk); yoksa null. */
  estimateMin: number | null;
  /** Düğme davranışı — TodayTaskAction ile aynı sözleşme (start/resume/open…). */
  action: TodayTaskAction;
}

export type RouteItemKind =
  | 'daily'
  | 'summary'
  | 'questions'
  | 'review'
  | 'exam'
  | 'plan_topic'
  | 'plan_review'
  | 'plan_mock';

/** Bugünün rotası satırı (2–6 madde; sayı koçun — yoğunluğa göre). */
export interface RouteItem {
  key: string;
  kind: RouteItemKind;
  /** "Yürütme özeti" */
  label: string;
  /** Sağ sütun: "doğru", "Anayasa" (süre `estimateMin`'den ayrı). */
  detail: string | null;
  /** Tahminî süre (dk) — "~4 dk"; yoksa null. */
  estimateMin: number | null;
  /** Bugün gerçekten tamamlandı mı (sunucu verisinden: özet okundu, konuda N soru çözüldü, yanlış turu bitti…). */
  done: boolean;
  /** Dokununca; null ise yalnız bilgi. */
  action: TodayTaskAction | null;
}

export type ForYouKind = 'wrongs' | 'favorites' | 'weak_topic' | 'exam' | 'mixed';

/** Senin için satırı (en çok 4): tek dokunuşla eylem. */
export interface ForYouItem {
  kind: ForYouKind;
  /** "Yanlış kuyruğu · 4 soru" */
  label: string;
  /** Hap metni: "Çöz", "10 soru", "Hatırlat". */
  ctaLabel: string;
  action: TodayTaskAction;
}

/** "Bu hafta" satırı: son 7 gün çözülen soru, haftalık aktif gün, rütbe adı. */
export interface WeekSummary {
  solved: number;
  activeDays: number;
  goalDays: number;
  rankName: string;
}

/** Bugünün sayımı (rota alt satırı): "Bugün 150 soru · %80 doğru · hedef 20 ✓". */
export interface TodaySummary {
  answered: number;
  correct: number;
  /** Cevap yoksa null (sıfır yüzde yazılmaz). */
  accuracyPct: number | null;
  goal: number;
}

export interface HomeV3 {
  nextStep: NextStep;
  route: RouteItem[];
  forYou: ForYouItem[];
  week: WeekSummary;
  today: TodaySummary;
}
