/**
 * Doc 36 — Bir çıkmış sınavın sorularını yayına alır (`in_review` → `published`).
 *
 * Neden ayrı bir script: panelin toplu onayı KONU bazlı çalışıyor
 * (`bulkApprove(topicId)`), yani bir çıkmış sınavı yayınlamak için kullanılsa
 * aynı konudaki ilgisiz bekleyen soruları da (mevzuat türetimleri gibi)
 * beraberinde yayına iterdi. Burada hedef tam olarak o sınavın soru kümesi.
 *
 * Yayın kararı İNSANINDIR: bu script kararı vermez, kararı uygular. Varsayılan
 * kuru çalışma; `APPLY=1` olmadan tek satır yazmaz.
 *
 * Güvenlikler (admin akışıyla aynı + iki tane fazla):
 *   • Tam 1 doğru şık şartı işlem içinde yeniden doğrulanır.
 *   • Açıklaması boş soru yayınlanmaz — Doc 36'ya göre açıklama ürünün kendisi.
 *   • Açıklama Türkçe karakter taşımıyorsa reddedilir: ASCII düzleştirme kazası
 *     sessizce geçmesin (denetim-yayinla.ts'teki ölçütün aynısı).
 *   • Zaten yayındaki sürüm arşivlenir (sürümleme kuralı korunur).
 *
 *   npx tsx scripts/cikmis-sinav-yayinla.ts paem-10-2026
 *   APPLY=1 npx tsx scripts/cikmis-sinav-yayinla.ts paem-10-2026
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1';

/** Türkçe karakter YOĞUNLUĞU ölçütü: düzgün Türkçe metinde bu harfler
 *  ~%4-8 orandadır, eşik kasten çok düşük. Tek karakter aramak yetmiyor,
 *  ASCII'ye düzleştirilmiş metinlerde de arada bir 'ı' geçebiliyor. */
const TR_HARF = /[çğıöşüÇĞİÖŞÜâîû]/g;
const turkceMi = (s: string) => (s.match(TR_HARF)?.length ?? 0) / Math.max(s.length, 1) >= 0.01;

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('slug ver: npx tsx scripts/cikmis-sinav-yayinla.ts paem-10-2026');
  console.log(APPLY ? 'MOD: YAYINLA' : 'MOD: KURU ÇALIŞMA');

  const sinav = await prisma.pastExam.findUnique({
    where: { slug },
    select: {
      id: true, name: true, status: true,
      questions: {
        orderBy: { orderNo: 'asc' },
        select: {
          orderNo: true, cancelled: true,
          question: {
            select: {
              id: true,
              currentVersion: {
                select: {
                  id: true, status: true, explanation: true,
                  options: { select: { isCorrect: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!sinav) throw new Error(`çıkmış sınav bulunamadı: ${slug}`);
  console.log(`${sinav.name}\n  kayıt durumu: ${sinav.status} · ${sinav.questions.length} soru\n`);

  const yayinlanacak: { id: string; no: number }[] = [];
  const zaten: number[] = [];
  const engel: string[] = [];

  for (const q of sinav.questions) {
    const v = q.question.currentVersion;
    if (!v) { engel.push(`#${q.orderNo} güncel sürüm yok`); continue; }
    if (v.status === 'published') { zaten.push(q.orderNo); continue; }
    if (v.status !== 'in_review') { engel.push(`#${q.orderNo} durum ${v.status} (in_review bekleniyordu)`); continue; }
    if (!v.explanation?.trim()) { engel.push(`#${q.orderNo} açıklaması boş`); continue; }
    if (!turkceMi(v.explanation)) { engel.push(`#${q.orderNo} açıklamada Türkçe karakter yok — düzleştirme kazası?`); continue; }
    const dogru = v.options.filter((o) => o.isCorrect).length;
    if (dogru !== 1) { engel.push(`#${q.orderNo} doğru şık sayısı ${dogru}`); continue; }
    yayinlanacak.push({ id: v.id, no: q.orderNo });
  }

  console.log(`yayınlanacak : ${yayinlanacak.length}`);
  console.log(`zaten yayında: ${zaten.length}`);
  console.log(`engelli      : ${engel.length}`);
  for (const e of engel) console.log('  ✗ ' + e);

  if (!APPLY) return console.log('\n(kuru çalışma — APPLY=1 ile yayınlanır)');
  if (engel.length) throw new Error('engelli soru varken yayın yapılmaz');
  if (!yayinlanacak.length) return console.log('\nyapılacak bir şey yok.');

  const simdi = new Date();
  let n = 0;
  for (const y of yayinlanacak) {
    await prisma.$transaction(async (tx) => {
      // Tam 1 doğru şık şartını işlem İÇİNDE bir kez daha doğrula: okuma ile
      // yazma arasında panelden değişmiş olabilir.
      const dogru = await tx.questionOption.count({
        where: { questionVersionId: y.id, isCorrect: true },
      });
      if (dogru !== 1) throw new Error(`#${y.no} doğru şık sayısı ${dogru} — yayın durduruldu`);

      const v = await tx.questionVersion.findUniqueOrThrow({
        where: { id: y.id }, select: { questionId: true },
      });
      await tx.questionVersion.updateMany({
        where: { questionId: v.questionId, status: 'published' },
        data: { status: 'archived', archivedAt: simdi },
      });
      await tx.questionVersion.update({
        where: { id: y.id },
        data: { status: 'published', publishedAt: simdi },
      });
      await tx.question.update({
        where: { id: v.questionId }, data: { currentVersionId: y.id },
      });
    });
    n++;
  }
  console.log(`\n✓ ${n} soru yayına alındı · ${slug}`);
  console.log('Sıradaki: panelden "Yayına al" (dönem görünürlüğü) ve "Motora bağla".');
}
main().finally(() => prisma.$disconnect());
