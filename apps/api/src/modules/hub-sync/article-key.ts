/**
 * Madde anahtarı köprüsü: merkez `legislation_article_key` ("ek 7", "geçici 1", "4/a") ↔
 * PAEMİSYON `LawArticle.articleNo` / `Question.articleNo` ("Ek 7", "Geçici 1", "4/A").
 */

const TR_LOWER: Record<string, string> = { İ: 'i', I: 'ı', Ğ: 'ğ', Ü: 'ü', Ş: 'ş', Ö: 'ö', Ç: 'ç' };
function trLower(s: string): string {
  return s.replace(/[İIĞÜŞÖÇ]/g, (c) => TR_LOWER[c]).toLowerCase();
}

const KEY_RE =
  /^(?:(ek ge[cç][iı]c[iı]|ek|ge[cç][iı]c[iı]) ?)?([0-9]{1,9})(?: ?\/ ?([a-zçğıöşü]))?$/;

/** PAEMİSYON madde numarasını merkez anahtarına çevirir; çözülemezse null (ör. AİHS "P1-1"). */
export function toHubArticleKey(articleNo: string | null | undefined): string | null {
  const value = trLower(articleNo ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const m = KEY_RE.exec(value);
  if (!m) return null;
  const prefix =
    m[1] == null ? null : m[1] === 'ek' ? 'ek' : m[1].startsWith('ek ') ? 'ek geçici' : 'geçici';
  const number = String(Number(m[2]));
  return [prefix, number].filter(Boolean).join(' ') + (m[3] ? `/${m[3]}` : '');
}

/** Merkez anahtarını PAEMİSYON biçimine çevirir: "ek 7" → "Ek 7", "geçici 1" → "Geçici 1", "4/a" → "4/A". */
export function hubKeyToArticleNo(key: string): string {
  const m = /^(?:(ek geçici|ek|geçici) )?([0-9]+)(?:\/([a-zçğıöşü]))?$/.exec(key.trim());
  if (!m) return key;
  const prefix =
    m[1] === 'ek geçici' ? 'Ek Geçici' : m[1] === 'ek' ? 'Ek' : m[1] === 'geçici' ? 'Geçici' : null;
  const suffix = m[3] ? `/${m[3].toLocaleUpperCase('tr-TR')}` : '';
  return [prefix, m[2]].filter(Boolean).join(' ') + suffix;
}

/** Zorunlu bağın madde numarası sayısal çekirdeği (konu madde aralığı için). */
export function articleKeyNumber(key: string | null | undefined): number | null {
  const m = /([0-9]+)/.exec(key ?? '');
  return m ? Number(m[1]) : null;
}
