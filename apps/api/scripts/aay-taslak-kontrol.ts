/**
 * Doc 43 — bir AAY partisinin yazım denetimi ve KÖR metin dökümü.
 *
 * Üç iş yapar:
 *
 * 1. Çözücüyü koşar: her soru KANIT çıkmalı (tek doğru şık, anahtar doğru).
 * 2. Ölçülebilir biçim kurallarını denetler — bunlar denetçi ajanlara
 *    sayım yaptırılmasın diye burada (Doc 39 dersi): 5 farklı şık, 3 soruluk
 *    senaryo, açıklama, Roma rakamlı kök biçimi, anahtar dağılımı, tek
 *    anlamlı yazılmayan sayı kalıpları, hukuk normu çağrıştıran sözcükler.
 * 3. `--kor <dosya.json>` verilirse anahtarsız metni yazar: senaryo, kök,
 *    şıklar. Kör çözücü ajan YALNIZ bunu görür; spesifikasyonu ve anahtarı
 *    görmeden aynı cevaba varamıyorsa metin koddan farklı bir şey söylüyordur.
 *
 * Çıkış kodu: HATA varsa 1 (uyarılar geçer).
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4 [--kor /yol/aay-p4-kor.json]
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s3        (tek senaryo modülü)
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { cozumle, type Bulmaca } from './aay-cozucu';

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: string };

const ad = process.argv[2];
if (!ad || !/^aay-p\d+(-s\d+)?$/.test(ad)) throw new Error('kullanım: aay-taslak-kontrol.ts aay-p<N>[-s<M>] [--kor dosya.json]');
/** Senaryo modülü (aay-p4-s3) partinin id önekini taşır: aay-p4-07, -08, -09. */
const partiAdi = ad.replace(/-s\d+$/, '');
const korIdx = process.argv.indexOf('--kor');
const korYol = korIdx === -1 ? null : process.argv[korIdx + 1];

/** Kalibrasyonda (aay-paem10-dogrula.ts) iki okumaya açık çıkan kalıplar. */
const BELIRSIZ = [
  { re: /\b\w+ ve \w+(?:’|')?[a-zçğıöşü]* (?:toplam )?\d+ kişi/i, not: '"X ve Y’ye N kişi": her birine mi, toplam mı? "ikişer kişi" / "toplam N kişi" yaz' },
  { re: /en (?:çok|fazla)\b|en az (?!bir)/i, not: '"en çok/en az": eşitlik serbest mi? "diğerlerinin her birinden daha fazla" gibi kesin yaz' },
];
const HUKUK = /\b(kanun|madde|yönetmelik|gözaltı|ifade al|tutuklama|savcı|hâkim|hakim|mahkeme|suç|ceza|avukat|yakalama|arama kararı|mevzuat)/i;

(async () => {
  const mod = await import(pathToFileURL(resolve(__dirname, `${ad}.ts`)).href);
  const parti: Soru[] = mod.PARTI;
  const hata: string[] = [];
  const uyari: string[] = [];

  const idler = new Set<string>();
  const senaryo = new Map<string, Soru[]>();
  for (const s of parti) {
    if (!new RegExp(`^${partiAdi}-\\d{2}$`).test(s.id)) hata.push(`${s.id}: id biçimi ${partiAdi}-NN olmalı`);
    if (idler.has(s.id)) hata.push(`${s.id}: id tekrarı`);
    idler.add(s.id);
    senaryo.set(s.ortakMetin, [...(senaryo.get(s.ortakMetin) ?? []), s]);

    const k = cozumle(s);
    if (k.sonuc !== 'KANIT') hata.push(`${s.id}: çözücü ${k.sonuc} — ${k.not}`);

    const metinler = s.siklar.map((x) => x.metin.trim());
    if (s.siklar.length !== 5) hata.push(`${s.id}: ${s.siklar.length} şık (5 olmalı)`);
    if (new Set(metinler.map((m) => m.toLocaleLowerCase('tr'))).size !== metinler.length) hata.push(`${s.id}: aynı metinli şık`);
    if (metinler.some((m) => !m)) hata.push(`${s.id}: boş şık`);
    if (s.siklar.map((x) => x.harf).join('') !== 'ABCDE') hata.push(`${s.id}: şık harfleri ABCDE sırasında değil`);
    if (!['easy', 'medium', 'hard'].includes(s.zorluk)) hata.push(`${s.id}: zorluk "${s.zorluk}"`);
    if ((s.aciklama ?? '').trim().length < 150) hata.push(`${s.id}: açıklama kısa (${(s.aciklama ?? '').trim().length} < 150)`);
    if (!s.kok.trim().endsWith('?')) hata.push(`${s.id}: kök soru işaretiyle bitmiyor`);

    const romenli = /(^|\n)I\. /.test(s.kok);
    if (romenli) {
      if (!/\nII\. /.test(s.kok) || !/\nIII\. /.test(s.kok)) hata.push(`${s.id}: Roma rakamlı kökte I/II/III satırları eksik`);
      if (!metinler.every((m) => /^(Yalnız (I|II|III)|I ve II|I ve III|II ve III|I, II ve III)$/.test(m)))
        hata.push(`${s.id}: Roma rakamlı sorunun şıkları "Yalnız I / I ve III / I, II ve III" biçiminde değil`);
    }
    for (const b of BELIRSIZ) {
      const yer = `${s.ortakMetin}\n${s.kok}`;
      if (b.re.test(yer) && !uyari.some((u) => u.startsWith(`${s.id}:`) && u.includes(b.not))) uyari.push(`${s.id}: ${b.not}`);
    }
    if (HUKUK.test(`${s.ortakMetin} ${s.kok} ${metinler.join(' ')}`)) uyari.push(`${s.id}: hukuk normu çağrıştıran sözcük — kurgu nötr mü?`);
  }

  for (const [metin, sorular] of senaryo) {
    const ilk = sorular[0].id;
    if (sorular.length !== 3) hata.push(`${ilk}…: senaryoda ${sorular.length} soru (3 olmalı)`);
    const maddeler = metin.split('\n').filter((l) => l.startsWith('- ')).length;
    if (maddeler < 3) hata.push(`${ilk}…: senaryoda ${maddeler} öncül maddesi ("- " ile başlayan satır; en az 3)`);
    if (metin.length < 350 || metin.length > 1100) uyari.push(`${ilk}…: senaryo ${metin.length} karakter (hedef 450–900)`);
  }

  // Rapor
  console.log(`${ad}: ${parti.length} soru · ${senaryo.size} senaryo`);
  for (const s of parti) {
    const k = cozumle(s);
    console.log(`  ${k.sonuc === 'KANIT' ? '✓' : '✗'} ${s.id}  ${k.tutan.join(',') || '—'}  ${String(k.dunyaSayisi).padStart(4)} dünya  ${s.zorluk.padEnd(6)} ${s.baslik}`);
  }
  const dagilim: Record<string, number> = {};
  for (const s of parti) { const t = cozumle(s).tutan[0]; if (t) dagilim[t] = (dagilim[t] ?? 0) + 1; }
  console.log(`  anahtar dağılımı: ${'ABCDE'.split('').map((h) => `${h}=${dagilim[h] ?? 0}`).join(' ')}`);
  const romen = parti.filter((s) => /(^|\n)I\. /.test(s.kok)).length;
  const yeterli = parti.filter((s) => /yeterli/i.test(s.kok)).length;
  console.log(`  biçim: Roma rakamlı ${romen} · yeterlilik ${yeterli}`);
  for (const u of uyari) console.log(`  UYARI ${u}`);
  for (const h of hata) console.log(`  HATA  ${h}`);
  console.log(hata.length ? `\n✗ ${hata.length} hata` : '\n✓ biçim ve çözücü denetimi temiz');

  if (korYol) {
    const kor = parti.map((s) => ({
      id: s.id,
      senaryo: s.ortakMetin,
      soru: s.kok,
      siklar: s.siklar.map((x) => `${x.harf}) ${x.metin.trim()}`),
    }));
    writeFileSync(korYol, JSON.stringify(kor, null, 2));
    console.log(`kör metin → ${korYol}`);
  }
  if (hata.length) process.exitCode = 1;
})();
