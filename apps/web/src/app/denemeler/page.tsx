import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Denemeler",
  description: "Yaklaşan ve geçmiş online polislik deneme sınavları.",
  alternates: { canonical: "/denemeler" },
};

export default function DenemelerPage() {
  return (
    <div>
      <h2 className="head2">Sınavlar</h2>
      <EmptyState
        icon="icon-test"
        title="Henüz deneme yok"
        message="Yayınlanan denemeler burada listelenecek: tarih, saat, katılım ve ortalamalarıyla. (Faz 3)"
      />
    </div>
  );
}
