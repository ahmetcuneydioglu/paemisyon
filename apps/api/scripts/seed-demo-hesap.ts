/**
 * App Review demo hesabı için vitrin verisi (lansman öncesi).
 *
 * Amaç: Apple inceleyicisi hesaba girdiğinde hiçbir ekran BOŞ olmasın —
 * favoriler, kaydedilen maddeler, işaretleme ve not özellikleri görünsün.
 *
 * KURAL: Hesap ÜCRETSİZ katmanda kalır. Premium açık olursa inceleyici
 * paywall'a ulaşamaz ve satın alma akışını test edemez (2.1 ret sebebi).
 *
 * Var olan kayda dokunmaz (upsert/skipDuplicates) — tekrar çalıştırılabilir.
 * Kullanım: EMAIL=... npx tsx scripts/seed-demo-hesap.ts   (APPLY=1 ile yazar)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Vitrinde iyi duran, gerçek metinli maddeler (yoksa sessizce atlanır). */
const ARTICLES: { law: string; no: string }[] = [
  { law: 'cmk', no: '90' }, // yakalama
  { law: 'cmk', no: '91' }, // gözaltı
  { law: 'pvsk', no: '16' }, // zor kullanma
  { law: 'tck', no: '86' }, // kasten yaralama
  { law: 'anayasa', no: '20' }, // özel hayatın gizliliği
];

const NOTES: Record<string, string> = {
  '90': 'Herkes tarafından yakalama ≠ kolluk yakalaması. Suçüstü + kaçma/kimlik belirlenememesi şartlarını karıştırma.',
  '16': 'Zor kullanma kademeli: direnmenin derecesine göre ARTAN ölçüde. Sınavda "orantılılık" vurgusu çıkıyor.',
};

async function main() {
  const email = process.env.EMAIL ?? 'neilonlukas@gmail.com';
  const apply = process.env.APPLY === '1';

  const user = await prisma.user.findFirst({
    where: { email },
    include: { entitlement: true },
  });
  if (!user) throw new Error(`Hesap bulunamadı: ${email}`);
  if (user.entitlement?.isPremium) {
    console.log('⚠ UYARI: hesap PREMIUM. İnceleyici satın alma akışını test edemez.');
  }

  // ── 1) Favori sorular: farklı konulardan, yayında olanlardan ──
  const existingMarks = await prisma.bookmark.count({ where: { userId: user.id } });
  const candidates = await prisma.question.findMany({
    where: { deletedAt: null, currentVersionId: { not: null }, topic: { isPremium: false } },
    select: { id: true, topicId: true },
    take: 400,
  });
  const perTopic = new Map<string, string>();
  for (const q of candidates) {
    if (!perTopic.has(q.topicId)) perTopic.set(q.topicId, q.id);
    if (perTopic.size >= 8) break;
  }
  const favIds = [...perTopic.values()];

  // ── 2) Mevzuat: kaydedilen madde + işaretleme + not ──
  const targets: { id: string; no: string; text: string }[] = [];
  for (const a of ARTICLES) {
    const row = await prisma.lawArticle.findFirst({
      where: {
        articleNo: a.no,
        status: 'published',
        deletedAt: null,
        legislation: { slug: { contains: a.law } },
      },
      select: { id: true, articleNo: true, text: true },
    });
    if (row) targets.push({ id: row.id, no: row.articleNo, text: row.text });
  }

  console.log(`hesap        : ${email} (premium: ${user.entitlement?.isPremium ?? false})`);
  console.log(`favori       : ${existingMarks} var → +${favIds.length}`);
  console.log(`madde        : ${targets.length} adet (kaydet + işaretle)`);
  console.log(`not          : ${targets.filter((t) => NOTES[t.no]).length} adet`);

  if (!apply) {
    console.log('\n(dry-run — APPLY=1 ile yaz)');
    await prisma.$disconnect();
    return;
  }

  await prisma.bookmark.createMany({
    data: favIds.map((questionId) => ({ userId: user.id, questionId })),
    skipDuplicates: true,
  });

  for (const t of targets) {
    await prisma.articleBookmark.upsert({
      where: { userId_lawArticleId: { userId: user.id, lawArticleId: t.id } },
      update: {},
      create: { userId: user.id, lawArticleId: t.id },
    });

    // İşaretleme çapası HAM metne göre hesaplanmalı: okuyucu
    // `text.substring(start, end) === snippet` doğrulaması yapar. Metni
    // normalize edip (boşluk sıkıştırma) offset üretmek işaretlemeyi
    // görünmez kılar — snippet ham metinde hiç bulunamaz.
    const raw = t.text;
    const dot = raw.indexOf('.', 60);
    const end = Math.min(raw.length, dot > 0 ? dot + 1 : 140);
    const snippet = raw.slice(0, end);
    const already = await prisma.articleHighlight.findFirst({
      where: { userId: user.id, lawArticleId: t.id },
    });
    if (!already && snippet.length > 20) {
      await prisma.articleHighlight.create({
        data: {
          userId: user.id,
          lawArticleId: t.id,
          startOffset: 0,
          endOffset: snippet.length,
          snippet,
        },
      });
    }

    const note = NOTES[t.no];
    if (note) {
      await prisma.articleNote.upsert({
        where: { userId_lawArticleId: { userId: user.id, lawArticleId: t.id } },
        update: { text: note },
        create: { userId: user.id, lawArticleId: t.id, text: note },
      });
    }
  }

  const [fav, ab, ah, an] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.articleBookmark.count({ where: { userId: user.id } }),
    prisma.articleHighlight.count({ where: { userId: user.id } }),
    prisma.articleNote.count({ where: { userId: user.id } }),
  ]);
  console.log(`\nYAZILDI → favori ${fav} · kaydedilen madde ${ab} · işaretleme ${ah} · not ${an}`);
  await prisma.$disconnect();
}
main();
