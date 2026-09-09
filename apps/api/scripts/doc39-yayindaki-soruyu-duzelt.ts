/**
 * Doc 39 — YAYINDAKİ bir soruyu aday dosyasındaki düzeltilmiş hâline getirir.
 *
 * Yalnız kullanıcının o soru için verdiği açık onayla çalışır. Yayındaki metni
 * değiştirmek canlı içeriği değiştirmektir; bu yüzden script tek soru alır,
 * eski/yeni metni yan yana basar ve APPLY=1 olmadan hiçbir şey yazmaz.
 *
 * Sürüm YERİNDE güncellenir (yeni sürüm açılmaz): soru yayında ve
 * Question.currentVersionId bu sürüme bağlı; yeni sürüm açmak yayın bağını
 * koparır ya da kuyrukta ikinci bir kopya bırakır. `contentHash` yeniden
 * hesaplanır — aksi hâlde mükerrer taraması eski metne göre çalışır.
 *
 *   npx tsx scripts/doc39-yayindaki-soruyu-duzelt.ts <doc-dizini> <parti> <id>
 *   APPLY=1 … ile uygulanır
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const prisma = new PrismaClient();

async function main() {
  const [doc, parti, id] = process.argv.slice(2);
  if (!doc || !parti || !id) throw new Error('kullanım: … <doc-dizini> <parti> <id>');

  const aday = JSON.parse(readFileSync(`${doc}/aday/${parti}.json`, 'utf8'));
  const q = aday.find((x: any) => x.id === id);
  if (!q) throw new Error(`${id} aday dosyasında yok`);

  // Soru KÖKÜNDEN bulunur: şıklar ve açıklama değiştiği için contentHash artık
  // tutmaz; kök bu düzeltmede değişmiyor.
  const surumler = await prisma.questionVersion.findMany({
    where: { stem: q.kok.trim(), sourceLabel: { startsWith: 'Mevzuat türetimi' } },
    select: {
      id: true, status: true, explanation: true,
      options: { select: { id: true, label: true, text: true, isCorrect: true } },
      question: { select: { id: true, deletedAt: true } },
    },
  });
  const canli = surumler.filter((s) => s.question.deletedAt == null);
  if (canli.length !== 1) throw new Error(`beklenen tek canlı sürüm, bulunan ${canli.length}`);
  const s = canli[0];
  console.log(`sürüm ${s.id}  durum=${s.status}\n`);

  for (const l of SIKLAR) {
    const eski = s.options.find((o) => o.label === l);
    const yeni = String(q.siklar[l]);
    const dogruMu = l === q.dogru;
    if (eski?.isCorrect !== dogruMu)
      throw new Error(`${l}: doğru şık işareti uyuşmuyor (bankada ${eski?.isCorrect}, adayda ${dogruMu})`);
    console.log(`${l}${dogruMu ? ' ✓' : '  '} ${eski?.text === yeni ? '(aynı) ' : 'DEĞİŞİR'} "${eski?.text}" → "${yeni}"`);
  }
  console.log(`\naçıklama ${s.explanation === q.aciklama ? '(aynı)' : 'DEĞİŞİR'} — ${s.explanation?.length} → ${q.aciklama.length} krkt`);

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  const yeniHash = questionFingerprint(q.kok.trim(), SIKLAR.map((l) => String(q.siklar[l]).trim()));
  await prisma.$transaction(async (tx) => {
    for (const l of SIKLAR) {
      const o = s.options.find((x) => x.label === l)!;
      await tx.questionOption.update({ where: { id: o.id }, data: { text: String(q.siklar[l]) } });
    }
    await tx.questionVersion.update({
      where: { id: s.id }, data: { explanation: q.aciklama, contentHash: yeniHash },
    });
  });
  console.log(`\n✓ ${id} güncellendi · yeni contentHash ${yeniHash.slice(0, 12)}…`);
}
main().finally(() => prisma.$disconnect());
