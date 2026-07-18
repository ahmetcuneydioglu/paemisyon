import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi, type ExamGuide } from "@/lib/public-api";
import { ExamGuideBody } from "@/components/exam-guide";

export const metadata: Metadata = {
  title: "Misyon Koruma Sınavı Rehberi — Bölümler, Ağırlıklar, Konular",
  description:
    "Misyon koruma sınavı: bölüm ağırlıkları, ders ve kanun listesi, kaynaklı çıkmış sorular. Protokol ve silah bilgisi dahil tüm müfredatı gör, hazırlığa başla.",
  alternates: { canonical: "/misyon" },
};

export const revalidate = 3600;

export default async function MisyonPage() {
  const guide = await publicApi<ExamGuide>("/public/exam-types/misyon", 3600).catch(() => null);
  if (!guide) notFound();
  return <ExamGuideBody guide={guide} />;
}
