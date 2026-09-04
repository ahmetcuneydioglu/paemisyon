/**
 * Taranmış deneme kitapçığı OCR metnini yapılandırılmış soruya çevirir.
 *
 * Girdi: scripts/pdf-ocr (macOS Vision) çıktısı — sayfa sayfa, iki sütun
 * ardışık yazılmış, satırlar y-bandına göre kümelenmiş.
 * Çıktı: [{no, kok, siklar{A..E}, sayfa}]
 *
 * Metin katmanı OLMAYAN kitapçıklar içindir; metin katmanı varsa
 * ih-pdf-ayristir.ts kullanılır.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SORU = /^(\d{1,3})[.)]\s*(.*)$/;
const SIK = /^([A-E])[).]\s*(.*)$/;
/** OCR'da sık görülen Türkçe karışıklıkları (I/İ/ı, l/1) düzeltir. */
function ocrDuzelt(s: string): string {
  return s
    .replace(/\bil Özel idaresi\b/gi, 'İl Özel İdaresi')
    .replace(/\bIçişleri\b/g, 'İçişleri')
    .replace(/\bIdare\b/g, 'İdare')
    .replace(/\bIl\b/g, 'İl')
    .replace(/\btarafindan\b/g, 'tarafından')
    .replace(/\bKOMISER\b/g, 'KOMİSER')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface Soru { no: number; kok: string; siklar: Record<string, string>; sayfa: number }

function main() {
  const ham = readFileSync(process.argv[2], 'utf8');
  const sorular: Soru[] = [];
  let sayfa = 0;
  let aktif: Soru | null = null;
  let sonSik: string | null = null;

  for (const rawLine of ham.split('\n')) {
    let line = rawLine.trim();
    const s = /^===== SAYFA \S*?(\d+) =====$/.exec(line);
    if (s) { sayfa = Number(s[1]); continue; }
    if (!line) continue;
    // Sayfa ortasındaki DİKEY filigran ("SÜLEYMAN ARSLANTÜRK") OCR'da soru
    // numarasıyla aynı y-bandına düşüp satır başına yapışıyor
    // ("SÜLEYMAN ARSLANTÜRK 64.5607 sayılı…"). Satırı atmak soruyu kaybettirir;
    // filigranı SÖKÜP satırı işlemeye devam et.
    line = line.replace(/S[ÜU]LEYMAN\s+ARSLANT[ÜU]RK/gi, '').replace(/\s{2,}/g, ' ').trim();
    if (!line) continue;
    // Altbilgi reklamı ve kitapçık üstbilgisi
    if (/KİTAPLARIMIZA|ULAŞABİLİRSİNİZ|DENEME SINAVI|CEVAP ANAHTARI|^\d{1,3}$/.test(line)) continue;

    const sikEsl = SIK.exec(line);
    if (sikEsl && aktif) {
      sonSik = sikEsl[1];
      aktif.siklar[sonSik] = ocrDuzelt(sikEsl[2]);
      continue;
    }
    const soruEsl = SORU.exec(line);
    if (soruEsl && Number(soruEsl[1]) >= 1 && Number(soruEsl[1]) <= 100) {
      aktif = { no: Number(soruEsl[1]), kok: ocrDuzelt(soruEsl[2]), siklar: {}, sayfa };
      sonSik = null;
      sorular.push(aktif);
      continue;
    }
    if (!aktif) continue;
    // Devam satırı: son şıkka ya da köke
    if (sonSik) aktif.siklar[sonSik] = ocrDuzelt(`${aktif.siklar[sonSik]} ${line}`);
    else aktif.kok = ocrDuzelt(`${aktif.kok} ${line}`);
  }

  writeFileSync(process.argv[3], JSON.stringify(sorular, null, 1));
  const eksikNo = [...Array(100)].map((_, i) => i + 1).filter((n) => !sorular.some((s) => s.no === n));
  console.log(`ayrıştırılan soru : ${sorular.length}`);
  console.log(`eksik numara      : ${eksikNo.length ? eksikNo.join(', ') : 'yok'}`);
  console.log(`5 şıkkı olmayan   : ${sorular.filter((s) => Object.keys(s.siklar).length !== 5).map((s) => `#${s.no}(${Object.keys(s.siklar).length})`).join(' ') || 'yok'}`);
  console.log(`boş şık           : ${sorular.filter((s) => Object.values(s.siklar).some((t) => !t)).map((s) => `#${s.no}`).join(' ') || 'yok'}`);
  const kisaKok = sorular.filter((s) => s.kok.length < 25);
  console.log(`kökü çok kısa     : ${kisaKok.map((s) => `#${s.no}`).join(' ') || 'yok'}`);
}
main();
