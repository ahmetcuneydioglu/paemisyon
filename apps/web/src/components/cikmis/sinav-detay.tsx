import Image from "next/image";
import type { CikmisSinavDetay, CikmisSinavSoru } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { TurRozeti, turAciklamasi } from "./tur-rozeti";

/**
 * Çıkmış sınav detay sayfası (Doc 36 §4).
 *
 * Cevap `<details>` içinde: JavaScript gerekmez, arama motoru içeriği görür,
 * aday da şıkları görüp düşünmeden cevaba bakmaz.
 */
export function SinavDetay({ sinav }: { sinav: CikmisSinavDetay }) {
  const resmi = sinav.tur === "resmi";
  // `.tk-scope`: yeni ekranların taban yüzeyi (Doc 26) — koyu temada zemini
  // ve token'ları verir. Okuma sayfası olduğu için genişlik dar tutuldu.
  return (
    <div className="tk-scope bg-surface-alt">
      <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-ink">
        <header className="space-y-3">
          <TurRozeti tur={sinav.tur} />
          <h1 className="font-heading text-2xl font-bold leading-tight text-brand sm:text-[30px]">
            {sinav.ad}
          </h1>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
            {sinav.ozet ?? turAciklamasi(sinav.tur)}
          </p>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-soft">
            <div className="flex gap-1.5">
              <dt>Kurum:</dt>
              <dd className="font-bold text-ink">{sinav.kurum}</dd>
            </div>
            {sinav.tarih && (
              <div className="flex gap-1.5">
                <dt>Tarih:</dt>
                <dd className="font-bold text-ink">
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
                <dd className="font-bold text-ink">{sinav.soruSayisi}</dd>
              </div>
            )}
            {sinav.iptalSayisi > 0 && (
              <div className="flex gap-1.5">
                <dt>İptal edilen:</dt>
                <dd className="font-bold text-ink">{sinav.iptalSayisi}</dd>
              </div>
            )}
          </dl>
        </header>

        <KonuDagilimi sinav={sinav} />

        {sinav.sorular.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-[19px] font-bold text-ink">
              Sınavdan {sinav.sorular.length} soru
            </h2>
            <p className="max-w-[68ch] text-[14px] leading-relaxed text-ink-soft">
              Her sorunun altında cevabın dayanağı var: hangi madde, neden o şık. Cevabı
              görmeden önce kendin çözmeyi dene.
            </p>
            <ol className="space-y-3">
              {sinav.sorular.map((s) => (
                <li key={s.sira}>
                  <Soru soru={s} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {resmi && sinav.kapaliSoru > 0 && (
          <Card className="flex flex-col items-start gap-3 border-brand/30 bg-brand/5">
            <div>
              <h2 className="font-heading text-[17px] font-bold text-ink">
                Kalan {sinav.kapaliSoru} soru uygulamada
              </h2>
              <p className="mt-1 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
                Sınavın tamamını süre tutarak çöz, netini gör, yanlışların çalışma
                defterine düşsün. Her sorunun açıklaması ve kanun dayanağı hazır;
              iptal edilen sorular sete girmez, netini bozmaz.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Sınav gibi çözme mevcut arşiv denemesi akışına gider: sabit
                  set, süreli, tekrarlanabilir, resmî sıralamaya girmez. */}
              {sinav.examId && (
                <ButtonLink href={`/sinav/arsiv/${sinav.examId}`} size="lg">
                  Sınav gibi çöz
                </ButtonLink>
              )}
              <ButtonLink
                href="/kayit"
                size="lg"
                variant={sinav.examId ? "secondary" : "primary"}
              >
                Ücretsiz başla
              </ButtonLink>
            </div>
          </Card>
        )}
      </article>
    </div>
  );
}

/** Ders ve kanun kırılımı — `analiz` türü sınavların tek içeriği budur. */
function KonuDagilimi({ sinav }: { sinav: CikmisSinavDetay }) {
  const kanun = sinav.analiz?.kanunDagilim;
  const toplam = sinav.dersDagilimi.reduce((a, d) => a + d.adet, 0) || 1;
  if (!sinav.dersDagilimi.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-[19px] font-bold text-ink">Konu dağılımı</h2>
      {sinav.analiz?.uyari && (
        <p className="rounded-md border border-atlas/30 bg-atlas/5 p-3 text-[13px] leading-relaxed text-ink-soft">
          {sinav.analiz.uyari}
          {sinav.analiz.kaynak && (
            <>
              {" "}
              <span className="text-ink-soft">Kaynak: {sinav.analiz.kaynak}.</span>
            </>
          )}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[14px]">
          <caption className="sr-only">Derslere göre soru sayısı</caption>
          <thead>
            <tr className="border-b border-line text-left text-[12px] uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 font-heading font-bold">Ders</th>
              <th scope="col" className="py-2 text-right font-heading font-bold">Soru</th>
              <th scope="col" className="w-1/2 py-2 pl-4 font-heading font-bold">Pay</th>
            </tr>
          </thead>
          <tbody>
            {sinav.dersDagilimi.map((d) => (
              <tr key={d.ders} className="border-b border-line/60">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-ink">
                  {d.ders}
                </th>
                <td className="py-2 text-right font-heading font-bold text-ink">{d.adet}</td>
                <td className="py-2 pl-4">
                  <span
                    className="block h-2 rounded-sm bg-brand/70"
                    style={{ width: `${Math.round((d.adet / toplam) * 100)}%` }}
                    aria-hidden
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {kanun && Object.keys(kanun).length > 0 && (
        <details className="rounded-md border border-line bg-surface p-4">
          <summary className="cursor-pointer font-heading text-[14px] font-bold text-ink">
            Polis Mevzuatı kanun kırılımı
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(kanun).map(([no, adet]) => (
              <li key={no} className="rounded-sm bg-line/40 px-2 py-1 text-[13px] text-ink-soft">
                {no} sayılı Kanun <span className="font-bold text-ink">{adet}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Soru({ soru }: { soru: CikmisSinavSoru }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[13px] font-bold text-ink-soft">{soru.sira}.</span>
        <span className="rounded-sm bg-line/40 px-2 py-0.5 text-[12px] text-ink-soft">
          {soru.konu}
        </span>
        {soru.iptal && (
          <span className="rounded-sm bg-danger/10 px-2 py-0.5 text-[12px] font-bold text-danger ring-1 ring-danger/30">
            Sınavda iptal edildi
          </span>
        )}
      </div>

      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{soru.kok}</p>

      {soru.gorselUrl && (
        <Image
          src={soru.gorselUrl}
          alt={`${soru.sira}. sorunun şekli`}
          width={800}
          height={400}
          className="h-auto w-full max-w-[520px] rounded-sm border border-line bg-white"
          unoptimized
        />
      )}

      <ol className="space-y-1.5">
        {soru.siklar.map((s) => (
          <li key={s.harf} className="flex gap-2 text-[15px] leading-relaxed text-ink">
            <span className="font-heading font-bold text-ink-soft">{s.harf})</span>
            <span>{s.metin}</span>
          </li>
        ))}
      </ol>

      <details className="rounded-md border border-line bg-line/20 p-3">
        <summary className="cursor-pointer font-heading text-[14px] font-bold text-ink">
          Cevabı ve açıklamayı gör
        </summary>
        <div className="mt-3 space-y-2">
          <p className="font-heading text-[15px] font-bold text-success">
            Doğru cevap: {soru.siklar.find((s) => s.dogru)?.harf ?? "—"}
          </p>
          {soru.aciklama && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
              {soru.aciklama}
            </p>
          )}
          {soru.dayanak.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {soru.dayanak.map((d) => (
                <li key={d.baslik} className="text-[13px] text-ink-soft">
                  {d.url ? (
                    <a
                      href={d.url}
                      className="tk-interactive underline underline-offset-2 hover:text-ink"
                      rel="nofollow noopener"
                      target="_blank"
                    >
                      {d.baslik}
                    </a>
                  ) : (
                    d.baslik
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </Card>
  );
}
