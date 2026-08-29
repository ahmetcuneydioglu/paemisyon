/**
 * Doc 32 — ESKIME TARAYICISI. Ajan kullanmaz, saf metin analizi.
 *
 * Fikir: mevzuat.gov.tr konsolide metinleri, degisiklikleri DIPNOT olarak tasir:
 *   "51 2/3/2024 tarihli ve 7499 sayili Kanunun 13 uncu maddesi ile bu fikrada yer alan
 *    "onbes gun" ibaresi "iki hafta" seklinde degistirilmistir."
 * Yani bankadaki metin, HANGI IBARENIN NEYE DONUSTUGUNU zaten yaziyor. Denetimde
 * bulunan 8 kusurun ikisi (3080b1df, f8ea3537) tam olarak bu tur bir degisiklikten
 * dogmustu: soru eski sureyi dogru cevap olarak isaretliyordu.
 *
 * Bu script o dipnotlari cikarir ve ilgili maddeye bagli sorularin SIKLARINDA
 * ESKI ibareyi arar. Eslesme = eskime suphesi (kesin kusur degil; elle bakilir).
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// "…yer alan "X" ibaresi "Y" şeklinde değiştirilmiştir" (tirnak cesitleri dahil)
const DEG = /["“”']([^"“”']{2,60})["“”']\s*ibaresi\s*["“”']([^"“”']{2,60})["“”']\s*şeklinde\s*değiştiril/gi;
const YIL = /(\d{1,2}\/\d{1,2}\/(20\d{2}))\s*tarihli/;
const sadeles = (s: string) => s.replace(/\s+/g, ' ').toLocaleLowerCase('tr').trim();

(async () => {
  const ESIK = Number(process.argv[process.argv.indexOf('--yildan') + 1]) || 2020;
  const maddeler = await p.lawArticle.findMany({
    where: { deletedAt: null, status: 'published' },
    select: { articleNo: true, text: true, topicId: true, topic: { select: { name: true } } } });

  type Deg = { kanun: string; no: string; topicId: string; eski: string; yeni: string; tarih: string };
  const degler: Deg[] = [];
  for (const m of maddeler) {
    const duz = m.text.replace(/\s+/g, ' ');
    for (const g of duz.matchAll(DEG)) {
      // Dipnotun tarihini, eslesmenin hemen oncesindeki metinden al.
      const once = duz.slice(Math.max(0, g.index! - 160), g.index!);
      const y = YIL.exec(once);
      if (!y || Number(y[2]) < ESIK) continue;
      degler.push({ kanun: m.topic?.name ?? '?', no: m.articleNo, topicId: m.topicId,
        eski: g[1].trim(), yeni: g[2].trim(), tarih: y[1] });
    }
  }
  console.log(`${ESIK} ve sonrasi ibare degisikligi: ${degler.length}\n`);

  const sorular = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, stem: true,
      question: { select: { articleNo: true, topicId: true, topic: { select: { name: true } } } },
      options: { select: { text: true, isCorrect: true } } } });

  let n = 0;
  for (const d of degler) {
    const eski = sadeles(d.eski);
    if (eski.length < 3) continue;
    for (const q of sorular) {
      // Ayni kanun; madde bagi varsa ayni madde olmali (yoksa kanun capinda bak).
      if (q.question.topicId !== d.topicId) continue;
      if (q.question.articleNo && q.question.articleNo !== d.no) continue;
      const dogru = q.options.filter((o) => o.isCorrect);
      const vurulan = dogru.filter((o) => sadeles(o.text).includes(eski));
      if (!vurulan.length) continue;
      // Yeni ibare de metinde geciyorsa soru zaten guncellenmis olabilir.
      const yeniVar = q.options.some((o) => sadeles(o.text).includes(sadeles(d.yeni)));
      n++;
      console.log(`${q.id.slice(0, 8)}  ${d.kanun} m.${d.no}  [${d.tarih}]`);
      console.log(`   "${d.eski}" -> "${d.yeni}"${yeniVar ? '   (YENI IBARE DE SIKLARDA VAR — muhtemelen guncel)' : ''}`);
      console.log(`   kok: ${q.stem.replace(/\s+/g, ' ').slice(0, 110)}`);
      console.log(`   ISARETLI: ${vurulan.map((o) => o.text.replace(/\s+/g, ' ').slice(0, 70)).join(' | ')}\n`);
    }
  }
  console.log(`\nESKIME SUPHESI: ${n} soru (isaretli dogru sik, degistirilmis ESKI ibareyi tasiyor)`);
})().finally(() => p.$disconnect());
