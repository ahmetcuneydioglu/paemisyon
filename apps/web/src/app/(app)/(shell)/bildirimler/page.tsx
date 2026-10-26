import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { NotificationSettings } from "@/lib/notifications";
import { Card, CardTitle } from "@/components/ui/card";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Bildirimler", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Bildirim kutusu (Doc 52 §9, Figma W1): liste + tercih özeti rayı. */
export default async function NotificationsPage() {
  const settings = await api<NotificationSettings>("/me/notifications/settings").catch(() => null);
  const devices = settings?.devices ?? [];
  const pushLine = !settings
    ? "—"
    : !settings.pushEnabled
      ? "Kapalı (tercih)"
      : devices.length === 0
        ? "Cihaz yok"
        : `Açık · ${devices.map((d) => (d.platform === "web" ? "bu tarayıcı" : d.platform === "ios" ? "iPhone" : "Android")).join(" + ")}`;
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_328px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="type-label text-accent-ink">Bugün</span>
          <h1 className="type-title text-ink">Bildirimler</h1>
          <p className="type-body-sm text-ink-soft">Deneme sonuçların, günün sorusu ve hatırlatmaların. Dokununca ilgili ekrana gider.</p>
        </div>
        <NotificationList />
      </div>
      <aside className="flex flex-col gap-4 lg:pt-16">
        <Card>
          <CardTitle>Bildirim tercihlerin</CardTitle>
          <dl className="type-body-sm mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
            <dt className="text-ink-subtle">Push</dt>
            <dd className="text-ink">{pushLine}</dd>
            <dt className="text-ink-subtle">Hatırlatma</dt>
            <dd className="text-ink">{settings?.reminderTime ?? "19:00"}</dd>
            <dt className="text-ink-subtle">Sessiz saat</dt>
            <dd className="text-ink">{settings ? `${settings.quietStart} – ${settings.quietEnd}` : "23:00 – 08:00"}</dd>
            <dt className="text-ink-subtle">E-posta</dt>
            <dd className="text-ink">
              {settings?.email ? (settings.email.subscribed ? `${settings.email.topics.duyuru ? "duyurular" : ""}${settings.email.topics.duyuru && settings.email.topics.kampanya ? " ve " : ""}${settings.email.topics.kampanya ? "kampanyalar" : ""} açık` : "kapalı") : "kayıt yok"}
            </dd>
          </dl>
          <Link href="/profil/bildirimler" className="type-body-sm mt-3 inline-block text-accent-ink hover:underline">
            Tercihleri düzenle →
          </Link>
        </Card>
        <Card tone="accent">
          <CardTitle>Günde en fazla bir hatırlatma</CardTitle>
          <p className="type-body-sm mt-1 text-ink-soft">
            Sessiz saatte hiçbir şey çalmaz. 7 gün cevap vermezsen kendiliğinden seyreltiriz; 30 gün sonra yalnız haftalık e-posta kalır.
          </p>
        </Card>
      </aside>
    </div>
  );
}
