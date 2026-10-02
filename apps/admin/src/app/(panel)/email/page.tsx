"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import {
  CAMPAIGN_STATUS,
  type EmailCampaign,
  type EmailHealth,
  fmtDate,
  pct,
  TOPIC_LABEL,
} from "./types";

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${warn ? "text-red-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}

/** E-posta merkezi: sağlık özeti (AWS'den gerçek veri) + kampanya listesi. */
export default function EmailPage() {
  const health = useQuery({
    queryKey: ["email-health"],
    queryFn: () => api<EmailHealth>("/admin/email/health"),
    refetchInterval: 60_000,
  });
  const campaigns = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => api<EmailCampaign[]>("/admin/email/campaigns"),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <PageHeader
        title="E-posta"
        subtitle="Amazon SES ile duyuru ve kampanya postaları."
        action={
          <div className="flex gap-2">
            <Link
              href="/email/contacts"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              Kişiler
            </Link>
            <Link
              href="/email/new"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              Yeni kampanya
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Posta sağlığı</h2>
        {health.isLoading && <Spinner />}
        {health.error && (
          <ErrorBox error={health.error} onRetry={() => health.refetch()} />
        )}
        {health.data && !health.data.enabled && (
          <p className="text-sm text-amber-700">
            SES yapılandırılmadı (API ortamında AWS anahtarı yok). Gönderim
            kapalı.
          </p>
        )}
        {health.data?.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Stat
                label="SES erişimi"
                value={
                  health.data.account.productionAccess ? "Üretim" : "Sandbox"
                }
                warn={!health.data.account.productionAccess}
              />
              <Stat
                label="Hesap durumu"
                value={health.data.account.enforcementStatus}
                warn={health.data.account.enforcementStatus !== "HEALTHY"}
              />
              <Stat
                label="24 saat kota"
                value={`${Math.round(health.data.account.sentLast24Hours)} / ${Math.round(health.data.account.max24HourSend)}`}
              />
              <Stat
                label="Hız"
                value={`${health.data.account.maxSendRate}/sn`}
              />
              <Stat
                label="SES bastırma listesi"
                value={
                  health.data.suppressedOnSes == null
                    ? "—"
                    : String(health.data.suppressedOnSes)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                label="Son 24 s gönderim"
                value={String(health.data.last24h.sent)}
              />
              <Stat
                label="Teslim"
                value={pct(health.data.last24h.deliveryRate)}
              />
              <Stat
                label="Bounce"
                value={pct(health.data.last24h.bounceRate)}
                warn={
                  (health.data.last24h.bounceRate ?? 0) >=
                  health.data.thresholds.bounceRate
                }
              />
              <Stat
                label="Şikâyet"
                value={pct(health.data.last24h.complaintRate, 2)}
                warn={
                  (health.data.last24h.complaintRate ?? 0) >=
                  health.data.thresholds.complaintRate
                }
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
              {health.data.identities.map((i) => (
                <span key={i.name}>
                  <span className="font-medium">{i.name}</span>: DKIM {i.dkim} ·
                  MAIL FROM {i.mailFrom}
                  {!i.verified && (
                    <span className="ml-1 text-red-700">(doğrulanmadı)</span>
                  )}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
              {Object.entries(health.data.contacts).map(([k, v]) => (
                <span key={k}>
                  {k}: <span className="font-medium">{v}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Açılma oranı ölçülmüyor (izleme pikseli yok). Eşikler AWS SES
              kurallarıdır: bounce %5 inceleme / %10 durdurma, şikâyet ‰1 / ‰5.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Kampanyalar</h2>
        {campaigns.isLoading && <Spinner />}
        {campaigns.error && (
          <ErrorBox
            error={campaigns.error}
            onRetry={() => campaigns.refetch()}
          />
        )}
        {campaigns.data && campaigns.data.length === 0 && (
          <p className="text-sm text-slate-500">Henüz kampanya yok.</p>
        )}
        {campaigns.data && campaigns.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Kampanya</th>
                  <th className="py-2 pr-3">Konu</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2 pr-3 text-right">Hedef</th>
                  <th className="py-2 pr-3 text-right">Gönderildi</th>
                  <th className="py-2 pr-3 text-right">Teslim</th>
                  <th className="py-2 pr-3 text-right">Bounce</th>
                  <th className="py-2 pr-3 text-right">Şikâyet</th>
                  <th className="py-2 pr-3 text-right">Çıkış</th>
                  <th className="py-2">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.data.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/email/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-slate-500">{c.subject}</div>
                    </td>
                    <td className="py-2 pr-3">{TOPIC_LABEL[c.topic]}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS[c.status].cls}`}
                      >
                        {CAMPAIGN_STATUS[c.status].label}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right">{c.targetedCount}</td>
                    <td className="py-2 pr-3 text-right">{c.sentCount}</td>
                    <td className="py-2 pr-3 text-right">{c.deliveredCount}</td>
                    <td className="py-2 pr-3 text-right">{c.bouncedCount}</td>
                    <td className="py-2 pr-3 text-right">
                      {c.complainedCount}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {c.unsubscribedCount}
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {fmtDate(c.startedAt ?? c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
