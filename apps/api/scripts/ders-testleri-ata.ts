/**
 * Doc 49/18 — ders testlerinin İLK DOLUMU (ve elle yeniden koşturma). Canlı DB'ye YAZAR:
 * dersin atanmamış yayındaki sorularını 20'şerlik testlere dağıtır. Kararlıdır — tekrar koşmak
 * mevcut testleri değiştirmez, yalnız yeni soruları ekler. Günlük cron (05:10 TR) aynı kodu koşar.
 *
 *   DATABASE_URL=... npx ts-node --transpile-only scripts/ders-testleri-ata.ts [--kuru]
 *
 * --kuru: yazmadan ders başına atanacak soru ve test sayısını gösterir.
 */
import { PrismaClient } from '@prisma/client';
import { CourseTestsService } from '../src/modules/course-tests/course-tests.service';
import { TEST_BOYU } from '../src/modules/course-tests/course-tests.logic';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });
const kuru = process.argv.includes('--kuru');

async function main() {
  const svc = new CourseTestsService(prisma as never);
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  let toplam = 0;
  for (const c of courses) {
    if (kuru) {
      const [atanmamis, testler] = await Promise.all([
        prisma.question.count({
          where: {
            deletedAt: null,
            currentVersionId: { not: null },
            currentVersion: { status: 'published' },
            pastExams: { none: { cancelled: true } },
            topic: { courseId: c.id, deletedAt: null },
            courseTest: null,
          },
        }),
        prisma.courseTest.count({ where: { courseId: c.id } }),
      ]);
      if (atanmamis > 0)
        console.log(
          `${c.name}: ${atanmamis} soru → ~${Math.ceil(atanmamis / TEST_BOYU)} test (mevcut ${testler})`,
        );
      toplam += atanmamis;
      continue;
    }
    const n = await svc.assignCourse(c.id);
    const testler = await prisma.courseTest.count({ where: { courseId: c.id } });
    if (n > 0) console.log(`${c.name}: ${n} soru atandı · ${testler} test`);
    toplam += n;
  }
  console.log(`${kuru ? 'KURU — yazılmadı. ' : ''}Toplam ${toplam} soru.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
