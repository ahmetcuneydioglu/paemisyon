/**
 * Misyon Koruma çıkmış sınav sorularını (salt okunur) JSON'a döker — resmî anahtarla
 * karşılaştırma için. Kullanım: npx tsx scripts/misyon-banka-disa-aktar.ts <çıktı.json>
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error('çıktı yolu ver');
  const rows = await prisma.$queryRaw<unknown[]>`
    SELECT q.id, qv.id AS version_id, qv.source_label, qv.status::text AS status, qv.stem,
           qv.review_note, t.name AS topic, q.created_at,
           (SELECT json_agg(json_build_object('label', o.label, 'text', o.text, 'ok', o.is_correct, 'sort', o.sort_order, 'id', o.id)
                            ORDER BY o.sort_order)
              FROM question_options o WHERE o.question_version_id = qv.id) AS options
    FROM questions q
    JOIN question_versions qv ON qv.id = q.current_version_id
    LEFT JOIN topics t ON t.id = q.topic_id
    WHERE q.deleted_at IS NULL AND qv.source_label ILIKE '%MİSYON KORUMA%'
    ORDER BY qv.source_label, q.created_at`;
  writeFileSync(out, JSON.stringify(rows, null, 1));
  console.log(`${rows.length} soru yazıldı`);
}

main().finally(() => prisma.$disconnect());
