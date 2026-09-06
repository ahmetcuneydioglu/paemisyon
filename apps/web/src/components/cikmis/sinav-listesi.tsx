import Link from "next/link";
import type { CikmisSinavOzet } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { TurRozeti, turAciklamasi } from "./tur-rozeti";

/** En kalabalık üç dersi göster; kart bir tabloya dönüşmesin. */
const ILK_DERSLER = 3;

/**
 * Çıkmış sınav vitrini (Doc 36 §4) — dönem kartları.
 *
 * Kart, tür rozetini ve ne bulacağını peşinen söyler: adayın "çıkmış soru"
 * beklentisiyle konu analizi sayfasına girip hayal kırıklığına uğraması,
 * sayfada geçirdiği üç saniyeden daha pahalıya mal olur.
 */
export function SinavListesi({ sinavlar }: { sinavlar: CikmisSinavOzet[] }) {
  if (!sinavlar.length) {
    return (
      <EmptyState
        icon="icon-doc"
        title="Henüz yayında dönem yok"
        message="Çıkmış sınavlar hazırlanıyor; en kısa sürede burada olacak."
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sinavlar.map((s) => (
        <li key={s.slug}>
          <Card className="relative flex h-full flex-col gap-3 transition-colors hover:border-ink-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-[17px] font-bold text-ink">
                  <Link
                    href={`/paem-cikmis-sorular/${s.slug}`}
                    className="tk-interactive after:absolute after:inset-0"
                  >
                    {s.donem ? `PAEM ${s.donem}. Dönem` : s.ad}
                  </Link>
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {s.tarih ? new Date(s.tarih).getFullYear() : "Tarih bilinmiyor"} · {s.kurum}
                </p>
              </div>
              <TurRozeti tur={s.tur} />
            </div>

            <p className="text-[13px] leading-relaxed text-ink-soft">{turAciklamasi(s.tur)}</p>

            {s.dersDagilimi.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {s.dersDagilimi.slice(0, ILK_DERSLER).map((d) => (
                  <li
                    key={d.ders}
                    className="rounded-sm bg-line/40 px-2 py-1 text-[12px] text-ink-soft"
                  >
                    {d.ders} <span className="font-bold text-ink">{d.adet}</span>
                  </li>
                ))}
                {s.dersDagilimi.length > ILK_DERSLER && (
                  <li className="px-1 py-1 text-[12px] text-ink-soft">
                    +{s.dersDagilimi.length - ILK_DERSLER} ders
                  </li>
                )}
              </ul>
            )}

            <p className="mt-auto pt-1 text-[13px] font-bold text-brand">
              {s.tur === "resmi"
                ? `${s.soruSayisi ?? 0} soru · ${s.acikSoru} tanesi burada açık`
                : `${s.soruSayisi ?? 0} sorunun konu dağılımı`}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
