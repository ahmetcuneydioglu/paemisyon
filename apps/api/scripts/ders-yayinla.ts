/**
 * Doc 57 — panel (B) gelene kadar yayın betiği: dersin en son sürümünü doğrulayıp yayınlar.
 *   npx tsx scripts/ders-yayinla.ts <ders-slug|--bolum <bölüm-slug>> [--geri]   (--geri: yayından al)
 * Yayın kararı insanındır: betik yalnız kullanıcı çalıştırınca işler, admin kimliğiyle denetim satırı yazmaz.
 */
import { PrismaClient } from '@prisma/client';
import { LessonsService } from '../src/modules/lessons/lessons.service';
import type { PrismaService } from '../src/infra/prisma/prisma.service';

const args = process.argv.slice(2);
const geri = args.includes('--geri');
const bolum = args.includes('--bolum') ? args[args.indexOf('--bolum') + 1] : null;
const slug = bolum ? null : args.find((a) => !a.startsWith('--'));
if (!slug && !bolum) {
  console.error('kullanım: ders-yayinla.ts <ders-slug> | --bolum <bölüm-slug> [--geri]');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });
const actor = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'script',
  roles: ['admin'],
  isPremium: true,
} as never;

(async () => {
  const svc = new LessonsService(prisma as unknown as PrismaService);
  const lessons = await prisma.lesson.findMany({
    where: bolum ? { section: { slug: bolum }, deletedAt: null } : { slug: slug! },
    select: { id: true, slug: true, status: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (lessons.length === 0) throw new Error('ders bulunamadı');
  for (const l of lessons) {
    try {
      const r = geri ? await svc.unpublish(actor, l.id) : await svc.publish(actor, l.id);
      console.log(
        `${l.slug}: ${geri ? 'yayından alındı' : `yayınlandı (sürüm ${(r as { version?: number }).version})`}`,
      );
    } catch (e) {
      console.log(`${l.slug}: ATLANDI — ${(e as Error).message.split('\n')[0]}`);
    }
  }
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
