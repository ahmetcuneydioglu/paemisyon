import type { AttemptResult } from "@/lib/types";

/**
 * Sonuç başlığı — eski sinav-sonuc.php: lacivert bant + 4'lü renkli kutu şeridi
 * (Puan lacivert · Doğru yeşil · Yanlış kırmızı · Boş sarı). Puan = NET.
 */
export function ResultTiles({ result }: { result: AttemptResult }) {
  const tiles = [
    { label: "Puan (Net)", value: result.score != null ? result.score.toFixed(2) : "—", bg: "var(--color-navy-deep)", fg: "#fff" },
    { label: "Doğru", value: result.correctCount, bg: "var(--color-green)", fg: "#fff" },
    { label: "Yanlış", value: result.wrongCount, bg: "var(--color-red)", fg: "#fff" },
    { label: "Boş", value: result.blankCount, bg: "var(--color-yellow)", fg: "#000" },
  ];
  return (
    <div className="bg-(--color-navy)">
      <div className="mx-auto max-w-4xl px-4 py-4 text-center text-white">
        <h1 className="font-heading text-xl font-bold">{result.exam.title}</h1>
        <p className="mt-1 text-sm text-white/70">Sınav Sonucun</p>
      </div>
      <ul className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label} className="px-2 py-5 text-center" style={{ background: t.bg, color: t.fg }}>
            <div className="font-heading text-3xl font-bold tabular-nums">{t.value}</div>
            <div className="mt-1 text-[13px] font-semibold opacity-90">{t.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
