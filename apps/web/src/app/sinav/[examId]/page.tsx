import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Sınav", robots: { index: false } };

/** Sınav çözme — giriş zorunlu (eski davranış). Motor Faz 4'te. */
export default async function SinavPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/giris");
  return (
    <EmptyState
      icon="icon-timer"
      title="Sınav ekranı hazırlanıyor"
      message="İki sütunlu soru düzeni, sarı süre sayacı ve Testi Bitir akışı Faz 4'te burada olacak."
    />
  );
}
