/**
 * Doc 56 — Uluslararası belgeden (antlasma-ekle.ts) kart üretim girdisi: seçilen maddeler + dersin genel
 * konusundaki soruların düzenli ifadeyle süzülmüş kökleri.
 *
 *   cd apps/api && npx tsx scripts/antlasma-girdi.ts <legislationSlug> (--articles "Başlangıç,1,2" | --all) <cikti.json>
 *        --konu <soruların durduğu konu id> [--sorular "<regex>"] [--en-cok 60] [--haric "23,27"]
 *
 * `ozet-girdi.ts`'ten farkı: (1) taslak (draft) maddeleri de okur — antlaşma metni önce taslak girer, kartlar
 * incelenirken yayımlanır; (2) sorular maddeye etiketli değildir (dersin genel konusunda durur), bu yüzden
 * `kaynak-girdi.ts`'teki gibi `--sorular` deseniyle süzülür. Sorular yalnız "ne soruluyor" bilgisidir.
 * `--haric`: sonradan değişmiş (nüshadaki metni eskimiş) maddeler girdiye alınmaz; kart eskimiş sayı öğretmesin.
 * KAYNAK ETİKETİ girdiye KONMAZ (4 Eyl 2026 kuralı).
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const argv = process.argv.slice(2);
const al = (ad: string) => {
  const i = argv.indexOf(ad);
  return i >= 0 ? argv.splice(i, 2)[1] : undefined;
};
const liste = al('--articles');
const konuId = al('--konu');
const soruDesen = al('--sorular');
const enCok = Number(al('--en-cok') ?? 60);
const haric = (al('--haric') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const allIdx = argv.indexOf('--all');
const hepsiMi = allIdx >= 0 ? (argv.splice(allIdx, 1), true) : false;
const [legSlug, out] = argv;
if (!legSlug || !out || (!liste && !hepsiMi) || !konuId) {
  console.error(
    'kullanım: antlasma-girdi.ts <legislationSlug> (--articles "a,b" | --all) <cikti.json> --konu <topicId> [--sorular "<regex>"] [--en-cok 60] [--haric "23,27"]',
  );
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  try {
    const leg = await prisma.legislation.findFirst({
      where: { slug: legSlug, deletedAt: null },
      select: { id: true, name: true, slug: true, topicId: true },
    });
    if (!leg) throw new Error(`mevzuat yok: ${legSlug}`);
    const hepsi = await prisma.lawArticle.findMany({
      where: { legislationId: leg.id, deletedAt: null },
      orderBy: { sortKey: 'asc' },
      select: { articleNo: true, title: true, text: true },
    });
    const istenen = liste ? liste.split(',').map((x) => x.trim()).filter(Boolean) : [];
    const eksik = istenen.filter((n) => !hepsi.some((a) => a.articleNo === n));
    if (eksik.length) throw new Error(`Madde yok: ${eksik.join(', ')}`);
    const maddeler = hepsi.filter(
      (a) => (hepsiMi || istenen.includes(a.articleNo)) && !haric.includes(a.articleNo),
    );
    if (!maddeler.length) throw new Error('Seçime uyan madde yok.');

    const desen = soruDesen ? new RegExp(soruDesen, 'iu') : null;
    const sorular = await prisma.questionVersion.findMany({
      where: { status: 'published', currentOfQuestion: { topicId: konuId } },
      select: {
        stem: true,
        sourceLabel: true,
        options: { orderBy: { label: 'asc' }, select: { text: true, isCorrect: true } },
      },
    });
    const uyan = sorular
      .filter((q) => !desen || desen.test(`${q.stem} ${q.options.map((o) => o.text).join(' ')}`))
      .sort(
        (a, b) =>
          Number(/PAEM|MİSYON/iu.test(b.sourceLabel ?? '')) -
          Number(/PAEM|MİSYON/iu.test(a.sourceLabel ?? '')),
      )
      .slice(0, enCok);

    const girdi = {
      legislation: { slug: leg.slug, name: leg.name, topicId: leg.topicId },
      range: { from: maddeler[0]!.articleNo, to: maddeler[maddeler.length - 1]!.articleNo },
      articleNos: maddeler.map((a) => a.articleNo),
      articles: maddeler.map((a) => ({ no: a.articleNo, title: a.title, text: a.text, questionCount: 0 })),
      questions: uyan.map((q) => ({
        articleNos: [] as string[],
        stem: q.stem,
        options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      })),
    };
    writeFileSync(out, JSON.stringify(girdi, null, 2) + '\n');
    console.log(
      `Girdi: ${leg.name} · ${maddeler.length} madde (${girdi.articles.reduce((s, a) => s + a.text.length, 0)} karakter) · ${uyan.length}/${sorular.length} soru → ${out}`,
    );
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
