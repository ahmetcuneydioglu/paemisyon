import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, type DailyQuiz } from "@/lib/public-api";
import { DailyQuizCard } from "@/components/daily-quiz";
import { getPricing } from "@/lib/pricing";
import { PageFrame, PageIntro } from "@/components/public/page-frame";

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
  const [quiz, pricing] = await Promise.all([
    publicApi<DailyQuiz>("/public/daily-quiz", 600).catch(() => null),
    getPricing(),
  ]);

  return (
    <PageFrame width="narrow" className="flex flex-col gap-8">
      <PageIntro
        align="center"
        eyebrow="Her gün yeni"
        title="Günün Quizi"
        lead="Her gün müfredattan 10 kaynaklı çıkmış soru. Yarın yenisi burada."
      />
      {quiz && quiz.count > 0 ? (
        <DailyQuizCard quiz={quiz} freeDailyLimit={pricing.freeDailyLimit} />
      ) : (
        <p className="type-body text-center text-ink-soft">
          Günün quizi şu an yüklenemedi —{" "}
          <Link
            href="/denemeler"
            className="font-semibold text-accent-ink underline"
          >
            denemelere göz at
          </Link>
          .
        </p>
      )}
    </PageFrame>
  );
}
