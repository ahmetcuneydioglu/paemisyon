import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Sınav Sonucu", robots: { index: false } };

export default async function SonucPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/giris");
  return (
    <EmptyState
      title="Sonuç ekranı hazırlanıyor"
      message="Puan / Doğru / Yanlış / Boş kutuları ve soru incelemesi Faz 5'te burada olacak."
    />
  );
}
