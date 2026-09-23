/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 2 — bağış kolileri (koli → kütüphane).
 *
 * Aile: PAEM 10/84-86 (ofis alışverişi) — nesneler birimlere dağıtılıyor ve
 * birim başına sayı VERİLMİYOR; sayılar yalnız ilişkilerle daralıyor. İskelet
 * bilerek farklı: orada üç sabit ürün, üçlü "farklı mağaza" ve iki mağazanın
 * eşitliği vardı. Burada tek sabit koli, "bir fazla" sayım öncülü ve "en az
 * bir" alt sınırı iki sayı dağılımı bırakıyor: (Akasya, Çınar, Meşe) =
 * (1, 2, 4) ya da (2, 3, 2). Oyuncak–bulmaca çifti kapasite yüzünden Çınar’a
 * iner, Meşe’ye giremeyen atlas (1, 2, 4)’ü düşürür, Meşe’nin iki yeri de
 * dergi–boya ayrılığı yüzünden kırtasiyeyi kilitler. Dört dağılım kalır.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "bir fazla", "en az bir", "eşit sayıda"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s2
 */
import { hicbiri, her, romenSik, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const KOLI = ['Kitap', 'Dergi', 'Oyuncak', 'Kırtasiye', 'Bulmaca', 'Atlas', 'Boya'];
const KUTUPHANE = ['Akasya', 'Çınar', 'Meşe'];

const METIN =
  'Bir belediye, bağış kampanyasında toplanan kitap, dergi, oyuncak, kırtasiye, bulmaca, atlas ve boya kolilerini Akasya, Çınar ve Meşe adlı üç mahalle kütüphanesine dağıtmıştır. Her türden yalnızca bir koli, yani toplam yedi koli vardır ve her koli bu üç kütüphaneden yalnızca birine gönderilmiştir. Dağıtımla ilgili bilinenler şunlardır:\n' +
  '- Her kütüphaneye en az bir koli gönderilmiştir.\n' +
  '- Çınar Kütüphanesine gönderilen koli sayısı, Akasya Kütüphanesine gönderilen koli sayısından bir fazladır.\n' +
  '- Kitap kolisi Akasya Kütüphanesine gönderilmiştir.\n' +
  '- Oyuncak ve bulmaca kolileri aynı kütüphaneye gönderilmiştir.\n' +
  '- Bulmaca kolisi de atlas kolisi de Meşe Kütüphanesine gönderilmemiştir.\n' +
  '- Dergi ve boya kolileri farklı kütüphanelere gönderilmiştir.';

// Metnin kurduğu uzay: her koliye üç kütüphaneden biri (3^7), sonra öncüller.
const say = (d: Dunya, k: string) => KOLI.filter((x) => d[x] === k).length;
const dagitim: Dunya[] = [];
for (let m = 0; m < 3 ** 7; m++) {
  const d: Dunya = {};
  KOLI.forEach((x, i) => (d[x] = KUTUPHANE[Math.floor(m / 3 ** i) % 3]));
  if (KUTUPHANE.some((k) => say(d, k) < 1)) continue;
  if (say(d, 'Çınar') !== say(d, 'Akasya') + 1) continue;
  if (d.Kitap !== 'Akasya') continue;
  if (d.Oyuncak !== d.Bulmaca) continue;
  if (d.Bulmaca === 'Meşe' || d.Atlas === 'Meşe') continue;
  if (d.Dergi === d.Boya) continue;
  dagitim.push(d);
}

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-04', zorluk: 'medium', baslik: 'Koli · kesinlikle doğru', ortakMetin: METIN, dunyalar: dagitim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Akasya’ya en az bir koli, Çınar’a ondan bir fazla koli gitmiş ve Meşe’ye de en az bir koli kalmıştır; bu yüzden koli sayıları (Akasya, Çınar, Meşe) ya (1, 2, 4) ya da (2, 3, 2) olabilir. Oyuncak ile bulmaca birlikte gönderilmiştir ve bulmaca Meşe’ye gitmemiştir. Akasya’da kitap bulunduğundan bu ikisi oraya gitseydi Akasya’da üç koli olurdu; bu iki dağılımın hiçbirine uymadığından oyuncak ile bulmaca Çınar’dadır. (1, 2, 4) dağılımında Akasya’da yalnız kitap, Çınar’da yalnız oyuncak ile bulmaca kalırdı ve Meşe’ye gidemeyen atlasa yer bulunmazdı. Demek ki dağılım (2, 3, 2)’dir: Akasya ile Meşe’ye ikişer koli gönderilmiştir. Atlasın Çınar’a, derginin Meşe’ye gitmesi ya da kitap ile atlasın aynı kütüphanede olması mümkündür ama zorunlu değildir; Meşe’ye üç koli gitmesi ise olanaksızdır.',
    // Doğru şık İLK verilir; sik() tohumla karıştırır.
    ...sik(
      [
        'Akasya ve Meşe kütüphanelerine eşit sayıda koli gönderilmiştir.',
        'Atlas kolisi Çınar Kütüphanesine gönderilmiştir.',
        'Dergi kolisi Meşe Kütüphanesine gönderilmiştir.',
        'Kitap ve atlas kolileri aynı kütüphaneye gönderilmiştir.',
        'Meşe Kütüphanesine üç koli gönderilmiştir.',
      ],
      [
        her((d) => say(d, 'Akasya') === say(d, 'Meşe')),
        her((d) => d.Atlas === 'Çınar'),
        her((d) => d.Dergi === 'Meşe'),
        her((d) => d.Kitap === d.Atlas),
        her((d) => say(d, 'Meşe') === 3),
      ],
      4121,
    ),
  },
  {
    id: 'aay-p4-05', zorluk: 'hard', baslik: 'Koli · aynı kütüphaneye gidemeyecek çift', ortakMetin: METIN, dunyalar: dagitim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdaki koli çiftlerinden hangisi aynı kütüphaneye gönderilmiş olamaz?',
    aciklama:
      'Çınar’a Akasya’dan bir fazla koli gittiği ve Meşe’ye de en az bir koli kaldığı için Akasya’ya en fazla iki koli gidebilir. Oyuncak ile bulmaca Meşe’ye gidemez; Akasya’ya gitselerdi kitapla birlikte orada üç koli olurdu. Bu yüzden ikisi Çınar’dadır. Akasya’da yalnız kitap olsaydı Çınar’da yalnız bu iki koli kalır, Meşe’ye gidemeyen atlas açıkta kalırdı; öyleyse Akasya’ya iki, Çınar’a üç, Meşe’ye iki koli gitmiştir. Akasya’da kitabın yanında bir, Çınar’da oyuncak ile bulmacanın yanında bir boş yer vardır ve atlas bu iki yerden birini alır. Atlas Meşe’ye gidemediği için dergi onunla ancak Akasya’da ya da Çınar’da buluşabilirdi; ikisinde de tek boş yer olduğundan bu olanaksızdır. Öteki çiftler gerçekleşebilir: kitap ile boya Akasya’da, atlas ile oyuncak ya da dergi ile bulmaca Çınar’da, kırtasiye ile boya Meşe’de bulunabilir.',
    ...sik(
      ['Dergi ve atlas', 'Kitap ve boya', 'Atlas ve oyuncak', 'Dergi ve bulmaca', 'Kırtasiye ve boya'],
      [
        hicbiri((d) => d.Dergi === d.Atlas),
        hicbiri((d) => d.Kitap === d.Boya),
        hicbiri((d) => d.Atlas === d.Oyuncak),
        hicbiri((d) => d.Dergi === d.Bulmaca),
        hicbiri((d) => d.Kırtasiye === d.Boya),
      ],
      4128,
    ),
  },
  {
    id: 'aay-p4-06', zorluk: 'hard', baslik: 'Koli · kütüphanesi kesin bilinenler', ortakMetin: METIN, dunyalar: dagitim,
    kok: 'Yukarıdaki bilgilere göre,\nI. Oyuncak\nII. Kırtasiye\nIII. Boya\nkolilerinden hangilerinin gönderildiği kütüphane kesin olarak bilinmektedir?',
    aciklama:
      'Oyuncak ile bulmaca aynı kütüphanededir ve bulmaca Meşe’ye gitmemiştir. Akasya’ya gitselerdi kitapla birlikte orada üç koli olurdu; Çınar’a Akasya’dan bir fazla, yani dört koli gider ve Meşe’ye hiç koli kalmazdı; oysa her kütüphaneye en az bir koli gönderilmiştir. Bu yüzden oyuncak kesin olarak Çınar’dadır (I). Aynı akışla koli sayıları Akasya’da iki, Çınar’da üç, Meşe’de ikidir; çünkü Akasya’da tek koli olsaydı Meşe’ye gidemeyen atlasa yer kalmazdı. Meşe’deki iki yer; kitap, oyuncak, bulmaca ve atlas dışında kalan dergi, kırtasiye ve boyadan ikisiyle dolar. Dergi ile boya farklı kütüphanelerde olduğundan ikisi birlikte Meşe’ye gidemez; o hâlde kırtasiye kesin olarak Meşe’dedir (II). Boya ise Akasya’ya, Çınar’a ya da Meşe’ye gönderilmiş olabilir (III belirlenemez).',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [sabit((d) => d.Oyuncak as string), sabit((d) => d.Kırtasiye as string), sabit((d) => d.Boya as string)],
      [[1, 2], [1], [1, 3], [2, 3], [1, 2, 3]],
    ),
  },
];
