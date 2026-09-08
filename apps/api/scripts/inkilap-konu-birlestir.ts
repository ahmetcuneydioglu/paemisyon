/**
 * Atatürk İlkeleri ve İnkılap Tarihi dersindeki ÜÇ konuyu tek konuda birleştirir.
 *
 * Ders altında aynı içeriği taşıyan üç kök konu vardı ("Atatürk İlkeleri ve
 * İnkılap Tarihi" ×2 + yazım hatalı "İnkilap Tarihi"). Sınavın kendi başlığı
 * tek: Atatürk İlkeleri ve İnkılap Tarihi; müfredat Trablusgarp'tan I. Dünya
 * Savaşı'na tek bir bütün. Üçe bölünmüş konu ağacı kütüphaneyi, konu bazlı
 * alıştırmayı ve ilerleme/mastery kayıtlarını üçe bölüyordu.
 *
 * HEDEF en çok soruyu tutan konudur — böylece en az satır taşınır. Adı
 * düzeltilir, diğer ikisinin `matchKeywords` birikimi hedefe taşınır.
 *
 * Kullanıcı verisi TOPLANIR, silinmez:
 *   user_topic_progress    : solved/correct toplanır, mastery = correct/solved
 *                            (progress.service.ts'teki formülün aynısı)
 *   topic_mastery_snapshots: (kullanıcı, hafta) başına solved toplanır, mastery
 *                            solved ile ağırlıklı ortalama — snapshot'ta
 *                            correct_count yok, ağırlıklı ortalama o oranın
 *                            birebir yeniden kurulmuş hâli
 *
 * Kaynak konular EN SON, satırları boşaldıktan sonra silinir. FK'ler RESTRICT
 * olduğu için gözden kaçan bir referans varsa silme HATA verir ve işlem geri
 * alınır — emniyet supabı script'te değil, veritabanında.
 *
 *   npx tsx scripts/inkilap-konu-birlestir.ts          # kuru çalışma
 *   APPLY=1 npx tsx scripts/inkilap-konu-birlestir.ts  # uygula
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient, Prisma } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
const DERS_ID = '27bfae51-d79c-48da-9fd0-c6e5ea6dddc6';
const HEDEF = '23d22785-351b-4f39-8516-a419e2c254c0'; // "İnkilap Tarihi" — 435 soru
const KAYNAK = [
  'e699f23d-5bc4-4508-8bcc-8750d911b3e9', // 150 soru + matchKeywords birikimi
  '181c590f-0036-4105-beb5-9ee7c3e5b4b6', // 30 soru
];
const YENI_AD = 'Atatürk İlkeleri ve İnkılap Tarihi';
/** Geri dönüş yedeğinin yazılacağı dizin (repo DIŞI — kullanıcı verisi). */
const YEDEK_DIZIN = process.env.YEDEK_DIZIN ?? '';
const HEPSI = [HEDEF, ...KAYNAK];
const prisma = new PrismaClient();

const ondalik = (x: number) => new Prisma.Decimal(x.toFixed(3));

async function main() {
  const konular = await prisma.topic.findMany({
    where: { id: { in: HEPSI } },
    select: { id: true, name: true, courseId: true, matchKeywords: true, isPremium: true },
  });
  if (konular.length !== 3) throw new Error(`3 konu bekleniyordu, ${konular.length} bulundu`);
  if (konular.some((k) => k.courseId !== DERS_ID)) throw new Error('konular aynı derste değil');
  const cocuk = await prisma.topic.count({ where: { parentId: { in: HEPSI } } });
  if (cocuk) throw new Error(`${cocuk} alt konu var — önce onlar taşınmalı`);
  const madde = await prisma.lawArticle.count({ where: { topicId: { in: KAYNAK } } });
  const mevzuat = await prisma.legislation.count({ where: { topicId: { in: KAYNAK } } });
  if (madde || mevzuat) throw new Error(`kaynak konularda mevzuat bağı var (madde ${madde}, kanun ${mevzuat}) — el ile taşınmalı`);

  // ── Toplanacak kullanıcı verisi ────────────────────────────────────────
  const ilerleme = await prisma.userTopicProgress.findMany({
    where: { topicId: { in: HEPSI } },
    select: { userId: true, topicId: true, solvedCount: true, correctCount: true, lastActivityAt: true },
  });
  const ilerlemeHedef = new Map<string, { solved: number; correct: number; son: Date }>();
  for (const r of ilerleme) {
    const o = ilerlemeHedef.get(r.userId) ?? { solved: 0, correct: 0, son: new Date(0) };
    o.solved += r.solvedCount;
    o.correct += r.correctCount;
    if (r.lastActivityAt > o.son) o.son = r.lastActivityAt;
    ilerlemeHedef.set(r.userId, o);
  }

  const foto = await prisma.topicMasterySnapshot.findMany({
    where: { topicId: { in: HEPSI } },
    select: { userId: true, topicId: true, weekStart: true, mastery: true, solved: true },
  });
  const fotoHedef = new Map<string, { userId: string; weekStart: Date; solved: number; agirlik: number; sayi: number; toplamMastery: number }>();
  for (const r of foto) {
    const k = `${r.userId}|${r.weekStart.toISOString()}`;
    const o = fotoHedef.get(k) ?? { userId: r.userId, weekStart: r.weekStart, solved: 0, agirlik: 0, sayi: 0, toplamMastery: 0 };
    o.solved += r.solved;
    o.agirlik += Number(r.mastery) * r.solved;
    o.toplamMastery += Number(r.mastery);
    o.sayi++;
    fotoHedef.set(k, o);
  }

  const [soru, oturum] = await Promise.all([
    prisma.question.count({ where: { topicId: { in: KAYNAK } } }),
    prisma.quizSession.count({ where: { topicId: { in: KAYNAK } } }),
  ]);
  const anahtarlar = [...new Set(konular.flatMap((k) => k.matchKeywords))].sort();

  console.log('BİRLEŞTİRME PLANI\n');
  for (const k of konular)
    console.log(`  ${k.id === HEDEF ? '→ HEDEF ' : '  kaynak '} ${k.id}  "${k.name}"  (${k.matchKeywords.length} anahtar)`);
  console.log(`\n  hedefin yeni adı      : "${YENI_AD}"`);
  console.log(`  taşınacak soru        : ${soru}`);
  console.log(`  taşınacak quiz oturumu: ${oturum}`);
  console.log(`  ilerleme satırı       : ${ilerleme.length} → ${ilerlemeHedef.size} (${ilerleme.length - ilerlemeHedef.size} satır birleşiyor)`);
  console.log(`  mastery fotoğrafı     : ${foto.length} → ${fotoHedef.size} (${foto.length - fotoHedef.size} satır birleşiyor)`);
  console.log(`  birleşik anahtar      : ${anahtarlar.length}`);
  console.log(`  silinecek konu        : ${KAYNAK.length}`);

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile uygulanır)'); return; }

  // Geri dönüş yedeği: kullanıcı ilerlemesi toplanınca eski satırlar kaybolur.
  // Repoya DEĞİL, scratchpad'e yazılır (kullanıcı verisi commit edilmez).
  if (!YEDEK_DIZIN) throw new Error('YEDEK_DIZIN verilmedi — yedeksiz yazma yok');
  const yedek = {
    tarih: new Date().toISOString(), hedef: HEDEF, kaynak: KAYNAK,
    konular, ilerleme, foto,
    soruIdleri: (await prisma.question.findMany({ where: { topicId: { in: KAYNAK } }, select: { id: true, topicId: true } })),
    oturumIdleri: (await prisma.quizSession.findMany({ where: { topicId: { in: KAYNAK } }, select: { id: true, topicId: true } })),
  };
  const yedekYolu = `${YEDEK_DIZIN}/inkilap-birlestirme-yedek.json`;
  writeFileSync(yedekYolu, JSON.stringify(yedek, null, 1));
  console.log(`\nyedek: ${yedekYolu}  (${yedek.soruIdleri.length} soru · ${ilerleme.length} ilerleme · ${foto.length} fotoğraf)`);

  await prisma.$transaction(async (tx) => {
    // 1) Kullanıcı verisi: önce hepsini sil, sonra toplanmış hâlini yaz.
    await tx.userTopicProgress.deleteMany({ where: { topicId: { in: HEPSI } } });
    await tx.userTopicProgress.createMany({
      data: [...ilerlemeHedef].map(([userId, o]) => ({
        userId, topicId: HEDEF,
        solvedCount: o.solved, correctCount: o.correct,
        mastery: ondalik(o.solved > 0 ? o.correct / o.solved : 0),
        lastActivityAt: o.son,
      })),
    });

    await tx.topicMasterySnapshot.deleteMany({ where: { topicId: { in: HEPSI } } });
    await tx.topicMasterySnapshot.createMany({
      data: [...fotoHedef.values()].map((o) => ({
        userId: o.userId, topicId: HEDEF, weekStart: o.weekStart,
        solved: o.solved,
        mastery: ondalik(o.solved > 0 ? o.agirlik / o.solved : o.toplamMastery / o.sayi),
      })),
    });

    // 2) İçerik ve oturumlar.
    await tx.question.updateMany({ where: { topicId: { in: KAYNAK } }, data: { topicId: HEDEF } });
    await tx.quizSession.updateMany({ where: { topicId: { in: KAYNAK } }, data: { topicId: HEDEF } });

    // 3) Hedefi düzelt, kaynakları sil (FK RESTRICT son kontrolü yapar).
    await tx.topic.update({ where: { id: HEDEF }, data: { name: YENI_AD, matchKeywords: anahtarlar } });
    await tx.topic.deleteMany({ where: { id: { in: KAYNAK } } });
  }, { timeout: 120_000 });

  const kalan = await prisma.topic.findMany({
    where: { courseId: DERS_ID },
    select: { id: true, name: true, _count: { select: { questions: true } } },
  });
  console.log('\n✓ birleşti. Dersin konuları:');
  for (const k of kalan) console.log(`   ${k.id}  "${k.name}"  ${k._count.questions} soru`);
}
main().finally(() => prisma.$disconnect());
