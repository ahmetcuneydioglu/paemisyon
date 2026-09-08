/**
 * Doc 37 — denetimden geçen OGM Materyal sorularını bankaya `in_review` yazar.
 *
 * KAPSAM: karar = ONAY | ZAYIF ve açıklaması yazılmış sorular. UYARI /
 * ANAHTAR-SUPHELI / CELISKI olanlar RAPOR.md'ye gider, bankaya girmez.
 *
 * `sourceLabel` DOLU yazılır: soru MEB'in açık soru bankasından geliyor ve
 * "her sorunun kaynağı bankada kayıtlıdır" kuralı bunu gerektiriyor. Etiket
 * son kullanıcıya gösterilmez (SettingsService.showQuestionSource, varsayılan
 * kapalı) — yalnız admin panelde görünür.
 *
 *   npx tsx scripts/ogm-bankaya-yaz.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/ogm-bankaya-yaz.ts    # yaz
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/37-ogm-inkilap';
const APPLY = process.env.APPLY === '1';
const GECER = new Set(['ONAY', 'ZAYIF']);
/** Dersin TEK konusu (8 Eyl 2026'da üç kopya konu burada birleştirildi). */
const KONU_ID = '23d22785-351b-4f39-8516-a419e2c254c0';
const KAYNAK = 'MEB OGM Materyal soru bankası';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const prisma = new PrismaClient();

async function main() {
  const karar = new Map<string, string>(
    JSON.parse(readFileSync(`${KOK}/denetim/ogm-1-karar.json`, 'utf8')).map((k: any) => [k.id, k.karar]),
  );
  const aciklama = new Map<string, { aciklama: string; dayanak: string | null }>(
    JSON.parse(readFileSync(`${KOK}/aciklama/ogm-1.json`, 'utf8')).map((a: any) => [
      a.id, { aciklama: a.aciklama, dayanak: a.dayanak ?? null },
    ]),
  );
  const aday = JSON.parse(readFileSync(`${KOK}/aday-10.json`, 'utf8'));

  const gecerli: any[] = [];
  const eleme: Record<string, string[]> = { karar: [], aciklamaYok: [], cevapYok: [] };
  for (const q of aday) {
    const id = `s${q.no}`;
    if (!GECER.has(karar.get(id) ?? '')) { eleme.karar.push(`${id}=${karar.get(id) ?? 'KARARSIZ'}`); continue; }
    if (!aciklama.has(id)) { eleme.aciklamaYok.push(id); continue; }
    if (!q.dogru) { eleme.cevapYok.push(id); continue; }
    gecerli.push({ ...q, id, ac: aciklama.get(id)! });
  }

  const parmak = gecerli.map((r) => questionFingerprint(r.kok, SIKLAR.map((l) => r.siklar[l])));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } },
    select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`aday soru          : ${aday.length}`);
  console.log(`karar nedeniyle    : ${eleme.karar.length}  ${eleme.karar.join(' ')}`);
  console.log(`açıklaması yok     : ${eleme.aciklamaYok.length}  ${eleme.aciklamaYok.join(' ')}`);
  console.log(`cevabı yok         : ${eleme.cevapYok.length}  ${eleme.cevapYok.join(' ')}`);
  console.log(`bankada zaten var  : ${gecerli.length - yazilacak.length}`);
  console.log(`YAZILACAK          : ${yazilacak.length}  (${yazilacak.map((r) => r.id).join(' ')})`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  if (!yazilacak.length) { console.log('\nyazılacak soru yok.'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(r.kok, SIKLAR.map((l) => r.siklar[l])),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: satirlar.map((r) => ({ id: r.questionId, topicId: KONU_ID, articleNo: null })),
    });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok, explanation: r.ac.aciklama, difficulty: Difficulty.medium,
        sourceLabel: KAYNAK, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        SIKLAR.map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.siklar[l]),
          isCorrect: l === r.dogru, sortOrder: i,
        })),
      ),
    });
    const ref = satirlar.filter((r) => r.ac.dayanak)
      .map((r) => ({ questionVersionId: r.versionId, citation: r.ac.dayanak! }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
