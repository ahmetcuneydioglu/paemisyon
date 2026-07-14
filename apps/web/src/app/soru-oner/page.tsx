import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Soru Öner" };

export default async function SoruOnerPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/giris");
  return (
    <div>
      <h2 className="head2">Soru Öner</h2>
      <EmptyState
        icon="icon-question"
        title="Soru önerisi hazırlanıyor"
        message="Önerdiğin sorular editör onayından geçtikten sonra soru bankasına katılacak. (Faz 7)"
      />
    </div>
  );
}
