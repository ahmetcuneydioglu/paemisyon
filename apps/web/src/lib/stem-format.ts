/**
 * Öncüllü soru kökü biçimlendirme (26 Eki 2026 kullanıcı bildirimi).
 *
 * Bankadaki köklerin çoğunda öncüller (I. / II. / III.) satır sonuyla ayrılmış;
 * ekran `whitespace-pre-line` ile bunları alt alta çizer. Bir kısmında ise
 * öncüller TEK satırda yan yana saklanmış. Bu yardımcı yalnız o durumda, muhafazakâr
 * bir kuralla satır sonu ekler:
 *  - kökte satır sonu YOKSA ve en az " I. " ile " II. " öncül işareti varsa
 *    (tek başına "II. Abdülhamid" gibi adlar eşleşmez),
 *  - her öncül işaretinden ("I."–"V.") önce,
 *  - kapanış cümlesinden ("Yukarıda…", "Buna göre…", "Bu bilgilere göre…") önce.
 * Veriyi değiştirmez; yalnız görünüm.
 */
const MARK = /(^|\s)(I{1,3}|IV|V)\.\s/g;
const CLOSER = /\s(?=(Yukarıda|Yukarıdaki|Buna göre|Bu bilgilere göre|Bunlardan|Bu öncüllerden)\b)/;

export function formatStem(stem: string): string {
  if (!stem || stem.includes("\n")) return stem;
  const hasI = /(^|\s)I\.\s/.test(stem);
  const hasII = /\sII\.\s/.test(stem);
  if (!hasI || !hasII) return stem;
  let out = stem.replace(MARK, (m, pre: string, num: string) => `${pre.trim() ? pre : ""}\n${num}. `);
  out = out.replace(CLOSER, "\n");
  // İlk öncülden önceki giriş cümlesi kendi satırında kalsın; baştaki boş satır silinir.
  return out.replace(/^\n/, "").replace(/\n{2,}/g, "\n").trim();
}
