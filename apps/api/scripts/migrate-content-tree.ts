/**
 * Doc 21 Faz B — İçerik ağacı veri migration'ı. IDEMPOTENT.
 *
 * Yaptıkları:
 *  1. Küresel içerik ders havuzunu kurar (moduleId=null; ada göre upsert).
 *  2. PAEM + Misyon müfredat bölümlerini (ad, %, sıra) ve ders bağlarını kurar.
 *  3. "Polis Mevzuatı"nı kanonik yapar: eski göç dersi yeniden kullanılır
 *     (topicId'ler → mastery/ilerleme korunur), konular kanun-no önekli
 *     kanonik adlara çevrilir, eksikler eklenir.
 *  4. Mevcut konuları (topic) hedef derslere TAŞIR — soru/mastery/snapshot
 *     topicId üzerinde olduğundan hiçbir kullanıcı verisi bozulmaz.
 *  5. Boşalan eski dersleri soft-delete eder (soru kalanlara DOKUNMAZ).
 *  6. Öncesinde JSON yedek, sonrasında korunum raporu üretir.
 *
 * Çalıştırma: npx ts-node scripts/migrate-content-tree.ts
 */
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const url =
  process.env.DATABASE_URL! +
  (process.env.DATABASE_URL!.includes('?') ? '&' : '?') +
  'connection_limit=1';
const prisma = new PrismaClient({ datasources: { db: { url } } });

// ── Hedef içerik ders havuzu (küresel — Doc 21 §2.3) ──
const COURSE_POOL = [
  'Genel Kültür ve Analitik Düşünme',
  'Polis Mevzuatı',
  'Ceza Muhakemesi Hukuku',
  'Ceza Hukuku',
  'Anayasa Hukuku',
  'İdare Hukuku',
  'Atatürk İlkeleri ve İnkılap Tarihi',
  'İnsan Hakları',
  'Protokol Bilgisi',
  'Silah Bilgisi',
  'Güncel ve Kültürel Konular',
  'Yabancı Dil',
] as const;
type PoolCourse = (typeof COURSE_POOL)[number];

// ── Müfredatlar (bölüm adı, %, bağlanan içerik dersleri) ──
const CURRICULUM: Record<string, { name: string; weight: number; courses: PoolCourse[] }[]> = {
  paem: [
    { name: 'Genel Kültür ve Analitik Düşünme', weight: 30, courses: ['Genel Kültür ve Analitik Düşünme'] },
    { name: 'Polis Meslek Mevzuatı', weight: 10, courses: ['Polis Mevzuatı'] },
    { name: 'Ceza Muhakemesi Hukuku', weight: 10, courses: ['Ceza Muhakemesi Hukuku'] },
    { name: 'Ceza Hukuku', weight: 10, courses: ['Ceza Hukuku'] },
    { name: 'Anayasa Hukuku', weight: 10, courses: ['Anayasa Hukuku'] },
    { name: 'İdare Hukuku', weight: 10, courses: ['İdare Hukuku'] },
    { name: 'Atatürk İlkeleri ve İnkılap Tarihi', weight: 10, courses: ['Atatürk İlkeleri ve İnkılap Tarihi'] },
    { name: 'İnsan Hakları', weight: 10, courses: ['İnsan Hakları'] },
  ],
  misyon: [
    { name: 'İnsan Hakları', weight: 10, courses: ['İnsan Hakları'] },
    { name: 'Anayasa ve İdare Hukuku', weight: 10, courses: ['Anayasa Hukuku', 'İdare Hukuku'] },
    { name: 'Polisi İlgilendiren Mevzuat', weight: 20, courses: ['Polis Mevzuatı'] },
    { name: 'Atatürk İlkeleri ve İnkılap Tarihi', weight: 10, courses: ['Atatürk İlkeleri ve İnkılap Tarihi'] },
    { name: 'Protokol Bilgisi', weight: 10, courses: ['Protokol Bilgisi'] },
    { name: 'Silah Bilgisi', weight: 20, courses: ['Silah Bilgisi'] },
    { name: 'Güncel ve Kültürel Konular', weight: 10, courses: ['Güncel ve Kültürel Konular'] },
    { name: 'Yabancı Dil', weight: 10, courses: ['Yabancı Dil'] },
  ],
};

// ── Polis Mevzuatı kanonik konuları (Doc 21 §2.4, kanun no önekli) ──
// legacyNames: eski göç dersindeki karşılıkları (yeniden adlandırılır — topicId korunur).
const POLIS_TOPICS: { name: string; kw: string[]; legacyNames?: string[] }[] = [
  { name: '3201 Sayılı Emniyet Teşkilat Kanunu', kw: ['3201 sayılı', 'Emniyet Teşkilat'], legacyNames: ['3201 E.T.K', 'Emniyet Teşkilat Kanunu'] },
  { name: '2559 Sayılı Polis Vazife ve Salâhiyet Kanunu (PVSK)', kw: ['2559 sayılı', 'PVSK', 'Polis Vazife'], legacyNames: ['P.V.S.K', 'PVSK'] },
  { name: '7068 Sayılı Genel Kolluk Disiplin Hükümleri Kanunu', kw: ['7068 sayılı', 'Kolluk Disiplin'], legacyNames: ['7068 Sayılı Kanun'] },
  { name: '4483 Sayılı Memurların Yargılanması Hakkında Kanun', kw: ['4483 sayılı', 'Memurlar ve Diğer Kamu Görevlilerinin Yargılanması'], legacyNames: ['4483 Sayılı Kanun'] },
  { name: '5326 Sayılı Kabahatler Kanunu', kw: ['5326 sayılı', 'Kabahatler'], legacyNames: ['Kabahatler Kanunu'] },
  { name: '3713 Sayılı Terörle Mücadele Kanunu', kw: ['3713 sayılı', 'Terörle Mücadele'], legacyNames: ['Terörle Mücadele Kanunu'] },
  { name: '2911 Sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu', kw: ['2911 sayılı', 'Toplantı ve Gösteri'], legacyNames: ['Toplantı ve Gösteri Yürüyüşleri Kanunu', '2911 Sayılı Kanun'] },
  { name: '6136 Sayılı Ateşli Silahlar ve Bıçaklar Hakkında Kanun', kw: ['6136 sayılı', 'Ateşli Silahlar'], legacyNames: ['Ateşli Silahlar Kanunu', '6136 Sayılı Kanun'] },
  { name: '6222 Sayılı Sporda Şiddetin Önlenmesine Dair Kanun', kw: ['6222 sayılı', 'Sporda Şiddet'], legacyNames: ['Sporda Şiddet Kanunu'] },
  { name: '1774 Sayılı Kimlik Bildirme Kanunu', kw: ['1774 sayılı', 'Kimlik Bildirme'], legacyNames: ['Kimlik Bildirme Kanunu'] },
  { name: '5395 Sayılı Çocuk Koruma Kanunu', kw: ['5395 sayılı', 'Çocuk Koruma Kanunu'], legacyNames: ['Çocuk Koruma Kanunu'] },
  { name: '6284 Sayılı Ailenin Korunması Kanunu', kw: ['6284 sayılı', 'Kadına Karşı Şiddet', 'Ailenin Korunması'], legacyNames: ['Kadına Karşı Şiddetin Önlenmesi Kanunu', 'Ailenin Korunması Kanunu'] },
  { name: '7245 Sayılı Çarşı ve Mahalle Bekçileri Kanunu', kw: ['7245 sayılı', 'Mahalle Bekçileri'], legacyNames: ['Çarşı ve Mahalle Bekçileri Kanunu', 'Bekçiler Kanunu'] },
  { name: '772 Sayılı Asayişe Müessir Fiillerin Önlenmesi Kanunu', kw: ['772 sayılı', 'Asayişe Müessir'], legacyNames: ['Asayişe Müessir Kanun'] },
  { name: 'Adli ve Önleme Aramaları Yönetmeliği', kw: ['Önleme Aramaları', 'Adli ve Önleme'], legacyNames: ['Adli ve Önleme Aramaları Yönetmeliği'] },
  { name: 'Adli Kolluk Yönetmeliği', kw: ['Adli Kolluk'], legacyNames: ['Adli Kolluk Yönetmeliği'] },
  { name: 'Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği', kw: ['Yakalama, Gözaltına Alma', 'İfade Alma'], legacyNames: ['Yakalama Gözaltına Alma Yönetmeliği', 'Yakalama Yönetmeliği'] },
  { name: 'Çocuk Koruma Kanunu Uygulama Yönetmeliği', kw: ['Çocuk Koruma Kanununun Uygulanmasına'], legacyNames: ['Çocuk Koruma Yönetmeliği'] },
  { name: 'Emniyet Atama ve Yer Değiştirme Yönetmeliği', kw: ['Atama ve Yer Değiştirme'], legacyNames: ['Atama ve Yer Değiştirme Yönetmeliği'] },
  { name: 'Polis Merkezi Amirliği Yönetmeliği', kw: ['Polis Merkezi Amirliği'], legacyNames: ['Polis Merkezi Amirliği Yönetmeliği'] },
];

// ── Konu taşıma eşlemesi: (eski ders adı, eski konu adı) → hedef ders ──
// Konu TAŞINIR (courseId değişir) — topicId sabit: soru/mastery/koç bozulmaz.
const TOPIC_MOVES: { fromCourse: string; topic: string; toCourse: PoolCourse }[] = [
  // Eski göç: Genel Mevzuat
  { fromCourse: 'Genel Mevzuat', topic: 'İnkilap Tarihi', toCourse: 'Atatürk İlkeleri ve İnkılap Tarihi' },
  { fromCourse: 'Genel Mevzuat', topic: 'Genel Kültür', toCourse: 'Genel Kültür ve Analitik Düşünme' },
  { fromCourse: 'Genel Mevzuat', topic: 'Anayasa', toCourse: 'Anayasa Hukuku' },
  { fromCourse: 'Genel Mevzuat', topic: 'İdare Hukuku', toCourse: 'İdare Hukuku' },
  { fromCourse: 'Genel Mevzuat', topic: 'Türk Ceza Kanunu', toCourse: 'Ceza Hukuku' },
  { fromCourse: 'Genel Mevzuat', topic: 'C.M.K', toCourse: 'Ceza Muhakemesi Hukuku' },
  { fromCourse: 'Genel Mevzuat', topic: 'İnsan Hakları', toCourse: 'İnsan Hakları' },
  // Eski göç: A.Ö.F + Misyon Koruma
  { fromCourse: 'A.Ö.F', topic: 'Atatürk İlkeleri ve İnkılap Tarihi', toCourse: 'Atatürk İlkeleri ve İnkılap Tarihi' },
  { fromCourse: 'Misyon Koruma', topic: 'Protokol Bilgisi', toCourse: 'Protokol Bilgisi' },
  { fromCourse: 'Misyon Koruma', topic: 'Silah Bilgisi', toCourse: 'Silah Bilgisi' },
  { fromCourse: 'Misyon Koruma', topic: 'İngilizce', toCourse: 'Yabancı Dil' },
  // Doc 20 taksonomisi
  { fromCourse: 'Anayasa ve İnkılap Tarihi', topic: 'T.C. Anayasası', toCourse: 'Anayasa Hukuku' },
  { fromCourse: 'Anayasa ve İnkılap Tarihi', topic: 'Atatürk İlkeleri ve İnkılap Tarihi', toCourse: 'Atatürk İlkeleri ve İnkılap Tarihi' },
  { fromCourse: 'İdare Hukuku ve Mahalli İdareler', topic: '*', toCourse: 'İdare Hukuku' },
  { fromCourse: 'Genel Yetenek ve Genel Kültür', topic: 'Türkçe / Dil Bilgisi', toCourse: 'Genel Kültür ve Analitik Düşünme' },
  // Dev örnek Anayasa dersi konuları gerçek Anayasa Hukuku'na
  { fromCourse: 'Anayasa Hukuku', topic: 'Temel Kavramlar', toCourse: 'Anayasa Hukuku' },
  { fromCourse: 'Anayasa Hukuku', topic: 'Temel Hak ve Hürriyetler', toCourse: 'Anayasa Hukuku' },
  { fromCourse: 'Anayasa Hukuku', topic: 'Yasama', toCourse: 'Anayasa Hukuku' },
];

// Bölümlere bağlanmadan havuzda kalacaklar (panelde karar verilecek — Doc 21 §3.B):
// 'Memur ve Kamu Mevzuatı', 'Adli ve İdari Yazı İşleri Mevzuatı', 'Polis Mevzuatı' fazlası,
// 'Deneme E2E Dersi' (deneme sınavları + e2e buna bağlı — dokunulmaz).

async function main() {
  // ── 0. YEDEK: konu→ders ve ders listesi (geri dönüş için) ──
  const backup = {
    at: new Date().toISOString(),
    courses: await prisma.course.findMany({ select: { id: true, name: true, moduleId: true, deletedAt: true } }),
    topics: await prisma.topic.findMany({ select: { id: true, name: true, courseId: true, parentId: true } }),
  };
  const backupPath = `/tmp/content-tree-backup-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log('Yedek:', backupPath, `(${backup.courses.length} ders, ${backup.topics.length} konu)`);

  const qBefore = await prisma.question.count({ where: { deletedAt: null } });

  // ── 1. Küresel ders havuzu ──
  // ÖNEMLİ: kanonik "Polis Mevzuatı" için eski göç dersi yeniden kullanılır.
  const courseByName = new Map<string, string>();
  for (let i = 0; i < COURSE_POOL.length; i++) {
    const name = COURSE_POOL[i];
    // Önce mevcut (silinmemiş) aynı adlı dersi ara — varsa küreselleştir.
    let course = await prisma.course.findFirst({ where: { name, deletedAt: null } });
    if (course) {
      course = await prisma.course.update({
        where: { id: course.id },
        data: { moduleId: null, sortOrder: i + 1 },
      });
    } else {
      course = await prisma.course.create({ data: { name, moduleId: null, sortOrder: i + 1 } });
    }
    courseByName.set(name, course.id);
  }
  console.log('1) Ders havuzu hazır:', COURSE_POOL.length, 'küresel ders');

  // ── 2. Müfredat bölümleri + ders bağları ──
  for (const [examKey, sections] of Object.entries(CURRICULUM)) {
    const examType = await prisma.examType.findUnique({ where: { key: examKey } });
    if (!examType) throw new Error(`Sınav türü yok: ${examKey}`);
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      let section = await prisma.examSection.findFirst({
        where: { examTypeId: examType.id, name: s.name, deletedAt: null },
      });
      section ??= await prisma.examSection.create({
        data: { examTypeId: examType.id, name: s.name, weightPercent: s.weight, sortOrder: i + 1 },
      });
      await prisma.examSection.update({
        where: { id: section.id },
        data: { weightPercent: s.weight, sortOrder: i + 1 },
      });
      for (let ci = 0; ci < s.courses.length; ci++) {
        const courseId = courseByName.get(s.courses[ci])!;
        await prisma.examSectionCourse.upsert({
          where: { sectionId_courseId: { sectionId: section.id, courseId } },
          update: { sortOrder: ci + 1 },
          create: { sectionId: section.id, courseId, sortOrder: ci + 1 },
        });
      }
    }
    const total = sections.reduce((s, x) => s + x.weight, 0);
    console.log(`2) ${examKey.toUpperCase()} müfredatı: ${sections.length} bölüm, toplam %${total}`);
  }

  // ── 3. Polis Mevzuatı kanonik konuları ──
  const polisCourseId = courseByName.get('Polis Mevzuatı')!;
  let renamed = 0;
  let created = 0;
  for (let i = 0; i < POLIS_TOPICS.length; i++) {
    const t = POLIS_TOPICS[i];
    // Kanonik ad zaten var mı?
    let topic = await prisma.topic.findFirst({
      where: { courseId: polisCourseId, name: t.name, deletedAt: null },
    });
    if (!topic) {
      // Eski adlardan biriyle var mı? → yeniden adlandır (topicId korunur).
      for (const legacy of t.legacyNames ?? []) {
        const found = await prisma.topic.findFirst({
          where: { courseId: polisCourseId, name: legacy, deletedAt: null },
        });
        if (found) {
          topic = await prisma.topic.update({
            where: { id: found.id },
            data: { name: t.name, sortOrder: i + 1, matchKeywords: t.kw },
          });
          renamed++;
          break;
        }
      }
    }
    if (!topic) {
      await prisma.topic.create({
        data: { courseId: polisCourseId, name: t.name, sortOrder: i + 1, matchKeywords: t.kw },
      });
      created++;
    } else if (topic.matchKeywords.length === 0) {
      await prisma.topic.update({ where: { id: topic.id }, data: { matchKeywords: t.kw } });
    }
  }
  console.log(`3) Polis Mevzuatı: ${renamed} konu kanonik ada çevrildi, ${created} yeni eklendi`);

  // ── 4. Konu taşımaları ──
  let moved = 0;
  for (const mv of TOPIC_MOVES) {
    const toCourseId = courseByName.get(mv.toCourse)!;
    const fromCourses = await prisma.course.findMany({
      where: { name: mv.fromCourse, deletedAt: null, id: { not: toCourseId } },
    });
    for (const fc of fromCourses) {
      const topics = await prisma.topic.findMany({
        where: {
          courseId: fc.id,
          deletedAt: null,
          ...(mv.topic === '*' ? {} : { name: mv.topic }),
        },
      });
      for (const t of topics) {
        await prisma.topic.update({ where: { id: t.id }, data: { courseId: toCourseId } });
        moved++;
      }
    }
  }
  console.log(`4) ${moved} konu hedef derslere taşındı (topicId'ler korunarak)`);

  // ── 5. Boşalan eski dersleri soft-delete (soru/konu kalanlara dokunma) ──
  const KEEP = new Set([...COURSE_POOL, 'Deneme E2E Dersi']);
  const oldCourses = await prisma.course.findMany({
    where: { deletedAt: null, name: { notIn: [...KEEP] } },
    include: { topics: { where: { deletedAt: null }, select: { id: true } } },
  });
  let softDeleted = 0;
  const leftForPanel: string[] = [];
  for (const c of oldCourses) {
    if (c.topics.length === 0) {
      await prisma.course.update({ where: { id: c.id }, data: { deletedAt: new Date() } });
      softDeleted++;
    } else {
      // İçinde konu kalanlar havuzda (bölümsüz) durur — panelde karar verilir.
      await prisma.course.update({ where: { id: c.id }, data: { moduleId: null } });
      leftForPanel.push(`${c.name} (${c.topics.length} konu)`);
    }
  }
  console.log(`5) ${softDeleted} boş ders arşivlendi; panelde karar bekleyen: ${leftForPanel.join(', ') || 'yok'}`);

  // ── 6. Korunum + dağılım raporu ──
  const qAfter = await prisma.question.count({ where: { deletedAt: null } });
  console.log(`6) Soru korunumu: önce ${qBefore} → sonra ${qAfter} ${qBefore === qAfter ? '✓' : '✗ SORUN!'}`);
  if (qBefore !== qAfter) process.exit(1);

  console.log('--- Yeni dağılım (küresel dersler) ---');
  for (const name of COURSE_POOL) {
    const id = courseByName.get(name)!;
    const topics = await prisma.topic.count({ where: { courseId: id, deletedAt: null } });
    const qs = await prisma.question.count({
      where: { deletedAt: null, topic: { courseId: id } },
    });
    console.log(`   ${name}: ${topics} konu, ${qs} soru`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
