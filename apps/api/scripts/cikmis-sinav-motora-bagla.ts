/**
 * Doc 36 — çıkmış sınavı deneme motoruna bağlar ("sınav gibi çöz").
 *
 * Mevcut arşiv denemesi akışı tam olarak istediğimiz semantiği taşıyor:
 * sabit soru seti, süreli, tekrarlanabilir, resmî sıralamaya girmez
 * (`quiz.service.startArchiveExam`). Tek gereken, dönem için bir `Exam`
 * kaydı ve sabitlenmiş soru sürümleri.
 *
 * `startAt` sınavın gerçek tarihidir; pencere çoktan kapandığı için akış
 * doğrudan arşiv moduna düşer. Süre, uygulamanın kendi ölçüsünden türetilir
 * (soru başına 75 sn) — resmî süreyi bilmediğimiz için uydurmuyoruz.
 *
 * İPTAL edilen sorular sete GİRMEZ: puanlanmayan soruyu puanlamak, adayın
 * netini yanlış hesaplamak olur. Çıkmış sorular sayfasında görünmeye devam
 * ederler.
 *
 *   npx tsx scripts/cikmis-sinav-motora-bagla.ts <slug>
 *   APPLY=1 npx tsx scripts/cikmis-sinav-motora-bagla.ts <slug>
 */
import { PrismaClient } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
/** quiz.service.EXAM_SECONDS_PER_QUESTION ile aynı ölçü. */
const SANIYE_SORU = 75;
const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('kullanım: cikmis-sinav-motora-bagla.ts <slug>');

  const sinav = await prisma.pastExam.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { orderNo: 'asc' },
        include: { question: { select: { currentVersionId: true, currentVersion: { select: { status: true } } } } },
      },
    },
  });
  if (!sinav) throw new Error(`${slug} bulunamadı`);
  if (sinav.kind !== 'resmi') throw new Error('yalnız resmî sınavlar motora bağlanır');
  if (sinav.examId) throw new Error(`zaten bağlı (examId=${sinav.examId})`);

  const set = sinav.questions.filter(
    (q) => !q.cancelled && q.question.currentVersion?.status === 'published' && q.question.currentVersionId,
  );
  const disarida = sinav.questions.length - set.length;
  const dakika = Math.round((set.length * SANIYE_SORU) / 60);
  console.log(`${sinav.name}`);
  console.log(`  set ${set.length}/${sinav.questions.length} soru · dışarıda ${disarida} (iptal veya yayında değil)`);
  console.log(`  süre ${dakika} dk · başlangıç ${sinav.heldOn?.toISOString().slice(0, 10) ?? '—'}`);
  if (!set.length) throw new Error('sette soru yok — önce sorular yayına alınmalı');
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const exam = await prisma.$transaction(async (tx) => {
    const e = await tx.exam.create({
      data: {
        title: sinav.name,
        description: 'Çıkmış sınav — sabit soru seti, süreli, tekrarlanabilir. Resmî sıralamaya girmez.',
        startAt: sinav.heldOn ?? new Date('2020-01-01'),
        durationMinutes: dakika,
        isPremium: false,
        liveAnswerReveal: false,
        questionsOpenAfterEnd: true,
        // Arşivden çözme denemeye özel bir anahtarla açılıyor ve varsayılanı
        // KAPALI: aynı denemenin tekrar sınavı yapılırken sorular önceden
        // sızıyordu. Çıkmış sınavda böyle bir risk yok — kitapçık resmî
        // cevap anahtarıyla zaten yayımlanmış durumda.
        archiveOpenAfterEnd: true,
        status: 'published',
        sortOrder: sinav.sortOrder,
      },
    });
    await tx.examQuestion.createMany({
      data: set.map((q) => ({
        examId: e.id,
        questionId: q.questionId,
        questionVersionId: q.question.currentVersionId!,
        sortOrder: q.orderNo,
      })),
    });
    await tx.pastExam.update({ where: { id: sinav.id }, data: { examId: e.id } });
    return e;
  });

  console.log(`\n✓ motora bağlandı · examId=${exam.id}`);
  console.log('  uygulama yolu: /sinav/arsiv/' + exam.id);
}
main().finally(() => prisma.$disconnect());
