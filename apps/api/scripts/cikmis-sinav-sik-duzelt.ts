/**
 * Yayındaki çıkmış sınav sorularında içe aktarım kaynaklı anahtar / şık metni kusurunu YERİNDE düzeltir
 * (Yayındaki Soru Düzeltme İlkesi: soru kökü değişmez; sürüm açılmaz; review_note yazılır).
 *
 * Girdi: JSON dizi — her öğe
 *   { questionId, correctLabel: "A".."E", optionTexts?: { [label]: resmî metin }, note, appendNote? }
 *   - correctLabel: resmî anahtardaki harf; o şık doğru, diğerleri yanlış yapılır.
 *   - optionTexts: verilen harflerin metni kitapçıktaki resmî metinle değiştirilir (option id'leri aynı
 *     kalır, cevap geçmişi bağını korur); metin değişirse content_hash yeniden hesaplanır.
 *   - note: review_note; appendNote=true ise var olan notun sonuna eklenir.
 * Doğrulama: soru silinmemiş, current version'da correctLabel ve optionTexts'teki her harf mevcut olmalı.
 *
 * Kullanım (apps/api içinden, connection_limit=1 ile):
 *   npx tsx scripts/cikmis-sinav-sik-duzelt.ts <spec.json>            # kuru çalıştırma
 *   npx tsx scripts/cikmis-sinav-sik-duzelt.ts <spec.json> --apply    # yedek yazar, uygular
 * Yedek: scripts/out/sik-duzelt-<zaman>.json. Ardından eski cevaplar için
 * scripts/ingilizce-anahtar-yeniden-puanla.ts (--label/--topic) çalıştırılır.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

type Fix = {
  questionId: string;
  correctLabel: string;
  optionTexts?: Record<string, string> | null;
  note: string;
  appendNote?: boolean;
};

const specPath = process.argv[2];
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  if (!specPath || specPath.startsWith('--')) throw new Error('spec.json yolu ver');
  const fixes: Fix[] = JSON.parse(readFileSync(specPath, 'utf8'));
  const plans = [];
  for (const f of fixes) {
    const q = await prisma.question.findUnique({
      where: { id: f.questionId },
      include: { currentVersion: { include: { options: { orderBy: { sortOrder: 'asc' } } } } },
    });
    if (!q || q.deletedAt || !q.currentVersion) throw new Error(`soru yok/silinmiş: ${f.questionId}`);
    const v = q.currentVersion;
    const byLabel = new Map(v.options.map((o) => [o.label, o]));
    if (!byLabel.has(f.correctLabel)) throw new Error(`${f.questionId}: ${f.correctLabel} şıkkı yok`);
    for (const l of Object.keys(f.optionTexts ?? {})) {
      if (!byLabel.has(l)) throw new Error(`${f.questionId}: ${l} şıkkı yok`);
    }
    const oldCorrect = v.options.find((o) => o.isCorrect)?.label ?? '-';
    const newTexts = v.options.map((o) => f.optionTexts?.[o.label] ?? o.text);
    const textChanged = v.options.some((o, i) => o.text !== newTexts[i]);
    // İdempotent: not zaten yazılmışsa yeniden eklenmez.
    const note = v.reviewNote?.includes(f.note)
      ? v.reviewNote
      : f.appendNote && v.reviewNote ? `${v.reviewNote} ${f.note}` : f.note;
    plans.push({ f, v, oldCorrect, newTexts, textChanged, note });
    console.log(`${f.questionId.slice(0, 8)} [${v.status}] doğru ${oldCorrect} → ${f.correctLabel}` +
      (textChanged ? `; şık metni değişen: ${v.options.filter((o, i) => o.text !== newTexts[i]).map((o) => o.label).join(',')}` : '') +
      (oldCorrect === f.correctLabel && !textChanged ? ' (değişiklik yok)' : ''));
  }
  const effective = plans.filter((p) => p.oldCorrect !== p.f.correctLabel || p.textChanged || p.v.reviewNote !== p.note);
  console.log(`Toplam ${plans.length}; anahtar değişen ${plans.filter((p) => p.oldCorrect !== p.f.correctLabel).length}, ` +
    `şık metni değişen ${plans.filter((p) => p.textChanged).length}, uygulanacak ${effective.length}`);
  if (!apply) {
    console.log('Kuru çalıştırma — --apply verilmedi.');
    return;
  }

  const at = new Date().toISOString();
  const outDir = join(__dirname, 'out');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `sik-duzelt-${at.replace(/[:.]/g, '-')}.json`);
  writeFileSync(outPath, JSON.stringify({ at, spec: specPath, versions: effective.map((p) => p.v) }, null, 2));
  console.log(`Yedek yazıldı: ${outPath}`);

  await prisma.$transaction(async (tx) => {
    for (const p of effective) {
      for (const [i, o] of p.v.options.entries()) {
        await tx.questionOption.update({
          where: { id: o.id },
          data: { isCorrect: o.label === p.f.correctLabel, text: p.newTexts[i] },
        });
      }
      await tx.questionVersion.update({
        where: { id: p.v.id },
        data: {
          reviewNote: p.note,
          ...(p.textChanged ? { contentHash: questionFingerprint(p.v.stem, p.newTexts) } : {}),
        },
      });
    }
  }, { maxWait: 30_000, timeout: 300_000 });
  console.log('Uygulandı.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
