/**
 * Doc 32 — SORU ONARICI. Denetimde kusurlu cikip ONARILABILIR olan sorular icin.
 *
 * Arsivleme son caredir: soru tumuyle gecersizse (mevzuat degisti, hicbir sik
 * dogru degil) uygulanir. Ama bazi kusurlar tek bir alanin duzeltilmesiyle
 * kapanir — yanlis isaretlenmis cevap anahtari, ya da mevzuat degisikligi
 * yuzunden yanlisa donmus TEK bir sik metni. Bu durumda soruyu silmek bankayi
 * gereksiz yere kucultur.
 *
 * GUVENLIK:
 *  - Her degisiklik ONCE yedeklenir (onarim-yedek.json).
 *  - Cevap anahtari tasinirken yeni dogru sik TEK olmak zorundadir; birden fazla
 *    isCorrect kalirsa islem iptal edilir.
 *  - Sinavda kullanilmis soruda sik METNI degistirilmez (gecmis sonucun anlami
 *    bozulur); yalniz uyarir. Cevap anahtari tasima da ayni sekilde engellenir.
 *  - Deftere yazar.
 *
 *   npx tsx scripts/soru-onar.ts          (kuru calisma)
 *   npx tsx scripts/soru-onar.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
// Hangi doc'un defterine yazilacagi kosuya gore degisir (Doc 32, Doc 41 ...).
const DOC_DIR = process.env.DOC_DIR ?? '32-yayin-denetimi';
const YEDEK = `${__dirname}/../../../docs/${DOC_DIR}/onarim-yedek.json`;
const DEFTER = `${__dirname}/../../../docs/${DOC_DIR}/ilerleme.jsonl`;

type Onarim =
  | { id: string; tur: 'cevap'; yeniDogruHarf: string; gerekce: string }
  | { id: string; tur: 'sikMetni'; harf: string; yeniMetin: string; gerekce: string }
  // Doc 41: kokteki eskimis kurum/kararname adi. Tum kok yeniden yazilmaz;
  // yalniz `eski` ibaresi `yeni` ile degistirilir ve ibarenin kokte TAM BIR KEZ
  // gectigi dogrulanir — aksi halde onarim sessizce baska bir yeri vurabilir.
  | { id: string; tur: 'kok'; eski: string; yeni: string; gerekce: string };

const O: Onarim[] = [
  // --- Doc 41 (Kaymakamlik bankasi, 10 Eyl 2026) ---
  {
    id: '3ee990f5', tur: 'cevap', yeniDogruHarf: 'A',
    gerekce:
      "k21-11: bankada isaretli D sikki 'Hatay Il Ozel Idaresi'; bu idare 6360 s.K. ile " +
      '2014te tuzel kisiligini yitirdi (Hatay buyuksehir). Sinav 2021de yapildigi icin bu ' +
      'mevzuat eskimesi degil, ice aktarimda yanlis harfin isaretlenmesi. Uc bagimsiz ' +
      'denetci ve iki hakem oybirligiyle dogru cevabin A (Iskenderun Belediyesi) oldugunu ' +
      'soyledi: Isyeri Acma ve Calisma Ruhsatlarina Iliskin Yonetmelik md 4/(a) uyarinca ' +
      'buyuksehirde buyuksehrin yetkili olmadigi sihhi isyeri ruhsatini ilce belediyesi verir. ' +
      'Kok ve sik metinleri aynen korundu; yalniz anahtar tasindi. Kullanici karari.',
  },
  {
    id: '5e0ea80a', tur: 'kok',
    eski: 'Aile ve Sosyal Politikalar Bakanlığında',
    yeni: 'Aile ve Sosyal Hizmetler Bakanlığında',
    gerekce:
      'k23-20: kokteki bakanlik 2018de kaldirildi; bugunku adi 73 s. CBK (21/4/2021) ile ' +
      'Aile ve Sosyal Hizmetler Bakanligi. Bakanlik adi sorunun kurgu dekoru — soru idari ' +
      'islemin YETKI unsurundaki sakatligi olcuyor ve cevap (B) etkilenmiyor. Iki hakem de ' +
      'ayni duzeltmeyi onerdi. Doc 40taki p6 (kararname adi) sinifi. Kullanici karari.',
  },
];


(async () => {
  const YAZ = process.argv.includes('--yaz');
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: {
      id: true, stem: true, _count: { select: { examQuestions: true } },
      question: { select: { topic: { select: { name: true } } } },
      options: { select: { id: true, label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  const plan: Array<{ o: Onarim; r: (typeof rows)[number] }> = [];
  for (const o of O) {
    const r = rows.find((x) => x.id.startsWith(o.id));
    if (!r) { console.log(`!! ${o.id} yayinda bulunamadi — atlandi`); continue; }
    if (r._count.examQuestions > 0) {
      console.log(`!! ${o.id} SINAVDA KULLANILMIS (${r._count.examQuestions}) — onarim yapilmaz, elle karar verilmeli`);
      continue;
    }
    if (o.tur === 'cevap') {
      const hedef = r.options.find((x) => x.label === o.yeniDogruHarf);
      if (!hedef) { console.log(`!! ${o.id} icin ${o.yeniDogruHarf} sikki yok — atlandi`); continue; }
      if (hedef.isCorrect) { console.log(`   ${o.id} zaten ${o.yeniDogruHarf} isaretli — atlandi`); continue; }
    } else if (o.tur === 'sikMetni') {
      const hedef = r.options.find((x) => x.label === o.harf);
      if (!hedef) { console.log(`!! ${o.id} icin ${o.harf} sikki yok — atlandi`); continue; }
      if (hedef.text.trim() === o.yeniMetin.trim()) { console.log(`   ${o.id} ${o.harf} zaten guncel — atlandi`); continue; }
    } else {
      const kez = r.stem.split(o.eski).length - 1;
      if (kez === 0) { console.log(`!! ${o.id} kokunde "${o.eski}" yok — atlandi`); continue; }
      if (kez > 1) { console.log(`!! ${o.id} kokunde "${o.eski}" ${kez} kez geciyor — atlandi, elle bakilmali`); continue; }
    }
    plan.push({ o, r });
    console.log(`\n-- ${o.id}  [${r.question.topic?.name}]`);
    console.log(`   ${r.stem.replace(/\s+/g, ' ').slice(0, 120)}`);
    for (const x of r.options) {
      const yeni = o.tur === 'cevap'
        ? (x.label === o.yeniDogruHarf ? ' <= YENI DOGRU' : (x.isCorrect ? ' <= eski dogru, kaldirilacak' : ''))
        : o.tur === 'sikMetni' ? (x.label === o.harf ? ' <= METIN DEGISECEK' : '')
        : '';
      console.log(`     ${x.label}${x.isCorrect ? ' [X]' : '   '} ${x.text.replace(/\s+/g, ' ').slice(0, 95)}${yeni}`);
    }
    if (o.tur === 'sikMetni') console.log(`     YENI ${o.harf}: ${o.yeniMetin}`);
    if (o.tur === 'kok') console.log(`     KOK: "${o.eski}" -> "${o.yeni}"`);
  }

  console.log(`\nonarilacak: ${plan.length} / ${O.length}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }
  if (!plan.length) return;

  writeFileSync(YEDEK, JSON.stringify(plan.map((x) => ({
    id: x.r.id, onarim: x.o, oncekiSiklar: x.r.options, oncekiKok: x.r.stem,
  })), null, 1));

  const simdi = new Date();
  for (const { o, r } of plan) {
    await p.$transaction(async (tx) => {
      if (o.tur === 'cevap') {
        for (const x of r.options) {
          const olmali = x.label === o.yeniDogruHarf;
          if (x.isCorrect !== olmali) await tx.questionOption.update({ where: { id: x.id }, data: { isCorrect: olmali } });
        }
        // Guvenlik: tek dogru sik kaldigini DOGRULA.
        const sonra = await tx.questionOption.count({ where: { questionVersionId: r.id, isCorrect: true } });
        if (sonra !== 1) throw new Error(`${o.id}: onarim sonrasi dogru sik sayisi ${sonra} — geri alindi`);
      } else if (o.tur === 'sikMetni') {
        const hedef = r.options.find((x) => x.label === o.harf)!;
        await tx.questionOption.update({ where: { id: hedef.id }, data: { text: o.yeniMetin } });
      } else {
        const yeniKok = r.stem.replace(o.eski, o.yeni);
        if (yeniKok === r.stem) throw new Error(`${o.id}: kok degismedi — geri alindi`);
        await tx.questionVersion.update({ where: { id: r.id }, data: { stem: yeniKok } });
      }
    });
    console.log(`ONARILDI: ${o.id} [${o.tur}]`);
  }

  appendFileSync(DEFTER, plan.map(({ o, r }) => JSON.stringify({
    id: r.id.slice(0, 8),
    konu: r.question.topic?.name ?? null,
    dayanak: `onarim: ${o.tur}`,
    sinif: 'duzeltilerek',
    bulgu: `ONARILDI (${o.tur}) — ${o.gerekce}`,
    zaman: simdi.toISOString(),
  })).join('\n') + '\n');
  console.log(`\nTOPLAM: ${plan.length} soru onarildi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());
