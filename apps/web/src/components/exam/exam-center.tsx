import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { ExamListItem } from "@/lib/types";
import type { CikmisSinavOzet, MeDashboard } from "@/lib/public-api";
import { groupExams, fmtNet } from "@/lib/exam-ui";
import { personalExamState } from "@/lib/personal-exam";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { CoachRail } from "@/components/shell/coach-rail";
import { ExamCard } from "./exam-card";
import { ExamHero } from "./exam-hero";

/**
 * Deneme merkezi (Doc 50 M1 / W1): tek sayfa, dört grup.
 * Hero (devam eden > sıradaki haftalık > sakin) · Denemeler (serbest) · Haftalık
 * deneme · Bana özel · Çıkmış sınavlar. Koç rayı L2 gereği sağda; 768'de alta iner.
 */
export function ExamCenter({
  exams,
  dashboard = null,
  reminding = false,
  pastExams = [],
  lastPersonal = null,
}: {
  exams: ExamListItem[];
  /** Kişisel deneme hakkı (Doc 46); çekilemediyse kart kısıtsız çizilir. */
  dashboard?: MeDashboard | null;
  reminding?: boolean;
  pastExams?: CikmisSinavOzet[];
  lastPersonal?: { attemptId: string; score: number | null; completedAt: string | null } | null;
}) {
  const { serbest, haftalik } = groupExams(exams);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-7">
        <header className="flex flex-col gap-1">
          <span className="type-subhead text-ink-subtle">PAEM hazırlığı</span>
          <h1 className="type-title text-ink">Denemeler</h1>
        </header>

        <ExamHero exams={exams} reminding={reminding} />

        {exams.length === 0 ? (
          <Card>
            <EmptyState
              title="Henüz deneme yok"
              body="İlk deneme yayınlanınca burada görünür. Bu arada kişisel deneme oluşturabilirsin."
              action={<ButtonLink href="/denemeler/kisisel" variant="secondary">Kişisel deneme oluştur</ButtonLink>}
            />
          </Card>
        ) : null}

        {serbest.length > 0 ? (
          <section className="flex flex-col gap-3" aria-labelledby="g-denemeler">
            <SectionHeader title="Denemeler" />
            <div className="grid gap-4 md:grid-cols-2">
              {serbest.map((e) => (
                <ExamCard key={e.id} exam={e} loggedIn />
              ))}
            </div>
          </section>
        ) : null}

        {haftalik.length > 0 ? (
          <section className="flex flex-col gap-3" aria-labelledby="g-haftalik">
            <SectionHeader title="Haftalık deneme" action={{ label: "Geçmiş", href: "/profil/denemelerim" }} />
            <div className="grid gap-4 md:grid-cols-2">
              {haftalik.map((e) => (
                <ExamCard key={e.id} exam={e} loggedIn />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="flex flex-col gap-3" aria-labelledby="g-ozel">
            <SectionHeader title="Bana özel" />
            <PersonalExamCard dashboard={dashboard} last={lastPersonal} />
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="g-cikmis">
            <SectionHeader title="Çıkmış sınavlar" action={{ label: "Tümü", href: "/paem-cikmis-sorular" }} />
            <Card className="py-1">
              {pastExams.length === 0 ? (
                <ListRow
                  leading={<BookOpen size={20} aria-hidden />}
                  title="PAEM çıkmış sorular"
                  subtitle="Resmî sınavları sınav gibi çöz"
                  href="/paem-cikmis-sorular"
                  divider={false}
                />
              ) : (
                pastExams.slice(0, 3).map((p, i) => (
                  <ListRow
                    key={p.slug}
                    leading={<BookOpen size={20} aria-hidden />}
                    title={p.ad}
                    subtitle={`${p.soruSayisi ?? 100} gerçek soru · sınav gibi çöz`}
                    href={`/paem-cikmis-sorular/${p.slug}`}
                    divider={i < Math.min(pastExams.length, 3) - 1}
                  />
                ))
              )}
            </Card>
          </section>
        </div>

        <Link
          href="/profil/denemelerim"
          className="type-subhead inline-flex items-center justify-center gap-1 self-center text-accent-ink hover:underline"
        >
          Deneme geçmişin <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      <CoachRail />
    </div>
  );
}

/**
 * "Bana özel" kartı (Doc 46 + Doc 50 M1). Kilit arayüzde DÜRÜSTÇE gösterilir; asıl
 * karar noktası sunucudur (startPersonalExam). Oluşturma sayfası uzunluk/havuz seçer.
 */
function PersonalExamCard({
  dashboard,
  last,
}: {
  dashboard: MeDashboard | null;
  last: { attemptId: string; score: number | null; completedAt: string | null } | null;
}) {
  const { sinirsiz, kalan, hakkiBitti } = personalExamState(dashboard);
  return (
    <Card className="flex flex-col gap-3">
      <p className="type-heading inline-flex items-center gap-2 text-ink">
        <Sparkles size={18} className="text-accent-ink" aria-hidden /> Kişisel deneme
      </p>
      <p className="type-body-sm text-ink-soft">
        Yanlışlarından ve zayıf konularından seçilen sorular; resmî PAEM dağılımıyla. Sıralamaya girmez, sana ölçüm.
      </p>
      {!sinirsiz ? (
        <p className="type-body-sm text-ink-soft">
          {hakkiBitti ? "Bugünkü hakkını kullandın — yarın yenileniyor." : <>Bugün <strong className="text-ink">{kalan} hakkın</strong> var.</>}{" "}
          <Link href="/premium" className="font-semibold text-accent-ink hover:underline">
            Premium&apos;da sınırsız
          </Link>
        </p>
      ) : null}
      {hakkiBitti ? (
        <ButtonLink href="/premium" variant="secondary" leadingIcon={<PremiumBadge variant="soft" label="" className="px-1" />}>
          Premium ile aç
        </ButtonLink>
      ) : (
        <ButtonLink href="/denemeler/kisisel">Oluştur</ButtonLink>
      )}
      {last ? (
        <p className="type-body-sm text-ink-subtle">
          Son: {last.completedAt ? formatDate(last.completedAt) : "—"} · {fmtNet(last.score)} net ·{" "}
          <Link href={`/sonuc/${last.attemptId}`} className="font-semibold text-accent-ink hover:underline">
            Sonucu gör ›
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
