import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { MeProfile } from "@/lib/public-api";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProfileSettingsForm } from "../profile-settings-form";

export const metadata: Metadata = {
  title: "Profil Ayarları",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const [profile, modules] = await Promise.all([
    api<MeProfile>("/me"),
    api<{ id: string; name: string }[]>("/catalog/modules"),
  ]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <Breadcrumb
        className="mb-3"
        items={[{ label: "Ben", href: "/profil" }, { label: "Ayarlar" }]}
      />
      <h1 className="type-title text-ink">Profil ve ayarlar</h1>
      <p className="type-body-sm mt-1 mb-5 text-ink-soft">
        Kimliğini, hedefini ve hesap güvenliğini yönet.
      </p>
      <ProfileSettingsForm profile={profile} modules={modules} />
    </div>
  );
}
