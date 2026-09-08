/**
 * Doc 37 — OGM Materyal test PDF'ini yapılandırılmış soruya çevirir.
 *
 * Kaynak, MEB'in ogmmateryal.eba.gov.tr soru bankasından yazdırılan bir test:
 * A4, iki sütun, her sayfada "Soru N:" başlıkları, son sayfada tek satırlık
 * cevap anahtarı. Metin katmanı SAĞLAM — OCR'a gerek yok (Doc 34'ün aksine).
 *
 * İki sütun `pdftotext` kırpmasıyla ayrılır: aynı satırda yan yana duran iki
 * ayrı sorunun metni `-layout` çıktısında birbirine karışıyor. Kırpma, sütun
 * sınırını piksel olarak verdiği için bu karışmayı kaynağında keser.
 *
 * Cevap anahtarı ayrı okunur ve soru sayısıyla karşılaştırılır; eksik ya da
 * fazla anahtar script'i HATA ile durdurur — sessizce yarım parti üretmek,
 * yanlış anahtarla soru yazmaktan daha kötüdür.
 *
 *   npx tsx scripts/ogm-ayristir.ts <pdf> <cikti-dizini>
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

/** Sütun sınırı: A4 594pt, iki sütun ortadan bölünüyor. */
const SUTUN = [
  { x: 0, w: 300 },
  { x: 300, w: 300 },
];
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
/**
 * Gövdenin alt sınırı, altbilginin KENDİ konumundan hesaplanır.
 *
 * Yazdırma altbilgisi — tam sayfa genişliğinde tek bir URL — iki sütunu birden
 * kesiyor; sütun kırpması onu ikiye bölünce sağ yarısı, sağ sütundaki son
 * şıkkın devamı gibi metne yapışıyor. Çözüm gövdeyi altbilginin üstünden
 * kesmek, ama SABİT bir yükseklikle değil: soru metninin nerede bittiği teste
 * göre değişiyor (bir testte y≈638, başka birinde y≈799) ve sabit sınır uzun
 * testlerde son şıkkı yutuyor.
 *
 * Bulunamazsa kırpma yapılmaz; altbilgi metne karışırsa doğrulama yakalar.
 */
function govdeAlti(pdf: string, sayfa: number): number {
  const bbox = execFileSync('pdftotext', ['-bbox', '-f', String(sayfa), '-l', String(sayfa), pdf, '-']).toString();
  const satir = bbox.split('\n').find((l) => l.includes('ogmmateryal.eba.gov.tr'));
  const y = satir?.match(/yMin="([\d.]+)"/)?.[1];
  return y ? Math.floor(Number(y)) - 2 : 900;
}

const metin = (pdf: string, sayfa: number, x: number, w: number, h: number) =>
  execFileSync('pdftotext', [
    '-f', String(sayfa), '-l', String(sayfa),
    '-x', String(x), '-y', '0', '-W', String(w), '-H', String(h),
    pdf, '-',
  ]).toString();

/** Anahtar satırı tek satırdır; kırpma onu paramparça ettiği için `-layout`. */
const duzenliMetin = (pdf: string, sayfa: number) =>
  execFileSync('pdftotext', ['-layout', '-f', String(sayfa), '-l', String(sayfa), pdf, '-']).toString();

/** Sayfa üstbilgisi/altbilgisi ve form alanları soru metnine karışmasın. */
const COP = [
  /^\d{1,2}\.\d{2}\.\d{4}\s/, /^OGM Materyal$/i, /^https?:\/\//,
  /^(Okul|Ad Soyad|Sınıf|Numara):/, /^\d+\/\d+$/,
];

interface Soru { no: number; kok: string; siklar: Record<string, string> }

function ayristir(satirlar: string[]): Soru[] {
  const cikti: Soru[] = [];
  let aktif: Soru | null = null;
  let sik: string | null = null;

  for (const ham of satirlar) {
    const s = ham.trim();
    if (!s || COP.some((r) => r.test(s))) continue;

    const bas = s.match(/^Soru\s+(\d+)\s*:?$/);
    if (bas) {
      if (aktif) cikti.push(aktif);
      aktif = { no: Number(bas[1]), kok: '', siklar: {} };
      sik = null;
      continue;
    }
    if (!aktif) continue;

    const y = s.match(/^([A-E])\)\s*(.*)$/);
    if (y) {
      sik = y[1];
      aktif.siklar[sik] = y[2].trim();
      continue;
    }
    // Şık başladıysa devam satırı o şıkka, başlamadıysa köke eklenir.
    if (sik) aktif.siklar[sik] = `${aktif.siklar[sik]} ${s}`.trim();
    else aktif.kok = aktif.kok ? `${aktif.kok}\n${s}` : s;
  }
  if (aktif) cikti.push(aktif);
  return cikti;
}

function anahtariOku(ham: string): Record<string, string> {
  const satir = ham.split('\n').find((l) => /CEVAPLAR/i.test(l));
  if (!satir) throw new Error('cevap anahtarı satırı bulunamadı');
  const cevap: Record<string, string> = {};
  // Satırın "CEVAPLAR:" sonrası kısmı — altbilgideki URL'de de rakam var.
  for (const m of satir.slice(satir.indexOf(':') + 1).matchAll(/(\d+)\s*-\s*([A-E])\b/g))
    cevap[m[1]] = m[2];
  return cevap;
}

function main() {
  const [pdf, dizin] = process.argv.slice(2);
  if (!pdf || !dizin) throw new Error('kullanım: ogm-ayristir.ts <pdf> <cikti-dizini>');

  const sayfaSayisi = Number(
    execFileSync('pdfinfo', [pdf]).toString().match(/^Pages:\s+(\d+)$/m)?.[1] ?? 0,
  );
  if (!sayfaSayisi) throw new Error('sayfa sayısı okunamadı');

  const sorular: Soru[] = [];
  for (let sayfa = 1; sayfa <= sayfaSayisi; sayfa++) {
    const alt = govdeAlti(pdf, sayfa);
    for (const { x, w } of SUTUN)
      sorular.push(...ayristir(metin(pdf, sayfa, x, w, alt).split('\n')));
  }

  sorular.sort((a, b) => a.no - b.no);
  const anahtar = anahtariOku(duzenliMetin(pdf, sayfaSayisi));

  // Doğrulamalar — hepsi sessiz veri kaybının önüne geçmek için.
  const sorun: string[] = [];
  for (const [i, q] of sorular.entries()) {
    if (q.no !== i + 1) sorun.push(`sıra atlaması: ${i + 1}. soru "Soru ${q.no}"`);
    const eksik = SIKLAR.filter((l) => !q.siklar[l]);
    if (eksik.length) sorun.push(`soru ${q.no}: şık eksik (${eksik.join(', ')})`);
    if (q.kok.length < 20) sorun.push(`soru ${q.no}: kök çok kısa`);
    if (!anahtar[String(q.no)]) sorun.push(`soru ${q.no}: cevap anahtarı yok`);
    const kirli = [q.kok, ...SIKLAR.map((l) => q.siklar[l] ?? '')].find((t) => /eba\.gov\.tr|&t=|\btest-yazdir\b/.test(t));
    if (kirli) sorun.push(`soru ${q.no}: metne altbilgi karışmış ("${kirli.slice(-40)}")`);
  }
  const fazla = Object.keys(anahtar).filter((n) => !sorular.some((q) => String(q.no) === n));
  if (fazla.length) sorun.push(`anahtarda karşılığı olmayan soru: ${fazla.join(', ')}`);

  console.log(`sayfa ${sayfaSayisi} · soru ${sorular.length} · anahtar ${Object.keys(anahtar).length}`);
  if (sorun.length) {
    for (const s of sorun) console.log(`  ! ${s}`);
    throw new Error(`${sorun.length} sorun — parti kurulmadı`);
  }

  writeFileSync(`${dizin}/ham-${sorular.length}.json`, JSON.stringify(sorular, null, 1));
  writeFileSync(`${dizin}/anahtar-${sorular.length}.json`, JSON.stringify(anahtar, null, 1));
  console.log(`✓ ${dizin}/ham-${sorular.length}.json · anahtar-${sorular.length}.json`);
}
main();
