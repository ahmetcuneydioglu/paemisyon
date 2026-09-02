/**
 * Doc 32 — DENETIM SONUCU ARSIVLEME.
 *
 * Yayindan kaldirilmasi gereken sorulari arsivler. Iki mesru gerekce vardir:
 *   ESKIME  — mevzuat degisti, isaretli cevap artik yururlukteki metne uymuyor
 *             ve kok onarilabilir degil (onarim soruyu bambaska bir soru yapar).
 *   KAYNAKSIZ — sorunun dayanagi bankada yok ve temin edilemiyor; "gercek,
 *             kaynakli soru" vaadi kaynaksiz soruyu tasiyamaz.
 *   YIGILMA — soru dogru ve kaynakli, ancak bankadaki BASKA bir soru ayni kurali
 *             ayni kurguyla olcuyor. Kullanici karari: "cok soru demek iyi birsey
 *             degil, onemli olan temiz soru olmasi". Ciftin daha ogretici olani
 *             birakilir, digeri arsivlenir.
 *
 * Desen Doc 31/32 ile ayni: surum archived + soru soft delete. ExamQuestion
 * questionVersionId'ye FK ile bagli oldugundan SURUM SATIRI SILINMEZ; gecmis
 * sinav sonuclari bozulmaz. Sinavda kullanilmis sorular ayrica raporlanir.
 *
 *   npx tsx scripts/soru-arsivle.ts            (kuru calisma)
 *   npx tsx scripts/soru-arsivle.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/arsiv-yedek.json`;

// [soru id oneki, sinif, gerekce]
const A: Array<[string, 'eskime' | 'kaynaksiz' | 'bozuk' | 'yigilma', string]> = [
  // [soru id oneki, sinif, gerekce] — her kosuda doldurulur.
  ['e2d9ea9a', 'yigilma', "Denetci yigilma tespiti: 8d54c9c6 ile ayni kurali (TCK m.84/4'un kasten oldurme sayilan halleri) ayni onculu kalipla olcuyor; 'buyuk olcude mukerrer' notu dusuldu. m.84/4'un HER IKI halini (cebir/tehditle mecbur etme + algilama yetenegi gelismemis kisiyi sevk) birlikte olcen 8d54c9c6 birakildi."],
  ['1f92fb14', 'yigilma', "Denetci yigilma tespiti: e2e7ba2d ile ayni kurali (TCK m.67/1 + CMK m.231/8-253/21 dava zamanasimini durduran nedenlerin sinirli sayimi) ayni onculu kalipla olcuyor. Basit yargilama usulu (CMK m.251) tuzagini da tasiyan e2e7ba2d birakildi."],
  ['22316627', 'eskime', "AYM 8/10/2015 E.2014/140 K.2015/85 karariyla TCK m.53/1-b 'secme ve secilme ehliyeti' yonunden iptal edildi; hapis mahkumiyetinin kanuni sonucu olarak secme-secilme yoksunlugu artik dogmuyor. Bu, A (genel secimlerde oy kullanamaz) ve B (belediye baskan adayi olamaz) siklarini tartismali kiliyor; 'hangisi yanlistir' kokunde tek dogru cevap ilkesi zedeleniyor. Cozum 298 ve 2839 s.K. gibi TCK disi mevzuata bagli oldugundan ogrenciye bilgi kirliligi yaratir. Denetimde bir denetci kusurlu buldu; karsi-dogrulama 2/3 ile curuttu ama tam uzlasma saglanamadi — supheli soru bankada tutulmaz."],
  ['9a55e230', 'yigilma', "Denetci yigilma tespiti: 79ee8bae ile ayni kurali (m.43/1 'degisik zamanlarda' kosulu + tamamlanmis hirsizlikta tesebbus olmamasi) ayni kurguyla (magazadan cok sayida esya alip bir kismini birakma) olcuyor. Daha zengin kurgulu 79ee8bae birakildi."],
  ['40129ef0', 'yigilma', "Denetci yigilma tespiti: af7b2405 ile ayni kurali (hirsizlikta magdur zilyettir; tek zilyet + ayni anda alma = tek suc) ayni bicimde olcuyor. Sayisal celdirici tuzagi (1/10/30/300) daha ayirt edici olan af7b2405 birakildi."],
  ['c95374ec', 'yigilma', "Denetci yigilma tespiti: 449f025a ile ayni kurali neredeyse birebir ayni olay kurgusuyla (otoparkta farkli kisilere ait araclardan calma) olcuyor. Gercek ictima kavramini da siklarinda tasiyan 449f025a birakildi."],
  // ['d3f859a9', 'bozuk', "CMK m.231/6 HAGB kosullari arasinda 'yer almayan' olarak hem B (daha once HERHANGI BIR suctan mahkum olmama; metin yalnizca KASITLI suc arar) hem E (sanigin HAGB'yi kabul etmesi; rıza sarti 5728 s.K. ile metinden cikarilmis) gecerli cevap; tek dogru cevap ilkesi bozulmus. 3 karsi-dogrulayicinin ucu de iddiayi teyit etti (0/3 curutme)."],
];

(async () => {
  const YAZ = process.argv.includes('--yaz');

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
      question: { select: { articleNo: true, topic: { select: { name: true } } } } },
  });

  const plan = [];
  for (const [onek, sinif, gerekce] of A) {
    const r = rows.find((x) => x.id.startsWith(onek));
    if (!r) { console.log(`!! ${onek} yayinda bulunamadi — atlandi`); continue; }
    plan.push({ r, sinif, gerekce });
    console.log(`\n-- ${onek}  [${sinif}]  ${r.question.topic?.name}`);
    console.log(`   ${r.stem.replace(/\s+/g, ' ').slice(0, 130)}`);
    console.log(`   kaynak: ${r.sourceLabel} | sinavda kullanim: ${r._count.examQuestions}`);
    if (r._count.examQuestions > 0)
      console.log(`   NOT: ${r._count.examQuestions} sinavda kullanilmis — surum satiri KORUNUYOR, gecmis sonuclar bozulmaz.`);
    console.log(`   GEREKCE: ${gerekce.slice(0, 220)}`);
  }

  const sayim = plan.reduce((a: Record<string, number>, x) => ({ ...a, [x.sinif]: (a[x.sinif] ?? 0) + 1 }), {});
  console.log(`\narsivlenecek: ${plan.length} / ${A.length}  ${JSON.stringify(sayim)}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }

  writeFileSync(YEDEK, JSON.stringify(plan.map((x) => ({
    sinif: x.sinif, gerekce: x.gerekce, arsivlenen: { ...x.r, _count: undefined },
  })), null, 1));

  const simdi = new Date();
  for (const x of plan) {
    await p.$transaction(async (tx) => {
      await tx.questionVersion.update({ where: { id: x.r.id }, data: { status: 'archived', archivedAt: simdi } });
      await tx.question.update({ where: { id: x.r.questionId }, data: { deletedAt: simdi, currentVersionId: null } });
    });
    console.log(`arsivlendi: ${x.r.id.slice(0, 8)}  [${x.sinif}]`);
  }
  // DEFTERE YAZ. Bu adim onceden YOKTU ve iki kez ayni karisikliga yol acti:
  // arsivlenmis sorular defterde hala 'belirsiz' gorunuyordu, ben de "arsivlenmesi
  // gerekenler kalmis" diye yanlis rapor verdim. Arsivleme ile defter kaydi ayni
  // islemde olmali; aksi halde iki kaynak birbirinden ayrisiyor.
  const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/ilerleme.jsonl`;
  const satirlar = plan.map((x) => JSON.stringify({
    id: x.r.id.slice(0, 8),
    konu: x.r.question.topic?.name ?? null,
    dayanak: `arsiv: ${x.sinif}`,
    sinif: 'arsivlendi',
    bulgu: `ARSIVLENDI (${x.sinif}) — ${x.gerekce}`,
    zaman: simdi.toISOString(),
  }));
  appendFileSync(DEFTER, satirlar.join('\n') + '\n');
  console.log(`deftere yazildi: ${satirlar.length} kayit`);

  console.log(`\nTOPLAM: ${plan.length} soru arsivlendi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());
