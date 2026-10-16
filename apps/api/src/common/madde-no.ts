/**
 * `Question.articleNo` etiketini madde anahtarlarına ayrıştırır (Doc 49 S1-B).
 *
 * Etiket serbest metin olarak girilmiş: çoğu "16", "4/A", "Ek 1", "Geçici 2"
 * gibi tek madde; azınlık "43, 141" (liste), "219/1" (fıkra), "45-49" (aralık).
 * Kural:
 * - liste → ilk madde `primary`, kalanlar `related`;
 * - "N/f" (f sayısal) → fıkra eki düşer, madde N ("4/A" gibi harfli ekler
 *   maddenin kendisidir, dokunulmaz);
 * - "N-M" (iki yanı sayısal) → aralık: hangi maddenin dayanak olduğu belli
 *   değil, otomatik BAĞLANMAZ, rapora düşer (elle/madde-oner ile).
 * Saf fonksiyon; DB'ye bakmaz — eşleşme betiğin işi.
 */
export type MaddeNoTuru = 'bos' | 'tek' | 'liste' | 'aralik';

export interface MaddeNoAyrisimi {
  tur: MaddeNoTuru;
  /** Dayanak madde (aralık/boş ise null). */
  primary: string | null;
  /** Yan dayanaklar (yalnız listede). */
  related: string[];
  /** Fıkra eki düşürüldü mü (rapor için). */
  fikraDustu: boolean;
}

const ARALIK = /^(\d+)\s*[-–]\s*(\d+)$/;
const FIKRA = /^(.+?)\/(\d+)$/;

/** Tek parçayı normalize eder: boşluk kırpar, sayısal fıkra ekini düşürür. */
function parcaNormalize(p: string): { no: string; fikraDustu: boolean } {
  const t = p.trim().replace(/\s+/g, ' ');
  const m = FIKRA.exec(t);
  if (m) return { no: m[1].trim(), fikraDustu: true };
  return { no: t, fikraDustu: false };
}

export function maddeNoAyristir(raw: string | null | undefined): MaddeNoAyrisimi {
  const s = (raw ?? '').trim();
  if (!s) return { tur: 'bos', primary: null, related: [], fikraDustu: false };
  if (ARALIK.test(s)) return { tur: 'aralik', primary: null, related: [], fikraDustu: false };
  const parcalar = s
    .split(/[,;]/)
    .map(parcaNormalize)
    .filter((p) => p.no.length > 0);
  if (parcalar.length === 0) return { tur: 'bos', primary: null, related: [], fikraDustu: false };
  const [ilk, ...kalan] = parcalar;
  // Aynı madde listede tekrar edebilir ("43, 43/2"): tekilleştir.
  const related = [...new Set(kalan.map((p) => p.no))].filter((no) => no !== ilk.no);
  return {
    tur: parcalar.length > 1 ? 'liste' : 'tek',
    primary: ilk.no,
    related,
    fikraDustu: parcalar.some((p) => p.fikraDustu),
  };
}
