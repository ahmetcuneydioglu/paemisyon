/**
 * Doc 57 — ders içe aktarma: bölüm dizinindeki markdown dersleri → doğrula → in_review yaz (var olana yeni sürüm).
 *
 *   cd apps/api && npx tsx scripts/ders-ice-aktar.ts <bölüm-dizini> [--kuru]
 *
 * Bölüm dizininde `bolum.json` bulunur:
 *   { "slug", "title", "subtitle"?, "courseId"?, "courseName"?, "topicId"?, "sortOrder"?, "isPremium"?,
 *     "book": { "label": "THEMIS Anayasa Hukuku, 24. baskı, 2020", "page": "s.22–23" },
 *     "lessons": [ { "file": "03-yazili-yazisiz.md", "slug": "yazili-yazisiz-anayasa", "articles"?: ["t-c-anayasasi:4"] } ] }
 * Kitap künyesi panelde kalır (isPublic=false); URL'ler markdown notlarından, madde kaynakları `articles`tan gelir.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseLessonMarkdown } from '../src/modules/lessons/ders-markdown';
import { LessonsService, type LessonImportInput } from '../src/modules/lessons/lessons.service';
import type { PrismaService } from '../src/infra/prisma/prisma.service';

const [dir, ...flags] = process.argv.slice(2);
if (!dir) {
  console.error('kullanım: ders-ice-aktar.ts <bölüm-dizini> [--kuru]');
  process.exit(2);
}
const KURU = flags.includes('--kuru');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

interface Bolum {
  slug: string;
  title: string;
  subtitle?: string;
  courseId?: string;
  courseName?: string;
  topicId?: string;
  sortOrder?: number;
  isPremium?: boolean;
  book: { label: string; page?: string };
  lessons: { file: string; slug: string; articles?: string[]; page?: string }[];
}

(async () => {
  const b = JSON.parse(readFileSync(join(dir, 'bolum.json'), 'utf8')) as Bolum;
  const course = b.courseId
    ? await prisma.course.findUnique({
        where: { id: b.courseId },
        select: { id: true, name: true },
      })
    : await prisma.course.findFirst({
        where: { name: b.courseName, deletedAt: null },
        select: { id: true, name: true },
      });
  if (!course) throw new Error(`ders bulunamadı: ${b.courseId ?? b.courseName}`);
  const svc = new LessonsService(prisma as unknown as PrismaService);
  let yazilan = 0,
    kusurlu = 0;
  for (const [i, l] of b.lessons.entries()) {
    const parsed = parseLessonMarkdown(readFileSync(join(dir, l.file), 'utf8'));
    const page = l.page ?? b.book.page;
    const input: LessonImportInput = {
      section: {
        slug: b.slug,
        title: b.title,
        subtitle: b.subtitle,
        courseId: course.id,
        topicId: b.topicId,
        sortOrder: b.sortOrder ?? 0,
        isPremium: b.isPremium ?? false,
      },
      slug: l.slug,
      title: parsed.title,
      goal: parsed.goal,
      sortOrder: i + 1,
      body: parsed.body,
      sources: [
        { kind: 'book', label: b.book.label, page, isPublic: false },
        ...(l.articles ?? []).map(
          (ref) =>
            ({
              kind: 'article' as const,
              label: ref,
              ref,
              isPublic: true,
            }) as LessonImportInput['sources'][number],
        ),
        ...parsed.urlSources.map((u) => ({
          kind: 'url' as const,
          label: u.label,
          url: u.url,
          isPublic: true,
        })),
      ],
      reviewNote: parsed.reviewNotes.join('\n'),
      sourceLabel: `${b.book.label} ${page ?? ''}`.trim(),
      links: b.topicId ? [{ kind: 'topic', targetId: b.topicId }] : [],
    };
    const v = await svc.validateForImport(input);
    console.log(`\n[${l.slug}] ${parsed.title}`);
    for (const line of v.lines) console.log(`  ${line}`);
    if (!v.ok) {
      kusurlu++;
      continue;
    }
    if (KURU) continue;
    const r = await svc.importLesson(input, null);
    console.log(
      `  → yazıldı: sürüm ${r.versionNo}${r.replaced ? ' (yeni sürüm)' : ''}${r.pendingVersion ? ' · yayındaki sürüm değişmedi' : ''}`,
    );
    yazilan++;
  }
  console.log(`\n${yazilan} ders yazıldı · ${kusurlu} kusurlu${KURU ? ' (kuru çalışma)' : ''}`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
