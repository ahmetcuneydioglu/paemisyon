/**
 * Bir derse yeni konu ekler (genel amaçlı).
 *   npx tsx scripts/konu-ekle.ts "<ders adı parçası>" "<konu adı>" [anahtar,kelime,...]
 *   APPLY=1 ... ile yazar
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const APPLY = process.env.APPLY === '1';
async function main() {
  const [dersAd, konuAd, kelimeler] = process.argv.slice(2);
  if (!dersAd || !konuAd) throw new Error('kullanım: konu-ekle.ts "<ders>" "<konu>" [kelimeler]');
  const ders = await p.course.findFirst({
    where: { name: { contains: dersAd }, deletedAt: null },
    select: { id: true, name: true, topics: { where: { deletedAt: null }, select: { name: true, sortOrder: true } } },
  });
  if (!ders) throw new Error(`ders bulunamadı: ${dersAd}`);
  const varOlan = ders.topics.find((t) => t.name === konuAd);
  console.log(`ders: ${ders.name}`);
  console.log(`konu: ${konuAd} ${varOlan ? '→ ZATEN VAR' : '→ yeni'}`);
  if (varOlan || !APPLY) { if (!APPLY) console.log('\n(APPLY=1 ile yazılır)'); return; }
  const t = await p.topic.create({
    data: {
      courseId: ders.id, name: konuAd,
      sortOrder: Math.max(0, ...ders.topics.map((x) => x.sortOrder)) + 1,
      matchKeywords: kelimeler ? kelimeler.split(',').map((s) => s.trim()).filter(Boolean) : [],
    },
    select: { id: true },
  });
  console.log(`✓ oluşturuldu — ${t.id}`);
}
main().finally(() => p.$disconnect());
