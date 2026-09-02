/**
 * Tek bir kanunun madde JSON'unu bankaya aktarir (konu + legislation + maddeler).
 * Kaynak mevzuat.gov.tr konsolide metnidir; ceviri/duzeltme yapilmaz.
 *
 *   npx tsx scripts/mevzuat-json-import.ts --json <dosya> --ders <id> --ad "<konu adi>" \
 *     --slug <slug> --kisa <kisaltma> --no <kanun no> --url <kaynak> [--yaz]
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
const sira = (no: string) => {
  const m = /^(Ek|Geçici)?\s*(\d+)/.exec(no.trim());
  if (!m) return 9_000_000;
  const b = Number(m[2]);
  return m[1] === 'Ek' ? 1_000_000 + b : m[1] === 'Geçici' ? 2_000_000 + b : b;
};

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const maddeler: Array<{ articleNo: string; title: string; text: string }> =
    JSON.parse(readFileSync(arg('--json')!, 'utf8'));
  const AD = arg('--ad')!, DERS = arg('--ders')!, URL = arg('--url')!;
  console.log(`${AD}: ${maddeler.length} madde`);
  const kisa = maddeler.filter((m) => m.text.trim().length < 40);
  if (kisa.length) console.log('!! kisa govde:', kisa.map((m) => m.articleNo).join(', '));
  if (!YAZ) { console.log('(KURU CALISMA — --yaz ile uygulanir)'); return; }

  const konu = (await p.topic.findFirst({ where: { courseId: DERS, name: AD } }))
    ?? (await p.topic.create({ data: { courseId: DERS, name: AD, sortOrder: 9, matchKeywords: [] } }));
  const mev = await p.legislation.upsert({
    where: { slug: arg('--slug')! }, update: { lastVerifiedAt: new Date() },
    create: { slug: arg('--slug')!, name: AD, shortName: arg('--kisa') ?? null, number: arg('--no') ?? null,
      officialSourceUrl: URL, status: 'published', topicId: konu.id,
      effectiveInfo: 'mevzuat.gov.tr konsolide (işlenmiş) metin' },
  });
  let n = 0;
  for (const m of maddeler) {
    await p.lawArticle.upsert({
      where: { topicId_articleNo: { topicId: konu.id, articleNo: m.articleNo } },
      update: { text: m.text, title: m.title || null, lastVerifiedAt: new Date() },
      create: { topicId: konu.id, articleNo: m.articleNo, title: m.title || null, text: m.text,
        sourceName: 'mevzuat.gov.tr', sourceUrl: URL, effectiveInfo: 'konsolide metin',
        lastVerifiedAt: new Date(), status: 'published', legislationId: mev.id, sortKey: sira(m.articleNo) },
    });
    n++;
  }
  console.log(`YAZILDI: konu=${konu.id} madde=${n}`);
})().finally(() => p.$disconnect());
