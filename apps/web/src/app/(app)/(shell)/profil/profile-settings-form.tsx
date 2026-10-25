"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { supabaseBrowser } from "@/lib/supabase/client";
import { pushAbonelikBirak } from "@/lib/web-push";
import type { MeProfile } from "@/lib/public-api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { ThemeToggle } from "@/components/theme-toggle";

const INPUT =
  "type-body mt-1 h-11 w-full rounded-control border border-line bg-surface px-3.5 text-ink outline-none focus:border-ink-soft";

type ModuleOption = { id: string; name: string };

export function ProfileSettingsForm({
  profile,
  modules,
}: {
  profile: MeProfile;
  modules: ModuleOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  async function logout() {
    setLogoutBusy(true);
    // Bu tarayıcının push token'ı sunucudan silinir (mobil çıkışla aynı); oturum
    // kapanmadan önce, çünkü istek oturum ister. Başarısızsa çıkış yine sürer.
    await pushAbonelikBirak((token) =>
      apiClient("/me/push-token", { method: "DELETE", body: { token } }),
    );
    await supabaseBrowser().auth.signOut();
    router.replace("/giris");
    router.refresh();
  }

  async function save(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      await apiClient("/me", {
        method: "PATCH",
        body: {
          displayName: String(formData.get("displayName") ?? "").trim(),
          preferredModuleId: String(formData.get("preferredModuleId") ?? ""),
          dailyGoal: Number(formData.get("dailyGoal")),
          // Günlük süre (Doc 49 S1-D): boş bırakılırsa temizlenir.
          dailyMinutes: formData.get("dailyMinutes")
            ? Number(formData.get("dailyMinutes"))
            : null,
          targetExamDate: String(formData.get("targetExamDate") ?? "") || null,
        },
      });
      setMessage({
        kind: "ok",
        text: "Profil ve çalışma hedeflerin güncellendi.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Ayarlar kaydedilemedi.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    setPasswordMessage(null);
    if (password.length < 8)
      return setPasswordMessage({
        kind: "error",
        text: "Şifre en az 8 karakter olmalı.",
      });
    if (password !== confirmation)
      return setPasswordMessage({
        kind: "error",
        text: "Şifreler eşleşmiyor.",
      });
    setPasswordBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setPasswordBusy(false);
    setPasswordMessage(
      error
        ? {
            kind: "error",
            text: "Şifre değiştirilemedi. Yeniden giriş yapıp tekrar dene.",
          }
        : { kind: "ok", text: "Şifren değiştirildi." },
    );
  }

  async function deleteAccount() {
    if (deleteText.trim().toLocaleUpperCase("tr-TR") !== "SİL") return;
    setDeleteBusy(true);
    try {
      await apiClient("/me", { method: "DELETE" });
      await supabaseBrowser().auth.signOut();
      router.replace("/giris");
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Hesap silinemedi.",
      });
      setDeleteBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Profil ve çalışma hedefi</CardTitle>
        <p className="type-body-sm mt-1 text-ink-soft">
          Koçun önerilerini bu bilgilerle kişiselleştirir.
        </p>
        <form action={save} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Görünen ad"
            name="displayName"
            defaultValue={profile.displayName ?? ""}
            minLength={2}
            maxLength={128}
          />
          <label className="block">
            <span className="type-subhead text-ink">Hedef sınav</span>
            <select
              name="preferredModuleId"
              defaultValue={profile.preferredModule?.id ?? ""}
              required
              className={INPUT}
            >
              <option value="" disabled>
                Seç…
              </option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="type-subhead text-ink">Hedef sınav tarihi</span>
            <input
              name="targetExamDate"
              type="date"
              defaultValue={profile.targetExamDate ?? ""}
              className={INPUT}
            />
            <span className="type-body-sm mt-1 block text-ink-subtle">
              Belli değilse boş bırakabilirsin.
            </span>
          </label>
          <Field
            label="Günlük soru hedefi"
            name="dailyGoal"
            type="number"
            defaultValue={String(profile.dailyGoal)}
            min={5}
            max={200}
          />
          <label className="block">
            <span className="type-subhead text-ink">Günlük çalışma süresi</span>
            <select
              name="dailyMinutes"
              defaultValue={
                profile.dailyMinutes ? String(profile.dailyMinutes) : ""
              }
              className={INPUT}
            >
              <option value="">Seçilmedi</option>
              <option value="15">15 dakika</option>
              <option value="30">30 dakika</option>
              <option value="60">60 dakika</option>
              <option value="90">90 dakika</option>
            </select>
            <span className="type-body-sm mt-1 block text-ink-subtle">
              Koç &quot;bugün 12/30 dk&quot; diyebilsin diye.
            </span>
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy} loading={busy}>
              Değişiklikleri kaydet
            </Button>
            {message && <Status value={message} />}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Görünüm</CardTitle>
            <p className="type-body-sm mt-1 text-ink-soft">
              Cihaz tercihini izle ya da açık/koyu temayı elle seç.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <CardTitle>Şifre değiştir</CardTitle>
        <form
          action={changePassword}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <Field
            label="Yeni şifre"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
          />
          <Field
            label="Yeni şifre tekrar"
            name="confirmation"
            type="password"
            minLength={8}
            autoComplete="new-password"
          />
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="secondary"
              disabled={passwordBusy}
              loading={passwordBusy}
            >
              Şifreyi değiştir
            </Button>
            {passwordMessage && <Status value={passwordMessage} />}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Oturum</CardTitle>
            <p className="type-body-sm mt-1 text-ink-soft">
              Bu cihazdaki oturumunu kapat. Hesabın ve ilerlemen korunur.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={logout}
            disabled={logoutBusy}
            loading={logoutBusy}
          >
            Çıkış yap
          </Button>
        </div>
      </Card>

      <Card className="border-danger/40">
        <CardTitle className="text-danger-ink">Hesabı sil</CardTitle>
        <p className="type-body-sm mt-2 text-ink-soft">
          Kişisel bilgilerin anonimleştirilir, giriş erişimin kapatılır ve
          aboneliğin sonlandırılır. Yasal/istatistiksel bütünlük için kişisel
          olmayan anonim kayıtlar korunabilir. Bu işlem geri alınamaz.
        </p>
        <label className="mt-4 block max-w-xs">
          <span className="type-subhead text-ink">Onaylamak için SİL yaz</span>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            className="type-body mt-1 h-11 w-full rounded-control border border-danger/40 bg-surface px-3.5 text-ink outline-none focus:border-danger"
          />
        </label>
        <Button
          type="button"
          variant="destructive"
          className="mt-3"
          disabled={
            deleteBusy || deleteText.trim().toLocaleUpperCase("tr-TR") !== "SİL"
          }
          loading={deleteBusy}
          onClick={deleteAccount}
        >
          Hesabımı kalıcı olarak sil
        </Button>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...props
}: { label: string; name: string; type?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
>) {
  return (
    <label className="block">
      <span className="type-subhead text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={type !== "date"}
        {...props}
        className={INPUT}
      />
    </label>
  );
}
function Status({ value }: { value: { kind: "ok" | "error"; text: string } }) {
  return (
    <Notice tone={value.kind === "ok" ? "success" : "error"} className="py-2">
      {value.text}
    </Notice>
  );
}
