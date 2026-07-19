import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, type QuestionOfDay } from "@/lib/public-api";
import { QuestionOfDayCard } from "@/components/question-of-day";

export const metadata: Metadata = {
  title: "Günün Sorusu — Her Gün 1 Çıkmış Polis Sınavı Sorusu",
  description:
    "Her gün müfredattan seçilmiş 1 kaynaklı çıkmış soru: çöz, açıklamasını oku, serini başlat. PAEM ve Misyon adayları için günlük alışkanlık.",
  alternates: { canonical: "/gunun-sorusu" },
};

/**
 * Günün sorusu tam sayfası (Doc 23) — paylaşılabilir günlük URL, alışkanlık kancası.
 * STATİK/ISR: istek durumu okunmaz; giriş durumu kartta istemcide sezilir (CTA için).
 */
export default async function GununSorusuPage() {
  const qotd = await publicApi<QuestionOfDay>("/public/question-of-day", 600).catch(
    () => null,
  );

  return (
    <div className="bg-(--color-navy-dark) px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading mb-2 text-2xl font-bold text-white">🎯 Günün Sorusu</h1>
        <p className="mb-8 text-white/70">
          Her gün müfredattan 1 kaynaklı çıkmış soru. Yarın yenisi burada.
        </p>
        {qotd ? (
          <QuestionOfDayCard question={qotd} />
        ) : (
          <p className="text-white/70">
            Günün sorusu şu an yüklenemedi —{" "}
            <Link href="/denemeler" className="font-bold text-white underline">
              denemelere göz at
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
