/**
 * Doc 21 EK — "Polis Mevzuatı" dersini kanonikleştirir. IDEMPOTENT + GÜVENLİ.
 *
 *  - Numarasız gerçek kanunlara resmî kanun no + adı + matchKeywords ekler
 *    (PDF içe aktarma bu başlıkları otomatik tanısın diye).
 *  - Semantik mükerrerleri kanonik konuya birleştirir (varsa soruları TAŞIR,
 *    sonra kaynağı arşivler).
 *  - Çöp konuları (0 soru) arşivler.
 *
 * Çalıştırma: npx ts-node scripts/canonicalize-polis-mevzuati.ts
 */
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL as string;
const url = base + (base.includes('?') ? '&' : '?') + 'connection_limit=1';
const prisma = new PrismaClient({ datasources: { db: { url } } });

// Numarasız → numaralı ad + keyword'ler (resmî kanun numaraları).
const RENAMES: { from: string; to: string; kw: string[] }[] = [
  { from: 'Vatandaşlık Kanunu', to: '5901 Sayılı Türk Vatandaşlığı Kanunu', kw: ['5901 sayılı', 'Türk Vatandaşlığı', 'Vatandaşlık Kanunu'] },
  { from: 'Pasaport Kanunu', to: '5682 Sayılı Pasaport Kanunu', kw: ['5682 sayılı', 'Pasaport Kanunu'] },
  { from: 'Bilgi Edinme Hakkı Kanunu', to: '4982 Sayılı Bilgi Edinme Hakkı Kanunu', kw: ['4982 sayılı', 'Bilgi Edinme'] },
  { from: 'Dernekler Kanunu', to: '5253 Sayılı Dernekler Kanunu', kw: ['5253 sayılı', 'Dernekler Kanunu'] },
  { from: 'Trafik Kanunu', to: '2918 Sayılı Karayolları Trafik Kanunu', kw: ['2918 sayılı', 'Karayolları Trafik', 'Trafik Kanunu'] },
  { from: 'Seçim Kanunu', to: '298 Sayılı Seçimlerin Temel Hükümleri Kanunu', kw: ['298 sayılı', 'Seçimlerin Temel Hükümleri'] },
  { from: 'Mal Bildirimi Kanunu', to: '3628 Sayılı Mal Bildiriminde Bulunulması Kanunu', kw: ['3628 sayılı', 'Mal Bildirimi'] },
  { from: 'Kişisel Verilerin Korunması Kanunu', to: '6698 Sayılı Kişisel Verilerin Korunması Kanunu', kw: ['6698 sayılı', 'Kişisel Verilerin Korunması', 'KVKK'] },
  { from: 'Tanık Koruma Kanunu', to: '5726 Sayılı Tanık Koruma Kanunu', kw: ['5726 sayılı', 'Tanık Koruma'] },
  { from: 'Yabancılar Kanunu', to: '6458 Sayılı Yabancılar ve Uluslararası Koruma Kanunu', kw: ['6458 sayılı', 'Yabancılar ve Uluslararası Koruma'] },
  { from: 'Devlet Memurları Kanunu', to: '657 Sayılı Devlet Memurları Kanunu', kw: ['657 sayılı', 'Devlet Memurları Kanunu'] },
  // Tek numaraya sığmayan / yönetmelik — ad korunur, keyword eklenir:
  { from: 'Ohal ve Sıkıyönetim Kanunu', to: 'Olağanüstü Hâl ve Sıkıyönetim Mevzuatı', kw: ['olağanüstü hal', 'sıkıyönetim', 'OHAL'] },
  { from: 'Rütbe Terfi ve Değerlendirme Kurulları', to: 'Emniyet Rütbe Terfileri ve Değerlendirme Kurulları', kw: ['rütbe terfi', 'değerlendirme kurulları'] },
  { from: 'Performans Yönetmeliği', to: 'Emniyet Performans Değerlendirme Yönetmeliği', kw: ['performans değerlendirme'] },
];

// Semantik mükerrer → kanonik hedef (soru varsa taşınır, sonra arşiv).
const MERGES: { from: string; into: string }[] = [
  { from: 'Sporda Şiddetin Önlenmesi Kanunu', into: '6222 Sayılı Sporda Şiddetin Önlenmesine Dair Kanun' },
  { from: 'Yakalama ve Gözaltına Alma Yönetmeliği', into: 'Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği' },
  { from: '6136 S.K.M', into: '6136 Sayılı Ateşli Silahlar ve Bıçaklar Hakkında Kanun' },
  { from: '4483-Memurların Yargılanması', into: '4483 Sayılı Memurların Yargılanması Hakkında Kanun' },
];

// Çöp (yalnız 0 soru ise arşivlenir).
const ARCHIVE = ['Çeşitli Kanunlar', 'Polisi İlgilendiren Mevzuat'];

async function main() {
  const course = await prisma.course.findFirstOrThrow({
    where: { name: 'Polis Mevzuatı', deletedAt: null },
  });
  const find = (name: string) =>
    prisma.topic.findFirst({ where: { courseId: course.id, name, deletedAt: null } });

  // 1) RENAME (hedef ad zaten varsa → merge'e devret)
  let renamed = 0;
  for (const r of RENAMES) {
    const src = await find(r.from);
    if (!src) continue; // zaten yapılmış (idempotent)
    const existingTarget = await find(r.to);
    if (existingTarget && existingTarget.id !== src.id) {
      // Hedef zaten var: kaynağı hedefe birleştir.
      await mergeTopic(src.id, existingTarget.id, r.from, r.to);
    } else {
      await prisma.topic.update({ where: { id: src.id }, data: { name: r.to, matchKeywords: r.kw } });
      console.log(`  ✎ ${r.from} → ${r.to}`);
    }
    renamed++;
  }

  // 2) MERGE
  let merged = 0;
  for (const m of MERGES) {
    const src = await find(m.from);
    if (!src) continue;
    const target = await find(m.into);
    if (!target) {
      console.log(`  ⚠ birleştirme hedefi yok: ${m.into} (atlandı)`);
      continue;
    }
    await mergeTopic(src.id, target.id, m.from, m.into);
    merged++;
  }

  // 3) ARCHIVE (yalnız boş)
  let archived = 0;
  for (const name of ARCHIVE) {
    const t = await prisma.topic.findFirst({
      where: { courseId: course.id, name, deletedAt: null },
      include: { _count: { select: { questions: { where: { deletedAt: null } } } } },
    });
    if (!t) continue;
    if (t._count.questions > 0) {
      console.log(`  ⚠ ${name}: ${t._count.questions} soru var, arşivlenmedi`);
      continue;
    }
    await prisma.topic.update({ where: { id: t.id }, data: { deletedAt: new Date() } });
    console.log(`  🗑 arşiv: ${name}`);
    archived++;
  }

  console.log(`\nÖzet: ${renamed} numaralandırıldı, ${merged} birleştirildi, ${archived} arşivlendi.`);

  // Kalan durum: numarasız (kanun olması gereken) konu kaldı mı?
  const remaining = await prisma.topic.findMany({
    where: { courseId: course.id, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { name: true },
  });
  const stillNumberless = remaining
    .map((t) => t.name)
    .filter((n) => !/^\d/.test(n) && /kanun/i.test(n));
  console.log('Kalan konu:', remaining.length, '| numarasız KANUN:', stillNumberless.length ? stillNumberless.join(', ') : 'yok ✓');
  await prisma.$disconnect();
}

/** Kaynak konudaki soruları hedefe taşır, kaynağı arşivler. */
async function mergeTopic(srcId: string, targetId: string, srcName: string, targetName: string) {
  const moved = await prisma.question.updateMany({
    where: { topicId: srcId, deletedAt: null },
    data: { topicId: targetId },
  });
  await prisma.topic.update({ where: { id: srcId }, data: { deletedAt: new Date() } });
  console.log(`  ⛓ birleştir: ${srcName} → ${targetName}${moved.count ? ` (${moved.count} soru taşındı)` : ''}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
