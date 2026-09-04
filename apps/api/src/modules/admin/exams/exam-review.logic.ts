/**
 * Yayın öncesi gözden geçirme — SAF mantık.
 *
 * Bayraklar bir soruyu ENGELLEMEZ, gözü doğru yere götürür: 100 soruyu tek tek
 * okumak 1–2 saatlik iştir ve dikkat üçüncü onlukta dağılır. Kaynaksız soru da
 * denemeye girebilir (kullanıcı kararı, 4 Eylül 2026) — yalnız işaretlenir.
 */

export type ExamReviewFlag =
  | 'kaynak-yok'
  | 'aciklama-yok'
  | 'daha-once-kullanildi'
  | 'benzer-kok'
  | 'madde-yok'
  | 'sik-bozuk';

export interface ReviewCandidate {
  stem: string;
  sourceLabel: string | null;
  explanation: string | null;
  articleNo: string | null;
  courseName: string;
  optionCorrectCount: number;
  /** Bu deneme dışında, YAYINLANMIŞ bir denemede de sorulmuş mu? */
  usedBefore: boolean;
}

/** Mevzuat dersleri: madde bağı beklenir (İdare/Anayasa/Ceza/CMK/Polis Mevzuatı). */
const KANUN_DERSI = /hukuk|mevzuat|anayasa|ceza/i;

/**
 * Benzer kök tespiti için normalleştirme: baştaki/sondaki boşluk, katlanmış
 * boşluk ve büyük/küçük harf farkı elenir; ilk 60 karakter karşılaştırılır.
 * Tam eşitlik aramıyoruz — aynı sorunun iki farklı kaydı çoğu zaman sonundaki
 * "aşağıdakilerden hangisidir?" kısmında ayrışır, baş taraf aynı kalır.
 */
export function stemAnahtari(stem: string): string {
  return stem.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
}

/** Sette hangi köklerin birden fazla göründüğü — benzer-kök bayrağı için. */
export function tekrarEdenKokler(stems: string[]): Set<string> {
  const sayim = new Map<string, number>();
  for (const s of stems) {
    const k = stemAnahtari(s);
    sayim.set(k, (sayim.get(k) ?? 0) + 1);
  }
  return new Set([...sayim.entries()].filter(([, n]) => n > 1).map(([k]) => k));
}

const bos = (v: string | null) => v == null || v.trim() === '';

export function bayraklariHesapla(
  q: ReviewCandidate,
  tekrarlayanKokler: Set<string>,
): ExamReviewFlag[] {
  const f: ExamReviewFlag[] = [];
  if (bos(q.sourceLabel)) f.push('kaynak-yok');
  if (bos(q.explanation)) f.push('aciklama-yok');
  if (q.usedBefore) f.push('daha-once-kullanildi');
  if (tekrarlayanKokler.has(stemAnahtari(q.stem))) f.push('benzer-kok');
  if (KANUN_DERSI.test(q.courseName) && q.articleNo == null) f.push('madde-yok');
  // Tek doğru şıkkı olmayan soru sınava GİRMEMELİ — diğerleri uyarı, bu kusur.
  if (q.optionCorrectCount !== 1) f.push('sik-bozuk');
  return f;
}
