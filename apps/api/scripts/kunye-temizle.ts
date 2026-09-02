/**
 * Doc 32 — DAYANAK ALANINDAN YAYINEVI KUNYESINI TEMIZLER.
 *
 * LegalReference "dayanak" alanidir ve KANUN dayanagini tasimalidir. Kitap
 * partileri ice aktarilirken buraya yanlislikla yayinevi kunyesi (Themis /
 * Seckin / Test-Soru no) yazilmisti; kullanici bu ibarelerin gorunmesini
 * istemiyor ve zaten dogru yer degil.
 *
 * Davranis: sorunun DOGRULANMIS madde bagi (question.articleNo) varsa kunye
 * kanun dayanagiyla DEGISTIRILIR; yoksa satir SILINIR. Soru metnine,
 * siklara ve aciklamaya DOKUNULMAZ.
 *
 *   npx tsx scripts/kunye-temizle.ts          (kuru calisma)
 *   npx tsx scripts/kunye-temizle.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/kunye-yedek.json`;
const YAYINEVI = /themis|seçkin|soru kitabı|yayıncılık|ümit kaymak|baskı \(20\d\d\)/i;

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const ref = await p.legalReference.findMany({
    select: { id: true, citation: true, url: true, questionVersionId: true,
      questionVersion: { select: { id: true, stem: true,
        question: { select: { articleNo: true, topic: { select: { name: true } } } } } } } });
  const hedef = ref.filter((r) => YAYINEVI.test(r.citation));
  console.log(`yayinevi kunyesi tasiyan dayanak: ${hedef.length} / ${ref.length}`);

  const degis: typeof hedef = [], sil: typeof hedef = [];
  for (const r of hedef) {
    const q = r.questionVersion?.question;
    (q?.articleNo && q.topic?.name ? degis : sil).push(r);
  }
  const yeni = (r: (typeof hedef)[number]) => {
    const q = r.questionVersion!.question;
    return `${q.topic!.name} m.${q.articleNo}`;
  };
  console.log(`  kanun dayanagiyla DEGISTIRILECEK: ${degis.length}`);
  for (const r of degis.slice(0, 6)) console.log(`    ${r.citation.slice(0, 60)}…  ->  ${yeni(r)}`);
  console.log(`  SILINECEK (madde bagi yok): ${sil.length}`);
  for (const r of sil.slice(0, 6)) console.log(`    ${r.citation.slice(0, 70)}…`);

  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }
  writeFileSync(YEDEK, JSON.stringify(hedef.map((r) => ({
    id: r.id, questionVersionId: r.questionVersionId, eskiCitation: r.citation, eskiUrl: r.url,
    yeniCitation: degis.includes(r) ? yeni(r) : null,
  })), null, 1));
  for (const r of degis) {
    await p.legalReference.update({ where: { id: r.id }, data: { citation: yeni(r), url: null } });
  }
  if (sil.length) await p.legalReference.deleteMany({ where: { id: { in: sil.map((r) => r.id) } } });
  console.log(`\nTAMAM: ${degis.length} dayanak kanunla degistirildi, ${sil.length} satir silindi. Yedek: ${YEDEK}`);
})().finally(() => p.$disconnect());
