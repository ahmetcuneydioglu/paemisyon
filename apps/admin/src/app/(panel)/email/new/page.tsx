"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { CampaignForm, EMPTY } from "../campaign-form";

export default function NewEmailCampaignPage() {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="Yeni e-posta kampanyası"
        subtitle="Önce taslak; sonra önizleme, test postası, kitle onayı ve başlatma."
        action={
          <Link href="/email" className="text-sm underline">
            ← E-posta
          </Link>
        }
      />
      <Card>
        <CampaignForm
          initial={EMPTY}
          locked={false}
          onSaved={(c) => router.push(`/email/${c.id}`)}
        />
      </Card>
    </div>
  );
}
