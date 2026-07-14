import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Genel Lider Tablosu",
  alternates: { canonical: "/lider-tablosu" },
};

export default function LiderTablosuPage() {
  return (
    <div>
      <h2 className="head2">Genel Lider Tablosu</h2>
      <EmptyState
        icon="icon-user"
        title="Lider tablosu hazırlanıyor"
        message="Tüm denemelerin ortalamasına göre genel sıralama Faz 5'te burada olacak."
      />
    </div>
  );
}
