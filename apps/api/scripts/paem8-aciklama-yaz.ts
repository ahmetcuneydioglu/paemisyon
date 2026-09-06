/**
 * Doc 36 — PAEM 8 için üretilen açıklamaları bankaya YENİ SÜRÜM olarak yazar.
 *
 * Bu sorular YAYINDA. Yayındaki bir sürümün metnini yerinde değiştirmek,
 * gözden geçirilmemiş içeriği sessizce canlıya sürmek olur. Onun yerine
 * mevcut sürümün kopyası + açıklama, `in_review` olarak eklenir:
 * `currentVersionId` DEĞİŞMEZ, yani onay verilene kadar uygulamada eski
 * (açıklamasız ama doğru) sürüm görünmeye devam eder.
 *
 * Onay panelden verildiğinde mevcut yayın arşivlenir ve yeni sürüm yayına
 * geçer (admin-questions.service `approve`).
 *
 *   npx tsx scripts/paem8-aciklama-yaz.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem8-aciklama-yaz.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular/paem8-aciklama';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

type Cikti = { no: number; questionId: string; aciklama: string; kaynak?: string | null; kaynakUrl?: string | null };

async function main() {
  const dosyalar = readdirSync(KOK).filter((f) => f.endsWith('-cikti.json')).sort();
  const kayitlar: Cikti[] = [];
  for (const f of dosyalar) {
    const parca: Cikti[] = JSON.parse(readFileSync(`${KOK}/${f}`, 'utf8'));
    kayitlar.push(...parca);
    console.log(`${f}: ${parca.length}`);
  }
  const benzersiz = new Set(kayitlar.map((k) => k.questionId));
  if (benzersiz.size !== kayitlar.length) throw new Error('aynı soru için iki açıklama var');

  const bos = kayitlar.filter((k) => !k.aciklama?.trim());
  if (bos.length) throw new Error(`${bos.length} kayıtta açıklama boş (${bos.map((k) => k.no).join(', ')})`);

  let yeni = 0;
  let atlanan = 0;
  for (const k of kayitlar) {
    const soru = await prisma.question.findUnique({
      where: { id: k.questionId },
      select: {
        currentVersionId: true,
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          select: {
            id: true, versionNo: true, stem: true, difficulty: true, mediaUrl: true,
            sourceLabel: true, contentHash: true, explanation: true, status: true,
            options: { orderBy: { sortOrder: 'asc' }, select: { label: true, text: true, isCorrect: true, sortOrder: true } },
            legalReferences: { select: { citation: true, url: true } },
          },
        },
      },
    });
    if (!soru?.versions.length) { console.log(`  #${k.no} soru bulunamadı`); atlanan++; continue; }
    const son = soru.versions[0];
    // Script iki kez çalışırsa ikinci bir kopya yaratmasın.
    if (son.status === 'in_review' && son.explanation) { atlanan++; continue; }

    if (!APPLY) { yeni++; continue; }
    await prisma.$transaction(async (tx) => {
      await tx.questionVersion.create({
        data: {
          questionId: k.questionId,
          versionNo: son.versionNo + 1,
          stem: son.stem,
          explanation: k.aciklama.trim(),
          difficulty: son.difficulty,
          mediaUrl: son.mediaUrl,
          sourceLabel: son.sourceLabel,
          contentHash: son.contentHash,
          status: 'in_review',
          options: { create: son.options.map((o) => ({ ...o })) },
          legalReferences: {
            create: [
              ...son.legalReferences.map((r) => ({ citation: r.citation, url: r.url })),
              ...(k.kaynakUrl && !son.legalReferences.some((r) => r.url === k.kaynakUrl)
                ? [{ citation: k.kaynak ?? k.kaynakUrl, url: k.kaynakUrl }]
                : []),
            ],
          },
        },
      });
    });
    yeni++;
  }

  console.log(`\naçıklama kaydı ${kayitlar.length} · yeni sürüm ${yeni} · atlanan ${atlanan}`);
  if (!APPLY) console.log('(kuru çalışma — APPLY=1 ile yazılır)');
  else console.log('✓ yeni sürümler onay kuyruğunda; yayındaki sürümler değişmedi');
}
main().finally(() => prisma.$disconnect());
