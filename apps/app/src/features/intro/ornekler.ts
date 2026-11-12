import type { ExamListItem } from "@/features/exams/queries";
import type { Flashcard } from "@/features/flashcards/queries";
import type { RouteRow } from "@/components/domain/route-list";
import type { WeekDayState } from "@/features/home/queries";
import type { MerkezLaw } from "@/features/mevzuat/queries";
import type { SummaryUnitListItem } from "@/features/summaries/queries";

/**
 * Tanıtım (Figma "Tanıtım v2", 147:401) örnek verisi. Slaytlar uygulamanın GERÇEK alan
 * bileşenleriyle çizilir; içerik bankadan alındı (11 Kas 2026): Anayasa bilgi kartı ve "Genel
 * esaslar" özet ünitesi yayında, Polis Mevzuatı 75 test, "Haftalık Deneme-1" 100 soru/100 dk,
 * PVSK/CMK doğrulama tarihleri. Gün şeridi, rota durumu ve yüzdeler temsilîdir.
 * Kural: buradaki iddialar ürünün gerçekte yaptığı şeyle sınırlıdır (kaynak etiketi yok).
 */

export const ornekHafta: WeekDayState[] = ["done", "done", "today", "future", "future", "future", "future"];

export const ornekRota: RouteRow[] = [
  { key: "soru", label: "Anayasa ile 10 soru", detail: "10/10 · %80 doğru", estimateMin: 3, done: true, onPress: null },
  { key: "ozet", label: "Seçim ve milletvekilliği özeti", detail: "Anayasa", estimateMin: 12, done: false, onPress: null },
  { key: "quiz", label: "Günün Quizi", detail: "10 soru", estimateMin: 3, done: false, onPress: null },
];

export const ornekKart: Flashcard = {
  id: "tanitim-kart",
  kind: "numeric",
  front: "Türkiye Büyük Millet Meclisi kaç milletvekilinden oluşur?",
  back: "600 milletvekili; genel oyla seçilir.",
  explanation: null,
  difficulty: 1,
  topic: { id: "tanitim", name: "T.C. Anayasası" },
  unit: null,
  articles: [{ no: "75", title: "Türkiye Büyük Millet Meclisinin kuruluşu", legislationSlug: null }],
  bookmarked: false,
  state: { state: "learning", due: false, hard: false, dueAt: null },
};

export const ornekDeste = { total: 51, learned: 18, learning: 9, new: 24 };

export const ornekOzet: SummaryUnitListItem = {
  slug: "tanitim-genel-esaslar",
  title: "Genel esaslar",
  subtitle: null,
  articleFrom: "1",
  articleTo: "11",
  readingMinutes: 12,
  isPremium: false,
  locked: false,
  blockCount: 8,
  progress: null,
};

export const ornekTestler = [
  { number: 1, state: "done", questionCount: 20, pct: 80, correct: 16, wrong: 4, answered: 20 },
  { number: 2, state: "progress", questionCount: 20, pct: null, correct: null, wrong: null, answered: 12 },
  { number: 3, state: "new", questionCount: 20, pct: null, correct: null, wrong: null, answered: null },
  { number: 4, state: "locked", questionCount: 20, pct: null, correct: null, wrong: null, answered: null },
] as const;

export const ornekDeneme: ExamListItem = {
  id: "tanitim-deneme",
  title: "Haftalık Deneme-1",
  description: null,
  startAt: "2026-11-03T18:00:00.000Z",
  endAt: "2026-11-03T21:00:00.000Z",
  durationMinutes: 100,
  questionCount: 100,
  isPremium: false,
  questionsOpenAfterEnd: true,
  archiveOpenAfterEnd: true,
  state: "active",
  participantCount: 312,
  avgScore: null,
  myAttempt: null,
  myArchiveAttempt: null,
  publishMode: "takvimli",
  difficulty: null,
  examTypeId: null,
  liveAnswerReveal: false,
  practiceAfterEnd: true,
  availability: "open",
  myState: "new",
  canStartOfficial: true,
  canStartPractice: false,
  my: { official: null, active: null, practiceCount: 0, lastPractice: null },
};

export const ornekSiralama = [
  { rank: 1, name: "Mert K.", score: "82,50", wrong: 9, duration: "96 dk" },
  { rank: 14, name: "Sen", score: "71,25", wrong: 17, duration: "88 dk", highlight: true },
  { rank: 15, name: "Ayşe D.", score: "70,75", wrong: 18, duration: "99 dk" },
];

const law = (l: Partial<MerkezLaw> & Pick<MerkezLaw, "slug" | "number" | "name" | "articleCount" | "lastVerifiedAt">): MerkezLaw => ({
  type: "kanun",
  shortName: null,
  topicId: null,
  questionCount: 0,
  courseName: null,
  inExam: true,
  percent: 0,
  lastRead: null,
  ...l,
});

export const ornekKanunlar: MerkezLaw[] = [
  law({ slug: "pvsk", number: "2559", name: "Polis Vazife ve Salâhiyet Kanunu", shortName: "PVSK", articleCount: 42, lastVerifiedAt: "2026-11-11T02:33:37Z", percent: 38, lastRead: { no: "4/A", title: "Durdurma", index: 15, updatedAt: "2026-11-11T08:00:00Z" } }),
  law({ slug: "cmk", number: "5271", name: "Ceza Muhakemesi Kanunu", shortName: "CMK", articleCount: 349, lastVerifiedAt: "2026-09-23T21:24:15Z" }),
];

export const ornekDevam = { slug: "pvsk", lawShort: "PVSK", no: "4/A", title: "Durdurma", percent: 38, articleCount: 42, index: 15 };
