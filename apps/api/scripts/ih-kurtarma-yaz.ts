/**
 * Doc 33 — kurtarma turunda düzeltilen soruları bankaya yazar.
 *
 * Girdi : kurtarma/parca-N-oneri.json  (grup + duzeltme)
 * Kapsam: varsayılan A,B,C,D. E ve F insana kalır; GRUPLAR=A,B,C,D,E ile
 *         genişletilebilir ama E'yi ancak kullanıcı tek tek onayladıysa aç.
 *
 * Metin DÜZELTİLMİŞ hâliyle yazıldığı için parmak izi de düzeltilmiş metinden
 * hesaplanır; mükerrer kontrolü bankaya karşı yeniden yapılır.
 *
 *   npx tsx scripts/ih-kurtarma-yaz.ts              # kuru çalışma
 *   APPLY=1 npx tsx scripts/ih-kurtarma-yaz.ts      # yaz
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';
const APPLY = process.env.APPLY === '1';
const GRUPLAR = new Set((process.env.GRUPLAR ?? 'A,B,C,D').split(','));
const prisma = new PrismaClient();

async function main() {
  // Orijinal soru + konu eşlemesi
  const konuOf = new Map<string, string>();
  const asil = new Map<string, any>();
  for (const f of readdirSync(`${KOK}/parti`).filter((x) => /^b\d+-kor\.json$/.test(x))) {
    const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
    if (!o.konu) continue;
    for (const q of o.sorular) { konuOf.set(q.id, o.konu); asil.set(q.id, q); }
  }

  const oneriler: any[] = [];
  for (const f of readdirSync(`${KOK}/kurtarma`).filter((x) => /-oneri\.json$/.test(x))) {
    oneriler.push(...JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8')));
  }
  const dagilim = oneriler.reduce<Record<string, number>>((a, o) => ({ ...a, [o.grup]: (a[o.grup] ?? 0) + 1 }), {});
  console.log(`öneri dosyası: ${oneriler.length} soru · grup dağılımı ${JSON.stringify(dagilim)}`);

  // Süz + doğrula
  const gecerli: any[] = [];
  const hatali: string[] = [];
  for (const o of oneriler) {
    if (!GRUPLAR.has(o.grup)) continue;
    const d = o.duzeltme;
    if (!d) { hatali.push(`${o.id}: grup ${o.grup} ama düzeltme yok`); continue; }
    const siklar = d.siklar ?? asil.get(o.id)?.siklar;
    if (!siklar || Object.keys(siklar).length !== 5) { hatali.push(`${o.id}: 5 şık yok`); continue; }
    if (Object.values(siklar).some((t: any) => !String(t ?? '').trim())) { hatali.push(`${o.id}: boş şık`); continue; }
    if (!d.dogru || !siklar[d.dogru]) { hatali.push(`${o.id}: doğru şık geçersiz (${d.dogru})`); continue; }
    if (!d.aciklama?.trim()) { hatali.push(`${o.id}: açıklama yok`); continue; }
    const kok = (d.kok ?? asil.get(o.id)?.kok ?? '').trim();
    if (!kok) { hatali.push(`${o.id}: kök yok`); continue; }
    if (!konuOf.has(o.id)) { hatali.push(`${o.id}: konu çözülemedi`); continue; }
    gecerli.push({ ...o, kok, siklar, konu: konuOf.get(o.id)! });
  }
  if (hatali.length) { console.log(`\n⚠ doğrulamadan geçemeyen ${hatali.length}:`); for (const h of hatali) console.log('   ' + h); }

  // Mükerrer (düzeltilmiş metne göre)
  const parmak = gecerli.map((r) => questionFingerprint(r.kok, Object.values(r.siklar) as string[]));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } }, select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = gecerli.filter((_, i) => !carpisan.has(parmak[i]));

  const ders = await prisma.course.findFirst({
    where: { name: { contains: 'İnsan Hakları' }, deletedAt: null },
    select: { topics: { where: { deletedAt: null }, select: { id: true, name: true } } },
  });
  const konuId: Record<string, string> = {
    aihs: ders!.topics.find((t) => t.name.includes('Avrupa İnsan Hakları Sözleşmesi'))!.id,
    'insan-haklari': ders!.topics.find((t) => t.name === 'İnsan Hakları')!.id,
  };

  console.log(`\nkapsam (${[...GRUPLAR].join(',')}) : ${gecerli.length}`);
  console.log(`bankada zaten var        : ${gecerli.length - yazilacak.length}`);
  console.log(`YAZILACAK                : ${yazilacak.length}`);
  console.log(`konu dağılımı            : ${JSON.stringify(yazilacak.reduce<Record<string, number>>((a, r) => ({ ...a, [r.konu]: (a[r.konu] ?? 0) + 1 }), {}))}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satirlar = yazilacak.map((r) => ({
    ...r, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(r.kok, Object.values(r.siklar) as string[]),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({ data: satirlar.map((r) => ({ id: r.questionId, topicId: konuId[r.konu], articleNo: null })) });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.kok, explanation: r.duzeltme.aciklama, difficulty: Difficulty.medium,
        sourceLabel: null, contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        Object.entries(r.siklar).map(([label, text], i) => ({
          questionVersionId: r.versionId, label, text: String(text),
          isCorrect: label === r.duzeltme.dogru, sortOrder: i,
        })),
      ),
    });
    const ref = satirlar.filter((r) => r.duzeltme.dayanak).map((r) => ({ questionVersionId: r.versionId, citation: r.duzeltme.dayanak }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satirlar.length} kurtarılmış soru yazıldı (in_review) · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
