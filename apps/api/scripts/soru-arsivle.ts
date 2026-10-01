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
// Hangi doc'un defterine yazilacagi kosuya gore degisir (Doc 32, Doc 41 ...).
const DOC_DIR = process.env.DOC_DIR ?? '32-yayin-denetimi';
const YEDEK = `${__dirname}/../../../docs/${DOC_DIR}/arsiv-yedek.json`;

// [soru id oneki, sinif, gerekce]
const A: Array<[string, 'eskime' | 'kaynaksiz' | 'bozuk' | 'yigilma', string]> = [
  // --- Doc 41 (Kaymakamlik bankasi, 10 Eyl 2026) ---
  ['ca64bb8e', 'bozuk',
    "k23-32: 'Il yonetimiyle ilgili asagidakilerden hangisi YANLISTIR?' kokunde hicbir sik " +
    "kesin yanlis degil. Bankanin isaretledigi C ('iller ilcelere, ilceler de bucaklara " +
    "bolunmustur') 5442 s.K. md 1'in yururlukteki lafzi — madde 12/5/1964-469/1 ile degistigi " +
    "haliyle duruyor ve bucak hukumleri (md 41-56) hala yururlukte, yani C DOGRU bir ifade. " +
    "Uc denetcinin isaret ettigi D ('merkez ilcenin yonetiminden vali sorumludur') ise 4483 " +
    "s.K. md 3/(b)'deki 'ilde ve merkez ilcede gorevli memurlar hakkinda vali' hukmuyle " +
    "desteklenebiliyor; A md 3, B kabul tarihi 10/6/1949, E md 2/A ile dogrulaniyor. Aday " +
    "hangi sikki isaretlerse hakli olarak itiraz edebilir. Iki hakem de KUSURLU dedi ve " +
    "duzeltme onermedi: sik kumesini onarmak soruyu yeniden yazmak olur. Hicbir denemede " +
    "kullanilmamis. Kullanici karari."],
  // [soru id oneki, sinif, gerekce] — her kosuda doldurulur.
  // Onceki kosularin kayitlari docs/32-yayin-denetimi/ilerleme.jsonl defterinde.
  // --- 7593/7590 tazeleme turu (24 Eyl 2026) — iki bağımsız çürütücü de ESASA onayladı ---
  ['bcec17f7', 'eskime', "CMK 253/19 (soru 7909166d): E sikki ('uzlastirmanin saglanmasi durumunda tazminat davasi acilamaz; acilmis davadan feragat edilmis sayilir') YANLIS diye isaretli, aciklama AYM 26/7/2023 E.2023/43 K.2023/141 iptalini gunumuz hukuku diye ogretiyor. Oysa 7531 s.K. md 16 (7/11/2024) kurali 'uzlasma aninda tespit edilemeyen veya sonradan ortaya cikan zararlar haric' kaydiyla YENIDEN getirdi; guncel 253/19 bu cumleyi iceriyor. E bugun genel kurali dogru ifade ediyor, A-D de dogru: soruda yanlis ifade kalmadi, anahtar dayanaksiz. Kusur 7593 kaynakli degil, 7531'den beri var; tam tur taramasinda ortaya cikti."],
  ['87575b23', 'eskime', "PVSK Ek 7 (soru 80f4b7bb): 7590 s.K. (24/7/2026) telekomunikasyon islemleri ve CMK 135 dinlemelerinin yurutuldugu tek merkezi 'Bilgi Teknolojileri ve Iletisim Kurumu' bunyesinden 'Siber Guvenlik Baskanligi' bunyesine aldi. Isaretli dogru cevap C (BTK) bugun yanlis; yeni dogru cevap siklarda yok, soru cevapsiz kaldi. Bu bir GOREV DEVRI (BTK ayri kurum olarak suruyor, 5395 md 5/A iki kurumu yan yana sayiyor), ad degisikligi degil — ad/unvan istisnasiyla sik duzeltilemez."],
  ['dcf3d91b', 'bozuk', "CMK 253/3 (soru 2b45b402, 'hangisi dogrudur'): isaretli D (253/4) dogru, ancak B ('kapsama girmeyen bir baska sucla birlikte islenmis olmasi durumunda da uzlastirma hukumleri uygulanabilir') de bugun DOGRU. B, 5918 (2009) tarihli mutlak yasagin olumsuzu olarak yazilmis; 7188 s.K. md 26 (17/10/2019) yasagi 'birlikte AYNI MAGDURA karsi' islenme haline daraltti, 7571 (2025) onodemelik sucla birlesmede de uzlasmayi acti. Aciklamanin kendi TUZAK cumlesi bunu kabul ediyor. Uc bagimsiz curutucu oybirligiyle cift cevap dedi. Kusur 7593 kaynakli degil, 2019'dan beri var."],
  ['9f4b8ade', 'bozuk', "CMK 150 (soru 88b4187d, 'zorunlu mudafilik hallerinden biri DEGILDIR'): B sikki 'supheli veya sanigin sagir VEYA dilsiz olmasi' diyor; kanun 150/2 'sagir VE dilsiz'. Ayni Kanun md 234/2 magdur icin bilincli olarak 'sagir veya dilsiz' der — fark kapsami degistiriyor: yalniz sagir ya da yalniz dilsiz supheli 150/2'ye girmez, B de savunulabilir (cift cevap). Aciklama yalniz kaynak kitaba unite/sayfa atfi, kural ogretmiyor. Bankada lafza uygun ikiz soru var (10320c31). Iki bagimsiz curutucu ONAY. 7593 kaynakli degil."],
  ['1d44ce9f', 'bozuk', "TCK 104 (soru dc9863af): kokte yas FAILE verilmis ('On yedi yasindaki Ahmet, ... kuzeni Burak ile'), dogru cevabi belirleyen MAGDURUN yasi yok. 104/1 magdurun 15-17 yasinda olmasina bagli; 15 alti TCK 103, 18+ suc yok. Aciklama kokte olmayan 'on bes yasini tamamlamis cocukla' varsayimina dayaniyor. Iki bagimsiz curutucu ONAY. 7593 kaynakli degil."],
  // b0ec805b (seri muhakeme) BURADAN ÇIKARILDI: 12 Eyl 2026'da düzeltilip kullanıcı kararıyla yayına geri
  // alındı (commit 0f6e2d9). Listede kalırsa bir sonraki --yaz onu yeniden arşivler — koşusu biten kaydı silin.
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
  const DEFTER = `${__dirname}/../../../docs/${DOC_DIR}/ilerleme.jsonl`;
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
