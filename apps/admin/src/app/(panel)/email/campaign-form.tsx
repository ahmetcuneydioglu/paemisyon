"use client";

import { useState } from "react";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import type { EmailCampaign, EmailTopic } from "./types";

export type CampaignInput = {
  name: string;
  topic: EmailTopic;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  bodyMarkdown: string;
  sources: string[];
  legacyYears: number[];
  dailyCap: number;
  sendRatePerSec: number;
  scheduledAt: string;
};

export const EMPTY: CampaignInput = {
  name: "",
  topic: "duyuru",
  subject: "",
  previewText: "",
  fromName: "Paemisyon",
  fromEmail: "bilgi@duyuru.paemisyon.com",
  replyTo: "destek@paemisyon.com",
  bodyMarkdown: "# Merhaba {{ad}}\n\n",
  sources: ["legacy_paem705"],
  legacyYears: [2023],
  dailyCap: 150,
  sendRatePerSec: 1,
  scheduledAt: "",
};

export function fromCampaign(c: EmailCampaign): CampaignInput {
  return {
    name: c.name,
    topic: c.topic,
    subject: c.subject,
    previewText: c.previewText ?? "",
    fromName: c.fromName,
    fromEmail: c.fromEmail,
    replyTo: c.replyTo ?? "",
    bodyMarkdown: c.bodyMarkdown,
    sources: c.audience.sources ?? [],
    legacyYears: c.audience.legacyYears ?? [],
    dailyCap: c.dailyCap,
    sendRatePerSec: Number(c.sendRatePerSec),
    scheduledAt: c.scheduledAt ? toLocalInput(c.scheduledAt) : "",
  };
}

/** ISO → <input type=datetime-local> (İstanbul). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

export function toPayload(f: CampaignInput) {
  return {
    name: f.name.trim(),
    topic: f.topic,
    subject: f.subject.trim(),
    previewText: f.previewText.trim() || null,
    fromName: f.fromName.trim(),
    fromEmail: f.fromEmail.trim(),
    replyTo: f.replyTo.trim() || null,
    bodyMarkdown: f.bodyMarkdown,
    audience: {
      sources: f.sources,
      legacyYears: f.sources.includes("legacy_paem705") ? f.legacyYears : [],
    },
    dailyCap: f.dailyCap,
    sendRatePerSec: f.sendRatePerSec,
    // datetime-local İstanbul saatidir (Türkiye'de yaz saati yok → sabit +03).
    scheduledAt: f.scheduledAt
      ? new Date(`${f.scheduledAt}:00+03:00`).toISOString()
      : null,
  };
}

const SOURCES = [
  { value: "legacy_paem705", label: "Eski uygulama (paem705)" },
  { value: "live_user", label: "Kayıtlı kullanıcılar" },
  { value: "manual", label: "Elle eklenen" },
];
const YEARS = [2023, 2022, 2021, 2020];

export function CampaignForm({
  initial,
  campaignId,
  locked,
  onSaved,
}: {
  initial: CampaignInput;
  campaignId?: string;
  locked: boolean;
  onSaved: (c: EmailCampaign) => void;
}) {
  const [f, setF] = useState<CampaignInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = <K extends keyof CampaignInput>(k: K, v: CampaignInput[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const toggle = (arr: "sources" | "legacyYears", v: never) =>
    setF((s) => {
      const cur = s[arr] as unknown[];
      return {
        ...s,
        [arr]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
      } as CampaignInput;
    });

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const c = campaignId
        ? await api<EmailCampaign>(`/admin/email/campaigns/${campaignId}`, {
            method: "PUT",
            body: toPayload(f),
          })
        : await api<EmailCampaign>("/admin/email/campaigns", {
            method: "POST",
            body: toPayload(f),
          });
      onSaved(c);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50";

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          Kampanya adı (iç)
          <input
            disabled={locked}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          Konu kategorisi
          <select
            disabled={locked}
            value={f.topic}
            onChange={(e) => set("topic", e.target.value as EmailTopic)}
            className={input}
          >
            <option value="duyuru">Duyuru (bilgilendirme)</option>
            <option value="kampanya">Kampanya (pazarlama)</option>
          </select>
        </label>
      </div>
      <label className="block">
        Konu satırı
        <input
          disabled={locked}
          value={f.subject}
          onChange={(e) => set("subject", e.target.value)}
          className={input}
          maxLength={150}
        />
      </label>
      <label className="block">
        Ön izleme metni{" "}
        <span className="text-slate-400">
          (gelen kutusunda konunun yanında)
        </span>
        <input
          disabled={locked}
          value={f.previewText}
          onChange={(e) => set("previewText", e.target.value)}
          className={input}
          maxLength={200}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          Gönderici adı
          <input
            disabled={locked}
            value={f.fromName}
            onChange={(e) => set("fromName", e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          Gönderici adresi
          <input
            disabled={locked}
            value={f.fromEmail}
            onChange={(e) => set("fromEmail", e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          Yanıt adresi
          <input
            disabled={locked}
            value={f.replyTo}
            onChange={(e) => set("replyTo", e.target.value)}
            className={input}
          />
        </label>
      </div>
      <label className="block">
        Gövde (Markdown; <code>{"{{ad}}"}</code> kişinin adıyla değişir, çıkış
        bağlantısı otomatik eklenir)
        <textarea
          disabled={locked}
          value={f.bodyMarkdown}
          onChange={(e) => set("bodyMarkdown", e.target.value)}
          rows={14}
          className={`${input} font-mono`}
        />
      </label>

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-600">
          Kitle
        </legend>
        <div className="flex flex-wrap gap-4">
          {SOURCES.map((s) => (
            <label key={s.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled={locked}
                checked={f.sources.includes(s.value)}
                onChange={() => toggle("sources", s.value as never)}
              />
              {s.label}
            </label>
          ))}
        </div>
        {f.sources.includes("legacy_paem705") && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="text-xs text-slate-500">
              Eski kayıt yılı (boş = hepsi):
            </span>
            {YEARS.map((y) => (
              <label key={y} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={f.legacyYears.includes(y)}
                  onChange={() => toggle("legacyYears", y as never)}
                />
                {y}
              </label>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Yalnız abone olan ve bu konu kategorisini kapatmamış kişiler alır;
          bounce/şikâyet/bastırılmış adresler hiçbir zaman girmez.
        </p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          Günlük tavan
          <input
            type="number"
            min={1}
            disabled={locked}
            value={f.dailyCap}
            onChange={(e) => set("dailyCap", Number(e.target.value))}
            className={input}
          />
        </label>
        <label className="block">
          Hız (posta/sn)
          <input
            type="number"
            min={0.1}
            max={14}
            step={0.1}
            disabled={locked}
            value={f.sendRatePerSec}
            onChange={(e) => set("sendRatePerSec", Number(e.target.value))}
            className={input}
          />
        </label>
        <label className="block">
          Planla (İstanbul; boş = elle başlat)
          <input
            type="datetime-local"
            disabled={locked}
            value={f.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
            className={input}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Soğuk liste için ilk gün 150, sonraki günler oranlara bakarak artır.
        Günlük tavan kampanya gönderimdeyken de değiştirilemez; yeni gün için
        kampanyayı duraklatıp düzenlemek yerine tavanı baştan büyük tutma, elle
        sürdür.
      </p>

      {error ? <ErrorBox error={error} /> : null}
      {!locked && (
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {campaignId ? "Kaydet" : "Taslak oluştur"}
        </button>
      )}
    </div>
  );
}
