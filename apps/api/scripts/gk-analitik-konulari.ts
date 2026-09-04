/**
 * "Genel Kültür ve Analitik Düşünme" dersini gerçek sınavdaki alt bloklara açar.
 *
 * Neden: gerçek sınavın SON 30 sorusu (71-100) tek tip değil —
 *   71-77  güncel / kültür-sanat / kurumlar
 *   78-81  sözel (deyim, sözcük anlamı, anlatım bozukluğu, paragraf)
 *   82-90  analitik akıl yürütme (3 senaryo × 3 soru)
 *   91-100 matematik ve sayısal mantık
 * Bizde ders tek konudan ibaretti (721 soru, hepsi genel kültür), yani üretilen
 * denemenin son 30'u 30 genel kültür sorusu oluyordu. Otomatik doldurma bölüm
 * kotasını KONULARA dengeli dağıttığı için (pickSectionQuestions), konular
 * açılınca blok kendiliğinden çeşitlenir.
 *
 * Mevcut 721 soru "Genel Kültür" konusunda KALIR (kullanıcı kararı).
 * Yeni konular BOŞ başlar; soru geldikçe dolar.
 *
 *   npx tsx scripts/gk-analitik-konulari.ts          (kuru)
 *   npx tsx scripts/gk-analitik-konulari.ts --yaz
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const YAZ = process.argv.includes('--yaz');
const DERS = 'Genel Kültür ve Analitik Düşünme';

/**
 * Sıra gerçek sınavdaki blok sırasıdır. matchKeywords yalnız içe aktarmada
 * KONU ÖNERİR (admin onaylar), o yüzden dar ve ayırt edici tutuldu — "problem",
 * "grafik" gibi genel kelimeler hukuk sorularını da yanlış eşleştirirdi.
 */
const KONULAR = [
  {
    name: 'Genel Kültür',
    sortOrder: 1,
    matchKeywords: [] as string[], // mevcut konu — anahtar kelimelerine dokunulmaz
    mevcut: true,
  },
  {
    name: 'Sözel Yetenek',
    sortOrder: 2,
    matchKeywords: [
      'deyim',
      'sözcükte anlam',
      'cümlede anlam',
      'anlatım bozukluğu',
      'paragrafta anlam',
    ],
    mevcut: false,
  },
  {
    name: 'Analitik Akıl Yürütme',
    sortOrder: 3,
    matchKeywords: ['analitik akıl yürütme', 'sıralama problemi', 'eşleştirme problemi'],
    mevcut: false,
  },
  {
    name: 'Matematik ve Sayısal Mantık',
    sortOrder: 4,
    matchKeywords: ['sayısal mantık', 'işlem şeması', 'şekil dizisi', 'sayı problemi'],
    mevcut: false,
  },
];

(async () => {
  const ders = await p.course.findFirst({ where: { name: DERS, deletedAt: null } });
  if (!ders) return console.log(`Ders bulunamadı: ${DERS}`);

  const varOlan = await p.topic.findMany({
    where: { courseId: ders.id, deletedAt: null },
    select: { id: true, name: true, sortOrder: true, _count: { select: { questions: true } } },
  });

  console.log(`DERS: ${DERS}`);
  console.log('mevcut konular:');
  for (const t of varOlan) console.log(`  ${String(t._count.questions).padStart(4)} soru  ${t.name}`);

  const acilacak = KONULAR.filter((k) => !varOlan.some((t) => t.name === k.name));
  const sirasiDegisecek = KONULAR.filter((k) => {
    const t = varOlan.find((x) => x.name === k.name);
    return t != null && t.sortOrder !== k.sortOrder;
  });

  console.log('\nplan:');
  for (const k of acilacak) console.log(`  + AÇILACAK  ${k.name} (sıra ${k.sortOrder})`);
  for (const k of sirasiDegisecek) {
    const t = varOlan.find((x) => x.name === k.name)!;
    console.log(`  ~ SIRA      ${k.name}: ${t.sortOrder} → ${k.sortOrder}`);
  }
  if (acilacak.length === 0 && sirasiDegisecek.length === 0) {
    return console.log('  değişiklik yok.');
  }
  if (!YAZ) return console.log('\nKURU ÇALIŞMA — uygulamak için --yaz ekle.');

  for (const k of acilacak) {
    await p.topic.create({
      data: {
        courseId: ders.id,
        name: k.name,
        sortOrder: k.sortOrder,
        matchKeywords: k.matchKeywords,
      },
    });
  }
  for (const k of sirasiDegisecek) {
    const t = varOlan.find((x) => x.name === k.name)!;
    await p.topic.update({ where: { id: t.id }, data: { sortOrder: k.sortOrder } });
  }
  console.log(`\nTAMAM: ${acilacak.length} konu açıldı, ${sirasiDegisecek.length} sıra düzeltildi.`);
})().finally(() => p.$disconnect());
