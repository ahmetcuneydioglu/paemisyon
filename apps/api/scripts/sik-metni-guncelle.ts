/**
 * Bir sürümün TEK şıkkındaki ya da AÇIKLAMASINDAKİ bir ibareyi günceller.
 *
 * Dar bir iş için dar bir araç: mevzuat bir kurumun/unvanın ADINI değiştirdiği
 * için şıkta bugün var olmayan bir ibare kalmışsa, o ibareyi yenisiyle
 * değiştirir. Şıkkın İÇERİĞİNİ değiştirmek — yani başka bir şey ölçer hâle
 * getirmek — bu aracın işi DEĞİLDİR; o soruyu yeniden yazmaktır ve insan
 * kararıyla, elden yapılır.
 *
 * Güvenlik kilitleri (biri bile tutmazsa script DURUR):
 *   - aranan ibare o şıkta bir kez geçmeli (sıfır ya da birden çok → hata)
 *   - şıkkın doğru/yanlış olma durumu DEĞİŞTİRİLMEZ
 *   - `contentHash` yeniden hesaplanır; yoksa mükerrer taraması eski metne
 *     göre çalışır ve aynı soru ikinci kez bankaya girebilir
 *   - eski/yeni metin `docs/32-yayin-denetimi/sik-guncelleme.jsonl` defterine
 *     yazılır — canlı içeriği iz bırakmadan değiştirmeyiz
 *
 * Şık düzeltilirken AÇIKLAMA da unutulmamalı: açıklama çoğu zaman şıkkın
 * anlattığı kuralı tekrar eder ve yalnız şıkkı düzeltmek soruyu yarı yanlış
 * bırakır. Bu yüzden `<şık>` yerine `ACIKLAMA` yazılabiliyor.
 *
 *   npx tsx scripts/sik-metni-guncelle.ts <versionId> <şık|ACIKLAMA> <eski> <yeni>
 *   GEREKCE="…" APPLY=1 … ile uygulanır
 */
import { appendFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const GEREKCE = process.env.GEREKCE ?? '';
const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/sik-guncelleme.jsonl`;
const prisma = new PrismaClient();

async function main() {
  const [versionId, sik, eski, yeni] = process.argv.slice(2);
  // `yeni` BOŞ olabilir: bir ibareyi silmek de meşru bir güncellemedir
  // (mülga olmuş bir ibarenin metinden çıkarılması). Boşluk kontrolü
  // "verilmedi" ile "boş verildi"yi ayırmalı.
  if (!versionId || !sik || !eski || yeni === undefined)
    throw new Error('kullanım: sik-metni-guncelle.ts <versionId> <şık> <eski> <yeni>');
  if (APPLY && !GEREKCE) throw new Error('GEREKCE zorunlu — gerekçesiz düzeltme iz bırakmaz');

  const s = await prisma.questionVersion.findUnique({
    where: { id: versionId },
    select: { id: true, stem: true, status: true, explanation: true,
              question: { select: { id: true, deletedAt: true, currentVersionId: true } },
              options: { select: { id: true, label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } },
  });
  if (!s) throw new Error(`${versionId} bulunamadı`);
  const aciklamaKipi = sik === 'ACIKLAMA';
  const o = aciklamaKipi ? null : s.options.find((x) => x.label === sik);
  if (!aciklamaKipi && !o)
    throw new Error(`${sik} şıkkı yok (var olanlar: ${s.options.map((x) => x.label).join(', ')})`);
  const kaynakMetin = aciklamaKipi ? (s.explanation ?? '') : o!.text;

  const kez = kaynakMetin.split(eski).length - 1;
  if (kez !== 1) throw new Error(`${sik} içinde aranan ibare ${kez} kez geçiyor, tek olmalı → ${JSON.stringify(eski)}`);
  const yeniMetin = kaynakMetin.replace(eski, yeni);

  // Açıklama `contentHash`'e girmez (hash kök + şıklardır); şık değişmediyse
  // hash de değişmez.
  const yeniSiklar = s.options.map((x) => (o && x.id === o.id ? yeniMetin : x.text));
  const yeniHash = questionFingerprint(s.stem, yeniSiklar);

  console.log(`sürüm ${s.id} · durum=${s.status}${s.question.deletedAt ? ' · SİLİNMİŞ' : ''}`);
  console.log(`kök : ${s.stem.replace(/\s+/g, ' ').slice(0, 100)}`);
  console.log(`\n${sik} önce : ${kaynakMetin}`);
  console.log(`${sik} sonra: ${yeniMetin}`);
  console.log(`\ndoğru şık: ${s.options.filter((x) => x.isCorrect).map((x) => x.label).join(',')} (değişmiyor)`);
  if (!APPLY) { console.log('\n(kuru çalışma — GEREKCE="…" APPLY=1 ile yazılır)'); return; }

  await prisma.$transaction(async (tx) => {
    if (aciklamaKipi) {
      await tx.questionVersion.update({ where: { id: s.id }, data: { explanation: yeniMetin } });
    } else {
      await tx.questionOption.update({ where: { id: o!.id }, data: { text: yeniMetin } });
      await tx.questionVersion.update({ where: { id: s.id }, data: { contentHash: yeniHash } });
    }
  });
  appendFileSync(DEFTER, JSON.stringify({
    versionId: s.id, questionId: s.question.id, sik, eski: kaynakMetin, yeni: yeniMetin,
    gerekce: GEREKCE, zaman: new Date().toISOString(),
  }) + '\n');
  console.log(`\n✓ güncellendi · iz: ${DEFTER}`);
}
main().finally(() => prisma.$disconnect());
