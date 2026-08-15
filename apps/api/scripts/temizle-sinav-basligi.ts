/** Şık sonuna yapışan sınav sayfa başlıklarını temizler (3 kalıp).
 *  APPLY=1 ile yazar; onsuz yalnız listeler. */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const HEADERS = [
  /\s*YURT DIŞINDA GÖREVLENDİRİLECEK OKUTMAN[\s\S]*$/,
  /\s*(?:MEMUR\s?A?\s+)?\d+’DEN \d+’E KADAR OLAN SORULAR[\s\S]*$/,
  /\s*GÖREVDE YÜKSELME SURETİYLE İCRA MÜDÜR[\s\S]*$/,
];
function clean(t: string): string {
  let out = t;
  let hit = false;
  for (const re of HEADERS) {
    if (re.test(out)) {
      out = out.replace(re, '');
      hit = true;
    }
  }
  // Başlıktan artakalan kitapçık harfi ("Millî egemenlik A") — yalnız kesimde.
  if (hit) out = out.replace(/\s+[AB]$/, '');
  return out.trim();
}
(async () => {
  const apply = process.env.APPLY === '1';
  const rows = await p.$queryRawUnsafe<{ id: string; text: string }[]>(`
    SELECT o.id, o.text FROM question_options o
    JOIN question_versions qv ON qv.id = o.question_version_id
    JOIN questions q ON q.id = qv.question_id
    WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
      AND (o.text ~ 'YURT DIŞINDA GÖREVLENDİRİLECEK OKUTMAN'
        OR o.text ~ 'KADAR OLAN SORULAR'
        OR o.text ~ 'GÖREVDE YÜKSELME SURETİYLE')`);
  let n = 0;
  for (const r of rows) {
    const yeni = clean(r.text);
    if (yeni === r.text) continue;
    if (yeni.length === 0) {
      console.log('BOŞ KALIRDI, atlandı:', r.text.slice(0, 80));
      continue;
    }
    n++;
    console.log(JSON.stringify(r.text.slice(0, 60)), '→', JSON.stringify(yeni.slice(0, 60)));
    if (apply) await p.questionOption.update({ where: { id: r.id }, data: { text: yeni } });
  }
  console.log(`${apply ? 'uygulandı' : 'değişecek'}: ${n} / aday ${rows.length}`);
  await p.$disconnect();
})();
