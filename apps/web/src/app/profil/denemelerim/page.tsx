import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Denemelerim", robots: { index: false } };

export default async function DenemelerimPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/giris");
  return (
    <div>
      <h2 className="head2">Denemelerim</h2>
      <EmptyState
        icon="icon-calendar"
        title="Geçmişin hazırlanıyor"
        message="Çözdüğün denemeler ve sonuçların burada listelenecek — iOS'ta çözdüklerin dahil. (Faz 5)"
      />
    </div>
  );
}
