/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 6 — kargo güzergâhı (sıra × paket sayısı).
 *
 * Aile: PAEM 9/88-90 (poliklinik) — beş öğeli bir SIRA ve her öğeye bir
 * SAYI. O üç soru öncül eksikliğinden iptal edildi (Nöroloji’yi zincire
 * bağlayan öncül yoktu, sayılar sıradan bağımsızdı). Burada iki eksik de
 * kapatılıyor:
 *   - sayılar sıraya KONUMLA bağlı ("ilk duraktaki son duraktakinden bir
 *     fazla") ve kişiye EŞİTLİKLE bağlı ("kırtasiye ile nalbur eşit"),
 *   - toplam + "sıfırlı tek durak" + 0–3 sınırı sayıların çok kümesini
 *     kendiliğinden kilitliyor: dört dolu durağa on bir paket ancak
 *     3, 3, 3, 2 olarak düşer.
 * Zincir: ilk 3 / son 2 → kırtasiye ile nalbur 3’er → son durak onlar
 * olamaz, fırın (hemen sonrası kırtasiye) ve manav (sonrası çiçekçi) da
 * olamaz → son durak çiçekçi. Açık kalan: fırın–kırtasiye bloğunun yeri ile
 * manav/nalbur sırası (altı sıralama) ve ilk durak nalbur olduğunda 0 ile
 * 3’ün fırın–manav arasında paylaşımı — 8 çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "toplam on bir paket", "yalnızca birine hiç …;
 *     diğer dördünün her birine en az bir" (sıfırlı durak TAM bir — "en çok
 *     bir" okumasında üç soru da doğrusuz kalıyordu), "bir fazladır",
 *     "birbirine eşittir"; "hemen sonra" / "daha sonra" ayrı ("daha sonra"
 *     "hemen sonra" okunsa da üç anahtar değişmiyor)
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s6
 */
import { dizilimler, her, romenSik, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const DURAK = ['Fırın', 'Kırtasiye', 'Çiçekçi', 'Manav', 'Nalbur'];
const SIRA = [1, 2, 3, 4, 5];

const METIN =
  'Bir kargo aracı, bir gün içinde fırın, kırtasiye, çiçekçi, manav ve nalburdan oluşan beş durağa uğramıştır. Araç her durağa yalnızca bir kez uğramış ve her durakta ya hiç paket bırakmamış ya da bir, iki veya üç paket bırakmıştır. Aracın güzergâhı ve bıraktığı paketlerle ilgili bilinenler şunlardır:\n' +
  '- Araç beş durakta toplam on bir paket bırakmıştır.\n' +
  '- Araç, durakların yalnızca birine hiç paket bırakmamış; diğer dördünün her birine en az bir paket bırakmıştır.\n' +
  '- Aracın ilk uğradığı durakta bıraktığı paket sayısı, son uğradığı durakta bıraktığından bir fazladır.\n' +
  '- Kırtasiyeye ve nalbura bırakılan paket sayıları birbirine eşittir.\n' +
  '- Araç kırtasiyeye, fırından hemen sonra uğramıştır.\n' +
  '- Araç çiçekçiye, manavdan daha sonra uğramıştır.';

/** i. sıradaki durağa bırakılan paket sayısı. */
const siradaki = (d: Dunya, i: number) => d[`${DURAK.find((k) => d[`${k}_sira`] === i)}_paket`] as number;
const siradakiDurak = (d: Dunya, i: number) => DURAK.find((k) => d[`${k}_sira`] === i)!;

// Metnin kurduğu uzay: beş durağın her sıralaması (5!) × her durağa 0–3 paket (4^5), sonra öncüller.
const guzergah: Dunya[] = [];
for (const sira of dizilimler(DURAK, SIRA)) {
  for (let m = 0; m < 4 ** 5; m++) {
    const d: Dunya = {};
    DURAK.forEach((k, i) => {
      d[`${k}_sira`] = sira[k];
      d[`${k}_paket`] = Math.floor(m / 4 ** i) % 4;
    });
    const paket = (k: string) => d[`${k}_paket`] as number;
    const yer = (k: string) => d[`${k}_sira`] as number;
    if (DURAK.reduce((t, k) => t + paket(k), 0) !== 11) continue;
    if (DURAK.filter((k) => paket(k) === 0).length !== 1) continue; // yalnızca biri 0, diğer dördü ≥ 1
    if (siradaki(d, 1) !== siradaki(d, 5) + 1) continue;
    if (paket('Kırtasiye') !== paket('Nalbur')) continue;
    if (yer('Kırtasiye') !== yer('Fırın') + 1) continue;
    if (!(yer('Çiçekçi') > yer('Manav'))) continue;
    guzergah.push(d);
  }
}

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-16', zorluk: 'medium', baslik: 'Kargo · son durak', ortakMetin: METIN, dunyalar: guzergah,
    kok: 'Yukarıdaki bilgilere göre, kargo aracının son uğradığı durak aşağıdakilerden hangisidir?',
    aciklama:
      'Hiç paket bırakılmayan tek durak dışındaki dört durağa toplam on bir paket bırakılmıştır. Bu dört durak birlikte en çok 12 paket alabileceğinden on bire ancak üçü 3, biri 2 paket alarak ulaşılır; paket sayıları 0, 2, 3, 3, 3’tür. İlk durak son duraktan bir fazla paket aldığına göre ilk durakta 3, son durakta 2 paket bırakılmıştır. 0 ve 2 birer durakta olduğundan, eşit sayıda paket alan kırtasiye ile nalbur 3’er paket almıştır; ikisi de son durak olamaz. Fırından hemen sonra kırtasiyeye, manavdan sonra da çiçekçiye uğranmıştır; bu yüzden fırın ve manav da son durak değildir. Geriye yalnız çiçekçi kalır.',
    ...sik(
      ['Çiçekçi', 'Nalbur', 'Kırtasiye', 'Manav', 'Fırın'],
      [
        her((d) => siradakiDurak(d, 5) === 'Çiçekçi'),
        her((d) => siradakiDurak(d, 5) === 'Nalbur'),
        her((d) => siradakiDurak(d, 5) === 'Kırtasiye'),
        her((d) => siradakiDurak(d, 5) === 'Manav'),
        her((d) => siradakiDurak(d, 5) === 'Fırın'),
      ],
      4061,
    ),
  },
  {
    id: 'aay-p4-17', zorluk: 'hard', baslik: 'Kargo · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: guzergah,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Paket bırakılan dört durak birlikte en çok 12 paket alabilir; on bir pakete ancak üçü 3, biri 2 paket alarak ulaşılır. Paket sayıları 0, 2, 3, 3, 3’tür. İlk durak son duraktan bir fazla paket almıştır ve bu farkı veren tek ikili 3 ile 2’dir, çünkü hiçbir durağa bir paket bırakılmamıştır. Bu yüzden ilk durakta kesinlikle üç paket bırakılmıştır. Öteki ifadeler yalnız bazı sıralamalarda doğrudur. Sıralama fırın, kırtasiye, manav, nalbur, çiçekçi olabilir: araç önce fırına uğramış, manava paket bırakmamış, nalbura dördüncü olarak uğramıştır. Sıralama manav, fırın, kırtasiye, nalbur, çiçekçi de olabilir: bu kez ikinci durak olan fırına paket bırakılmamıştır. Nalbur, manav, fırın, kırtasiye, çiçekçi sıralamasında manava üç paket bırakılırsa bu dört ifadenin hiçbiri tutmaz.',
    ...sik(
      [
        'Aracın ilk uğradığı durakta üç paket bırakılmıştır.',
        'Araç ilk olarak fırına uğramıştır.',
        'Manava hiç paket bırakılmamıştır.',
        'Araç nalbura dördüncü olarak uğramıştır.',
        'Aracın ikinci uğradığı durakta hiç paket bırakılmamıştır.',
      ],
      [
        her((d) => siradaki(d, 1) === 3),
        her((d) => d.Fırın_sira === 1),
        her((d) => d.Manav_paket === 0),
        her((d) => d.Nalbur_sira === 4),
        her((d) => siradaki(d, 2) === 0),
      ],
      4362,
    ),
  },
  {
    id: 'aay-p4-18', zorluk: 'hard', baslik: 'Kargo · paket sayısı kesin bilinenler', ortakMetin: METIN, dunyalar: guzergah,
    kok: 'Yukarıdaki bilgilere göre,\nI. Fırın\nII. Kırtasiye\nIII. Çiçekçi\nduraklarından hangilerine bırakılan paket sayısı kesin olarak bilinmektedir?',
    aciklama:
      'Paket bırakılan dört durağa on bir paket ancak 3, 3, 3 ve 2 olarak dağılır; sayılar 0, 2, 3, 3, 3’tür. İlk durak son duraktan bir fazla aldığı için ilk durak 3, son durak 2 paket almıştır. Kırtasiye ile nalbur eşit sayıda paket aldığından ve 0 ile 2 birer durakta kaldığından ikisi de 3 paket almıştır; kırtasiyenin sayısı kesindir (II). Son durak kırtasiye ve nalbur olamaz; fırından hemen sonra kırtasiyeye, manavdan sonra çiçekçiye uğrandığı için fırın ve manav da olamaz. Son durak çiçekçidir ve 2 paket almıştır (III). Kalan 0 ile 3 fırın ile manav arasında paylaşılır: sıralama fırın, kırtasiye, manav, nalbur, çiçekçi ise ilk durak olan fırın 3 paket alır; manav, fırın, kırtasiye, nalbur, çiçekçi ise ilk durak manavdır ve fırına hiç paket bırakılmaz. Fırının sayısı belirlenemez (I). Doğru cevap II ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [sabit((d) => d.Fırın_paket as number), sabit((d) => d.Kırtasiye_paket as number), sabit((d) => d.Çiçekçi_paket as number)],
      [[2, 3], [1], [2], [1, 2], [1, 2, 3]],
    ),
  },
];
