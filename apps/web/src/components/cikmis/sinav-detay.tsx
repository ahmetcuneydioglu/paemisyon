import type { CikmisSinavDetay } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { PageFrame, PageIntro } from "@/components/public/page-frame";
import { SinavQuiz } from "./sinav-quiz";
import { TurRozeti, turAciklamasi } from "./tur-rozeti";

/**
 * Çıkmış sınav detay sayfası (Doc 36 §4).
 *
 * Cevap `<details>` içinde: JavaScript gerekmez, arama motoru içeriği görür,
 * aday da şıkları görüp düşünmeden cevaba bakmaz.
 */
export function SinavDetay({ sinav }: { sinav: CikmisSinavDetay }) {
  const resmi = sinav.tur === "resmi";
  return (
    <PageFrame width="narrow">
      <article className="flex flex-col gap-8">
        <PageIntro
          breadcrumb={[
            { label: "Çıkmış Sorular", href: "/paem-cikmis-sorular" },
            { label: "PAEM" },
            { label: sinav.ad },
          ]}
          eyebrow={<TurRozeti tur={sinav.tur} />}
          title={sinav.ad}
          lead={sinav.ozet ?? turAciklamasi(sinav.tur)}
          meta={
            <dl className="flex flex-wrap gap-x-6 gap-y-1">
              <div className="flex gap-1.5">
                <dt>Kurum:</dt>
                <dd className="font-semibold text-ink">{sinav.kurum}</dd>
              </div>
              {sinav.tarih && (
                <div className="flex gap-1.5">
                  <dt>Tarih:</dt>
                  <dd className="font-semibold text-ink">
                    {new Date(sinav.tarih).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              {sinav.soruSayisi !== null && (
                <div className="flex gap-1.5">
                  <dt>Soru:</dt>
                  <dd className="font-semibold text-ink">{sinav.soruSayisi}</dd>
                </div>
              )}
              {sinav.iptalSayisi > 0 && (
                <div className="flex gap-1.5">
                  <dt>İptal edilen:</dt>
                  <dd className="font-semibold text-ink">
                    {sinav.iptalSayisi}
                  </dd>
                </div>
              )}
            </dl>
          }
        />

        <KonuDagilimi sinav={sinav} />

        {sinav.sorular.length > 0 && (
          <SinavQuiz
            sorular={sinav.sorular}
            kapaliSoru={sinav.kapaliSoru}
            examId={sinav.examId}
            slug={sinav.slug}
          />
        )}

        {resmi && sinav.sorular.length === 0 && sinav.kapaliSoru > 0 && (
          <Card tone="accent" className="flex flex-col items-start gap-3 p-5">
            <div>
              <h2 className="type-heading text-ink">
                {sinav.kapaliSoru} soru uygulamada
              </h2>
              <p className="type-body-sm mt-1 max-w-[60ch] text-ink-soft">
                Sınavın tamamını süre tutarak çöz, netini gör, yanlışların
                çalışma defterine düşsün.
              </p>
            </div>
            <ButtonLink href="/kayit" size="lg">
              Ücretsiz başla
            </ButtonLink>
          </Card>
        )}
      </article>
    </PageFrame>
  );
}

/** Ders ve kanun kırılımı — `analiz` türü sınavların tek içeriği budur. */
function KonuDagilimi({ sinav }: { sinav: CikmisSinavDetay }) {
  const kanun = sinav.analiz?.kanunDagilim;
  const toplam = sinav.dersDagilimi.reduce((a, d) => a + d.adet, 0) || 1;
  if (!sinav.dersDagilimi.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-heading text-ink">Konu dağılımı</h2>
      {sinav.analiz?.uyari && (
        <Notice tone="warning">
          {sinav.analiz.uyari}
          {sinav.analiz.kaynak && <> Kaynak: {sinav.analiz.kaynak}.</>}
        </Notice>
      )}
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[420px] border-collapse">
          <caption className="sr-only">Derslere göre soru sayısı</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="type-label px-4 py-3 text-ink-subtle">
                Ders
              </th>
              <th
                scope="col"
                className="type-label px-4 py-3 text-right text-ink-subtle"
              >
                Soru
              </th>
              <th
                scope="col"
                className="type-label w-1/2 px-4 py-3 text-ink-subtle"
              >
                Pay
              </th>
            </tr>
          </thead>
          <tbody>
            {sinav.dersDagilimi.map((d) => (
              <tr key={d.ders} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className="type-body-sm px-4 py-2.5 text-left font-normal text-ink"
                >
                  {d.ders}
                </th>
                <td className="type-subhead tabular px-4 py-2.5 text-right text-ink">
                  {d.adet}
                </td>
                <td className="px-4 py-2.5">
                  <span className="block h-2 overflow-hidden rounded-pill bg-surface-alt">
                    <span
                      className="block h-full rounded-pill bg-accent"
                      style={{
                        width: `${Math.round((d.adet / toplam) * 100)}%`,
                      }}
                      aria-hidden
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {kanun && Object.keys(kanun).length > 0 && (
        <details className="rounded-card border border-line bg-surface p-4">
          <summary className="type-subhead cursor-pointer text-ink">
            Polis Mevzuatı kanun kırılımı
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(kanun).map(([no, adet]) => (
              <li key={no}>
                <Badge>
                  {no} sayılı Kanun{" "}
                  <span className="font-semibold text-ink">{adet}</span>
                </Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
