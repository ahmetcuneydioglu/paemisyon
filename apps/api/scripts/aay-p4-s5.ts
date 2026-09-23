/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 5 — taşınma (eşya → araç).
 *
 * Aile: PAEM 10/84-86 (ofis alışverişi) — her nesne üç birimden yalnızca
 * birine gider ve birim başına sabit kontenjan YOKTUR. İskelet bilerek farklı:
 * orada üç ürünün mağazası doğrudan verilir, bir üçlü "farklı mağazalar"
 * öncülü ve bir eşit sayı öncülü var. Burada kontenjan esnek ama sınırlı
 * ("iki ya da üç eşya") ve bir KARŞILAŞTIRMA öncülü ("minibüse kamyonetten
 * fazla") dağılımı 2-3-2'ye kilitliyor; tabloyu 'birlikte olmalı' (gardırop +
 * kitaplık) ve iki 'birlikte olamaz' (buzdolabı ↔ çamaşır makinesi, kanepe)
 * öncülü daraltıyor. Anahtar çıkarım olmayana ergi: gardırop ile kitaplık
 * panelvana konursa minibüse buzdolabı ile kanepe birlikte düşer, bu yüzden
 * ikisi de kesinlikle minibüstedir. Açık kalan altı çözümün yalnız birinde
 * kanepe, yalnız birinde yemek masası kamyonete girer; kitaplık hiçbirinde
 * giremez (kamyonette tek boş yer var) — "olabilir" sorusunun tuzağı bu.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "iki ya da üç eşya", "…eşya sayısından fazladır" ("en çok" yok)
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s5
 */
import { bazi, her, romenSik, sik, type Bulmaca, type Dunya } from './aay-cozucu';

const ESYA = ['Buzdolabı', 'Çamaşır', 'Gardırop', 'Kanepe', 'Kitaplık', 'Piyano', 'Yemek'];
const ARAC = ['kamyonet', 'minibüs', 'panelvan'];

const METIN =
  'Bir aile yeni evine taşınırken buzdolabı, çamaşır makinesi, gardırop, kanepe, kitaplık, piyano ve yemek masası olmak üzere yedi eşyasını kamyonet, minibüs ve panelvandan oluşan üç araçla taşımıştır. Her eşya bu araçlardan yalnızca birine yüklenmiş, araçlara bu yedi eşya dışında yük konulmamıştır. Yüklemeyle ilgili bilinenler şunlardır:\n' +
  '- Her araca iki ya da üç eşya yüklenmiştir.\n' +
  '- Minibüse yüklenen eşya sayısı, kamyonete yüklenen eşya sayısından fazladır.\n' +
  '- Piyano kamyonete yüklenmiştir.\n' +
  '- Gardırop ile kitaplık aynı araca yüklenmiştir.\n' +
  '- Buzdolabı ile çamaşır makinesi aynı araca yüklenmemiştir.\n' +
  '- Buzdolabı ile kanepe aynı araca yüklenmemiştir.\n' +
  '- Çamaşır makinesi minibüse yüklenmemiştir.';

// Metnin kurduğu uzay: her eşyaya bir araç (3^7), sonra öncüller sırayla.
const yukleme: Dunya[] = [];
for (let m = 0; m < 3 ** ESYA.length; m++) {
  const d: Dunya = Object.fromEntries(ESYA.map((e, i) => [e, ARAC[Math.floor(m / 3 ** i) % 3]]));
  const say = (a: string) => ESYA.filter((e) => d[e] === a).length;
  if (ARAC.some((a) => say(a) < 2 || say(a) > 3)) continue;
  if (!(say('minibüs') > say('kamyonet'))) continue;
  if (d.Piyano !== 'kamyonet') continue;
  if (d.Gardırop !== d.Kitaplık) continue;
  if (d.Buzdolabı === d.Çamaşır) continue;
  if (d.Buzdolabı === d.Kanepe) continue;
  if (d.Çamaşır === 'minibüs') continue;
  yukleme.push(d);
}
const yuklemeCamasirKamyonet = yukleme.filter((d) => d.Çamaşır === 'kamyonet');
const sayi = (d: Dunya, a: string) => ESYA.filter((e) => d[e] === a).length;

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-13', zorluk: 'medium', baslik: 'Taşınma · çamaşır makinesi kamyonette ise', ortakMetin: METIN, dunyalar: yuklemeCamasirKamyonet,
    kok: 'Yukarıdaki bilgilere göre, çamaşır makinesi kamyonete yüklenmişse aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Yedi eşya üç araca ikişer ya da üçer dağıldığından bir araçta üç, ötekilerde iki eşya vardır; minibüs kamyonetten fazla eşya aldığına göre minibüste üç, kamyonette ve panelvanda ikişer eşya bulunur. Çamaşır makinesi kamyonetteyse kamyonet piyanoyla birlikte dolmuştur. Gardırop ile kitaplık panelvana yüklenseydi minibüsün üç yeri buzdolabı, kanepe ve yemek masasıyla dolardı; oysa buzdolabı ile kanepe aynı araçta bulunamaz. Bu yüzden gardırop ile kitaplık minibüstedir ve minibüste tek yer kalır. Buzdolabı, kanepe ve yemek masası bu tek yer ile panelvandaki iki yere dağılır. Buzdolabı ile kanepe birlikte panelvana giremeyeceği için biri minibüse gider; yemek masası kesinlikle panelvandadır. Buzdolabının ve kanepenin yeri belirlenemez; panelvanda da üç değil iki eşya vardır.',
    ...sik(
      [
        'Yemek masası panelvana yüklenmiştir.',
        'Buzdolabı panelvana yüklenmiştir.',
        'Kanepe ile yemek masası aynı araca yüklenmiştir.',
        'Kitaplık panelvana yüklenmiştir.',
        'Panelvana üç eşya yüklenmiştir.',
      ],
      [
        her((d) => d.Yemek === 'panelvan'),
        her((d) => d.Buzdolabı === 'panelvan'),
        her((d) => d.Kanepe === d.Yemek),
        her((d) => d.Kitaplık === 'panelvan'),
        her((d) => sayi(d, 'panelvan') === 3),
      ],
      4051,
    ),
  },
  {
    id: 'aay-p4-14', zorluk: 'hard', baslik: 'Taşınma · kesinlikle doğru olan', ortakMetin: METIN, dunyalar: yukleme,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Yedi eşya üç araca ikişer ya da üçer dağıldığından bir araçta üç, ötekilerde iki eşya vardır; minibüs kamyonetten fazla eşya aldığına göre minibüste üç, kamyonette ve panelvanda ikişer eşya bulunur. Kamyonette piyanonun yanında tek yer kaldığı için birlikte yüklenen gardırop ile kitaplık oraya sığmaz. Panelvana yüklenselerdi panelvan dolar, kalan dört eşyadan üçü minibüse girerdi. Çamaşır makinesi minibüse yüklenmediği için bunlar buzdolabı, kanepe ve yemek masası olurdu; ancak buzdolabı ile kanepe aynı araçta bulunamaz. Demek ki gardırop kesinlikle minibüstedir. Öteki ifadeler kesin değildir: çamaşır makinesi kamyonete, kanepe minibüse, buzdolabı ile yemek masası panelvana yüklenebilir. Yemek masasının minibüste, çamaşır makinesi ile kanepenin panelvanda olduğu bir yükleme de mümkündür.',
    ...sik(
      [
        'Gardırop minibüse yüklenmiştir.',
        'Kanepe panelvana yüklenmiştir.',
        'Buzdolabı minibüse yüklenmiştir.',
        'Çamaşır makinesi ile kanepe farklı araçlara yüklenmiştir.',
        'Kitaplık ile yemek masası farklı araçlara yüklenmiştir.',
      ],
      [
        her((d) => d.Gardırop === 'minibüs'),
        her((d) => d.Kanepe === 'panelvan'),
        her((d) => d.Buzdolabı === 'minibüs'),
        her((d) => d.Çamaşır !== d.Kanepe),
        her((d) => d.Kitaplık !== d.Yemek),
      ],
      4052,
    ),
  },
  {
    id: 'aay-p4-15', zorluk: 'hard', baslik: 'Taşınma · kamyonete yüklenmiş olabilecekler', ortakMetin: METIN, dunyalar: yukleme,
    kok: 'Yukarıdaki bilgilere göre,\nI. Kanepe\nII. Kitaplık\nIII. Yemek masası\neşyalarından hangileri kamyonete yüklenmiş olabilir?',
    aciklama:
      'Her araçta iki ya da üç eşya olduğundan ve minibüs kamyonetten fazla eşya aldığından minibüste üç, kamyonette iki eşya vardır; kamyonette piyanonun yanında tek yer kalır. Kitaplık gardıropla aynı araçta olduğu için ikisi bu tek yere sığmaz; kitaplık kamyonete yüklenmiş olamaz (II). Gardırop ile kitaplık panelvana da yüklenemez: o durumda minibüse buzdolabı, kanepe ve yemek masası kalır, buzdolabı ile kanepe ise aynı araçta bulunamaz. Demek ki ikisi minibüstedir. Kamyonetteki boş yere kanepe konulursa buzdolabı minibüse, çamaşır makinesi ile yemek masası panelvana yüklenir (I olabilir). Yemek masası konulursa buzdolabı minibüse, çamaşır makinesi ile kanepe panelvana yüklenir (III olabilir). Kanepe de yemek masası da kamyonete yalnız tek bir yükleme biçiminde girer; “olabilir” sorusunda tek örnek yeter. Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Kanepe === 'kamyonet'), bazi((d) => d.Kitaplık === 'kamyonet'), bazi((d) => d.Yemek === 'kamyonet')],
      [[1, 3], [1], [3], [1, 2], [1, 2, 3]],
    ),
  },
];
