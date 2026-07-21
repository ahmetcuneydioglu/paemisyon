/**
 * Resmî konsolide kanun metnini madde madde bölen SAF parser (Doc 25 §4 adım 3).
 *
 * Girdi: mevzuat.gov.tr'den alınan birebir metin (kullanıcı indirir; kazıma yok).
 * Çıktı: { articleNo, text } dizisi. articleNo, Question.articleNo ile AYNI
 * kanonik biçimdedir ("16", "4/A", "Ek 6", "Geçici 2") — böylece Madde Atlası'nda
 * soru grubu ile metin (topicId, articleNo) tek anahtarında buluşur.
 *
 * Türk mevzuat metni yapısı: her madde satır başında "Madde N –" (veya "MADDE N-",
 * "Ek Madde 6 –", "Geçici Madde 2 –") başlığıyla açılır; başlıktan sonraki satırlar
 * o maddenin gövdesidir. Başlık etiketi ("Madde N –") gövdeden düşülür (künye zaten
 * ayrı gösterilir); "(Değişik: …)" gibi resmî şerhler KORUNUR.
 *
 * Not: Büyük/küçük harf tespiti Türkçe locale ile yapılır (İ/ı tuzağı) — regex'in
 * `i` bayrağına güvenilmez.
 */

export interface ParsedArticle {
  articleNo: string;
  text: string;
}

type Kind = 'madde' | 'ek' | 'gecici';

/** Satır başı madde başlığı: (etiket türü, ham numara, satırın kalanı). */
interface HeadingMatch {
  kind: Kind;
  rawNo: string;
  rest: string;
}

// Numara + isteğe bağlı harf eki ("4/A") veya "mükerrer". Fıkra ("/2") gövdeye ait.
const NUM = String.raw`(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)`;
// Etiketten sonra gelen ayraç: en/em tire, düz tire veya nokta (biri, isteğe bağlı).
const HEADING_RE = new RegExp(
  String.raw`^\s*(ek\s+madde|geçici\s+madde|madde)\s+${NUM}\s*(?:[–—\-.]\s*)?(.*)$`,
);

/** Bir satır madde başlığıysa çözümle; değilse null. */
function matchHeading(line: string): HeadingMatch | null {
  // Etiket tespiti Türkçe küçültmeyle (İ→i, I→ı) yapılır; regex `i` bayrağı
  // dotlu/dotsuz i'de güvenilmez. tr-TR küçültme bu kısa satırlarda uzunluğu
  // korur → küçük harfli eşleşmenin konumları orijinalle birebir örtüşür.
  const lowered = line.toLocaleLowerCase('tr-TR');
  const m = HEADING_RE.exec(lowered);
  if (!m) return null;
  const label = m[1];
  const kind: Kind = label.startsWith('ek')
    ? 'ek'
    : label.startsWith('geçici')
      ? 'gecici'
      : 'madde';
  // Numara: canonical() harf ekini zaten büyütüyor → küçük harften almak yeterli.
  // Gövde (rest): ORİJİNAL casing korunmalı ("(Değişik: …)" şerhleri) → m[0] tüm
  // satırı kapsadığından son m[3].length karakter orijinal gövdedir.
  const rest = line.slice(m[0].length - m[3].length);
  return { kind, rawNo: m[2], rest };
}

/**
 * Kullanıcının elle girdiği madde numarasını kanonik biçime çevirir
 * ("78"→"78", "4/a"→"4/A", "ek 6"/"ek madde 6"→"Ek 6", "geçici 2"→"Geçici 2").
 * Question.articleNo ile aynı biçim — panelden elle madde eklerken kullanılır.
 * Geçersizse (rakamla başlamıyorsa) null. İdempotent: kanonik girdi aynen döner.
 */
export function canonicalArticleNo(raw: string): string | null {
  const s = raw.trim().toLocaleLowerCase('tr-TR');
  if (!s) return null;
  let kind: Kind = 'madde';
  let rest = s;
  const ekGecici = s.match(/^(ek|geçici)\s+(?:madde\s+)?(.+)$/);
  if (ekGecici) {
    kind = ekGecici[1] === 'ek' ? 'ek' : 'gecici';
    rest = ekGecici[2].trim();
  } else {
    const madde = s.match(/^madde\s+(.+)$/);
    if (madde) rest = madde[1].trim();
  }
  return canonical(kind, rest);
}

/** Ham numarayı kanonik biçime çevirir (normalizeArticle ile hizalı). */
function canonical(kind: Kind, rawNo: string): string | null {
  let v = rawNo.trim();
  const slash = v.indexOf('/');
  if (slash >= 0) {
    const suffix = v.slice(slash + 1);
    // Bölü sonrası rakam = fıkra → at; harf = ayrı madde ("4/A") → büyüt.
    v = /^\d+$/.test(suffix)
      ? v.slice(0, slash)
      : `${v.slice(0, slash)}/${suffix.toLocaleUpperCase('tr-TR')}`;
  }
  if (!/^\d/.test(v)) return null;
  if (kind === 'ek') return `Ek ${v}`;
  if (kind === 'gecici') return `Geçici ${v}`;
  return v;
}

/** Gövde metnini toparlar: kenar boşlukları at, 3+ boş satırı 2'ye indir. */
function cleanBody(lines: string[]): string {
  return lines
    .join('\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Konsolide metni maddelere böler. Aynı madde numarası birden çok kez geçerse
 * (ör. mülga + yeniden) SON tam gövde kazanır değil — İLK başlık kazanır ve
 * sonrakiler ayrı kayıt olur; çağıran (import) tekilleştirmeyi upsert ile yapar.
 * Başlıktan önceki metin (başlık/fihrist) yok sayılır.
 */
export function parseLawText(raw: string): ParsedArticle[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const out: ParsedArticle[] = [];
  let current: { articleNo: string; body: string[] } | null = null;

  for (const line of lines) {
    const h = matchHeading(line);
    if (h) {
      if (current) out.push({ articleNo: current.articleNo, text: cleanBody(current.body) });
      const no = canonical(h.kind, h.rawNo);
      if (no == null) {
        current = null; // başlık sayı vermedi → yok say
        continue;
      }
      current = { articleNo: no, body: h.rest.trim() ? [h.rest] : [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) out.push({ articleNo: current.articleNo, text: cleanBody(current.body) });

  // Boş gövdeli maddeleri düşür (yalnız başlık, metin yok).
  return out.filter((a) => a.text.length > 0);
}
