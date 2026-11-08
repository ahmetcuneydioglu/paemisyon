/**
 * Misyon kapsamından Analitik / Türkçe / Matematik sızıntısını kapatır (9 Kas 2026).
 *
 * Şikâyet (premium Misyon adayı, Instagram DM, 8 Kas 2026): "hedefim Misyon
 * olmasına rağmen koçta hep analitik ve Türkçe çıkıyor". Kök neden VERİ: Misyon'un
 * "Güncel ve Kültürel Konular" bölümü "Genel Kültür ve Analitik Düşünme" dersinin
 * TAMAMINA bağlıydı (Doc 21 §2.3 "PAEM ortak havuzu dahil" kararı). Kapsam birimi
 * DERS olduğu için (koç turu, yanlış tekrarı, hazırlık bloğu, kişisel deneme, plan
 * — hepsi bölüm→ders üzerinden süzer) dersin içindeki Analitik Akıl Yürütme,
 * Türkçe / Dil Bilgisi, Matematik ve Sayısal Mantık, Sözel Yetenek konuları da
 * Misyon kapsamına giriyordu. Misyon sınavında bu bloklar yok.
 *
 * Çözüm (yalnız veri — istemci güncellemesi ve deploy gerekmez):
 *   1. Yeni ders: "Analitik Düşünme ve Türkçe" (ikon lightbulb).
 *   2. Dört yetenek konusu bu derse taşınır (topics.course_id).
 *   3. Yeni ders yalnız PAEM'in "Genel Kültür ve Analitik Düşünme" bölümüne bağlanır.
 *   4. Eski ders "Genel Kültür ve Güncel Olaylar" adını alır (içeriği artık o),
 *      ikonu newspaper olur; PAEM ve Misyon bağları aynen kalır.
 *   5. Misyon'un boş "Güncel ve Kültürel Konular" dersi (0 konu, hiçbir referans yok)
 *      bölümden çözülür ve soft-delete edilir — yeniden adlandırılan ders aynı rolü
 *      dolduruyor; boş ders kartı kalmasın.
 *   6. Eski dersin ders testleri (Doc 49/18; 50 test, 0 oturum) silinir ve iki ders
 *      için yeniden atanır — test setleri derse sabit olduğundan konu taşıması
 *      sonrası eski setlerde yabancı konu kalırdı.
 *
 * PAEM tarafında içerik kaybı yok: bölüm iki dersi birden kapsar (kişisel deneme
 * havuzu, plan müfredatı ve hazırlık bloğu bölüm üzerinden okur). PAEM kullanıcısı
 * ders listesinde bir ders fazla görür.
 *
 * Geri alma: betiğin yazdığı SNAPSHOT satırındaki kimliklerle ters işlemler
 * (konuları eski derse al, bağı sil, adı/ikonu geri yaz, boş dersi diril, testleri
 * sil ve yeniden ata). Yıkıcı tek adım test silme; testler oturumsuz olduğundan
 * yeniden üretim kayıpsızdır.
 *
 *   npx tsx scripts/misyon-gk-ayrimi.ts            (kuru — yalnız rapor)
 *   npx tsx scripts/misyon-gk-ayrimi.ts --apply    (uygula + doğrula)
 *
 * DATABASE_URL'e connection_limit=1 eklenmiş olmalı (Supabase pooler kuralı).
 */
import { PrismaClient } from '@prisma/client';
import { CourseTestsService } from '../src/modules/course-tests/course-tests.service';
import { buildReadiness } from '../src/modules/coach/readiness.logic';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const ESKI_DERS_ADI = 'Genel Kültür ve Analitik Düşünme';
const YENI_ESKI_DERS_ADI = 'Genel Kültür ve Güncel Olaylar';
const YENI_DERS_ADI = 'Analitik Düşünme ve Türkçe';
const BOS_DERS_ADI = 'Güncel ve Kültürel Konular';
const TASINACAK_KONULAR = [
  'Sözel Yetenek',
  'Türkçe / Dil Bilgisi',
  'Analitik Akıl Yürütme',
  'Matematik ve Sayısal Mantık',
];
const KALAN_KONULAR = ['Genel Kültür', 'Güncel ve Kültürel Olaylar'];

/** Hedef sınavın KAPSAMSIZ tur havuzu — quiz.service ile aynı süzgeç (bölüm→ders). */
async function kapsamHavuzu(examKey: string) {
  const rows = await prisma.question.groupBy({
    by: ['topicId'],
    where: {
      deletedAt: null,
      currentVersionId: { not: null },
      topic: {
        deletedAt: null,
        course: {
          deletedAt: null,
          sections: { some: { section: { deletedAt: null, examType: { key: examKey } } } },
        },
      },
    },
    _count: { _all: true },
  });
  const topics = await prisma.topic.findMany({
    where: { id: { in: rows.map((r) => r.topicId) } },
    select: { id: true, name: true, course: { select: { name: true } } },
  });
  const adOf = new Map(topics.map((t) => [t.id, `${t.course.name} › ${t.name}`]));
  return rows
    .map((r) => ({ ad: adOf.get(r.topicId) ?? r.topicId, n: r._count._all }))
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

/** Koçun zayıf konu seçimi — coach.service ile aynı girdiler, aynı saf fonksiyon. */
async function zayifKonular(userId: string) {
  const [sections, progress] = await Promise.all([
    prisma.examSection.findMany({
      where: { deletedAt: null, examType: { preferredUsers: { some: { id: userId } } } },
      orderBy: { sortOrder: 'asc' },
      select: {
        courses: {
          orderBy: { sortOrder: 'asc' },
          select: { course: { select: { id: true, name: true, icon: true, deletedAt: true } } },
        },
      },
    }),
    prisma.userTopicProgress.findMany({
      where: { userId, topic: { deletedAt: null } },
      select: {
        topicId: true,
        solvedCount: true,
        correctCount: true,
        topic: { select: { name: true, courseId: true, course: { select: { name: true } } } },
      },
    }),
  ]);
  const courses = [
    ...new Map(
      sections
        .flatMap((s) => s.courses)
        .filter((sc) => sc.course.deletedAt == null)
        .map((sc) => [
          sc.course.id,
          { courseId: sc.course.id, name: sc.course.name, icon: sc.course.icon },
        ]),
    ).values(),
  ];
  const r = buildReadiness({
    courses,
    progress: progress.map((t) => ({
      topicId: t.topicId,
      topicName: t.topic.name,
      courseId: t.topic.courseId,
      courseName: t.topic.course.name,
      solved: t.solvedCount,
      correct: t.correctCount,
    })),
    weeklyPhoto: [],
    unresolvedWrongCount: 0,
  });
  return {
    dersler: r.courses.map((c) => c.name),
    zayif: r.weakest.map((w) => `${w.courseName} › ${w.name} (${w.solved} soru)`),
  };
}

async function rapor(baslik: string, ornekKullanici: string | null) {
  console.log(`\n═══ ${baslik} ═══`);
  for (const key of ['misyon', 'paem']) {
    const havuz = await kapsamHavuzu(key);
    console.log(`\n${key.toUpperCase()} kapsamsız tur havuzu (ders › konu = yayında soru):`);
    for (const h of havuz) console.log('  ', String(h.n).padStart(5), h.ad);
  }
  if (ornekKullanici) {
    const z = await zayifKonular(ornekKullanici);
    console.log('\nAdayın hazırlık bloğu dersleri:', z.dersler.join(' | '));
    console.log('Adayın koçtaki en zayıf 3 konusu:', z.zayif.join(' | ') || '(yok)');
  }
}

async function main() {
  const eski = await prisma.course.findFirst({
    where: { name: ESKI_DERS_ADI, deletedAt: null },
    select: { id: true, name: true, icon: true, sortOrder: true, topics: { where: { deletedAt: null }, select: { id: true, name: true } } },
  });
  if (!eski) throw new Error(`Ders bulunamadı: ${ESKI_DERS_ADI} (betik zaten uygulanmış olabilir)`);
  const bos = await prisma.course.findFirst({
    where: { name: BOS_DERS_ADI, deletedAt: null },
    select: { id: true, _count: { select: { topics: true, quizSessions: true, dailyFocuses: true, courseTests: true } } },
  });
  const zatenYeni = await prisma.course.findFirst({ where: { name: YENI_DERS_ADI, deletedAt: null } });
  if (zatenYeni) throw new Error(`"${YENI_DERS_ADI}" zaten var — betik idempotent değil, elle kontrol et.`);

  const konuAd = new Map(eski.topics.map((t) => [t.name, t.id]));
  for (const ad of [...TASINACAK_KONULAR, ...KALAN_KONULAR]) {
    if (!konuAd.has(ad)) throw new Error(`Konu eski derste yok: ${ad}`);
  }
  const fazla = eski.topics.filter((t) => ![...TASINACAK_KONULAR, ...KALAN_KONULAR].includes(t.name));
  if (fazla.length) throw new Error(`Eski derste beklenmeyen konu: ${fazla.map((t) => t.name).join(', ')}`);
  const tasinacak = TASINACAK_KONULAR.map((ad) => konuAd.get(ad)!);

  const paemBolum = await prisma.examSection.findFirst({
    where: { deletedAt: null, name: ESKI_DERS_ADI, examType: { key: 'paem' } },
    select: { id: true, name: true, courses: { select: { courseId: true, sortOrder: true } } },
  });
  if (!paemBolum) throw new Error('PAEM "Genel Kültür ve Analitik Düşünme" bölümü bulunamadı');
  const misyonBolum = await prisma.examSection.findFirst({
    where: { deletedAt: null, name: BOS_DERS_ADI, examType: { key: 'misyon' } },
    select: { id: true, courses: { select: { courseId: true, sortOrder: true } } },
  });
  if (!misyonBolum) throw new Error('Misyon "Güncel ve Kültürel Konular" bölümü bulunamadı');

  const eskiTestler = await prisma.courseTest.findMany({
    where: { courseId: eski.id },
    select: { id: true, _count: { select: { sessions: true } } },
  });
  const oturumlu = eskiTestler.filter((t) => t._count.sessions > 0);
  if (oturumlu.length) {
    throw new Error(
      `Eski dersin ${oturumlu.length} testinde oturum var — testleri silmek ilerleme kaybeder; önce karar gerekir.`,
    );
  }
  if (bos && (bos._count.topics || bos._count.quizSessions || bos._count.dailyFocuses || bos._count.courseTests)) {
    throw new Error(`Boş ders boş değil: ${JSON.stringify(bos._count)}`);
  }

  const aday = await prisma.user.findFirst({
    where: { email: 'ferhat-ozturk@outlook.com' },
    select: { id: true },
  });

  console.log('SNAPSHOT (geri alma için):', JSON.stringify({
    eskiDers: { id: eski.id, name: eski.name, icon: eski.icon, sortOrder: eski.sortOrder },
    tasinanKonular: TASINACAK_KONULAR.map((ad) => ({ ad, id: konuAd.get(ad) })),
    paemBolum: { id: paemBolum.id, courses: paemBolum.courses },
    misyonBolum: { id: misyonBolum.id, courses: misyonBolum.courses },
    bosDers: bos?.id ?? null,
    silinecekTest: eskiTestler.length,
  }));

  await rapor('ÖNCE', aday?.id ?? null);

  if (!APPLY) {
    console.log('\nKuru çalışma — değişiklik yazılmadı. Uygulamak için --apply.');
    return;
  }

  const yeniDersId = await prisma.$transaction(async (tx) => {
    const yeni = await tx.course.create({
      data: { name: YENI_DERS_ADI, icon: 'lightbulb', sortOrder: eski.sortOrder + 1 },
      select: { id: true },
    });
    // Yeni ders eski dersin hemen ardına; ardındakiler bir kayar (sortOrder tekil değil, kozmetik).
    await tx.course.updateMany({
      where: { id: { notIn: [eski.id, yeni.id] }, sortOrder: { gt: eski.sortOrder } },
      data: { sortOrder: { increment: 1 } },
    });
    const tasindi = await tx.topic.updateMany({
      where: { id: { in: tasinacak }, courseId: eski.id },
      data: { courseId: yeni.id },
    });
    if (tasindi.count !== tasinacak.length) throw new Error(`Konu taşıma sayısı tutmadı: ${tasindi.count}`);
    await tx.examSectionCourse.create({
      data: {
        sectionId: paemBolum.id,
        courseId: yeni.id,
        sortOrder: Math.max(0, ...paemBolum.courses.map((c) => c.sortOrder)) + 1,
      },
    });
    await tx.course.update({
      where: { id: eski.id },
      data: { name: YENI_ESKI_DERS_ADI, icon: 'newspaper' },
    });
    if (bos) {
      await tx.examSectionCourse.deleteMany({ where: { courseId: bos.id } });
      await tx.course.update({ where: { id: bos.id }, data: { deletedAt: new Date() } });
    }
    const silinen = await tx.courseTest.deleteMany({ where: { courseId: eski.id } });
    console.log(`\nUygulandı: yeni ders ${yeni.id}, ${tasindi.count} konu taşındı, ${silinen.count} eski test silindi.`);
    return yeni.id;
  }, { timeout: 60_000 });

  // Ders testleri yeniden (servisin kendi mantığı — konu sırası + 20'lik setler).
  const tests = new CourseTestsService(prisma as never);
  const a = await tests.assignCourse(eski.id);
  const b = await tests.assignCourse(yeniDersId);
  const [ta, tb] = await Promise.all([
    prisma.courseTest.count({ where: { courseId: eski.id } }),
    prisma.courseTest.count({ where: { courseId: yeniDersId } }),
  ]);
  console.log(`Ders testleri: "${YENI_ESKI_DERS_ADI}" ${a} soru → ${ta} test; "${YENI_DERS_ADI}" ${b} soru → ${tb} test.`);

  await rapor('SONRA', aday?.id ?? null);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
