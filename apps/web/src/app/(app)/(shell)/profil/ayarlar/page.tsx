import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MeProfile } from "@/lib/public-api";
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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link
        href="/profil"
        className="text-[13px] font-bold text-brand hover:underline"
      >
        ← Profile dön
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
        Profil ve ayarlar
      </h1>
      <p className="mt-1 mb-5 text-[14px] text-ink-soft">
        Kimliğini, hedefini ve hesap güvenliğini yönet.
      </p>
      <ProfileSettingsForm profile={profile} modules={modules} />
    </div>
  );
}
