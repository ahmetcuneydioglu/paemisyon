/**
 * KONU BAZLI TOPLU ARSIVLEME — kapsam disi kalan bir konunun TUM yayindaki
 * sorularini yayindan kaldirir.
 *
 * Gerekce (kullanici karari, 2 Eyl 2026): "Turkce / Dil Bilgisi" konusu sinavda
 * HIC sorulmuyor; bankada bulunmasi adaylari yaniltiyor ve denemelere sizarak
 * elestiri getiriyor. Soru kusurlu degil, KAPSAM DISI.
 *
 * Desen soru-arsivle.ts ile ayni ve bilerek muhafazakar:
 *   - questionVersion.status = archived  (SATIR SILINMEZ)
 *   - question.deletedAt = simdi, currentVersionId = null
 * Surum satiri silinmedigi icin ExamQuestion.questionVersionId FK'si kirilmaz;
 * GECMIS DENEME SONUCLARI VE SIRALAMALAR BOZULMAZ.
 *
 * CANLI DENEME UYARISI: bu script canli bir denemenin soru setine DOKUNMAZ.
 * ExamQuestion satirlari yerinde kalir; canli sinav sorulari sunmaya devam eder.
 * Canli denemeden soru cikarmak ayri bir istir (deneme-soru-cikar.ts).
 *
 *   npx tsx scripts/konu-arsivle.ts --konu "Türkçe / Dil Bilgisi"            (kuru)
 *   npx tsx scripts/konu-arsivle.ts --konu "Türkçe / Dil Bilgisi" --yaz
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const p = new PrismaClient();

async function main() {
  const YAZ = process.argv.includes('--yaz');
  const ki = process.argv.indexOf('--konu');
  if (ki === -1) { console.log('--konu "<konu adi>" ver'); return; }
  const konuAdi = process.argv[ki + 1];
  const gi = process.argv.indexOf('--gerekce');
  const gerekce = gi === -1 ? 'kapsam disi konu (kullanici karari)' : process.argv[gi + 1];

  const konu = await p.topic.findFirst({ where: { name: konuAdi }, select: { id: true, name: true } });
  if (!konu) { console.log(`Konu bulunamadi: ${konuAdi}`); return; }

  // --id ile TEK TEK soru verilebilir: konu geneli degil, o konuya karismis
  // birkac soru temizlenecekse (orn. Genel Kultur icine sizmis Turkce sorulari).
  const idOnekleri = process.argv.reduce<string[]>((a, v, i) => (v === '--id' ? [...a, process.argv[i + 1]] : a), []);

  const rows = (await p.questionVersion.findMany({
    where: { status: 'published', question: { topicId: konu.id, deletedAt: null } },
    select: {
      id: true, questionId: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } },
    },
  })).filter((r) => !idOnekleri.length || idOnekleri.some((o) => r.questionId.startsWith(o)));

  if (idOnekleri.length && rows.length !== idOnekleri.length) {
    console.log(`UYARI: ${idOnekleri.length} id verildi, ${rows.length} eslesti — devam etmeden kontrol et.`);
  }

  const sinavda = rows.filter((r) => r._count.examQuestions > 0);
  console.log(`Konu: ${konu.name}`);
  console.log(`Yayinda soru: ${rows.length}`);
  console.log(`Bunlardan denemede kullanilmis: ${sinavda.length} (surum satiri korunur, gecmis sonuc bozulmaz)`);
  if (!rows.length) return;

  if (!YAZ) { console.log('\nKURU CALISMA — uygulamak icin --yaz ekle.'); return; }

  const simdi = new Date();
  const yedekYolu = path.join(__dirname, '../../../docs/32-yayin-denetimi/konu-arsiv-yedek.json');
  fs.writeFileSync(yedekYolu, JSON.stringify(
    rows.map((r) => ({
      surumId: r.id, soruId: r.questionId, konu: konu.name, kok: r.stem,
      aciklama: r.explanation, kaynak: r.sourceLabel, denemedeKullanim: r._count.examQuestions,
      siklar: r.options,
    })), null, 1), 'utf-8');

  let n = 0;
  for (const r of rows) {
    await p.$transaction(async (tx) => {
      await tx.questionVersion.update({ where: { id: r.id }, data: { status: 'archived', archivedAt: simdi } });
      await tx.question.update({ where: { id: r.questionId }, data: { deletedAt: simdi, currentVersionId: null } });
    });
    n++;
  }

  const defter = path.join(__dirname, '../../../docs/32-yayin-denetimi/ilerleme.jsonl');
  const satirlar = rows.map((r) => JSON.stringify({
    id: r.questionId.slice(0, 8), konu: konu.name, dayanak: null, sinif: 'arsivlendi',
    bulgu: `KAPSAM DISI — ${gerekce}`, zaman: simdi.toISOString(),
  })).join('\n') + '\n';
  fs.appendFileSync(defter, satirlar, 'utf-8');

  console.log(`\nTAMAM: ${n} soru arsivlendi.`);
  console.log(`Yedek (geri alma icin): ${yedekYolu}`);
  console.log(`Defter: ${defter}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
