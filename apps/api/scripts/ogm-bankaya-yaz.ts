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
 * `YAYIN` ile sayılan kimlikler DOĞRUDAN yayına yazılır (`published` +
 * `currentVersionId`), onay kuyruğuna uğramadan. Bu, projenin "içe aktarılan
 * soru asla doğrudan yayına çıkmaz" kuralının bilinçli istisnasıdır ve yalnız
 * kullanıcının açık talimatıyla kullanılır (Doc 38, 9 Eyl 2026).
 *
 *   npx tsx scripts/ogm-bankaya-yaz.ts <doc-dizini> <aday-dosyası>
 *   YAYIN=s1,s3,… KAYNAK="…" npx tsx scripts/ogm-bankaya-yaz.ts …
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
const KAYNAK = process.env.KAYNAK ?? 'MEB OGM Materyal soru bankası';
/** Doğrudan yayına çıkacak kimlikler — geri kalanı onay kuyruğuna düşer. */
const YAYIN = new Set((process.env.YAYIN ?? '').split(',').map((x) => x.trim()).filter(Boolean));
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
/** İnsan kararıyla bekletilenler — karar dosyasına dokunulmaz. */
const CIKAR = new Set((process.env.CIKAR ?? '').split(',').map((x) => x.trim()).filter(Boolean));

/**
 * Üç ya da daha çok roma rakamı sıralayan bir şıkta tekrar varsa dizi bozuktur.
 * Eşik üç: "I ve II" ya da "Yalnız I" gibi normal şıklar yanlış yakalanmasın.
 */
function bozukRomaDizisi(metin: string): boolean {
  const tokenlar = metin.match(/\b(?:I{1,3}|IV|V)\b/g) ?? [];
  return tokenlar.length >= 3 && new Set(tokenlar).size !== tokenlar.length;
}
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
  const eleme: Record<string, string[]> = { karar: [], aciklamaYok: [], cevapYok: [], bekletilen: [], ayniSik: [], bozukDizi: [] };
  for (const q of aday) {
    if (CIKAR.has(q.id)) { eleme.bekletilen.push(q.id); continue; }
    // Son savunma hattı: aynı metni taşıyan iki şık, sorunun kendisi bozuk
    // demektir — hangi karar verilmiş olursa olsun bankaya girmez.
    const metinler = SIKLAR.map((l) => String(q.siklar[l]).trim().toLocaleLowerCase('tr'));
    if (new Set(metinler).size !== SIKLAR.length) { eleme.ayniSik.push(q.id); continue; }
    // Sıralama sorularında bir şıkkın roma dizisi tekrarlı basılmışsa
    // (ör. "II - V - I - II - IV") o şık geçerli bir sıralama değildir.
    // Kullanıcı kararı (9 Eyl 2026): kaynağın dizgi hatası bir çeldiriciyi
    // bozuyorsa soru alınmaz — aday ekranda bozuk bir seçenek görmemeli.
    if (SIKLAR.some((l) => bozukRomaDizisi(String(q.siklar[l])))) { eleme.bozukDizi.push(q.id); continue; }
    const k = karar.get(q.id);
    if (!GECER.has(k ?? '')) { eleme.karar.push(`${q.id}=${k ?? 'KARARSIZ'}`); continue; }
    if (!aciklama.has(q.id)) { eleme.aciklamaYok.push(q.id); continue; }
    if (!q.dogru) { eleme.cevapYok.push(q.id); continue; }
    gecerli.push({ ...q, ac: aciklama.get(q.id)! });
  }

  const parmak = gecerli.map((r) => questionFingerprint(r.kok, SIKLAR.map((l) => r.siklar[l])));
  // `deletedAt` FİLTRELENMEZ: kullanıcı panelden bir soruyu elediyse o soru
  // "bankada yok" değildir, "istenmiyor" demektir. Filtrelenirse script
  // kullanıcının elemesini geri alır — bir turda 12 soru böyle dirilecekti.
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak } },
    select: { contentHash: true, question: { select: { deletedAt: true } } },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const elenmis = new Set(mevcut.filter((m) => m.question.deletedAt != null).map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));
  const kullaniciElemis = gecerli.filter((_, i) => elenmis.has(parmak[i]));

  console.log(`aday soru          : ${aday.length}`);
  console.log(`karar nedeniyle    : ${eleme.karar.length}  ${eleme.karar.join(' ')}`);
  console.log(`açıklaması yok     : ${eleme.aciklamaYok.length}  ${eleme.aciklamaYok.join(' ')}`);
  console.log(`cevabı yok         : ${eleme.cevapYok.length}  ${eleme.cevapYok.join(' ')}`);
  console.log(`aynı şık taşıyor   : ${eleme.ayniSik.length}  ${eleme.ayniSik.join(' ')}`);
  console.log(`bozuk roma dizisi  : ${eleme.bozukDizi.length}  ${eleme.bozukDizi.join(' ')}`);
  console.log(`insan bekletiyor   : ${eleme.bekletilen.length}  ${eleme.bekletilen.join(' ')}`);
  console.log(`bankada zaten var  : ${gecerli.length - yazilacak.length}`);
  console.log(`  bunun ${kullaniciElemis.length}'i kullanıcının PANELDEN ELEDİĞİ soru — geri yazılmıyor`);
  if (kullaniciElemis.length) console.log(`     ${kullaniciElemis.map((r) => r.id).join(' ')}`);
  console.log(`görselli           : ${yazilacak.filter((r) => r.gorselUrl).length}`);
  const yayinlanacak = yazilacak.filter((r) => YAYIN.has(r.id));
  console.log(`YAZILACAK          : ${yazilacak.length}`);
  console.log(`  doğrudan YAYIN   : ${yayinlanacak.length}  ${yayinlanacak.map((r) => r.id).join(' ')}`);
  console.log(`  onay kuyruğuna   : ${yazilacak.length - yayinlanacak.length}`);
  const yayinFazla = [...YAYIN].filter((id) => !yazilacak.some((r) => r.id === id));
  if (yayinFazla.length) console.log(`  ! YAYIN listesinde olup yazılmayacak: ${yayinFazla.join(' ')}`);
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
        sourceLabel: KAYNAK, contentHash: r.contentHash,
        status: (YAYIN.has(r.id) ? 'published' : 'in_review') as const,
        publishedAt: YAYIN.has(r.id) ? new Date() : null,
      })),
    });
    // Yayına çıkan sürüm Question.currentVersionId ile bağlanır; uygulama
    // yayındaki metni buradan çözüyor (admin-questions.service.approve ile
    // aynı adım).
    for (const r of satirlar.filter((x) => YAYIN.has(x.id)))
      await tx.question.update({ where: { id: r.questionId }, data: { currentVersionId: r.versionId } });
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
    const y = satirlar.filter((r) => YAYIN.has(r.id)).length;
    console.log(`\n✓ ${satirlar.length} soru yazıldı · ${y} YAYINDA · ${satirlar.length - y} onay kuyruğunda · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
