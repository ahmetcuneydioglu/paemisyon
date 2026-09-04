/**
 * Deneme kitapçığı sorularını bankaya ve kendi içine karşı mükerrere tarar.
 * SALT OKUMA. Çıktı: aday soru listesi (mükerrerler ayıklanmış).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';
const p = new PrismaClient();

async function main() {
  const sorular = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(process.argv[3], 'utf8'));

  const banka = await p.questionVersion.findMany({
    where: { question: { deletedAt: null }, status: { in: ['published', 'in_review', 'draft'] } },
    select: {
      stem: true, status: true, contentHash: true,
      question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { text: true } },
    },
  });
  const harita = new Map<string, { ders: string; konu: string; durum: string }>();
  for (const v of banka) {
    const fp = v.contentHash ?? questionFingerprint(v.stem, v.options.map((o) => o.text));
    if (!harita.has(fp)) harita.set(fp, { ders: v.question.topic.course.name, konu: v.question.topic.name, durum: v.status });
  }

  const gorulen = new Map<string, number>();
  const cakisan: any[] = [], icTekrar: any[] = [], temiz: any[] = [];
  for (const s of sorular) {
    const siklar = ['A', 'B', 'C', 'D', 'E'].map((l) => s.siklar[l]);
    const fp = questionFingerprint(s.kok, siklar);
    const b = harita.get(fp);
    if (b) { cakisan.push({ ...s, nerede: `${b.ders}/${b.konu} (${b.durum})` }); continue; }
    if (gorulen.has(fp)) { icTekrar.push({ ...s, esi: gorulen.get(fp) }); continue; }
    gorulen.set(fp, s.no);
    temiz.push({ ...s, dogru: anahtar[String(s.no)] ?? null });
  }
  console.log(`girdi            : ${sorular.length}`);
  console.log(`bankada var      : ${cakisan.length}`);
  console.log(`dosya içi tekrar : ${icTekrar.length}`);
  console.log(`cevabı olmayan   : ${temiz.filter((t) => !t.dogru).length}`);
  console.log(`YENİ (aday)      : ${temiz.length}`);
  for (const c of cakisan) console.log(`   #${c.no} → ${c.nerede} | ${c.kok.slice(0, 70)}`);
  for (const c of icTekrar) console.log(`   #${c.no} ≡ #${c.esi} | ${c.kok.slice(0, 70)}`);
  writeFileSync(process.argv[4], JSON.stringify(temiz, null, 1));
}
main().finally(() => p.$disconnect());
