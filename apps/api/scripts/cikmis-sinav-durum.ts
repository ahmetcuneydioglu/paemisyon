/**
 * Doc 36 — SALT OKUMA: çıkmış sınav dönemlerinin yayın ayarlarını yan yana koyar.
 *
 * Bir dönemi yayına almadan önce bakılacak yer burası. Tek tek panelden
 * gezmek yerine, yeni dönemin ayarlarını yerleşmiş dönemlerle karşılaştırmak
 * için: Premium kapısı, vitrindeki açık soru sayısı, motor bağlantısı ve
 * tanıtım metni aynı hizada mı?
 *
 *   npx tsx scripts/cikmis-sinav-durum.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sinavlar = await prisma.pastExam.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      slug: true, name: true, kind: true, status: true, heldOn: true,
      isPremium: true, questionCount: true, examId: true, summary: true,
      analysis: true,
      questions: { select: { publicly: true, cancelled: true } },
    },
  });

  for (const s of sinavlar) {
    const acik = s.questions.filter((q) => q.publicly).length;
    const iptal = s.questions.filter((q) => q.cancelled).length;
    console.log(
      `${s.slug.padEnd(16)} ${s.kind.padEnd(7)} ${s.status.padEnd(9)} ` +
        `${(s.heldOn?.toISOString().slice(0, 10) ?? '—').padEnd(11)} ` +
        `premium:${s.isPremium ? 'E' : 'H'} ` +
        `soru:${String(s.questions.length).padStart(3)}/${s.questionCount ?? '?'} ` +
        `vitrin:${String(acik).padStart(2)} iptal:${iptal} ` +
        `motor:${s.examId ? 'bağlı' : 'yok'} analiz:${s.analysis ? 'var' : 'yok'}`,
    );
    console.log(`  ${s.summary ? s.summary.slice(0, 160) : '(tanıtım metni yok)'}`);
  }
}
main().finally(() => prisma.$disconnect());
