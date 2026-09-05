/**
 * Güncel kültür sorularını bankaya yazar (Doc 35).
 *
 * Doc 33/34'ten farkı: bu soruların KAYNAĞI vardır ve gizlenmez —
 * resmî bir kamu duyurusu. `sourceLabel` doldurulur (CLAUDE.md: "her sorunun
 * kaynağı bankada KAYITLIDIR"); kullanıcıya gösterimi yine SettingsService
 * anahtarına bağlıdır, denemede her hâlükârda kapalıdır.
 *
 * Güncel kültür soruları ESKİR: `sourceLabel` tarihi, ileride eskime
 * taramasının tutamağıdır.
 *
 *   npx tsx scripts/guncel-kultur-yaz.ts <dosya.json>          # kuru çalışma
 *   APPLY=1 npx tsx scripts/guncel-kultur-yaz.ts <dosya.json>
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

async function main() {
  const veri = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const sorular = veri.sorular as any[];

  // Doğrulama — yazmadan önce
  const hata: string[] = [];
  for (const s of sorular) {
    const l = Object.keys(s.siklar);
    if (l.length !== 5) hata.push(`#${s.no}: 5 şık yok`);
    if (l.some((x) => !String(s.siklar[x] ?? '').trim())) hata.push(`#${s.no}: boş şık`);
    if (!s.siklar[s.dogru]) hata.push(`#${s.no}: doğru şık geçersiz`);
    if (!s.aciklama?.trim()) hata.push(`#${s.no}: açıklama yok`);
    if (new Set(Object.values(s.siklar).map((t: any) => String(t).trim())).size !== 5)
      hata.push(`#${s.no}: mükerrer şık`);
  }
  if (hata.length) { console.log('DOĞRULAMA HATASI:'); hata.forEach((h) => console.log('  ' + h)); return; }

  const konu = await prisma.topic.findFirst({
    where: { name: 'Genel Kültür', course: { name: { contains: 'Genel Kültür' } }, deletedAt: null },
    select: { id: true, name: true, course: { select: { name: true } } },
  });
  if (!konu) throw new Error('"Genel Kültür" konusu bulunamadı');

  const parmak = sorular.map((s) => questionFingerprint(s.kok, Object.values(s.siklar) as string[]));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } }, select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = sorular.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`kaynak         : ${veri.kaynak}`);
  console.log(`hedef konu     : ${konu.course.name} / ${konu.name}`);
  console.log(`soru           : ${sorular.length}`);
  console.log(`bankada var    : ${sorular.length - yazilacak.length}`);
  console.log(`YAZILACAK      : ${yazilacak.length}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satirlar = yazilacak.map((s) => ({
    s, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(s.kok, Object.values(s.siklar) as string[]),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({ data: satirlar.map((r) => ({ id: r.questionId, topicId: konu.id, articleNo: null })) });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.s.kok, explanation: r.s.aciklama, difficulty: Difficulty.medium,
        sourceLabel: veri.kaynak, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.s.siklar[l]),
          isCorrect: l === r.s.dogru, sortOrder: i,
        })),
      ),
    });
    await tx.legalReference.createMany({
      data: satirlar.map((r) => ({ questionVersionId: r.versionId, citation: veri.kaynak, url: veri.kaynakUrl ?? null })),
    });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · kaynak künyesi bağlandı`);
  }, { timeout: 60_000 });
}
main().finally(() => prisma.$disconnect());
