import type { Metadata } from "next";
import { LawLibrary } from "@/components/atlas/law-library";
import { publicApi, type LawSummary } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Kanun Kütüphanesi — Polis Sınavlarında Çıkan Mevzuat",
  description:
    "PAEM ve Misyon sınavlarında sorumlu olduğun tüm kanun ve yönetmelikler: hangi sınavda hangi ağırlıkla çıkıyor, kaç çıkmış soru var — kanun kanun çalış.",
  alternates: { canonical: "/kanunlar" },
};

/**
 * Kanun kütüphanesi — ANON/SEO sürümü (public kabuk, statik/ISR). Girişli
 * kullanıcı middleware ile /calisma/kanunlar app kabuğuna rewrite'lanır; URL
 * /kanunlar kalır (aynı URL iki derinlik, Doc 27). İstek durumu OKUNMAZ → edge cache.
 */
export default async function KanunlarPage() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(
    () => [] as LawSummary[],
  );
  return <LawLibrary laws={laws} />;
}
