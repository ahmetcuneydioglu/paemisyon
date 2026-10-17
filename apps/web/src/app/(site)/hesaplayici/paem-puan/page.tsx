import type { Metadata } from "next";
import { publicApi, type ExamGuide } from "@/lib/public-api";
import { ScoreCalculator } from "@/components/score-calculator";
import {
  PageFrame,
  PageIntro,
  ClosingCta,
} from "@/components/public/page-frame";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "PAEM Net ve Puan Hesaplayıcı",
  description:
    "PAEM sınavı net hesaplama: doğru–yanlış sayını gir, netini ve bölüm ağırlıklarına göre tahminî skorunu anında gör. Ücretsiz, kayıt gerektirmez.",
  alternates: { canonical: "/hesaplayici/paem-puan" },
};

export const revalidate = 3600;

/** 100 soruluk sınav varsayımıyla bölüm ağırlıkları soru sayısına birebir eşlenir. */
export default async function PaemPuanPage() {
  const guide = await publicApi<ExamGuide>(
    "/public/exam-types/paem",
    3600,
  ).catch(() => null);
  const sections =
    guide?.sections.map((s) => ({
      name: s.name,
      weightPercent: s.weightPercent,
    })) ?? [];

  return (
    <PageFrame className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Hesaplayıcı"
        title="PAEM Net & Skor Hesaplayıcı"
        lead="Bölüm bölüm doğru–yanlış sayını gir; netin ve bölüm ağırlıklarına göre 100 üzerinden tahminî skorun anında hesaplanır."
      />

      {sections.length > 0 ? (
        <ScoreCalculator sections={sections} totalQuestions={100} />
      ) : (
        <p className="type-body text-ink-soft">
          Bölüm bilgileri yüklenemedi, lütfen sonra tekrar dene.
        </p>
      )}

      <ClosingCta
        title="Netini yükseltmek ister misin?"
        body="Zayıf bölümlerini kişisel koçunla tespit et, kaynaklı çıkmış sorularla kapat."
        actions={
          <>
            <ButtonLink href="/kayit">Ücretsiz kayıt ol</ButtonLink>
            <ButtonLink href="/paem" variant="ghost">
              PAEM rehberi
            </ButtonLink>
          </>
        }
      />
    </PageFrame>
  );
}
