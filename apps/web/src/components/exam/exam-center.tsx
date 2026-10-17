import Link from "next/link";
import type { ExamListItem, MyAttempt } from "@/lib/types";
import type { MeDashboard } from "@/lib/public-api";
import { ArrowRight, Zap } from "lucide-react";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { personalExamState } from "@/lib/personal-exam";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { CoachRail } from "@/components/shell/coach-rail";
import { Countdown } from "@/components/countdown";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Deneme merkezi — girişli derinlik (Doc 27 §3.8, wireframe eşleniği):
 * canlı/sıradaki deneme hero'su + takvim + gelişim çizgim. Koç rayı L2 gereği sağda.
 */
export function ExamCenter({
  exams,
  attempts,
  dashboard = null,
}: {
  exams: ExamListItem[];
  attempts: MyAttempt[];
  /** Kişisel deneme hakkı (Doc 46); çekilemediyse kart kısıtsız çizilir. */
  dashboard?: MeDashboard | null;
}) {
  const active = exams.find((e) => e.state === "active");
  const upcoming = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const next = upcoming[0];
  const past = [...exams]
    .filter((e) => e.state === "ended")
    .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
  const myCompleted = attempts
    .filter((a) => a.status === "completed" && a.score != null)
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
  const maxScore = myCompleted.reduce(
    (m, a) => Math.max(m, Number(a.score)),
    0,
  );

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="type-title mb-5 text-ink">Denemeler</h1>

        {/* Hero: canlı > sıradaki > sakin boşluk */}
        {active ? (
          <Card className="mb-5 flex flex-col gap-1 border-success/40 p-6">
            <span className="type-label inline-flex items-center gap-1.5 text-success-ink">
              <span
                aria-hidden
                className="inline-block size-2 rounded-full bg-success motion-safe:animate-pulse"
              />
              Canlı — şu an devam ediyor
            </span>
            <p className="type-heading text-ink">{active.title}</p>
            <p className="type-body-sm text-ink-soft">
              {active.questionCount} soru · {active.durationMinutes} dk ·{" "}
              {active.participantCount} katılımcı
            </p>
            <div className="mt-3">
              {active.myAttempt?.status === "completed" ? (
                <ButtonLink
                  href={`/sonuc/${active.myAttempt.id}`}
                  variant="secondary"
                >
                  Sonucumu gör
                </ButtonLink>
              ) : (
                <ButtonLink href={`/sinav/${active.id}`} size="lg">
                  {active.myAttempt ? "Sınava devam et" : "Sınava katıl"}
                </ButtonLink>
              )}
            </div>
          </Card>
        ) : next ? (
          <Card className="mb-5 flex flex-col gap-1 border-accent/40 p-6">
            <span className="type-label text-accent-ink">
              Sıradaki canlı deneme
            </span>
            <p className="type-heading text-ink">{next.title}</p>
            <p className="type-body-sm text-ink-soft">
              {formatDate(next.startAt)} · {formatTime(next.startAt)} ·{" "}
              {next.questionCount} soru · {next.durationMinutes} dk
            </p>
            <div className="type-subhead mt-2 text-ink">
              <Countdown target={next.startAt} />
            </div>
            <p className="type-body-sm mt-1 text-ink-soft">
              Başladığında bu sayfadan tek tıkla girersin — Türkiye geneli
              eşzamanlı, sıralamalı.
            </p>
          </Card>
        ) : (
          <Card className="mb-5 border-dashed p-6 text-center">
            <p className="type-body-sm text-ink-soft">
              Şu an planlanmış canlı deneme yok. Yeni deneme açıldığında koçun
              Bugün&apos;de haber verir; sen de buradan takip edebilirsin.
            </p>
          </Card>
        )}

        {/* Bana özel deneme: randevu beklemeden, müfredat ağırlıklarıyla */}
        <PersonalExamCard dashboard={dashboard} />

        {/* Yaklaşan takvim */}
        {upcoming.length > 1 && (
          <section className="mb-5 flex flex-col gap-2">
            <SectionHeader title="Takvim" />
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.slice(1).map((e) => (
                <Card key={e.id} className="flex flex-col gap-1">
                  <p className="type-subhead text-ink">{e.title}</p>
                  <p className="type-body-sm text-ink-soft">
                    {formatDate(e.startAt)} · {formatTime(e.startAt)} ·{" "}
                    {e.questionCount} soru
                  </p>
                  {e.isPremium ? (
                    <PremiumBadge variant="soft" className="self-start" />
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Geçmiş denemeler */}
        <section className="flex flex-col gap-2">
          <SectionHeader
            title="Geçmiş denemeler"
            action={{ label: "Denemelerim", href: "/profil/denemelerim" }}
          />
          <DataTable
            caption="Geçmiş denemeler"
            rows={past}
            rowKey={(e) => e.id}
            empty="Henüz geçmiş deneme yok."
            columns={[
              {
                key: "deneme",
                header: "Deneme",
                cell: (e) => (
                  <span className="type-subhead text-ink">{e.title}</span>
                ),
              },
              {
                key: "tarih",
                header: "Tarih",
                align: "right",
                hideBelowMd: true,
                cell: (e) => formatDate(e.startAt),
              },
              {
                key: "katilim",
                header: "Katılım",
                align: "right",
                hideBelowMd: true,
                cell: (e) => e.participantCount,
              },
              {
                key: "ort",
                header: "Ortalama",
                align: "right",
                cell: (e) =>
                  e.avgScore != null ? Number(e.avgScore).toFixed(1) : "—",
              },
              {
                key: "benim",
                header: "Benim",
                align: "right",
                cell: (e) => (
                  <span className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {e.myAttempt?.status === "completed" ? (
                      <Link
                        href={`/sonuc/${e.myAttempt.id}`}
                        className="type-subhead inline-flex items-center gap-1 text-accent-ink hover:underline"
                      >
                        sonucum <ArrowRight size={14} aria-hidden />
                      </Link>
                    ) : null}
                    {/* Arşivde çözdüysem sonucuma DÖNEBİLMELİYİM (6 Eyl 2026 vakası). */}
                    {e.myArchiveAttempt ? (
                      <Link
                        href={`/sonuc/${e.myArchiveAttempt.id}`}
                        className="type-subhead inline-flex items-center gap-1 text-accent-ink hover:underline"
                      >
                        arşiv sonucum <ArrowRight size={14} aria-hidden />
                      </Link>
                    ) : null}
                    {/* Arşiv modu: aynı set + süre, sıralamasız pratik; anahtar kapalıysa çizilmez. */}
                    {e.archiveOpenAfterEnd ? (
                      <Link
                        href={`/sinav/arsiv/${e.id}`}
                        className="type-subhead text-ink-soft hover:text-ink hover:underline"
                      >
                        arşivde çöz
                      </Link>
                    ) : null}
                  </span>
                ),
              },
            ]}
          />
        </section>

        {/* Gelişim çizgim (net trendi) */}
        {myCompleted.length >= 2 && (
          <section className="mt-5 flex flex-col gap-2">
            <SectionHeader
              title={`Gelişim çizgim — son ${myCompleted.length} deneme`}
            />
            <Card>
              <div className="flex items-end gap-2" aria-hidden>
                {myCompleted.slice(-12).map((a) => (
                  <div
                    key={a.attemptId}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="type-body-sm tabular text-ink-soft">
                      {Number(a.score).toFixed(0)}
                    </span>
                    <div
                      className="w-full rounded-t-[4px] bg-accent/70"
                      style={{
                        height: `${Math.max(8, (Number(a.score) / Math.max(1, maxScore)) * 72)}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="type-body-sm mt-2 text-ink-subtle">
                puanlar deneme NET&apos;i (doğru − yanlış/4)
              </p>
            </Card>
          </section>
        )}
      </div>

      <CoachRail />
    </div>
  );
}

/**
 * "Bana özel deneme" kartı (Doc 46 sonrası): ücretsiz planda günde 1 hak ve
 * 25 soru tavanı vardır. Kilit arayüzde DÜRÜSTÇE gösterilir — kullanıcı
 * butona basıp sunucudan hata yemesin. Asıl karar noktası yine sunucudur
 * (startPersonalExam); burası onu tekrar eden bir kural motoru değil, aynaya
 * bakan bir ekrandır: `dashboard` yoksa kart eski kısıtsız hâlinde çizilir.
 */
function PersonalExamCard({ dashboard }: { dashboard: MeDashboard | null }) {
  const { sinirsiz, kalan, hakkiBitti, secenekler } =
    personalExamState(dashboard);

  return (
    <Card className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="type-subhead inline-flex items-center gap-1.5 text-ink">
            <Zap size={16} className="text-accent" aria-hidden /> Bana özel
            deneme
          </p>
          <p className="type-body-sm mt-0.5 text-ink-soft">
            Randevu bekleme — müfredat ağırlıklarıyla, görmediğin sorulardan.
            Sıralamaya girmez.
          </p>
          {!sinirsiz && (
            <p className="type-body-sm mt-1.5 text-ink-soft">
              {hakkiBitti ? (
                <>Bugünkü hakkını kullandın — yarın yenileniyor.</>
              ) : (
                <>
                  Bugün <strong className="text-ink">{kalan} hakkın</strong>{" "}
                  var.
                </>
              )}{" "}
              <Link
                href="/premium"
                className="font-semibold text-accent-ink hover:underline"
              >
                Premium&apos;da sınırsız
              </Link>
            </p>
          )}
        </div>

        {hakkiBitti ? (
          <ButtonLink href="/premium" size="sm">
            Premium&apos;a geç
          </ButtonLink>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {secenekler.map(({ sayi, kilitli, birincil }) =>
              kilitli ? (
                // Tavanın üstü: kapalı buton değil, Premium'a giden dürüst bir
                // bağlantı — tıklanabilir olduğu için dokunma hedefi korunur.
                <Link
                  key={sayi}
                  href="/premium"
                  className="tk-interactive inline-flex min-h-11 items-center gap-1.5 rounded-control border border-dashed border-line px-3 type-subhead text-ink-soft hover:border-ink-soft hover:text-ink"
                  title={`${sayi} soruluk kişisel deneme Premium'a özel`}
                >
                  {sayi} soru
                  <PremiumBadge variant="soft" />
                </Link>
              ) : (
                <ButtonLink
                  key={sayi}
                  href={`/sinav/kisisel?count=${sayi}`}
                  variant={birincil ? "primary" : "secondary"}
                  size="sm"
                >
                  {sayi} soru
                </ButtonLink>
              ),
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
