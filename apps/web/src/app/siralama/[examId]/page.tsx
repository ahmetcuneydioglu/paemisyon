import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Sıralama" };

export default function SiralamaPage() {
  return (
    <div>
      <h2 className="head2">Sınav Sıralaması</h2>
      <EmptyState
        icon="icon-user"
        title="Sıralama hazırlanıyor"
        message="İlk 3 podyumu ve tam sıralama tablosu Faz 5'te burada olacak."
      />
    </div>
  );
}
