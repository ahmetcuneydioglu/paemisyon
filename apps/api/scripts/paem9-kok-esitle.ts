/**
 * Doc 36 — ayrıştırıcı düzeldiğinde bankadaki PAEM 9 köklerini eşitler.
 *
 * Kök metni ayrıştırıcıdan gelir; ayrıştırıcı düzeldiğinde bankadaki kopya
 * eskir. Eşleştirme kitapçık SIRASI üzerinden yapılır (PastExamQuestion.orderNo),
 * metin üzerinden değil — zaten değişen şey metnin kendisi.
 *
 * YALNIZ `in_review` sürümler güncellenir. Yayındaki metni yerinde değiştirmek,
 * gözden geçirilmemiş içeriği sessizce canlıya sürmek olur; öyle bir durumda
 * script durur ve hangi soruların elle ele alınması gerektiğini söyler.
 *
 *   npx tsx scripts/paem9-kok-esitle.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem9-kok-esitle.ts
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

const tamKok = (s: { ortakMetin?: string; kok: string }) =>
  s.ortakMetin ? `${s.ortakMetin}\n\n${s.kok}` : s.kok;

async function main() {
  const { A } = JSON.parse(readFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, 'utf8'));
  const beklenen = new Map<number, { kok: string; siklar: Record<string, string> }>(
    (A as any[]).map((s) => [s.no, { kok: tamKok(s), siklar: s.siklar }]),
  );

  const sinav = await prisma.pastExam.findUnique({ where: { slug: 'paem-9-2025' }, select: { id: true } });
  if (!sinav) throw new Error('paem-9-2025 yok');
  const kayitlar = await prisma.pastExamQuestion.findMany({
    where: { pastExamId: sinav.id },
    orderBy: { orderNo: 'asc' },
    select: {
      orderNo: true,
      question: {
        select: {
          versions: {
            orderBy: { versionNo: 'desc' },
            take: 1,
            select: { id: true, stem: true, status: true, options: { select: { text: true } } },
          },
        },
      },
    },
  });

  const farkli: { no: number; versionId: string; eski: string; yeni: string; durum: string }[] = [];
  for (const k of kayitlar) {
    const v = k.question.versions[0];
    const b = beklenen.get(k.orderNo);
    if (!v || !b) continue;
    if (v.stem === b.kok) continue;
    farkli.push({ no: k.orderNo, versionId: v.id, eski: v.stem, yeni: b.kok, durum: v.status });
  }

  console.log(`karşılaştırılan ${kayitlar.length} · farklı ${farkli.length}`);
  for (const f of farkli) {
    console.log(`\n  #${f.no} (${f.durum})`);
    console.log(`    eski: ${f.eski.replace(/\s+/g, ' ').slice(0, 110)}`);
    console.log(`    yeni: ${f.yeni.replace(/\s+/g, ' ').slice(0, 110)}`);
  }
  const yayinda = farkli.filter((f) => f.durum === 'published');
  if (yayinda.length)
    throw new Error(`yayındaki sürüm yerinde değiştirilmez: ${yayinda.map((f) => f.no).join(', ')}`);

  if (!farkli.length || !APPLY) {
    if (!farkli.length) console.log('\nfark yok.');
    else console.log('\n(kuru çalışma — APPLY=1 ile yazılır)');
    return;
  }

  for (const f of farkli) {
    const b = beklenen.get(f.no)!;
    await prisma.questionVersion.update({
      where: { id: f.versionId },
      data: {
        stem: f.yeni,
        // Parmak izi kökten türüyor; güncellenmezse mükerrer taraması yanılır.
        contentHash: questionFingerprint(f.yeni, Object.values(b.siklar)),
      },
    });
  }
  console.log(`\n✓ ${farkli.length} kök güncellendi (in_review)`);
}
main().finally(() => prisma.$disconnect());
