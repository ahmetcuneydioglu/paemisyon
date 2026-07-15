/**
 * paem705 içerik aktarımı (kullanıcı kararı, 2026-07-13):
 *  1) İçerik ağacı: eski kategori/konu yapısı yeni kataloğa kurulur (yalnız aktifler).
 *  2) Sorular: YALNIZCA güncelliği az riskli (kanun değişiminden etkilenmeyen)
 *     konular aktarılır ve HEPSİ onay kuyruğuna (in_review) düşer — otomatik
 *     yayın YOK (Doc 9 §4.4). Mevzuat konuları bilinçli olarak DIŞARIDA.
 *
 * Kullanım (apps/api içinden):
 *   npx ts-node scripts/import-legacy-content.ts --dump ../../paem705.sql            # dry-run
 *   npx ts-node scripts/import-legacy-content.ts --dump ../../paem705.sql --apply
 *
 * İdempotent: ders/konu ada göre bulunur, soru aynı konudaki aynı kökle tekrar eklenmez.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DUMP = (() => {
  const i = args.indexOf('--dump');
  return i >= 0 ? args[i + 1] : '../../paem705.sql';
})();

/** Az riskli konular (eski subcategory id'leri) — kanun değişiminden etkilenmez. */
const LOW_RISK_SUBCATS = new Set(['5', '7', '30', '31', '32', '52']);

/** Eski kategori → yeni (modül key, ders adı) eşlemesi. */
const CATEGORY_MAP: Record<string, { moduleKey: string; courseName: string }> = {
  'Genel Mevzuat': { moduleKey: 'paem', courseName: 'Genel Mevzuat' },
  'Polis Mevzuatı': { moduleKey: 'paem', courseName: 'Polis Mevzuatı' },
  'Polis Mevzuat': { moduleKey: 'paem', courseName: 'Polis Mevzuatı' },
  'A.Ö.F': { moduleKey: 'paem', courseName: 'A.Ö.F' },
  'Misyon Koruma': { moduleKey: 'misyon', courseName: 'Misyon Koruma' },
};

// ── Dump ayrıştırma (migrate-paem705-users.ts ile aynı yaklaşım) ──
function parseTuples(block: string): string[][] {
  const tuples: string[][] = [];
  let i = 0;
  while (i < block.length) {
    if (block[i] !== '(') { i++; continue; }
    i++;
    const fields: string[] = [];
    let cur = '';
    let inStr = false;
    for (; i < block.length; i++) {
      const c = block[i];
      if (inStr) {
        if (c === '\\') { cur += block[++i] ?? ''; continue; }
        if (c === "'") { inStr = false; continue; }
        cur += c;
      } else {
        if (c === "'") { inStr = true; continue; }
        if (c === ',') { fields.push(cur.trim()); cur = ''; continue; }
        if (c === ')') { fields.push(cur.trim()); tuples.push(fields); i++; break; }
        cur += c;
      }
    }
  }
  return tuples;
}

function tuplesOf(sql: string, table: string): string[][] {
  const blocks = [...sql.matchAll(new RegExp('INSERT INTO `' + table + '`[^;]*?VALUES\\s*([\\s\\S]*?);\\n', 'g'))];
  return blocks.flatMap((m) => parseTuples(m[1]));
}

/** Hafif metin temizliği: HTML etiketlerini kaldır, boşlukları toparla. */
function clean(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

async function main() {
  const sql = readFileSync(DUMP, 'utf8');
  const cats = new Map(tuplesOf(sql, 'category').map((c) => [c[0], c[2].trim()]));
  const subs = tuplesOf(sql, 'subcategory'); // id, maincat, lang, name, image, status, row
  const questions = tuplesOf(sql, 'question'); // id, cat, sub, lang, image, q, type, a,b,c,d,e, answer, level, note

  // ── 1) İçerik ağacı planı (yalnız aktif konular) ──
  const activeSubs = subs.filter((s) => s[5] === '1');
  const plan = new Map<string, { moduleKey: string; courseName: string; topics: { legacyId: string; name: string }[] }>();
  for (const s of activeSubs) {
    const catName = cats.get(s[1]);
    const map = catName ? CATEGORY_MAP[catName] : undefined;
    if (!map) continue;
    const key = `${map.moduleKey}::${map.courseName}`;
    plan.set(key, plan.get(key) ?? { ...map, topics: [] });
    plan.get(key)!.topics.push({ legacyId: s[0], name: s[3].trim() });
  }

  console.log('── İçerik ağacı planı ──');
  for (const p of plan.values()) {
    console.log(`  [${p.moduleKey}] ${p.courseName}: ${p.topics.length} konu`);
  }

  // ── 2) Soru planı (yalnız az riskli konular) ──
  const bysub = new Map<string, string[][]>();
  for (const q of questions) {
    if (!LOW_RISK_SUBCATS.has(q[2])) continue;
    bysub.set(q[2], [...(bysub.get(q[2]) ?? []), q]);
  }
  const subNameOf = new Map(subs.map((s) => [s[0], s[3].trim()]));
  console.log('\n── Aktarılacak sorular (az riskli konular) ──');
  let totalQ = 0;
  for (const [sid, list] of bysub) {
    console.log(`  ${subNameOf.get(sid)}: ${list.length}`);
    totalQ += list.length;
  }
  console.log(`  TOPLAM: ${totalQ}`);

  if (!APPLY) {
    console.log('\nDRY-RUN — hiçbir şey yazılmadı. Uygulamak için --apply ekle.');
    return;
  }

  // ── Ağacı kur (idempotent) ──
  const topicIdOf = new Map<string, string>(); // legacy sub id → yeni topic id
  for (const p of plan.values()) {
    const module = await prisma.examType.findUnique({ where: { key: p.moduleKey } });
    if (!module) throw new Error(`Modül yok: ${p.moduleKey} — önce seed çalıştır.`);
    let course = await prisma.course.findFirst({
      where: { moduleId: module.id, name: p.courseName, deletedAt: null },
    });
    course ??= await prisma.course.create({
      data: { moduleId: module.id, name: p.courseName, sortOrder: 10 },
    });
    let sort = 0;
    for (const t of p.topics) {
      let topic = await prisma.topic.findFirst({
        where: { courseId: course.id, name: t.name, deletedAt: null },
      });
      topic ??= await prisma.topic.create({
        data: { courseId: course.id, name: t.name, sortOrder: sort },
      });
      sort++;
      topicIdOf.set(t.legacyId, topic.id);
    }
  }
  console.log('\n✅ içerik ağacı hazır.');

  // ── Soruları onay kuyruğuna aktar ──
  const LABELS = ['A', 'B', 'C', 'D', 'E'];
  let imported = 0, skippedInvalid = 0, skippedDupe = 0;
  for (const [sid, list] of bysub) {
    const topicId = topicIdOf.get(sid);
    if (!topicId) continue;

    // Konudaki mevcut kökler (idempotency / tekrar koşum güvenliği).
    const existing = new Set(
      (
        await prisma.questionVersion.findMany({
          where: { question: { topicId, deletedAt: null } },
          select: { stem: true },
        })
      ).map((v) => v.stem),
    );

    const BATCH = 20;
    for (let i = 0; i < list.length; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      await prisma.$transaction(async (tx) => {
        for (const q of chunk) {
          const stem = clean(q[5]);
          const rawOptions = [q[7], q[8], q[9], q[10], q[11] ?? ''].map(clean);
          const answerIdx = 'abcde'.indexOf((q[12] ?? '').trim().toLowerCase().charAt(0));
          // Şıklar baştan itibaren dolu olanlar; boşluk sonrası kesilir (sıralılık).
          const options: { label: string; text: string; isCorrect: boolean }[] = [];
          for (let k = 0; k < 5; k++) {
            if (!rawOptions[k]) break;
            options.push({ label: LABELS[k], text: rawOptions[k], isCorrect: k === answerIdx });
          }
          const valid =
            stem.length >= 5 &&
            options.length >= 2 &&
            options.filter((o) => o.isCorrect).length === 1;
          if (!valid) { skippedInvalid++; continue; }
          if (existing.has(stem)) { skippedDupe++; continue; }
          existing.add(stem);

          const note = clean(q[14] ?? '');
          const created = await tx.question.create({ data: { topicId } });
          await tx.questionVersion.create({
            data: {
              questionId: created.id,
              versionNo: 1,
              stem,
              explanation: note.length >= 3 ? note : null,
              difficulty: 'medium', // eski 'level' zorluk değil test numarasıydı
              status: 'in_review', // onay kuyruğu — otomatik yayın YOK
              options: { create: options.map((o, j) => ({ ...o, sortOrder: j })) },
            },
          });
          imported++;
        }
      }, { timeout: 120_000, maxWait: 30_000 }); // Frankfurt gecikmesi için geniş süre
    }
    console.log(`  ${subNameOf.get(sid)}: tamam`);
  }

  console.log(`\n✅ ${imported} soru onay kuyruğuna aktarıldı.`);
  console.log(`   atlanan: ${skippedInvalid} geçersiz, ${skippedDupe} mükerrer.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
