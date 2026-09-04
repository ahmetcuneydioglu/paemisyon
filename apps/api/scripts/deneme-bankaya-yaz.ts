/**
 * Doc 34 — denetimden geçen deneme sorularını bankaya yazar.
 *
 * KAPSAM: karar = ONAY | ZAYIF ve açıklaması yazılmış sorular. UYARI /
 * ÇELİŞKİ / ANAHTAR-HATALI / KUSURLU olanlar RAPOR.md'ye gider.
 *
 * Konu ataması `siniflandirma.json`daki `konuId` alanından gelir (sınıflandırıcı
 * ajan müfredat ağacına karşı doğruladı). sourceLabel BOŞ: özgün soru
 * (kullanıcı kararı, 5 Eyl 2026). Madde künyesi LegalReference olarak yazılır.
 *
 *   npx tsx scripts/deneme-bankaya-yaz.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/deneme-bankaya-yaz.ts    # yaz
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
const APPLY = process.env.APPLY === '1';
const GECER = new Set(['ONAY', 'ZAYIF']);
const prisma = new PrismaClient();

async function main() {
  const karar = new Map<string, string>();
  for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x) && !/^onarilan2?-/.test(x)))
    for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) karar.set(k.id, k.karar);

  const aciklama = new Map<string, { aciklama: string; dayanak: string | null }>();
  if (existsSync(`${KOK}/aciklama`))
    for (const f of readdirSync(`${KOK}/aciklama`).filter((x) => x.endsWith('.json')))
      for (const a of JSON.parse(readFileSync(`${KOK}/aciklama/${f}`, 'utf8')))
        aciklama.set(a.id, { aciklama: a.aciklama, dayanak: a.dayanak ?? null });

  const sinif = new Map<string, any>(
    JSON.parse(readFileSync(`${KOK}/siniflandirma.json`, 'utf8')).map((s: any) => [`s${s.no}`, s]),
  );
  const aday = JSON.parse(readFileSync(`${KOK}/aday-96.json`, 'utf8'));

  const gecerli: any[] = [];
  const eleme = { karar: 0, aciklamaYok: 0, konuYok: 0, kararYok: 0 };
  for (const q of aday) {
    const id = `s${q.no}`;
    const k = karar.get(id);
    if (!k) { eleme.kararYok++; continue; }
    if (!GECER.has(k)) { eleme.karar++; continue; }
    if (!aciklama.has(id)) { eleme.aciklamaYok++; continue; }
    const konuId = sinif.get(id)?.konuId;
    if (!konuId) { eleme.konuYok++; continue; }
    gecerli.push({ ...q, id, konuId, ders: sinif.get(id)?.ders, ac: aciklama.get(id)! });
  }

  const parmak = gecerli.map((r) => questionFingerprint(r.kok, ['A', 'B', 'C', 'D', 'E'].map((l) => r.siklar[l])));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } }, select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`aday soru            : ${aday.length}`);
  console.log(`karar nedeniyle elendi: ${eleme.karar}   (UYARI/ÇELİŞKİ/ANAHTAR-HATALI/KUSURLU)`);
  console.log(`açıklaması yok       : ${eleme.aciklamaYok}`);
  console.log(`konusu çözülemedi    : ${eleme.konuYok}`);
  console.log(`bankada zaten var    : ${gecerli.length - yazilacak.length}`);
  console.log(`YAZILACAK            : ${yazilacak.length}`);
  const dagilim = yazilacak.reduce<Record<string, number>>((a, r) => ({ ...a, [r.ders]: (a[r.ders] ?? 0) + 1 }), {});
  for (const [d, n] of Object.entries(dagilim).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  ${d}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(r.kok, ['A', 'B', 'C', 'D', 'E'].map((l) => r.siklar[l])),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({ data: satirlar.map((r) => ({ id: r.questionId, topicId: r.konuId, articleNo: null })) });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok, explanation: r.ac.aciklama, difficulty: Difficulty.medium,
        sourceLabel: null, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.siklar[l]),
          isCorrect: l === r.dogru, sortOrder: i,
        })),
      ),
    });
    const ref = satirlar.filter((r) => r.ac.dayanak).map((r) => ({ questionVersionId: r.versionId, citation: r.ac.dayanak! }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
