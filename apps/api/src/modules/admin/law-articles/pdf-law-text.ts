/**
 * mevzuat.gov.tr resmî kanun PDF'inden temiz metin çıkarma (Doc 25 §4 adım 3).
 *
 * Site otomatik erişime kapalı olduğundan PDF'i İNSAN indirir
 * (https://www.mevzuat.gov.tr/MevzuatMetin/{Tür}.{Tertip}.{No}.pdf) ve import
 * script'i bu modülle metne çevirip parseLawText'e verir. Kazıma/AI YOK.
 *
 * PDF gürültüsü: her sayfada tekrar eden üstbilgi (kanun adı) + altbilgi/sayfa
 * numarası, madde gövdesine sızıp içeriği kirletir. stripPdfNoise bunları eler.
 */

/**
 * Sayfa metinlerinden tekrar eden üst/altbilgi ve sayfa numaralarını temizler.
 * SAF fonksiyon (PDF motoru yok) → birim test edilebilir.
 *
 * Kural:
 *  - Salt sayı satırı (1–5 hane) = sayfa numarası → atılır.
 *  - Kısa (≤80) ve sayfaların ≥%40'ında tekrar eden satır = üst/altbilgi → atılır
 *    (en az 3 sayfa varsa; kısa belgelerde yanlış eleme yapmamak için).
 */
export function stripPdfNoise(pages: string[]): string {
  const perPage = pages.map((p) =>
    p
      .replace(/\f/g, '\n')
      .split('\n')
      .map((l) => l.replace(/[ \t]+$/g, '')),
  );
  const pageCount = perPage.length;

  // Satır frekansı (sayfa başına bir kez sayılır → gövdede tekrar eden ifade
  // yanlışlıkla boilerplate sayılmasın).
  const freq = new Map<string, number>();
  for (const lines of perPage) {
    const seen = new Set<string>();
    for (const l of lines) {
      const t = l.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  }

  const threshold = Math.ceil(pageCount * 0.4);
  const isNoise = (t: string): boolean => {
    if (/^\d{1,5}$/.test(t)) return true; // sayfa numarası
    if (t.length <= 80 && pageCount >= 3 && (freq.get(t) ?? 0) >= threshold) return true;
    return false;
  };

  const out: string[] = [];
  for (const lines of perPage) {
    for (const l of lines) {
      const t = l.trim();
      if (!t) {
        out.push('');
        continue;
      }
      if (isNoise(t)) continue;
      out.push(l);
    }
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** PDF buffer → temiz metin (pdf-parse tembel yüklenir — motor yalnız gerekince). */
export async function extractPdfLawText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return stripPdfNoise(result.pages.map((p: { text?: string }) => p.text ?? ''));
}
