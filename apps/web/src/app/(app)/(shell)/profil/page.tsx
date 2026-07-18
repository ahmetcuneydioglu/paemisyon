import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BadgeCatalog, CoachBrief, MeProfile } from "@/lib/public-api";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { RankInsignia } from "@/components/ui/rank-insignia";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, brief, badges] = await Promise.all([
    api<MeProfile>("/me"),
    api<CoachBrief>("/me/coach"),
    api<BadgeCatalog>("/me/badges"),
  ]);
  const rank = brief.gamification.rank;
  const rankPercent = rank?.next
    ? Math.min(
        100,
        Math.round(
          ((rank.score - rank.minScore) /
            Math.max(1, rank.next.minScore - rank.minScore)) *
            100,
        ),
      )
    : 100;
  const earned = badges.items
    .filter((badge) => badge.earned)
    .sort((a, b) => +new Date(b.earnedAt ?? 0) - +new Date(a.earnedAt ?? 0));
  const initial =
    profile.displayName?.trim().charAt(0).toLocaleUpperCase("tr-TR") ||
    profile.email.charAt(0).toUpperCase();
  // Gün hesabı sunucudaki koç kural motorundan gelir; tüm istemciler aynı değeri gösterir.
  const daysToExam = brief.daysToExam ?? null;
  const metrics = [
    { label: "Toplam soru", value: brief.stats?.totalSolved ?? 0 },
    { label: "Doğruluk", value: `%${brief.stats?.accuracy ?? 0}` },
    { label: "Güncel seri", value: `${brief.today.streak.current} gün` },
    {
      label: "En iyi net",
      value: brief.gamification.records.bestNet?.toFixed(2) ?? "—",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="tk-caption text-brand">Ben</span>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
            Profilin
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            Hedefin, emeğin ve biriktirdiğin ilerleme tek yerde.
          </p>
        </div>
        <ButtonLink href="/profil/ayarlar" variant="secondary">
          Profili ve hedefleri düzenle
        </ButtonLink>
      </div>

      <Card className="overflow-hidden border-brand/25 p-0">
        <div className="grid gap-6 bg-brand/5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
          <div
            className="flex size-16 items-center justify-center rounded-full bg-brand font-heading text-2xl font-bold text-surface"
            aria-label="Profil resmi yerine ad baş harfi"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-xl font-bold text-ink">
                {profile.displayName || "Kullanıcı"}
              </h2>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[11px] font-bold",
                  profile.isPremium
                    ? "bg-warning/15 text-warning"
                    : "bg-line text-ink-soft",
                ].join(" ")}
              >
                {profile.isPremium ? "Premium" : "Ücretsiz"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
              <span className="truncate">{profile.email}</span>
              <span
                className={
                  profile.emailVerified
                    ? "font-semibold text-success"
                    : "font-semibold text-warning"
                }
              >
                {profile.emailVerified ? "✓ Doğrulandı" : "Doğrulanmadı"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-ink">
                Hedef: {profile.preferredModule?.name ?? "Seçilmedi"}
              </span>
              <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-ink">
                Günlük hedef: {profile.dailyGoal} soru
              </span>
              {daysToExam != null && (
                <span className="rounded-full border border-live/30 bg-live/10 px-2.5 py-1 font-bold text-live">
                  Sınava {daysToExam} gün
                </span>
              )}
            </div>
          </div>
          {rank && (
            <RankInsignia level={rank.level} name={rank.name} size="lg" />
          )}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="text-center">
            <span className="tk-caption">{metric.label}</span>
            <p className="tabular mt-1 font-heading text-xl font-bold text-ink">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {rank && (
            <Card>
              <div className="flex items-start gap-4">
                <RankInsignia level={rank.level} name={rank.name} />
                <div className="min-w-0 flex-1">
                  <CardTitle>{rank.name}</CardTitle>
                  {rank.next ? (
                    <>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        Sıradaki rütbe:{" "}
                        <strong className="text-ink">{rank.next.name}</strong>
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${rankPercent}%` }}
                        />
                      </div>
                      <p className="tabular mt-1 text-[11px] text-ink-soft">
                        {rank.next.minScore - rank.score} puan kaldı · %
                        {rankPercent}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[13px] text-success">
                      Terfi yolunun son kapısındasın.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Rozet vitrini</CardTitle>
                <p className="mt-1 text-[13px] text-ink-soft">
                  {badges.earnedCount}/{badges.totalCount} rozet kazanıldı
                </p>
              </div>
              <Link
                href="/profil/rozetler"
                className="text-[13px] font-bold text-brand hover:underline"
              >
                Tümünü gör →
              </Link>
            </div>
            {earned.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {earned.slice(0, 3).map((badge) => (
                  <div
                    key={badge.key}
                    className="rounded-sm border border-atlas/25 bg-atlas/5 p-3"
                  >
                    <span className="text-xl" aria-hidden>
                      ✦
                    </span>
                    <p className="mt-1 font-heading text-[13px] font-bold text-ink">
                      {badge.name}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-ink-soft">
                İlk seansını tamamladığında vitrinin burada oluşacak.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardTitle>Hedef planın</CardTitle>
            <dl className="mt-3 space-y-2 text-[13px]">
              <Row
                label="Sınav"
                value={profile.preferredModule?.name ?? "Seçilmedi"}
              />
              <Row
                label="Sınav tarihi"
                value={
                  profile.targetExamDate
                    ? formatDate(profile.targetExamDate)
                    : "Belli değil"
                }
              />
              <Row label="Günlük hedef" value={`${profile.dailyGoal} soru`} />
              <Row
                label="Haftalık tempo"
                value={`${brief.gamification.weekly.activeDays}/${brief.gamification.weekly.goalDays} aktif gün`}
              />
            </dl>
          </Card>
          <Card>
            <CardTitle>Kısayollar</CardTitle>
            <nav
              className="mt-2 divide-y divide-line"
              aria-label="Profil kısayolları"
            >
              <Shortcut href="/profil/denemelerim" label="Denemelerim" />
              <Shortcut href="/kutuphane/yanlislar" label="Yanlışlarım" />
              <Shortcut href="/kutuphane/favoriler" label="Favorilerim" />
              <Shortcut href="/performans" label="Performans detayım" />
            </nav>
          </Card>
          <Card>
            <CardTitle>Hesap ve plan</CardTitle>
            <p className="mt-2 text-[13px] text-ink-soft">
              {profile.isPremium
                ? `Premium${profile.validUntil ? ` · ${formatDate(profile.validUntil)} tarihine kadar` : " · süresiz"}`
                : "Ücretsiz plan · günlük limit geçerli"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink href="/profil/ayarlar" variant="secondary" size="sm">
                Ayarlar
              </ButtonLink>
              {!profile.isPremium && (
                <ButtonLink href="/premium" size="sm">
                  Premium’u incele
                </ButtonLink>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
function Shortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="tk-interactive flex min-h-11 items-center justify-between py-2 text-[13px] text-ink hover:text-brand"
    >
      <span>{label}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
