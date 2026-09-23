/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 7 — radyo programı (sıra × tür, sona alma).
 *
 * Aile: PAEM 9/85-87 (mülakat) — altı öğeli bir SIRA, her öğeye İKİLİ bir
 * nitelik (yerli / yabancı) ve sıraya uygulanan bir DÖNÜŞÜM. İskelet
 * bilerek farklı: orada ilk üç sıra adlarıyla verilmiş, iki telefon
 * mülakatı EN BAŞA alınıyordu. Burada hiçbir sıra ad listesiyle verilmez;
 * türler sıraya bir KALIPLA bağlanır ("iki yabancı şarkı art arda
 * çalınmamıştır" + "ilk şarkı yabancı") ve yabancı şarkılar programın
 * SONUNA atılır.
 *
 * Zincir: üç yabancı şarkı ilk sırada başlayıp art arda gelmeyince yalnız
 * üç kalıp kalır — (1, 3, 5), (1, 3, 6), (1, 4, 6). Rüzgâr yabancıdır ve
 * Liman’dan hemen sonra çalınmıştır: Liman yerlidir, Rüzgâr 5’te (Dalga’nın
 * yeri) ve 6’da (Liman 5’e düşerdi) olamaz → Rüzgâr 3’te ya da 4’te, her
 * kalıpta yabancıların ORTANCASI. Tür sayımı: Rüzgâr yabancı, Liman yerli;
 * kalan dördün ikisi yerli, ikisi yabancı ve Ayna ile Bulut aynı türden →
 * Çiçek ile Dalga da aynı türden. Açık kalan: kalıp (üç) × Ayna/Bulut
 * yer değişimi (iki) — 6 çözüm.
 *
 * Dönüşümün tuzağı: Dalga’nın ESKİ yeri kesin (5) ama türü açık olduğu için
 * yeni yeri 3 ya da 6; Rüzgâr’ın eski yeri açık (3/4) ama yeni yeri kesin (5).
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "üçü yerli, üçü yabancı", "hemen sonra",
 *     "hiçbir iki yabancı şarkı art arda"; "tür" giriş cümlesinde yerli /
 *     yabancı olarak tanımlanır (müzik türüyle karışmasın)
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s7
 */
import { dizilimler, her, hicbiri, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const SARKI = ['Ayna', 'Bulut', 'Çiçek', 'Dalga', 'Liman', 'Rüzgâr'];
const SIRA = [1, 2, 3, 4, 5, 6];

const METIN =
  'Bir yerel radyonun akşam programında Ayna, Bulut, Çiçek, Dalga, Liman ve Rüzgâr adlı altı şarkı, her biri yalnızca bir kez olmak üzere sırayla çalınmış; programda başka şarkı çalınmamıştır. Her şarkı, yerli ve yabancı olmak üzere iki türden yalnızca birine aittir. Şarkıların çalınma sırası ve türleriyle ilgili bilinenler şunlardır:\n' +
  '- Şarkıların üçü yerli, üçü yabancıdır.\n' +
  '- Hiçbir iki yabancı şarkı art arda çalınmamıştır.\n' +
  '- Programın ilk şarkısı yabancıdır.\n' +
  '- Rüzgâr yabancı bir şarkıdır ve Liman’dan hemen sonra çalınmıştır.\n' +
  '- Dalga beşinci sırada çalınmıştır.\n' +
  '- Ayna ile Bulut aynı türdendir.';

const yer = (d: Dunya, s: string) => d[`${s}_sira`] as number;
const yabanci = (d: Dunya, s: string) => d[`${s}_tur`] === 'yabancı';
const siradaki = (d: Dunya, i: number) => SARKI.find((s) => yer(d, s) === i)!;

// Metnin kurduğu uzay: altı şarkının her sıralaması (6!) × her şarkıya bir tür (2^6), sonra öncüller.
const program: Dunya[] = [];
for (const sira of dizilimler(SARKI, SIRA)) {
  for (let m = 0; m < 2 ** 6; m++) {
    const d: Dunya = {};
    SARKI.forEach((s, i) => {
      d[`${s}_sira`] = sira[s];
      d[`${s}_tur`] = (m >> i) & 1 ? 'yabancı' : 'yerli';
    });
    if (SARKI.filter((s) => yabanci(d, s)).length !== 3) continue;
    if (SIRA.slice(0, -1).some((i) => yabanci(d, siradaki(d, i)) && yabanci(d, siradaki(d, i + 1)))) continue;
    if (!yabanci(d, siradaki(d, 1))) continue;
    if (!(yabanci(d, 'Rüzgâr') && yer(d, 'Rüzgâr') === yer(d, 'Liman') + 1)) continue;
    if (yer(d, 'Dalga') !== 5) continue;
    if (d.Ayna_tur !== d.Bulut_tur) continue;
    program.push(d);
  }
}

/**
 * Yeni akış: yerliler kendi sıralarını koruyarak başta, yabancılar kendi
 * sıralarını koruyarak sonda. Yabancı bir şarkının yeni yeri = yerli sayısı
 * + kendisinden önce çalınan yabancı sayısı + 1.
 */
const yeniSira = (d: Dunya, s: string): number => {
  const once = SARKI.filter((x) => yer(d, x) < yer(d, s) && yabanci(d, x) === yabanci(d, s)).length;
  const yerliSayisi = SARKI.filter((x) => !yabanci(d, x)).length;
  return (yabanci(d, s) ? yerliSayisi : 0) + once + 1;
};

const artArda = (d: Dunya, a: string, b: string) => Math.abs(yer(d, a) - yer(d, b)) === 1;

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-19', zorluk: 'medium', baslik: 'Radyo · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: program,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Rüzgâr yabancıdır ve Liman’dan hemen sonra çalınmıştır. İki yabancı şarkı art arda çalınamadığı için Liman yerli olmak zorundadır. Geriye kalan Ayna, Bulut, Çiçek ve Dalga arasında iki yerli ve iki yabancı şarkı vardır. Ayna ile Bulut aynı türden olduğuna göre ya ikisi de yabancıdır ve Çiçek ile Dalga yerlidir ya da ikisi de yerlidir ve Çiçek ile Dalga yabancıdır. Her iki durumda Çiçek ile Dalga aynı türdendir. Öteki ifadeler yalnız bazı sıralamalarda doğrudur: Çiçek, Liman, Rüzgâr, Bulut, Dalga, Ayna sıralamasında Ayna yerlidir, Rüzgâr üçüncü, Bulut dördüncü sıradadır; Ayna, Çiçek, Liman, Rüzgâr, Dalga, Bulut sıralamasında ise Liman üçüncü sırada çalınmıştır.',
    ...sik(
      [
        'Çiçek ile Dalga aynı türdendir.',
        'Ayna yabancı bir şarkıdır.',
        'Liman ikinci sırada çalınmıştır.',
        'Bulut son sırada çalınmıştır.',
        'Rüzgâr dördüncü sırada çalınmıştır.',
      ],
      [
        her((d) => d.Çiçek_tur === d.Dalga_tur),
        her((d) => yabanci(d, 'Ayna')),
        her((d) => yer(d, 'Liman') === 2),
        her((d) => yer(d, 'Bulut') === 6),
        her((d) => yer(d, 'Rüzgâr') === 4),
      ],
      4071,
    ),
  },
  {
    id: 'aay-p4-20', zorluk: 'hard', baslik: 'Radyo · yabancılar sona alınınca sırası kesin olan', ortakMetin: METIN, dunyalar: program,
    kok: 'Programın yayın akışı değiştirilerek yabancı şarkılar, kendi aralarındaki sıra korunarak programın sonuna alınıyor; yerli şarkılar da kendi aralarındaki sırayı koruyarak programın başında çalınıyor. Buna göre yeni yayın akışında aşağıdaki şarkılardan hangisinin çalınma sırası kesin olarak bilinir?',
    aciklama:
      'Yeni akışta üç yerli şarkı ilk üç sırayı, üç yabancı şarkı son üç sırayı alır; her grup kendi içindeki sırayı korur. İlk şarkı yabancıdır ve iki yabancı şarkı art arda gelemez; bu yüzden yabancı şarkılar 1, 3 ve 5 ya da 1, 3 ve 6 ya da 1, 4 ve 6. sıralardadır. Rüzgâr yabancıdır ve Liman’dan hemen sonra çalınmıştır: birinci sırada olamaz, beşinci sıra Dalga’nındır, altıncı sırada olsaydı Liman beşinci olurdu. Rüzgâr üçüncü ya da dördüncü sıradadır ve her durumda üç yabancı şarkının ortancasıdır; yeni akışta beşinci sırada çalınır. Dalga’nın eski yeri bilinse de türü belli değildir: yabancıysa altıncı, yerliyse üçüncü sıraya geçer. Yeni akışta Liman birinci ya da ikinci, Çiçek birinci, ikinci ya da dördüncü, Ayna ise ikinci, üçüncü, dördüncü ya da altıncı sırada olabilir.',
    ...sik(
      ['Rüzgâr', 'Dalga', 'Liman', 'Çiçek', 'Ayna'],
      [
        sabit((d) => yeniSira(d, 'Rüzgâr')),
        sabit((d) => yeniSira(d, 'Dalga')),
        sabit((d) => yeniSira(d, 'Liman')),
        sabit((d) => yeniSira(d, 'Çiçek')),
        sabit((d) => yeniSira(d, 'Ayna')),
      ],
      4072,
    ),
  },
  {
    id: 'aay-p4-21', zorluk: 'hard', baslik: 'Radyo · art arda çalınmış olamayacak ikili', ortakMetin: METIN, dunyalar: program,
    kok: 'Yukarıdaki bilgilere göre, aşağıdaki şarkı ikililerinden hangisi art arda çalınmış olamaz?',
    aciklama:
      'Liman, yabancı olan Rüzgâr’dan hemen önce çalındığı için yerlidir. Ayna ile Bulut yabancıysa, iki yabancı şarkı art arda çalınamayacağından yan yana gelemezler. Yerliyseler Liman ile birlikte üç yerli şarkı tamamlanır; Dalga yabancı olur. İlk şarkı ve beşinci sıradaki Dalga yabancıdır; üçüncü yabancı şarkı bunlara komşu olmayan tek sıra olan üçüncü sıradadır. Yerli şarkılar 2, 4 ve 6. sıralara düşer. İkinci sırada Liman olduğu için Ayna ile Bulut dördüncü ve altıncı sıradadır ve yine art arda değildir. Öteki ikililer mümkündür: Ayna, Liman, Rüzgâr, Çiçek, Dalga, Bulut sıralamasında Rüzgâr ile Çiçek, Çiçek ile Dalga; Bulut, Liman, Rüzgâr, Çiçek, Dalga, Ayna sıralamasında Bulut ile Liman, Dalga ile Ayna art arda çalınmıştır.',
    ...sik(
      ['Ayna ve Bulut', 'Bulut ve Liman', 'Rüzgâr ve Çiçek', 'Ayna ve Dalga', 'Çiçek ve Dalga'],
      [
        hicbiri((d) => artArda(d, 'Ayna', 'Bulut')),
        hicbiri((d) => artArda(d, 'Bulut', 'Liman')),
        hicbiri((d) => artArda(d, 'Rüzgâr', 'Çiçek')),
        hicbiri((d) => artArda(d, 'Ayna', 'Dalga')),
        hicbiri((d) => artArda(d, 'Çiçek', 'Dalga')),
      ],
      4073,
    ),
  },
];
