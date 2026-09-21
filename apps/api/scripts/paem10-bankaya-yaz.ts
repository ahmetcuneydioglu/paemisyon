/**
 * Doc 36 — PAEM 10 (2026) sorularını bankaya ve çıkmış sınav vitrinine yazar.
 *
 * İki şey birden kurulur:
 *   1. Normal banka kaydı (Question + QuestionVersion + QuestionOption) —
 *      soru konu ağacına oturur, alıştırmada/koçta/yanlış defterinde çalışır.
 *   2. PastExam + PastExamQuestion — sınav kimliği, kitapçık sırası, iptal
 *      bayrağı ve public sayfada görünürlük.
 *
 * Sorular `in_review` yazılır; yayın kararı kullanıcıda (Doc 33-35 ile aynı).
 *
 * PAEM 9'dan ÜÇ farkı var:
 *
 *   • SIRA B KİTAPÇIĞINDAN. PAEM 9'da A grubu esas alınmıştı; PAEM 10'da
 *     aktarım B'den yapıldı, A yalnız çapraz doğrulama için okundu. İkisi de
 *     aynı 100 soruyu aynı ders bloklarında taşıyor (karışıklık blok İÇİNDE),
 *     o yüzden blok yapısı bozulmuyor.
 *   • KAYIT ÖNCEDEN VAR. `paem-10-2026` sınav gecesi için `analiz` türünde
 *     ayrılmıştı. Resmî kitapçık elimize geçtiği için tür `resmi`ye çekilir;
 *     `status` bu script'te DEĞİŞMEZ, yayın kararı insanındır.
 *   • ÇELİŞKİ DALI KAPALI. PAEM 9'da çelişkili sorular hakem bekler diye
 *     atlanırdı. PAEM 10'da hakemlik turu bitti; hakeme taşınmış ama karara
 *     bağlanmamış bir soru varsa script yazmayı hiç başlatmaz.
 *
 *   npx tsx scripts/paem10-bankaya-yaz.ts            # kuru çalışma
 *   APPLY=1 npx tsx scripts/paem10-bankaya-yaz.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint, detectArticleNo } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

const SLUG = 'paem-10-2026';
/**
 * Sınav günü: 19 Eylül 2026, Cumartesi. Kitapçık iki gün sonra (21 Eylül)
 * yayımlandı; PDF'in üretim tarihi sınav tarihi DEĞİL, o yüzden sabit.
 */
const HELD_ON = '2026-09-19';
const SINAV = {
  name: '2026 PAEM 10. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
  institution: 'Polis Akademisi Başkanlığı',
  term: 10,
  kind: 'resmi' as const,
};
/** Kaynak etiketi: admin görünürlüğü için; public sayfada sınav adı zaten var. */
const KAYNAK = '2026 PAEM 10. DÖNEM YAZILI SINAVI';
const GORSEL_TABAN = '/soru-gorsel/paem-10';
/** Şıkkı taşımayan çizimler paemisyon.com'dan servis edilir (mobil de mutlak URL ister). */
const SITE = process.env.SITE_URL ?? 'https://paemisyon.com';

const PARTILER = [
  'polis-cmk',
  'ceza-anayasa',
  'idare-insanhaklari',
  'inkilap-genelkultur',
  'analitik-matematik',
] as const;

/** Bankaya yazılacak tam kök: ortak bilgi bloğu + soru cümlesi. */
const tamKok = (s: { ortakMetin?: string; kok: string }) =>
  s.ortakMetin ? `${s.ortakMetin}\n\n${s.kok}` : s.kok;

async function main() {
  const sorular = JSON.parse(readFileSync(`${KOK}/ham/paem10-B-sorular.json`, 'utf8')) as any[];
  const sinif = JSON.parse(readFileSync(`${KOK}/paem10-siniflandirma.json`, 'utf8')) as any[];
  const dersi = new Map(sinif.map((c) => [c.no, c]));

  // Hakemlik kuyruğu TAM kapanmadan tek soru bile yazılmaz.
  const kuyruk = JSON.parse(readFileSync(`${KOK}/denetim/paem10-hakemlik.json`, 'utf8')) as any[];
  const kararlar = JSON.parse(
    readFileSync(`${KOK}/denetim/paem10-hakem-kararlari.json`, 'utf8'),
  ) as any[];
  const kararOf = new Map(kararlar.map((k) => [k.no, k]));
  const acik = kuyruk.filter((q) => !kararOf.has(q.no)).map((q) => q.no);
  if (acik.length) throw new Error(`hakemlik açık: ${acik.join(', ')} — yazma başlatılmadı`);

  const aciklamalar = new Map<number, { aciklama: string; kaynak?: string; kaynakUrl?: string }>();
  const eksikParti: string[] = [];
  for (const p of PARTILER) {
    const yol = `${KOK}/aciklama/paem10-${p}.json`;
    if (!existsSync(yol)) { eksikParti.push(p); continue; }
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
  for (const s of sorular) {
    const c = dersi.get(s.no);
    if (!c) { atlanan.push(`#${s.no} sınıflandırma yok`); continue; }
    const tid = konuId.get(`${c.ders}›${c.konu}`);
    if (!tid) { atlanan.push(`#${s.no} konu bulunamadı: ${c.ders}›${c.konu}`); continue; }
    const a = aciklamalar.get(s.no);
    if (!a) { atlanan.push(`#${s.no} açıklama yok`); continue; }
    if (!a.aciklama?.trim()) { atlanan.push(`#${s.no} açıklama boş`); continue; }

    const harfler = Object.keys(s.siklar).sort();
    if (harfler.join('') !== 'ABCDE') { atlanan.push(`#${s.no} şık harfleri: ${harfler.join('')}`); continue; }
    if (!harfler.includes(s.dogru)) { atlanan.push(`#${s.no} anahtar şıkta yok: ${s.dogru}`); continue; }

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
      kusurlu: kararOf.get(s.no)?.karar === 'KUSURLU',
    });
  }

  if (eksikParti.length) console.log(`AÇIKLAMASI GELMEYEN PARTİ: ${eksikParti.join(', ')}\n`);
  console.log(`yazılacak ${yazilacak.length} · atlanan ${atlanan.length}`);
  console.log(`  kusurlu işaretli: ${yazilacak.filter((y) => y.kusurlu).length}`);
  console.log(`  görselli        : ${yazilacak.filter((y) => y.mediaUrl).length}`);
  for (const x of atlanan.slice(0, 25)) console.log('  atlandı: ' + x);
  if (atlanan.length > 25) console.log(`  ... ${atlanan.length - 25} satır daha`);

  const mevcut = await prisma.pastExam.findUnique({
    where: { slug: SLUG },
    select: {
      id: true, name: true, kind: true, status: true, heldOn: true, term: true,
      summary: true, questionCount: true, analysis: true, isPremium: true,
      _count: { select: { questions: true } },
    },
  });
  if (!mevcut) console.log('\nMEVCUT KAYIT: yok');
  else {
    const { summary, analysis, ...k } = mevcut;
    console.log('\nMEVCUT KAYIT:', JSON.stringify(k));
    console.log(`  summary : ${summary ? `"${summary.slice(0, 150)}${summary.length > 150 ? '…' : ''}"` : 'yok'}`);
    console.log(`  analysis: ${analysis ? JSON.stringify(analysis).slice(0, 200) : 'yok'}`);
    // Sınav gecesi için yazılan tanıtım/analiz, resmî kitapçık geldikten sonra
    // ESKİR: aday beyanına dayanan bir dağılımı resmî sınavın yanında tutmak,
    // ölçtüğümüz şeyi olduğundan kesin gösterir. Script bunlara dokunmuyor;
    // eskiyen varsa uyarıp insana bırakıyor.
    if (analysis) console.log('  ⚠ analiz içeriği var — resmî sorular geldikten sonra gözden geçir.');
    if (summary && /aday beyan|yaklaşık|güncellenecek|yayımlandığında/i.test(summary))
      console.log('  → tanıtım metni sınav öncesi diline ait; yazma sırasında temizlenecek (PAEM 8/9\'da da yok).');
    if (mevcut.questionCount !== 100)
      console.log(`  ⚠ questionCount ${mevcut.questionCount} — 100 olmalı.`);
  }

  if (!APPLY) return console.log('\n(kuru çalışma — APPLY=1 ile yazılır)');
  if (yazilacak.length !== 100) throw new Error(`100 soru bekleniyordu, ${yazilacak.length} hazır`);

  const heldOn = new Date(process.env.HELD_ON ?? HELD_ON);
  if (Number.isNaN(heldOn.getTime())) throw new Error(`sınav tarihi okunamadı: ${HELD_ON}`);

  // Tek seferlik: script iki kez çalışırsa 100 soruyu ikinci kez yaratırdı.
  if (mevcut && mevcut._count.questions > 0)
    throw new Error(`${SLUG} zaten ${mevcut._count.questions} soru içeriyor — yazma iptal edildi.`);

  // analiz → resmi geçişinde tanıtım metni TEMİZLENİR. Kayıt sınav gecesi
  // için ayrılmıştı ve metni "resmî kitapçık yayımlandığında sorular
  // cevaplarıyla birlikte eklenecek" diyor; sorular girdikten sonra bu cümle
  // yanlış olur. Yerleşmiş resmî dönemlerde (PAEM 8, PAEM 9) tanıtım metni
  // zaten yok — sayfanın başlığı ve soru listesi kendini anlatıyor. Panelden
  // istendiği zaman yeniden yazılabilir.
  const sinav = await prisma.pastExam.upsert({
    where: { slug: SLUG },
    update: { ...SINAV, heldOn, summary: null, questionCount: 100 },
    create: { slug: SLUG, ...SINAV, heldOn, questionCount: 100, status: 'draft', sortOrder: 10 },
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
  console.log(`\n✓ ${yazilan} soru yazıldı (in_review) · sınav: ${SLUG}`);
}
main().finally(() => prisma.$disconnect());
