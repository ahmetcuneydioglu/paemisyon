/** SALT OKUMA: ayrıştırılan İH sorularını banka + kendi içinde mükerrere tarar. */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const p = new PrismaClient();
type Soru = { bolumNo: number; bolum: string; no: number; kok: string; sayfa: number; dogru: string; siklar: { label: string; text: string }[] };

async function main() {
  const yeni: Soru[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));

  const ders = await p.course.findFirst({ where: { name: { contains: 'İnsan Hakları' }, deletedAt: null }, select: { id: true } });
  const konular = await p.topic.findMany({ where: { courseId: ders!.id, deletedAt: null }, select: { id: true } });

  // Bankadaki TÜM sorular (yalnız İH değil — mükerrer başka derste de olabilir).
  const bankaHepsi = await p.questionVersion.findMany({
    where: { question: { deletedAt: null }, status: { in: ['published', 'in_review', 'draft'] } },
    select: {
      stem: true, questionId: true, status: true,
      question: { select: { topicId: true, topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { text: true } },
    },
  });
  const bankaMap = new Map<string, { ders: string; konu: string; durum: string }>();
  for (const v of bankaHepsi) {
    const fp = questionFingerprint(v.stem, v.options.map((o) => o.text));
    if (!bankaMap.has(fp)) bankaMap.set(fp, { ders: v.question.topic.course.name, konu: v.question.topic.name, durum: v.status });
  }

  const gorulen = new Map<string, Soru>();
  const bankaCakisan: { s: Soru; nerede: string }[] = [];
  const icMukerrer: { s: Soru; esi: Soru }[] = [];
  const temiz: Soru[] = [];
  for (const s of yeni) {
    const fp = questionFingerprint(s.kok, s.siklar.map((o) => o.text));
    const b = bankaMap.get(fp);
    if (b) { bankaCakisan.push({ s, nerede: `${b.ders}/${b.konu} (${b.durum})` }); continue; }
    const es = gorulen.get(fp);
    if (es) { icMukerrer.push({ s, esi: es }); continue; }
    gorulen.set(fp, s);
    temiz.push(s);
  }

  console.log(`girdi          : ${yeni.length}`);
  console.log(`bankada var    : ${bankaCakisan.length}`);
  console.log(`dosya içi tekrar: ${icMukerrer.length}`);
  console.log(`YENİ (aday)    : ${temiz.length}`);
  console.log(`\nbanka İH mevcut : ${bankaHepsi.filter((v) => konular.some((k) => k.id === v.question.topicId)).length} sürüm`);
  if (bankaCakisan.length) {
    console.log('\nbankayla çakışanlar (ilk 10):');
    for (const c of bankaCakisan.slice(0, 10)) console.log(`  b${c.s.bolumNo} #${c.s.no} → ${c.nerede} | ${c.s.kok.slice(0, 60)}`);
  }
  if (icMukerrer.length) {
    console.log('\ndosya içi tekrarlar (ilk 10):');
    for (const c of icMukerrer.slice(0, 10)) console.log(`  b${c.s.bolumNo} #${c.s.no} ≡ b${c.esi.bolumNo} #${c.esi.no} | ${c.s.kok.slice(0, 60)}`);
  }
  writeFileSync(process.argv[3], JSON.stringify(temiz, null, 2));
}
main().finally(() => p.$disconnect());
