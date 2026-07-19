import type { Metadata } from "next";
import { SessionPlayer } from "@/components/session/session-player";

export const metadata: Metadata = { title: "Seans", robots: { index: false } };

/**
 * /seans — L3 Odak (Doc 27): kabuksuz tek çalışma odası. Kapsam (Odak modeli)
 * query ile gelir; kapsamsız = koç reçetesi (sunucudaki karışım motoru).
 */
export default async function SeansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const count = Number.parseInt(one(p.count) ?? "", 10);

  // Query seti değişince oynatıcı REMOUNT olur → taze seans başlar. Aksi halde
  // aynı /seans'a gitmek (ör. done ekranından "Yeni seans") remount tetiklemez
  // ve startedRef guard'ı yüzünden hiçbir şey açılmaz. `n` nonce'u bunu çözer.
  const sessionKey = [
    one(p.topicId),
    one(p.courseId),
    one(p.articleNo),
    one(p.mode),
    one(p.resume),
    one(p.count),
    one(p.n),
  ].join("|");

  return (
    <SessionPlayer
      key={sessionKey}
      scope={{
        topicId: one(p.topicId),
        courseId: one(p.courseId),
        articleNo: one(p.articleNo),
        mode:
          one(p.mode) === "review"
            ? "review"
            : one(p.mode) === "favorites"
              ? "favorites"
              : undefined,
        resumeId: one(p.resume),
        label: one(p.scope),
        questionCount: Number.isFinite(count) ? Math.min(50, Math.max(1, count)) : undefined,
      }}
    />
  );
}
