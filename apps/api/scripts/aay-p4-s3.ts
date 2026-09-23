/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 3 — dil okulu (kişi başı iki ders).
 *
 * Aile: PAEM 10/87-90 (tatil köyü) — her kişi n seçenekten tam k tanesini
 * seçer; sayım ve karşılaştırma öncülleri tabloyu daraltır. İskelet bilerek
 * farklı: orada üç aktivite ve "aynı iki aktivite" eşlemeleri var; burada
 * DÖRT ders var ve öncüller başka türden:
 *   - ortak dersi olmayan iki öğrenci dört dersi aralarında paylaşır
 *     (her dersi ikisinden tam biri seçer — sayımın anahtarı bu),
 *   - koşul öncülü ("İspanyolcayı seçen her öğrenci Rusçayı da seçmiştir"),
 *   - sayım ("Almancayı toplam üç öğrenci") + kesin üstünlük ("Rusça, diğer
 *     üç dersin her birinden daha çok öğrenci tarafından seçilmiştir")
 *     birlikte Rusçayı dört kişiye kilitler.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "toplam üç öğrenci", "her birinden daha çok" (eşitlik yok)
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s3
 */
import { her, romenSik, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const OGRENCI = ['Kerem', 'Leyla', 'Murat', 'Nazlı', 'Onur'];
const DERS = ['Almanca', 'İspanyolca', 'Japonca', 'Rusça'];
/** "Tam olarak iki farklı ders": dört dersten altı ikili. */
const IKILI = DERS.flatMap((a, i) => DERS.slice(i + 1).map((b) => `${a}–${b}`));

const METIN =
  'Bir dil okulunda Kerem, Leyla, Murat, Nazlı ve Onur adlı beş öğrenci, okulun açtığı Almanca, İspanyolca, Japonca ve Rusça seçmeli dersleri arasından seçim yapmıştır. Her öğrenci bu dört dersten tam olarak iki farklı ders seçmiştir. Seçimlerle ilgili bilinenler şunlardır:\n' +
  '- Kerem ile Leyla’nın seçtiği derslerden hiçbiri ortak değildir.\n' +
  '- İspanyolcayı seçen her öğrenci Rusçayı da seçmiştir.\n' +
  '- Almancayı toplam üç öğrenci seçmiştir.\n' +
  '- Rusça, diğer üç dersin her birinden daha çok öğrenci tarafından seçilmiştir.\n' +
  '- Leyla İspanyolcayı seçmemiştir.\n' +
  '- Onur Almancayı seçmiştir.';

const secti = (d: Dunya, ogr: string, ders: string) => (d[ogr] as string).split('–').includes(ders);
const say = (d: Dunya, ders: string) => OGRENCI.filter((o) => secti(d, o, ders)).length;
const ortak = (d: Dunya, a: string, b: string) => DERS.filter((x) => secti(d, a, x) && secti(d, b, x)).length;

// Metnin kurduğu uzay: her öğrenciye altı ikiliden biri (6^5), sonra öncüller.
const secim: Dunya[] = [];
for (let m = 0; m < 6 ** 5; m++) {
  const d: Dunya = Object.fromEntries(OGRENCI.map((o, i) => [o, IKILI[Math.floor(m / 6 ** i) % 6]]));
  if (ortak(d, 'Kerem', 'Leyla') !== 0) continue;
  if (!OGRENCI.every((o) => !secti(d, o, 'İspanyolca') || secti(d, o, 'Rusça'))) continue;
  if (say(d, 'Almanca') !== 3) continue;
  if (!DERS.every((x) => x === 'Rusça' || say(d, 'Rusça') > say(d, x))) continue;
  if (secti(d, 'Leyla', 'İspanyolca')) continue;
  if (!secti(d, 'Onur', 'Almanca')) continue;
  secim.push(d);
}
const secimNazliKerem = secim.filter((d) => d.Nazlı === d.Kerem);

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-07', zorluk: 'hard', baslik: 'Dil okulu · dersleri kesin bilinenler', ortakMetin: METIN, dunyalar: secim,
    kok: 'Yukarıdaki bilgilere göre,\nI. Leyla\nII. Murat\nIII. Onur\nadlı öğrencilerden hangilerinin seçtiği iki ders de kesin olarak bilinmektedir?',
    aciklama:
      'Kerem ile Leyla’nın ortak dersi yoktur ve ikisi toplam dört ders seçmiştir; bu yüzden dört dersi aralarında paylaşırlar. Leyla İspanyolcayı seçmediğine göre İspanyolca Kerem’dedir; İspanyolcayı seçen Rusçayı da seçtiği için Kerem İspanyolca–Rusça, Leyla Almanca–Japonca seçmiştir (I kesin). Almancayı üç kişi seçtiğinden Rusça dört ya da beş kişide olmalıdır. Leyla Rusçayı seçmediği için Kerem, Murat, Nazlı ve Onur’un dördü de Rusçayı seçmiştir. Onur Almancayı da seçtiğinden Almanca–Rusçadır (III kesin). Murat’ın Rusçayı seçtiği kesindir ama öbür dersi belirlenemez: Murat Almanca–Rusça iken Nazlı İspanyolca–Rusça olabilir, Murat Japonca–Rusça iken Nazlı Almanca–Rusça olabilir (II kesin değil). Yalnız I, Onur’un Rusçayı seçmek zorunda olduğunu gözden kaçırır; II’yi içeren şıklar ise Murat’ın iki dersinden yalnız birinin bilindiğini atlar. Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [sabit((d) => d.Leyla as string), sabit((d) => d.Murat as string), sabit((d) => d.Onur as string)],
      [[1, 3], [1], [3], [2, 3], [1, 2, 3]],
    ),
  },
  {
    id: 'aay-p4-08', zorluk: 'medium', baslik: 'Dil okulu · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: secim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Kerem ile Leyla’nın ortak dersi yoktur ve ikisi toplam dört ders seçmiştir; öyleyse her dersi ikisinden tam biri seçmiştir. Almancayı seçen üç kişiden biri bu ikiliden, biri de Onur’dur; geriye kalan tek Almanca kaydı Murat ile Nazlı’dan yalnızca birine aittir. Öteki şıklar için tabloyu tamamlayalım: Leyla İspanyolcayı seçmediğinden Kerem İspanyolca–Rusça, Leyla Almanca–Japoncadır. Rusça, Almancadan daha çok seçildiği ve Leyla Rusçayı seçmediği için öbür dört öğrencinin hepsi Rusçayı seçmiştir. Murat ile Nazlı’dan biri Almanca–Rusça, öbürü İspanyolca–Rusça ya da Japonca–Rusçadır. Nazlı Almanca–Rusça ise Murat Almancayı seçmemiştir; Murat İspanyolca–Rusça ise Kerem ile iki dersi de ortaktır. Nazlı Japonca–Rusça da seçebilir; o durumda İspanyolcayı yalnız Kerem seçmiş olur. Bu şıkların hiçbiri her durumda doğru değildir.',
    ...sik(
      [
        'Murat ile Nazlı’dan yalnızca biri Almancayı seçmiştir.',
        'İspanyolcayı toplam iki öğrenci seçmiştir.',
        'Nazlı Japoncayı seçmemiştir.',
        'Murat Almancayı seçmiştir.',
        'Kerem ile Murat’ın seçtiği derslerden yalnızca biri ortaktır.',
      ],
      [
        her((d) => ['Murat', 'Nazlı'].filter((o) => secti(d, o, 'Almanca')).length === 1),
        her((d) => say(d, 'İspanyolca') === 2),
        her((d) => !secti(d, 'Nazlı', 'Japonca')),
        her((d) => secti(d, 'Murat', 'Almanca')),
        her((d) => ortak(d, 'Kerem', 'Murat') === 1),
      ],
      4032,
    ),
  },
  {
    id: 'aay-p4-09', zorluk: 'hard', baslik: 'Dil okulu · Nazlı, Kerem ile aynı ise', ortakMetin: METIN, dunyalar: secimNazliKerem,
    kok: 'Yukarıdaki bilgilere göre, Nazlı, Kerem ile aynı iki dersi seçmişse aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Kerem ile Leyla dört dersi aralarında paylaşır. Leyla İspanyolcayı seçmediği için İspanyolca Kerem’dedir; İspanyolcayı seçen Rusçayı da seçtiğinden Kerem İspanyolca–Rusça, Leyla Almanca–Japoncadır. Bu durumda Nazlı da İspanyolca–Rusça seçmiştir. Almancayı üç kişi seçmiştir: Leyla, Onur ve geriye kalan tek aday olan Murat. Rusçayı Almancadan daha çok öğrenci seçtiği ve Leyla Rusçayı seçmediği için öbür dört öğrencinin hepsi Rusçayı seçmiştir. Böylece Murat ile Onur Almanca–Rusçadır ve Japoncayı yalnızca Leyla seçmiştir. İspanyolcayı yalnız Kerem ile Nazlı seçmiştir, üç kişide olamaz; Onur ile Nazlı Rusçada ortaktır; Murat ile Onur’un iki dersi de ortaktır; Kerem ile Murat’ın ise yalnız Rusça dersi ortaktır.',
    ...sik(
      [
        'Japoncayı toplam bir öğrenci seçmiştir.',
        'İspanyolcayı toplam üç öğrenci seçmiştir.',
        'Onur ile Nazlı’nın seçtiği derslerden hiçbiri ortak değildir.',
        'Murat ile Onur’un seçtiği derslerden yalnızca biri ortaktır.',
        'Kerem ile Murat aynı iki dersi seçmiştir.',
      ],
      [
        her((d) => say(d, 'Japonca') === 1),
        her((d) => say(d, 'İspanyolca') === 3),
        her((d) => ortak(d, 'Onur', 'Nazlı') === 0),
        her((d) => ortak(d, 'Murat', 'Onur') === 1),
        her((d) => d.Kerem === d.Murat),
      ],
      4033,
    ),
  },
];
