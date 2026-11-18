/**
 * Doc 53/07 — Ünitelerin BETİK ÜRETİMİ kartlarını ("Sınav der ki", "Bu üniteden soru çöz") ve okuma süresini
 * yerinde tazele; yayın durumu, insan kartları ve okuma ilerlemesi korunur (kullanıcı talebi 18 Kas 2026).
 *
 *   cd apps/api && npx tsx scripts/ozet-yayindaki-tazele.ts [--slug <ünite>] [--admin <e-posta>] [--uygula]
 *
 * Neden: istatistik kartı içe aktarma anında doldurulur; sonradan yayımlanan sorular ve madde bağı (S1-B)
 * tamamlaması kartı bayatlatır. `ozet-yukle --replace` bunun için fazladır (üniteyi incelemeye çeker).
 * Okuma süresi: modelin tahmini yerine metinden (`readingMinutesOf`, 180 kelime/dk).
 *
 * Ünite başına: veritabanındaki kartlardan ünite JSON'u kurulur, `collectExamStats` + `fillGeneratedBlocks`
 * (ozet-dogrula ile aynı kod) çalışır; yalnız `generated` kartların `rows` alanı ve ünitenin `readingMinutes`
 * alanı değişir. İnsan kartına, duruma, premium işaretine dokunulmaz. Tek `summary_unit.refresh_generated`
 * denetim kaydı düşer. Varsayılan kuru çalıştırmadır; `--uygula` ile yazar. DB-yazma penceresi: connection_limit=1.
 */
import { Prisma, PrismaClient, type SummaryBlockType } from '@prisma/client';
import {
  fillGeneratedBlocks,
  readingMinutesOf,
  unitArticleNos,
  type SummaryBlockJson,
  type SummaryRow,
  type SummaryUnitJson,
} from '../src/modules/summaries/ozet-dogrulayici';
import { collectExamStats, loadArticleMap } from '../src/modules/summaries/ozet-ice-aktar';
import { canonicalJson } from '../src/modules/lessons/canonical-json';

const args = process.argv.slice(2);
const uygula = args.includes('--uygula');
const arg = (k: string) => (args.indexOf(k) >= 0 ? args[args.indexOf(k) + 1] : '');
const slug = arg('--slug');
const adminEmail = arg('--admin');
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

const toplamOf = (rows: unknown): string => String((rows as SummaryRow[] | null)?.[0]?.value ?? '—');

(async () => {
  try {
    const adminler = await prisma.user.findMany({
      where: { roles: { some: { role: { key: 'admin' } } }, ...(adminEmail ? { email: adminEmail } : {}) },
      select: { id: true, email: true },
    });
    if (adminler.length !== 1) throw new Error(`Admin tek değil (${adminler.length}); --admin <e-posta> ile belirt.`);
    const admin = adminler[0];

    const units = await prisma.summaryUnit.findMany({
      where: { deletedAt: null, ...(slug ? { slug } : {}) },
      orderBy: [{ topic: { course: { sortOrder: 'asc' } } }, { legislationId: 'asc' }, { sortOrder: 'asc' }],
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
        legislation: { select: { slug: true } },
        blocks: {
          where: { status: { not: 'archived' } },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            rows: true,
            derivedNumbers: true,
            counterNumbers: true,
            generated: true,
            articleRefs: { select: { lawArticle: { select: { articleNo: true } } } },
          },
        },
      },
    });
    if (slug && units.length === 0) throw new Error(`ünite yok: ${slug}`);

    const haritalar = new Map<string, Awaited<ReturnType<typeof loadArticleMap>>>();
    type Plan = { unitId: string; slug: string; minutes: number; blocks: { id: string; rows: SummaryRow[] }[] };
    const planlar: Plan[] = [];
    for (const u of units) {
      if (!haritalar.has(u.legislationId)) haritalar.set(u.legislationId, await loadArticleMap(prisma, u.legislationId));
      const byNo = haritalar.get(u.legislationId)!;
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
      const stats = await collectExamStats(prisma, byNo, unitArticleNos(json));
      fillGeneratedBlocks(json, stats);
      const minutes = readingMinutesOf(json);

      const degisen: { id: string; rows: SummaryRow[] }[] = [];
      const notlar: string[] = [];
      json.blocks.forEach((b, i) => {
        const db = u.blocks[i];
        if (!b.generated || !db) return;
        if (canonicalJson(b.rows ?? []) === canonicalJson(db.rows ?? [])) return; // jsonb anahtar sırasını korumaz
        degisen.push({ id: db.id, rows: b.rows ?? [] });
        notlar.push(b.type === 'exam_stats' ? `istatistik ${toplamOf(db.rows)} → ${toplamOf(b.rows)}` : 'köprü');
      });
      if (minutes !== u.readingMinutes) notlar.push(`okuma ${u.readingMinutes} → ${minutes} dk`);
      if (!notlar.length) continue;
      planlar.push({ unitId: u.id, slug: u.slug, minutes, blocks: degisen });
      console.log(`  ${u.slug}: ${notlar.join(' · ')}`);
    }

    console.log(`\n${units.length} ünite tarandı · değişecek ${planlar.length}`);
    if (!uygula || planlar.length === 0) {
      if (!uygula) console.log('Kuru çalıştırma; yazmak için --uygula.');
      return;
    }
    for (const pl of planlar) {
      await prisma.$transaction([
        ...pl.blocks.map((b) =>
          prisma.summaryBlock.update({
            where: { id: b.id },
            data: { rows: b.rows as unknown as Prisma.InputJsonValue },
          }),
        ),
        prisma.summaryUnit.update({ where: { id: pl.unitId }, data: { readingMinutes: pl.minutes } }),
      ]);
    }
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'summary_unit.refresh_generated',
        entityType: 'summary_unit',
        entityId: null,
        detail: {
          via: 'scripts/ozet-yayindaki-tazele.ts',
          units: planlar.map((p) => ({ id: p.unitId, slug: p.slug, blocks: p.blocks.length, readingMinutes: p.minutes })),
        },
      },
    });
    console.log(`Yazıldı: ${planlar.length} ünite.`);
  } finally {
    await prisma.$disconnect();
  }
})();
