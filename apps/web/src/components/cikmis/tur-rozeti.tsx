import { BarChart3, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Çıkmış sınav tür rozeti (Doc 36 §1).
 *
 * "Çıkmış sınav" ile "konu analizi" ASLA aynı görünmez. Bankanın varlık nedeni
 * gerçek çıkmış soru güveni; yayımlanmamış bir sınavın konu dağılımını çıkmış
 * soru gibi sunmak o güveni harcar. Rozet bu ayrımı liste ve detay sayfasında
 * aynı biçimde taşır, alt yazıya gizlenmez. Renk tek başına anlam taşımaz:
 * ikon + metin birlikte.
 */
export function TurRozeti({
  tur,
  className,
}: {
  tur: "resmi" | "analiz";
  className?: string;
}) {
  const resmi = tur === "resmi";
  return (
    <Badge tone={resmi ? "success" : "warning"} className={className}>
      {resmi ? (
        <CheckCircle2 size={12} aria-hidden />
      ) : (
        <BarChart3 size={12} aria-hidden />
      )}
      {resmi ? "Çıkmış sınav" : "Konu analizi"}
    </Badge>
  );
}

/** Rozetin bir cümlelik açıklaması — kart altında ve sayfa başında kullanılır. */
export function turAciklamasi(tur: "resmi" | "analiz"): string {
  return tur === "resmi"
    ? "Kurumun yayımladığı gerçek soru kitapçığı ve resmî cevap anahtarı."
    : "Bu sınav yayımlanmadı. Elimizde yalnız adayların derlediği konu dağılımı var; soru metinleri yok.";
}
