/**
 * Maddeye bağlı olmayan soruların dayanak maddesini ÖNERİR. SALT OKUR.
 *
 * Soru kökü + şıkları, o konudaki bütün madde metinleriyle karşılaştırılır.
 * Puanlama: ortak sözcükler, o sözcüğün NADİRLİĞİ ile ağırlıklandırılır
 * (bir sözcük kaç maddede geçiyorsa o kadar az ayırt edicidir). Böylece
 * "memur", "kanun" gibi her yerde geçen sözcükler öneriyi saptırmaz.
 *
 * ÖNERİDİR, karar değildir — her öneri madde metnine bakılarak doğrulanır.
 *
 *   npx tsx scripts/madde-oner.ts --konu 657 --adet 15
 *   npx tsx scripts/madde-oner.ts --konu 657 --soru 1a2b3c4d
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

const DURAK = new Set(('ve veya ile için göre olan olarak bir bu şu da de ki ise aşağıdakilerden hangisi ' +
  'hangileri hangisinde kaç kaçıncı ne nedir sayılı kanun kanuna kanunu kanununa hakkında ilgili ' +
  'durumunda halinde hâlinde nin nın nun nün den dan tan ten yer alan bulunan gereken aşağıdaki ' +
  'yukarıdakilerden yukarıdaki ifadelerden şıklardan seçeneklerden madde maddesi maddesine göre ' +
  'devlet memurları memur memurun memura memurlar doğrudur yanlıştır değildir olabilir edilir ' +
  'verilir yapılır olur eder etmek olmak bulunmak').split(/\s+/));

const jetonla = (s: string) => new Set(
  s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !DURAK.has(w)));

(async () => {
  const konu = arg('--konu');
  const t = await p.topic.findFirst({
    where: { name: { contains: konu!, mode: 'insensitive' }, deletedAt: null }, select: { id: true, name: true } });
  if (!t) { console.log(`"${konu}" bulunamadi`); return; }

  const maddeler = await p.lawArticle.findMany({
    where: { topicId: t.id, deletedAt: null, status: 'published' },
    select: { articleNo: true, title: true, text: true } });

  // Sozcuk -> kac maddede geciyor (nadirlik icin)
  const mJeton = maddeler.map((m) => ({ no: m.articleNo, baslik: m.title ?? '', j: jetonla(`${m.title ?? ''} ${m.text}`) }));
  const df = new Map<string, number>();
  for (const m of mJeton) for (const w of m.j) df.set(w, (df.get(w) ?? 0) + 1);

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null, topicId: t.id, articleNo: null } },
    select: { id: true, stem: true, options: { select: { text: true } },
      question: { select: { id: true } } } });

  const suz = arg('--soru');
  const hedef = suz ? rows.filter((r) => r.id.startsWith(suz)) : rows;
  const adet = Number(arg('--adet') ?? 15);
  const atla = Number(arg('--atla') ?? 0);

  console.log(`### ${t.name} | ${maddeler.length} madde | maddeye baglanmamis yayin sorusu: ${rows.length}`);
  console.log(`### bu parti: ${Math.min(adet, Math.max(0, hedef.length - atla))} (atla=${atla})\n`);

  for (const r of hedef.slice(atla, atla + adet)) {
    const qj = jetonla(`${r.stem} ${r.options.map((o) => o.text).join(' ')}`);
    const puan = mJeton.map((m) => {
      let s = 0;
      for (const w of qj) if (m.j.has(w)) s += Math.log(mJeton.length / (df.get(w) ?? 1));
      // baslikta gecen sozcuk iki kat degerli
      for (const w of qj) if (jetonla(m.baslik).has(w)) s += Math.log(mJeton.length / (df.get(w) ?? 1));
      return { no: m.no, baslik: m.baslik, s };
    }).sort((a, b) => b.s - a.s).slice(0, 3);

    console.log(`-- ${r.id.slice(0, 8)}  ${r.stem.replace(/\s+/g, ' ').slice(0, 125)}`);
    console.log(`   ONERI: ${puan.map((x) => `m.${x.no}${x.baslik ? ` (${x.baslik.slice(0, 34)})` : ''} [${x.s.toFixed(1)}]`).join('  |  ')}`);
  }
})().finally(() => p.$disconnect());
