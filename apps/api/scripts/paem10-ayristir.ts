/**
 * Doc 36 — PAEM 10 (2026) resmî kitapçığını ayrıştırır ve A/B ile doğrular.
 *
 * PAEM 9'dan İKİ ÖNEMLİ FARK var ve ikisi de zorlaştırıcı:
 *
 *  1. Kitapçığın METİN KATMANI YOK — taranmış görüntü. Metin macOS Vision ile
 *     OCR'lanıyor (scripts/pdf-ocr.swift). OCR sessizce satır düşürüyor:
 *     B/2'de "özel harekât temel kursuna katılıp… çevik kuvvet birimlerine
 *     seçilmiş" kısmı kayboldu ve soru hâlâ düzgün bir cümle gibi duruyordu.
 *     Hiçbir sözdizimsel uyarı üretmeyen bu hata türü en tehlikelisidir.
 *
 *  2. A ve B AYRI PDF'ler (PAEM 9'da tek dosyada yan yanaydı).
 *
 * Bu yüzden A/B çapraz doğrulaması burada PAEM 9'dakinden DAHA KRİTİK ve
 * farklı çalışır: orada birebir parmak izi eşleşmesi yetiyordu, burada aynı
 * sorunun iki AYRI taraması karşılaştırılıyor. Eşleşme bulanık (jeton
 * örtüşmesi); düşük benzerlik = taramalardan birinde hasar var demektir.
 * Script bunu HATA olarak listeler, sessiz geçmez.
 *
 * Soru numaraları OCR'da güvenilmez (100 sorunun 9'u yakalanamadı, bazıları
 * mükerrer okundu). Bu yüzden sıralama numaraya DEĞİL, "tamamlanmış bir
 * sorudan sonra gelen yeni A şıkkı" kuralına dayanır; numara yalnız sağlama
 * için kullanılır.
 *
 *   npx tsx scripts/paem10-ayristir.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const IS = `${process.env.PAEM10_IS ?? '/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/3ec401b6-1f6a-4487-bde1-5917bd87b724/scratchpad/paem10'}`;
const SIK_HARFLERI = ['A', 'B', 'C', 'D', 'E'] as const;

export type Soru = {
  /** Kitapçıktaki sıra (1-100) — OCR'dan değil, akıştan türetilir. */
  no: number;
  grup: 'A' | 'B';
  sayfa: number;
  kok: string;
  siklar: Record<string, string>;
  /** Resmî anahtardaki harf. */
  dogru: string;
  /** OCR sorunun numarasını okuyabildi mi (okuyamadıysa akıştan atandı). */
  numaraOkundu: boolean;
};

const SORU_BAS = /^(\d{1,3})\s*[.)]\s*(.*)$/;
const SIK_BAS = /^([A-E])\s*[).]\s*(.*)$/;
const SAYFA_BAS = /^=====\s*SAYFA\s+\S*?(\d+)\s*=====$/;

/** Sayfa üstbilgisi ve yalnız sayfa numarasından ibaret satırlar. */
const gurultuMu = (s: string) =>
  s.length === 0 ||
  /^\d{1,3}$/.test(s) ||
  /PAEM\s*I?LK DERECE/i.test(s) ||
  /^İLK DERECE AMİRLİK/i.test(s) ||
  /Grubu Cevap Anahtarı/i.test(s);

const sadeBosluk = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Karşılaştırma parmak izi. OCR Türkçe'de I/İ/ı ve l/1 karıştırıyor; bu
 * farklar ANLAM farkı değil TARAMA farkıdır, eşleştirmeyi bozmamalı.
 */
const parmakIzi = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[ıi̇i]/g, 'i')
    .replace(/[l1]/g, 'l')
    .replace(/[^\p{L}\p{N}]/gu, '');

/** Jeton kümesi — bulanık eşleştirme için. */
function jetonlar(s: string): Set<string> {
  return new Set(
    s
      .toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

/** Jaccard benzerliği (0-1). */
function benzerlik(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let kesisim = 0;
  for (const t of a) if (b.has(t)) kesisim++;
  return kesisim / (a.size + b.size - kesisim);
}

/**
 * OCR metnini sorulara böler.
 *
 * Sınır kuralı: elde şıkları TAMAMLANMIŞ bir soru varken yeni bir "A)" gelirse
 * yeni soru başlamıştır. Numaraya güvenilmez — OCR numarayı düşürdüğünde
 * sonraki sorunun metni bir öncekinin E şıkkına yapışıyordu.
 */
function sorulariOku(ham: string, grup: 'A' | 'B'): Soru[] {
  const sorular: Soru[] = [];
  let sayfa = 0;
  let kok: string[] = [];
  let siklar: Record<string, string> = {};
  let aktifSik: string | null = null;
  let okunanNo: number | null = null;

  const kapat = () => {
    if (Object.keys(siklar).length === 0 && kok.length === 0) return;
    sorular.push({
      no: sorular.length + 1,
      grup,
      sayfa,
      kok: sadeBosluk(kok.join(' ')),
      siklar: Object.fromEntries(
        Object.entries(siklar).map(([h, m]) => [h, sadeBosluk(m)]),
      ),
      dogru: '',
      numaraOkundu: okunanNo === sorular.length + 1,
    });
    kok = [];
    siklar = {};
    aktifSik = null;
    okunanNo = null;
  };

  for (const rawLine of ham.split('\n')) {
    const satir = rawLine.trim();
    const sm = SAYFA_BAS.exec(satir);
    if (sm) {
      sayfa = Number(sm[1]);
      continue;
    }
    if (gurultuMu(satir)) continue;

    const sikM = SIK_BAS.exec(satir);
    if (sikM) {
      const harf = sikM[1];
      // Tamamlanmış sorudan sonra gelen yeni "A)" = yeni soru.
      if (harf === 'A' && siklar.A !== undefined) kapat();
      aktifSik = harf;
      siklar[harf] = (siklar[harf] ? siklar[harf] + ' ' : '') + sikM[2];
      continue;
    }

    const soruM = SORU_BAS.exec(satir);
    if (soruM && siklar.A !== undefined) {
      // Şıkları olan bir sorudan sonra numara geldi → yeni soru.
      kapat();
      okunanNo = Number(soruM[1]);
      kok.push(soruM[2]);
      continue;
    }
    if (soruM && kok.length === 0) {
      okunanNo = Number(soruM[1]);
      kok.push(soruM[2]);
      continue;
    }

    if (aktifSik) siklar[aktifSik] += ' ' + satir;
    else kok.push(satir);
  }
  kapat();
  return sorular;
}

/** Eksik/fazla şık, boş kök gibi yapısal kusurlar. */
function yapiKusurlari(s: Soru): string[] {
  const k: string[] = [];
  const eksik = SIK_HARFLERI.filter((h) => !s.siklar[h]?.trim());
  if (eksik.length) k.push(`şık eksik: ${eksik.join(',')}`);
  if (s.kok.length < 25) k.push(`kök çok kısa (${s.kok.length})`);
  return k;
}

function main() {
  const anahtarlar = JSON.parse(
    readFileSync(`${IS}/anahtarlar.json`, 'utf8'),
  ) as Record<'A' | 'B', string>;

  const kitapciklar: Record<'A' | 'B', Soru[]> = { A: [], B: [] };
  for (const grup of ['A', 'B'] as const) {
    const sorular = sorulariOku(readFileSync(`${IS}/ocr-${grup}.txt`, 'utf8'), grup);
    const anahtar = anahtarlar[grup];
    if (anahtar.length !== 100) throw new Error(`${grup}: anahtar 100 harf değil`);
    for (const s of sorular) s.dogru = anahtar[s.no - 1] ?? '';
    kitapciklar[grup] = sorular;

    const numaraTutan = sorular.filter((s) => s.numaraOkundu).length;
    const kusurlu = sorular.filter((s) => yapiKusurlari(s).length > 0);
    console.log(
      `${grup}: ${sorular.length} soru · numarası OCR ile doğrulanan ${numaraTutan} · yapısal kusurlu ${kusurlu.length}`,
    );
    for (const s of kusurlu.slice(0, 8))
      console.log(`    ! ${grup}/${s.no} (s.${s.sayfa}) ${yapiKusurlari(s).join('; ')}`);
  }

  if (kitapciklar.A.length !== 100 || kitapciklar.B.length !== 100) {
    console.log(
      `\nUYARI: soru sayısı 100 değil (A=${kitapciklar.A.length}, B=${kitapciklar.B.length}).` +
        ` Eşleştirme yine denenir ama sınır kuralı gözden geçirilmeli.`,
    );
  }

  // ── A/B ÇAPRAZ DOĞRULAMA ──
  // Aynı soru iki kitapçıkta AYRI taranmış. Eşleştirme şık kümesi üzerinden:
  // şıklar kökten kısa ve ayırt edici, OCR'da daha az bozuluyor.
  const jetonOf = new Map<Soru, Set<string>>();
  for (const g of ['A', 'B'] as const)
    for (const s of kitapciklar[g])
      jetonOf.set(s, jetonlar(s.kok + ' ' + SIK_HARFLERI.map((h) => s.siklar[h] ?? '').join(' ')));

  const kullanilan = new Set<Soru>();
  const eslesmeler: { a: Soru; b: Soru; skor: number }[] = [];
  const eslesmeyen: Soru[] = [];
  for (const a of kitapciklar.A) {
    let enIyi: Soru | null = null;
    let enIyiSkor = 0;
    for (const b of kitapciklar.B) {
      if (kullanilan.has(b)) continue;
      const sk = benzerlik(jetonOf.get(a)!, jetonOf.get(b)!);
      if (sk > enIyiSkor) {
        enIyiSkor = sk;
        enIyi = b;
      }
    }
    if (enIyi && enIyiSkor >= 0.5) {
      kullanilan.add(enIyi);
      eslesmeler.push({ a, b: enIyi, skor: enIyiSkor });
    } else {
      eslesmeyen.push(a);
    }
  }

  // Anahtar sağlaması: iki kitapçığın anahtarı AYNI şık metnini göstermeli.
  const anahtarSorunu: string[] = [];
  const tarmaFarki: { a: Soru; b: Soru; skor: number }[] = [];
  for (const { a, b, skor } of eslesmeler) {
    if (skor < 0.85) tarmaFarki.push({ a, b, skor });
    const ma = a.siklar[a.dogru] ?? '';
    const mb = b.siklar[b.dogru] ?? '';
    if (benzerlik(jetonlar(ma), jetonlar(mb)) < 0.6 && parmakIzi(ma) !== parmakIzi(mb)) {
      anahtarSorunu.push(
        `A/${a.no}(${a.dogru}) ↔ B/${b.no}(${b.dogru}) farklı şık gösteriyor\n` +
          `      A: ${ma.slice(0, 90)}\n      B: ${mb.slice(0, 90)}`,
      );
    }
  }

  console.log(`\n── A/B ÇAPRAZ DOĞRULAMA ──`);
  console.log(`eşleşen: ${eslesmeler.length}/${kitapciklar.A.length} · eşleşmeyen: ${eslesmeyen.length}`);
  console.log(`tarama farkı olan (benzerlik <0.85): ${tarmaFarki.length}`);
  console.log(`anahtar çelişkisi: ${anahtarSorunu.length}`);
  for (const p of anahtarSorunu.slice(0, 10)) console.log('  ! ' + p);
  for (const { a, b, skor } of tarmaFarki.slice(0, 10))
    console.log(`  ~ A/${a.no} ↔ B/${b.no} benzerlik ${skor.toFixed(2)} — birinde hasar var`);
  for (const a of eslesmeyen.slice(0, 10))
    console.log(`  ? A/${a.no} (s.${a.sayfa}) eşleşmedi: ${a.kok.slice(0, 70)}`);

  if (!existsSync(`${KOK}/ham`)) mkdirSync(`${KOK}/ham`, { recursive: true });
  writeFileSync(
    `${KOK}/ham/paem10-cozumlenmis.json`,
    JSON.stringify({ kitapciklar, eslesmeler: eslesmeler.map((e) => ({ a: e.a.no, b: e.b.no, skor: Number(e.skor.toFixed(3)) })) }, null, 1),
  );
  console.log(`\n→ ham/paem10-cozumlenmis.json`);
}

main();
