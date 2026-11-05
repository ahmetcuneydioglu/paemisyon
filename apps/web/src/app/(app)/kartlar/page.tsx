import type { Metadata } from "next";
import { isFlashcardMode, isFlashcardSource } from "@/lib/kartlar";
import { FlashcardPlayer } from "@/components/kartlar/flashcard-player";

export const metadata: Metadata = { title: "Bilgi kartları", robots: { index: false } };

/**
 * /kartlar — bilgi kartı oynatıcısı (Doc 56), L3 Odak (seans ile aynı kabuk). Kapsam query ile
 * gelir: courseId | topicId | unitSlug (boş = tüm kartlar), mode, resume=1, source, scope etiketi.
 * Query seti değişince oynatıcı REMOUNT olur (taze oturum); `n` nonce'u aynı sorguyu yeniler.
 */
export default async function KartlarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const mode = one(p.mode);
  const source = one(p.source);
  const key = [one(p.topicId), one(p.courseId), one(p.unitSlug), mode, one(p.resume), one(p.n)].join("|");
  return (
    <FlashcardPlayer
      key={key}
      scope={{ courseId: one(p.courseId) || undefined, topicId: one(p.topicId) || undefined, unitSlug: one(p.unitSlug) || undefined }}
      mode={isFlashcardMode(mode) ? mode : "all"}
      resume={one(p.resume) === "1"}
      source={isFlashcardSource(source) ? source : undefined}
      label={one(p.scope) || undefined}
    />
  );
}
