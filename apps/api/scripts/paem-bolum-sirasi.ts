/**
 * PAEM müfredat bölümlerini GERÇEK SINAV sırasına dizer.
 *
 * Kaynak: 2025 PAEM İlk Derece Amirlik Eğitimi Yazılı Sınavı (A kitapçığı,
 * 100 soru). Gerçek sıra bloklar hâlinde:
 *   1-10  Polis Meslek Mevzuatı        11-20 Ceza Muhakemesi Hukuku
 *   21-30 Ceza Hukuku                  31-40 Anayasa Hukuku
 *   41-50 İdare Hukuku                 51-60 İnsan Hakları
 *   61-70 Atatürk İlkeleri ve İnkılap Tarihi
 *   71-100 Genel Kültür ve Analitik Düşünme  ← SON 30
 *
 * Bizde Genel Kültür BAŞTAYDI ve İnsan Hakları ile Atatürk yer değişikti.
 * Ağırlıklar zaten doğruydu (7×%10 + %30). Otomatik doldurma soruları bölüm
 * sortOrder'ına göre dizdiği için bu tek düzeltme deneme sırasını gerçeğine
 * oturtur.
 *
 *   npx tsx scripts/paem-bolum-sirasi.ts          (kuru)
 *   npx tsx scripts/paem-bolum-sirasi.ts --yaz
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const YAZ = process.argv.includes('--yaz');

/** Gerçek sınavdaki blok sırası. */
const SIRA = [
  'Polis Meslek Mevzuatı',
  'Ceza Muhakemesi Hukuku',
  'Ceza Hukuku',
  'Anayasa Hukuku',
  'İdare Hukuku',
  'İnsan Hakları',
  'Atatürk İlkeleri ve İnkılap Tarihi',
  'Genel Kültür ve Analitik Düşünme',
];

(async () => {
  const bolumler = await p.examSection.findMany({
    where: { deletedAt: null, examType: { name: 'PAEM' } },
    select: { id: true, name: true, sortOrder: true, weightPercent: true },
    orderBy: { sortOrder: 'asc' },
  });

  const eksik = SIRA.filter((ad) => !bolumler.some((b) => b.name === ad));
  const fazla = bolumler.filter((b) => !SIRA.includes(b.name)).map((b) => b.name);
  if (eksik.length || fazla.length) {
    console.log('DURDURULDU — bölüm adları listeyle örtüşmüyor.');
    if (eksik.length) console.log('  listede olup veritabanında olmayan:', eksik.join(', '));
    if (fazla.length) console.log('  veritabanında olup listede olmayan:', fazla.join(', '));
    return;
  }

  console.log('sıra  ağırlık  bölüm                                  değişim');
  const guncellenecek: { id: string; sortOrder: number }[] = [];
  SIRA.forEach((ad, i) => {
    const b = bolumler.find((x) => x.name === ad)!;
    const yeni = i + 1;
    if (b.sortOrder !== yeni) guncellenecek.push({ id: b.id, sortOrder: yeni });
    console.log(
      `  ${String(yeni).padStart(2)}   %${String(b.weightPercent).padStart(3)}  ${ad.padEnd(38)} ${
        b.sortOrder === yeni ? 'aynı' : `${b.sortOrder} → ${yeni}`
      }`,
    );
  });

  if (guncellenecek.length === 0) return console.log('\nSıra zaten doğru.');
  if (!YAZ) return console.log(`\nKURU ÇALIŞMA — ${guncellenecek.length} bölüm güncellenecek. --yaz ekle.`);

  for (const g of guncellenecek) {
    await p.examSection.update({ where: { id: g.id }, data: { sortOrder: g.sortOrder } });
  }
  console.log(`\nTAMAM: ${guncellenecek.length} bölümün sırası güncellendi.`);
})().finally(() => p.$disconnect());
