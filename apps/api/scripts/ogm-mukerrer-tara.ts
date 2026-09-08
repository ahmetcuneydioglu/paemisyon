/**
 * Doc 37 — aday soruları bankaya karşı tarar: TAM eşleşme + YAKIN eşleşme.
 *
 * Tam eşleşme `questionFingerprint` ile bulunur; ama bu parti hazır bir soru
 * bankasından geliyor ve klasik ders kitabı soruları bankada başka bir dizgiyle
 * duruyor olabilir ("Aşağıdakilerden hangisi…" ile "Aşağıdaki … hangisi…").
 * Bu yüzden ikinci bir tur: aynı dersin sorularıyla kelime kümesi benzerliği
 * (Jaccard). Eşiği aşanlar SİLİNMEZ, insana gösterilir — karar bende değil.
 *
 * SALT OKUMA.
 *   npx tsx scripts/ogm-mukerrer-tara.ts <ham.json> <anahtar.json> <cikti.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const YAKINLIK_ESIGI = 0.55;
const p = new PrismaClient();

/** Karşılaştırma için gürültüyü at: noktalama, ek sesli farkları değil, kalıp sözler. */
const KALIP = new Set([
  'aşağıdakilerden', 'aşağıdaki', 'hangisi', 'hangileri', 'değildir', 'aşağıdakilerin',
  'verilen', 'yukarıda', 'yukarıdaki', 'bir', 've', 'ile', 'için', 'olarak', 'bu', 'da', 'de',
]);
const kelimeler = (t: string) =>
  new Set(
    t.toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !KALIP.has(w)),
  );
const jaccard = (a: Set<string>, b: Set<string>) => {
  const kesisim = [...a].filter((x) => b.has(x)).length;
  return kesisim / (a.size + b.size - kesisim || 1);
};

async function main() {
  const [hamYol, anahtarYol, ciktiYol] = process.argv.slice(2);
  const sorular = JSON.parse(readFileSync(hamYol, 'utf8'));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(anahtarYol, 'utf8'));

  const banka = await p.questionVersion.findMany({
    where: { question: { deletedAt: null }, status: { in: ['published', 'in_review', 'draft'] } },
    select: {
      stem: true, status: true, contentHash: true,
      question: { select: { id: true, topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { text: true } },
    },
  });

  const tam = new Map<string, string>();
  const inkilap: { id: string; stem: string; durum: string; kume: Set<string> }[] = [];
  for (const v of banka) {
    const fp = v.contentHash ?? questionFingerprint(v.stem, v.options.map((o) => o.text));
    const yer = `${v.question.topic.course.name}/${v.question.topic.name} (${v.status})`;
    if (!tam.has(fp)) tam.set(fp, yer);
    if (/nkil|nkıl/i.test(v.question.topic.course.name))
      inkilap.push({ id: v.question.id, stem: v.stem, durum: v.status, kume: kelimeler(v.stem) });
  }

  const temiz: any[] = [];
  const cakisan: any[] = [];
  const yakin: any[] = [];
  for (const s of sorular) {
    const siklar = ['A', 'B', 'C', 'D', 'E'].map((l) => s.siklar[l]);
    const fp = questionFingerprint(s.kok, siklar);
    if (tam.has(fp)) { cakisan.push({ no: s.no, nerede: tam.get(fp) }); continue; }
    const k = kelimeler(s.kok);
    const en = inkilap
      .map((b) => ({ ...b, skor: jaccard(k, b.kume) }))
      .sort((a, b) => b.skor - a.skor)[0];
    if (en && en.skor >= YAKINLIK_ESIGI)
      yakin.push({ no: s.no, skor: Number(en.skor.toFixed(2)), durum: en.durum, stem: en.stem.replace(/\n/g, ' ').slice(0, 90) });
    temiz.push({ ...s, dogru: anahtar[String(s.no)] ?? null });
  }

  console.log(`aday             : ${sorular.length}`);
  console.log(`bankada TAM eş   : ${cakisan.length}`);
  for (const c of cakisan) console.log(`   #${c.no} → ${c.nerede}`);
  console.log(`YAKIN eş (≥${YAKINLIK_ESIGI}) : ${yakin.length}   ← insan bakacak, elenmedi`);
  for (const y of yakin) console.log(`   #${y.no} ~${y.skor} (${y.durum}) ${y.stem}`);
  console.log(`aday kalan       : ${temiz.length}`);
  writeFileSync(ciktiYol, JSON.stringify(temiz, null, 1));
}
main().finally(() => p.$disconnect());
