/**
 * KOK-KONU UYUM TARAYICISI. SALT OKUR.
 *
 * Sorunun kokunde ACIKCA atif yapilan mevzuat ile sorunun dosyalandigi konu
 * uyusuyor mu? Uyusmuyorsa ya soru yanlis konuya dusmus ya da dayanak metni
 * bankada olmayan bir mevzuatta demektir; her iki durumda da denetlenemez.
 *
 * Yalniz KOKTE ACIK ATIF ariyor ("NNNN sayili ... Kanunu'na gore", "... Yonetmeligi'ne
 * gore"). Atif yoksa soru bu taramanin disinda kalir (yanlis pozitif uretmemek icin).
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const SAYILI = /(\d{3,5})\s*say[ıi]l[ıi]/g;
const YONETMELIK = /([A-ZÇĞİÖŞÜ][^.?!;]{4,70}?\s+Yönetmeliği)['’]?(?:n[ei])?\s*göre/g;

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]/gu, '');

(async () => {
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, stem: true,
      _count: { select: { examQuestions: true } },
      question: { select: { topic: { select: { name: true } } } } } });

  const uyumsuz: Array<{ id: string; konu: string; atif: string; kok: string; sinav: number }> = [];
  for (const r of rows) {
    const konu = r.question.topic?.name ?? '';
    const kok = r.stem.replace(/\s+/g, ' ');
    const konuN = norm(konu);

    // 1) Kanun numarasi atiflari
    const nolar = [...kok.matchAll(SAYILI)].map((m) => m[1]);
    if (nolar.length) {
      // Konunun kendi numarasi kokte geciyorsa uyumlu say.
      const konuNo = konu.match(/\d{3,5}/)?.[0];
      if (konuNo && nolar.includes(konuNo)) continue;
      // Konu numarasiz (ornegin "T.C. Anayasası") ise numara atfi tek basina kusur degil.
      if (!konuNo) continue;
      uyumsuz.push({ id: r.id.slice(0, 8), konu, atif: `${nolar.join('/')} sayılı`, kok, sinav: r._count.examQuestions });
      continue;
    }
    // 2) Yonetmelik adi atiflari
    const yon = [...kok.matchAll(YONETMELIK)].map((m) => m[1].trim());
    if (yon.length) {
      const uyum = yon.some((y) => {
        const yN = norm(y);
        return konuN.includes(yN) || yN.includes(konuN) ||
          // ortak anlamli kelime paylasimi
          y.split(/\s+/).filter((w) => w.length > 4 && konu.includes(w)).length >= 2;
      });
      if (!uyum) uyumsuz.push({ id: r.id.slice(0, 8), konu, atif: yon.join(' | '), kok, sinav: r._count.examQuestions });
    }
  }

  const grup = new Map<string, typeof uyumsuz>();
  for (const u of uyumsuz) {
    if (!grup.has(u.konu)) grup.set(u.konu, []);
    grup.get(u.konu)!.push(u);
  }
  console.log(`taranan ${rows.length} | KOK-KONU UYUMSUZ: ${uyumsuz.length}\n`);
  for (const [konu, liste] of [...grup].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`### ${konu} — ${liste.length}`);
    for (const u of liste.slice(0, 6))
      console.log(`   ${u.id} -> "${u.atif}"  sinav=${u.sinav}\n      ${u.kok.slice(0, 120)}`);
    if (liste.length > 6) console.log(`   … +${liste.length - 6}`);
    console.log();
  }
})().finally(() => p.$disconnect());
