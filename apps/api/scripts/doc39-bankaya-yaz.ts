/**
 * Doc 39 — denetimden geçen mevzuat türetimi sorularını bankaya `in_review` yazar.
 *
 * KAPSAM: `denetim/<dosya>-karar.json` içinde karar = KABUL olan sorular.
 * REVIZYON / RED olanlar rapora gider, bankaya girmez.
 *
 * `sourceLabel` DOLU yazılır ve soruyu bir mevzuat türetimi olarak İŞARETLER
 * ("Mevzuat türetimi — 2911 md 7"). Anayasadaki "her sorunun kaynağı bankada
 * kayıtlıdır" kuralı bunu gerektiriyor; bu etiket sayesinde üretilen sorular
 * bankadaki gerçek çıkmış sorulardan admin panelde ayırt edilebilir kalır.
 * Etiket son kullanıcıya GÖSTERİLMEZ (SettingsService.showQuestionSource).
 *
 * Bu script DOĞRUDAN YAYIN yolu tanımaz — yayına alma kararı insanındır.
 *
 *   npx tsx scripts/doc39-bankaya-yaz.ts <doc-dizini> <kanun-no>
 *   PARTI=3201-p1,3201-p4 npx tsx scripts/doc39-bankaya-yaz.ts …  (kapsamı daralt)
 *   ONEK=performans ETIKET="Performans Değerlendirme Yönetmeliği" … <slug>  (numarasız mevzuat)
 *   APPLY=1 npx tsx scripts/doc39-bankaya-yaz.ts docs/39-… 2911
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const prisma = new PrismaClient();

type Aday = {
  id: string; articleNo: string; kok: string;
  siklar: Record<string, string>; dogru: string;
  aciklama: string; dayanak: string; zorluk: 'easy' | 'medium' | 'hard';
};

async function main() {
  const [doc, kanunNo] = process.argv.slice(2);
  if (!doc || !kanunNo) throw new Error('kullanım: doc39-bankaya-yaz.ts <doc-dizini> <kanun-no|slug>');

  /**
   * İkinci argüman kanun numarası ya da `Legislation.slug` olabilir. Yönetmelik
   * gibi numarasız mevzuatta `number` boştur; dosya adı öneki de o zaman slug
   * değil kısa bir ad olur (ör. "performans"), bu yüzden ETIKET/ONEK ile
   * ayrıca verilebilir.
   */
  const leg = await prisma.legislation.findFirstOrThrow({
    where: kanunNo.match(/^\d+$/) ? { number: kanunNo } : { slug: kanunNo },
  });
  if (!leg.topicId) throw new Error(`${kanunNo} mevzuatının bağlı konusu yok`);
  const kisa = process.env.ETIKET ?? leg.shortName ?? (leg.number ? `${leg.number} sayılı Kanun` : leg.name);
  const onek = process.env.ONEK ?? kanunNo;

  /**
   * PARTI ile kapsam tek bir partiye kilitlenir. Kanunun bütün partilerini
   * birden yazmak, denetimi HÂLÂ SÜREN bir partinin ESKİ TUR karar dosyasını
   * yeni metinle eşleştirir; 7068-p2'de tam olarak bu oldu ve bankaya 9 bayat
   * sürüm düştü. İki tur işletilen kanunlarda parti kilidi zorunludur.
   */
  const partiler = (process.env.PARTI ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const kapsamda = (dosya: string) =>
    partiler.length ? partiler.some((pt) => dosya.startsWith(`${pt}-`) || dosya === `${pt}.json`) : true;
  if (partiler.length) console.log(`kapsam           : ${partiler.join(' ')}\n`);

  const karar = new Map<string, string>();
  for (const f of readdirSync(`${doc}/denetim`).filter((x) => x.startsWith(`${onek}-`) && x.endsWith('-karar.json') && kapsamda(x)))
    for (const k of JSON.parse(readFileSync(`${doc}/denetim/${f}`, 'utf8'))) karar.set(k.id, k.karar);

  const aday: Aday[] = [];
  const okunamayan: string[] = [];
  for (const f of readdirSync(`${doc}/aday`).filter((x) => x.startsWith(`${onek}-`) && x.endsWith('.json') && kapsamda(x))) {
    // Bir üretici hâlâ yazıyorsa dosya yarım olabilir. Böyle bir dosyayı
    // ayrıştırmaya çalışmak scripti çökertir; atlamak güvenlidir çünkü o
    // partinin karar dosyası da yoktur (soruları KARARSIZ sayılıp elenir).
    try {
      aday.push(...JSON.parse(readFileSync(`${doc}/aday/${f}`, 'utf8')));
    } catch {
      okunamayan.push(f);
    }
  }
  if (okunamayan.length) console.log(`! okunamayan aday dosyası (yazılıyor olabilir), atlandı: ${okunamayan.join(' ')}\n`);

  // Resmî madde metni yoksa soru dayanaksızdır — yazılmaz.
  const maddeler = new Set(
    (await prisma.lawArticle.findMany({
      where: { legislationId: leg.id, deletedAt: null, status: 'published' },
      select: { articleNo: true },
    })).map((a) => a.articleNo),
  );

  const eleme: Record<string, string[]> = { karar: [], maddeYok: [], sikSayisi: [], ayniSik: [], cevapYok: [], aciklamaYok: [] };
  const gecerli: Aday[] = [];
  for (const q of aday) {
    const k = karar.get(q.id);
    if (k !== 'KABUL') { eleme.karar.push(`${q.id}=${k ?? 'KARARSIZ'}`); continue; }
    if (!maddeler.has(q.articleNo)) { eleme.maddeYok.push(`${q.id}=md${q.articleNo}`); continue; }
    // Beş şık kuralı (Anayasa, 8 Eyl 2026) — eksik şıklı soru bankaya girmez.
    if (SIKLAR.some((l) => !String(q.siklar?.[l] ?? '').trim())) { eleme.sikSayisi.push(q.id); continue; }
    const metinler = SIKLAR.map((l) => String(q.siklar[l]).trim().toLocaleLowerCase('tr'));
    if (new Set(metinler).size !== SIKLAR.length) { eleme.ayniSik.push(q.id); continue; }
    if (!SIKLAR.includes(q.dogru as never)) { eleme.cevapYok.push(q.id); continue; }
    if (!q.aciklama?.trim() || !q.dayanak?.trim()) { eleme.aciklamaYok.push(q.id); continue; }
    gecerli.push(q);
  }

  const parmak = gecerli.map((r) => questionFingerprint(r.kok.trim(), SIKLAR.map((l) => r.siklar[l].trim())));
  // `deletedAt` FİLTRELENMEZ: kullanıcının panelden elediği soru "yok" değil,
  // "istenmiyor" demektir; filtrelenirse script o elemeyi geri alır.
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak } }, select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`aday soru        : ${aday.length}`);
  for (const [k, v] of Object.entries(eleme)) if (v.length) console.log(`${k.padEnd(17)}: ${v.length}  ${v.join(' ')}`);
  console.log(`bankada zaten var: ${gecerli.length - yazilacak.length}`);
  console.log(`YAZILACAK        : ${yazilacak.length}  (hepsi in_review)`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  if (!yazilacak.length) { console.log('\nyazılacak soru yok.'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(r.kok.trim(), SIKLAR.map((l) => r.siklar[l].trim())),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: satirlar.map((r) => ({ id: r.questionId, topicId: leg.topicId!, articleNo: r.articleNo })),
    });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok.trim(), explanation: r.aciklama.trim(),
        difficulty: r.zorluk as Difficulty,
        sourceLabel: `Mevzuat türetimi — ${kisa} md ${r.articleNo}`,
        contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        SIKLAR.map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.siklar[l]).trim(),
          isCorrect: l === r.dogru, sortOrder: i,
        })),
      ),
    });
    await tx.legalReference.createMany({
      data: satirlar.map((r) => ({ questionVersionId: r.versionId, citation: r.dayanak })),
    });
    console.log(`\n✓ ${satirlar.length} soru onay kuyruğuna (in_review) yazıldı · ${satirlar.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
