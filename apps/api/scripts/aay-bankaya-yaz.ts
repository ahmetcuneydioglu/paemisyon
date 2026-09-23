/**
 * Doc 43 — kanıtlanmış analitik akıl yürütme sorularını bankaya `in_review` yazar.
 *
 * İki nokta bilerek böyle:
 *
 * 1. Script ÜRETİCİYE GÜVENMEZ. Her soruyu yazmadan önce çözücüyle yeniden
 *    koşar ve KANIT çıkmayanı yazmaz. Doğru şık da spesifikasyondaki
 *    `isaretli` alanından değil, ÇÖZÜCÜNÜN bulduğu şıktan alınır — böylece
 *    yanlış anahtarlı bir soru bankaya girecek yolu kalmaz.
 *
 * 2. Senaryo metni her sorunun KÖKÜNE gömülür. Bankada ortak metin diye bir
 *    varlık yok; PAEM 9'un kendi üçlüleri de bankada böyle duruyor. Soru tek
 *    başına geldiğinde de çözülebilir kalsın diye tekrar zorunlu.
 *
 * `sourceLabel` soruyu AI üretimi olarak İŞARETLER (CLAUDE.md, Doc 43 istisnası).
 * Etiket son kullanıcıya gösterilmez, yalnız admin panelde görünür.
 *
 *   npx tsx scripts/aay-bankaya-yaz.ts aay-p2          (kuru çalışma)
 *   APPLY=1 npx tsx scripts/aay-bankaya-yaz.ts aay-p2  (yazar)
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { cozumle, type Bulmaca } from './aay-cozucu';

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

const HANGI = process.argv[2] ?? 'aay-p1';
if (!/^aay-p\d+$/.test(HANGI)) throw new Error(`parti adı aay-p<N> olmalı: ${HANGI}`);

const APPLY = process.env.APPLY === '1';
const KONU = 'Analitik Akıl Yürütme';
const ETIKET = 'AI üretimi — Analitik akıl yürütme (çözücü kanıtlı)';
// CLAUDE.md: scriptler tek bağlantıyla (Supabase pooler 15 slotu prod ile ortak).
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  // Parti dosyası adıyla yüklenir — yeni parti için bu script'e dokunmak gerekmez.
  const PARTI: Soru[] = (await import(pathToFileURL(resolve(__dirname, `${HANGI}.ts`)).href)).PARTI;
  const konu = await prisma.topic.findFirstOrThrow({
    where: { name: KONU, deletedAt: null },
    select: { id: true, name: true, course: { select: { name: true } } },
  });
  console.log(`konu             : ${konu.course?.name} › ${konu.name}`);
  console.log(`parti            : ${HANGI}`);
  console.log(`etiket           : ${ETIKET}\n`);

  const eleme: string[] = [];
  const gecerli = [];
  for (const b of PARTI) {
    const k = cozumle(b);
    if (k.sonuc !== 'KANIT') { eleme.push(`${b.id}=${k.sonuc}`); continue; }
    const dogru = k.tutan[0];
    const metinler = b.siklar.map((s) => s.metin.trim());
    if (new Set(metinler.map((m) => m.toLocaleLowerCase('tr'))).size !== 5) { eleme.push(`${b.id}=AYNI-ŞIK`); continue; }
    if (b.siklar.length !== 5) { eleme.push(`${b.id}=ŞIK-SAYISI`); continue; }
    if (!b.aciklama?.trim()) { eleme.push(`${b.id}=AÇIKLAMA-YOK`); continue; }
    const kok = `${b.ortakMetin}\n\n${b.kok}`;
    gecerli.push({
      id: b.id, kok, dogru, aciklama: b.aciklama.trim(), zorluk: b.zorluk,
      siklar: b.siklar, contentHash: questionFingerprint(kok, metinler),
      dunya: k.dunyaSayisi,
    });
  }

  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: gecerli.map((r) => r.contentHash) } },
    select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((r) => !carpisan.has(r.contentHash));

  console.log(`aday soru        : ${PARTI.length}`);
  if (eleme.length) console.log(`elenen           : ${eleme.length}  ${eleme.join(' ')}`);
  console.log(`bankada zaten var: ${gecerli.length - yazilacak.length}`);
  console.log(`YAZILACAK        : ${yazilacak.length}  (hepsi in_review)\n`);
  for (const r of yazilacak)
    console.log(`  ${r.id}  ${r.dogru}  ${String(r.dunya).padStart(3)} dünya  ${r.zorluk.padEnd(6)} ${r.kok.split('\n').pop()!.slice(0, 52)}`);

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  if (!yazilacak.length) { console.log('\nyazılacak soru yok.'); return; }

  const satirlar = yazilacak.map((r) => ({ ...r, questionId: randomUUID(), versionId: randomUUID() }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: satirlar.map((r) => ({ id: r.questionId, topicId: konu.id, articleNo: null })),
    });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok, explanation: r.aciklama,
        difficulty: r.zorluk as Difficulty,
        sourceLabel: ETIKET, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        r.siklar.map((s, i) => ({
          questionVersionId: r.versionId, label: s.harf, text: s.metin.trim(),
          isCorrect: s.harf === r.dogru, sortOrder: i,
        })),
      ),
    });
    console.log(`\n✓ ${satirlar.length} soru onay kuyruğuna (in_review) yazıldı`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
