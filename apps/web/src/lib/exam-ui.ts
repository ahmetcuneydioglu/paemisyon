import type { ExamListItem } from "@/lib/types";

/**
 * Eski API cevabını (Doc 50 öncesi alanlar) yeni şekle tamamlar. API ile web ayrı
 * deploy olur; alanlar eksik gelirse kart çizimi düşmesin — kararlar yine sunucunun
 * eski alanlarından türetilir (state/myAttempt/myArchiveAttempt).
 */
export function normalizeExamListItem(raw: Partial<ExamListItem> & Pick<ExamListItem, "id" | "title" | "startAt">): ExamListItem {
  const state = raw.state ?? "ended";
  const myAttempt = raw.myAttempt ?? null;
  const availability = raw.availability ?? (state === "upcoming" ? "upcoming" : state === "active" ? "open" : "closed");
  const officialStatus = myAttempt?.status === "completed" || myAttempt?.status === "in_progress" ? myAttempt.status : null;
  return {
    description: null,
    endAt: raw.startAt,
    durationMinutes: 0,
    questionCount: 0,
    isPremium: false,
    questionsOpenAfterEnd: true,
    archiveOpenAfterEnd: false,
    participantCount: 0,
    avgScore: null,
    myArchiveAttempt: null,
    publishMode: "takvimli",
    difficulty: null,
    examTypeId: null,
    liveAnswerReveal: false,
    practiceAfterEnd: raw.archiveOpenAfterEnd ?? false,
    myState: officialStatus === "in_progress" ? "in_progress" : officialStatus === "completed" ? "completed" : "new",
    canStartOfficial: availability === "open" && officialStatus == null,
    canStartPractice: availability === "closed" && (raw.archiveOpenAfterEnd ?? false),
    ...raw,
    state,
    myAttempt,
    availability,
    my: raw.my ?? {
      official: myAttempt
        ? { attemptId: myAttempt.id, status: myAttempt.status, resultLocked: false, score: null, correct: null, wrong: null, blank: null, rank: null, total: raw.participantCount ?? 0, completedAt: null }
        : null,
      active: myAttempt?.status === "in_progress" ? { attemptId: myAttempt.id, role: "official", deadlineAt: null, answered: 0 } : null,
      practiceCount: 0,
      lastPractice: null,
    },
  };
}

/** Net biçimi: 61,75 → "61,75"; 72 → "72"; null → "—". */
export function fmtNet(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const s = n.toFixed(2).replace(/\.?0+$/, "");
  return s.replace(".", ",");
}

/** Saniye → "1 sa 48 dk" / "12 dk" / "45 sn". */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return `${m} dk`;
  return `${seconds} sn`;
}

/** "1.203 kişide 245." — sıra bilinmiyorsa null. */
export function rankSentence(rank: number | null, total: number): string | null {
  if (rank == null || total <= 0) return null;
  return `${total.toLocaleString("tr-TR")} kişide ${rank}.`;
}

export const DIFFICULTY_LABEL = { kolay: "Kolay", orta: "Orta", zor: "Zor" } as const;
export const DIFFICULTY_TONE = {
  kolay: "success",
  orta: "accent",
  zor: "danger",
} as const;

export type ExamCardKind =
  | "in_progress"
  | "new"
  | "done"
  | "locked"
  | "upcoming"
  | "weekly_missed"
  | "closed";

export interface ExamCardModel {
  kind: ExamCardKind;
  /** Birincil eylem. */
  primary: { label: string; href: string; variant: "primary" | "secondary" } | null;
  /** İkincil eylem (ghost). */
  secondary: { label: string; href: string } | null;
  /** Durum satırı metni (ikonun yanında). */
  status: string;
}

/**
 * Kart modeli — SAF (Doc 50 M1). Kurallar sunucudan gelir (`canStart*`, `availability`,
 * `myState`); burası yalnız hangi düğmenin çizileceğini seçer. Hiçbir kapı burada yok.
 */
export function examCardModel(e: ExamListItem, loggedIn: boolean): ExamCardModel {
  const rules = (role?: "practice") =>
    `/denemeler/${e.id}/baslamadan-once${role ? `?role=${role}` : ""}`;
  const official = e.my.official;
  const resultHref = official ? `/sonuc/${official.attemptId}` : null;
  const participants = `${e.participantCount.toLocaleString("tr-TR")} katılımcı`;

  if (!loggedIn) {
    return {
      kind: e.availability === "upcoming" ? "upcoming" : "new",
      primary: { label: "Giriş yap ve çöz", href: `/giris?next=${encodeURIComponent(rules())}`, variant: "primary" },
      secondary: null,
      status: participants,
    };
  }
  if (e.myState === "in_progress" && e.my.active) {
    return {
      kind: "in_progress",
      primary: {
        label: "Devam et",
        href: `/sinav/${e.id}${e.my.active.role === "practice" ? "?role=practice" : ""}`,
        variant: "primary",
      },
      secondary: null,
      status: `${e.my.active.answered}/${e.questionCount} cevaplandı`,
    };
  }
  if (e.availability === "upcoming") {
    return { kind: "upcoming", primary: { label: "Kuralları gör", href: rules(), variant: "secondary" }, secondary: null, status: "Henüz açılmadı" };
  }
  if (official?.status === "completed") {
    const net = official.resultLocked ? "Sonuç bekliyor" : `${fmtNet(official.score)} net`;
    const rank = official.resultLocked ? null : rankSentence(official.rank, official.total);
    return {
      kind: "done",
      primary: resultHref ? { label: official.resultLocked ? "Teslimi gör" : "Sonucunu gör", href: resultHref, variant: "secondary" } : null,
      secondary: e.canStartPractice
        ? { label: "Tekrar çöz", href: rules("practice") }
        : e.availability === "closed"
          ? { label: "Sıralama", href: `/siralama/${e.id}` }
          : null,
      status: rank ? `${net} · ${rank}` : net,
    };
  }
  if (e.isPremium && !e.canStartOfficial && e.availability === "open") {
    return { kind: "locked", primary: { label: "Premium ile aç", href: "/premium", variant: "secondary" }, secondary: null, status: participants };
  }
  if (e.availability === "closed") {
    return {
      kind: e.publishMode === "takvimli" ? "weekly_missed" : "closed",
      primary: e.canStartPractice ? { label: "Pratik olarak çöz", href: rules("practice"), variant: "secondary" } : null,
      secondary: { label: "Sıralama", href: `/siralama/${e.id}` },
      status: `Sıralama kapandı · ${e.participantCount.toLocaleString("tr-TR")} katıldı`,
    };
  }
  return {
    kind: "new",
    primary: e.canStartOfficial ? { label: "Başla", href: rules(), variant: "primary" } : null,
    secondary: null,
    status: participants,
  };
}

/** Hero seçimi (Doc 50 M1): devam eden > sıradaki haftalık > sakin boşluk. */
export function heroFor(exams: ExamListItem[]): { kind: "active"; exam: ExamListItem } | { kind: "weekly"; exam: ExamListItem } | { kind: "calm" } {
  const active = exams.find((e) => e.myState === "in_progress" && e.my.active);
  if (active) return { kind: "active", exam: active };
  const weekly = exams
    .filter((e) => e.publishMode === "takvimli" && e.availability !== "closed")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  if (weekly) return { kind: "weekly", exam: weekly };
  return { kind: "calm" };
}

/** Dört grup (Doc 50 M1). Haftalık: açık ve kapanmış takvimli denemeler, yeni önce. */
export function groupExams(exams: ExamListItem[]) {
  const serbest = exams.filter((e) => e.publishMode === "serbest");
  const haftalik = exams.filter((e) => e.publishMode === "takvimli");
  return { serbest, haftalik };
}
