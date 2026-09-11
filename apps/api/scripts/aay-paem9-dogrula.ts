/**
 * Çözücünün kendisinin sınavı: PAEM 9'un 85-90. soruları.
 *
 * Kurumun anahtarı elimizde ve hangi üçünün İPTAL edildiğini biliyoruz. Çözücü
 * güvenilirse iki şeyi birden yapmalı: geçerli soruların resmî cevabını
 * ÜRETMELİ, iptal edilenleri de kimseden duymadan KUSURLU işaretlemeli.
 * Yalnız birini yapan çözücü işe yaramaz.
 *
 *   npx tsx scripts/aay-paem9-dogrula.ts
 */
import { cozumle, dizilimler, her, sabit, type Bulmaca, type Dunya } from './aay-cozucu';

// ── 85-87 · mülakat sırası ───────────────────────────────────────
const ADAY = ['Ahmet', 'Betül', 'Cemil', 'Derya', 'Emine', 'Füsun', 'Gökhan'];
const ILK_UC = ['Betül', 'Derya', 'Gökhan'];
const sira = (d: Dunya, k: string) => d[k] as number;

const mulakat: Dunya[] = [];
for (const d of dizilimler(ADAY, [1, 2, 3, 4, 5, 6, 7])) {
  if (!ILK_UC.every((k) => sira(d, k) <= 3)) continue;               // ilk üç birebir: Betül, Derya, Gökhan
  if (Math.abs(sira(d, 'Emine') - sira(d, 'Füsun')) !== 1) continue; // Emine-Füsun art arda
  if (sira(d, 'Ahmet') !== sira(d, 'Betül') + 1) continue;           // Ahmet Betül'den hemen sonra
  if (sira(d, 'Cemil') !== sira(d, 'Ahmet') + 1) continue;           // ve Cemil'den hemen önce
  // Telefon mülakatı 2 kişi: biri Ahmet, öteki ilk üçün dışından biri.
  for (const ikinci of ADAY.filter((k) => k !== 'Ahmet' && !ILK_UC.includes(k)))
    mulakat.push({ ...d, telefon2: ikinci });
}

/** 87: telefonlar en başa alınır, diğerleri kendi sırasını korur. */
const yeniSira = (d: Dunya, kisi: string): number => {
  const tel = ['Ahmet', d.telefon2 as string];
  if (tel.includes(kisi)) return tel.indexOf(kisi) + 1;
  const kalan = ADAY.filter((k) => !tel.includes(k)).sort((a, b) => sira(d, a) - sira(d, b));
  return 3 + kalan.indexOf(kisi);
};

// ── 88-90 · poliklinik sırası + tahlil dağılımı ──────────────────
const POLI = ['Dâhiliye', 'Nöroloji', 'Psikiyatri', 'Göz', 'KBB'];
const TAHLIL = ['q', 'x', 'y', 'z'];
const altKume = Array.from({ length: 16 }, (_, m) =>
  TAHLIL.filter((_t, i) => m & (1 << i)).join(''),
);

const poliklinik: Dunya[] = [];
for (const d of dizilimler(POLI, [1, 2, 3, 4, 5])) {
  const p = (k: string) => d[k] as number;
  if (!(p('Göz') < p('KBB') && p('KBB') < p('Psikiyatri') && p('Psikiyatri') < p('Dâhiliye'))) continue;
  const yer = (n: number) => POLI.find((k) => p(k) === n)!;
  for (const s1 of altKume) for (const s4 of altKume) for (const s5 of altKume) {
    // 2. poliklinik hiç tahlil istemedi; 1. ile 3. BİREBİR aynı tahlilleri istedi.
    const kume = { 1: s1, 2: '', 3: s1, 4: s4, 5: s5 } as Record<number, string>;
    if (Object.values(kume).reduce((a, s) => a + s.length, 0) !== 6) continue; // toplam 6 tahlil
    if (kume[p('Dâhiliye')].length !== 3) continue;                            // Dâhiliye 3 tahlil
    poliklinik.push({
      ...d, s1: yer(1), s5: yer(5),
      ...Object.fromEntries(POLI.map((k) => [`t_${k}`, kume[p(k)]])),
    });
  }
}

const say = (d: Dunya, k: string) => (d[`t_${k}`] as string).length;

const BULMACALAR: (Bulmaca & { resmi: string; iptal: boolean })[] = [
  {
    id: 's85', baslik: 'Beşinci sırada mülakat yapılacak kişi', dunyalar: mulakat,
    isaretli: 'C', resmi: 'C', iptal: false,
    siklar: (['Betül', 'Emine', 'Cemil', 'Derya', 'Ahmet'] as const).map((k, i) => ({
      harf: 'ABCDE'[i], metin: k, iddia: her((d) => sira(d, k) === 5),
    })),
  },
  {
    id: 's86', baslik: 'Hangisi kesinlikle doğrudur', dunyalar: mulakat,
    isaretli: 'B', resmi: 'B', iptal: false,
    siklar: [
      { harf: 'A', metin: 'Emine telefonla', iddia: her((d) => d.telefon2 === 'Emine') },
      { harf: 'B', metin: 'Emine, Cemil’den sonra', iddia: her((d) => sira(d, 'Emine') > sira(d, 'Cemil')) },
      { harf: 'C', metin: 'Cemil telefonla', iddia: her((d) => d.telefon2 === 'Cemil') },
      { harf: 'D', metin: 'Son mülakat Füsun', iddia: her((d) => sira(d, 'Füsun') === 7) },
      { harf: 'E', metin: 'Derya, Gökhan’dan sonra', iddia: her((d) => sira(d, 'Derya') > sira(d, 'Gökhan')) },
    ],
  },
  {
    id: 's87', baslik: 'Telefonlar başa alınırsa sırası kesin bilinen', dunyalar: mulakat,
    isaretli: 'B', resmi: 'B', iptal: false,
    siklar: (['Derya', 'Betül', 'Cemil', 'Gökhan', 'Füsun'] as const).map((k, i) => ({
      harf: 'ABCDE'[i], metin: k, iddia: sabit((d) => yeniSira(d, k)),
    })),
  },
  {
    id: 's88', baslik: 'İlk gidilen poliklinik  [SINAVDA İPTAL]', dunyalar: poliklinik,
    isaretli: 'D', resmi: 'D', iptal: true,
    siklar: (['Psikiyatri', 'KBB', 'Dâhiliye', 'Nöroloji', 'Göz'] as const).map((k, i) => ({
      harf: 'ABCDE'[i], metin: k, iddia: her((d) => d.s1 === k),
    })),
  },
  {
    id: 's89', baslik: 'En son gidilen poliklinik  [SINAVDA İPTAL]', dunyalar: poliklinik,
    isaretli: 'E', resmi: 'E', iptal: true,
    siklar: (['Psikiyatri', 'Nöroloji', 'Göz', 'KBB', 'Dâhiliye'] as const).map((k, i) => ({
      harf: 'ABCDE'[i], metin: k, iddia: her((d) => d.s5 === k),
    })),
  },
  {
    id: 's90', baslik: 'Hangisi kesinlikle doğrudur  [SINAVDA İPTAL]', dunyalar: poliklinik,
    isaretli: 'A', resmi: 'A', iptal: true,
    siklar: [
      { harf: 'A', metin: 'Psikiyatri 1 tahlil', iddia: her((d) => say(d, 'Psikiyatri') === 1) },
      { harf: 'B', metin: 'KBB 2 tahlil', iddia: her((d) => say(d, 'KBB') === 2) },
      { harf: 'C', metin: 'KBB x ve y', iddia: her((d) => d.t_KBB === 'xy') },
      { harf: 'D', metin: 'Nöroloji q ve z', iddia: her((d) => d.t_Nöroloji === 'qz') },
      { harf: 'E', metin: 'Göz 1 tahlil', iddia: her((d) => say(d, 'Göz') === 1) },
    ],
  },
];

console.log(`mülakat dünyası: ${mulakat.length} · poliklinik dünyası: ${poliklinik.length}\n`);
let uyum = 0;
for (const b of BULMACALAR) {
  const k = cozumle(b);
  const saglam = k.sonuc === 'KANIT';
  // Beklenti: iptal EDİLMEYEN soru kanıtlanmalı, iptal EDİLEN kusurlu çıkmalı.
  const beklenen = saglam !== b.iptal;
  if (beklenen) uyum++;
  console.log(`${beklenen ? '✓' : '✗'} ${b.id} ${b.iptal ? '[iptal]' : '       '} ${k.sonuc.padEnd(14)} ${b.baslik}`);
  console.log(`   ${k.not}${saglam ? ` (resmî anahtar ${b.resmi})` : ` · tutan: ${k.tutan.join(', ') || '—'}`}`);
}
console.log(`\n${uyum}/${BULMACALAR.length} soruda çözücü kurumla aynı sonuca vardı.`);
