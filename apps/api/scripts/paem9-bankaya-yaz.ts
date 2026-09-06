/**
 * Doc 36 — PAEM 9 sorularını bankaya ve çıkmış sınav vitrinine yazar.
 *
 * İki şey birden kurulur:
 *   1. Normal banka kaydı (Question + QuestionVersion + QuestionOption) —
 *      soru konu ağacına oturur, alıştırmada/koçta/yanlış defterinde çalışır.
 *   2. PastExam + PastExamQuestion — sınav kimliği, kitapçık sırası, iptal
 *      bayrağı ve public sayfada görünürlük.
 *
 * Sorular `in_review` yazılır; yayın kararı kullanıcıda (Doc 33-35 ile aynı).
 *
 * ÇELİŞKİ kararlı sorular YAZILMAZ — hakem çözmeden bankaya girmezler.
 * İPTAL edilen sorular yazılır ama `cancelled` işaretlenir: gösterilir,
 * puanlanmaz.
 *
 *   npx tsx scripts/paem9-bankaya-yaz.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem9-bankaya-yaz.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint, detectArticleNo } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

const SINAV = {
  slug: 'paem-9-2025',
  name: '2025 PAEM 9. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
  institution: 'Polis Akademisi Başkanlığı',
  term: 9,
  heldOn: new Date('2025-04-19'),
  kind: 'resmi' as const,
};
/** Kaynak etiketi: admin görünürlüğü için; public sayfada sınav adı zaten var. */
const KAYNAK = '2025 PAEM 9. DÖNEM YAZILI SINAVI';
const GORSEL_TABAN = '/soru-gorsel/paem-9';
/** Şıkkı taşımayan çizimler paemisyon.com'dan servis edilir (mobil de mutlak URL ister). */
const SITE = process.env.SITE_URL ?? 'https://paemisyon.com';

/** Bankaya yazılacak tam kök: ortak bilgi bloğu + soru cümlesi. */
const tamKok = (s: { ortakMetin?: string; kok: string }) =>
  s.ortakMetin ? `${s.ortakMetin}\n\n${s.kok}` : s.kok;

async function main() {
  const { A } = JSON.parse(readFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, 'utf8'));
  const sinif: any[] = JSON.parse(readFileSync(`${KOK}/siniflandirma.json`, 'utf8'));
  const kararlar: any[] = JSON.parse(readFileSync(`${KOK}/denetim/ozet.json`, 'utf8'));
  const dersi = new Map(sinif.map((c) => [c.no, c]));
  const karari = new Map(kararlar.map((k) => [k.no, k]));

  const aciklamalar = new Map<number, { aciklama: string; kaynak?: string; kaynakUrl?: string }>();
  for (const p of ['polis-cmk', 'ceza-anayasa', 'idare-insanhaklari', 'inkilap-genelkultur', 'analitik-matematik']) {
    const yol = `${KOK}/aciklama/${p}.json`;
    if (!existsSync(yol)) continue;
    for (const a of JSON.parse(readFileSync(yol, 'utf8'))) aciklamalar.set(a.no, a);
  }

  // Konu adları benzersiz değil (aynı ad farklı derslerde olabilir) — ders+konu ile çözülür.
  const konular = await prisma.topic.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, course: { select: { name: true } } },
  });
  const konuId = new Map(konular.map((t) => [`${t.course.name}›${t.name}`, t.id]));

  const yazilacak: any[] = [];
  const atlanan: string[] = [];
  for (const s of A as any[]) {
    const c = dersi.get(s.no)!;
    const k = karari.get(s.no);
    if (!k) { atlanan.push(`#${s.no} denetim kararı yok`); continue; }
    if (k.karar === 'CELISKI') { atlanan.push(`#${s.no} ÇELİŞKİ — hakem bekliyor`); continue; }
    const tid = konuId.get(`${c.ders}›${c.konu}`);
    if (!tid) { atlanan.push(`#${s.no} konu bulunamadı: ${c.ders}›${c.konu}`); continue; }
    const a = aciklamalar.get(s.no);
    if (!a) { atlanan.push(`#${s.no} açıklama yok`); continue; }

    const kok = tamKok(s);
    yazilacak.push({
      no: s.no,
      topicId: tid,
      articleNo: detectArticleNo(kok),
      stem: kok,
      explanation: a.aciklama,
      mediaUrl: s.gorselli ? `${SITE}${GORSEL_TABAN}/${s.no}.png` : null,
      contentHash: questionFingerprint(kok, Object.values(s.siklar) as string[]),
      siklar: s.siklar,
      dogru: s.dogru,
      iptal: !!s.iptal,
      kaynakUrl: a.kaynakUrl ?? null,
      kaynakAd: a.kaynak ?? null,
      karar: k.karar,
    });
  }

  const say = yazilacak.reduce((m: Record<string, number>, y) => ((m[y.karar] = (m[y.karar] ?? 0) + 1), m), {});
  console.log(`yazılacak ${yazilacak.length} · atlanan ${atlanan.length}`);
  console.log('kararlar:', JSON.stringify(say));
  for (const x of atlanan) console.log('  atlandı: ' + x);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const sinav = await prisma.pastExam.upsert({
    where: { slug: SINAV.slug },
    update: { name: SINAV.name, institution: SINAV.institution, term: SINAV.term, heldOn: SINAV.heldOn, kind: SINAV.kind },
    create: { ...SINAV, status: 'draft', sortOrder: 9 },
  });

  let yazilan = 0;
  for (const y of yazilacak) {
    await prisma.$transaction(async (tx) => {
      const soru = await tx.question.create({ data: { topicId: y.topicId, articleNo: y.articleNo } });
      const surum = await tx.questionVersion.create({
        data: {
          questionId: soru.id,
          versionNo: 1,
          stem: y.stem,
          explanation: y.explanation,
          difficulty: Difficulty.medium,
          mediaUrl: y.mediaUrl,
          sourceLabel: KAYNAK,
          contentHash: y.contentHash,
          status: 'in_review',
          options: {
            create: (['A', 'B', 'C', 'D', 'E'] as const).map((h, i) => ({
              label: h, text: y.siklar[h], isCorrect: h === y.dogru, sortOrder: i,
            })),
          },
          ...(y.kaynakUrl
            ? { legalReferences: { create: [{ citation: y.kaynakAd ?? y.kaynakUrl, url: y.kaynakUrl }] } }
            : {}),
        },
      });
      await tx.question.update({ where: { id: soru.id }, data: { currentVersionId: surum.id } });
      await tx.pastExamQuestion.create({
        data: { pastExamId: sinav.id, questionId: soru.id, orderNo: y.no, cancelled: y.iptal },
      });
    });
    yazilan++;
  }
  console.log(`\n✓ ${yazilan} soru yazıldı (in_review) · sınav: ${sinav.slug}`);
}
main().finally(() => prisma.$disconnect());
