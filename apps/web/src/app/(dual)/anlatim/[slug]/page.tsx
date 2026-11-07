import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { publicApi } from "@/lib/public-api";
import { lessonDescription, type LessonDetail } from "@/lib/anlatim";
import { PageFrame, PageIntro, ClosingCta } from "@/components/public/page-frame";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { CoachRail } from "@/components/shell/coach-rail";
import { LessonReader } from "@/components/anlatim/lesson-reader";

type Params = Promise<{ slug: string }>;

/** Misafir yanıtı ISR ile saatte bir tazelenir (yayın kancası anında tazeler); girişli yanıt kullanıcıya özel. */
const ANLATIM_REVALIDATE_SECONDS = 3600;

export const dynamic = "force-dynamic";

async function getPublicLesson(slug: string): Promise<LessonDetail | null> {
  return publicApi<LessonDetail>(`/public/lessons/${slug}`, ANLATIM_REVALIDATE_SECONDS).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getPublicLesson(slug);
  if (!l) return { title: "Ders bulunamadı", robots: { index: false } };
  return {
    title: `${l.title} — ${l.section.title} · Konu anlatımı`,
    description: lessonDescription(l),
    alternates: { canonical: `/anlatim/${slug}` },
    robots: l.locked ? { index: true, follow: true } : undefined,
  };
}

/**
 * Konu anlatımı dersi (Doc 57) — aynı URL iki derinlik: misafire SEO sayfası (gövde + kapı), girişliye
 * okuyucu (kaldığı yer, okudum). Kaynak kitap künyesi hiçbir sürümde yok; kaynakçada yalnız kamuya açık kaynaklar.
 */
export default async function AnlatimPage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const lesson = user ? await api<LessonDetail>(`/public/lessons/${slug}`).catch(() => null) : await getPublicLesson(slug);
  if (!lesson) notFound();

  const loginHref = `/giris?next=${encodeURIComponent(`/anlatim/${slug}`)}`;
  const crumbs = user
    ? [{ label: "Kütüphane", href: "/kutuphane" }, { label: lesson.section.title }, { label: lesson.title }]
    : [{ label: "Kanunlar", href: "/kanunlar" }, { label: lesson.section.title }, { label: lesson.title }];
  const meta = (
    <>
      <span>
        Ders {lesson.order} / {lesson.section.lessonCount}
      </span>
      <span aria-hidden>·</span>
      <span>{lesson.readingMinutes} dk okuma</span>
      {lesson.section.isPremium ? <PremiumBadge variant={lesson.locked ? "solid" : "soft"} /> : null}
    </>
  );

  if (user) {
    return (
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Breadcrumb items={crumbs} />
          <header className="flex flex-col gap-2">
            <p className="type-label text-accent-ink">{lesson.section.title}</p>
            <h1 className="type-title text-balance text-ink">{lesson.title}</h1>
            <p className="type-body text-ink-soft">{lesson.goal}</p>
            <div className="flex flex-wrap items-center gap-2 type-body-sm text-ink-soft">{meta}</div>
          </header>
          <LessonReader lesson={lesson} loggedIn premiumHref="/premium" loginHref={loginHref} />
        </div>
        <CoachRail />
      </div>
    );
  }

  return (
    <PageFrame width="default">
      <div className="flex flex-col gap-8">
        <PageIntro breadcrumb={crumbs} eyebrow={`Konu anlatımı · ${lesson.section.title}`} title={lesson.title} lead={lesson.goal} meta={meta} />
        <LessonReader lesson={lesson} loggedIn={false} premiumHref="/premium" loginHref={loginHref} />
        <ClosingCta
          title="Dersi okudun, sırada soru var"
          body="Ücretsiz hesapla bu konudan çıkmış sorularla kendini sına; kaldığın yer ve okuduğun dersler hesabında saklansın."
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
