"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { MeProfile } from "@/lib/public-api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="space-y-4">
      <Card>
        <CardTitle>Profil ve çalışma hedefi</CardTitle>
        <p className="mt-1 text-[13px] text-ink-soft">
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
            <span className="text-[13px] font-semibold text-ink">
              Hedef sınav
            </span>
            <select
              name="preferredModuleId"
              defaultValue={profile.preferredModule?.id ?? ""}
              required
              className="mt-1 h-11 w-full rounded-sm border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-brand"
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
            <span className="text-[13px] font-semibold text-ink">
              Hedef sınav tarihi
            </span>
            <input
              name="targetExamDate"
              type="date"
              defaultValue={profile.targetExamDate ?? ""}
              className="mt-1 h-11 w-full rounded-sm border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-brand"
            />
            <span className="mt-1 block text-[11px] text-ink-soft">
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
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
            </Button>
            {message && <Status value={message} />}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Görünüm</CardTitle>
            <p className="mt-1 text-[13px] text-ink-soft">
              Cihaz saatine göre otomatik veya elle seç.
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
            <Button type="submit" variant="secondary" disabled={passwordBusy}>
              {passwordBusy ? "Güncelleniyor…" : "Şifreyi değiştir"}
            </Button>
            {passwordMessage && <Status value={passwordMessage} />}
          </div>
        </form>
      </Card>

      <Card className="border-danger/30">
        <CardTitle className="text-danger">Hesabı sil</CardTitle>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Kişisel bilgilerin anonimleştirilir, giriş erişimin kapatılır ve
          aboneliğin sonlandırılır. Yasal/istatistiksel bütünlük için kişisel
          olmayan anonim kayıtlar korunabilir. Bu işlem geri alınamaz.
        </p>
        <label className="mt-4 block max-w-xs">
          <span className="text-[13px] font-semibold text-ink">
            Onaylamak için SİL yaz
          </span>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            className="mt-1 h-11 w-full rounded-sm border border-danger/40 bg-surface px-3 text-[14px] text-ink outline-none focus:border-danger"
          />
        </label>
        <Button
          type="button"
          variant="danger"
          className="mt-3"
          disabled={
            deleteBusy || deleteText.trim().toLocaleUpperCase("tr-TR") !== "SİL"
          }
          onClick={deleteAccount}
        >
          {deleteBusy ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
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
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={type !== "date"}
        {...props}
        className="mt-1 h-11 w-full rounded-sm border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-brand"
      />
    </label>
  );
}
function Status({ value }: { value: { kind: "ok" | "error"; text: string } }) {
  return (
    <p
      className={
        value.kind === "ok"
          ? "text-[13px] font-semibold text-success"
          : "text-[13px] font-semibold text-danger"
      }
      role="status"
    >
      {value.text}
    </p>
  );
}
