import type { Metadata } from "next";
import { LawLibrary } from "@/components/atlas/law-library";
import { publicApi, type LawSummary } from "@/lib/public-api";

// İç (rewrite hedefi) rota — Google bunu görmez (URL /kanunlar kalır + auth korumalı).
export const metadata: Metadata = { robots: { index: false } };

/**
 * Kanun kütüphanesi — GİRİŞLİ sürüm (app kabuğu = sidebar). Middleware girişli
 * kullanıcının /kanunlar isteğini buraya rewrite eder. İçerik anon ile aynı liste,
 * yalnız kabuk farklı (Doc 27 aynı URL iki derinlik).
 */
export default async function CalismaKanunlarPage() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(
    () => [] as LawSummary[],
  );
  return <LawLibrary laws={laws} />;
}
