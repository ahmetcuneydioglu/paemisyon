/**
 * Doc 49 S1-B — `Question.articleNo` etiketinden `question_articles` N:N'i doldurur.
 *
 * Eşleşme: soru.topicId + ayrıştırılmış madde no → `law_articles(topic_id, article_no)`.
 * Ayrıştırma kuralı `src/common/madde-no.ts`'te (liste → primary+related, fıkra eki
 * düşer, aralık bağlanmaz). Hiçbir satır SİLİNMEZ; yazım `createMany skipDuplicates`
 * ile idempotenttir — editörün elle kurduğu bağ ezilmez.
 *
 *   npx tsx scripts/s1-question-article-backfill.ts            (kuru çalışma — rapor)
 *   APPLY=1 npx tsx scripts/s1-question-article-backfill.ts    (yazar)
 *
 * Rapor: docs/49-yeniden-tasarim/s1b-soru-madde-raporu.json (kuru ve gerçek koşuda).
 * CLAUDE.md: tek bağlantı (connection_limit=1), backend durdurulmadan, 500'lük partiler.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, QuestionArticleRelation } from '@prisma/client';
import { maddeNoAyristir } from '../src/common/madde-no';

const APPLY = process.env.APPLY === '1';
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

type Bag = { questionId: string; lawArticleId: string; relation: QuestionArticleRelation };
type Kusur = {
  neden: 'konuda_madde_yok' | 'madde_bulunamadi' | 'aralik' | 'bos';
  topic: string;
  articleNo: string;
  questionId: string;
  status: string | null;
  eksik?: string[];
};

async function main() {
  const sorular = await prisma.question.findMany({
    where: { deletedAt: null, articleNo: { not: null } },
    select: {
      id: true,
      topicId: true,
      articleNo: true,
      topic: { select: { name: true } },
      currentVersion: { select: { status: true } },
    },
  });
  const maddeler = await prisma.lawArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, topicId: true, articleNo: true },
  });
  const maddeAnahtar = new Map<string, string>(); // `${topicId}\u0000${articleNo}` → id
  const konudaMadde = new Set<string>();
  for (const m of maddeler) {
    maddeAnahtar.set(`${m.topicId}\u0000${m.articleNo}`, m.id);
    konudaMadde.add(m.topicId);
  }

  const baglar: Bag[] = [];
  const kusurlar: Kusur[] = [];
  const sayac = { tek: 0, liste: 0, fikraDustu: 0, primary: 0, related: 0 };
  const statusSayac = new Map<string, number>();

  for (const q of sorular) {
    const st = q.currentVersion?.status ?? null;
    statusSayac.set(st ?? 'versiyonsuz', (statusSayac.get(st ?? 'versiyonsuz') ?? 0) + 1);
    const temel = { topic: q.topic.name, articleNo: q.articleNo!, questionId: q.id, status: st };
    if (!konudaMadde.has(q.topicId)) {
      kusurlar.push({ neden: 'konuda_madde_yok', ...temel });
      continue;
    }
    const a = maddeNoAyristir(q.articleNo);
    if (a.tur === 'bos') {
      kusurlar.push({ neden: 'bos', ...temel });
      continue;
    }
    if (a.tur === 'aralik') {
      kusurlar.push({ neden: 'aralik', ...temel });
      continue;
    }
    const adaylar: { no: string; relation: QuestionArticleRelation }[] = [
      { no: a.primary!, relation: 'primary' },
      ...a.related.map((no) => ({ no, relation: 'related' as const })),
    ];
    const eksik: string[] = [];
    const bulunan: Bag[] = [];
    for (const c of adaylar) {
      const id = maddeAnahtar.get(`${q.topicId}\u0000${c.no}`);
      if (id) bulunan.push({ questionId: q.id, lawArticleId: id, relation: c.relation });
      else eksik.push(c.no);
    }
    // Dayanak (primary) bulunamadıysa soru rapora düşer; yan dayanaklar tek başına yazılmaz.
    if (!bulunan.some((b) => b.relation === 'primary')) {
      kusurlar.push({ neden: 'madde_bulunamadi', ...temel, eksik });
      continue;
    }
    baglar.push(...bulunan);
    sayac[a.tur] += 1;
    if (a.fikraDustu) sayac.fikraDustu += 1;
    for (const b of bulunan) sayac[b.relation] += 1;
    if (eksik.length) kusurlar.push({ neden: 'madde_bulunamadi', ...temel, eksik });
  }

  let yazilan = 0;
  if (APPLY) {
    for (let i = 0; i < baglar.length; i += 500) {
      const r = await prisma.questionArticle.createMany({
        data: baglar.slice(i, i + 500).map((b) => ({ ...b, source: 'legacy_article_no' })),
        skipDuplicates: true,
      });
      yazilan += r.count;
    }
  }
  // Kuru çalışma migration'dan ÖNCE de koşabilsin: tablo yoksa (P2021) sayım null.
  const toplamBag = await prisma.questionArticle.count().catch((e: { code?: string }) => {
    if (e.code === 'P2021') return null;
    throw e;
  });

  const ozet = {
    tarih: new Date().toISOString(),
    mod: APPLY ? 'APPLY' : 'dry-run',
    etiketliSoru: sorular.length,
    soruDurumu: Object.fromEntries(statusSayac),
    baglananSoru: sayac.tek + sayac.liste,
    bag: { toplam: baglar.length, primary: sayac.primary, related: sayac.related },
    tekMadde: sayac.tek,
    listeMadde: sayac.liste,
    fikraEkiDusen: sayac.fikraDustu,
    kusur: {
      toplam: kusurlar.length,
      nedenlere: Object.fromEntries(
        ['konuda_madde_yok', 'madde_bulunamadi', 'aralik', 'bos'].map((n) => [
          n,
          kusurlar.filter((k) => k.neden === n).length,
        ]),
      ),
    },
    yazilan,
    tablodaToplam: toplamBag ?? 'tablo henüz yok',
  };
  const yol = resolve(__dirname, '../../../docs/49-yeniden-tasarim/s1b-soru-madde-raporu.json');
  writeFileSync(yol, JSON.stringify({ ozet, kusurlar }, null, 2) + '\n');
  console.log(JSON.stringify(ozet, null, 2));
  console.log(`rapor: ${yol}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
