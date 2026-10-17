import Link from "next/link";
import type { ExamGuide } from "@/lib/public-api";
import {
  PageFrame,
  PageIntro,
  ClosingCta,
} from "@/components/public/page-frame";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

/**
 * Bölüm payları tek vurgu renginin kademeleriyle çizilir (karar 3: dört vurgu
 * tek vurguya indi). Sıra, ağırlık sırasıdır; renk tek başına anlam taşımaz —
 * etiket ve yüzde her dilimde yazılıdır.
 */
const SEGMENT_OPACITY = [
  "bg-accent",
  "bg-accent/80",
  "bg-accent/60",
  "bg-accent/45",
  "bg-accent/30",
  "bg-accent/20",
];
/* Soluk dilimlerde koyu "on-accent" metin kaybolur; orada zemin rengine göre okunur mürekkep kullanılır. */
const SEGMENT_TEXT = [
  "text-on-accent",
  "text-on-accent",
  "text-ink",
  "text-ink",
  "text-ink",
  "text-ink",
];

/**
 * Sınav rehberi gövdesi (Doc 23): bölüm ağırlıkları + ders/konu envanteri,
 * tamamı DB'den — içerik yazımı yok. /paem ve /misyon bunu paylaşır.
 */
export function ExamGuideBody({ guide }: { guide: ExamGuide }) {
  return (
    <PageFrame className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Sınav rehberi"
        title={`${guide.name} Sınavı Rehberi`}
        lead={guide.description ?? undefined}
        meta={
          <span>
            {guide.sections.length} bölüm · Paemisyon bankasında{" "}
            {guide.totalQuestions} kaynaklı çıkmış soru
          </span>
        }
      />

      {/* Ağırlık çubuğu */}
      <section className="flex flex-col gap-3">
        <h2 className="type-heading text-ink">Bölümler ve ağırlıkları</h2>
        <div
          className="flex h-8 w-full overflow-hidden rounded-pill bg-surface-alt"
          role="img"
          aria-label="Bölüm ağırlıkları"
        >
          {guide.sections.map((s, i) => (
            <div
              key={s.name}
              className={[
                "flex items-center justify-center overflow-hidden type-label",
                SEGMENT_OPACITY[i % SEGMENT_OPACITY.length],
                SEGMENT_TEXT[i % SEGMENT_TEXT.length],
              ].join(" ")}
              style={{ width: `${s.weightPercent}%` }}
              title={`${s.name} %${s.weightPercent}`}
            >
              %{s.weightPercent}
            </div>
          ))}
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {guide.sections.map((s, i) => (
            <li
              key={s.name}
              className="type-body-sm flex items-center gap-2 text-ink-soft"
            >
              <span
                className={[
                  "inline-block size-3 shrink-0 rounded-[3px]",
                  SEGMENT_OPACITY[i % SEGMENT_OPACITY.length],
                ].join(" ")}
                aria-hidden
              />
              {s.name} — %{s.weightPercent}
            </li>
          ))}
        </ul>
      </section>

      {/* Bölüm detayları */}
      <div className="flex flex-col gap-4">
        {guide.sections.map((s) => (
          <Card key={s.name} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="type-heading text-ink">{s.name}</h3>
              <Badge tone="accent">%{s.weightPercent}</Badge>
            </div>
            {s.courses.map((c) => (
              <div
                key={c.name}
                className="flex flex-col gap-2 border-t border-line pt-3"
              >
                <p className="type-subhead text-ink">
                  {c.name}
                  <span className="type-body-sm ml-2 font-normal text-ink-soft">
                    {c.topicCount} konu
                    {c.questionCount > 0
                      ? ` · ${c.questionCount} çıkmış soru`
                      : ""}
                  </span>
                </p>
                {c.lawTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.lawTopics.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/kanun/${t.slug}`}
                        className="tk-interactive inline-flex min-h-8 items-center rounded-pill border border-line px-2.5 type-body-sm text-ink-soft hover:border-ink-soft hover:text-ink"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Çıkmış sınavlara iç bağlantı (Doc 36): rehber sayfası bu ürünün en
          doğal giriş kapısı — arayan aday önce "PAEM nedir"e, sonra "ne
          çıkmış"a bakıyor. */}
      {guide.key === "paem" && (
        <Card className="flex flex-col items-start gap-3 p-5">
          <div>
            <h2 className="type-heading text-ink">
              PAEM&apos;de gerçekten ne çıktı?
            </h2>
            <p className="type-body-sm mt-1 max-w-[60ch] text-ink-soft">
              Yayımlanmış dönemlerin soruları cevaplarıyla ve kanun
              dayanaklarıyla, yayımlanmayanların konu dağılımı dönem dönem
              burada.
            </p>
          </div>
          <ButtonLink href="/paem-cikmis-sorular" variant="secondary">
            PAEM Çıkmış Sorular
          </ButtonLink>
        </Card>
      )}

      <ClosingCta
        title={`${guide.name} hazırlığına bugün başla`}
        body="Kaynaklı çıkmış sorular, canlı denemeler ve seni tanıyan kişisel koç — ücretsiz."
        actions={<ButtonLink href="/kayit">Ücretsiz kayıt ol</ButtonLink>}
      />
    </PageFrame>
  );
}
