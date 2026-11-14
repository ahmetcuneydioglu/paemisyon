/**
 * Doc 56 §12 — Kaynak metinden kart üretim girdisi: seçilen pasajlar + konunun bankadaki soruları.
 *
 *   cd apps/api && npx tsx scripts/kaynak-girdi.ts <sourceSlug> --passages "2.3-01,2.3-02" <cikti.json>
 *        [--prefix "2.3-"] [--sorular "<regex>"] [--en-cok 60]
 *
 * `ozet-girdi.ts`'in kaynak metin eşidir ve aynı biçimi üretir (`articles` = pasajlar, `no` = pasaj
 * numarası); `source` alanı `kart-uret.ts`'e kaynak kipini açtırır. Pasaj seçimi açık liste ya da numara
 * ön ekiyledir. Sorular maddeye bağlı olmadığından konunun yayındaki sorularından `--sorular` düzenli
 * ifadesiyle (kök + şıklar üzerinde, büyük/küçük harf duyarsız) süzülür; çıkmış sınav soruları öne alınır.
 * KAYNAK ETİKETİ girdiye KONMAZ (4 Eyl 2026 kuralı). Yalnız okur.
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const argv = process.argv.slice(2);
const al = (ad: string): string | undefined => {
  const i = argv.indexOf(ad);
  return i >= 0 ? argv.splice(i, 2)[1] : undefined;
};
const liste = al('--passages');
const onEk = al('--prefix');
const soruDesen = al('--sorular');
const enCok = Number(al('--en-cok') ?? 60);
const [slug, out] = argv;
if (!slug || !out || (!liste && !onEk)) {
  console.error(
    'kullanım: kaynak-girdi.ts <sourceSlug> (--passages "a,b" | --prefix "2.3-") <cikti.json> [--sorular "<regex>"] [--en-cok 60]',
  );
  process.exit(2);
}
const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  try {
    const doc = await prisma.sourceDocument.findFirst({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        topicId: true,
        topic: { select: { name: true } },
      },
    });
    if (!doc) throw new Error(`Kaynak metin yok: ${slug}`);
    const hepsi = await prisma.sourcePassage.findMany({
      where: { documentId: doc.id },
      orderBy: { sortKey: 'asc' },
      select: { passageNo: true, heading: true, text: true },
    });
    const istenen = liste
      ? liste
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : [];
    const eksik = istenen.filter((n) => !hepsi.some((p) => p.passageNo === n));
    if (eksik.length) throw new Error(`Pasaj yok: ${eksik.join(', ')}`);
    const pasajlar = hepsi.filter((p) =>
      liste ? istenen.includes(p.passageNo) : p.passageNo.startsWith(onEk!),
    );
    if (!pasajlar.length) throw new Error('Seçime uyan pasaj yok.');

    const desen = soruDesen ? new RegExp(soruDesen, 'iu') : null;
    const sorular = await prisma.questionVersion.findMany({
      where: { status: 'published', currentOfQuestion: { topicId: doc.topicId } },
      select: {
        stem: true,
        sourceLabel: true,
        options: { orderBy: { label: 'asc' }, select: { text: true, isCorrect: true } },
      },
    });
    const uyan = sorular
      .filter((q) => !desen || desen.test(`${q.stem} ${q.options.map((o) => o.text).join(' ')}`))
      // Çıkmış sınav soruları "ne soruluyor"un en iyi göstergesi: öne alınır. Etiket girdiye yazılmaz.
      .sort(
        (a, b) =>
          Number(/PAEM|MİSYON/iu.test(b.sourceLabel ?? '')) -
          Number(/PAEM|MİSYON/iu.test(a.sourceLabel ?? '')),
      )
      .slice(0, enCok);

    const girdi = {
      legislation: { slug: doc.slug, name: doc.topic.name, topicId: doc.topicId },
      source: { slug: doc.slug, title: doc.title },
      range: { from: pasajlar[0]!.passageNo, to: pasajlar[pasajlar.length - 1]!.passageNo },
      articleNos: pasajlar.map((p) => p.passageNo),
      articles: pasajlar.map((p) => ({
        no: p.passageNo,
        title: p.heading,
        text: p.text,
        questionCount: 0,
      })),
      questions: uyan.map((q) => ({
        articleNos: [] as string[],
        stem: q.stem,
        options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      })),
    };
    writeFileSync(out, JSON.stringify(girdi, null, 2) + '\n');
    console.log(
      `Girdi: ${doc.title} · ${pasajlar.length} pasaj (${girdi.articles.reduce((s, a) => s + a.text.length, 0)} karakter) · ${uyan.length}/${sorular.length} soru → ${out}`,
    );
  } catch (e) {
    console.error(`HATA: ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
