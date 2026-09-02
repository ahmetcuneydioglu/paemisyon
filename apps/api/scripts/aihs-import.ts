/**
 * AİHS (Avrupa İnsan Hakları Sözleşmesi) + Protokolleri bankaya aktarır.
 *
 * KAYNAK: Avrupa Konseyi'nin RESMI Turkce cevirisi (echr.coe.int), 15 No.lu
 * Protokol sonrasi guncel metin. Ceviri bilgilendirme amaclidir; sozlesmenin
 * resmi dilleri Ingilizce ve Fransizcadir — bu not effectiveInfo'ya yazilir.
 *
 * Anayasa m.90 uyarinca usulune gore yururluge konulmus milletlerarasi
 * antlasmalar KANUN HUKMUNDEDIR; bu nedenle legislation.type=kanun birakildi
 * (alan hicbir istemcide gosterilmiyor, yalniz veri modelinde duruyor).
 *
 * articleNo semasi: Sozlesme "1".."59"; protokoller "Ek P-1", "P4-1", "P7-3"…
 * Boylece (topicId, articleNo) tekilligi korunur ve soru baglama net kalir.
 *
 *   npx tsx scripts/aihs-import.ts <aihs.json>            (kuru calisma)
 *   npx tsx scripts/aihs-import.ts <aihs.json> --yaz
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const p = new PrismaClient();
const DERS = '5f566643-358b-4b28-bc62-26755a77670c'; // İnsan Hakları
const KAYNAK = 'https://www.echr.coe.int/documents/d/echr/convention_TUR';
const KUNYE = 'Avrupa Konseyi resmî Türkçe çevirisi; 11., 14. ve 15. Protokoller ile değiştirilen metin. Sözleşmenin resmî dilleri İngilizce ve Fransızcadır.';

type M = { belge: string; articleNo: string; title: string; bolum: string | null; text: string };

const sira = (no: string) => {
  const m = /^(?:(Ek P|P(\d+))-)?(\d+)$/.exec(no);
  if (!m) return 9_000_000;
  const grup = m[1] ? (m[2] ? Number(m[2]) : 1) : 0; // Sozlesme 0, Ek P 1, P4 4…
  return grup * 1000 + Number(m[3]);
};

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const ham: M[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  // Baslik gorunumlu ama govdesi bos olan maddelerde baslik aslinda METINDIR.
  const maddeler = ham.map((m) => (m.text.trim() ? m : { ...m, text: m.title, title: '' }));

  const bosluk = maddeler.filter((m) => m.text.trim().length < 20);
  if (bosluk.length) { console.log('!! govdesi cok kisa:', bosluk.map((b) => b.articleNo)); }

  console.log(`madde: ${maddeler.length}`);
  const belgeler = [...new Set(maddeler.map((m) => m.belge))];
  for (const b of belgeler) console.log(`  ${b}: ${maddeler.filter((m) => m.belge === b).length}`);

  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }

  const AD = 'Avrupa İnsan Hakları Sözleşmesi (AİHS)';
  const konu = (await p.topic.findFirst({ where: { courseId: DERS, name: AD } }))
    ?? (await p.topic.create({ data: { courseId: DERS, name: AD, sortOrder: 1,
      matchKeywords: ['aihs', 'aihm', 'sözleşme', 'avrupa insan hakları'] } }));
  const mevzuat = await p.legislation.upsert({
    where: { slug: 'aihs' }, update: { lastVerifiedAt: new Date() },
    create: { slug: 'aihs', name: 'Avrupa İnsan Hakları Sözleşmesi', shortName: 'AİHS',
      aliases: ['AİHS', 'Avrupa İnsan Hakları Sözleşmesi', 'İnsan Hakları ve Temel Özgürlüklerin Korunmasına İlişkin Sözleşme'],
      officialSourceUrl: KAYNAK, effectiveInfo: KUNYE, status: 'published',
      topicId: konu.id, sortOrder: 0 },
  });

  // Bolum basliklarini icindekiler olarak yaz (yalniz Sozlesme'de var).
  const bolumler = [...new Set(maddeler.map((m) => m.bolum).filter(Boolean))] as string[];
  const bolumId = new Map<string, string>();
  for (const [i, h] of bolumler.entries()) {
    const s = await p.legislationSection.create({
      data: { legislationId: mevzuat.id, heading: h, sortOrder: i } });
    bolumId.set(h, s.id);
  }
  // Protokoller icin de birer bolum basligi.
  for (const [i, b] of belgeler.slice(1).entries()) {
    const s = await p.legislationSection.create({
      data: { legislationId: mevzuat.id, heading: b, sortOrder: bolumler.length + i } });
    bolumId.set(b, s.id);
  }

  let n = 0;
  for (const m of maddeler) {
    const bolum = m.belge === 'Sözleşme' ? m.bolum : m.belge;
    await p.lawArticle.upsert({
      where: { topicId_articleNo: { topicId: konu.id, articleNo: m.articleNo } },
      update: { text: m.text, title: m.title || null, lastVerifiedAt: new Date() },
      create: { topicId: konu.id, articleNo: m.articleNo, title: m.title || null, text: m.text,
        sourceName: 'echr.coe.int', sourceUrl: KAYNAK, effectiveInfo: KUNYE,
        lastVerifiedAt: new Date(), status: 'published', legislationId: mevzuat.id,
        sectionId: bolum ? bolumId.get(bolum) ?? null : null, sortKey: sira(m.articleNo) },
    });
    n++;
  }
  console.log(`\nYAZILDI: konu=${konu.id}  mevzuat=${mevzuat.id}  madde=${n}`);
})().finally(() => p.$disconnect());
