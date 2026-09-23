/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 2 — restoran (ana yemek × içecek).
 *
 * Aile: PAEM 10/81-83 (lunapark) — her kişinin İKİ niteliği var (üç değerli
 * ana yemek, iki değerli içecek) ve bir sayım öncülü tabloyu daraltıyor.
 * İskelet bilerek farklı: yemeklerin kontenjanı HİÇ verilmiyor. Tabloyu üç
 * KESİŞİM öncülü kuruyor — ayranı dört kişi içmiş, bunların tam ikisi balık
 * seçmiş, köfte seçen hiç kimse ayran içmemiş. Aritmetik ayranlı kalan iki
 * kişiyi mantıya iter; balık da mantı da en az ikişer kişilik olunca "yemeğini
 * başka kimsenin seçmediği" Arda ancak köfte seçmiş olabilir, köfte de onu
 * limonataya bağlar. Limonatanın ikinci kişisi Buse ile Ozan’dan biri olunca
 * geri kalan herkes ayranlıdır; Serkan ile Tuba ikisi birden balık olamayacağı
 * için mantıya iner. Açık kalan iki nokta: limonatayı Buse mi Ozan mı içti ve
 * o kişi balık mı mantı mı seçti — 2 × 2 = 4 çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "toplam dört kişi", "tam olarak ikisi"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s2
 */
import { her, romenSik, sabit, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const KISI = ['Arda', 'Buse', 'Ozan', 'Pelin', 'Serkan', 'Tuba'];
const YEMEK = ['balık', 'köfte', 'mantı'];
const ICECEK = ['ayran', 'limonata'];

const METIN =
  'Bir restoranda akşam yemeği yiyen Arda, Buse, Ozan, Pelin, Serkan ve Tuba adlı altı kişilik bir arkadaş grubunun her üyesi, menüdeki balık, köfte ve mantı olmak üzere üç ana yemekten yalnızca birini, ayran ve limonata olmak üzere iki içecekten de yalnızca birini seçmiştir. Seçimlerle ilgili bilinenler şunlardır:\n' +
  '- Ayranı toplam dört kişi seçmiştir.\n' +
  '- Balık seçenlerden tam olarak ikisi ayran seçmiştir.\n' +
  '- Köfte seçenlerin hiçbiri ayran seçmemiştir.\n' +
  '- Arda’nın seçtiği ana yemeği Arda’dan başka hiç kimse seçmemiştir.\n' +
  '- Buse ile Ozan’dan yalnızca biri ayran seçmiştir.\n' +
  '- Serkan ile Tuba aynı ana yemeği seçmiştir.\n' +
  '- Pelin balık seçmiştir.';

// Metnin kurduğu uzay: her kişiye bir ana yemek ve bir içecek (3^6 × 2^6), sonra öncüller.
const masa: Dunya[] = [];
for (let m = 0; m < 3 ** 6; m++) {
  for (let g = 0; g < 2 ** 6; g++) {
    const d: Dunya = {};
    KISI.forEach((k, i) => {
      d[`${k}_yemek`] = YEMEK[Math.floor(m / 3 ** i) % 3];
      d[`${k}_icecek`] = ICECEK[(g >> i) & 1];
    });
    const say = (f: (k: string) => boolean) => KISI.filter(f).length;
    if (say((k) => d[`${k}_icecek`] === 'ayran') !== 4) continue;
    if (say((k) => d[`${k}_yemek`] === 'balık' && d[`${k}_icecek`] === 'ayran') !== 2) continue;
    if (say((k) => d[`${k}_yemek`] === 'köfte' && d[`${k}_icecek`] === 'ayran') !== 0) continue;
    if (say((k) => d[`${k}_yemek`] === d.Arda_yemek) !== 1) continue;
    if ((d.Buse_icecek === 'ayran') === (d.Ozan_icecek === 'ayran')) continue;
    if (d.Serkan_yemek !== d.Tuba_yemek) continue;
    if (d.Pelin_yemek !== 'balık') continue;
    masa.push(d);
  }
}
const yemekSay = (d: Dunya, y: string) => KISI.filter((k) => d[`${k}_yemek`] === y).length;
const masaBuseOzanFarkli = masa.filter((d) => d.Buse_yemek !== d.Ozan_yemek);

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-04', zorluk: 'hard', baslik: 'Restoran · içeceği kesin bilinenler', ortakMetin: METIN, dunyalar: masa,
    kok: 'Yukarıdaki bilgilere göre,\nI. Arda\nII. Ozan\nIII. Tuba\nadlı kişilerden hangilerinin seçtiği içecek kesin olarak bilinmektedir?',
    aciklama:
      'Ayranı dört kişi seçtiğine göre limonatayı iki kişi seçmiştir. Ayran seçen dört kişinin tam olarak ikisi balık seçmiştir; köfte seçen hiç kimse ayran seçmediği için ayran seçen öteki iki kişi mantı seçmiştir. Demek ki balığı da mantıyı da en az ikişer kişi seçmiştir. Arda’nın yemeğini ondan başka kimse seçmediğine göre Arda köfte seçmiştir; köfte seçen ayran seçmediği için Arda’nın içeceği limonatadır (I kesin). Limonata seçen ikinci kişi Buse ile Ozan’dan biridir; bu yüzden Pelin, Serkan ve Tuba ayran seçmiştir (III kesin). Limonatayı Buse ile Ozan’dan hangisinin seçtiği belirlenemediği için Ozan’ın içeceği bilinemez (II). Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [sabit((d) => d.Arda_icecek as string), sabit((d) => d.Ozan_icecek as string), sabit((d) => d.Tuba_icecek as string)],
      [[1, 3], [1], [3], [2, 3], [1, 2, 3]],
    ),
  },
  {
    id: 'aay-p5-05', zorluk: 'medium', baslik: 'Restoran · Buse ile Ozan farklı yemek seçtiyse', ortakMetin: METIN, dunyalar: masaBuseOzanFarkli,
    kok: 'Yukarıdaki bilgilere göre, Buse ile Ozan farklı ana yemekleri seçmişse aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Ayran seçen dört kişinin ikisi balık, öteki ikisi mantı seçmiştir, çünkü köfte seçen ayran seçmemiştir. Balığı ve mantıyı en az ikişer kişi seçtiğine göre yemeğini yalnız kendisi seçen Arda köfte, dolayısıyla limonata seçmiştir. Limonata seçen ikinci kişi Buse ile Ozan’dan biridir; öteki dört kişi ayran seçmiştir. Serkan ile Tuba köfte seçemez; balık seçselerdi Pelin’le birlikte ayran seçip balık seçen üç kişi olurdu. İkisi de mantı, Buse ile Ozan’dan ayran seçen kişi ise balık seçmiştir. Buse ile Ozan farklı yemek seçtiyse limonata seçen kişi mantı seçmiştir; mantıyı Serkan ve Tuba ile birlikte üç kişi seçmiştir. Mantı seçenlerden biri limonata seçtiği için “hepsi ayran”, limonata seçenlerden biri Arda olduğu için “ikisi de mantı” ifadesi yanlıştır. Limonatayı kimin seçtiği bilinmediği için ne Ozan’ın balık seçtiği ne de Buse’nin Pelin’le aynı yemeği seçtiği kesindir.',
    ...sik(
      [
        'Mantıyı toplam üç kişi seçmiştir.',
        'Ozan balık seçmiştir.',
        'Mantı seçenlerin hepsi ayran seçmiştir.',
        'Buse ile Pelin aynı ana yemeği seçmiştir.',
        'Limonata seçen iki kişinin ikisi de mantı seçmiştir.',
      ],
      [
        her((d) => yemekSay(d, 'mantı') === 3),
        her((d) => d.Ozan_yemek === 'balık'),
        her((d) => KISI.every((k) => d[`${k}_yemek`] !== 'mantı' || d[`${k}_icecek`] === 'ayran')),
        her((d) => d.Buse_yemek === d.Pelin_yemek),
        her((d) => KISI.every((k) => d[`${k}_icecek`] !== 'limonata' || d[`${k}_yemek`] === 'mantı')),
      ],
      5022,
    ),
  },
  {
    id: 'aay-p5-06', zorluk: 'hard', baslik: 'Restoran · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: masa,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Limonatayı iki kişi seçmiştir. Ayran seçen dört kişinin ikisi balık seçmiş, köfte seçen ayran seçmediği için öteki ikisi mantı seçmiştir. Balık ve mantı en az ikişer kişi tarafından seçildiğinden, yemeğini yalnız kendisi seçen Arda köfte ve dolayısıyla limonata seçmiştir. Limonata seçen ikinci kişi Buse ile Ozan’dan biri olduğu için Pelin, Serkan ve Tuba ayran seçmiştir. Serkan ile Tuba aynı yemeği seçmiştir: ikisi de balık olsaydı Pelin ile birlikte ayran seçip balık seçen üç kişi olurdu, köfte seçen ise ayran seçmez. Bu yüzden Serkan mantı seçmiştir. Buse ile Ozan’dan limonata seçenin kim olduğu ve balık mı mantı mı seçtiği belirlenemez; Buse’nin balık seçmesi, limonata seçenlerden birinin balık seçmesi ve Pelin ile Buse’nin aynı içeceği seçmesi olası ama kesin değildir. Köfteyi yalnız Arda seçmiştir.',
    ...sik(
      [
        'Serkan mantı seçmiştir.',
        'Buse balık seçmiştir.',
        'Limonata seçenlerden biri balık seçmiştir.',
        'Pelin ile Buse aynı içeceği seçmiştir.',
        'Köfteyi toplam iki kişi seçmiştir.',
      ],
      [
        her((d) => d.Serkan_yemek === 'mantı'),
        her((d) => d.Buse_yemek === 'balık'),
        her((d) => KISI.some((k) => d[`${k}_icecek`] === 'limonata' && d[`${k}_yemek`] === 'balık')),
        her((d) => d.Pelin_icecek === d.Buse_icecek),
        her((d) => yemekSay(d, 'köfte') === 2),
      ],
      5023,
    ),
  },
];

