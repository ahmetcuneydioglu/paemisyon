/**
 * Arşivlenmiş soruları TOPLU olarak yayına geri alır — konu-arsivle.ts /
 * soru-arsivle.ts deseninin tersi.
 *
 * Neden ayrı script: arsiv-geri-al.ts tek bir sürüm önekiyle çalışıyor ve
 * deftere yazmıyor. Toplu geri alış bir KARARIN uygulanmasıdır (ör. 23 Eyl
 * 2026: "sınavda sözel soru var" → 2 Eyl'de kapsam dışı diye arşivlenen
 * Türkçe sorularının sözel olanları geri alınır); bu yüzden hepsi tek işlemde
 * yapılır ve gerekçesiyle denetim defterine (docs/32-yayin-denetimi/ilerleme.jsonl)
 * işlenir.
 *
 * Geri almadan önce her soru için şunlar aranır; biri tutmazsa HİÇBİRİ yazılmaz:
 *   - soru silinmiş (arşivde) ve en son sürümü `archived`
 *   - 5 şık ve tam bir doğru şık (Beş Şık Kuralı, 8 Eyl 2026)
 *   - aynı içerik parmak izli YAYINDA başka soru yok (mükerrer girmesin)
 *   - konusu silinmemiş
 *
 * Geri alış = sürüm `published` (archivedAt temizlenir) + soru deletedAt=null,
 * currentVersionId=sürüm. Geri almanın tersi yine konu-arsivle.ts --id ile yapılır.
 *
 *   npx tsx scripts/arsiv-toplu-geri-al.ts --gerekce "<neden>" <soru-id-öneki> …          (kuru)
 *   npx tsx scripts/arsiv-toplu-geri-al.ts --gerekce "<neden>" <soru-id-öneki> … --yaz
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// CLAUDE.md: scriptler tek bağlantıyla (Supabase pooler 15 slotu prod ile ortak).
const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const YAZ = process.argv.includes('--yaz');
  const gi = process.argv.indexOf('--gerekce');
  if (gi === -1 || !process.argv[gi + 1]) throw new Error('--gerekce "<neden>" zorunlu: geri alış bir kararın uygulanmasıdır');
  const gerekce = process.argv[gi + 1];
  const onekler = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--gerekce');
  if (!onekler.length) throw new Error('en az bir soru id öneki ver');

  const hatalar: string[] = [];
  const hazir: { questionId: string; versionId: string; konu: string; kok: string }[] = [];

  for (const on of onekler) {
    const qs = await p.$queryRaw<{ id: string }[]>`SELECT id FROM questions WHERE id::text LIKE ${on + '%'}`;
    if (qs.length !== 1) { hatalar.push(`${on}: ${qs.length} soru eşleşti (tam 1 olmalı)`); continue; }
    const q = await p.question.findUniqueOrThrow({
      where: { id: qs[0].id },
      select: {
        id: true, deletedAt: true,
        topic: { select: { name: true, deletedAt: true } },
        versions: {
          orderBy: { versionNo: 'desc' }, take: 1,
          select: { id: true, status: true, stem: true, contentHash: true, options: { select: { isCorrect: true } } },
        },
      },
    });
    const v = q.versions[0];
    const sorun: string[] = [];
    if (!q.deletedAt) sorun.push('soru silinmemiş (zaten yayında olabilir)');
    if (!v || v.status !== 'archived') sorun.push(`son sürüm ${v?.status ?? 'yok'} (archived olmalı)`);
    if (q.topic.deletedAt) sorun.push('konusu silinmiş');
    if (v && v.options.length !== 5) sorun.push(`${v.options.length} şık (Beş Şık Kuralı: 5 olmalı)`);
    if (v && v.options.filter((o) => o.isCorrect).length !== 1) sorun.push('tam bir doğru şık yok');
    if (v?.contentHash) {
      const es = await p.questionVersion.count({
        where: { contentHash: v.contentHash, status: 'published', question: { deletedAt: null, id: { not: q.id } } },
      });
      if (es) sorun.push(`yayında ${es} mükerrer`);
    }
    if (sorun.length) hatalar.push(`${on}: ${sorun.join('; ')}`);
    else hazir.push({ questionId: q.id, versionId: v.id, konu: q.topic.name, kok: v.stem });
  }

  console.log(`gerekçe : ${gerekce}`);
  console.log(`aday    : ${onekler.length} · hazır: ${hazir.length} · sorunlu: ${hatalar.length}\n`);
  for (const h of hazir) console.log(`  ✓ ${h.questionId.slice(0, 8)}  ${h.konu.padEnd(24)} ${h.kok.replace(/\s+/g, ' ').slice(0, 70)}`);
  for (const h of hatalar) console.log(`  ✗ ${h}`);
  if (hatalar.length) { console.log('\nDURDURULDU — sorunlu aday var; hiçbir soru geri alınmadı.'); process.exitCode = 1; return; }
  if (!YAZ) { console.log('\nKURU ÇALIŞMA — uygulamak için --yaz ekle.'); return; }

  const simdi = new Date();
  await p.$transaction(async (tx) => {
    for (const h of hazir) {
      await tx.questionVersion.update({ where: { id: h.versionId }, data: { status: 'published', archivedAt: null } });
      await tx.question.update({ where: { id: h.questionId }, data: { deletedAt: null, currentVersionId: h.versionId } });
    }
  }, { timeout: 120_000 });

  const defter = path.join(__dirname, '../../../docs/32-yayin-denetimi/ilerleme.jsonl');
  fs.appendFileSync(defter, hazir.map((h) => JSON.stringify({
    id: h.questionId.slice(0, 8), konu: h.konu, dayanak: null, sinif: 'geri_alindi',
    bulgu: `ARŞİVDEN GERİ ALINDI — ${gerekce}`, zaman: simdi.toISOString(),
  })).join('\n') + '\n', 'utf-8');

  console.log(`\nTAMAM: ${hazir.length} soru yayına geri alındı.`);
  console.log(`Defter: ${defter}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
