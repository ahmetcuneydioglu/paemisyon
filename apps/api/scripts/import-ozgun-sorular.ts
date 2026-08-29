/**
 * Özgün soru partisi içe aktarımı (Doc 20 / Doc 25 §4).
 *
 * İLKE: Bu script yalnız İNSAN ONAYINDAN GEÇMİŞ özgün soruları yazar. Kaynağı
 * üçüncü taraf olan (ÖSYM/yayınevi) sorular buradan GEÇMEZ — telif nedeniyle
 * yalnız stil kalibrasyonu için okunur, içeri alınmaz.
 *
 * Sorular `in_review` olarak düşer: admin panelinden yayınlanana dek istemciye
 * sızmaz (admin-questions.service.ts içe aktarımıyla aynı davranış).
 *
 * Kullanım (apps/api içinden):
 *   set -a && source .env && set +a
 *   DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" \
 *     npx tsx scripts/import-ozgun-sorular.ts scripts/ozgun-sorular/<parti>.json [--yaz]
 *
 * --yaz verilmezse yalnız kuru çalışma (doğrulama + mükerrer kontrolü) yapılır.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

type Sik = { label: string; text: string; isCorrect?: boolean };
type Soru = {
  topicId: string;
  articleNo?: string | null;
  stem: string;
  options: Sik[];
  explanation?: string;
  difficulty?: Difficulty;
  sourceLabel: string;
  citation?: string;
  citationUrl?: string;
};

const dosya = process.argv[2];
const yaz = process.argv.includes('--yaz');
if (!dosya) {
  console.error('Kullanım: import-ozgun-sorular.ts <parti.json> [--yaz]');
  process.exit(1);
}

const prisma = new PrismaClient();

function dogrula(sorular: Soru[]) {
  const hatalar: string[] = [];
  sorular.forEach((s, i) => {
    const n = `#${i + 1}`;
    if (!s.topicId) hatalar.push(`${n}: topicId yok`);
    if (!s.stem?.trim()) hatalar.push(`${n}: soru kökü boş`);
    if (!s.sourceLabel?.trim()) hatalar.push(`${n}: sourceLabel zorunlu (şeffaflık)`);
    if (![4, 5].includes(s.options?.length ?? 0))
      hatalar.push(`${n}: 4 veya 5 şık olmalı (${s.options?.length ?? 0})`);
    const dogru = s.options?.filter((o) => o.isCorrect) ?? [];
    if (dogru.length !== 1) hatalar.push(`${n}: tam 1 doğru şık olmalı (${dogru.length})`);
    const etiketler = (s.options ?? []).map((o) => o.label).join('');
    const beklenenEtiketler = s.options?.length === 4 ? 'ABCD' : 'ABCDE';
    if (etiketler !== beklenenEtiketler)
      hatalar.push(`${n}: şık etiketleri ${beklenenEtiketler.split('').join('-')} sırasında olmalı (${etiketler})`);
    if ((s.options ?? []).some((o) => !o.text?.trim())) hatalar.push(`${n}: boş şık metni`);
  });
  return hatalar;
}

(async () => {
  const sorular: Soru[] = JSON.parse(readFileSync(dosya, 'utf8'));
  console.log(`Parti: ${dosya} — ${sorular.length} soru`);

  const hatalar = dogrula(sorular);
  if (hatalar.length) {
    console.error('\nDOĞRULAMA HATALARI:');
    hatalar.forEach((h) => console.error('  ' + h));
    process.exit(1);
  }

  // Konular gerçekten var mı?
  const topicIds = [...new Set(sorular.map((s) => s.topicId))];
  const konular = await prisma.topic.findMany({
    where: { id: { in: topicIds }, deletedAt: null },
    select: { id: true, name: true },
  });
  const eksik = topicIds.filter((id) => !konular.some((k) => k.id === id));
  if (eksik.length) {
    console.error('Bulunamayan konu: ' + eksik.join(', '));
    process.exit(1);
  }

  // Mükerrer kontrolü — parti içi ve veritabanına karşı.
  const satirlar = sorular.map((s) => ({
    s,
    questionId: randomUUID(),
    versionId: randomUUID(),
    contentHash: questionFingerprint(s.stem, s.options.map((o) => o.text)),
  }));
  const partiIci = new Map<string, number>();
  satirlar.forEach((r, i) => {
    if (partiIci.has(r.contentHash)) {
      console.error(`Parti içi mükerrer: #${i + 1} ile #${partiIci.get(r.contentHash)! + 1}`);
      process.exit(1);
    }
    partiIci.set(r.contentHash, i);
  });
  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: satirlar.map((r) => r.contentHash) }, question: { deletedAt: null } },
    select: { contentHash: true },
  });
  if (mevcut.length) {
    const set = new Set(mevcut.map((m) => m.contentHash));
    satirlar
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => set.has(r.contentHash))
      .forEach(({ i }) => console.error(`Veritabanında zaten var: #${i + 1} — ${sorular[i].stem.slice(0, 60)}…`));
    process.exit(1);
  }

  const dagilim: Record<string, number> = {};
  for (const s of sorular) {
    const ad = konular.find((k) => k.id === s.topicId)!.name;
    dagilim[ad] = (dagilim[ad] ?? 0) + 1;
  }
  console.log('Dağılım:', dagilim);

  if (!yaz) {
    console.log('\nKuru çalışma tamam — doğrulama ve mükerrer kontrolü geçti. Yazmak için --yaz ekle.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.question.createMany({
        data: satirlar.map((r) => ({
          id: r.questionId,
          topicId: r.s.topicId,
          articleNo: r.s.articleNo ?? null,
        })),
      });
      await tx.questionVersion.createMany({
        data: satirlar.map((r) => ({
          id: r.versionId,
          questionId: r.questionId,
          versionNo: 1,
          stem: r.s.stem,
          explanation: r.s.explanation ?? null,
          sourceLabel: r.s.sourceLabel,
          contentHash: r.contentHash,
          difficulty: r.s.difficulty ?? Difficulty.medium,
          status: 'in_review' as const, // admin yayınlar — doğrudan yayın YOK
        })),
      });
      await tx.questionOption.createMany({
        data: satirlar.flatMap((r) =>
          r.s.options.map((o, i) => ({
            questionVersionId: r.versionId,
            label: o.label,
            text: o.text,
            isCorrect: !!o.isCorrect,
            sortOrder: i,
          })),
        ),
      });
      const referanslar = satirlar
        .filter((r) => r.s.citation)
        .map((r) => ({
          questionVersionId: r.versionId,
          citation: r.s.citation!,
          url: r.s.citationUrl ?? null,
        }));
      if (referanslar.length) await tx.legalReference.createMany({ data: referanslar });
    },
    { timeout: 60_000, maxWait: 30_000 },
  );

  console.log(`\n${sorular.length} soru yazıldı (status=in_review). Admin panelinden yayınlanabilir.`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
