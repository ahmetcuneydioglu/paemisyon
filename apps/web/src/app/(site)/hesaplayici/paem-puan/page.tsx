import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, type ExamGuide } from "@/lib/public-api";
import { ScoreCalculator } from "@/components/score-calculator";

export const metadata: Metadata = {
  title: "PAEM Net ve Puan Hesaplayıcı",
  description:
    "PAEM sınavı net hesaplama: doğru–yanlış sayını gir, netini ve bölüm ağırlıklarına göre tahminî skorunu anında gör. Ücretsiz, kayıt gerektirmez.",
  alternates: { canonical: "/hesaplayici/paem-puan" },
};

export const revalidate = 3600;

/** 100 soruluk sınav varsayımıyla bölüm ağırlıkları soru sayısına birebir eşlenir. */
export default async function PaemPuanPage() {
  const guide = await publicApi<ExamGuide>("/public/exam-types/paem", 3600).catch(() => null);
  const sections =
    guide?.sections.map((s) => ({ name: s.name, weightPercent: s.weightPercent })) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">
        🧮 PAEM Net &amp; Skor Hesaplayıcı
      </h1>
      <p className="mb-6 text-gray-600">
        Bölüm bölüm doğru–yanlış sayını gir; netin ve bölüm ağırlıklarına göre 100 üzerinden
        tahminî skorun anında hesaplanır.
      </p>

      {sections.length > 0 ? (
        <ScoreCalculator sections={sections} totalQuestions={100} />
      ) : (
        <p className="text-gray-500">Bölüm bilgileri yüklenemedi, lütfen sonra tekrar dene.</p>
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-sm">
        <p className="mb-2 font-bold text-(--color-navy)">Netini yükseltmek ister misin?</p>
        <p className="mb-3 text-gray-600">
          Zayıf bölümlerini kişisel koçunla tespit et, kaynaklı çıkmış sorularla kapat.
        </p>
        <Link href="/kayit" className="btn2 btn2-green">Ücretsiz Kayıt Ol</Link>
        <Link href="/paem" className="ml-3 font-bold text-(--color-navy) hover:underline">
          PAEM rehberine bak →
        </Link>
      </div>
    </div>
  );
}
