/**
 * Doc 36 — PAEM 10'un (2026) 100 sorusunu derse ve konuya bağlar.
 *
 * Blok düzeni kitapçıktan OKUNARAK çıkarıldı, varsayılmadı: PAEM 7'de düzen
 * farklıydı (Polis Mevzuatı 30, Genel Kültür 10), o yüzden her sınav için
 * yeniden kurulur. PAEM 10 düzeni PAEM 9 ile aynı çıktı — 7 ders × 10 +
 * Genel Kültür ve Analitik 30 — ama Genel Kültür bloğunun İÇ dağılımı
 * değişti: PAEM 9'da Türkçe soruları 78-81 aralığında bitişikken, PAEM 10'da
 * güncel olayların arasına serpiştirilmiş (72, 73, 75).
 *
 * Ders sıra numarasından deterministik çıkar; elle karar yalnız konu
 * düzeyinde gerekir ve o kararlar aşağıda tek tek gerekçeli.
 *
 *   npx tsx scripts/paem10-siniflandir.ts        (kuru — rapor)
 *   npx tsx scripts/paem10-siniflandir.ts --yaz  (siniflandirma dosyasını yazar)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';

/** [ilk, son, ders, varsayılan konu] */
const BLOKLAR: [number, number, string, string][] = [
  [1, 10, 'Polis Mevzuatı', '2559 Sayılı Polis Vazife ve Salâhiyet Kanunu (PVSK)'],
  [11, 20, 'Ceza Muhakemesi Hukuku', '5271 Sayılı Ceza Muhakemesi Kanunu (CMK)'],
  [21, 30, 'Ceza Hukuku', 'Türk Ceza Kanunu'],
  [31, 40, 'Anayasa Hukuku', 'T.C. Anayasası'],
  [41, 50, 'İdare Hukuku', 'İdare Hukuku'],
  [51, 60, 'İnsan Hakları', 'İnsan Hakları'],
  [61, 70, 'Atatürk İlkeleri ve İnkılap Tarihi', 'Atatürk İlkeleri ve İnkılap Tarihi'],
  [71, 80, 'Genel Kültür ve Analitik Düşünme', 'Güncel ve Kültürel Olaylar'],
  [81, 90, 'Genel Kültür ve Analitik Düşünme', 'Analitik Akıl Yürütme'],
  [91, 100, 'Genel Kültür ve Analitik Düşünme', 'Matematik ve Sayısal Mantık'],
];

/**
 * Blok varsayılanından sapanlar — konu, sorunun DAYANDIĞI mevzuata göre.
 *
 * Polis Mevzuatı bloğunda her soru ayrı bir kanundan geliyor, o yüzden
 * varsayılan yalnız 4. soruya denk düşüyor; gerisi burada.
 */
const KONU_ISTISNA: Record<number, string> = {
  1: '4982 Sayılı Bilgi Edinme Hakkı Kanunu',
  2: '3201 Sayılı Emniyet Teşkilat Kanunu',
  3: '657 Sayılı Devlet Memurları Kanunu',
  5: '6698 Sayılı Kişisel Verilerin Korunması Kanunu',
  6: '6136 Sayılı Ateşli Silahlar ve Bıçaklar Hakkında Kanun',
  7: '5395 Sayılı Çocuk Koruma Kanunu',
  8: '7068 Sayılı Genel Kolluk Disiplin Hükümleri Kanunu',
  9: 'Adli ve Önleme Aramaları Yönetmeliği',
  10: '2911 Sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu',

  // İnsan Hakları bloğunda AİHM'in kendi mekanizmasına dair iki soru
  // sözleşme konusuna gider; kalanlar genel insan hakları kuramı.
  51: 'Avrupa İnsan Hakları Sözleşmesi (AİHS)',
  59: 'Avrupa İnsan Hakları Sözleşmesi (AİHS)',

  // Genel Kültür bloğu içindeki Türkçe soruları (PAEM 9'dakinin aksine
  // bitişik değil, güncel olayların arasına serpiştirilmiş).
  72: 'Türkçe / Dil Bilgisi',
  73: 'Türkçe / Dil Bilgisi',
  75: 'Türkçe / Dil Bilgisi',
};

/**
 * Konusu bankada KARŞILIĞI OLMAYAN sorular — ders konusuna düşerler ve
 * burada kayda geçer ki sessizce kaybolmasın.
 */
const KARSILIGI_YOK: Record<number, string> = {
  49: '2886 Sayılı Devlet İhale Kanunu — bankada konu yok, İdare Hukuku altına alındı',
  46: '657 disiplin cezası ama soru idari işlemin unsuru üzerine; 657 konusu Polis Mevzuatı dersinde, bu soru İdare Hukuku bloğunda',
  43: 'Cumhurbaşkanlığı kararnamesi — Anayasa metnine dayanıyor ama İdare Hukuku bloğunda sorulmuş',
};

type Soru = { no: number; kok: string; siklar: Record<string, string>; dogru: string };

function dersVeKonu(no: number): { ders: string; konu: string } {
  const blok = BLOKLAR.find(([a, b]) => no >= a && no <= b);
  if (!blok) throw new Error(`${no}: blok tablosunda yok`);
  return { ders: blok[2], konu: KONU_ISTISNA[no] ?? blok[3] };
}

function main() {
  const YAZ = process.argv.includes('--yaz');
  const sorular: Soru[] = JSON.parse(
    readFileSync(`${KOK}/ham/paem10-B-sorular.json`, 'utf8'),
  );
  if (sorular.length !== 100) throw new Error(`100 soru bekleniyordu, ${sorular.length} var`);

  const kayit = sorular.map((s) => ({ no: s.no, ...dersVeKonu(s.no), iptal: false }));

  const dersSayim = new Map<string, number>();
  const konuSayim = new Map<string, number>();
  for (const k of kayit) {
    dersSayim.set(k.ders, (dersSayim.get(k.ders) ?? 0) + 1);
    konuSayim.set(`${k.ders} / ${k.konu}`, (konuSayim.get(`${k.ders} / ${k.konu}`) ?? 0) + 1);
  }

  console.log('DERS DAĞILIMI');
  for (const [d, n] of [...dersSayim].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${d}`);
  }
  console.log(`  ${String([...dersSayim.values()].reduce((a, b) => a + b, 0)).padStart(3)}  TOPLAM`);

  console.log('\nKONU DAĞILIMI');
  for (const [k, n] of [...konuSayim].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${k}`);
  }

  if (Object.keys(KARSILIGI_YOK).length) {
    console.log('\nKONUSU TAM KARŞILANMAYANLAR (ders konusuna düştü)');
    for (const [no, not] of Object.entries(KARSILIGI_YOK)) console.log(`  ${no}: ${not}`);
  }

  if (!YAZ) return console.log('\nKURU ÇALIŞMA — yazmak için --yaz ekle.');
  writeFileSync(`${KOK}/paem10-siniflandirma.json`, JSON.stringify(kayit, null, 1));
  console.log(`\n→ paem10-siniflandirma.json (${kayit.length} kayıt)`);
}

main();
