/**
 * Doc 35 — kör denetimden geçen güncel bilgi sorularını bankaya yazar.
 *
 * Cevap kaynağı: `arastirma/*.json` (şık dengelemesinden SONRAKİ hâli).
 * Karar dosyaları yalnız hangi sorunun geçeceğini söyler; harf bilgisi
 * dengelemeden önceki hâle ait olduğu için oradan cevap OKUNMAZ.
 *
 * Bu sorularda kaynak KAYITLIDIR ve gizlenmez (kamu duyurusu, resmî kurum).
 * `olayTarihi` sourceLabel'a işlenir: güncel bilgi eskir, ileride eskime
 * taramasının tutamağı budur.
 *
 *   npx tsx scripts/guncel-bankaya-yaz.ts <konuId>            # kuru çalışma
 *   APPLY=1 npx tsx scripts/guncel-bankaya-yaz.ts <konuId>
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';
const APPLY = process.env.APPLY === '1';
const GECER = new Set(['ONAY', 'ZAYIF']);
/**
 * Bankaya yazılmış alanlar; yeniden değerlendirilmez (mükerrer yazım olurdu).
 * Yeni bir alan yazıldıktan sonra buraya eklenir.
 */
const YAZILMIS = new Set(
  (process.env.YAZILMIS ?? 'ekonomi-teknoloji-savunma,kultur-sanat-bilim,spor,turkiye-siyaset-mevzuat,uluslararasi')
    .split(',').map((s) => s.trim()).filter(Boolean),
);
const prisma = new PrismaClient();

async function main() {
  const konuId = process.argv[2];
  if (!konuId) throw new Error('hedef konu id ver');
  const konu = await prisma.topic.findUnique({
    where: { id: konuId }, select: { id: true, name: true, course: { select: { name: true } } },
  });
  if (!konu) throw new Error('konu bulunamadı: ' + konuId);

  const karar = new Map<string, string>();
  for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x)))
    for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) karar.set(k.id, k.karar);

  // Kurtarma turu UYARI'lı soruları yeniden sınıflandırdı: A/B/C/D geçer,
  // E/F elenir. Karar dosyaları bu turdan ÖNCE yazıldığı için kurtarma
  // sonucunu ayrıca okumak gerekir.
  const kurtarma = new Map<string, string>();
  if (existsSync(`${KOK}/kurtarma`))
    for (const f of readdirSync(`${KOK}/kurtarma`).filter((x) => /-oneri\.json$/.test(x)))
      for (const o of JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8'))) kurtarma.set(o.id, o.grup);

  const adaylar: any[] = [];
  const eleme: Record<string, number> = {};
  for (const f of readdirSync(`${KOK}/arastirma`).filter((x) => x.endsWith('.json'))) {
    const alan = f.replace('.json', '');
    if (YAZILMIS.has(alan)) { eleme['zaten-yazildi'] = (eleme['zaten-yazildi'] ?? 0) + (JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8')).sorular?.length ?? 0); continue; }
    const o = JSON.parse(readFileSync(`${KOK}/arastirma/${f}`, 'utf8'));
    (o.sorular ?? []).forEach((s: any, i: number) => {
      const id = `${alan}-${i + 1}`;
      if (s._elendi) { eleme['ELENEN'] = (eleme['ELENEN'] ?? 0) + 1; return; }
      const k = karar.get(id) ?? 'DENETIMSIZ';
      const kg = kurtarma.get(id);
      const gecer = GECER.has(k) || (kg && ['A', 'B', 'C', 'D'].includes(kg));
      if (!gecer) { eleme[kg ? `kurtarma-${kg}` : k] = (eleme[kg ? `kurtarma-${kg}` : k] ?? 0) + 1; return; }
      adaylar.push({ id, alan, ...s });
    });
  }

  const parmak = adaylar.map((s) => questionFingerprint(s.kok, ['A', 'B', 'C', 'D', 'E'].map((l) => s.siklar[l])));
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: parmak }, question: { deletedAt: null } }, select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yazilacak = adaylar.filter((_, i) => !carpisan.has(parmak[i]));

  console.log(`hedef konu   : ${konu.course.name} / ${konu.name}`);
  console.log(`aday         : ${adaylar.length}`);
  console.log(`elenen       : ${JSON.stringify(eleme)}`);
  console.log(`bankada var  : ${adaylar.length - yazilacak.length}`);
  console.log(`YAZILACAK    : ${yazilacak.length}`);
  const dag = yazilacak.reduce<Record<string, number>>((a, r) => ({ ...a, [r.alan]: (a[r.alan] ?? 0) + 1 }), {});
  for (const [d, n] of Object.entries(dag).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  ${d}`);
  const sikDag = yazilacak.reduce<Record<string, number>>((a, r) => ({ ...a, [r.dogru]: (a[r.dogru] ?? 0) + 1 }), {});
  console.log(`şık dağılımı : ${['A', 'B', 'C', 'D', 'E'].map((l) => l + (sikDag[l] ?? 0)).join(' ')}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satirlar = yazilacak.map((s) => ({
    s, questionId: randomUUID(), versionId: randomUUID(),
    contentHash: questionFingerprint(s.kok, ['A', 'B', 'C', 'D', 'E'].map((l) => s.siklar[l])),
  }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({ data: satirlar.map((r) => ({ id: r.questionId, topicId: konu.id, articleNo: null })) });
    await tx.questionVersion.createMany({
      data: satirlar.map((r) => ({
        id: r.versionId, questionId: r.questionId, versionNo: 1,
        stem: r.s.kok, explanation: r.s.aciklama, difficulty: Difficulty.medium,
        sourceLabel: `${r.s.kaynak}${r.s.olayTarihi ? ` (olay: ${r.s.olayTarihi})` : ''}`,
        contentHash: r.contentHash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satirlar.flatMap((r) =>
        ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({
          questionVersionId: r.versionId, label: l, text: String(r.s.siklar[l]),
          isCorrect: l === r.s.dogru, sortOrder: i,
        })),
      ),
    });
    await tx.legalReference.createMany({
      data: satirlar.filter((r) => r.s.kaynakUrl).map((r) => ({
        questionVersionId: r.versionId, citation: r.s.kaynak, url: r.s.kaynakUrl,
      })),
    });
    console.log(`\n✓ ${satirlar.length} soru yazıldı (in_review) · kaynak künyeleri bağlandı`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
