/**
 * Doc 37 — birden çok OGM Materyal testini tek partide toplar ve kör denetime
 * hazırlar.
 *
 * `ogm-ayristir.ts` her testi ayrı ayrı çıkarır; burada hepsi birleşir. Soru
 * numaraları testler arasında tekrar ettiği (her testte 1-10) için kimlik
 * `t<test>s<no>` biçiminde kurulur — aksi hâlde ikinci testin 1. sorusu
 * birincinin üstüne yazardı.
 *
 * Mükerrer taraması İKİ yönlü: bankaya karşı (tam parmak izi + aynı dersteki
 * sorularla kelime benzerliği) ve PARTİNİN KENDİ İÇİNDE. İkincisi şart —
 * yedi test aynı MEB bankasından geliyor ve aynı soru iki teste birden
 * düşebilir.
 *
 * Çıktı, denetçilere verilecek kör dosyalara BÖLÜNÜR: tek bir denetçiye 70
 * soru vermek, hem bağlamı hem de dikkati seyreltir.
 *
 * SALT OKUMA.
 * `CIKAR` ile soru elenebilir: yakın eş taraması insana bakması için bir liste
 * çıkarır, eleme kararı script'in değil insanın.
 *
 *   npx tsx scripts/ogm-parti-kur.ts <doc-dizini> <test-dizini> <t2 t3 …>
 *   CIKAR=t7s6 npx tsx scripts/ogm-parti-kur.ts …
 *   ILK_PARTI=6 …   (aynı doc altında yeni tur; parti adları ogm-6, ogm-7 …)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const YAKINLIK_ESIGI = 0.55;
/** Bir kör dosyaya en çok kaç soru — denetçi başına makul yük. */
const PARTI_BOYU = 20;
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
/** İnsan kararıyla elenen sorular (yakın eş taramasının ardından). */
const CIKAR = new Set((process.env.CIKAR ?? '').split(',').map((x) => x.trim()).filter(Boolean));
/** İlk partinin numarası — aynı doc altında birden çok tur olduğu için. */
const ILK_PARTI = Number(process.env.ILK_PARTI ?? 2);
const p = new PrismaClient();

const KALIP = new Set([
  'aşağıdakilerden', 'aşağıdaki', 'hangisi', 'hangileri', 'değildir', 'aşağıdakilerin',
  'verilen', 'yukarıda', 'yukarıdaki', 'bir', 've', 'ile', 'için', 'olarak', 'bu', 'da', 'de',
]);
const kelimeler = (t: string) =>
  new Set(
    t.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
      .filter((w) => w.length > 2 && !KALIP.has(w)),
  );
const jaccard = (a: Set<string>, b: Set<string>) => {
  const kesisim = [...a].filter((x) => b.has(x)).length;
  return kesisim / (a.size + b.size - kesisim || 1);
};

async function main() {
  const [docDizin, testDizin, ...testler] = process.argv.slice(2);
  // Metin katmanında olmayan tablo/şekil taşıyan sorular (ogm-gorsel-cikar.ts).
  const gorsel: Record<string, string> = existsSync(`${docDizin}/gorsel.json`)
    ? JSON.parse(readFileSync(`${docDizin}/gorsel.json`, 'utf8')) : {};
  if (!docDizin || !testDizin || !testler.length)
    throw new Error('kullanım: ogm-parti-kur.ts <doc-dizini> <test-dizini> <t2 t3 …>');

  // ── Testleri birleştir, kimlik ver ────────────────────────────────────
  const aday: any[] = [];
  for (const t of testler) {
    // Soru sayısı testten teste değişebiliyor (görselli sorular çıkarıldığında
    // 10'un altına düşüyor), o yüzden dosya adı sabit değil.
    const bul = (on: string) => {
      const f = readdirSync(`${testDizin}/${t}`).find((x) => new RegExp(`^${on}-\\d+\\.json$`).test(x));
      if (!f) throw new Error(`${testDizin}/${t}: ${on}-*.json yok`);
      return JSON.parse(readFileSync(`${testDizin}/${t}/${f}`, 'utf8'));
    };
    const ham = bul('ham');
    const anahtar: Record<string, string> = bul('anahtar');
    for (const q of ham) {
      const dogru = anahtar[String(q.no)];
      if (!dogru) throw new Error(`${t} s${q.no}: cevap anahtarı yok`);
      const id = `${t}s${q.no}`;
      aday.push({ id, test: t, no: q.no, kok: q.kok, siklar: q.siklar, dogru, gorselUrl: gorsel[id] ?? null });
    }
  }
  console.log(`${testler.length} test → ${aday.length} soru`);

  // ── Bankaya karşı tarama ──────────────────────────────────────────────
  const banka = await p.questionVersion.findMany({
    where: { question: { deletedAt: null }, status: { in: ['published', 'in_review', 'draft'] } },
    select: {
      stem: true, status: true, contentHash: true,
      question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { text: true } },
    },
  });
  const tam = new Map<string, string>();
  const ayniDers: { stem: string; durum: string; kume: Set<string> }[] = [];
  for (const v of banka) {
    const fp = v.contentHash ?? questionFingerprint(v.stem, v.options.map((o) => o.text));
    if (!tam.has(fp)) tam.set(fp, `${v.question.topic.course.name}/${v.question.topic.name} (${v.status})`);
    if (/nkil|nkıl/i.test(v.question.topic.course.name))
      ayniDers.push({ stem: v.stem, durum: v.status, kume: kelimeler(v.stem) });
  }

  const temiz: any[] = [];
  const bankaCakisan: any[] = [];
  const icTekrar: any[] = [];
  const yakin: any[] = [];
  const gorulen = new Map<string, string>();

  const elenen: string[] = [];
  for (const s of aday) {
    if (CIKAR.has(s.id)) { elenen.push(s.id); continue; }
    const fp = questionFingerprint(s.kok, SIKLAR.map((l) => s.siklar[l]));
    if (tam.has(fp)) { bankaCakisan.push({ id: s.id, nerede: tam.get(fp) }); continue; }
    if (gorulen.has(fp)) { icTekrar.push({ id: s.id, esi: gorulen.get(fp) }); continue; }
    gorulen.set(fp, s.id);

    const k = kelimeler(s.kok);
    const enBanka = ayniDers.map((b) => ({ ...b, skor: jaccard(k, b.kume) })).sort((a, b) => b.skor - a.skor)[0];
    const enParti = temiz.map((b) => ({ id: b.id, skor: jaccard(k, kelimeler(b.kok)) })).sort((a, b) => b.skor - a.skor)[0];
    if (enBanka && enBanka.skor >= YAKINLIK_ESIGI)
      yakin.push({ id: s.id, nerede: `banka (${enBanka.durum})`, skor: +enBanka.skor.toFixed(2), metin: enBanka.stem.replace(/\n/g, ' ').slice(0, 80) });
    if (enParti && enParti.skor >= YAKINLIK_ESIGI)
      yakin.push({ id: s.id, nerede: `parti ${enParti.id}`, skor: +enParti.skor.toFixed(2), metin: '' });
    temiz.push(s);
  }

  console.log(`bankada TAM eş   : ${bankaCakisan.length}`);
  for (const c of bankaCakisan) console.log(`   ${c.id} → ${c.nerede}`);
  console.log(`parti içi TAM eş : ${icTekrar.length}`);
  for (const c of icTekrar) console.log(`   ${c.id} ≡ ${c.esi}`);
  console.log(`YAKIN eş (≥${YAKINLIK_ESIGI}) : ${yakin.length}   ← insan bakacak, elenmedi`);
  for (const y of yakin) console.log(`   ${y.id} ~${y.skor} ${y.nerede}  ${y.metin}`);
  if (elenen.length) console.log(`insan kararıyla elendi: ${elenen.length}  ${elenen.join(' ')}`);
  console.log(`aday kalan       : ${temiz.length}`);

  // ── Kör dosyalara böl ─────────────────────────────────────────────────
  mkdirSync(`${docDizin}/parti`, { recursive: true });
  writeFileSync(`${docDizin}/aday-${temiz.length}.json`, JSON.stringify(temiz, null, 1));
  const anahtarlar = Object.fromEntries(temiz.map((s) => [s.id, s.dogru]));
  writeFileSync(`${docDizin}/anahtar-${temiz.length}.json`, JSON.stringify(anahtarlar, null, 1));

  const parcalar: any[][] = [];
  for (let i = 0; i < temiz.length; i += PARTI_BOYU) parcalar.push(temiz.slice(i, i + PARTI_BOYU));
  parcalar.forEach((parca, i) => {
    const ad = `ogm-${i + ILK_PARTI}`;
    writeFileSync(
      `${docDizin}/parti/${ad}-kor.json`,
      JSON.stringify(
        parca.map((s) => ({
          id: s.id, kok: s.kok, siklar: s.siklar,
          // Görselli soruda denetçi tabloyu GÖRMELİ; yoksa soruyu haklı olarak
          // "çözülemez" diye işaretler ve kusur sorunun değil bizim olur.
          ...(s.gorselUrl ? { gorselDosya: `apps/web/public${s.gorselUrl}` } : {}),
        })),
        null, 1,
      ),
    );
    console.log(`   ${ad}-kor.json  ${parca.length} soru  (${parca[0].id}…${parca[parca.length - 1].id})`);
  });
}
main().finally(() => p.$disconnect());
