/**
 * BİR DENEMEYİ AYNI SORU SETİYLE YENİ TASLAĞA KOPYALAR.
 *
 * Neden gerekli: bir deneme "tekrar yayınlanamaz". QuizSession'da
 * `@@unique(userId, examId)` var — bir kullanıcı bir denemeye BİR KEZ girer.
 * Yayınlanmış denemenin tarihini ileri almak yeni katılımcılara kapıyı açar
 * ama önceki katılımcıları dışarıda bırakır: 5 Eylül 2026 denemesinde erken
 * bırakan üç kişi (15, 2 ve 54 cevap) düzeltme şansı bulamazdı. Kopya ise
 * herkese açıktır ve eski sonuçlar tarihte bozulmadan kalır.
 *
 * Kopya TASLAK olarak açılır: tarih ve yayın kararı panelden verilir.
 * Soru seti kopyalanırken her sorunun GÜNCEL sürümü bağlanır (yayın anında
 * zaten sabitlenecek); bu arada arşivlenmiş sorular atlanır ve raporlanır.
 *
 *   npx tsx scripts/deneme-kopyala.ts --id <examId>            (kuru)
 *   npx tsx scripts/deneme-kopyala.ts --id <examId> --yaz
 *   npx tsx scripts/deneme-kopyala.ts --id <examId> --baslik "..." --yaz
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const arg = (a: string) => {
  const i = process.argv.indexOf(a);
  return i === -1 ? undefined : process.argv[i + 1];
};

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const id = arg('--id');
  if (!id) return console.log('--id <examId> ver (kopyalanacak deneme).');

  const kaynak = await p.exam.findFirst({ where: { id, deletedAt: null } });
  if (!kaynak) return console.log('Deneme bulunamadı (ya da silinmiş).');

  const sorular = await p.examQuestion.findMany({
    where: { examId: kaynak.id },
    orderBy: { sortOrder: 'asc' },
    select: {
      questionId: true,
      question: {
        select: { deletedAt: true, currentVersionId: true, topic: { select: { name: true } } },
      },
    },
  });
  const uygun = sorular.filter(
    (s) => s.question.deletedAt == null && s.question.currentVersionId != null,
  );
  const atlanan = sorular.filter(
    (s) => s.question.deletedAt != null || s.question.currentVersionId == null,
  );

  const baslik = arg('--baslik') ?? `${kaynak.title} (tekrar)`;
  console.log(`KAYNAK  : ${kaynak.title}`);
  console.log(`  soru  : ${sorular.length} (kopyalanacak ${uygun.length}, atlanan ${atlanan.length})`);
  console.log(`  süre  : ${kaynak.durationMinutes} dk · premium=${kaynak.isPremium}`);
  console.log(`  sorular sınav sonrası açık: ${kaynak.questionsOpenAfterEnd}`);
  for (const a of atlanan.slice(0, 5)) {
    console.log(`    ATLANIYOR (arşivlenmiş): ${a.questionId} · ${a.question.topic.name}`);
  }
  console.log(`\nKOPYA   : ${baslik}  (taslak — tarih ve yayın panelden)`);

  if (kaynak.questionsOpenAfterEnd) {
    console.log(
      '\nUYARI: kaynak denemenin soruları sınav sonrası GÖRÜNTÜLEMEYE AÇIK.\n' +
        '  Aynı soruları tekrar soracaksan, kopyayı yayınlamadan önce kaynak\n' +
        '  denemede bu ayarı KAPAT — yoksa sorular herkese açık durumda kalır.',
    );
  }

  if (!YAZ) return console.log('\nKURU ÇALIŞMA — uygulamak için --yaz ekle.');
  if (uygun.length === 0) return console.log('\nKopyalanacak yayında soru kalmamış.');

  const kopya = await p.$transaction(async (tx) => {
    const e = await tx.exam.create({
      data: {
        title: baslik,
        description: kaynak.description,
        // Yer tutucu: panelden gerçek tarihe çekilecek. Geçmişe kurmuyoruz ki
        // yanlışlıkla "bitmiş" görünmesin.
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: kaynak.durationMinutes,
        isPremium: kaynak.isPremium,
        liveAnswerReveal: kaynak.liveAnswerReveal,
        questionsOpenAfterEnd: kaynak.questionsOpenAfterEnd,
        status: 'draft',
        createdBy: kaynak.createdBy,
      },
    });
    await tx.examQuestion.createMany({
      data: uygun.map((s, i) => ({
        examId: e.id,
        questionId: s.questionId,
        questionVersionId: s.question.currentVersionId!,
        sortOrder: i,
      })),
    });
    return e;
  });

  console.log(`\nTAMAM: taslak oluşturuldu — ${kopya.id}`);
  console.log(`  ${uygun.length} soru bağlandı.`);
  console.log(`  Panel: /exams/${kopya.id}  → tarihi ayarla, gözden geçir, yayınla.`);
})().finally(() => p.$disconnect());
