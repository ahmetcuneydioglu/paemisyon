/**
 * GEÇMİŞ ARŞİV OTURUMLARINI DENEMESİNE BAĞLAR (tek seferlik geri doldurma).
 *
 * `quiz_sessions.archive_exam_id` 7 Eylül 2026'da eklendi; ondan önce arşivde
 * çözülen her oturum bağsız kaldı ve kullanıcı sonucuna bir daha ulaşamadı.
 * Bir kullanıcı 100 soruyu çözüp (D80 Y20, net 75) sonucunu ararken 40 dakikada
 * 20'den fazla boş oturum açtı.
 *
 * Eşleme: oturumun questionOrder'ındaki sürümlerin HEPSİ tek bir denemenin
 * sabitlenmiş soru setinde olmalı. Kişisel deneme (personalExam) oturumları da
 * mode='exam' + examId=null'dır; tam eşleşme şartı onları dışarıda tutar —
 * rastgele seçilmiş 100 sürümün bir denemenin setiyle birebir örtüşmesi
 * pratikte imkânsızdır.
 *
 *   npx tsx scripts/arsiv-oturum-bagla.ts          (kuru)
 *   npx tsx scripts/arsiv-oturum-bagla.ts --yaz
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const YAZ = process.argv.includes('--yaz');

(async () => {
  const denemeler = await p.exam.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, questions: { select: { questionVersionId: true } } },
  });
  const setler = denemeler
    .filter((e) => e.questions.length > 0)
    .map((e) => ({ id: e.id, title: e.title, set: new Set(e.questions.map((q) => q.questionVersionId)) }));
  console.log(`soru seti olan deneme: ${setler.length}`);

  const bagsiz = await p.quizSession.findMany({
    where: { mode: 'exam', examId: null, archiveExamId: null },
    select: {
      id: true,
      userId: true,
      questionOrder: true,
      correctCount: true,
      wrongCount: true,
      startedAt: true,
      user: { select: { email: true } },
    },
    orderBy: { startedAt: 'asc' },
  });
  console.log(`bağsız exam oturumu: ${bagsiz.length}`);

  const eslesen: { id: string; examId: string; baslik: string; ozet: string }[] = [];
  let eslesmeyen = 0;
  let cokluEslesme = 0;
  for (const s of bagsiz) {
    const o = Array.isArray(s.questionOrder) ? (s.questionOrder as string[]) : [];
    if (o.length === 0) {
      eslesmeyen++;
      continue;
    }
    const adaylar = setler.filter((e) => o.every((v) => e.set.has(v)));
    if (adaylar.length === 1) {
      eslesen.push({
        id: s.id,
        examId: adaylar[0].id,
        baslik: adaylar[0].title,
        ozet: `${s.user.email} · ${s.startedAt.toISOString().slice(5, 16)} · D${s.correctCount} Y${s.wrongCount}`,
      });
    } else if (adaylar.length > 1) {
      cokluEslesme++;
    } else {
      eslesmeyen++;
    }
  }

  console.log(`\neşleşen: ${eslesen.length} · eşleşmeyen (kişisel deneme vb.): ${eslesmeyen} · birden çok denemeye uyan: ${cokluEslesme}`);
  const dolu = eslesen.filter((e) => !/D0 Y0$/.test(e.ozet));
  console.log(`bunlardan gerçekten cevap içerenler: ${dolu.length}`);
  for (const e of dolu.slice(0, 12)) console.log(`  ${e.ozet}  → ${e.baslik}`);
  if (dolu.length > 12) console.log(`  … +${dolu.length - 12} tane daha`);

  if (!YAZ) return console.log('\nKURU ÇALIŞMA — uygulamak için --yaz ekle.');
  if (eslesen.length === 0) return console.log('\nBağlanacak oturum yok.');

  let n = 0;
  for (const e of eslesen) {
    await p.quizSession.update({ where: { id: e.id }, data: { archiveExamId: e.examId } });
    n++;
  }
  console.log(`\nTAMAM: ${n} arşiv oturumu denemesine bağlandı.`);
})().finally(() => p.$disconnect());
