/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 4 — yayınevi çevirileri (dil × tür).
 *
 * Aile: PAEM 10/81-83 (lunapark) — her kişinin İKİ niteliği var (çeviri dili
 * ve eser türü) ve bir SAYIM öncülü tabloyu daraltıyor. İskelet bilerek
 * farklı: iki nitelik de ÜÇ değerli, sayım öncülü iki niteliğin KESİŞİMİ
 * üzerine ("Fransızcadan öykü çeviren iki çevirmen") ve dil kontenjanıyla
 * birleşince Fransızca ikilisinin ikisini birden öyküye bağlıyor. Açık kalan
 * iki nokta var: dillerin üç olası dağılımı (Sarp’ın dili tek başına seçer)
 * ile Deniz–Gökçe arasındaki roman/deneme ayrımı — 3 × 2 = 6 çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "ikişer çevirmen", "üçü öykü, ikisi roman, biri deneme"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s4
 */
import { bazi, hicbiri, romenSik, sik, yeterli, type Bulmaca, type Dunya } from './aay-cozucu';

const KISI = ['Deniz', 'Gökçe', 'Irmak', 'Kutay', 'Özge', 'Sarp'];
const DIL = ['İngilizce', 'Fransızca', 'Almanca'];
const TUR = ['roman', 'öykü', 'deneme'];

const METIN =
  'Bir yayınevi, İngilizce, Fransızca ve Almanca olmak üzere üç dilden altı eser çevirtmiştir. Eserleri Deniz, Gökçe, Irmak, Kutay, Özge ve Sarp adlı altı çevirmen çevirmiş; her çevirmen bu dillerin yalnızca birinden, yalnızca bir eser çevirmiştir. Her eser roman, öykü ve deneme türlerinden yalnızca birine aittir. Çevirilerle ilgili bilinenler şunlardır:\n' +
  '- Üç dilin her birinden ikişer çevirmen çeviri yapmıştır.\n' +
  '- Çevrilen eserlerin üçü öykü, ikisi roman, biri denemedir.\n' +
  '- Fransızcadan öykü çeviren iki çevirmen vardır.\n' +
  '- Deniz ile Gökçe aynı dilden çeviri yapmış, ancak farklı türde eserler çevirmiştir.\n' +
  '- Kutay ile Sarp farklı dillerden çeviri yapmış, ancak aynı türde eserler çevirmiştir.\n' +
  '- Kutay Almancadan, Irmak ise Fransızcadan çeviri yapmamıştır.';

// Metnin kurduğu uzay: her çevirmene bir dil ve bir tür (3^6 × 3^6), sonra öncüller.
const ceviri: Dunya[] = [];
for (let m = 0; m < 3 ** 6; m++) {
  for (let t = 0; t < 3 ** 6; t++) {
    const d: Dunya = {};
    KISI.forEach((k, i) => {
      d[`${k}_dil`] = DIL[Math.floor(m / 3 ** i) % 3];
      d[`${k}_tur`] = TUR[Math.floor(t / 3 ** i) % 3];
    });
    const say = (f: (k: string) => boolean) => KISI.filter(f).length;
    if (DIL.some((l) => say((k) => d[`${k}_dil`] === l) !== 2)) continue;
    const turSay = (tr: string) => say((k) => d[`${k}_tur`] === tr);
    if (turSay('öykü') !== 3 || turSay('roman') !== 2 || turSay('deneme') !== 1) continue;
    if (say((k) => d[`${k}_dil`] === 'Fransızca' && d[`${k}_tur`] === 'öykü') !== 2) continue;
    if (d.Deniz_dil !== d.Gökçe_dil || d.Deniz_tur === d.Gökçe_tur) continue;
    if (d.Kutay_dil === d.Sarp_dil || d.Kutay_tur !== d.Sarp_tur) continue;
    if (d.Kutay_dil === 'Almanca' || d.Irmak_dil === 'Fransızca') continue;
    ceviri.push(d);
  }
}

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-10', zorluk: 'hard', baslik: 'Çeviri · roman çevirmiş olabilecekler', ortakMetin: METIN, dunyalar: ceviri,
    kok: 'Yukarıdaki bilgilere göre,\nI. Gökçe\nII. Irmak\nIII. Kutay\nadlı çevirmenlerden hangileri roman çevirmiş olabilir?',
    aciklama:
      'Fransızcadan çeviri yapan iki çevirmen vardır ve ikisi de öykü çevirmiştir. Deniz ile Gökçe farklı türde eser çevirdiği için bu ikili olamaz; Irmak da Fransızcadan çeviri yapmamıştır. Kutay ile Sarp farklı dillerden çeviri yaptığı için ikisi birlikte Fransızcada bulunamaz. Bu yüzden Fransızca ikilisi Özge ile Kutay ya da Özge ile Sarp’tır. İki durumda da Kutay ile Sarp’tan biri öykü çevirmiştir; aynı türde eser çevirdikleri için öteki de öyküdür, yani Kutay roman çevirmiş olamaz (III). Üç öykü Özge, Kutay ve Sarp’a ait olduğundan Deniz, Gökçe ve Irmak iki roman ile bir denemeyi paylaşır. Deniz ile Gökçe’den biri roman, öteki denemedir; Gökçe roman çevirmiş olabilir (I). Geriye kalan Irmak ise kesinlikle roman çevirmiştir (II); kesin olan bir durum “olabilir” sorusunun cevabına da girer. Doğru cevap I ve II’dir.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Gökçe_tur === 'roman'), bazi((d) => d.Irmak_tur === 'roman'), bazi((d) => d.Kutay_tur === 'roman')],
      [[1, 2], [1], [2], [3], [1, 2, 3]],
    ),
  },
  {
    id: 'aay-p4-11', zorluk: 'medium', baslik: 'Çeviri · aynı dilden çeviri yapmış olamayacak ikili', ortakMetin: METIN, dunyalar: ceviri,
    kok: 'Yukarıdaki bilgilere göre, aşağıdaki çevirmen ikililerinden hangisi aynı dilden çeviri yapmış olamaz?',
    aciklama:
      'Fransızcadan çeviri yapan iki çevirmenin ikisi de öykü çevirmiştir. Deniz ile Gökçe farklı türde eser çevirdiği için, Kutay ile Sarp da farklı dillerden çeviri yaptığı için Fransızca ikilisi olamaz; Irmak ise Fransızcadan çeviri yapmamıştır. Bu durumda Özge kesinlikle Fransızcadan çeviri yapmıştır ve Irmak’la aynı dilde bulunamaz. Öteki ikililerin her biri gerçekleşebilir: Özge’nin yanında Sarp varsa Almancadan çeviri yapmayan Kutay İngilizcede Irmak’la buluşur. Özge’nin yanında Kutay varsa Sarp ile Irmak aynı dilde, İngilizcede ya da Almancada çeviri yapar. Deniz ile Gökçe her durumda kalan dili doldurur. Doğru cevap Özge ile Irmak’tır.',
    ...sik(
      ['Özge ile Irmak', 'Özge ile Sarp', 'Kutay ile Irmak', 'Sarp ile Irmak', 'Özge ile Kutay'],
      [
        hicbiri((d) => d.Özge_dil === d.Irmak_dil),
        hicbiri((d) => d.Özge_dil === d.Sarp_dil),
        hicbiri((d) => d.Kutay_dil === d.Irmak_dil),
        hicbiri((d) => d.Sarp_dil === d.Irmak_dil),
        hicbiri((d) => d.Özge_dil === d.Kutay_dil),
      ],
      4042,
    ),
  },
  {
    id: 'aay-p4-12', zorluk: 'hard', baslik: 'Çeviri · tam belirlemek için yeterli bilgi', ortakMetin: METIN, dunyalar: ceviri,
    kok: 'Tüm çevirmenlerin çeviri yaptığı dilin ve çevirdiği eserin türünün tam olarak belirlenebilmesi için aşağıdakilerden hangisinin bilinmesi yeterlidir?',
    aciklama:
      'Kesin olanlar şunlardır: Özge Fransızcadan öykü, Kutay ile Sarp öykü, Irmak roman çevirmiştir; Deniz ile Gökçe’den biri roman, öteki denemedir. Dillerde üç durum vardır: Sarp Fransızcadaysa Kutay ile Irmak İngilizcede, Deniz ile Gökçe Almancadadır. Sarp İngilizcedeyse Irmak da İngilizcede, Kutay Fransızcada, Deniz ile Gökçe Almancadadır. Sarp Almancadaysa Irmak da Almancada, Kutay Fransızcada, Deniz ile Gökçe İngilizcededir. Sarp’ın dili bu üç durumu tek başına ayırır; Deniz’in türü de roman–deneme ayrımını kapatır. Özge’nin dili ve Kutay’ın türü zaten bilinmektedir. Kutay’ın dili son iki durumu, Irmak’ın dili ise ilk iki durumu birbirinden ayıramaz.',
    ...sik(
      [
        'Sarp’ın çeviri yaptığı dil ile Deniz’in çevirdiği eserin türü',
        'Özge’nin çeviri yaptığı dil ile Gökçe’nin çevirdiği eserin türü',
        'Kutay’ın çeviri yaptığı dil ile Deniz’in çevirdiği eserin türü',
        'Irmak’ın çeviri yaptığı dil ile Gökçe’nin çevirdiği eserin türü',
        'Sarp’ın çeviri yaptığı dil ile Kutay’ın çevirdiği eserin türü',
      ],
      [
        yeterli((d) => `${d.Sarp_dil}|${d.Deniz_tur}`),
        yeterli((d) => `${d.Özge_dil}|${d.Gökçe_tur}`),
        yeterli((d) => `${d.Kutay_dil}|${d.Deniz_tur}`),
        yeterli((d) => `${d.Irmak_dil}|${d.Gökçe_tur}`),
        yeterli((d) => `${d.Sarp_dil}|${d.Kutay_tur}`),
      ],
      4043,
    ),
  },
];
