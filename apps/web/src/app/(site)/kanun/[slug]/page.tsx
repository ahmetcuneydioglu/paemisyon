import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import {
  articleSlug,
  publicApi,
  type LawDetail,
  type LawSummary,
} from "@/lib/public-api";
import { config } from "@/lib/config";
import {
  PageFrame,
  PageIntro,
  ClosingCta,
} from "@/components/public/page-frame";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

type Params = Promise<{ slug: string }>;

async function getLaw(slug: string): Promise<LawDetail | null> {
  return publicApi<LawDetail>(`/public/laws/${slug}`, 3600).catch(() => null);
}

/** Bilinen kanunları build'de prerender et (SEO omurgası); yenisi ilk istekte ISR. */
export async function generateStaticParams() {
  const laws = await publicApi<LawSummary[]>("/public/laws", 3600).catch(
    () => [] as LawSummary[],
  );
  return laws.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const law = await getLaw(slug);
  if (!law) return { title: "Kanun bulunamadı" };
  const examStr = law.exams
    .map((e) => `${e.examName} %${e.weightPercent}`)
    .join(", ");
  return {
    title: `${law.name} — Çıkmış Sorular ve Sınav Ağırlığı`,
    description: `${law.name}: ${examStr || "polis sınavı müfredatı"} kapsamında${
      law.questionCount > 0
        ? `, ${law.questionCount} kaynaklı çıkmış soru ile`
        : ""
    } konu çalış. Örnek soru ve açıklaması sayfada.`,
    alternates: { canonical: `/kanun/${slug}` },
  };
}

/**
 * Kanun sayfası — ANON/SEO sürümü (public kabuk, statik/ISR). İstek durumu
 * OKUNMAZ → edge cache. Girişli kullanıcı middleware ile /calisma/kanun/[slug]
 * app kabuğuna (LawWorkspace) rewrite'lanır; URL /kanun/[slug] kalır (Doc 27).
 */
export default async function KanunPage({ params }: { params: Params }) {
  const { slug } = await params;
  const law = await getLaw(slug);
  if (!law) notFound();

  const q = law.sampleQuestion;
  const correct = q?.options.find((o) => o.isCorrect);

  const jsonLd = q
    ? {
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: `${law.name} örnek çıkmış soru`,
        about: law.name,
        url: `${config.siteUrl}/kanun/${slug}`,
        hasPart: [
          {
            "@type": "Question",
            name: q.stem,
            suggestedAnswer: q.options
              .filter((o) => !o.isCorrect)
              .map((o) => ({ "@type": "Answer", text: o.text })),
            acceptedAnswer: correct
              ? { "@type": "Answer", text: correct.text }
              : undefined,
          },
        ],
      }
    : null;

  const kayitMetni =
    law.questionCount > 1
      ? `${law.questionCount} sorunun tamamını çöz — ücretsiz kayıt ol`
      : "Ücretsiz kayıt ol, çalışmaya başla";

  return (
    <PageFrame className="flex flex-col gap-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <PageIntro
        breadcrumb={[
          { label: "Kanun Kütüphanesi", href: "/kanunlar" },
          { label: law.courseName },
          { label: law.name },
        ]}
        eyebrow={law.courseName}
        title={law.name}
        meta={
          <>
            {/* Sınav bağlamı — adayın ilk sorusu: "bu benim sınavımda çıkıyor mu?" */}
            {law.exams.map((e) => (
              <Badge key={e.examKey + e.sectionName} tone="accent">
                {e.examName} · {e.sectionName} · %{e.weightPercent}
              </Badge>
            ))}
            {law.questionCount > 0 && (
              <Badge tone="success">
                {law.questionCount} kaynaklı çıkmış soru
              </Badge>
            )}
          </>
        }
        actions={
          law.readable ? (
            <ButtonLink
              href={`/kanun/${slug}/oku`}
              variant="secondary"
              leadingIcon={<BookOpen size={18} aria-hidden />}
            >
              Kanunun güncel tam metnini oku
            </ButtonLink>
          ) : undefined
        }
      />

      {/* Madde Isı Haritası (Doc 25 §4) — hangi maddeden kaç soru çıkmış */}
      {law.articles.length > 0 && (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 className="type-heading text-ink">
              En çok soru çıkan maddeler
            </h2>
            <p className="type-body-sm mt-1 text-ink-soft">
              Kaynaklı çıkmış sorulardan üretilen dağılım — hangi maddeye
              yoğunlaşman gerektiğini gösterir.
            </p>
          </div>
          <ol className="flex flex-col gap-1">
            {law.articles.slice(0, 10).map((a) => {
              const max = law.articles[0].questionCount;
              const ratio = max > 0 ? a.questionCount / max : 0;
              return (
                <li key={a.no}>
                  <Link
                    href={`/kanun/${slug}/madde/${articleSlug(a.no)}`}
                    className="tk-interactive flex min-h-11 items-center gap-3 rounded-control px-2 type-body-sm text-ink hover:bg-surface-alt"
                  >
                    <span className="w-14 shrink-0 font-mono font-medium">
                      m.{a.no}
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-pill bg-surface-alt">
                      <span
                        className={[
                          "block h-full rounded-pill",
                          ratio >= 0.6 ? "bg-accent" : "bg-accent/40",
                        ].join(" ")}
                        style={{ width: `${Math.max(8, ratio * 100)}%` }}
                      />
                    </span>
                    <span className="tabular w-8 shrink-0 text-right text-ink-soft">
                      {a.questionCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {law.articles.length > 10 && (
            <p className="type-body-sm text-ink-subtle">
              + {law.articles.length - 10} madde daha — tamamı uygulamada.
            </p>
          )}
        </Card>
      )}

      {/* Örnek çıkmış soru */}
      {q ? (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="type-heading text-ink">Örnek çıkmış soru</h2>
          <p className="type-body whitespace-pre-line text-ink">{q.stem}</p>
          <ul className="flex flex-col gap-1.5">
            {q.options.map((o) => (
              <li
                key={o.id}
                className="type-body-sm flex gap-3 rounded-control border border-line px-3 py-2 text-ink"
              >
                <span className="shrink-0 font-semibold text-ink-soft">
                  {o.label})
                </span>
                <span>{o.text}</span>
              </li>
            ))}
          </ul>
          <details className="rounded-control bg-surface-alt p-3">
            <summary className="type-subhead cursor-pointer text-accent-ink">
              Cevabı ve açıklamayı göster
            </summary>
            <div className="type-body-sm mt-2 flex flex-col gap-1 text-ink">
              {correct && (
                <p>
                  Doğru cevap:{" "}
                  <b className="font-semibold">
                    {correct.label}) {correct.text}
                  </b>
                </p>
              )}
              {q.explanation && (
                <p className="text-ink-soft">{q.explanation}</p>
              )}
            </div>
          </details>
          <div>
            <ButtonLink href="/kayit">{kayitMetni}</ButtonLink>
          </div>
        </Card>
      ) : (
        <Card
          tone="alt"
          className="type-body-sm border-dashed p-5 text-ink-soft"
        >
          Bu mevzuatın çıkmış soruları yakında ekleniyor. Müfredattaki yeri
          yukarıda —{" "}
          <Link
            href="/kayit"
            className="font-semibold text-accent-ink hover:underline"
          >
            kayıt ol
          </Link>
          , eklendiğinde koçun sana haber versin.
        </Card>
      )}

      {/* İlgili mevzuat — iç bağlantı ağı */}
      {law.related.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title={`${law.courseName} dersindeki diğer mevzuat`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {law.related.map((r) => (
              <Link
                key={r.slug}
                href={`/kanun/${r.slug}`}
                className="tk-interactive flex items-baseline justify-between gap-3 rounded-card border border-line bg-surface p-4 hover:border-ink-soft"
              >
                <span className="type-subhead text-ink">{r.name}</span>
                {r.questionCount > 0 && (
                  <span className="type-body-sm shrink-0 text-ink-soft">
                    {r.questionCount} soru
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!q && law.readable ? null : (
        <ClosingCta
          title="Bu kanunu koçunla çalış"
          body="Madde madde ilerle, yanlışların tekrar listesine düşsün, sınava yakın tekrar gelsin."
          actions={<ButtonLink href="/kayit">Ücretsiz başla</ButtonLink>}
        />
      )}
    </PageFrame>
  );
}
