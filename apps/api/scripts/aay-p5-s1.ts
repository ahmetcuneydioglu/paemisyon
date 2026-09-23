/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 1 — müzik festivali (kişi başı üç konser).
 *
 * Aile: PAEM 10/87-90 (tatil köyü) — her kişi n seçenekten tam k tanesini
 * seçer; sayım öncülleri ve "aynı seçimi yapanlar" ilişkileri tabloyu
 * daraltır. İskelet bilerek farklı: orada üç aktiviteden ikişer seçim ve açık
 * "aynı iki aktivite" eşlemeleri vardı, 4. partinin dil okulu da dört dersten
 * ikişer seçimdi. Burada dört konserden ÜÇER seçim yapılır; her kişiyi
 * atladığı TEK konser belirler ve bütün sayımlar "kaç kişi atladı" sayımına
 * dönüşür. Öncüller bu dönüşümü zorunlu kılar:
 *   - kesin üstünlük ("Caz, diğer üçünün her birinden fazla") toplam beş
 *     atlamayla birleşince Caz’ı kimsenin atlamadığını, Klasik ile Rock’ı en
 *     az birer kişinin atladığını verir;
 *   - "Tango’ya toplam dört kişi" Tango’yu atlayan TEK kişi bırakır;
 *   - "Cenk’in aldığı her konsere Nehir de almıştır" iki üçlü küme arasında
 *     eşitliktir (aynı üç konser); "yalnızca ikisi ortak" ise farklılıktır.
 * Cenk–Nehir ikilisi Tango’yu atlayamaz. Berfin (Klasik’i atlamaz) ile Selin
 * (Rock’ı atlamaz) ancak Tango’da buluşabilirdi, o da tek kişilik. Yedi çözüm
 * kalır; Arda ile Selin’in aynı üç konseri seçtiği yalnız biridir — "olabilir"
 * sorusunun tuzağı bu.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "arkadaşlardan toplam dört kişi", "diğer üç
 *     konserin her birinden fazladır" (eşitlik yok), "yalnızca ikisi ortaktır"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s1
 */
import { bazi, her, hicbiri, romenSik, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const KISI = ['Arda', 'Berfin', 'Cenk', 'Nehir', 'Selin'];
const KONSER = ['Caz', 'Klasik', 'Rock', 'Tango'];

const METIN =
  'Bir müzik festivalinde Caz, Klasik, Rock ve Tango olmak üzere dört ayrı konser düzenlenmiştir. Festivale giden Arda, Berfin, Cenk, Nehir ve Selin adlı beş arkadaşın her biri, bu dört konserden tam olarak üçüne birer bilet almış, kalan tek konsere bilet almamıştır. Arkadaşların aldığı biletlerle ilgili bilinenler şunlardır:\n' +
  '- Caz konserine bilet alan arkadaş sayısı, diğer üç konserin her birine bilet alan arkadaş sayısından fazladır.\n' +
  '- Tango konserine arkadaşlardan toplam dört kişi bilet almıştır.\n' +
  '- Cenk’in bilet aldığı her konsere Nehir de bilet almıştır.\n' +
  '- Arda ile Berfin’in bilet aldığı konserlerden yalnızca ikisi ortaktır.\n' +
  '- Berfin Klasik konserine, Selin ise Rock konserine bilet almıştır.';

/** Dünyada her kişinin değeri, bilet ALMADIĞI tek konserdir; aldığı üç konser ondan okunur. */
const aldi = (d: Dunya, k: string, c: string) => d[k] !== c;
const say = (d: Dunya, c: string) => KISI.filter((k) => aldi(d, k, c)).length;
const ortak = (d: Dunya, a: string, b: string) => KONSER.filter((c) => aldi(d, a, c) && aldi(d, b, c)).length;
const ayniUc = (d: Dunya, a: string, b: string) => ortak(d, a, b) === 3;

// Metnin kurduğu uzay: her kişiye atladığı bir konser (4^5), sonra öncüller.
const bilet: Dunya[] = [];
for (let m = 0; m < 4 ** 5; m++) {
  const d: Dunya = Object.fromEntries(KISI.map((k, i) => [k, KONSER[Math.floor(m / 4 ** i) % 4]]));
  if (!KONSER.every((c) => c === 'Caz' || say(d, 'Caz') > say(d, c))) continue;
  if (say(d, 'Tango') !== 4) continue;
  if (!KONSER.every((c) => !aldi(d, 'Cenk', c) || aldi(d, 'Nehir', c))) continue;
  if (ortak(d, 'Arda', 'Berfin') !== 2) continue;
  if (!aldi(d, 'Berfin', 'Klasik') || !aldi(d, 'Selin', 'Rock')) continue;
  bilet.push(d);
}

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-01', zorluk: 'hard', baslik: 'Festival · Selin ile aynı üç konseri seçmiş olabilecekler', ortakMetin: METIN, dunyalar: bilet,
    kok: 'Yukarıdaki bilgilere göre,\nI. Arda\nII. Berfin\nIII. Nehir\nadlı arkadaşlardan hangileri Selin ile aynı üç konsere bilet almış olabilir?',
    aciklama:
      'Her arkadaş tek bir konsere bilet almadığı için aynı üç konsere bilet alan iki kişi, aynı konseri atlamış demektir. Caz’ı biri atlasaydı öteki üç konserin her birini en az ikişer kişi atlamalıydı; bu da beş kişiye sığmaz, yani Caz’ı kimse atlamamıştır. Tango’yu ise yalnızca bir kişi atlamıştır. Selin Klasik’i ya da Tango’yu, Berfin Rock’ı ya da Tango’yu atlamıştır; ikisinin buluşabileceği tek konser Tango’dur ve orada iki kişiye yer yoktur (II olamaz). Cenk’in her konserine Nehir de gittiği için ikisi aynı konseri atlamıştır. Cenk, Nehir ve Selin Klasik’i, Arda Rock’ı, Berfin Tango’yu atlarsa Nehir Selin ile aynıdır (III olabilir). Cenk ile Nehir Rock’ı, Arda ile Selin Klasik’i, Berfin Tango’yu atlarsa Arda Selin ile aynıdır (I olabilir). Arda’nın Selin ile aynı üç konseri seçtiği tek durum budur; bunu gözden kaçıran “Yalnız III” der. Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => ayniUc(d, 'Arda', 'Selin')), bazi((d) => ayniUc(d, 'Berfin', 'Selin')), bazi((d) => ayniUc(d, 'Nehir', 'Selin'))],
      [[1, 3], [3], [1, 2, 3], [2, 3], [1]],
    ),
  },
  {
    id: 'aay-p5-02', zorluk: 'hard', baslik: 'Festival · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: bilet,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Beş arkadaşın her biri bir konser atladığı için toplam beş atlama vardır. Caz’a bilet alan sayı öteki üç konserin her birinden fazla olduğundan, Caz’ı biri atlasaydı diğer üç konserin her birini en az ikişer kişi atlamalıydı ve atlama sayısı yediyi bulurdu. Demek ki herkes Caz’a bilet almıştır. Tango’ya dört kişi gittiğine göre Tango’yu tek kişi atlamıştır. Hem Klasik’e hem Rock’a bilet alan biri Caz’ı ya da Tango’yu atlamış olmalıdır; Caz’ı atlayan olmadığından bu kişi yalnızca Tango’yu atlayandır. Hem Caz’a hem Tango’ya giden ise Klasik’i ya da Rock’ı atlayan dört kişidir, üç değil. Cenk, Nehir ve Selin Klasik’i, Arda Rock’ı, Berfin Tango’yu atladığında Rock’a dört kişi gider ve Berfin Rock’a bilet almıştır; Cenk ile Nehir Rock’ı atladığında Cenk Rock’a gitmez. Bu üç ifade kesin değildir.',
    ...sik(
      [
        'Hem Klasik hem de Rock konserine bilet alan yalnızca bir arkadaş vardır.',
        'Rock konserine toplam üç arkadaş bilet almıştır.',
        'Berfin Rock konserine bilet almamıştır.',
        'Cenk Rock konserine bilet almıştır.',
        'Hem Caz hem de Tango konserine bilet alan toplam üç arkadaş vardır.',
      ],
      [
        her((d) => KISI.filter((k) => aldi(d, k, 'Klasik') && aldi(d, k, 'Rock')).length === 1),
        her((d) => say(d, 'Rock') === 3),
        her((d) => !aldi(d, 'Berfin', 'Rock')),
        her((d) => aldi(d, 'Cenk', 'Rock')),
        her((d) => KISI.filter((k) => aldi(d, k, 'Caz') && aldi(d, k, 'Tango')).length === 3),
      ],
      5012,
    ),
  },
  {
    id: 'aay-p5-03', zorluk: 'medium', baslik: 'Festival · kesinlikle yanlış olan', ortakMetin: METIN, dunyalar: bilet,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    aciklama:
      'Cenk’in bilet aldığı her konsere Nehir de bilet almıştır; ikisi de üçer konsere bilet aldığı için bu, aynı üç konsere bilet aldıkları anlamına gelir. Cenk Tango’ya bilet almasaydı Nehir de almamış olurdu ve Tango’ya en fazla üç kişi giderdi; oysa Tango’ya dört kişi bilet almıştır. Bu yüzden Cenk’in Tango’ya bilet almadığı ifadesi kesinlikle yanlıştır. Öteki ifadelerin her biri bir durumda gerçekleşir: Arda, Cenk ve Nehir Klasik’i, Selin Tango’yu, Berfin Rock’ı atladığında Selin Tango’ya gitmemiş, Arda ile Cenk aynı üç konseri seçmiştir. Cenk ile Nehir Rock’ı, Arda ile Selin Klasik’i, Berfin Tango’yu atladığında Klasik ile Rock’a üçer kişi gider. Arda Tango’yu, Berfin, Cenk ve Nehir Rock’ı, Selin Klasik’i atladığında ise Klasik’e dört kişi bilet almıştır.',
    ...sik(
      [
        'Cenk Tango konserine bilet almamıştır.',
        'Selin Tango konserine bilet almamıştır.',
        'Arda ile Cenk aynı üç konsere bilet almıştır.',
        'Klasik konserine toplam dört arkadaş bilet almıştır.',
        'Klasik ve Rock konserlerine eşit sayıda arkadaş bilet almıştır.',
      ],
      [
        hicbiri((d) => !aldi(d, 'Cenk', 'Tango')),
        hicbiri((d) => !aldi(d, 'Selin', 'Tango')),
        hicbiri((d) => ayniUc(d, 'Arda', 'Cenk')),
        hicbiri((d) => say(d, 'Klasik') === 4),
        hicbiri((d) => say(d, 'Klasik') === say(d, 'Rock')),
      ],
      5013,
    ),
  },
];
