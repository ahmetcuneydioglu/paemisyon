/**
 * Doc 36 — konu analizi türündeki çıkmış sınav kayıtlarını kurar (PAEM 7, 6).
 *
 * Bu dönemler yayımlanmadı; bankada soruları YOK. Sayfanın tek içeriği,
 * aday hatırlatmasından çıkarılmış konu dağılımıdır (`analiz/*.json`).
 * `kind: analiz` bunu veriye gömer — vitrin rozeti buradan gelir, elle
 * ayarlanan bir etiket değildir.
 *
 * Kayıtlar `draft` kurulur; yayın kararı kullanıcıdadır.
 *
 *   npx tsx scripts/cikmis-sinav-kur.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/cikmis-sinav-kur.ts
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

const SINAVLAR = [
  {
    dosya: 'paem-7-2022.json',
    slug: 'paem-7-2022',
    name: 'PAEM 7. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı (2022)',
    term: 7,
    heldOn: null as Date | null,
    questionCount: 100,
    sortOrder: 7,
    summary:
      'Bu sınav yayımlanmadı. Aşağıdaki dağılım, sınava giren adayların ' +
      'derlediği 100 satırlık hatırlatma listesinden çıkarılmıştır; soru ' +
      'metinleri elimizde yoktur.',
  },
  {
    dosya: 'paem-6.json',
    slug: 'paem-6',
    name: 'PAEM 6. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
    term: 6,
    heldOn: null as Date | null,
    questionCount: 100,
    sortOrder: 6,
    summary:
      'Bu sınav yayımlanmadı. Dağılım aday hatırlatmasına dayanır ve ' +
      'yaklaşıktır: birkaç soru hatırlanamamış, birkaç satırın etiketi eksiktir.',
  },
];

async function main() {
  for (const s of SINAVLAR) {
    const analiz = JSON.parse(readFileSync(`${KOK}/analiz/${s.dosya}`, 'utf8'));
    console.log(
      `${s.slug}: ${Object.keys(analiz.dersDagilim).length} ders · ` +
        `${Object.keys(analiz.kanunDagilim ?? {}).length} kanun kırılımı`,
    );
    if (!APPLY) continue;
    await prisma.pastExam.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        institution: 'Polis Akademisi Başkanlığı',
        term: s.term,
        heldOn: s.heldOn,
        kind: 'analiz',
        summary: s.summary,
        questionCount: s.questionCount,
        sortOrder: s.sortOrder,
        analysis: analiz,
      },
      create: {
        slug: s.slug,
        name: s.name,
        institution: 'Polis Akademisi Başkanlığı',
        term: s.term,
        heldOn: s.heldOn,
        kind: 'analiz',
        summary: s.summary,
        questionCount: s.questionCount,
        sortOrder: s.sortOrder,
        status: 'draft',
        analysis: analiz,
      },
    });
  }
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  console.log('\n✓ analiz sınavları kuruldu (draft)');
}
main().finally(() => prisma.$disconnect());
