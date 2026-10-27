/**
 * Doc 54 §5 — üretim girdisi: bir kanunun seçili maddeleri için madde metni (değişiklik şerhleriyle),
 * komşu maddelerin başlıkları, aynı kanunda atıf verilen maddelerin metinleri ve o maddeden çıkmış
 * soruların kök/şıkları (✓/✗). KAYNAK ETİKETİ girdiye KONMAZ (4 Eyl 2026 kuralı).
 *
 *   cd apps/api && npx tsx scripts/madde-ozeti-girdi.ts <lawSlug> "<no,no,...>|tumu" <cikti.json>
 *   örn: npx tsx scripts/madde-ozeti-girdi.ts 2559-sayili-polis-vazife-ve-salahiyet-kanunu-pvsk "1,2,4,4/A,5" /tmp/pvsk-p1.json
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { isRepealedText } from '../src/modules/summaries/madde-ozeti-dogrulayici';

const [lawSlug, secim, out] = process.argv.slice(2);
if (!lawSlug || !secim || !out) {
  console.error('kullanım: madde-ozeti-girdi.ts <lawSlug> "<no,...>|tumu" <cikti.json>');
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

export interface MaddeGirdi {
  law: {
    slug: string;
    name: string;
    number: string | null;
    topicId: string | null;
    officialSourceUrl: string | null;
  };
  verifiedAt: string;
  articles: {
    no: string;
    title: string | null;
    text: string;
    repealed: boolean;
    neighbors: { no: string; title: string | null }[];
    questions: { stem: string; options: { text: string; isCorrect: boolean }[] }[];
  }[];
  /** Aynı kanunda atıf verilen maddelerin metinleri (no → metin); modele bağlam olarak gider. */
  referenced: Record<string, string>;
}

(async () => {
  const leg = await prisma.legislation.findFirst({
    where: { slug: lawSlug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      number: true,
      topicId: true,
      officialSourceUrl: true,
    },
  });
  if (!leg) {
    console.error('mevzuat yok:', lawSlug);
    process.exit(2);
  }
  const all = await prisma.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null },
    orderBy: { sortKey: 'asc' },
    select: { id: true, articleNo: true, title: true, text: true, lastVerifiedAt: true },
  });
  const secili =
    secim === 'tumu'
      ? all
      : all.filter((a) =>
          secim
            .split(',')
            .map((x) => x.trim())
            .includes(a.articleNo),
        );
  const idx = new Map(all.map((a, i) => [a.articleNo, i]));
  const referenced: Record<string, string> = {};
  const articles: MaddeGirdi['articles'] = [];
  for (const a of secili) {
    const i = idx.get(a.articleNo)!;
    const neighbors = [all[i - 1], all[i + 1]]
      .filter(Boolean)
      .map((n) => ({ no: n!.articleNo, title: n!.title }));
    for (const m of a.text.matchAll(
      /\b(\d{1,2}(?:\/[A-Z])?)\s*(?:nci|ncı|ncu|ncü|inci|ıncı|uncu|üncü)\s+madde/gi,
    )) {
      const no = m[1];
      const r = all.find((x) => x.articleNo === no);
      if (r && no !== a.articleNo) referenced[no] = r.text;
    }
    const qs = leg.topicId
      ? await prisma.question.findMany({
          where: {
            topicId: leg.topicId,
            articleNo: a.articleNo,
            deletedAt: null,
            currentVersion: { status: 'published' },
          },
          select: {
            currentVersion: {
              select: {
                stem: true,
                options: { orderBy: { sortOrder: 'asc' }, select: { text: true, isCorrect: true } },
              },
            },
          },
        })
      : [];
    articles.push({
      no: a.articleNo,
      title: a.title,
      text: a.text,
      repealed: isRepealedText(a.text),
      neighbors,
      questions: qs
        .filter((q) => q.currentVersion)
        .map((q) => ({ stem: q.currentVersion!.stem, options: q.currentVersion!.options })),
    });
  }
  const girdi: MaddeGirdi = {
    law: leg,
    verifiedAt: new Date().toISOString().slice(0, 10),
    articles,
    referenced,
  };
  writeFileSync(out, JSON.stringify(girdi, null, 1));
  console.log(
    `${leg.name}: ${articles.length} madde (${articles.filter((a) => a.repealed).length} mülga), ${articles.reduce((s, a) => s + a.questions.length, 0)} soru, ${Object.keys(referenced).length} atıf maddesi → ${out}`,
  );
  await prisma.$disconnect();
})();
