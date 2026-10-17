import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Medal } from "lucide-react";
import { api } from "@/lib/api";
import type { BadgeCatalog, CoachBrief, MeProfile } from "@/lib/public-api";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress";
import { RankInsignia } from "@/components/ui/rank-insignia";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDate } from "@/lib/format";
import { signOut } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Ben — profil (Doc 27 §3.10): kimlik kartı, rütbe, rozet vitrini, hedef planı, kısayollar. */
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
    .filter((b) => b.earned)
    .sort((a, b) => +new Date(b.earnedAt ?? 0) - +new Date(a.earnedAt ?? 0));
  const initial =
    profile.displayName?.trim().charAt(0).toLocaleUpperCase("tr-TR") ||
    profile.email.charAt(0).toUpperCase();
  const daysToExam = brief.daysToExam ?? null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="type-label text-accent-ink">Ben</span>
          <h1 className="type-title text-ink">Profilin</h1>
          <p className="type-body-sm text-ink-soft">
            Hedefin, emeğin ve biriktirdiğin ilerleme tek yerde.
          </p>
        </div>
        <ButtonLink href="/profil/ayarlar" variant="secondary">
          Profili ve hedefleri düzenle
        </ButtonLink>
      </div>

      <Card className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
        <div
          className="flex size-16 items-center justify-center rounded-full bg-accent font-display text-2xl font-bold text-on-accent"
          aria-label="Profil resmi yerine ad baş harfi"
        >
          {initial}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-heading truncate text-ink">
              {profile.displayName || "Kullanıcı"}
            </h2>
            <Badge tone={profile.isPremium ? "warning" : "neutral"}>
              {profile.isPremium ? "Premium" : "Ücretsiz"}
            </Badge>
          </div>
          <div className="type-body-sm flex flex-wrap items-center gap-2 text-ink-soft">
            <span className="truncate">{profile.email}</span>
            {profile.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-success-ink">
                <Check size={14} aria-hidden /> Doğrulandı
              </span>
            ) : (
              <span className="text-warning-ink">Doğrulanmadı</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Hedef: {profile.preferredModule?.name ?? "Seçilmedi"}</Badge>
            <Badge>Günlük hedef: {profile.dailyGoal} soru</Badge>
            {profile.dailyMinutes ? (
              <Badge>{profile.dailyMinutes} dk/gün</Badge>
            ) : null}
            {daysToExam != null ? (
              <Badge tone="accent">Sınava {daysToExam} gün</Badge>
            ) : null}
          </div>
        </div>
        {rank ? (
          <RankInsignia level={rank.level} name={rank.name} size="lg" />
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Toplam soru" value={brief.stats?.totalSolved ?? 0} />
        <StatTile label="Doğruluk" value={`%${brief.stats?.accuracy ?? 0}`} />
        <StatTile
          label="Güncel seri"
          value={brief.today.streak.current}
          unit="gün"
          emphasis
        />
        <StatTile
          label="En iyi net"
          value={brief.gamification.records.bestNet?.toFixed(2) ?? null}
          hint={
            brief.gamification.records.bestNet == null
              ? "Henüz deneme yok"
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {rank ? (
            <Card className="flex items-start gap-4">
              <RankInsignia level={rank.level} name={rank.name} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <CardTitle>{rank.name}</CardTitle>
                {rank.next ? (
                  <>
                    <p className="type-body-sm text-ink-soft">
                      Sıradaki rütbe:{" "}
                      <strong className="text-ink">{rank.next.name}</strong>
                    </p>
                    <ProgressBar
                      value={rankPercent / 100}
                      height={6}
                      label="Rütbe ilerlemesi"
                    />
                    <p className="type-body-sm tabular text-ink-subtle">
                      {rank.next.minScore - rank.score} puan kaldı · %
                      {rankPercent}
                    </p>
                  </>
                ) : (
                  <p className="type-body-sm text-success-ink">
                    Terfi yolunun son kapısındasın.
                  </p>
                )}
              </div>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Rozet vitrini</CardTitle>
                <p className="type-body-sm text-ink-soft">
                  {badges.earnedCount}/{badges.totalCount} rozet kazanıldı
                </p>
              </div>
              <Link
                href="/profil/rozetler"
                className="type-subhead inline-flex items-center gap-1 text-accent-ink hover:underline"
              >
                Tümünü gör <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
            {earned.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {earned.slice(0, 3).map((b) => (
                  <div
                    key={b.key}
                    className="flex flex-col gap-1 rounded-control border border-accent/30 bg-accent-soft p-3"
                  >
                    <Medal size={18} className="text-accent-ink" aria-hidden />
                    <p className="type-subhead text-ink">{b.name}</p>
                    <p className="type-body-sm text-ink-soft">
                      {b.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="type-body-sm text-ink-soft">
                İlk turunu tamamladığında vitrinin burada oluşacak.
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex flex-col gap-3">
            <CardTitle>Hedef planın</CardTitle>
            <dl className="type-body-sm flex flex-col gap-2">
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
                label="Günlük süre"
                value={
                  profile.dailyMinutes
                    ? `${profile.dailyMinutes} dk`
                    : "Seçilmedi"
                }
              />
              <Row
                label="Haftalık tempo"
                value={`${brief.gamification.weekly.activeDays}/${brief.gamification.weekly.goalDays} aktif gün`}
              />
            </dl>
          </Card>
          <Card className="flex flex-col gap-1">
            <CardTitle>Kısayollar</CardTitle>
            <nav aria-label="Profil kısayolları" className="flex flex-col">
              <ListRow title="Denemelerim" href="/profil/denemelerim" />
              <ListRow title="Yanlışlarım" href="/kutuphane/yanlislar" />
              <ListRow title="Favorilerim" href="/kutuphane/favoriler" />
              <ListRow
                title="Performans detayım"
                href="/performans"
                divider={false}
              />
            </nav>
          </Card>
          <Card className="flex flex-col gap-3">
            <CardTitle>Hesap ve plan</CardTitle>
            <p className="type-body-sm text-ink-soft">
              {profile.isPremium
                ? `Premium${profile.validUntil ? ` · ${formatDate(profile.validUntil)} tarihine kadar` : " · süresiz"}`
                : "Ücretsiz plan · günlük limit geçerli"}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/profil/ayarlar" variant="secondary" size="sm">
                Ayarlar
              </ButtonLink>
              {!profile.isPremium ? (
                <ButtonLink href="/premium" size="sm">
                  Premium’u incele
                </ButtonLink>
              ) : null}
            </div>
            <form action={signOut} className="border-t border-line pt-3">
              <button
                type="submit"
                className="tk-interactive type-subhead min-h-11 text-danger-ink hover:underline"
              >
                Çıkış yap
              </button>
            </form>
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
