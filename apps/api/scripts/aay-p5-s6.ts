/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 6 — kütüphane rafı (sıra × cilt, iki kitabın yer değiştirmesi).
 *
 * Aile: PAEM 9/85-87 (mülakat) — yedi öğeli bir SIRA, her öğeye İKİLİ bir
 * nitelik (ciltli / ciltsiz) ve sıraya uygulanan bir DÖNÜŞÜM. İskelet
 * bilerek farklı: orada ilk üç sıra adlarıyla verilmiş ve iki telefon
 * mülakatı EN BAŞA alınıyordu; 4. partinin radyo senaryosunda yabancı
 * şarkılar "art arda gelmez" kalıbıyla dağılıp SONA atılıyordu. Burada
 * ciltliler bir BLOK oluşturur, hiçbir kitabın sırası adıyla verilmez ve
 * dönüşüm iki kitabın YER DEĞİŞTİRMESİDİR; yer değiştiren kitaplar adlarıyla
 * değil nitelikleriyle tarif edilir.
 *
 * Zincir: Lodos, aradaki üç kitap ve Pusula beş sıra kaplar; dışarıda iki sıra
 * kalır, ciltli üçlü oraya sığmaz → aradaki üç kitap ciltli üçlüdür (Lodos
 * üçlünün hemen solunda, Pusula hemen sağında). Kervan ciltli ve Mercan’ın
 * hemen sağında: Mercan ciltsiz olsaydı Lodos’un yerinde dururdu → Mercan da
 * ciltli. Mercan Lodos’un hemen sağında değil → üçlü X, Mercan, Kervan.
 * Serap Pusula’dan daha sağda → ciltsiz ve Pusula yedinci sırada değil →
 * üçlü 2-4 ya da 3-5. Açık kalan: üçlünün başı (Nilüfer / Orman) × üçlünün
 * yeri (2-4 ise dışarıdaki iki kitabın 6-7’deki sırası) — 6 çözüm.
 *
 * Dönüşümün tuzağı: yer değiştiren iki kitap adla değil NİTELİKLE tarif
 * edilir. "Öteki ikisinin arasında duran ciltli" Mercan’dır, "en sağdaki
 * ciltsiz" her zaman yedinci sıradadır (üçlü en geç 3-5’te biter). Mercan’ın
 * eski yeri açık (3/4) ama yeni yeri kesin (7); Serap’ın yeri ise yedinci
 * sırada olup olmamasına göre 3, 4 ya da 6 olur.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar ve sıralar tek anlamlı: "üçü ciltli, dördü ciltsiz", "tam üç
 *     kitap", "hemen sağında" / "daha sağda"; "ortadaki" yerine "öteki ikisinin
 *     arasında duran" (rafın ortası, yani dördüncü sıra okumasına kapalı)
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s6
 */
import { dizilimler, her, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const KITAP = ['Kervan', 'Lodos', 'Mercan', 'Nilüfer', 'Orman', 'Pusula', 'Serap'];
const SIRA = [1, 2, 3, 4, 5, 6, 7];

const METIN =
  'Bir kütüphane görevlisi, Kervan, Lodos, Mercan, Nilüfer, Orman, Pusula ve Serap adlı yedi kitabı boş bir rafa soldan sağa doğru yan yana dizmiştir. Raftaki yedi sıranın her birinde yalnızca bir kitap durmaktadır. Her kitap ya ciltli ya da ciltsizdir. Dizilişle ilgili bilinenler şunlardır:\n' +
  '- Kitaplardan üçü ciltli, dördü ciltsizdir.\n' +
  '- Ciltli üç kitap rafta yan yana durmaktadır; aralarında ciltsiz kitap yoktur.\n' +
  '- Lodos ile Pusula ciltsizdir. Lodos, Pusula’dan daha soldadır ve bu iki kitabın arasında tam üç kitap vardır.\n' +
  '- Kervan ciltlidir ve Mercan’ın hemen sağında durmaktadır.\n' +
  '- Mercan, Lodos’un hemen sağında durmamaktadır.\n' +
  '- Serap, Pusula’dan daha sağdadır.';

const yer = (d: Dunya, k: string) => d[`${k}_sira`] as number;
const ciltli = (d: Dunya, k: string) => d[`${k}_cilt`] === 'ciltli';
const siradaki = (d: Dunya, i: number) => KITAP.find((k) => yer(d, k) === i)!;

// Metnin kurduğu uzay: yedi kitabın her dizilişi (7!) × her kitaba bir cilt durumu (2^7), sonra öncüller.
const raf: Dunya[] = [];
for (const sira of dizilimler(KITAP, SIRA)) {
  for (let m = 0; m < 2 ** 7; m++) {
    const d: Dunya = {};
    KITAP.forEach((k, i) => {
      d[`${k}_sira`] = sira[k];
      d[`${k}_cilt`] = (m >> i) & 1 ? 'ciltli' : 'ciltsiz';
    });
    const cilt = KITAP.filter((k) => ciltli(d, k)).map((k) => yer(d, k));
    if (cilt.length !== 3) continue;
    if (Math.max(...cilt) - Math.min(...cilt) !== 2) continue;
    if (ciltli(d, 'Lodos') || ciltli(d, 'Pusula')) continue;
    if (!(yer(d, 'Lodos') < yer(d, 'Pusula') && yer(d, 'Pusula') - yer(d, 'Lodos') - 1 === 3)) continue;
    if (!ciltli(d, 'Kervan') || yer(d, 'Kervan') !== yer(d, 'Mercan') + 1) continue;
    if (yer(d, 'Mercan') === yer(d, 'Lodos') + 1) continue;
    if (!(yer(d, 'Serap') > yer(d, 'Pusula'))) continue;
    raf.push(d);
  }
}

/**
 * Yeni diziliş: ciltli üç kitaptan öteki ikisinin arasında duran ile ciltsiz
 * kitaplardan rafın en sağında duran yer değiştirir; öteki beş kitap yerinde
 * kalır. İkisi farklı kitaptır (biri ciltli, biri ciltsiz).
 */
const yeniYer = (d: Dunya, k: string): number => {
  const cilt = KITAP.filter((x) => ciltli(d, x)).sort((a, b) => yer(d, a) - yer(d, b));
  const orta = cilt[1];
  const sagCiltsiz = KITAP.filter((x) => !ciltli(d, x)).sort((a, b) => yer(d, b) - yer(d, a))[0];
  if (k === orta) return yer(d, sagCiltsiz);
  if (k === sagCiltsiz) return yer(d, orta);
  return yer(d, k);
};

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-16', zorluk: 'medium', baslik: 'Kütüphane rafı · Pusula’nın hemen solundaki kitap', ortakMetin: METIN, dunyalar: raf,
    kok: 'Yukarıdaki bilgilere göre, rafta Pusula’nın hemen solunda duran kitap hangisidir?',
    aciklama:
      'Lodos, Pusula ve aralarındaki üç kitap beş sıra kaplar; rafta bunların dışında yalnızca iki sıra kalır. Yan yana duran üç ciltli kitap bu iki sıraya sığmadığı için Lodos ile Pusula’nın arasındaki üç kitap ciltlidir: Lodos ciltli üçlünün hemen solunda, Pusula hemen sağındadır. Kervan ciltlidir ve Mercan onun hemen solundadır. Mercan ciltsiz olsaydı üçlünün hemen solunda, yani Lodos’un yerinde dururdu; bu yüzden Mercan da üçlüdedir. Mercan Lodos’un hemen sağında olmadığına göre üçlünün ilk kitabı değildir; ortadadır ve Kervan üçlünün en sağındadır. Pusula’nın hemen solundaki kitap Kervan’dır. Mercan her zaman üçlünün ortasında, Nilüfer ile Orman ise üçlünün başında ya da dışında kalır; Serap Pusula’dan daha sağdadır.',
    ...sik(
      ['Kervan', 'Mercan', 'Nilüfer', 'Orman', 'Serap'],
      ['Kervan', 'Mercan', 'Nilüfer', 'Orman', 'Serap'].map((k) => her((d) => siradaki(d, yer(d, 'Pusula') - 1) === k)),
      5061,
    ),
  },
  {
    id: 'aay-p5-17', zorluk: 'hard', baslik: 'Kütüphane rafı · yer değiştirmeden sonra sırası kesin olan', ortakMetin: METIN, dunyalar: raf,
    kok: 'Görevli, ciltli üç kitaptan öteki ikisinin arasında duran kitap ile ciltsiz kitaplardan rafın en sağında duran kitabın yerlerini değiştiriyor; diğer beş kitabın yeri değişmiyor. Buna göre yeni dizilişte aşağıdaki kitaplardan hangisinin rafın soldan kaçıncı sırasında durduğu kesin olarak bilinir?',
    aciklama:
      'Önce yer değiştiren iki kitabı bulmak gerekir. Lodos ile Pusula’nın arasındaki üç kitap ciltlidir ve bu üçlü Mercan ile Kervan’ı içerir; Mercan, Lodos’un hemen sağında olmadığı için üçlünün ortasındadır. Serap Pusula’dan daha sağda olduğundan Pusula yedinci sırada olamaz; ciltli üçlü en geç beşinci sırada biter ve yedinci sıradaki kitap her durumda ciltsizdir. Demek ki Mercan, yedinci sıradaki kitapla yer değiştirir ve yeni dizilişte yedinci sıradadır. Mercan’ın eski yeri üçüncü ya da dördüncü sıra olabilirdi; yeni yeri ise kesindir. Kervan dördüncü ya da beşinci, Pusula beşinci ya da altıncı, Lodos birinci ya da ikinci sırada kalır. Serap yedinci sıradaysa Mercan’ın eski yerine geçer, altıncı sıradaysa yerinde kalır; yeri kesin değildir.',
    ...sik(
      ['Mercan', 'Kervan', 'Serap', 'Lodos', 'Pusula'],
      ['Mercan', 'Kervan', 'Serap', 'Lodos', 'Pusula'].map((k) => sabit((d) => yeniYer(d, k))),
      5062,
    ),
  },
  {
    id: 'aay-p5-18', zorluk: 'hard', baslik: 'Kütüphane rafı · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: raf,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Lodos, Pusula ve aralarındaki üç kitap beş sıra kaplar; dışarıda kalan iki sıraya yan yana üç ciltli kitap sığmaz, bu yüzden ciltli üçlü Lodos ile Pusula’nın arasındadır. Kervan ciltlidir; Mercan ciltsiz olsaydı üçlünün hemen solunda, yani Lodos’un yerinde dururdu, bu yüzden Mercan da ciltlidir. Serap Pusula’dan daha sağda, ciltli üçlünün dışında olduğundan ciltsizdir. Üçüncü ciltli kitap geriye kalan Nilüfer ile Orman’dan biridir; öbürü ciltsizdir. Öteki ifadeler kesin değildir: Lodos, Nilüfer, Mercan, Kervan, Pusula, Orman, Serap dizilişinde Orman ciltsizdir. Orman, Lodos, Nilüfer, Mercan, Kervan, Pusula, Serap dizilişinde Lodos en solda değildir. Lodos, Orman, Mercan, Kervan, Pusula, Serap, Nilüfer dizilişinde ise Serap altıncı sıradadır ve Mercan’ın hemen solunda Orman durur.',
    ...sik(
      [
        'Nilüfer ile Orman’dan yalnızca biri ciltlidir.',
        'Lodos rafın en solunda durmaktadır.',
        'Serap rafın en sağında durmaktadır.',
        'Orman ciltlidir.',
        'Nilüfer, Mercan’ın hemen solunda durmaktadır.',
      ],
      [
        her((d) => ciltli(d, 'Nilüfer') !== ciltli(d, 'Orman')),
        her((d) => yer(d, 'Lodos') === 1),
        her((d) => yer(d, 'Serap') === 7),
        her((d) => ciltli(d, 'Orman')),
        her((d) => yer(d, 'Nilüfer') === yer(d, 'Mercan') - 1),
      ],
      5063,
    ),
  },
];
