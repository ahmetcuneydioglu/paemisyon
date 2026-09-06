/**
 * Çıkmış sınav tür rozeti (Doc 36 §1).
 *
 * "Çıkmış sınav" ile "konu analizi" ASLA aynı görünmez. Bankanın varlık nedeni
 * gerçek çıkmış soru güveni; yayımlanmamış bir sınavın konu dağılımını çıkmış
 * soru gibi sunmak o güveni harcar. Rozet bu ayrımı liste ve detay sayfasında
 * aynı biçimde taşır, alt yazıya gizlenmez.
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
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-heading text-[11px] font-bold uppercase tracking-wide",
        resmi
          ? "bg-success/10 text-success ring-1 ring-success/30"
          : "bg-atlas/10 text-atlas ring-1 ring-atlas/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden>{resmi ? "✓" : "◔"}</span>
      {resmi ? "Çıkmış sınav" : "Konu analizi"}
    </span>
  );
}

/** Rozetin bir cümlelik açıklaması — kart altında ve sayfa başında kullanılır. */
export function turAciklamasi(tur: "resmi" | "analiz"): string {
  return tur === "resmi"
    ? "Kurumun yayımladığı gerçek soru kitapçığı ve resmî cevap anahtarı."
    : "Bu sınav yayımlanmadı. Elimizde yalnız adayların derlediği konu dağılımı var; soru metinleri yok.";
}
