"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { CampaignForm, fromCampaign } from "../campaign-form";
import {
  type AudiencePreview,
  CAMPAIGN_STATUS,
  type EmailCampaign,
  type EmailCampaignDetail,
  fmtDate,
  TOPIC_LABEL,
} from "../types";

/**
 * Kampanya ayrıntısı: düzenle → önizle → test postası → kitle onayı → başlat;
 * gönderimde huni, günlük sayaç, belirsiz gönderimler, duraklat/sürdür/iptal.
 */
export default function EmailCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const key = ["email-campaign", id];
  const q = useQuery({
    queryKey: key,
    queryFn: () => api<EmailCampaignDetail>(`/admin/email/campaigns/${id}`),
    refetchInterval: (x) =>
      x.state.data?.status === "sending" ? 10_000 : false,
  });
  const [tab, setTab] = useState<"duzenle" | "onizle">("duzenle");
  const [testTo, setTestTo] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudiencePreview | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["email-campaigns"] });
  };
  const preview = useQuery({
    queryKey: ["email-preview", id, q.data?.bodyMarkdown, q.data?.subject],
    queryFn: () =>
      api<{ html: string; text: string }>(
        `/admin/email/campaigns/${id}/preview`,
      ),
    enabled: tab === "onizle" && !!q.data,
  });

  function useAction(
    path: string,
    ok: string,
    method: "POST" | "DELETE" = "POST",
  ) {
    return useMutation({
      mutationFn: () => api(`/admin/email/campaigns/${id}${path}`, { method }),
      onSuccess: () => {
        setNote(ok);
        refresh();
      },
      onError: (e) => setNote((e as Error).message),
    });
  }
  const test = useMutation({
    mutationFn: () =>
      api<{ messageId: string }>(`/admin/email/campaigns/${id}/test`, {
        method: "POST",
        body: { to: testTo.trim() },
      }),
    onSuccess: (r) => {
      setNote(`Test postası gönderildi (${r.messageId.slice(0, 12)}…).`);
      refresh();
    },
    onError: (e) => setNote((e as Error).message),
  });
  const loadAudience = useMutation({
    mutationFn: () =>
      api<AudiencePreview>(`/admin/email/campaigns/${id}/audience`, {
        method: "POST",
      }),
    onSuccess: (a) => setAudience(a),
    onError: (e) => setNote((e as Error).message),
  });
  const start = useMutation({
    mutationFn: () =>
      api<{ targeted: number }>(`/admin/email/campaigns/${id}/start`, {
        method: "POST",
        body: { expectedCount: audience?.count },
      }),
    onSuccess: (r) => {
      setNote(
        `Gönderim başladı: ${r.targeted} kişi kuyrukta. İşçi 30 saniyede bir çalışır.`,
      );
      setAudience(null);
      refresh();
    },
    onError: (e) => setNote((e as Error).message),
  });
  const pause = useAction("/pause", "Kampanya duraklatıldı.");
  const resume = useAction("/resume", "Kampanya sürdürülüyor.");
  const cancel = useAction(
    "",
    "Kampanya iptal edildi; kuyruktakiler atlandı.",
    "DELETE",
  );
  const tick = useMutation({
    mutationFn: () =>
      api<{ sent: number; skipped: number; failed: number }>(
        "/admin/email/worker/tick",
        { method: "POST" },
      ),
    onSuccess: (r) => {
      setNote(
        `İşçi çalıştı: ${r.sent} gönderildi, ${r.skipped} atlandı, ${r.failed} hata.`,
      );
      refresh();
    },
    onError: (e) => setNote((e as Error).message),
  });

  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data)
    return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data;
  const locked = !["draft", "test_sent", "scheduled"].includes(c.status);
  const canStart = c.status === "test_sent" || c.status === "scheduled";
  const btn =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40";

  return (
    <div>
      <PageHeader
        title={c.name}
        subtitle={`${TOPIC_LABEL[c.topic]} · ${c.fromName} <${c.fromEmail}> · ${fmtDate(c.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS[c.status].cls}`}
            >
              {CAMPAIGN_STATUS[c.status].label}
            </span>
            <Link href="/email" className="text-sm underline">
              ← E-posta
            </Link>
          </div>
        }
      />

      {note && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
          {note}
        </div>
      )}
      {c.pausedReason && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-800">
          Duraklatma nedeni: {c.pausedReason}
        </div>
      )}

      {c.status !== "draft" && (
        <Card className="mb-4">
          <h2 className="mb-3 text-sm font-semibold">Gönderim</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-7">
            <div>
              <div className="text-xs text-slate-500">Hedef</div>
              <div className="text-lg font-semibold">{c.targetedCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Gönderildi</div>
              <div className="text-lg font-semibold">{c.sentCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Teslim</div>
              <div className="text-lg font-semibold">{c.deliveredCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Bounce</div>
              <div
                className={`text-lg font-semibold ${c.bouncedCount ? "text-red-700" : ""}`}
              >
                {c.bouncedCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Şikâyet</div>
              <div
                className={`text-lg font-semibold ${c.complainedCount ? "text-red-700" : ""}`}
              >
                {c.complainedCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Çıkış</div>
              <div className="text-lg font-semibold">{c.unsubscribedCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Tıklama</div>
              <div className="text-lg font-semibold">
                {c.clickedCount}
                {c.deliveredCount > 0 && (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    %{((c.clickedCount / c.deliveredCount) * 100).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
            <span>
              Bugün gönderilen: <b>{c.sentToday}</b> / tavan {c.dailyCap}
            </span>
            <span>
              Kuyrukta: <b>{c.sends.queued ?? 0}</b>
            </span>
            <span>Atlanan: {c.sends.skipped ?? 0}</span>
            <span>Hata: {c.sends.failed ?? 0}</span>
            {c.uncertain > 0 && (
              <span className="text-red-700">
                Belirsiz (SES yanıtı alınamadı, yeniden gönderilmez):{" "}
                <b>{c.uncertain}</b>
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.status === "sending" && (
              <button className={btn} onClick={() => pause.mutate()}>
                Duraklat
              </button>
            )}
            {c.status === "paused" && (
              <button className={btn} onClick={() => resume.mutate()}>
                Sürdür
              </button>
            )}
            {(c.status === "sending" || c.status === "paused") && (
              <button
                className={btn}
                onClick={() => tick.mutate()}
                disabled={tick.isPending}
              >
                İşçiyi şimdi çalıştır
              </button>
            )}
            {!["completed", "cancelled"].includes(c.status) && (
              <button
                className={`${btn} text-red-700`}
                onClick={() => {
                  if (
                    window.confirm(
                      "Kampanya iptal edilsin mi? Kuyruktaki gönderimler atlanır, gidenler geri alınamaz.",
                    )
                  )
                    cancel.mutate();
                }}
              >
                İptal et
              </button>
            )}
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="mb-3 flex gap-2 text-sm">
          <button
            className={`rounded px-3 py-1 ${tab === "duzenle" ? "bg-slate-900 text-white" : "border border-slate-300"}`}
            onClick={() => setTab("duzenle")}
          >
            {locked ? "İçerik" : "Düzenle"}
          </button>
          <button
            className={`rounded px-3 py-1 ${tab === "onizle" ? "bg-slate-900 text-white" : "border border-slate-300"}`}
            onClick={() => setTab("onizle")}
          >
            Önizle
          </button>
        </div>
        {tab === "duzenle" && (
          <CampaignForm
            key={c.id + c.status}
            initial={fromCampaign(c as EmailCampaign)}
            campaignId={c.id}
            locked={locked}
            onSaved={() => {
              setNote(
                "Kaydedildi. İçerik değiştiği için test postası yeniden gönderilmeli.",
              );
              refresh();
            }}
          />
        )}
        {tab === "onizle" &&
          (preview.isLoading ? (
            <Spinner />
          ) : preview.data ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_375px]">
              <div>
                <div className="mb-1 text-xs text-slate-500">Masaüstü</div>
                <iframe
                  title="masaustu"
                  srcDoc={preview.data.html}
                  className="h-[640px] w-full rounded border border-slate-200 bg-white"
                  sandbox=""
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-500">
                  Mobil (375 px)
                </div>
                <iframe
                  title="mobil"
                  srcDoc={preview.data.html}
                  className="h-[640px] w-[375px] rounded border border-slate-200 bg-white"
                  sandbox=""
                />
              </div>
              <details className="lg:col-span-2 text-xs">
                <summary className="cursor-pointer text-slate-500">
                  Düz metin sürümü
                </summary>
                <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3">
                  {preview.data.text}
                </pre>
              </details>
            </div>
          ) : (
            <ErrorBox error={preview.error} />
          ))}
      </Card>

      {!locked && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Gönderime hazırlık</h2>
          <ol className="space-y-4 text-sm">
            <li>
              <div className="font-medium">
                1. Test postası{" "}
                {c.status !== "draft" && (
                  <span className="text-emerald-700">✓</span>
                )}
              </div>
              <div className="mt-1 flex gap-2">
                <input
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="kendi adresin (sandbox'ta doğrulanmış olmalı)"
                  className="w-80 rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button
                  className={btn}
                  disabled={!testTo.includes("@") || test.isPending}
                  onClick={() => test.mutate()}
                >
                  Gönder
                </button>
              </div>
            </li>
            <li>
              <div className="font-medium">2. Kitleyi gözden geçir</div>
              <button
                className={`${btn} mt-1`}
                onClick={() => loadAudience.mutate()}
                disabled={loadAudience.isPending}
              >
                Kitleyi hesapla
              </button>
              {audience && (
                <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="text-sm">
                    <b>{audience.count}</b> kişi
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4">
                    {audience.breakdown.map((b, i) => (
                      <span key={i}>
                        {b.source}
                        {b.legacyYear ? ` ${b.legacyYear}` : ""}: {b.count}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Örnek: {audience.sample.map((s) => s.email).join(", ")}
                  </div>
                </div>
              )}
            </li>
            <li>
              <div className="font-medium">3. Onayla ve başlat</div>
              {audience && canStart ? (
                <div className="mt-1 rounded border border-amber-300 bg-amber-50 p-3">
                  <div className="text-sm">
                    Proje: <b>Paemisyon</b> · Alıcı: <b>{audience.count}</b> ·
                    Konu: <b>{c.subject}</b> · Gönderici:{" "}
                    <b>
                      {c.fromName} &lt;{c.fromEmail}&gt;
                    </b>{" "}
                    · Günlük tavan: <b>{c.dailyCap}</b>
                  </div>
                  <button
                    className="mt-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={start.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `${audience.count} kişiye gönderim başlatılsın mı? Bugün en çok ${c.dailyCap} gider.`,
                        )
                      )
                        start.mutate();
                    }}
                  >
                    Gönderimi başlat
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  {c.status === "draft"
                    ? "Önce test postası gönder."
                    : "Önce kitleyi hesapla."}
                </p>
              )}
            </li>
          </ol>
        </Card>
      )}
    </div>
  );
}
