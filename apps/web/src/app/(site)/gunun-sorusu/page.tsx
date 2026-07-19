import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, type DailyQuiz } from "@/lib/public-api";
import { DailyQuizCard } from "@/components/daily-quiz";

export const metadata: Metadata = {
  title: "Günün Quizi — 10 Çıkmış Polis Sınavı Sorusu",
  description:
    "Her gün müfredattan seçilmiş 10 kaynaklı çıkmış soru: çöz, açıklamalarını oku, serini başlat. PAEM ve Misyon adayları için günlük alışkanlık.",
  alternates: { canonical: "/gunun-sorusu" },
};

/**
 * Günün Quizi tam sayfası (Doc 23) — paylaşılabilir günlük URL, alışkanlık kancası.
 * STATİK/ISR: istek durumu okunmaz; giriş durumu kartta istemcide sezilir (CTA için).
 */
export default async function GununQuiziPage() {
  const quiz = await publicApi<DailyQuiz>("/public/daily-quiz", 600).catch(() => null);

  return (
    <div className="bg-(--color-navy-dark) px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading mb-2 text-2xl font-bold text-white">🎯 Günün Quizi</h1>
        <p className="mb-8 text-white/70">
          Her gün müfredattan 10 kaynaklı çıkmış soru. Yarın yenisi burada.
        </p>
        {quiz && quiz.count > 0 ? (
          <DailyQuizCard quiz={quiz} />
        ) : (
          <p className="text-white/70">
            Günün quizi şu an yüklenemedi —{" "}
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
