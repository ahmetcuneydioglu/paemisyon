/**
 * Eski "Paem 10 Deneme Sınavı-1/2/3" takvimli denemelerini ARŞİVLER (status=archived; veri ve
 * oturumlar kalır, listelerden düşer). Kullanıcı kararı 3 Kas 2026. Çalıştırma: --confirm ile.
 */
import { PrismaClient } from '@prisma/client';
const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
async function main() {
  const targets = await prisma.exam.findMany({ where: { publishMode: 'takvimli', status: 'published', title: { startsWith: 'Paem 10 Deneme' } }, select: { id: true, title: true, startAt: true } });
  console.log('Arşivlenecek:', targets.map((t) => `${t.title} (${t.startAt.toISOString().slice(0, 10)})`));
  if (!process.argv.includes('--confirm')) { console.log('Prova; --confirm ile uygular.'); return; }
  const r = await prisma.exam.updateMany({ where: { id: { in: targets.map((t) => t.id) } }, data: { status: 'archived' } });
  console.log('Arşivlendi:', r.count);
}
main().finally(() => prisma.$disconnect());
