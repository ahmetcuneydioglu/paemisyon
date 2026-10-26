"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
  CATEGORY_HINT, REMINDER_PRESETS, type NotificationCategory, type NotificationSettings,
} from "@/lib/notifications";
import { pushAboneOl, pushAbonelikBirak, pushDurumu, type PushDurumu } from "@/lib/web-push";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Notice } from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";

const INPUT =
  "type-body mt-1 h-11 w-28 rounded-control border border-line bg-surface px-3.5 text-ink outline-none focus:border-ink-soft";
const ORDER: NotificationCategory[] = [
  "daily_question", "study_reminder", "streak", "exam", "exam_countdown", "new_content",
  "achievement", "statistics", "leaderboard", "question_report", "system",
];

type Patch = Partial<Pick<NotificationSettings, "reminderTime" | "quietStart" | "quietEnd" | "pushEnabled">> & {
  categories?: Partial<Record<NotificationCategory, boolean>>;
};

export function NotificationPreferencesForm({ initial }: { initial: NotificationSettings }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [browserPush, setBrowserPush] = useState<PushDurumu | null>(null);
  const [custom, setCustom] = useState(!REMINDER_PRESETS.includes(initial.reminderTime as (typeof REMINDER_PRESETS)[number]));

  // Tarayıcı izni yalnız istemcide bilinir; ilk render sunucuda, bu yüzden tembel okunur.
  const browser = browserPush ?? (typeof window === "undefined" ? "kapali" : pushDurumu());
  const webDevice = s.devices.some((d) => d.platform === "web");

  const save = async (patch: Patch, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const next = await apiClient<NotificationSettings>("/me/notifications/settings", { method: "PATCH", body: patch });
      setS(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(null);
    }
  };

  const toggleBrowserPush = async (on: boolean) => {
    setBusy("browser");
    setError(null);
    try {
      if (on) {
        const token = await pushAboneOl((t) => apiClient("/me/push-token", { method: "POST", body: { token: t, platform: "web" } }));
        if (!token) setError("Tarayıcı izni verilmedi. Adres çubuğundaki kilit simgesinden bildirimlere izin verip tekrar dene.");
      } else {
        await pushAbonelikBirak((token) => apiClient("/me/push-token", { method: "DELETE", body: { token } }));
      }
      setBrowserPush(pushDurumu());
      const next = await apiClient<NotificationSettings>("/me/notifications/settings");
      setS(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirim ayarı değiştirilemedi.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? <Notice tone="error">{error}</Notice> : null}

      <Card>
        <CardTitle>Push bildirimleri</CardTitle>
        <div className="mt-3 flex flex-col divide-y divide-line">
          <Row
            title="Bu tarayıcı"
            subtitle={
              browser === "desteklenmiyor"
                ? "Bu tarayıcı web push desteklemiyor (iOS Safari'de site ana ekrana eklenmeli)."
                : browser === "kapali"
                  ? "Web push yapılandırılmadı."
                  : webDevice && browser === "verildi"
                    ? "Açık · bu tarayıcı kayıtlı"
                    : browser === "reddedildi"
                      ? "Tarayıcı izni reddedilmiş; site ayarlarından açabilirsin."
                      : "Kapalı"
            }
            trailing={
              <Switch
                label="Bu tarayıcıda push"
                checked={webDevice && browser === "verildi"}
                disabled={busy === "browser" || browser === "desteklenmiyor" || browser === "kapali"}
                onChange={toggleBrowserPush}
              />
            }
          />
          <Row
            title="Tüm cihazlarda push"
            subtitle={
              s.devices.length
                ? `${s.devices.map((d) => (d.platform === "web" ? "tarayıcı" : d.platform === "ios" ? "iPhone" : "Android")).join(" · ")} — mobil uygulama kendi cihazını kaydeder`
                : "Kayıtlı cihaz yok; mobil uygulamadan izin ver"
            }
            trailing={<Switch label="Push ana anahtarı" checked={s.pushEnabled} disabled={busy === "pushEnabled"} onChange={(v) => save({ pushEnabled: v }, "pushEnabled")} />}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Hatırlatma saati ve sessiz saat</CardTitle>
        <p className="type-body-sm mt-1 text-ink-soft">Günde en fazla bir hatırlatma; seçtiğin saatte, Türkiye saatiyle.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REMINDER_PRESETS.map((h) => (
            <Chip key={h} label={h} selected={!custom && s.reminderTime === h} disabled={busy === "reminderTime"} onClick={() => { setCustom(false); void save({ reminderTime: h }, "reminderTime"); }} />
          ))}
          <Chip label="Başka saat…" selected={custom} onClick={() => setCustom(true)} />
          {custom ? (
            <input
              type="time"
              aria-label="Hatırlatma saati"
              className={`${INPUT} mt-0`}
              defaultValue={s.reminderTime}
              onBlur={(e) => e.target.value && e.target.value !== s.reminderTime && save({ reminderTime: e.target.value }, "reminderTime")}
            />
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <label className="block">
            <span className="type-label text-ink-subtle">Sessiz saat başlangıcı</span>
            <input type="time" className={INPUT} defaultValue={s.quietStart} onBlur={(e) => e.target.value && e.target.value !== s.quietStart && save({ quietStart: e.target.value }, "quiet")} />
          </label>
          <label className="block">
            <span className="type-label text-ink-subtle">Bitiş</span>
            <input type="time" className={INPUT} defaultValue={s.quietEnd} onBlur={(e) => e.target.value && e.target.value !== s.quietEnd && save({ quietEnd: e.target.value }, "quiet")} />
          </label>
        </div>
        <p className="type-body-sm mt-2 text-ink-subtle">Sessiz saatte yalnız acil sistem bildirimi geçer; diğerleri sabaha ertelenir ya da düşer.</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Kategoriler</CardTitle>
          <button
            type="button"
            className="type-body-sm text-accent-ink hover:underline"
            disabled={busy === "all"}
            onClick={() => save({ categories: Object.fromEntries(ORDER.filter((c) => s.policy[c].optional).map((c) => [c, true])) }, "all")}
          >
            Hepsini aç
          </button>
        </div>
        <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
          {ORDER.map((c) => (
            <Row
              key={c}
              title={s.policy[c].label}
              subtitle={CATEGORY_HINT[c]}
              trailing={
                s.policy[c].optional ? (
                  <Switch label={s.policy[c].label} checked={s.categories[c]} disabled={busy === c} onChange={(v) => save({ categories: { [c]: v } }, c)} />
                ) : (
                  <span className="type-body-sm text-ink-subtle">Her zaman açık</span>
                )
              }
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>E-posta</CardTitle>
        {s.email ? (
          <div className="mt-2 flex flex-col divide-y divide-line">
            <Row title="Duyurular ve haftalık rapor" subtitle="Ürün bilgilendirmesi, haftalık raporun, deneme hatırlatması" trailing={<Tag on={s.email.topics.duyuru} />} />
            <Row title="Kampanyalar" subtitle="Premium ve kampanya e-postaları · ayrı rıza (KVKK)" trailing={<Tag on={s.email.topics.kampanya} />} />
            <div className="pt-3">
              <a href={s.email.preferencesUrl} className="type-body-sm text-accent-ink hover:underline">
                E-posta tercihlerini düzenle veya hepsinden çık →
              </a>
            </div>
          </div>
        ) : (
          <p className="type-body-sm mt-1 text-ink-soft">E-posta kaydın henüz yok; ilk e-posta bildirimiyle açılır.</p>
        )}
      </Card>

      <p className="type-body-sm text-ink-subtle">
        7 gün cevap vermezsen push haftada ikiye düşer, 30 gün sonra yalnız haftalık e-posta kalır. Push ile asla premium teklifi göndermeyiz.
      </p>
    </div>
  );
}

function Row({ title, subtitle, trailing }: { title: string; subtitle: string; trailing: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-subhead text-ink">{title}</span>
        <span className="type-body-sm text-ink-soft">{subtitle}</span>
      </div>
      {trailing}
    </div>
  );
}

function Tag({ on }: { on: boolean }) {
  return (
    <span className={`type-label rounded-pill px-2 py-1 ${on ? "bg-success-soft text-success-ink" : "bg-surface-alt text-ink-subtle"}`}>
      {on ? "Açık" : "Kapalı"}
    </span>
  );
}
