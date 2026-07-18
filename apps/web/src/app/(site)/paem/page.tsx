import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi, type ExamGuide } from "@/lib/public-api";
import { ExamGuideBody } from "@/components/exam-guide";

export const metadata: Metadata = {
  title: "PAEM Sınavı Rehberi — Bölümler, Ağırlıklar, Konu Listesi",
  description:
    "PAEM (Polis Amirleri Eğitimi Merkezi) sınavı: bölüm ağırlıkları, ders ve kanun listesi, kaynaklı çıkmış sorular. Komiser yardımcılığı yolculuğuna buradan başla.",
  alternates: { canonical: "/paem" },
};

export const revalidate = 3600;

export default async function PaemPage() {
  const guide = await publicApi<ExamGuide>("/public/exam-types/paem", 3600).catch(() => null);
  if (!guide) notFound();
  return <ExamGuideBody guide={guide} />;
}
