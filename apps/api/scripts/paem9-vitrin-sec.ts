/**
 * Doc 36 — public sayfada tam metniyle görünecek 20 soruyu seçer.
 *
 * Kullanıcı kararı: dönem başına 20 soru açık, kalanı uygulamada. Seçim
 * KONU DAĞILIMINA ORANTILI yapılır — hem dürüst bir örneklem olur (aday
 * sınavın gerçek karışımını görür) hem de "paem 9 tck soruları" gibi uzun
 * kuyruk aramalarını yakalar.
 *
 * Kurallar:
 *  - İptal edilen sorular vitrine girmez (puanlanmayan soruyla karşılama).
 *  - ONAY kararlı sorular UYARI'lılara tercih edilir; vitrin en temiz
 *    soruları göstermeli.
 *  - Seçim deterministik: tohum soru numarası, aynı girdi aynı çıktı.
 *
 *   npx tsx scripts/paem9-vitrin-sec.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem9-vitrin-sec.ts    # veritabanına işler
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const SLUG = 'paem-9-2025';
const ACIK = Number(process.env.ACIK ?? 20);
const prisma = new PrismaClient();

const tohum = (n: number) => parseInt(createHash('sha256').update(`paem9-${n}`).digest('hex').slice(0, 8), 16);

async function main() {
  const sinif: any[] = JSON.parse(readFileSync(`${KOK}/siniflandirma.json`, 'utf8'));
  const kararlar: any[] = JSON.parse(readFileSync(`${KOK}/denetim/ozet.json`, 'utf8'));
  const karari = new Map(kararlar.map((k) => [k.no, k.karar]));

  // Gruplama ders düzeyinde; Genel Kültür kendi içinde konuya bölünür, yoksa
  // 30 soruluk blok tek grup sayılır ve Türkçe hiç temsil edilmeyebilir.
  const grupAdi = (c: any) =>
    c.ders === 'Genel Kültür ve Analitik Düşünme' ? `${c.ders} › ${c.konu}` : c.ders;

  const gruplar = new Map<string, number[]>();
  for (const c of sinif) {
    if (karari.get(c.no) === 'IPTAL') continue;
    const g = grupAdi(c);
    gruplar.set(g, [...(gruplar.get(g) ?? []), c.no]);
  }
  const toplam = [...gruplar.values()].reduce((a, v) => a + v.length, 0);

  // En büyük kalan yöntemi: her gruba payı kadar, artan kontenjan en büyük
  // kalanlara gider — yuvarlama yüzünden 20'yi aşmayalım/eksik kalmayalım.
  const paylar = [...gruplar].map(([g, nolar]) => {
    const tam = (nolar.length * ACIK) / toplam;
    return { g, nolar, taban: Math.floor(tam), kalan: tam - Math.floor(tam) };
  });
  let dagitilan = paylar.reduce((a, p) => a + p.taban, 0);
  for (const p of [...paylar].sort((a, b) => b.kalan - a.kalan)) {
    if (dagitilan >= ACIK) break;
    p.taban++;
    dagitilan++;
  }

  const secilen: { no: number; grup: string; karar: string }[] = [];
  for (const p of paylar) {
    const sirali = [...p.nolar].sort((a, b) => {
      const oncelik = (n: number) => (karari.get(n) === 'ONAY' ? 0 : 1);
      return oncelik(a) - oncelik(b) || tohum(a) - tohum(b);
    });
    for (const no of sirali.slice(0, p.taban)) secilen.push({ no, grup: p.g, karar: karari.get(no)! });
  }
  secilen.sort((a, b) => a.no - b.no);

  console.log(`geçerli soru ${toplam} · vitrin ${secilen.length}`);
  for (const p of paylar) console.log(`  ${String(p.taban).padStart(2)}/${String(p.nolar.length).padStart(2)}  ${p.g}`);
  console.log('\nseçilenler: ' + secilen.map((s) => `${s.no}${s.karar === 'ONAY' ? '' : '*'}`).join(', '));
  console.log('(* = UYARI kararlı; grupta yeterli ONAY yoktu)');

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile veritabanına işlenir)'); return; }
  const sinav = await prisma.pastExam.findUnique({ where: { slug: SLUG }, select: { id: true } });
  if (!sinav) throw new Error(`${SLUG} bulunamadı — önce paem9-bankaya-yaz.ts`);
  const acik = new Set(secilen.map((s) => s.no));
  const kayitlar = await prisma.pastExamQuestion.findMany({
    where: { pastExamId: sinav.id },
    select: { questionId: true, orderNo: true },
  });
  for (const k of kayitlar) {
    await prisma.pastExamQuestion.update({
      where: { pastExamId_questionId: { pastExamId: sinav.id, questionId: k.questionId } },
      data: { publicly: acik.has(k.orderNo) },
    });
  }
  console.log(`\n✓ ${acik.size} soru public işaretlendi (${kayitlar.length} kayıt güncellendi)`);
}
main().finally(() => prisma.$disconnect());
