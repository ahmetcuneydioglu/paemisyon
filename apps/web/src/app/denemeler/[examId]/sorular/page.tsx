import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Sınav Soruları", robots: { index: false } };

export default function SorularPage() {
  return (
    <EmptyState
      icon="icon-question"
      title="Soru görüntüleme hazırlanıyor"
      message="Sınav bittikten sonra sorular (cevapsız) burada incelenebilecek. (Faz 5)"
    />
  );
}
