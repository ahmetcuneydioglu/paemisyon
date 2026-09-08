/**
 * Doc 37 — bankaya yazılmış bir OGM sorusunu geri çeker.
 *
 * Yalnız `in_review` sürümler çekilebilir: yayımlanmış bir soruyu silmek
 * kullanıcıların çözüm geçmişini ortada bırakır, o ayrı bir iştir. Soru
 * `contentHash` ile bulunur — kimlik (t29s6 gibi) bankada tutulmuyor.
 *
 *   npx tsx scripts/ogm-soru-geri-cek.ts <doc> <aday.json> <id> [id…]
 *   APPLY=1 … ile siler
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const prisma = new PrismaClient();

async function main() {
  const [doc, adayYolu, ...idler] = process.argv.slice(2);
  if (!doc || !adayYolu || !idler.length)
    throw new Error('kullanım: ogm-soru-geri-cek.ts <doc> <aday.json> <id> [id…]');

  const aday = JSON.parse(readFileSync(adayYolu, 'utf8'));
  const hedefler = idler.map((id) => {
    const q = aday.find((x: any) => x.id === id);
    if (!q) throw new Error(`${id} aday dosyasında yok`);
    return { id, hash: questionFingerprint(q.kok, SIKLAR.map((l) => q.siklar[l])), kok: q.kok };
  });

  const bulunan = await prisma.questionVersion.findMany({
    where: { contentHash: { in: hedefler.map((h) => h.hash) }, question: { deletedAt: null } },
    select: { id: true, questionId: true, status: true, contentHash: true },
  });

  for (const h of hedefler) {
    const v = bulunan.find((b) => b.contentHash === h.hash);
    console.log(`${h.id}: ${v ? `${v.status} · versionId=${v.id}` : 'BANKADA YOK'}  ${h.kok.replace(/\n/g, ' ').slice(0, 50)}`);
  }
  const silinecek = bulunan.filter((b) => b.status === 'in_review');
  const digerleri = bulunan.filter((b) => b.status !== 'in_review');
  if (digerleri.length)
    throw new Error(`${digerleri.length} sürüm in_review DEĞİL (${digerleri.map((d) => d.status).join(', ')}) — elle bakılmalı`);

  console.log(`\nsilinecek: ${silinecek.length}`);
  if (!APPLY) { console.log('(kuru çalışma — APPLY=1 ile silinir)'); return; }
  if (!silinecek.length) return;

  await prisma.$transaction(async (tx) => {
    const vIds = silinecek.map((s) => s.id);
    await tx.legalReference.deleteMany({ where: { questionVersionId: { in: vIds } } });
    await tx.questionOption.deleteMany({ where: { questionVersionId: { in: vIds } } });
    await tx.questionVersion.deleteMany({ where: { id: { in: vIds } } });
    await tx.question.deleteMany({ where: { id: { in: silinecek.map((s) => s.questionId) } } });
  });
  console.log(`✓ ${silinecek.length} soru bankadan silindi`);
}
main().finally(() => prisma.$disconnect());
