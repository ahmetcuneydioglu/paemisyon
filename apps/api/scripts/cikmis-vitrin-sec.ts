/**
 * Doc 36 — bir çıkmış sınavın public sayfasında görünecek soruları seçer.
 *
 * Kullanıcı kararı: dönem başına 20 soru açık, kalanı uygulamada. Seçim
 * konu dağılımına ORANTILI: aday sınavın gerçek karışımını görür, "paem 9 tck
 * soruları" gibi uzun kuyruk aramaları da karşılanır.
 *
 * Tercih sırası (deterministik, tohum = kitapçık sırası):
 *   1. Açıklaması olan soru — public sayfanın işi cevabı değil GEREKÇEYİ
 *      göstermek; açıklamasız soru vitrini PDF seviyesine düşürür.
 *   2. Şıkları eksiksiz ve yayında olan soru.
 *   3. İptal edilmiş soru vitrine hiç girmez (puanlanmayan soruyla karşılama).
 *
 *   npx tsx scripts/cikmis-vitrin-sec.ts <slug>            # kuru çalışma
 *   APPLY=1 npx tsx scripts/cikmis-vitrin-sec.ts <slug>
 *   ACIK=25 ... ile açık soru sayısı değiştirilebilir.
 */
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
const ACIK = Number(process.env.ACIK ?? 20);
const prisma = new PrismaClient();

const tohum = (slug: string, n: number) =>
  parseInt(createHash('sha256').update(`${slug}-${n}`).digest('hex').slice(0, 8), 16);

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('kullanım: cikmis-vitrin-sec.ts <slug>');

  const sinav = await prisma.pastExam.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!sinav) throw new Error(`${slug} bulunamadı`);

  const kayitlar = await prisma.pastExamQuestion.findMany({
    where: { pastExamId: sinav.id },
    select: {
      questionId: true,
      orderNo: true,
      cancelled: true,
      question: {
        select: {
          topic: { select: { name: true, course: { select: { name: true } } } },
          currentVersion: { select: { status: true, explanation: true } },
        },
      },
    },
  });

  // Genel Kültür 30 soruluk tek blok; konuya bölünmezse Türkçe ya da Analitik
  // hiç temsil edilmeyebilir.
  const grupAdi = (k: (typeof kayitlar)[number]) => {
    const ders = k.question.topic.course.name;
    return ders === 'Genel Kültür ve Analitik Düşünme' ? `${ders} › ${k.question.topic.name}` : ders;
  };

  const uygun = kayitlar.filter(
    (k) => !k.cancelled && k.question.currentVersion?.status === 'published',
  );
  const gruplar = new Map<string, typeof uygun>();
  for (const k of uygun) gruplar.set(grupAdi(k), [...(gruplar.get(grupAdi(k)) ?? []), k]);
  const toplam = uygun.length || 1;

  // En büyük kalan yöntemi — yuvarlama toplamı 20'nin altına/üstüne kaçırmasın.
  const paylar = [...gruplar].map(([g, l]) => {
    const tam = (l.length * ACIK) / toplam;
    return { g, l, taban: Math.floor(tam), kalan: tam - Math.floor(tam) };
  });
  let dagitilan = paylar.reduce((a, p) => a + p.taban, 0);
  for (const p of [...paylar].sort((a, b) => b.kalan - a.kalan)) {
    if (dagitilan >= ACIK) break;
    p.taban++;
    dagitilan++;
  }

  const secilen: typeof uygun = [];
  for (const p of paylar) {
    const sirali = [...p.l].sort((a, b) => {
      const oncelik = (k: (typeof uygun)[number]) => (k.question.currentVersion?.explanation ? 0 : 1);
      return oncelik(a) - oncelik(b) || tohum(slug, a.orderNo) - tohum(slug, b.orderNo);
    });
    secilen.push(...sirali.slice(0, p.taban));
  }

  const aciklamasiz = secilen.filter((k) => !k.question.currentVersion?.explanation).length;
  console.log(`${sinav.name}\n  uygun ${uygun.length}/${kayitlar.length} · vitrin ${secilen.length}`);
  for (const p of paylar) {
    const varAciklama = p.l.filter((k) => k.question.currentVersion?.explanation).length;
    console.log(`  ${String(p.taban).padStart(2)}/${String(p.l.length).padStart(3)}  ${p.g}  (açıklamalı ${varAciklama})`);
  }
  console.log(`  sıralar: ${secilen.map((k) => k.orderNo).sort((a, b) => a - b).join(', ')}`);
  if (aciklamasiz) console.log(`  ! ${aciklamasiz} seçili soruda açıklama YOK — o gruplarda açıklamalı soru yetmedi`);

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  const acik = new Set(secilen.map((k) => k.questionId));
  await prisma.pastExamQuestion.updateMany({ where: { pastExamId: sinav.id }, data: { publicly: false } });
  await prisma.pastExamQuestion.updateMany({
    where: { pastExamId: sinav.id, questionId: { in: [...acik] } },
    data: { publicly: true },
  });
  console.log(`\n✓ ${acik.size} soru public işaretlendi`);
}
main().finally(() => prisma.$disconnect());
