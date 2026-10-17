import Link from "next/link";
import { FileText } from "lucide-react";
import type { CikmisSinavOzet } from "@/lib/public-api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
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
export function SinavListesi({
  sinavlar,
  erisilemedi = false,
}: {
  sinavlar: CikmisSinavOzet[];
  /** Liste alınamadı — "içerik yok" demek YANLIŞ olur. */
  erisilemedi?: boolean;
}) {
  if (!sinavlar.length) {
    return erisilemedi ? (
      <EmptyState
        icon={FileText}
        title="Liste şu an yüklenemedi"
        body="Geçici bir aksaklık; birkaç dakika içinde tekrar dener misin?"
      />
    ) : (
      <EmptyState
        icon={FileText}
        title="Henüz yayında dönem yok"
        body="Çıkmış sınavlar hazırlanıyor; en kısa sürede burada olacak."
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sinavlar.map((s) => (
        <li key={s.slug}>
          <Card className="relative flex h-full flex-col gap-3 transition-colors hover:border-ink-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="type-heading text-ink">
                  <Link
                    href={`/paem-cikmis-sorular/${s.slug}`}
                    className="after:absolute after:inset-0 after:rounded-card"
                  >
                    {s.donem ? `PAEM ${s.donem}. Dönem` : s.ad}
                  </Link>
                </h2>
                <p className="type-body-sm mt-0.5 text-ink-soft">
                  {s.tarih
                    ? new Date(s.tarih).getFullYear()
                    : "Tarih bilinmiyor"}{" "}
                  · {s.kurum}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                {s.isPremium && <PremiumBadge variant="soft" />}
                <TurRozeti tur={s.tur} />
              </span>
            </div>

            <p className="type-body-sm text-ink-soft">{turAciklamasi(s.tur)}</p>

            {s.dersDagilimi.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {s.dersDagilimi.slice(0, ILK_DERSLER).map((d) => (
                  <li key={d.ders}>
                    <Badge>
                      {d.ders}{" "}
                      <span className="font-semibold text-ink">{d.adet}</span>
                    </Badge>
                  </li>
                ))}
                {s.dersDagilimi.length > ILK_DERSLER && (
                  <li className="type-body-sm px-1 py-0.5 text-ink-subtle">
                    +{s.dersDagilimi.length - ILK_DERSLER} ders
                  </li>
                )}
              </ul>
            )}

            <p className="type-subhead mt-auto pt-1 text-accent-ink">
              {s.tur === "resmi"
                ? `${s.soruSayisi ?? 0} soru · ${s.acikSoru} tanesini burada çöz`
                : `${s.soruSayisi ?? 0} sorunun konu dağılımı`}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
