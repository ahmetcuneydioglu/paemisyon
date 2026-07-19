/**
 * Kaynak etiketi (question_versions.source_label) toplu düzenleme — güvenli.
 *
 * DRY-RUN (varsayılan): SEARCH içeren tüm etiketleri + soru sayılarını listeler.
 *   SEARCH=EGM npx ts-node scripts/relabel-source.ts
 *
 * REPLACE (uygula): FROM → TO değişimini SEARCH'lü etiketlerde yapar. Önce dry-run gör!
 *   SEARCH="EGM 8. DÖNEM" FROM=EGM TO=PAEM APPLY=1 npx ts-node scripts/relabel-source.ts
 *
 * Not: Sadece etiket metni değişir (içerik/sürüm değişmez). connection_limit .env'den.
 */
import { PrismaService } from '../src/infra/prisma/prisma.service';

async function main() {
  const search = process.env.SEARCH ?? '';
  const from = process.env.FROM ?? '';
  const to = process.env.TO ?? '';
  const apply = process.env.APPLY === '1';

  if (!search) {
    console.error('SEARCH gerekli (etiketlerde aranacak metin, ör. SEARCH=EGM).');
    process.exit(1);
  }

  const prisma = new PrismaService();
  await prisma.$connect();

  // Envanter: SEARCH içeren farklı etiketler + kaç soru sürümü.
  const rows = await prisma.$queryRaw<{ source_label: string; n: bigint }[]>`
    SELECT source_label, COUNT(*)::bigint AS n
    FROM question_versions
    WHERE source_label ILIKE ${'%' + search + '%'} AND source_label IS NOT NULL
    GROUP BY source_label
    ORDER BY source_label
  `;

  console.log(`\n"${search}" içeren ${rows.length} farklı etiket:\n`);
  let total = 0;
  for (const r of rows) {
    const n = Number(r.n);
    total += n;
    const preview =
      from && r.source_label.includes(from)
        ? `  →  "${r.source_label.split(from).join(to)}"`
        : '';
    console.log(`  [${String(n).padStart(4)}] "${r.source_label}"${preview}`);
  }
  console.log(`\nToplam ${total} soru sürümü.`);

  if (!apply) {
    console.log(
      from
        ? `\n(DRY-RUN) Uygulamak için: SEARCH="${search}" FROM="${from}" TO="${to}" APPLY=1 ...`
        : '\n(DRY-RUN) Değiştirmek için FROM=... TO=... APPLY=1 ekle.',
    );
    await prisma.$disconnect();
    return;
  }

  if (!from) {
    console.error('\nAPPLY için FROM (değişecek metin) gerekli.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Uygula: yalnız SEARCH'lü VE FROM içeren etiketlerde FROM→TO.
  const affected = await prisma.$executeRaw`
    UPDATE question_versions
    SET source_label = REPLACE(source_label, ${from}, ${to})
    WHERE source_label ILIKE ${'%' + search + '%'} AND source_label LIKE ${'%' + from + '%'}
  `;
  console.log(`\n✓ ${affected} soru sürümünün etiketi güncellendi ("${from}" → "${to}").`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Hata:', e instanceof Error ? e.message : e);
  process.exit(1);
});
