/**
 * Doc 36 — PAEM 8'in bankadaki 100 sorusunu çıkmış sınav vitrinine bağlar.
 *
 * Sorular bankada ZATEN var ve yayında (`20 NİSAN 2024 PAEM 8. DÖNEM YAZILI
 * SINAVI` etiketiyle). Eksik olan tek şey kitapçık sırası: `PastExamQuestion`
 * hangi sorunun kaçıncı olduğunu bilmeli.
 *
 * Sıra bankadan çıkarılamıyor — kayıt sırası kitapçık sırası değil (ölçüldü:
 * bankadaki 6. kayıt kitapçıkta 4. soru). Bu yüzden sıra kaynak PDF'ten
 * okunup soru metniyle eşleştirilir.
 *
 * Eşleştirme ÖN EK üzerinden yapılır: PDF'ten okunan blok kök + şıkları
 * içerir, bankadaki kayıtta ise yalnız kök vardır. Bu yüzden eşitlik değil,
 * "PDF bloğu, bankadaki kökle başlıyor mu" sorusu sorulur. (İlk denemede
 * eşitlik arandı ve 80 karakterden kısa köklü 17 soru eşleşmedi.)
 * Tek eşleşme bulunamayan soru sessizce atlanmaz — raporlanır.
 *
 *   npx tsx scripts/paem8-vitrine-bagla.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem8-vitrine-bagla.ts
 */
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const PDF = `${process.env.HOME}/Documents/PaemÇıkmışSorular/paem8.pdf`;
const APPLY = process.env.APPLY === '1';
const SAYFALAR = { ilk: 2, son: 17 };
/** İki sütunlu düzenin ayrım noktası (A4 595pt; soru numaraları 48 ve 309'da). */
const SUTUN = 300;
/** Bu uzunluğun altındaki kök ön eki birden çok soruya uyabilir. */
const EN_AZ_ONEK = 40;
const prisma = new PrismaClient();

const GURULTU = [
  /DÖNEM İLK DERECE AMİRLİK EĞİTİMİ/i,
  /ÖLÇME, DEĞERLENDİRME VE SINAV HİZMETLERİ/i,
  /^[AB]$/,
  /^\d{1,2}$/,
];

/** Karşılaştırma için: boşluk, noktalama ve büyük/küçük harf farkını sil. */
const anahtarla = (s: string) => s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]/gu, '');

function pdftenSorular(): Map<number, string> {
  const parcalar: string[] = [];
  for (let p = SAYFALAR.ilk; p <= SAYFALAR.son; p++) {
    for (const [x, w] of [[0, SUTUN], [SUTUN, 595 - SUTUN]]) {
      parcalar.push(
        execFileSync(
          'pdftotext',
          ['-layout', '-f', String(p), '-l', String(p), '-x', String(x), '-y', '0', '-W', String(w), '-H', '842', PDF, '-'],
          { encoding: 'utf8', maxBuffer: 1 << 26 },
        ),
      );
    }
  }
  const sorular = new Map<number, string>();
  let no = 0;
  let birikim: string[] = [];
  const kapat = () => { if (no) sorular.set(no, birikim.join(' ')); };
  for (const ham of parcalar.join('\n').split('\n')) {
    const s = ham.replace(/\s+/g, ' ').trim();
    if (!s || GURULTU.some((r) => r.test(s))) continue;
    const bas = s.match(/^(\d{1,3})\.\s*(.*)$/);
    if (bas && Number(bas[1]) === no + 1) {
      kapat();
      no = Number(bas[1]);
      birikim = bas[2] ? [bas[2]] : [];
      continue;
    }
    if (no) birikim.push(s);
  }
  kapat();
  return sorular;
}

async function main() {
  const pdf = pdftenSorular();
  console.log(`PDF'ten okunan soru: ${pdf.size}`);
  const eksik = [...Array(100).keys()].map((i) => i + 1).filter((n) => !pdf.has(n));
  if (eksik.length) console.log(`  PDF'te bulunamayan numaralar: ${eksik.join(', ')}`);

  const banka = await prisma.questionVersion.findMany({
    where: { sourceLabel: { contains: 'PAEM 8' }, status: 'published', question: { deletedAt: null } },
    select: { stem: true, questionId: true },
  });
  console.log(`bankadaki PAEM 8 sorusu: ${banka.length}`);

  const bloklar = [...pdf].map(([no, metin]) => ({ no, anahtar: anahtarla(metin) }));

  const eslesme: { questionId: string; no: number }[] = [];
  const eslesmeyen: string[] = [];
  for (const v of banka) {
    const kok = anahtarla(v.stem);
    const ozet = v.stem.replace(/\s+/g, ' ').slice(0, 70);
    if (kok.length < EN_AZ_ONEK) { eslesmeyen.push(`(kök çok kısa) ${ozet}`); continue; }
    let adaylar = bloklar.filter((b) => b.anahtar.startsWith(kok));
    if (adaylar.length !== 1) {
      // Tablolu sorularda banka kökünün sonuna tablo başlığı eklenmiş
      // ("... doğru verilmiştir? Meslek Dereceleri En Az Bekleme Süreleri");
      // PDF'te tablo başka bir konumda duruyor. Soru cümlesi yeterli kimliktir.
      const soruCumlesi = v.stem.slice(0, v.stem.indexOf('?') + 1);
      const kisa = anahtarla(soruCumlesi);
      adaylar = kisa.length >= EN_AZ_ONEK ? bloklar.filter((b) => b.anahtar.startsWith(kisa)) : [];
    }
    if (adaylar.length !== 1) { eslesmeyen.push(`(${adaylar.length} aday) ${ozet}`); continue; }
    eslesme.push({ questionId: v.questionId, no: adaylar[0].no });
  }
  const sira = new Set(eslesme.map((e) => e.no));
  console.log(`eşleşen: ${eslesme.length} · eşleşmeyen: ${eslesmeyen.length} · benzersiz sıra: ${sira.size}`);
  for (const s of eslesmeyen.slice(0, 10)) console.log('  eşleşmedi: ' + s);
  if (sira.size !== eslesme.length) throw new Error('iki soru aynı sıraya eşleşti — eşleştirme güvenilir değil');

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  if (eslesmeyen.length) throw new Error('eşleşmeyen soru varken vitrin kurulmaz — önce eşleştirme düzeltilmeli');

  const sinav = await prisma.pastExam.upsert({
    where: { slug: 'paem-8-2024' },
    update: {},
    create: {
      slug: 'paem-8-2024',
      name: '2024 PAEM 8. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
      institution: 'Polis Akademisi Başkanlığı',
      term: 8,
      heldOn: new Date('2024-04-20'),
      kind: 'resmi',
      questionCount: 100,
      sortOrder: 8,
      status: 'draft',
    },
  });
  const mevcut = await prisma.pastExamQuestion.count({ where: { pastExamId: sinav.id } });
  if (mevcut > 0) throw new Error(`paem-8-2024 zaten ${mevcut} soru içeriyor — yazma iptal edildi.`);

  await prisma.pastExamQuestion.createMany({
    data: eslesme.map((e) => ({ pastExamId: sinav.id, questionId: e.questionId, orderNo: e.no })),
  });
  console.log(`\n✓ ${eslesme.length} soru vitrine bağlandı · ${sinav.slug} (draft)`);
}
main().finally(() => prisma.$disconnect());
