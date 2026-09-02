/**
 * Doc 32 — DENETIMDEN GECMIS PARTIYI YAYINA ALIR.
 *
 * Kitap partileri `in_review` olarak ice aktarilir, denetim hattindan gecer ve
 * ancak buradan yayina cikar. Iki isi birlikte yapar:
 *   1) Denetcinin yazdigi aciklamayi soruya yazar (yayinevi acikamasinin
 *      yerine gecer — kullanici karari: denetcinin aciklamasi onceliklidir,
 *      cunku resmi metinle DOGRULANARAK ve celdirici analiziyle yazilmistir).
 *   2) Dogrulanan dayanak maddeyi question.articleNo'ya baglar.
 *   3) status=published + question.currentVersionId ayarlar.
 *
 * GUVENLIK:
 *  - Yalniz denetim ciktisinda "yayimlanabilir" cikan sorular yayinlanir.
 *  - Tam 1 dogru sik sarti islem icinde yeniden dogrulanir (admin akisiyla ayni).
 *  - Aciklama Turkce karakter tasimiyorsa reddedilir (ASCII duzlestirme kazasi).
 *  - Onceki durum yedeklenir, deftere yazilir.
 *  - contentHash'e dokunmaz: parmak izi kok+sik metninden uretilir.
 *
 *   npx tsx scripts/denetim-yayinla.ts --sonuc <workflow.json> [--yaz]
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const KLASOR = `${__dirname}/../../../docs/32-yayin-denetimi`;
// Turkce karakter YOGUNLUGU olcutu. Tek bir karakter aramak yetmiyordu: ASCII'ye
// duzlestirilmis metinlerde arada bir 'ı' gecebiliyor ve kontrolu geciyordu.
// Duzgun Turkce metinde bu harfler ~%4-8 orandadir; esik cok dusuk tutuldu.
const TR_HARF = /[çğıöşüÇĞİÖŞÜâîû]/g;
const turkceMi = (s: string) => {
  const n = (s.match(TR_HARF) ?? []).length;
  return n / Math.max(1, s.length) >= 0.015;
};
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

(async () => {
  const YAZ = process.argv.includes('--yaz');
  // --yayinlama: aciklama ve madde bagini yaz ama status'e DOKUNMA. Yeni parti
  // in_review'da kalir; yayin karari insanindir.
  const YAYINLAMA = process.argv.includes('--yayinlama');
  const ham = JSON.parse(readFileSync(arg('--sonuc')!, 'utf-8'));
  const sonuclar: any[] = ham.result?.sonuclar ?? ham.sonuclar;
  const uygun = sonuclar.filter((s) => s.karar === 'yayimlanabilir');
  console.log(`denetim ciktisi: ${sonuclar.length} soru, yayimlanabilir: ${uygun.length}`);

  const rows = await p.questionVersion.findMany({
    where: { status: { in: ['in_review', 'published'] }, question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true, explanation: true, status: true,
      question: { select: { articleNo: true, topic: { select: { id: true, name: true } } } },
      options: { select: { id: true, isCorrect: true } } },
  });

  const plan: Array<{ r: (typeof rows)[number]; s: any; madde: string | null }> = [];
  for (const s of uygun) {
    const r = rows.find((x) => x.id.startsWith(s.id));
    if (!r) { console.log(`!! ${s.id} havuzda yok — atlandi`); continue; }
    if (r.options.filter((o) => o.isCorrect).length !== 1) {
      console.log(`!! ${s.id} dogru sik sayisi 1 degil — atlandi`); continue;
    }
    if (s.aciklama && !turkceMi(s.aciklama)) {
      console.log(`!! ${s.id} aciklama ASCII'ye duzlestirilmis (Turkce harf orani dusuk) — aciklama YAZILMAYACAK`);
      s.aciklama = null;
    }
    // Madde bagi yalniz KENDI konusunun maddesiyse yazilir (baska kanuna
    // dayanan soruda articleNo yaniltici olurdu).
    const madde = s.dogruMadde && s.dogruKanun === r.question.topic?.name ? String(s.dogruMadde) : null;
    plan.push({ r, s, madde });
    console.log(`  ${s.id}  [${r.status === 'published' ? 'zaten yayinda' : 'YAYINA ALINACAK'}]  m.${madde ?? '-'}  aciklama ${s.aciklama ? s.aciklama.length + ' krk' : 'YOK'}  ${r.stem.replace(/\s+/g, ' ').slice(0, 55)}`);
  }

  console.log(`\nyayinlanacak: ${plan.length}`);
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }
  if (!plan.length) return;

  writeFileSync(`${KLASOR}/yayin-yedek.json`, JSON.stringify(plan.map((x) => ({
    versiyonId: x.r.id, questionId: x.r.questionId,
    eskiAciklama: x.r.explanation, eskiArticleNo: x.r.question.articleNo,
    yeniAciklama: x.s.aciklama ?? null, yeniArticleNo: x.madde,
  })), null, 1));

  const simdi = new Date();
  for (const { r, s, madde } of plan) {
    await p.$transaction(async (tx) => {
      await tx.questionVersion.update({
        where: { id: r.id },
        data: { ...(r.status === 'in_review' && !YAYINLAMA ? { status: 'published' as const, publishedAt: simdi } : {}),
          ...(s.aciklama ? { explanation: s.aciklama } : {}) },
      });
      await tx.question.update({
        where: { id: r.questionId },
        data: { ...(r.status === 'in_review' && YAYINLAMA ? {} : { currentVersionId: r.id }),
          ...(madde ? { articleNo: madde } : {}) },
      });
      const n = await tx.questionOption.count({ where: { questionVersionId: r.id, isCorrect: true } });
      if (n !== 1) throw new Error(`${s.id}: dogru sik sayisi ${n} — geri alindi`);
    });
    console.log(`TAMAM: ${s.id} (${r.status})`);
  }

  appendFileSync(`${KLASOR}/ilerleme.jsonl`, plan.map(({ r, s, madde }) => JSON.stringify({
    id: r.id.slice(0, 8), konu: r.question.topic?.name ?? null,
    dayanak: s.dayanak || null, sinif: 'yayimlanabilir',
    bulgu: `${r.status === 'published' ? 'YAYINDA GUNCELLENDI' : YAYINLAMA ? 'DENETIMDEN GECTI (in_review)' : 'YAYINA ALINDI'} — m.${madde ?? '-'}${s.aciklama ? '; denetci aciklamasi yazildi' : ''}`,
    zaman: simdi.toISOString(),
  })).join('\n') + '\n');
  console.log(`\nTOPLAM: ${plan.length} soru yayinda. Yedek: ${KLASOR}/yayin-yedek.json`);
})().finally(() => p.$disconnect());
