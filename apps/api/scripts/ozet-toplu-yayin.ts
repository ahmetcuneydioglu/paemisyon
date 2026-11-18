/**
 * Doc 53 — İncelemedeki (in_review) bütün konu özeti ünitelerini TOPLU YAYINLA (kullanıcı kararı 18 Kas 2026).
 *
 *   cd apps/api && npx tsx scripts/ozet-toplu-yayin.ts [--admin <e-posta>] [--uygula]
 *
 * Paneldeki ünite "Yayınla" düğmesiyle (AdminSummariesService.publish) aynı kapı, ünite başına: eskimiş kart yok ∧
 * en az bir insan kartı var ∧ bütün kartlar betik doğrulamasını (`validateUnit`, canlı madde metni) geçiyor.
 * Geçemeyen ünite gerekçesiyle ATLANIR ve in_review'da kalır. Yayın: ünitenin arşivlenmemiş kartları ve ünite
 * `published` olur, `publishedAt` damgalanır; premium işaretine (Doc 53 karar 8) dokunulmaz, yalnız raporlanır.
 * Yayın kararının sahibi `--admin` ile verilen admin kullanıcıdır (tek `summary_unit.publish_many` denetim kaydı).
 * Varsayılan kuru çalıştırmadır; `--uygula` ile yazar. Sonra `unite-ilerleme-doldur.ts` çalıştırılır.
 * DB-yazma penceresi: connection_limit=1.
 */
import { PrismaClient, type SummaryBlockType } from '@prisma/client';
import {
  validateUnit,
  type SummaryBlockJson,
  type SummaryRow,
  type SummaryUnitJson,
} from '../src/modules/summaries/ozet-dogrulayici';
import { loadArticleMap } from '../src/modules/summaries/ozet-ice-aktar';

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const aIdx = args.indexOf('--admin');
const adminEmail = aIdx >= 0 ? args[aIdx + 1] : '';
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  try {
    // Yayın kararının sahibi: --admin <e-posta> ile verilen admin; verilmezse sistemdeki TEK admin.
    const adminler = await prisma.user.findMany({
      where: {
        roles: { some: { role: { key: 'admin' } } },
        ...(adminEmail ? { email: adminEmail } : {}),
      },
      select: { id: true, email: true },
    });
    if (adminler.length !== 1)
      throw new Error(`Admin tek değil (${adminler.length}); --admin <e-posta> ile belirt.`);
    const admin = adminler[0];

    const units = await prisma.summaryUnit.findMany({
      where: { status: 'in_review', deletedAt: null },
      orderBy: [{ topic: { course: { sortOrder: 'asc' } } }, { topicId: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        articleFrom: true,
        articleTo: true,
        articleNos: true,
        readingMinutes: true,
        sourceLabel: true,
        topicId: true,
        legislationId: true,
        isPremium: true,
        sortOrder: true,
        legislation: { select: { slug: true, name: true } },
        topic: { select: { name: true, course: { select: { name: true } } } },
        blocks: {
          where: { status: { not: 'archived' } },
          orderBy: { sortOrder: 'asc' },
          select: {
            type: true,
            title: true,
            body: true,
            rows: true,
            derivedNumbers: true,
            counterNumbers: true,
            generated: true,
            staleSince: true,
            articleRefs: { select: { lawArticle: { select: { articleNo: true } } } },
          },
        },
      },
    });
    console.log(`İncelemede ${units.length} ünite.`);

    const haritalar = new Map<string, Awaited<ReturnType<typeof loadArticleMap>>>();
    const gecen: { id: string; blocks: number }[] = [];
    const atlanan: { id: string; slug: string; reason: string }[] = [];
    let grup = '';
    for (const u of units) {
      const g = `${u.topic.course.name} › ${u.topic.name}`;
      if (g !== grup) {
        grup = g;
        console.log(`\n${g}`);
      }
      if (!haritalar.has(u.legislationId))
        haritalar.set(u.legislationId, await loadArticleMap(prisma, u.legislationId));
      const json: SummaryUnitJson = {
        unit: {
          slug: u.slug,
          legislationSlug: u.legislation.slug,
          topicId: u.topicId,
          title: u.title,
          subtitle: u.subtitle ?? undefined,
          articleFrom: u.articleFrom,
          articleTo: u.articleTo,
          articleNos: u.articleNos,
          readingMinutes: u.readingMinutes,
          sourceLabel: u.sourceLabel,
        },
        blocks: u.blocks.map((b) => ({
          type: b.type as SummaryBlockType,
          title: b.title ?? undefined,
          body: b.body ?? undefined,
          rows: (b.rows as SummaryRow[] | null) ?? undefined,
          derivedNumbers: (b.derivedNumbers as SummaryBlockJson['derivedNumbers']) ?? undefined,
          counterNumbers: b.counterNumbers,
          generated: b.generated,
          articleRefs: b.articleRefs.map((r) => r.lawArticle.articleNo),
        })),
      };
      const reasons: string[] = [];
      const stale = u.blocks.filter((b) => b.staleSince).length;
      if (stale) reasons.push(`${stale} eskimiş kart`);
      if (!u.blocks.some((b) => !b.generated)) reasons.push('yayınlanacak insan kartı yok');
      const v = validateUnit(json, haritalar.get(u.legislationId)!);
      if (!v.ok) reasons.push(`${v.fails} kusurlu kart`);
      const erisim = u.isPremium ? 'premium' : 'açık';
      if (reasons.length) {
        atlanan.push({ id: u.id, slug: u.slug, reason: reasons.join(' · ') });
        console.log(`  ATLA  #${u.sortOrder} ${u.slug} (${erisim}) — ${reasons.join(' · ')}`);
      } else {
        gecen.push({ id: u.id, blocks: u.blocks.length });
        console.log(`  ✓     #${u.sortOrder} ${u.slug} · ${u.blocks.length} kart (${erisim})`);
      }
    }

    console.log(`\nKapıdan geçen ${gecen.length} · atlanan ${atlanan.length}`);
    if (!uygula) {
      console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    const now = new Date();
    let yazilan = 0;
    for (const g of gecen) {
      const [, unit] = await prisma.$transaction([
        prisma.summaryBlock.updateMany({
          where: {
            unitId: g.id,
            status: { not: 'archived' },
            unit: { status: 'in_review', deletedAt: null },
          },
          data: { status: 'published' },
        }),
        prisma.summaryUnit.updateMany({
          where: { id: g.id, status: 'in_review', deletedAt: null },
          data: { status: 'published', publishedAt: now },
        }),
      ]);
      yazilan += unit.count;
    }
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'summary_unit.publish_many',
        entityType: 'summary_unit',
        entityId: null,
        detail: {
          via: 'scripts/ozet-toplu-yayin.ts',
          publishedCount: yazilan,
          published: gecen.map((g) => g.id),
          skipped: atlanan.map((a) => ({ id: a.id, slug: a.slug, reason: a.reason })),
        },
      },
    });
    console.log(`Yayınlandı: ${yazilan} ünite · atlanan ${atlanan.length} (in_review'da kaldı).`);
  } finally {
    await prisma.$disconnect();
  }
})();
