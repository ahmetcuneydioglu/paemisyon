/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 5 — bisiklet turu (kask rengi × bisiklet türü).
 *
 * Aile: PAEM 10/81-83 (lunapark) — her kişinin İKİ niteliği var (kask rengi
 * ve bisiklet türü), iki nitelikte de sayım öncülü tabloyu daraltıyor.
 * İskelet bilerek farklı: nitelikleri birbirine bağlayan bir KOŞUL var
 * ("dağ bisikleti kullananların hiçbiri sarı kask takmamıştır"). Sarı
 * kasklılar bu yüzden şehir bisikletine iner; şehir bisikletinde üç yer
 * olduğu için koşul sayım kaldıracına dönüşür. Aras ile Belgin’in sarı olduğu
 * durum, Ferit’i de şehir bisikletine çekip Cihan ile Dora’yı dağ bisikletinde
 * buluşturduğu için düşer; ikisi kırmızıdır. Ekin sarı olamaz, Cihan ile Dora
 * birlikte sarı olamaz, dolayısıyla Ferit sarıdır. Açık kalan iki nokta:
 * Cihan ile Dora’dan hangisinin sarı olduğu ve kalan kırmızı ile mavi kaskın
 * kime düştüğü — dört çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "kırmızı kask takan üç, mavi … bir, sarı … iki",
 *     "üçü dağ bisikleti, üçü şehir bisikleti"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s5
 */
import { bazi, hicbiri, romenSik, sik, yeterli, type Bulmaca, type Dunya } from './aay-cozucu';

const KISI = ['Aras', 'Belgin', 'Cihan', 'Dora', 'Ekin', 'Ferit'];
const RENK = ['kırmızı', 'mavi', 'sarı'];
const TUR = ['şehir', 'dağ'];

const METIN =
  'Bir bisiklet kulübünün düzenlediği hafta sonu turuna Aras, Belgin, Cihan, Dora, Ekin ve Ferit adlı altı kişi katılmıştır. Her katılımcının taktığı kask kırmızı, mavi ve sarı renklerinden yalnızca birindedir; ayrıca her katılımcı şehir bisikleti ve dağ bisikleti türlerinden yalnızca birini kullanmıştır. Tura ilişkin bilinenler şunlardır:\n' +
  '- Kırmızı kask takan üç, mavi kask takan bir, sarı kask takan iki katılımcı vardır.\n' +
  '- Katılımcılardan üçü dağ bisikleti, üçü şehir bisikleti kullanmıştır.\n' +
  '- Dağ bisikleti kullananların hiçbiri sarı kask takmamıştır.\n' +
  '- Aras ile Belgin aynı renk kask takmıştır.\n' +
  '- Cihan ile Dora farklı türde bisiklet kullanmıştır.\n' +
  '- Ekin dağ bisikleti kullanmıştır.\n' +
  '- Ferit ile Aras aynı türde bisiklet kullanmıştır.';

// Metnin kurduğu uzay: her kişiye bir kask rengi ve bir bisiklet türü (3^6 × 2^6), sonra öncüller.
const tur: Dunya[] = [];
for (let m = 0; m < 3 ** 6; m++) {
  for (let g = 0; g < 2 ** 6; g++) {
    const d: Dunya = {};
    KISI.forEach((k, i) => {
      d[`${k}_kask`] = RENK[Math.floor(m / 3 ** i) % 3];
      d[`${k}_bisiklet`] = TUR[(g >> i) & 1];
    });
    const renkSay = (r: string) => KISI.filter((k) => d[`${k}_kask`] === r).length;
    if (renkSay('kırmızı') !== 3 || renkSay('mavi') !== 1 || renkSay('sarı') !== 2) continue;
    if (KISI.filter((k) => d[`${k}_bisiklet`] === 'dağ').length !== 3) continue;
    if (KISI.some((k) => d[`${k}_bisiklet`] === 'dağ' && d[`${k}_kask`] === 'sarı')) continue;
    if (d.Aras_kask !== d.Belgin_kask) continue;
    if (d.Cihan_bisiklet === d.Dora_bisiklet) continue;
    if (d.Ekin_bisiklet !== 'dağ') continue;
    if (d.Ferit_bisiklet !== d.Aras_bisiklet) continue;
    tur.push(d);
  }
}
const maviKaskli = (d: Dunya) => KISI.find((k) => d[`${k}_kask`] === 'mavi')!;

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-13', zorluk: 'hard', baslik: 'Bisiklet turu · tam belirlemek için yeterli bilgi', ortakMetin: METIN, dunyalar: tur,
    kok: 'Tüm katılımcıların taktığı kaskın rengi ile kullandığı bisikletin türünün tam olarak belirlenebilmesi için aşağıdakilerden hangisinin bilinmesi yeterlidir?',
    aciklama:
      'Sarı kasklılar dağ bisikleti kullanmaz. Mavi kask tek olduğundan Aras ile Belgin kırmızı ya da sarıdır; sarı olsalardı ikisi ve Aras’la aynı türü kullanan Ferit şehir bisikletindeki üç yeri doldurur, Cihan ile Dora dağ bisikletinde buluşurdu. İkisi kırmızıdır. Dağ bisikletindeki Ekin sarı olamaz; Cihan ile Dora farklı türde bisiklet kullandığından ikisi birden sarı olamaz. Böylece Ferit ile Cihan ve Dora’dan biri sarıdır; şehir bisikletliler Aras, Ferit ve o kişidir. Açık kalan, Cihan ile Dora’dan hangisinin sarı, kimin mavi olduğudur. Cihan kırmızı ya da maviyse Dora sarıdır, Ekin öbür rengi alır; Cihan sarıysa Ekin’in rengi Dora’nınkini belirler. Ekin’in bisikleti zaten verilmiştir; Cihan’ın ya da Dora’nın rengi sarı çıkarsa öbür iki renk açık kalır. Aras’ın rengi, Belgin’in ve Ferit’in bisikleti bellidir; Dora’nın bisikleti yalnız sarıyı, Ekin’in rengi yalnız maviyi belirler.',
    // Doğru şık İLK verilir; sik() tohumla karıştırır.
    ...sik(
      [
        'Cihan’ın taktığı kaskın rengi ile Ekin’in taktığı kaskın rengi',
        'Ekin’in kullandığı bisikletin türü ile Cihan’ın taktığı kaskın rengi',
        'Dora’nın kullandığı bisikletin türü ile Aras’ın taktığı kaskın rengi',
        'Ekin’in taktığı kaskın rengi ile Ferit’in kullandığı bisikletin türü',
        'Dora’nın taktığı kaskın rengi ile Belgin’in kullandığı bisikletin türü',
      ],
      [
        yeterli((d) => `${d.Cihan_kask}|${d.Ekin_kask}`),
        yeterli((d) => `${d.Ekin_bisiklet}|${d.Cihan_kask}`),
        yeterli((d) => `${d.Dora_bisiklet}|${d.Aras_kask}`),
        yeterli((d) => `${d.Ekin_kask}|${d.Ferit_bisiklet}`),
        yeterli((d) => `${d.Dora_kask}|${d.Belgin_bisiklet}`),
      ],
      5051,
    ),
  },
  {
    id: 'aay-p5-14', zorluk: 'medium', baslik: 'Bisiklet turu · kesinlikle yanlış olan', ortakMetin: METIN, dunyalar: tur,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    aciklama:
      'Aras ile Belgin aynı renktedir ve mavi kask tek kişide olduğundan ikisi mavi olamaz. Sarı olsalardı, sarı kasklılar dağ bisikleti kullanmadığı için ikisi de şehir bisikletinde olur, Ferit de Aras’la aynı türü kullandığından onlara katılır, Cihan ile Dora dağ bisikletinde buluşurdu; bu olanaksızdır. Ekin dağ bisikletinde olduğu için sarı değildir; Cihan ile Dora da farklı türde bisiklet kullandıkları için birlikte sarı olamaz. Böylece sarı kasklar Ferit’te ve Cihan ile Dora’dan birindedir, şehir bisikletinde de Aras, Ferit ve bu kişi vardır. Mavi kask ise Ekin’de ya da Cihan ile Dora’dan sarı olmayandadır; ikisi de dağ bisikletindedir, yani mavi kasklının şehir bisikleti kullanması olanaksızdır. Ötekiler olabilir: Dora sarıysa Cihan da Ekin gibi dağ bisikletindedir; Cihan mavi, Ekin kırmızı olabilir; Dora ile Ekin ise her durumda farklı renktedir.',
    ...sik(
      [
        'Mavi kask takan katılımcı şehir bisikleti kullanmıştır.',
        'Cihan ile Ekin aynı türde bisiklet kullanmıştır.',
        'Ekin kırmızı kask takmıştır.',
        'Dora ile Ekin farklı renk kask takmıştır.',
        'Cihan mavi kask takmıştır.',
      ],
      [
        hicbiri((d) => d[`${maviKaskli(d)}_bisiklet`] === 'şehir'),
        hicbiri((d) => d.Cihan_bisiklet === d.Ekin_bisiklet),
        hicbiri((d) => d.Ekin_kask === 'kırmızı'),
        hicbiri((d) => d.Dora_kask !== d.Ekin_kask),
        hicbiri((d) => d.Cihan_kask === 'mavi'),
      ],
      5052,
    ),
  },
  {
    id: 'aay-p5-15', zorluk: 'hard', baslik: 'Bisiklet turu · kırmızı kask takmış olabilecekler', ortakMetin: METIN, dunyalar: tur,
    kok: 'Yukarıdaki bilgilere göre,\nI. Belgin\nII. Dora\nIII. Ferit\nadlı katılımcılardan hangileri kırmızı kask takmış olabilir?',
    aciklama:
      'Mavi kask tek kişide olduğundan Aras ile Belgin’in ortak rengi kırmızı ya da sarıdır. Sarı olsalardı, sarı kasklılar dağ bisikleti kullanmadığı için ikisi de şehir bisikletinde olur, Aras’la aynı türü kullanan Ferit de onlara katılırdı; Cihan ile Dora dağ bisikletinde buluşur ve farklı tür kullanmaları bozulurdu. Bu yüzden Belgin kesin olarak kırmızıdır; her durumda doğru olan, “olabilir” sorusunda da sayılır (I). Dağ bisikletindeki Ekin de sarı olamaz; öyleyse iki sarı kask Cihan, Dora ve Ferit arasındadır. Cihan ile Dora farklı türde bisiklet kullandığından ikisi birden sarı olamaz; Ferit sarıdır ve kırmızı olamaz (III). Cihan sarı, Ekin mavi olduğunda üçüncü kırmızı kask Dora’ya kalır (II). Doğru cevap I ve II’dir.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Belgin_kask === 'kırmızı'), bazi((d) => d.Dora_kask === 'kırmızı'), bazi((d) => d.Ferit_kask === 'kırmızı')],
      [[1, 2], [1], [2], [2, 3], [1, 2, 3]],
    ),
  },
];
