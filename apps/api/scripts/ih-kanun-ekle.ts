/**
 * İH partisi (Doc 33) — eksik üç kanunu Mevzuat Merkezi'ne ekler.
 *
 * Şema gereği her Legislation bir Topic'e 1:1 bağlanır (AİHS'te olduğu gibi);
 * bu yüzden İnsan Hakları dersine üç KANUN KONUSU açılır. Bu konulara soru
 * bağlanmaz — Doc 33 kararı gereği sorular yalnız "İnsan Hakları" ve "AİHS"
 * konularına gider.
 *
 * Kaynak: mevzuat.gov.tr resmî PDF'i, İNSAN indirdi (Doc 29 §13 — kazıma yok).
 * Kimlik doğrulaması her dosyada yapılır: yanlış kanun yazılamaz.
 *
 *   npx tsx scripts/ih-kanun-ekle.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/ih-kanun-ekle.ts    # yaz (taslak)
 *   APPLY=1 PUBLISH=1 npx tsx scripts/ih-kanun-ekle.ts
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { parseDocument, verifyLawIdentity } from '../src/modules/admin/law-articles/law-document-parser';
import { extractPdfLawText } from '../src/modules/admin/law-articles/pdf-law-text';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1';
const PUBLISH = process.env.PUBLISH === '1';

const HEDEFLER = [
  {
    no: '3686',
    ad: '3686 Sayılı İnsan Haklarını İnceleme Komisyonu Kanunu',
    slug: '3686-sayili-insan-haklarini-inceleme-komisyonu-kanunu',
    kisa: 'İHİK',
    aliases: ['3686', 'insan haklarini inceleme komisyonu', 'ihik'],
    keywords: ['3686 sayılı', 'İnsan Haklarını İnceleme Komisyonu'],
  },
  {
    no: '6328',
    ad: '6328 Sayılı Kamu Denetçiliği Kurumu Kanunu',
    slug: '6328-sayili-kamu-denetciligi-kurumu-kanunu',
    kisa: 'KDK',
    aliases: ['6328', 'kamu denetciligi', 'ombudsman', 'kdk'],
    keywords: ['6328 sayılı', 'Kamu Denetçiliği', 'Kamu Başdenetçisi', 'ombudsman'],
  },
  {
    no: '6701',
    ad: '6701 Sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu',
    slug: '6701-sayili-turkiye-insan-haklari-ve-esitlik-kurumu-kanunu',
    kisa: 'TİHEK',
    aliases: ['6701', 'turkiye insan haklari ve esitlik kurumu', 'tihek'],
    keywords: ['6701 sayılı', 'İnsan Hakları ve Eşitlik Kurumu', 'TİHEK'],
  },
];

const kaynakUrl = (no: string) =>
  `https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=${no}&MevzuatTur=1&MevzuatTertip=5`;

async function main() {
  const ders = await prisma.course.findFirst({
    where: { name: { contains: 'İnsan Hakları' }, deletedAt: null },
    select: { id: true, name: true, topics: { where: { deletedAt: null }, select: { sortOrder: true } } },
  });
  if (!ders) throw new Error('İnsan Hakları dersi bulunamadı');
  let sira = Math.max(0, ...ders.topics.map((t) => t.sortOrder)) + 1;

  console.log(`Ders: ${ders.name} (${ders.id})`);
  console.log(APPLY ? `MOD: YAZMA${PUBLISH ? ' + YAYIN' : ' (taslak)'}\n` : 'MOD: KURU ÇALIŞMA\n');

  for (const h of HEDEFLER) {
    const ham = await extractPdfLawText(readFileSync(`${process.env.HOME}/Downloads/1.5.${h.no}.pdf`));
    const kimlik = verifyLawIdentity(ham, { number: h.no, name: h.ad });
    if (!kimlik.ok) { console.log(`✗ ${h.no}: KİMLİK DOĞRULANAMADI — ${kimlik.reason}; atlandı`); continue; }
    const belge = parseDocument(ham);

    const mevcut = await prisma.legislation.findUnique({ where: { slug: h.slug }, select: { id: true } });
    console.log(`── ${h.ad}`);
    console.log(`   kimlik ✓ · ${belge.articles.length} madde · ${belge.sections.length} bölüm başlığı · ${mevcut ? 'kanun ZATEN VAR' : 'yeni'}`);
    if (!APPLY) { console.log(`   konu açılacak: "${h.ad}" (sortOrder ${sira++})\n`); continue; }
    if (mevcut) { console.log('   zaten var — dokunulmadı\n'); continue; }

    const durum = PUBLISH ? 'published' : 'draft';
    const konu = await prisma.topic.create({
      data: { courseId: ders.id, name: h.ad, sortOrder: sira++, matchKeywords: h.keywords },
      select: { id: true },
    });
    const kanun = await prisma.legislation.create({
      data: {
        slug: h.slug, type: 'kanun', number: h.no, name: h.ad, shortName: h.kisa,
        aliases: h.aliases, officialSourceUrl: kaynakUrl(h.no), status: durum,
        topicId: konu.id, sortOrder: sira,
        effectiveInfo: 'mevzuat.gov.tr konsolide metni (değişiklikler işlenmiş).',
        lastVerifiedAt: new Date(),
      },
      select: { id: true },
    });
    const bolumHarita = new Map<number, string>();
    for (const [i, b] of belge.sections.entries()) {
      const s = await prisma.legislationSection.create({
        data: { legislationId: kanun.id, heading: b.heading, sortOrder: i },
        select: { id: true },
      });
      bolumHarita.set(i, s.id);
    }
    await prisma.lawArticle.createMany({
      data: belge.articles.map((a, i) => ({
        topicId: konu.id, legislationId: kanun.id,
        sectionId: a.sectionOrder != null ? bolumHarita.get(a.sectionOrder) ?? null : null,
        articleNo: a.articleNo, title: a.title, text: a.text, sortKey: i,
        sourceName: 'mevzuat.gov.tr', sourceUrl: kaynakUrl(h.no),
        effectiveInfo: 'mevzuat.gov.tr konsolide metni (değişiklikler işlenmiş).',
        lastVerifiedAt: new Date(), status: durum,
      })),
    });
    console.log(`   ✓ yazıldı — konu ${konu.id}, ${belge.articles.length} madde (${durum})\n`);
  }
}
main().finally(() => prisma.$disconnect());
