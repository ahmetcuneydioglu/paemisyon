/**
 * Doc 39 — revizyon sonrası bankada kalan ESKİ soru sürümlerini eler.
 *
 * Sebep: revizyon turu, daha önce KABUL alıp yazılmış bazı soruların şık ya da
 * kökünü değiştirdi. Yazma scripti mükerreri contentHash ile ayıkladığı için
 * değişen metin YENİ soru olarak yazıldı; onay kuyruğunda hem kusurlu hem
 * düzeltilmiş sürüm göründü.
 *
 * Eleme SOFT DELETE'tir (deletedAt) — kayıt silinmez, kuyruktan düşer.
 * Yalnız (a) sourceLabel'ı "Mevzuat türetimi" olan, (b) status=in_review,
 * (c) yayına bağlı OLMAYAN ve (d) güncel aday dosyalarında karşılığı bulunmayan
 * sürümler elenir.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'node:fs';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';
const APPLY = process.env.APPLY === '1';
const p = new PrismaClient();
const SIKLAR = ['A','B','C','D','E'] as const;
const DOC = '../../docs/39-polis-mevzuati-soru-uretimi';
(async () => {
  const guncel = new Set<string>();
  for (const f of readdirSync(`${DOC}/aday`).filter(x => x.endsWith('.json')))
    for (const q of JSON.parse(readFileSync(`${DOC}/aday/${f}`, 'utf8')))
      guncel.add(questionFingerprint(q.kok.trim(), SIKLAR.map(l => q.siklar[l].trim())));

  const hepsi = await p.questionVersion.findMany({
    where: { sourceLabel: { startsWith: 'Mevzuat türetimi' }, status: 'in_review' },
    select: { contentHash: true, question: { select: { id: true, currentVersionId: true, deletedAt: true } } },
  });
  const elenecek = hepsi.filter(v => !guncel.has(v.contentHash!) && !v.question.currentVersionId && !v.question.deletedAt);
  console.log(`in_review mevzuat türetimi : ${hepsi.length}`);
  console.log(`güncel dosyada karşılığı yok: ${elenecek.length}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile elenir)'); return; }
  const r = await p.question.updateMany({
    where: { id: { in: elenecek.map(v => v.question.id) } },
    data: { deletedAt: new Date() },
  });
  console.log(`\n✓ ${r.count} eski sürüm onay kuyruğundan düşürüldü (soft delete)`);
  await p.$disconnect();
})();
