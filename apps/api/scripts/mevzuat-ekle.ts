/**
 * Mevzuat Merkezi'ne yeni kanun/yönetmelik ekler (genel amaçlı).
 *
 * Şema gereği her Legislation bir Topic'e 1:1 bağlanır; bu yüzden hedef derse
 * bir MEVZUAT KONUSU açılır. Bu konulara soru bağlanmaz, yalnız madde metni
 * durur (2559, 6216, AİHS'te olduğu gibi).
 *
 * Kaynak: mevzuat.gov.tr resmî PDF'i — İNSAN indirir (Doc 29 §13, kazıma yok).
 * Her dosyada kimlik doğrulaması yapılır: yanlış mevzuat yazılamaz.
 *
 *   npx tsx scripts/mevzuat-ekle.ts <config.json>            # kuru çalışma
 *   APPLY=1 npx tsx scripts/mevzuat-ekle.ts <config.json>    # taslak yaz
 *   APPLY=1 PUBLISH=1 ...                                     # yayınla
 *
 * config: [{ "dosya":"1.5.5188.pdf", "no":"5188", "tur":"kanun",
 *            "ad":"5188 Sayılı Özel Güvenlik Hizmetlerine Dair Kanun",
 *            "kisa":"ÖGH", "ders":"Polis Mevzuatı",
 *            "aliases":["5188","ozel guvenlik"], "keywords":["5188 sayılı"] }]
 */
import { readFileSync } from 'node:fs';
import { PrismaClient, LegislationType } from '@prisma/client';
import { parseDocument, verifyLawIdentity } from '../src/modules/admin/law-articles/law-document-parser';
import { extractPdfLawText } from '../src/modules/admin/law-articles/pdf-law-text';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1';
const PUBLISH = process.env.PUBLISH === '1';

const slugla = (s: string) =>
  s.toLocaleLowerCase('tr-TR').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

async function main() {
  const hedefler = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  console.log(APPLY ? `MOD: YAZMA${PUBLISH ? ' + YAYIN' : ' (taslak)'}` : 'MOD: KURU ÇALIŞMA');

  for (const h of hedefler) {
    const ham = await extractPdfLawText(readFileSync(`${process.env.HOME}/Downloads/${h.dosya}`));
    // Yönetmelikte "Kanun Numarası" satırı yoktur; kimlik ADLA doğrulanır.
    const kimlik = verifyLawIdentity(ham, { number: h.tur === 'kanun' ? h.no : null, name: h.ad });
    if (!kimlik.ok) { console.log(`✗ ${h.no}: KİMLİK DOĞRULANAMADI — ${kimlik.reason}; ATLANDI`); continue; }
    const belge = parseDocument(ham);

    // PDF'in sonundaki DEĞİŞİKLİK CETVELİ (tarih/kanun no tablosu) madde gibi
    // ayrıştırılabiliyor. İki koruma: (1) rakam-ağırlıklı gövdeyi ele, (2) aynı
    // madde numarası tekrarlarsa İLKİNİ tut. Aksi hâlde (topic_id, article_no)
    // tekilliği patlıyor ve yazma yarıda kalıyor.
    const cetvelMi = (t: string) => {
      const d = t.trim();
      // MÜLGA/DEĞİŞİK/EK notları rakam yoğundur ama GERÇEK maddedir ve
      // korunmalıdır: "bu madde yürürlükten kalkmış" bilgisi, "metnimiz yok"
      // ile karıştırılmamalı. Değişiklik cetveli ise UZUN bir tablodur.
      if (/^\((M[üu]lga|De[ğg]i[şs]ik|Ek)\s*:/i.test(d)) return false;
      const g = d.replace(/\s/g, '');
      if (g.length < 200) return false;
      return (g.replace(/[^0-9/,.\-]/g, '').length / g.length) > 0.6;
    };
    const gorulen = new Set<string>();
    const elenen: string[] = [];
    const maddeler = belge.articles.filter((a) => {
      if (cetvelMi(a.text)) { elenen.push(`${a.articleNo} (değişiklik cetveli)`); return false; }
      if (gorulen.has(a.articleNo)) { elenen.push(`${a.articleNo} (tekrar)`); return false; }
      gorulen.add(a.articleNo);
      return true;
    });

    const ders = await prisma.course.findFirst({
      where: { name: { contains: h.ders }, deletedAt: null },
      select: { id: true, name: true, topics: { where: { deletedAt: null }, select: { sortOrder: true } } },
    });
    if (!ders) { console.log(`✗ ${h.no}: "${h.ders}" dersi bulunamadı; ATLANDI`); continue; }

    const slug = slugla(h.ad);
    const mevcut = await prisma.legislation.findUnique({ where: { slug }, select: { id: true } });
    console.log(`\n── ${h.ad}`);
    console.log(`   kimlik ✓ · ${maddeler.length} madde · ${belge.sections.length} bölüm · ders: ${ders.name} · ${mevcut ? 'ZATEN VAR' : 'yeni'}`);
    if (elenen.length) console.log(`   elenen: ${elenen.join(', ')}`);
    if (!APPLY || mevcut) { if (mevcut) console.log('   dokunulmadı'); continue; }

    const durum = PUBLISH ? 'published' : 'draft';
    const sira = Math.max(0, ...ders.topics.map((t) => t.sortOrder)) + 1;
    await prisma.$transaction(async (tx) => {
    const konu = await tx.topic.create({
      data: { courseId: ders.id, name: h.ad, sortOrder: sira, matchKeywords: h.keywords ?? [] },
      select: { id: true },
    });
    const kaynakUrl = h.tur === 'kanun'
      ? `https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=${h.no}&MevzuatTur=1&MevzuatTertip=5`
      : `https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=${h.no}&MevzuatTur=7&MevzuatTertip=5`;
    const kanun = await tx.legislation.create({
      data: {
        slug, type: h.tur as LegislationType, number: h.no, name: h.ad, shortName: h.kisa ?? null,
        aliases: h.aliases ?? [], officialSourceUrl: kaynakUrl, status: durum,
        topicId: konu.id, sortOrder: sira,
        effectiveInfo: 'mevzuat.gov.tr konsolide metni (değişiklikler işlenmiş).',
        lastVerifiedAt: new Date(),
      },
      select: { id: true },
    });
    const bolumHarita = new Map<number, string>();
    for (const [i, b] of belge.sections.entries()) {
      const s = await tx.legislationSection.create({
        data: { legislationId: kanun.id, heading: b.heading, sortOrder: i }, select: { id: true },
      });
      bolumHarita.set(i, s.id);
    }
    await tx.lawArticle.createMany({
      data: maddeler.map((a, i) => ({
        topicId: konu.id, legislationId: kanun.id,
        sectionId: a.sectionOrder != null ? bolumHarita.get(a.sectionOrder) ?? null : null,
        articleNo: a.articleNo, title: a.title, text: a.text, sortKey: i,
        sourceName: 'mevzuat.gov.tr', sourceUrl: kaynakUrl,
        effectiveInfo: 'mevzuat.gov.tr konsolide metni (değişiklikler işlenmiş).',
        lastVerifiedAt: new Date(), status: durum,
      })),
    });
    console.log(`   ✓ yazıldı — konu ${konu.id}, ${maddeler.length} madde (${durum})`);
    }, { timeout: 120_000 });
  }
}
main().finally(() => prisma.$disconnect());
