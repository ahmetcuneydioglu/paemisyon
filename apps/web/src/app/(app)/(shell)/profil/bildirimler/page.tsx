import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { NotificationSettings } from "@/lib/notifications";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export const metadata: Metadata = { title: "Bildirim Tercihleri", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Profil › Bildirimler (Doc 52 §9, Figma W2): push, saat, kategoriler, e-posta. */
export default async function NotificationPreferencesPage() {
  const settings = await api<NotificationSettings>("/me/notifications/settings");
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <Breadcrumb className="mb-3" items={[{ label: "Ben", href: "/profil" }, { label: "Bildirimler" }]} />
      <h1 className="type-title text-ink">Bildirim tercihleri</h1>
      <p className="type-body-sm mt-1 mb-5 text-ink-soft">
        Mobil ve web aynı tercihleri kullanır; değişiklik anında geçerli. Günde en fazla bir hatırlatma gönderiyoruz.
      </p>
      <NotificationPreferencesForm initial={settings} />
    </div>
  );
}
