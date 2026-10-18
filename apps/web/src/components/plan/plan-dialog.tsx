"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan, PlanDefaults } from "@/lib/public-api";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { formatMinutes } from "@/lib/plan";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";

/** Haftalık süre seçenekleri (dakika): 1–14 saat. Mevcut/önerilen değer listede yoksa eklenir. */
const SURELER = [60, 120, 180, 300, 420, 600, 840];

/**
 * Plan kur / yenile diyaloğu (Expo `PlanSheet` karşılığı). Girdiler: haftalık süre
 * (çipler) ve sınav tarihi (GG.AA.YYYY ya da "belli değil"); tarih sunucuda kullanıcının
 * hedef tarihine de yazılır (tek kaynak). Başarıda sayfa yeniden doğrulanır
 * (`router.refresh()`): plan ve koç brief'i sunucudan taze gelir.
 */
export function PlanDialogButton({
  mode,
  current,
  defaults,
  label,
  variant = "secondary",
  size,
  autoOpen = false,
  className,
}: {
  mode: "create" | "revise";
  current: Pick<Plan, "weeklyMinutes" | "examDate"> | null;
  defaults: PlanDefaults;
  label: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** `?kur=1` ile gelindiğinde diyalog açık başlar. */
  autoOpen?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [noDate, setNoDate] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onerilen = current?.weeklyMinutes ?? defaults.suggestedWeeklyMinutes;
  const secili = minutes ?? onerilen;
  const sureler = [...new Set([...SURELER, onerilen, secili])].sort((a, b) => a - b);
  const mevcutTarih = current?.examDate ?? defaults.examDate;
  const tarihMetni = date ?? (mevcutTarih ? isoToTr(mevcutTarih) : "");
  const tarihYok = noDate ?? (!mevcutTarih && date == null);
  const iso = trToIso(tarihMetni);
  const dateInvalid = !tarihYok && tarihMetni.trim() !== "" && !iso;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiClient("/me/plan", {
        method: mode === "create" ? "POST" : "PATCH",
        body: {
          weeklyMinutes: secili,
          ...(tarihYok ? { examDate: null } : date != null && iso ? { examDate: iso } : {}),
        },
      });
      setOpen(false);
      // `?kur=1` ile açıldıysa adres temizlenir (yeni adres = taze sunucu render'ı);
      // aksi hâlde aynı sayfa yeniden doğrulanır. İkisi birden gönderilmez: replace
      // sürerken refresh eski ağacı yeniden çiziyordu (göz testi, 18 Eki 2026).
      if (autoOpen) router.replace("/planim");
      else router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Plan kaydedilemedi, tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Haftalık planı kur" : "Planı yenile"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={() => void submit()} loading={busy} disabled={dateInvalid || !defaults.examTypeId}>
              {mode === "create" ? "Planı kur" : "Yeniden kur"}
            </Button>
          </div>
        }
      >
        {!defaults.examTypeId ? (
          <Notice tone="warning" title="Önce hedef sınavını seç">
            Plan, sınavın müfredatı ve ağırlıklarıyla kurulur. Profil › Ayarlar&apos;dan hedef sınavı seç.
          </Notice>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="type-body-sm text-ink-soft">
              {defaults.examTypeName} müfredatı, sınav ağırlıkları ve zayıf konularına göre haftalara dağıtılır. Her
              Pazartesi plan taze verilerle yenilenir.
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className="type-subhead text-ink">Haftada ne kadar çalışabilirsin?</legend>
              <div className="flex flex-wrap gap-2">
                {sureler.map((m) => (
                  <Chip key={m} label={formatMinutes(m)} selected={secili === m} onClick={() => setMinutes(m)} />
                ))}
              </div>
              <p className="type-body-sm text-ink-subtle">
                {defaults.dailyMinutes
                  ? `Günlük ${defaults.dailyMinutes} dk tercihine göre öneri: ${formatMinutes(defaults.suggestedWeeklyMinutes)}.`
                  : `Öneri: ${formatMinutes(defaults.suggestedWeeklyMinutes)}. İstediğin zaman değiştirebilirsin.`}
              </p>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="type-subhead text-ink">Sınav tarihi</legend>
              {!tarihYok ? (
                <TextField
                  label="Hedef tarih (GG.AA.YYYY)"
                  value={tarihMetni}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setNoDate(false);
                  }}
                  placeholder="ör. 18.04.2027"
                  inputMode="numeric"
                  error={dateInvalid ? "Tarih GG.AA.YYYY biçiminde olmalı" : null}
                />
              ) : null}
              <div>
                <Chip
                  label="Henüz belli değil"
                  selected={tarihYok}
                  onClick={() => {
                    setNoDate(!tarihYok);
                    if (!tarihYok) setDate("");
                  }}
                />
              </div>
              <p className="type-body-sm text-ink-subtle">
                {tarihYok
                  ? "Tarih yoksa plan 12 haftalık kurulur; tarihi girince sınava göre yeniden dağıtırım."
                  : defaults.examDateSource === "official" && date == null
                    ? "Resmî sınav tarihi kullanılıyor."
                    : "Tarih geri sayımda ve koçta da kullanılır."}
              </p>
            </fieldset>
            {mode === "revise" ? (
              <p className="type-body-sm text-ink-soft">
                Geçmiş haftalar değişmez; bu hafta ve sonrası yeni süreye göre yeniden kurulur, bu haftanın ilerlemen korunur.
              </p>
            ) : current ? (
              <Notice tone="warning">Mevcut planın arşivlenir; yenisi bugünden başlar.</Notice>
            ) : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
          </div>
        )}
      </Dialog>
    </>
  );
}

/** Planı kaldır — onaylı. */
export function PlanArchiveButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function archive() {
    setBusy(true);
    setError(null);
    try {
      await apiClient("/me/plan", { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Plan kaldırılamadı.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Planı kaldır
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Planı kaldır"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={() => void archive()} loading={busy}>
              Kaldır
            </Button>
          </div>
        }
      >
        <p className="type-body text-ink-soft">Plan arşivlenir; istediğin zaman yenisini kurabilirsin.</p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Dialog>
    </>
  );
}

export function trToIso(tr: string): string | null {
  const m = tr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isoToTr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}
