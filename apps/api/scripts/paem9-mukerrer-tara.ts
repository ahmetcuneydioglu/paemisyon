/**
 * Doc 36 — SALT OKUMA: PAEM 9 sorularını bankaya karşı mükerrere tarar.
 *
 * Yalnız A kitapçığı taranır; B aynı soruların karışığıdır (ayrıştırıcı
 * çapraz doğrulamada 100/100 eşleştirdi).
 *
 * Ortak metinli sorularda parmak izi ORTAK METİN + KÖK üzerinden alınır:
 * "Yukarıdaki bilgilere göre..." kökü tek başına birden çok soruda aynıdır.
 *
 *   npx tsx scripts/paem9-mukerrer-tara.ts
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const p = new PrismaClient();

/** Bankaya yazılacak tam kök: ortak bilgi bloğu + soru cümlesi. */
export const tamKok = (s: { ortakMetin?: string; kok: string }) =>
  s.ortakMetin ? `${s.ortakMetin}\n\n${s.kok}` : s.kok;

async function main() {
  const { A } = JSON.parse(readFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, 'utf8'));

  const banka = await p.questionVersion.findMany({
    where: { question: { deletedAt: null }, status: { in: ['published', 'in_review', 'draft'] } },
    select: {
      stem: true, sourceLabel: true, status: true,
      options: { select: { text: true } },
      question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
    },
  });
  const indeks = new Map<string, { yer: string; durum: string; kaynak: string | null }>();
  for (const v of banka) {
    const fp = questionFingerprint(v.stem, v.options.map((o) => o.text));
    if (!indeks.has(fp))
      indeks.set(fp, {
        yer: `${v.question.topic.course.name}/${v.question.topic.name}`,
        durum: v.status,
        kaynak: v.sourceLabel,
      });
  }

  const gorulen = new Map<string, number>();
  const cakisan: { no: number; nerede: string }[] = [];
  const icTekrar: { no: number; esi: number }[] = [];
  let temiz = 0;
  for (const s of A as any[]) {
    const fp = questionFingerprint(tamKok(s), Object.values(s.siklar) as string[]);
    const b = indeks.get(fp);
    if (b) { cakisan.push({ no: s.no, nerede: `${b.yer} (${b.durum}) ${b.kaynak ?? ''}` }); continue; }
    const es = gorulen.get(fp);
    if (es) { icTekrar.push({ no: s.no, esi: es }); continue; }
    gorulen.set(fp, s.no);
    temiz++;
  }

  console.log(`banka         : ${banka.length} sürüm`);
  console.log(`PAEM 9 girdi  : ${A.length}`);
  console.log(`bankada var   : ${cakisan.length}`);
  console.log(`kitapçık içi  : ${icTekrar.length}`);
  console.log(`YENİ          : ${temiz}`);
  for (const c of cakisan) console.log(`  #${c.no} → ${c.nerede}`);
  for (const c of icTekrar) console.log(`  #${c.no} ≡ #${c.esi}`);
}
main().finally(() => p.$disconnect());
