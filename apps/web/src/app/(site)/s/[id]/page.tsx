import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { publicApi, type SharedQuestion } from "@/lib/public-api";
import { PageFrame } from "@/components/public/page-frame";
import { QuestionOption, QuestionStem } from "@/components/ui/question";
import { StoreBadges } from "@/components/store-badges";

/**
 * Paylaşılan soru iniş sayfası — `paemisyon.com/s/<id>` (F10-P, Doc 49/15 §5).
 *
 * Paylaşım kartındaki bağlantı buraya düşer: uygulama yüklüyse universal link
 * soruyu uygulamada açar, yoksa bu sayfa soruyu cevapsız gösterir ve mağaza /
 * giriş kancasını verir. Banka sorusu SEO'ya açılmaz (`noindex`); kaynak
 * etiketi, anahtar ve açıklama sunucudan zaten gelmez.
 */
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

const DIFFICULTY: Record<SharedQuestion["difficulty"], string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

async function soruGetir(id: string): Promise<SharedQuestion | null> {
  // UUID dışı istekler API'ye gitmeden 404 (ISR önbelleğine çöp düşmesin).
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return publicApi<SharedQuestion>(`/public/questions/${id}/share`, 3600).catch(
    () => null,
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const soru = await soruGetir(id);
  return {
    title: soru ? `Soru · ${soru.courseName}` : "Soru bulunamadı",
    description: soru
      ? `${soru.courseName} / ${soru.topicName} — bu soruyu sen de çöz.`
      : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PaylasilanSoruPage({ params }: Params) {
  const { id } = await params;
  const soru = await soruGetir(id);
  if (!soru) notFound();

  return (
    <PageFrame width="narrow" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="type-label text-ink-subtle">
          Paylaşılan soru · {soru.courseName}
        </p>
        <h1 className="type-title text-ink">{soru.topicName}</h1>
        <p className="type-body-sm text-ink-soft">
          {DIFFICULTY[soru.difficulty]}
          {soru.relatedArticleRef ? ` · ${soru.relatedArticleRef.label}` : ""}
        </p>
      </header>

      <section
        aria-label="Soru"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-6"
      >
        <QuestionStem index={0} total={1} counter={false} stem={soru.stem} />
        <ul className="flex flex-col gap-2.5">
          {soru.options.map((o) => (
            <li key={o.id}>
              <QuestionOption label={o.label} text={o.text} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Bu soruyu çöz"
        className="theme-dark flex flex-col gap-4 rounded-panel bg-panel p-5 text-panel-ink md:p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="type-heading">Bu soruyu sen de çöz</h2>
          <p className="type-body-sm text-panel-soft">
            Kaynağa dayalı açıklama ve madde metniyle birlikte. Uygulamada ya da
            web&apos;de; hesap ücretsiz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StoreBadges width={138} wrap />
          <Link
            href="/giris?next=%2Fbugun"
            className="tk-interactive inline-flex h-11 items-center gap-1.5 rounded-control bg-accent px-4 type-subhead text-on-accent"
          >
            Web&apos;de çöz <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
