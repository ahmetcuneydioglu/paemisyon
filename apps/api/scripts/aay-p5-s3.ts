/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 3 — teknoloji fuarı (firma → salon).
 *
 * Aile: PAEM 10/84-86 (ofis alışverişi) — nesneler birimlere dağıtılıyor ve
 * birim başına sayı VERİLMİYOR; sayılar yalnız ilişkilerle daralıyor. İskelet
 * bilerek farklı: orada üç sabit ürün, üçlü "farklı mağaza" ve iki mağazanın
 * eşitliği vardı; 4. partinin koli senaryosunda "bir fazla" sayımı vardı.
 * Burada iki KESİN karşılaştırma (Mavi > Yeşil, Turuncu > Yeşil) ile "her
 * salonda en az bir firma" birlikte Yeşil’i TEK firmaya kilitliyor:
 *   - iki "aynı salon" çifti Yeşil’e sığmıyor; Gigaran Turuncu’da olmadığı
 *     için Fotonya–Gigaran Mavi’ye iniyor,
 *   - Yeşil’deki tek firma Çiprom, Datavel ya da Ekranova oluyor,
 *   - Turuncu’nun en az iki firması gerektiği için Arvolt–Bitora, Datavel ile
 *     aynı salona giremiyor (Mavi’de beş firma, Turuncu’da tek firma kalırdı).
 * Altı yerleşim kalır.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - karşılaştırmalar tek anlamlı: "… firma sayısından fazladır" (eşitlik yok),
 *     alt sınır "en az bir firma"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s3
 */
import { bazi, hicbiri, romenSik, sik, yeterli, type Bulmaca, type Dunya } from './aay-cozucu';

const FIRMA = ['Arvolt', 'Bitora', 'Çiprom', 'Datavel', 'Ekranova', 'Fotonya', 'Gigaran'];
const SALON = ['Mavi', 'Yeşil', 'Turuncu'];

const METIN =
  'Bir teknoloji fuarında Arvolt, Bitora, Çiprom, Datavel, Ekranova, Fotonya ve Gigaran adlı yedi firma, Mavi, Yeşil ve Turuncu adlı üç salona yerleştirilmiştir. Her firma bu salonlardan yalnızca birinde yer almış, her salona da en az bir firma yerleştirilmiştir. Yerleşimle ilgili bilinenler şunlardır:\n' +
  '- Mavi salondaki firma sayısı, Yeşil salondaki firma sayısından fazladır.\n' +
  '- Turuncu salondaki firma sayısı, Yeşil salondaki firma sayısından fazladır.\n' +
  '- Arvolt ile Bitora aynı salonda yer almıştır.\n' +
  '- Fotonya ile Gigaran aynı salonda yer almıştır.\n' +
  '- Gigaran Turuncu salonda yer almamıştır.\n' +
  '- Çiprom Mavi salonda yer almamıştır.\n' +
  '- Datavel Turuncu salonda yer almamıştır.';

// Metnin kurduğu uzay: her firmaya üç salondan biri (3^7), sonra öncüller.
const say = (d: Dunya, s: string) => FIRMA.filter((f) => d[f] === s).length;
const yerlesim: Dunya[] = [];
for (let m = 0; m < 3 ** 7; m++) {
  const d: Dunya = {};
  FIRMA.forEach((f, i) => (d[f] = SALON[Math.floor(m / 3 ** i) % 3]));
  if (SALON.some((s) => say(d, s) < 1)) continue;
  if (say(d, 'Mavi') <= say(d, 'Yeşil')) continue;
  if (say(d, 'Turuncu') <= say(d, 'Yeşil')) continue;
  if (d.Arvolt !== d.Bitora) continue;
  if (d.Fotonya !== d.Gigaran) continue;
  if (d.Gigaran === 'Turuncu') continue;
  if (d.Çiprom === 'Mavi') continue;
  if (d.Datavel === 'Turuncu') continue;
  yerlesim.push(d);
}

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-07', zorluk: 'hard', baslik: 'Fuar · aynı salonda olamayacak çift', ortakMetin: METIN, dunyalar: yerlesim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdaki firma çiftlerinden hangisi aynı salonda yer almış olamaz?',
    aciklama:
      'Yeşil’de iki firma olsaydı Mavi ile Turuncu’da en az üçer firma gerekir, toplam sekizi bulurdu; bu yüzden Yeşil’de tek firma, öteki iki salonda en az ikişer firma vardır. Birlikte yerleşen Fotonya ile Gigaran Yeşil’e sığmaz, Gigaran Turuncu’da da olmadığından ikisi Mavi’dedir. Datavel Turuncu’da değildir. Datavel Mavi’deyken Arvolt ile Bitora da oraya gitseydi Mavi’de beş firma olur, kalan Çiprom ile Ekranova’dan biri Yeşil’e düşer ve Turuncu’da tek firma kalırdı. Datavel Yeşil’deyken de Arvolt, Bitora’yla birlikte oraya sığmaz; bu yüzden Arvolt ile Datavel aynı salonda olamaz. Öteki çiftler bir arada bulunabilir: Mavi’de Arvolt, Bitora, Fotonya, Gigaran; Yeşil’de Datavel; Turuncu’da Çiprom ile Ekranova olabilir. Mavi’de Datavel, Ekranova, Fotonya, Gigaran; Yeşil’de Çiprom; Turuncu’da Arvolt ile Bitora da olabilir. Datavel Yeşil’deyken Arvolt ile Çiprom Turuncu’da buluşabilir.',
    // Doğru şık İLK verilir; sik() tohumla karıştırır.
    ...sik(
      ['Arvolt ve Datavel', 'Bitora ve Fotonya', 'Çiprom ve Ekranova', 'Datavel ve Ekranova', 'Arvolt ve Çiprom'],
      [
        hicbiri((d) => d.Arvolt === d.Datavel),
        hicbiri((d) => d.Bitora === d.Fotonya),
        hicbiri((d) => d.Çiprom === d.Ekranova),
        hicbiri((d) => d.Datavel === d.Ekranova),
        hicbiri((d) => d.Arvolt === d.Çiprom),
      ],
      5131,
    ),
  },
  {
    id: 'aay-p5-08', zorluk: 'hard', baslik: 'Fuar · tam belirlemek için yeterli bilgi', ortakMetin: METIN, dunyalar: yerlesim,
    kok: 'Tüm firmaların yer aldığı salonun tam olarak belirlenebilmesi için aşağıdakilerden hangisinin bilinmesi yeterlidir?',
    aciklama:
      'Yeşil’de iki firma olsaydı öteki salonlarda en az üçer firma gerekirdi; bu yüzden Yeşil’de tek firma vardır. Oraya sığmayan ve Turuncu’ya giremeyen Fotonya–Gigaran çifti Mavi’dedir. Yeşil’deki firma Çiprom, Datavel ya da Ekranova olur; altı yerleşim kalır. Ekranova Yeşil’deyse tablo tektir. Ekranova Mavi’deyse Mavi’de dört firma varken Datavel Mavi’de, üç firma varken Yeşil’dedir. Ekranova Turuncu’daysa Mavi’deki iki, üç ve dört firma ayrı birer yerleşime karşılık gelir; bu iki bilgi yeterlidir. Gigaran’ın Mavi’de olduğu zaten bilinir; Mavi’de dört firma olması iki yerleşim bırakır. Ekranova Turuncu’da, Datavel Yeşil’deyken Arvolt ile Bitora’nın salonu açık kalır. Datavel Mavi’de, Turuncu’da üç firma varken Ekranova’nın salonu açık kalır. Arvolt Turuncu’da, Çiprom Yeşil’deyken de Ekranova’nın salonu belirlenemez.',
    ...sik(
      [
        'Ekranova’nın yer aldığı salon ile Mavi salondaki firma sayısı',
        'Gigaran’ın yer aldığı salon ile Mavi salondaki firma sayısı',
        'Ekranova’nın yer aldığı salon ile Datavel’in yer aldığı salon',
        'Datavel’in yer aldığı salon ile Turuncu salondaki firma sayısı',
        'Arvolt’un yer aldığı salon ile Çiprom’un yer aldığı salon',
      ],
      [
        yeterli((d) => `${d.Ekranova}|${say(d, 'Mavi')}`),
        yeterli((d) => `${d.Gigaran}|${say(d, 'Mavi')}`),
        yeterli((d) => `${d.Ekranova}|${d.Datavel}`),
        yeterli((d) => `${d.Datavel}|${say(d, 'Turuncu')}`),
        yeterli((d) => `${d.Arvolt}|${d.Çiprom}`),
      ],
      5032,
    ),
  },
  {
    id: 'aay-p5-09', zorluk: 'medium', baslik: 'Fuar · Yeşil salonda olabilecekler', ortakMetin: METIN, dunyalar: yerlesim,
    kok: 'Yukarıdaki bilgilere göre,\nI. Bitora\nII. Datavel\nIII. Ekranova\nadlı firmalardan hangileri Yeşil salonda yer almış olabilir?',
    aciklama:
      'Yeşil’de iki firma olsaydı Mavi ile Turuncu’da en az üçer firma gerekir, toplam sekizi bulurdu; bu yüzden Yeşil’de tek firma vardır. Arvolt ile Bitora aynı salonda olduğundan ikisi Yeşil’e sığmaz; Bitora Yeşil’de olamaz (I). Datavel Yeşil’de olabilir: Datavel Yeşil’de; Ekranova, Fotonya ve Gigaran Mavi’de; Arvolt, Bitora ve Çiprom Turuncu’da iken bütün bilgiler sağlanır (II). Ekranova Yeşil’deyse Çiprom Mavi’de olamadığı için Turuncu’ya, Datavel Turuncu’da olamadığı için Mavi’ye gider. Arvolt ile Bitora Mavi’ye gitseydi Turuncu’da tek firma kalırdı; bu yüzden onlar Turuncu’dadır. Mavi’de Datavel, Fotonya ve Gigaran; Turuncu’da Arvolt, Bitora ve Çiprom bulunan bu yerleşim de bütün bilgileri sağlar (III). Doğru cevap II ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Bitora === 'Yeşil'), bazi((d) => d.Datavel === 'Yeşil'), bazi((d) => d.Ekranova === 'Yeşil')],
      [[2, 3], [2], [3], [1, 2], [1, 2, 3]],
    ),
  },
];
