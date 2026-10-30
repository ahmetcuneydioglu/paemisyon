import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { publicApi } from "@/lib/public-api";
import { unitDescription, type SummaryUnitDetail } from "@/lib/ozet";
import { PageFrame, PageIntro, ClosingCta } from "@/components/public/page-frame";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { CoachRail } from "@/components/shell/coach-rail";
import { UnitReader } from "@/components/ozet/unit-reader";

type Params = Promise<{ slug: string }>;

/** Misafir yanıtı ISR ile saatte bir tazelenir; girişli yanıt kullanıcıya özel (kilit, ilerleme). */
const OZET_REVALIDATE_SECONDS = 3600;

export const dynamic = "force-dynamic";

async function getPublicUnit(slug: string): Promise<SummaryUnitDetail | null> {
  return publicApi<SummaryUnitDetail>(`/public/summaries/${slug}`, OZET_REVALIDATE_SECONDS).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const u = await getPublicUnit(slug);
  if (!u) return { title: "Özet bulunamadı", robots: { index: false } };
  return {
    title: `${u.title.split(" — ")[0]} — ${u.legislation.shortName ?? u.legislation.name} Konu Özeti`,
    description: unitDescription(u),
    alternates: { canonical: `/ozet/${slug}` },
  };
}

/**
 * Konu özeti ünitesi (Doc 53 §6) — aynı URL iki derinlik: misafire SEO sayfası (ilk kartlar +
 * kapı), girişliye okuyucu (ilerleme, köprü). Kaynak etiketi hiçbir sürümde yok.
 */
export default async function OzetPage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const unit = user
    ? await api<SummaryUnitDetail>(`/public/summaries/${slug}`).catch(() => null)
    : await getPublicUnit(slug);
  if (!unit) notFound();

  const kisaBaslik = unit.title.split(" — ")[0];
  const loginHref = `/giris?next=${encodeURIComponent(`/ozet/${slug}`)}`;
  const crumbs = user
    ? [
        { label: "Kütüphane", href: "/kutuphane" },
        { label: unit.topic.name, href: `/kutuphane/konu/${unit.topic.id}` },
        { label: kisaBaslik },
      ]
    : [
        { label: "Kanunlar", href: "/kanunlar" },
        { label: unit.legislation.shortName ?? unit.legislation.name, href: `/kanun/${unit.legislation.slug}` },
        { label: kisaBaslik },
      ];
  const meta = (
    <>
      <span>
        {unit.legislation.name} md {unit.articleLabel ?? `${unit.articleFrom}–${unit.articleTo}`}
      </span>
      <span aria-hidden>·</span>
      <span>{unit.readingMinutes} dk okuma</span>
      <span aria-hidden>·</span>
      <span>{unit.totalBlocks} kart</span>
      {unit.isPremium ? <PremiumBadge variant={unit.locked ? "solid" : "soft"} /> : null}
    </>
  );

  if (user) {
    return (
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Breadcrumb items={crumbs} />
          <header className="flex flex-col gap-2">
            <h1 className="type-title text-balance text-ink">{unit.title}</h1>
            {unit.subtitle ? <p className="type-body text-ink-soft">{unit.subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-2 type-body-sm text-ink-soft">{meta}</div>
          </header>
          <UnitReader unit={unit} loggedIn premiumHref="/premium" loginHref={loginHref} />
        </div>
        <CoachRail />
      </div>
    );
  }

  return (
    <PageFrame width="default">
      <div className="flex flex-col gap-8">
        <PageIntro
          breadcrumb={crumbs}
          eyebrow="Konu özeti"
          title={unit.title}
          lead={unit.subtitle ?? undefined}
          meta={meta}
          actions={
            <ButtonLink href={`/kanun/${unit.legislation.slug}`} variant="secondary">
              {unit.legislation.shortName ?? unit.legislation.name} maddeleri
            </ButtonLink>
          }
        />
        <UnitReader unit={unit} loggedIn={false} premiumHref="/premium" loginHref={loginHref} />
        <ClosingCta
          title="Özeti okudun, sırada soru var"
          body="Ücretsiz hesapla bu maddelerden çıkmış sorularla kendini sına; koç zayıf noktanı bulsun."
          actions={
            <>
              <ButtonLink href="/kayit">Ücretsiz başla</ButtonLink>
              <ButtonLink href={loginHref} variant="secondary">
                Giriş yap
              </ButtonLink>
            </>
          }
        />
      </div>
    </PageFrame>
  );
}
