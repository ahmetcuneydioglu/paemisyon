/**
 * Yayındaki sürümle gövdesi birebir aynı olan, sonradan açılmış boş ders sürümlerini siler.
 * Köken: bölüm topluca yeniden içe aktarılınca metni değişmeyen derslere de sürüm açılıyordu
 * (panelde "yeni sürüm bekliyor"). İçe aktarma artık bunu yapmıyor; bu betik eski kayıtları temizler.
 *
 *   npx tsx -r dotenv/config scripts/ders-bos-surum-temizle.ts            → kuru çalışma
 *   npx tsx -r dotenv/config scripts/ders-bos-surum-temizle.ts --confirm  → siler
 *
 * Yalnız en üstteki sürümleri siler ve gövdesi farklı ilk sürümde durur: gerçek bekleyen
 * değişikliğe dokunmaz.
 */
import { PrismaClient } from '@prisma/client';
import { canonicalJson } from '../src/modules/lessons/canonical-json';

const u = new URL(process.env.DATABASE_URL!);
u.searchParams.set('connection_limit', '1');
const prisma = new PrismaClient({ datasources: { db: { url: u.toString() } } });
const YAZ = process.argv.includes('--confirm');

(async () => {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      slug: true,
      version: true,
      section: { select: { slug: true } },
      versions: { select: { id: true, versionNo: true, body: true }, orderBy: { versionNo: 'desc' } },
    },
    orderBy: [{ sectionId: 'asc' }, { sortOrder: 'asc' }],
  });
  const silinecek: string[] = [];
  let gercekBekleyen = 0;
  for (const l of lessons) {
    const yayindaki = l.versions.find((v) => v.versionNo === l.version);
    if (!yayindaki) continue;
    const olcut = canonicalJson(yayindaki.body);
    for (const v of l.versions) {
      if (v.versionNo <= l.version) break;
      if (canonicalJson(v.body) !== olcut) {
        gercekBekleyen++;
        console.log(`  DOKUNULMADI ${l.section.slug}/${l.slug}: v${v.versionNo} gövdesi farklı (gerçek bekleyen sürüm)`);
        break;
      }
      silinecek.push(v.id);
      console.log(`  ${l.section.slug}/${l.slug}: v${v.versionNo} = yayındaki v${l.version}, silinecek`);
    }
  }
  console.log(`\n${silinecek.length} boş sürüm · ${gercekBekleyen} gerçek bekleyen sürüm`);
  if (!YAZ) console.log('Kuru çalışma. Silmek için --confirm ekle.');
  else if (silinecek.length) {
    const r = await prisma.lessonVersion.deleteMany({ where: { id: { in: silinecek } } });
    console.log(`Silindi: ${r.count} sürüm.`);
  }
  await prisma.$disconnect();
})();
