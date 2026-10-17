import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { PublicCatalogModule } from "@/lib/types";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = { title: "Soru Öner" };
export const dynamic = "force-dynamic";

export default async function SoruOnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const catalog = await api<PublicCatalogModule[]>("/questions/catalog", {
    auth: false,
    next: { revalidate: 3600 },
  }).catch(() => [] as PublicCatalogModule[]);

  return (
    <PageFrame width="narrow" className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Katkı"
        title="Soru öner"
        lead="Bildiğin güzel bir soruyu paylaş — editör onayından geçince soru bankasına eklenir."
      />
      <SuggestForm catalog={catalog} />
    </PageFrame>
  );
}
