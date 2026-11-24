/**
 * Doc 39 — bir mevzuatın KOMŞU tabanını döker (salt okur):
 *   mevzuat/<ad>-diger-konu-sorulari.txt — başka konularda bu mevzuatı adıyla/numarasıyla anan sorular (ANAN)
 *   mevzuat/<ad>-cakisma-sorulari.txt    — başka konularda aynı kavramı ölçen sorular (SOZCUK süzgeci)
 * Kendi konusundaki sorular `-mevcut-sorular.txt`'tedir; burada dışarıda bırakılır.
 * İki süzgeç de büyük/küçük harf duyarsız Postgres düzenli ifadesidir; kök + şık + açıklamada aranır.
 *
 *   ANAN='çocuk koruma kanununun uygulanmasına' SOZCUK='suça sürüklenen|sosyal çalışma görevlisi' \
 *     npx tsx scripts/doc39-cakisma-cikar.ts <doc-dizini> <slug|kanun-no> <dosya-adi>
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL!);
url.searchParams.set('connection_limit', '1');
const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });

type Satir = { ders: string; konu: string; md: string | null; stem: string; siklar: string };

async function ara(topicId: string, desen: string): Promise<Satir[]> {
  return prisma.$queryRaw<Satir[]>`
    select c.name as ders, t.name as konu, q.article_no as md, v.stem,
      (select string_agg('   ' || o.label || ') ' || o.text || case when o.is_correct then '  ✔' else '' end, E'\n' order by o.sort_order)
         from question_options o where o.question_version_id = v.id) as siklar
    from questions q
    join lateral (select * from question_versions x where x.question_id = q.id
                  and x.status in ('published','in_review') order by x.version_no desc limit 1) v on true
    join topics t on t.id = q.topic_id join courses c on c.id = t.course_id
    where q.deleted_at is null and q.topic_id <> ${topicId}::uuid
      and (v.stem ~* ${desen} or coalesce(v.explanation,'') ~* ${desen}
           or exists (select 1 from question_options o where o.question_version_id = v.id and o.text ~* ${desen}))
    order by c.name, t.name, q.article_no nulls last`;
}

const bas = (s: Satir[]) =>
  s.map((x) => `[${x.ders} / ${x.konu}${x.md ? ' md ' + x.md : ''}] ${x.stem}\n${x.siklar}`).join('\n\n') + '\n';

function dagilim(s: Satir[]) {
  const m = new Map<string, number>();
  for (const x of s) m.set(`${x.ders} / ${x.konu}`, (m.get(`${x.ders} / ${x.konu}`) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ');
}

async function main() {
  const [doc, hedef, ad] = process.argv.slice(2);
  const { ANAN, SOZCUK } = process.env;
  if (!doc || !hedef || !ad || !ANAN || !SOZCUK) throw new Error('kullanım: ANAN=… SOZCUK=… … <doc-dizini> <slug|kanun-no> <dosya-adi>');
  const leg = await prisma.legislation.findFirstOrThrow({
    where: /^\d+$/.test(hedef) ? { number: hedef } : { slug: hedef },
  });
  if (!leg.topicId) throw new Error(`${hedef}: bağlı konu yok`);

  const anan = await ara(leg.topicId, ANAN);
  writeFileSync(`${doc}/mevzuat/${ad}-diger-konu-sorulari.txt`,
    `# ${ad} — başka konularda bu mevzuatı adıyla anan sorular (${anan.length}; süzgeç: ${ANAN}). Yeni soru bunları tekrar etmez.\n\n` + bas(anan), 'utf8');

  const cak = await ara(leg.topicId, SOZCUK);
  writeFileSync(`${doc}/mevzuat/${ad}-cakisma-sorulari.txt`,
    `# ${ad} çakışma tabanı — komşu mevzuatın aynı kavramı ölçen soruları (anahtar sözcük süzgeci: ${SOZCUK}; ilgisiz eşleşme olabilir). Yeni soru bunları ad değiştirerek sormaz, onların cevabıyla çözülmez.\n# Dağılım: ${dagilim(cak)}\n\n` + bas(cak), 'utf8');
  console.log(`${ad}: adıyla anan ${anan.length} · çakışma ${cak.length}\n  ${dagilim(cak)}`);
}
main().finally(() => prisma.$disconnect());
