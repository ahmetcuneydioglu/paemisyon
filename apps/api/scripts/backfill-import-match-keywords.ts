/**
 * PDF/CSV soru içe aktarma sınıflandırması için eksik konu anahtarlarını tamamlar.
 * IDEMPOTENT: mevcut anahtarları silmez; yalnız eksikleri ekler.
 *
 * Çalıştırmadan önce yerel backend'i durdur (Supabase bağlantı limiti).
 * Çalıştırma: npx ts-node scripts/backfill-import-match-keywords.ts
 */
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL as string;
if (!base) throw new Error('DATABASE_URL gerekli.');
const url = base + (base.includes('?') ? '&' : '?') + 'connection_limit=1';
const prisma = new PrismaClient({ datasources: { db: { url } } });

const CMK_KEYWORDS = [
  '5271 sayılı',
  '5271 Sayılı Ceza Muhakemesi Kanunu',
  'Ceza Muhakemesi Kanunu',
  'Ceza Muhakemesi Hukuku',
  'CMK',
  'C.M.K',
];

// Tek başına başka derslerde de sık geçen geniş sözcükler (örn. "Cumhuriyet")
// bilinçli olarak yoktur; yanlış pozitif yerine ayırt edici tarih/olay adları.
const INKILAP_KEYWORDS = [
  'Atatürk İlkeleri ve İnkılap Tarihi',
  'İnkılap Tarihi',
  'Atatürk',
  'Mustafa Kemal',
  'Mondros Ateşkes',
  'Amasya Genelgesi',
  'Erzurum Kongresi',
  'Sivas Kongresi',
  'Misak-ı Millî',
  'Misak-ı Milli',
  'Kurtuluş Savaşı',
  'Millî Mücadele',
  'Milli Mücadele',
  'TBMM’nin açılması',
  "TBMM'nin açılması",
  'Sevr Antlaşması',
  'Lozan Antlaşması',
  'Mudanya Ateşkes',
  'Saltanatın kaldırılması',
  'Halifeliğin kaldırılması',
  'Tevhid-i Tedrisat',
  'Kabotaj Kanunu',
];

function mergeKeywords(current: string[], additions: string[]): string[] {
  const result = [...current];
  const seen = new Set(current.map((x) => x.toLocaleLowerCase('tr-TR')));
  for (const keyword of additions) {
    const key = keyword.toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      result.push(keyword);
      seen.add(key);
    }
  }
  return result;
}

async function updateCanonicalTopic(courseName: string, preferredNames: string[], additions: string[]) {
  const topics = await prisma.topic.findMany({
    where: { course: { name: courseName, deletedAt: null }, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, matchKeywords: true },
  });
  if (topics.length === 0) throw new Error(`Ders/konu bulunamadı: ${courseName}`);

  // Önce hâlihazırda anahtarı olan kanonik kayıt; yoksa tercih edilen ad.
  const target = topics.find((t) => t.matchKeywords.length > 0)
    ?? topics.find((t) => preferredNames.includes(t.name));
  if (!target) throw new Error(`Kanonik konu belirlenemedi: ${courseName}`);

  const next = mergeKeywords(target.matchKeywords, additions);
  if (next.length === target.matchKeywords.length) {
    console.log(`✓ ${courseName} / ${target.name}: zaten güncel`);
    return;
  }
  await prisma.topic.update({ where: { id: target.id }, data: { matchKeywords: next } });
  console.log(`✓ ${courseName} / ${target.name}: ${next.length} anahtar`);
}

async function main() {
  await updateCanonicalTopic('Ceza Muhakemesi Hukuku', ['C.M.K', 'CMK'], CMK_KEYWORDS);
  await updateCanonicalTopic(
    'Atatürk İlkeleri ve İnkılap Tarihi',
    ['Atatürk İlkeleri ve İnkılap Tarihi', 'İnkilap Tarihi'],
    INKILAP_KEYWORDS,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
