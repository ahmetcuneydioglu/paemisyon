/**
 * Mobil yeni anasayfanın (Doc 48) /me/coach ekleri.
 *
 * Hepsi EKLEMELİ: eski mobil sürüm ve web bu alanları okumaz, hiçbir mevcut
 * alanın anlamı değişmez. Kural (CLAUDE.md): koç kararı SUNUCUDA verilir —
 * istemci "bugün ne yapmalı" sorusunu kendisi hesaplamaz, todayTask'ı çizer.
 */

/** İstemci özellik bayrakları — karar sunucuda. */
export interface BriefFlags {
  /** Yeni anasayfa: panel anahtarı açıksa herkes, kapalıyken yalnız admin. */
  homeV2: boolean;
}

/** Sınav geri sayımı (Faz 0 kararı 1: resmî + kişisel). */
export interface ExamInfo {
  /** Hedef sınav adı (ExamType.name); hedef seçilmemişse null. */
  name: string | null;
  /** YYYY-MM-DD — kişisel tarih varsa o, yoksa hedef sınavın resmî tarihi. */
  date: string | null;
  /** Kalan TR takvim günü (0 = bugün); tarih yoksa veya geçtiyse null. */
  daysLeft: number | null;
  source: 'personal' | 'official' | null;
}

export type ReadinessCourseState = 'normal' | 'weak' | 'sparse';

export interface ReadinessCourse {
  courseId: string;
  name: string;
  /** Dersin ikonu — Lucide anahtarı (Doc 48 Faz 6.3; izinli liste
   *  `common/course-icons.ts`). Atanmamışsa null: istemci açık kitap çizer. */
  icon: string | null;
  solved: number;
  correct: number;
  /** 0..1 — hiç çözülmemişse null. Bileşik "hazır %" skoru YOK (Doc 48 İ6). */
  accuracy: number | null;
  state: ReadinessCourseState;
  /** Bu hafta vs geçen hafta ortalama mastery değişimi (%); veri yoksa null. */
  deltaPct: number | null;
}

export interface ReadinessTopic {
  topicId: string;
  name: string;
  courseName: string;
  accuracy: number;
  solved: number;
}

/** Hazırlık bloğu (Doc 48 §3 ③). */
export interface Readiness {
  courses: ReadinessCourse[];
  /** En zayıf en çok 3 konu — tek eşik `common/zayif-konu.ts`. */
  weakest: ReadinessTopic[];
  /** Yanlış turunun GERÇEKTE sunabileceği çözülmemiş yanlış sayısı. */
  unresolvedWrongCount: number;
}

export type FocusKind = 'coach' | 'course' | 'topic' | 'wrongs';

/** Günün odağı (Doc 25 §5: geçici; ertesi gün koça döner). */
export interface DailyFocusView {
  kind: FocusKind;
  courseId: string | null;
  topicId: string | null;
  /** Etikette gösterilecek kapsam adı ("Anayasa Hukuku"); koçta null. */
  label: string | null;
}

/** Turun geliş kanalı (ölçüm — startSession.source). */
export type HomeSource = 'home_task' | 'home_resume' | 'home_weak_topic' | 'home_suggestion';

export interface TodayTaskAction {
  type: 'start_session' | 'resume_session' | 'open_exams';
  /** Düğme etiketi — davranışla aynı kaynaktan ("Başla · 10 soru"). */
  label: string;
  /** start_session: soru sayısı (etikettekiyle aynı). */
  count?: number;
  /** start_session: karışım reçetesi. */
  recipe?: 'coach' | 'comeback';
  /** start_session: kapsam (odak); koçta yok. */
  focus?: DailyFocusView;
  /** resume_session: devam edilecek tur. */
  sessionId?: string;
  /** open_exams: istemci rotası. */
  route?: string;
  source: HomeSource;
}

export type TodayTaskKind =
  | 'exam'
  | 'resume'
  | 'first'
  | 'comeback'
  | 'weekly_risk'
  | 'start'
  | 'done';

/** Görev kartının altındaki EN ÇOK 1 ikincil satır (D4). */
export interface TodayTaskSecondary {
  /** stale_session: 1–7 gün önce yarım kalan tur · wrongs: yanlış tekrarı ·
   *  warmup: deneme günü kısa ısınma. */
  kind: 'stale_session' | 'wrongs' | 'warmup';
  title: string;
  subtitle: string;
  actionLabel: string;
  action: TodayTaskAction;
}

/** Görev kartı + eylem çubuğu (Doc 48 §4 durum tablosu). */
export interface TodayTask {
  kind: TodayTaskKind;
  title: string;
  /** Tek satır gerekçe (Doc 24 §9 şeffaflık). */
  reason: string;
  /** Kartta aynı anda TEK ilerleme: yarım turda turunki, yoksa günün halkası. */
  progress: { label: string; answered: number; total: number } | null;
  action: TodayTaskAction;
  /** Yarım turdan çıkış: "Şimdilik bitir, sonucu gör" (yalnız resume). */
  finishSessionId: string | null;
  secondary: TodayTaskSecondary | null;
}
