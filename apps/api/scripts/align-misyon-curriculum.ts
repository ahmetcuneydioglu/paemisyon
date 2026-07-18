/**
 * Misyon müfredatını PAEM'in ortak dersleri + Misyon'a özel dersler olacak
 * şekilde hizalar. IDEMPOTENT ve silme yapmaz.
 *
 * Bağlantılar:
 *  - Polisi İlgilendiren Mevzuat: Polis Mevzuatı + CMK + TCK
 *  - Güncel ve Kültürel Konular: Genel Kültür + Güncel Konular
 *
 * Varsayılan salt-okunur kontrol: npx ts-node scripts/align-misyon-curriculum.ts
 * Uygulama: npx ts-node scripts/align-misyon-curriculum.ts --apply
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error('DATABASE_URL tanımlı değil.');

const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });
const apply = process.argv.includes('--apply');

const TARGETS = [
  {
    sectionName: 'Polisi İlgilendiren Mevzuat',
    courseNames: ['Polis Mevzuatı', 'Ceza Muhakemesi Hukuku', 'Ceza Hukuku'],
  },
  {
    sectionName: 'Güncel ve Kültürel Konular',
    courseNames: ['Genel Kültür ve Analitik Düşünme', 'Güncel ve Kültürel Konular'],
  },
] as const;

async function main() {
  const misyon = await prisma.examType.findUnique({ where: { key: 'misyon' } });
  if (!misyon) throw new Error('Misyon sınav türü bulunamadı.');

  const changes: { sectionId: string; sectionName: string; courseId: string; courseName: string; sortOrder: number }[] = [];

  for (const target of TARGETS) {
    const section = await prisma.examSection.findFirst({
      where: { examTypeId: misyon.id, name: target.sectionName, deletedAt: null },
      include: { courses: { select: { courseId: true } } },
    });
    if (!section) throw new Error(`Misyon bölümü bulunamadı: ${target.sectionName}`);

    const courses = await prisma.course.findMany({
      where: { name: { in: [...target.courseNames] }, deletedAt: null },
      select: { id: true, name: true },
    });
    const courseByName = new Map(courses.map((course) => [course.name, course]));

    for (let index = 0; index < target.courseNames.length; index++) {
      const courseName = target.courseNames[index];
      const course = courseByName.get(courseName);
      if (!course) throw new Error(`Aktif ders bulunamadı: ${courseName}`);

      changes.push({
        sectionId: section.id,
        sectionName: section.name,
        courseId: course.id,
        courseName: course.name,
        sortOrder: index + 1,
      });
    }
  }

  if (!apply) {
    console.log('Salt-okunur kontrol. Değişikliği uygulamak için --apply kullan.');
  } else {
    await prisma.$transaction(
      changes.map((change) =>
        prisma.examSectionCourse.upsert({
          where: {
            sectionId_courseId: {
              sectionId: change.sectionId,
              courseId: change.courseId,
            },
          },
          update: { sortOrder: change.sortOrder },
          create: {
            sectionId: change.sectionId,
            courseId: change.courseId,
            sortOrder: change.sortOrder,
          },
        }),
      ),
    );
  }

  const curriculum = await prisma.examSection.findMany({
    where: { examTypeId: misyon.id, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      name: true,
      weightPercent: true,
      courses: {
        orderBy: { sortOrder: 'asc' },
        select: {
          course: {
            select: {
              name: true,
              topics: { where: { deletedAt: null }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  console.log(`\nMisyon müfredatı (${apply ? 'uygulandı' : 'mevcut durum'}):`);
  for (const section of curriculum) {
    const courses = section.courses
      .map(({ course }) => `${course.name} [${course.topics.length} konu]`)
      .join(', ');
    console.log(`- ${section.name} (%${section.weightPercent}): ${courses || 'ders yok'}`);
  }

  const totalWeight = curriculum.reduce((sum, section) => sum + section.weightPercent, 0);
  if (totalWeight !== 100) throw new Error(`Misyon ağırlık toplamı %${totalWeight}; %100 olmalı.`);
  console.log(`\nAğırlık toplamı: %${totalWeight} ✓`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
