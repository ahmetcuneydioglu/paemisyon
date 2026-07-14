import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { PublicCatalogModule } from "@/lib/types";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = { title: "Soru Öner" };
export const dynamic = "force-dynamic";

export default async function SoruOnerPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/giris");

  const catalog = await api<PublicCatalogModule[]>("/questions/catalog", { auth: false }).catch(
    () => [] as PublicCatalogModule[],
  );

  return (
    <div>
      <h2 className="head2">Soru Öner</h2>
      <p className="mx-auto max-w-2xl px-4 pt-4 text-center text-[13px] text-neutral-500">
        Bildiğin güzel bir soruyu paylaş — editör onayından geçince soru bankasına eklenir.
      </p>
      <SuggestForm catalog={catalog} />
    </div>
  );
}
