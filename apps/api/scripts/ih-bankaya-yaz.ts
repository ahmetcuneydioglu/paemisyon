/**
 * Doc 33 — denetimden geçen İnsan Hakları sorularını bankaya yazar.
 *
 * KAPSAM: yalnız karar = ONAY | ZAYIF-ONAY olan ve AÇIKLAMASI yazılmış sorular.
 * UYARI / ÇELİŞKİ / ANAHTAR-HATALI / KUSURLU olanlar RAPOR.md'ye gider, buradan
 * GEÇMEZ (kullanıcı kararı, 4 Eyl 2026).
 *
 * sourceLabel BOŞ bırakılır: bu sorular özgün, dışarıdan alınmış değil. Üçüncü
 * taraf sorularda zorunlu olan kaynak etiketi burada anlamsız olurdu.
 * Madde künyesi `LegalReference.citation` olarak YAPISAL yazılır.
 *
 * Sorular `in_review` düşer — yayını admin panelden verir.
 *
 *   npx tsx scripts/ih-bankaya-yaz.ts             # kuru çalışma
 *   APPLY=1 npx tsx scripts/ih-bankaya-yaz.ts     # yaz
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();
const GECER = new Set(['ONAY', 'ZAYIF-ONAY']);

type Soru = { id: string; kok: string; siklar: Record<string, string> };

async function main() {
  // 1. Kararlar — hangi soru geçiyor?
  const karar = new Map<string, string>();
  for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x))) {
    for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) karar.set(k.id, k.karar);
  }
  // 2. Açıklamalar
  const aciklama = new Map<string, { aciklama: string; dayanak: string | null }>();
  if (existsSync(`${KOK}/aciklama`)) {
    for (const f of readdirSync(`${KOK}/aciklama`).filter((x) => x.endsWith('.json'))) {
      for (const a of JSON.parse(readFileSync(`${KOK}/aciklama/${f}`, 'utf8'))) {
        aciklama.set(a.id, { aciklama: a.aciklama, dayanak: a.dayanak ?? null });
      }
    }
  }
  // 3. Sorular + konu eşlemesi (parti dosyalarındaki `konu` alanı)
  const sorular: { s: Soru; konu: string; dogru: string }[] = [];
  for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-kor\.json$/.test(x))) {
    const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
    if (!o.konu) continue; // b90/b91 gibi yardımcı partiler
    const anahtar = JSON.parse(readFileSync(`${KOK}/parti/${f.replace('-kor', '-anahtar')}`, 'utf8'));
    for (const s of o.sorular) sorular.push({ s, konu: o.konu, dogru: anahtar[s.id] });
  }

  const ders = await prisma.course.findFirst({
    where: { name: { contains: 'İnsan Hakları' }, deletedAt: null },
    select: { id: true, topics: { where: { deletedAt: null }, select: { id: true, name: true } } },
  });
  const konuId = {
    aihs: ders!.topics.find((t) => t.name.includes('Avrupa İnsan Hakları Sözleşmesi'))!.id,
    'insan-haklari': ders!.topics.find((t) => t.name === 'İnsan Hakları')!.id,
  } as Record<string, string>;

  // 4. Süz
  const aday: typeof sorular = [];
  const eleme = { karar: 0, aciklamaYok: 0, kararYok: 0 };
  for (const r of sorular) {
    const k = karar.get(r.s.id);
    if (!k) { eleme.kararYok++; continue; }
    if (!GECER.has(k)) { eleme.karar++; continue; }
    if (!aciklama.has(r.s.id)) { eleme.aciklamaYok++; continue; }
    aday.push(r);
  }

  // 5. Mükerrer güvencesi (bankaya karşı, yazmadan hemen önce)
  const parmak = aday.map((r) => questionFingerprint(r.s.kok, Object.values(r.s.siklar)));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } },
    select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = aday.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`parti toplam        : ${sorular.length}`);
  console.log(`karar nedeniyle elendi: ${eleme.karar}   (UYARI/ÇELİŞKİ/ANAHTAR-HATALI/KUSURLU)`);
  console.log(`açıklaması yok      : ${eleme.aciklamaYok}`);
  console.log(`kararı yok (denetim eksik): ${eleme.kararYok}`);
  console.log(`bankada zaten var   : ${aday.length - yazilacak.length}`);
  console.log(`YAZILACAK           : ${yazilacak.length}`);
  const konuDagilim = yazilacak.reduce<Record<string, number>>((a, r) => ({ ...a, [r.konu]: (a[r.konu] ?? 0) + 1 }), {});
  console.log(`konu dağılımı       : ${JSON.stringify(konuDagilim)}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r,
    questionId: randomUUID(),
    versionId: randomUUID(),
    contentHash: questionFingerprint(r.s.kok, Object.values(r.s.siklar)),
    ac: aciklama.get(r.s.id)!,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: satirlar.map((r) => ({ id: r.questionId, topicId: konuId[r.konu], articleNo: null })),
    });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.s.kok, explanation: r.ac.aciklama,
        difficulty: Difficulty.medium,
        sourceLabel: null,           // özgün soru — dış kaynak yok
        contentHash: r.contentHash,
        status: 'in_review' as const, // yayını admin verir
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        Object.entries(r.s.siklar).map(([label, text], i) => ({
          questionVersionId: r.versionId, label, text,
          isCorrect: label === r.dogru, sortOrder: i,
        })),
      ),
    });
    const ref = satirlar.filter((r) => r.ac.dayanak).map((r) => ({
      questionVersionId: r.versionId, citation: r.ac.dayanak!,
    }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · ${ref.length} madde künyesi bağlandı`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
