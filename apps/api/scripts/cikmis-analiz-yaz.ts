/**
 * Doc 36 — bir çıkmış sınavın konu analizini yazar/günceller.
 *
 * PAEM 6 ve 7'nin analizleri kendi hatırlatma dosyalarına özgü script'lerle
 * çıkarıldı. Bu script format bağımsızdır: hazır bir analiz JSON'unu alır ve
 * `PastExam.analysis` alanına yazar. Sınav akşamı elde ne varsa ondan
 * (aday anketleri, kendi topladığımız kayıtlar) hızlıca yayına geçmek için.
 *
 * Beklenen JSON:
 *   {
 *     "kaynak": "adaylardan derlenen kayıtlar (N katılımcı)",
 *     "uyari":  "Bu sınav yayımlanmadı. Dağılım aday beyanına dayanır...",
 *     "dersDagilim":  { "Polis Mevzuatı": 10, ... },
 *     "kanunDagilim": { "2559": 4, ... }        // isteğe bağlı
 *   }
 *
 * `uyari` ZORUNLUDUR: aday hatırlatmasından çıkarılmış bir dağılımı kaynağını
 * söylemeden yayımlamak, ölçtüğümüz şeyi olduğundan kesin göstermektir.
 *
 *   npx tsx scripts/cikmis-analiz-yaz.ts <slug> <analiz.json>
 *   APPLY=1 npx tsx scripts/cikmis-analiz-yaz.ts <slug> <analiz.json>
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

async function main() {
  const [slug, yol] = process.argv.slice(2);
  if (!slug || !yol) throw new Error('kullanım: cikmis-analiz-yaz.ts <slug> <analiz.json>');

  const analiz = JSON.parse(readFileSync(yol, 'utf8'));
  if (!analiz.uyari?.trim()) throw new Error('analiz.uyari boş — kaynağı söylemeden yayımlanmaz');
  const ders = analiz.dersDagilim ?? {};
  if (!Object.keys(ders).length) throw new Error('dersDagilim boş');
  const toplam = Object.values(ders).reduce((a: number, n) => a + Number(n), 0);

  const sinav = await prisma.pastExam.findUnique({
    where: { slug },
    select: { id: true, name: true, kind: true, status: true, questionCount: true },
  });
  if (!sinav) throw new Error(`${slug} bulunamadı — önce PastExam kaydı kurulmalı`);

  console.log(`${sinav.name} (${sinav.kind}, ${sinav.status})`);
  console.log(`  ders ${Object.keys(ders).length} · toplam soru ${toplam}`);
  if (sinav.questionCount && toplam !== sinav.questionCount)
    console.log(`  ! dağılım toplamı ${toplam}, sınavda ${sinav.questionCount} soru var`);
  for (const [d, n] of Object.entries(ders).sort((a, b) => Number(b[1]) - Number(a[1])))
    console.log(`    ${String(n).padStart(3)}  ${d}`);

  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  await prisma.pastExam.update({ where: { id: sinav.id }, data: { analysis: analiz } });
  console.log('\n✓ analiz yazıldı · yayına almak için panelden "Yayına al"');
}
main().finally(() => prisma.$disconnect());
