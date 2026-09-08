/**
 * Doc 37 — denetimden geçen OGM Materyal sorularını bankaya `in_review` yazar.
 *
 * KAPSAM: karar = ONAY | ONAY-HAKEM | ZAYIF ve açıklaması yazılmış sorular.
 * KUSURLU / UYARI / ANAHTAR-SUPHELI / CELISKI olanlar RAPOR.md'ye gider.
 *
 * `ONAY-HAKEM`: denetçi kusur işaretlemiş, iki hakem de "aday itiraz edemez"
 * demiş. Hakemler ayrıştıysa karar KUSURLU'dur — şüphe sorunun aleyhine.
 *
 * `sourceLabel` DOLU yazılır: soru MEB'in açık soru bankasından geliyor ve
 * "her sorunun kaynağı bankada kayıtlıdır" kuralı bunu gerektiriyor. Etiket
 * son kullanıcıya gösterilmez (SettingsService.showQuestionSource, varsayılan
 * kapalı) — yalnız admin panelde görünür.
 *
 * Kökü metin katmanında olmayan tabloya/şekle dayanan soru `mediaUrl` ile
 * taşınır (ogm-gorsel-cikar.ts); API, web oynatıcı ve Flutter render ediyor.
 *
 * `CIKAR` ile, kararı geçerli olduğu hâlde insan kararıyla bekletilen sorular
 * dışarıda tutulur (kararı tahrif etmeden).
 *
 *   npx tsx scripts/ogm-bankaya-yaz.ts <doc-dizini> <aday-dosyası>
 *   APPLY=1 npx tsx scripts/ogm-bankaya-yaz.ts <doc-dizini> <aday-dosyası>
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const GECER = new Set(['ONAY', 'ONAY-HAKEM', 'ZAYIF']);
/** Dersin TEK konusu (8 Eyl 2026'da üç kopya konu burada birleştirildi). */
const KONU_ID = '23d22785-351b-4f39-8516-a419e2c254c0';
const KAYNAK = 'MEB OGM Materyal soru bankası';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
/** İnsan kararıyla bekletilenler — karar dosyasına dokunulmaz. */
const CIKAR = new Set((process.env.CIKAR ?? '').split(',').map((x) => x.trim()).filter(Boolean));
const prisma = new PrismaClient();

async function main() {
  const [doc, adayYolu] = process.argv.slice(2);
  if (!doc || !adayYolu) throw new Error('kullanım: ogm-bankaya-yaz.ts <doc-dizini> <aday-dosyası>');

  const karar = new Map<string, string>();
  for (const f of readdirSync(`${doc}/denetim`).filter((x) => /-karar\.json$/.test(x)))
    for (const k of JSON.parse(readFileSync(`${doc}/denetim/${f}`, 'utf8'))) karar.set(k.id, k.karar);

  const aciklama = new Map<string, { aciklama: string; dayanak: string | null }>();
  if (existsSync(`${doc}/aciklama`))
    for (const f of readdirSync(`${doc}/aciklama`).filter((x) => x.endsWith('.json')))
      for (const a of JSON.parse(readFileSync(`${doc}/aciklama/${f}`, 'utf8')))
        aciklama.set(a.id, { aciklama: a.aciklama, dayanak: a.dayanak ?? null });

  const aday = JSON.parse(readFileSync(adayYolu, 'utf8'));
  const gecerli: any[] = [];
  const eleme: Record<string, string[]> = { karar: [], aciklamaYok: [], cevapYok: [], bekletilen: [], ayniSik: [] };
  for (const q of aday) {
    if (CIKAR.has(q.id)) { eleme.bekletilen.push(q.id); continue; }
    // Son savunma hattı: aynı metni taşıyan iki şık, sorunun kendisi bozuk
    // demektir — hangi karar verilmiş olursa olsun bankaya girmez.
    const metinler = SIKLAR.map((l) => String(q.siklar[l]).trim().toLocaleLowerCase('tr'));
    if (new Set(metinler).size !== SIKLAR.length) { eleme.ayniSik.push(q.id); continue; }
    const k = karar.get(q.id);
    if (!GECER.has(k ?? '')) { eleme.karar.push(`${q.id}=${k ?? 'KARARSIZ'}`); continue; }
    if (!aciklama.has(q.id)) { eleme.aciklamaYok.push(q.id); continue; }
    if (!q.dogru) { eleme.cevapYok.push(q.id); continue; }
    gecerli.push({ ...q, ac: aciklama.get(q.id)! });
  }

  const parmak = gecerli.map((r) => questionFingerprint(r.kok, SIKLAR.map((l) => r.siklar[l])));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } },
    select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`aday soru          : ${aday.length}`);
  console.log(`karar nedeniyle    : ${eleme.karar.length}  ${eleme.karar.join(' ')}`);
  console.log(`açıklaması yok     : ${eleme.aciklamaYok.length}  ${eleme.aciklamaYok.join(' ')}`);
  console.log(`cevabı yok         : ${eleme.cevapYok.length}  ${eleme.cevapYok.join(' ')}`);
  console.log(`aynı şık taşıyor   : ${eleme.ayniSik.length}  ${eleme.ayniSik.join(' ')}`);
  console.log(`insan bekletiyor   : ${eleme.bekletilen.length}  ${eleme.bekletilen.join(' ')}`);
  console.log(`bankada zaten var  : ${gecerli.length - yazilacak.length}`);
  console.log(`görselli           : ${yazilacak.filter((r) => r.gorselUrl).length}`);
  console.log(`YAZILACAK          : ${yazilacak.length}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  if (!yazilacak.length) { console.log('\nyazılacak soru yok.'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(r.kok, SIKLAR.map((l) => r.siklar[l])),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: satirlar.map((r) => ({ id: r.questionId, topicId: KONU_ID, articleNo: null })),
    });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok, explanation: r.ac.aciklama, difficulty: Difficulty.medium,
        mediaUrl: r.gorselUrl ?? null,
        sourceLabel: KAYNAK, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        SIKLAR.map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.siklar[l]),
          isCorrect: l === r.dogru, sortOrder: i,
        })),
      ),
    });
    const ref = satirlar.filter((r) => r.ac.dayanak)
      .map((r) => ({ questionVersionId: r.versionId, citation: r.ac.dayanak! }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
