/** Konu anlatımı (Doc 57) — API `/public/lessons/*` yanıtlarıyla birebir. Kaynak künyesi dönmez. */
export type LessonBlock = { kind: "text"; text: string } | { kind: "table"; headers: string[]; rows: string[][] };
export interface LessonBodySection {
  title: string;
  blocks: LessonBlock[];
}
export interface LessonProgressInfo {
  offset: number;
  readAt: string | null;
}
export interface LessonListItem {
  slug: string;
  title: string;
  goal: string;
  readingMinutes: number;
  version: number;
  progress: LessonProgressInfo | null;
}
export interface LessonSectionItem {
  slug: string;
  title: string;
  subtitle: string | null;
  isPremium: boolean;
  locked: boolean;
  lessons: LessonListItem[];
}
export interface LessonSource {
  kind: "book" | "url" | "article";
  label: string;
  url: string | null;
  page: string | null;
  lawArticleId: string | null;
}
export interface LessonDetail {
  slug: string;
  title: string;
  goal: string;
  readingMinutes: number;
  version: number;
  section: { slug: string; title: string; isPremium: boolean; lessonCount: number };
  order: number;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  locked: boolean;
  body: { sections: LessonBodySection[] } | null;
  sources: LessonSource[];
  progress: LessonProgressInfo | null;
}

/** SEO açıklaması: hedef + bölüm adı, 160 karakter. */
export function lessonDescription(l: Pick<LessonDetail, "goal" | "section" | "readingMinutes">): string {
  const s = `${l.goal} ${l.section.title} bölümü, ${l.readingMinutes} dk okuma.`;
  return s.length > 160 ? `${s.slice(0, 157).replace(/\s+\S*$/, "")}…` : s;
}
