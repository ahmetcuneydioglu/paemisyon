/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 4 — spor kulübü (kişi başı bir ya da iki branş).
 *
 * Aile: PAEM 10/87-90 (tatil köyü) — kişiler üç seçenek arasından seçim
 * yapar, branş başına toplamlar tabloyu daraltır. İskelet bilerek farklı:
 * orada herkes tam İKİ aktivite seçiyordu ve "aynı iki aktivite" eşlemeleri
 * vardı; 4. partinin dil okulu senaryosu da (aay-p4-s3) kişi başı sabit iki
 * ders kullandı. Burada seçim sayısı DEĞİŞKEN (bir ya da iki) ve sayım
 * öncülleri iki katmanlı:
 *   - "tek branşlı çocuk sayısı iki branşlıların iki katı" → 4 tek, 2 çift,
 *     toplam sekiz kayıt,
 *   - yüzmeye dört kayıt + "satranç jimnastikten fazla" + Ceylin jimnastikte
 *     → jimnastiğe YALNIZ Ceylin, satranca üç çocuk.
 * Anahtar çıkarım: iki branşlı Doruk jimnastiğe giremediği için yüzme +
 * satrançtadır; Ada ile Barış birebir aynı olduğundan ikisi birlikte çift
 * olamaz (üçüncü çift branşlı çıkardı), tek branşlıdır. Açık kalan: Ceylin’in
 * ikinci branşı (yok / yüzme / satranç) ve buna bağlı dağılım — altı çözüm.
 * Tuzak: Ada altı çözümün beşinde yüzmededir, kesin değildir.
 * Ek öncüllü soruda eşlik (parite) çıkarımı: Ada–Barış ve Elif–Kuzey
 * ikilileri yüzmeye ikişer ya da hiç kayıt verir, üçüncü yüzme kaydını ancak
 * Ceylin tamamlar.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "toplam dört çocuk", "iki katıdır", "…sayısından fazladır" ("en çok" yok)
 *   - "X branşına kaydolmuştur" = X, çocuğun branşları ARASINDADIR; metin bunu açıkça yazar
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s4
 */
import { her, romenSik, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const COCUK = ['Ada', 'Barış', 'Ceylin', 'Doruk', 'Elif', 'Kuzey'];
const BRANS = ['yüzme', 'jimnastik', 'satranç'];

const METIN =
  'Bir mahalle spor kulübünde yüzme, jimnastik ve satranç olmak üzere üç branş vardır. Kulübe yalnızca Ada, Barış, Ceylin, Doruk, Elif ve Kuzey adlı altı çocuk kaydolmuştur. Her çocuk bu branşlardan ya yalnızca birine ya da yalnızca ikisine kaydolmuştur; üç branşa birden kaydolan çocuk yoktur. Bir çocuğun bir branşa kaydolduğunun söylenmesi, başka bir branşa kaydolmadığı anlamına gelmez. Kayıtlarla ilgili bilinenler şunlardır:\n' +
  '- Yalnızca bir branşa kaydolan çocuk sayısı, iki branşa kaydolan çocuk sayısının iki katıdır.\n' +
  '- Yüzme branşına toplam dört çocuk kaydolmuştur.\n' +
  '- Satranç branşına kaydolan çocuk sayısı, jimnastik branşına kaydolan çocuk sayısından fazladır.\n' +
  '- Ceylin jimnastik branşına kaydolmuştur.\n' +
  '- Doruk iki branşa kaydolmuştur.\n' +
  '- Ada ile Barış’ın kaydolduğu branşlar birebir aynıdır.';

/** Çocuğun kaydolduğu branşlar, sabit sırada ("yüzme+satranç"). */
const branslari = (d: Dunya, c: string) => BRANS.filter((b) => d[`${c}_${b}`]).join('+');

// Metnin kurduğu uzay: her çocuk için üç branşın her biri kayıtlı ya da değil (2^3)^6,
// yalnız bir ya da iki branşlı seçimler kalır; sonra öncüller.
const kulup: Dunya[] = [];
for (let m = 0; m < 8 ** 6; m++) {
  const d: Dunya = {};
  let gecersiz = false;
  COCUK.forEach((c, i) => {
    const secim = Math.floor(m / 8 ** i) % 8;
    BRANS.forEach((b, j) => (d[`${c}_${b}`] = Boolean(secim & (1 << j))));
    const n = BRANS.filter((b) => d[`${c}_${b}`]).length;
    if (n < 1 || n > 2) gecersiz = true;
    d[`${c}_sayi`] = n;
  });
  if (gecersiz) continue;
  const tek = COCUK.filter((c) => d[`${c}_sayi`] === 1).length;
  const cift = COCUK.filter((c) => d[`${c}_sayi`] === 2).length;
  const bransSay = (b: string) => COCUK.filter((c) => d[`${c}_${b}`]).length;
  if (tek !== 2 * cift) continue;
  if (bransSay('yüzme') !== 4) continue;
  if (!(bransSay('satranç') > bransSay('jimnastik'))) continue;
  if (!d.Ceylin_jimnastik) continue;
  if (d.Doruk_sayi !== 2) continue;
  if (branslari(d, 'Ada') !== branslari(d, 'Barış')) continue;
  kulup.push(d);
}
const kulupElifKuzeyAyni = kulup.filter((d) => branslari(d, 'Elif') === branslari(d, 'Kuzey'));
const ortakVar = (d: Dunya, a: string, b: string) => BRANS.some((x) => d[`${a}_${x}`] && d[`${b}_${x}`]);

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-10', zorluk: 'hard', baslik: 'Spor kulübü · branşları kesin bilinenler', ortakMetin: METIN, dunyalar: kulup,
    kok: 'Yukarıdaki bilgilere göre,\nI. Ada\nII. Ceylin\nIII. Doruk\nadlı çocuklardan hangilerinin kaydolduğu branşların tamamı kesin olarak bilinmektedir?',
    aciklama:
      'Yalnızca bir branşa kaydolanlar iki branşa kaydolanların iki katı olduğundan dört çocuk bir, iki çocuk iki branşa kaydolmuştur; toplam kayıt sekizdir. Yüzme dört kayıt aldığına göre jimnastik ile satranç dört kaydı paylaşır. Satranç daha fazla kayıt aldığından jimnastikte en fazla bir çocuk olabilir; o çocuk da Ceylin’dir. Jimnastik başka kimseye açık olmadığı için iki branşa kaydolan Doruk yüzme ile satranca kaydolmuştur (III bilinir). Ceylin jimnastiğin yanında hiçbir branş almamış da olabilir, yüzmeyi ya da satrancı eklemiş de olabilir (II bilinmez). Ada ile Barış birlikte iki branşlı olsaydı Doruk’la birlikte üç çocuk iki branşa kaydolmuş olurdu; bu yüzden ikisi de tek branşlıdır. Bu branş çoğu durumda yüzmedir, ancak Ceylin yüzme ile jimnastiğe, Elif ile Kuzey yüzmeye kaydolduğunda Ada ile Barış satrançtadır (I bilinmez). Doğru cevap Yalnız III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [sabit((d) => branslari(d, 'Ada')), sabit((d) => branslari(d, 'Ceylin')), sabit((d) => branslari(d, 'Doruk'))],
      [[3], [1], [2], [1, 3], [2, 3]],
    ),
  },
  {
    id: 'aay-p5-11', zorluk: 'medium', baslik: 'Spor kulübü · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: kulup,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Altı çocuktan yalnızca bir branşa kaydolanların sayısı iki branşa kaydolanların iki katı olduğuna göre dört çocuk bir, iki çocuk iki branşa kaydolmuştur. Doruk iki branşa kaydolan bu iki çocuktan biridir. Ada ile Barış’ın branşları birebir aynı olduğundan ikisi ya birlikte iki branşlı ya da birlikte tek branşlıdır; birlikte iki branşlı olsalar Doruk’la beraber üç çocuk iki branşa kaydolmuş olurdu. Öyleyse Barış yalnızca bir branşa kaydolmuştur. Öteki şıklar yalnızca bazı durumlarda doğrudur: ikinci iki branşlı çocuk Ceylin, Elif ya da Kuzey olabilir; Kuzey yalnızca yüzmeye kaydolmuş olabilir; Elif yalnızca yüzmeye, Kuzey yalnızca satranca kaydolduğunda ikisinin ortak branşı kalmaz.',
    ...sik(
      [
        'Barış yalnızca bir branşa kaydolmuştur.',
        'Elif yalnızca bir branşa kaydolmuştur.',
        'Kuzey satranç branşına kaydolmuştur.',
        'Elif ile Kuzey’in kaydolduğu branşlardan en az biri ortaktır.',
        'Kuzey iki branşa kaydolmuştur.',
      ],
      [
        her((d) => d.Barış_sayi === 1),
        her((d) => d.Elif_sayi === 1),
        her((d) => d.Kuzey_satranç === true),
        her((d) => ortakVar(d, 'Elif', 'Kuzey')),
        her((d) => d.Kuzey_sayi === 2),
      ],
      5142,
    ),
  },
  {
    id: 'aay-p5-12', zorluk: 'hard', baslik: 'Spor kulübü · Elif ile Kuzey aynı branşlarda ise', ortakMetin: METIN, dunyalar: kulupElifKuzeyAyni,
    kok: 'Yukarıdaki bilgilere göre, Elif ile Kuzey’in kaydolduğu branşlar birebir aynıysa aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Toplam sekiz kayıt vardır; yüzme dört kayıt aldığından jimnastik ile satranç dört kaydı paylaşır ve satranç daha fazla olduğundan jimnastikte yalnızca Ceylin bulunur. İki branşlı Doruk bu yüzden yüzme ile satranca kaydolmuştur. Elif ile Kuzey de, Ada ile Barış da birlikte iki branşlı olamaz, çünkü iki branşlı çocuk sayısı üçe çıkardı; dolayısıyla bu dört çocuk tek branşlıdır. Yüzmedeki dört kaydın biri Doruk’undur; kalan üç kayıt Ada–Barış ikilisi, Elif–Kuzey ikilisi ve Ceylin arasında paylaşılır. Her ikili yüzmeye ya iki kayıt verir ya hiç vermez; üçe ulaşmak için Ceylin yüzmeye kaydolmuş olmalıdır. Ceylin böylece yüzme ile jimnastiğe kaydolmuştur, satranca kaydolamaz. Kuzey tek branşlı olduğundan iki branşa kaydolmuş olamaz. İkililerden biri yüzmeyi, öbürü satrancı alır; Elif ile Kuzey’in hangisini aldığı belirlenemez.',
    ...sik(
      [
        'Ceylin yüzme branşına kaydolmuştur.',
        'Ceylin satranç branşına kaydolmuştur.',
        'Elif satranç branşına kaydolmuştur.',
        'Kuzey yüzme branşına kaydolmuştur.',
        'Kuzey iki branşa kaydolmuştur.',
      ],
      [
        her((d) => d.Ceylin_yüzme === true),
        her((d) => d.Ceylin_satranç === true),
        her((d) => d.Elif_satranç === true),
        her((d) => d.Kuzey_yüzme === true),
        her((d) => d.Kuzey_sayi === 2),
      ],
      5043,
    ),
  },
];
