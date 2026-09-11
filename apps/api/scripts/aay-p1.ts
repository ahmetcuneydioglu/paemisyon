/**
 * Analitik Akıl Yürütme · 1. parti — 4 senaryo × 3 soru.
 *
 * Sıra kasıtlı: önce öncüller kurulur, çözücüye NEYİN kesin olduğu sorulur,
 * soru ancak ondan sonra yazılır. Böylece anahtar "benim çözümüm" değil,
 * bütün dünyaların sayımı olur. Kurgular nötr tutulur — mantık sorusu
 * kılığında hukuk normu öğretmek bankadaki gerçek mevzuat sorularıyla çelişir.
 *
 *   npx tsx scripts/aay-p1.ts
 */
import {
  dagilimlar, dizilimler, her, hicbiri, ikiliDunyalar, raporla, tamDeger,
  sik, type Bulmaca, type Dunya,
} from './aay-cozucu';

const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const g = (ad: string) => GUN.indexOf(ad) + 1;
const n = (d: Dunya, k: string) => d[k] as number;

// ── S1 · nöbet çizelgesi ─────────────────────────────────────────
const S1_METIN =
  'Bir polis merkezinde görevli Arda, Berk, Ceyda, Demir ve Esra adlı beş memur, Pazartesiden Cumaya kadar olan beş gün boyunca nöbet tutacaktır. Her gün yalnız bir memur nöbetçidir ve her memur yalnız bir gün nöbet tutar. Nöbet çizelgesi ile ilgili bilinenler şunlardır:\n' +
  '- Ceyda, Arda’dan hemen sonraki gün nöbetçidir.\n' +
  '- Berk, Demir’den daha erken bir günde nöbet tutar.\n' +
  '- Esra Pazartesi günü nöbetçi değildir.\n' +
  '- Demir Perşembe günü nöbetçi değildir.';
const nobet = dizilimler(['Arda', 'Berk', 'Ceyda', 'Demir', 'Esra'], [1, 2, 3, 4, 5]).filter(
  (d) => n(d, 'Ceyda') === n(d, 'Arda') + 1 && n(d, 'Berk') < n(d, 'Demir') && n(d, 'Esra') !== 1 && n(d, 'Demir') !== 4,
);
const nobetArdaCar = nobet.filter((d) => n(d, 'Arda') === g('Çarşamba'));

// ── S2 · tim dağılımı ────────────────────────────────────────────
const S2_METIN =
  'Bir ilçe emniyet müdürlüğünde görevli Kaya, Levent, Melis, Nur, Onur ve Pelin adlı altı polis memuru Devriye, Çevik ve Trafik timlerine dağıtılmıştır. Devriye timinde üç, Çevik timinde iki, Trafik timinde bir memur vardır ve her memur yalnız bir timde görevlidir. Dağılım ile ilgili bilinenler şunlardır:\n' +
  '- Kaya ile Levent aynı timdedir.\n' +
  '- Onur Çevik timindedir.\n' +
  '- Pelin Trafik timinde değildir.';
const TIM_KISI = ['Kaya', 'Levent', 'Melis', 'Nur', 'Onur', 'Pelin'];
const tim = dagilimlar(TIM_KISI, { Devriye: 3, Çevik: 2, Trafik: 1 })
  .filter((d) => d.Kaya === d.Levent && d.Onur === 'Çevik' && d.Pelin !== 'Trafik')
  .map((d) => ({ ...d, trafik: TIM_KISI.find((k) => d[k] === 'Trafik')! }));
const timPelinCevik = tim.filter((d) => d.Pelin === 'Çevik');

// ── S3 · telsiz kanalları ────────────────────────────────────────
const S3_METIN =
  'Bir asayiş uygulamasında görevlendirilen Ekip 1, Ekip 2, Ekip 3 ve Ekip 4’e Mavi, Yeşil, Kırmızı ve Sarı telsiz kanallarından biri verilmiştir. Her ekibe yalnız bir kanal verilmiş, her kanal yalnız bir ekipte kullanılmıştır. Kanal dağılımı ile ilgili bilinenler şunlardır:\n' +
  '- Ekip 1’e Mavi kanal verilmemiştir.\n' +
  '- Ekip 3’e Sarı kanal verilmemiştir.\n' +
  '- Kırmızı kanal, Ekip 2’ye ya da Ekip 4’e verilmiştir.';
const kanal = dizilimler(['E1', 'E2', 'E3', 'E4'], ['Mavi', 'Yeşil', 'Kırmızı', 'Sarı']).filter(
  (d) => d.E1 !== 'Mavi' && d.E3 !== 'Sarı' && (d.E2 === 'Kırmızı' || d.E4 === 'Kırmızı'),
);
const kanalE4Sari = kanal.filter((d) => d.E4 === 'Sarı');

// ── S4 · koşullu görevlendirme ───────────────────────────────────
const S4_METIN =
  'Bir operasyonda Alfa, Bravo, Charlie ve Delta timlerinden hangilerinin görevlendirileceği belirlenecektir. Görevlendirme kuralları şunlardır:\n' +
  '- Alfa görevlendirilirse Charlie de görevlendirilir.\n' +
  '- Bravo ile Charlie birlikte görevlendirilemez.\n' +
  '- Alfa ya da Bravo’dan en az biri görevlendirilir.\n' +
  '- Delta görevlendirilirse Bravo da görevlendirilir.';
const gorev = ikiliDunyalar(['Alfa', 'Bravo', 'Charlie', 'Delta']).filter(
  (d) => (!d.Alfa || d.Charlie) && !(d.Bravo && d.Charlie) && (d.Alfa || d.Bravo) && (!d.Delta || d.Bravo),
);
// Sayım sorusu için türetilmiş alan: o dünyada kaç tim görevlendirilmiş.
const gorevSayili = gorev.map((d) => ({ ...d, sayi: ['Alfa', 'Bravo', 'Charlie', 'Delta'].filter((k) => d[k]).length }));


export const PARTI: (Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' })[] = [
  {
    id: 'aay-p1-01', zorluk: 'medium', aciklama:
      'Arda–Ceyda ikilisi ardışık olduğu için Pazartesi-Salı, Salı-Çarşamba, Çarşamba-Perşembe ya da Perşembe-Cuma’ya yerleşir. Demir Perşembe olamaz (öncül); Berk’ten daha geç olması gerektiği için Pazartesi de olamaz. Geriye Salı, Çarşamba ve Cuma kalır ve üçü de gerçekten kurulabilir: Demir Salı (Berk Pzt, Arda Çar, Ceyda Per, Esra Cum), Demir Çarşamba (Berk Pzt, Esra Sal, Arda Per, Ceyda Cum), Demir Cuma (Berk Pzt, Arda Sal, Ceyda Çar, Esra Per). Bu yüzden olası günler tam olarak Salı, Çarşamba ve Cuma’dır.',
    baslik: 'Nöbet · Demir’in olası günleri', ortakMetin: S1_METIN, dunyalar: nobet,
    kok: 'Yukarıdaki bilgilere göre, Demir’in nöbet tutabileceği günler aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(
      ['Salı, Çarşamba, Cuma', 'Pazartesi, Salı, Çarşamba', 'Salı, Perşembe, Cuma', 'Çarşamba, Perşembe, Cuma', 'Pazartesi, Çarşamba, Cuma'],
      [['Salı', 'Çarşamba', 'Cuma'], ['Pazartesi', 'Salı', 'Çarşamba'], ['Salı', 'Perşembe', 'Cuma'], ['Çarşamba', 'Perşembe', 'Cuma'], ['Pazartesi', 'Çarşamba', 'Cuma']].map((s) => tamDeger('Demir', s.map(g))), 211),
  },
  {
    id: 'aay-p1-02', zorluk: 'medium', aciklama:
      'Arda Çarşamba ise Ceyda zorunlu olarak Perşembe olur. Geriye Pazartesi, Salı ve Cuma kalır. Esra Pazartesi olamaz (öncül); Demir de Berk’ten daha geç olacağı için Pazartesi olamaz. Dolayısıyla Pazartesi kesinlikle Berk’indir. Demir ile Esra ise Salı ve Cuma’yı iki ayrı biçimde paylaşabildiğinden, onlara ilişkin hiçbir şık kesinleşmez.',
    baslik: 'Nöbet · Arda Çarşamba ise', ortakMetin: S1_METIN, dunyalar: nobetArdaCar,
    kok: 'Yukarıdaki bilgilere göre, Arda Çarşamba günü nöbetçi ise aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(
      ['Berk Pazartesi günü nöbetçidir.', 'Demir Salı günü nöbetçidir.', 'Esra Cuma günü nöbetçidir.', 'Ceyda Cuma günü nöbetçidir.', 'Demir, Esra’dan daha erken bir günde nöbet tutar.'],
      [her((d) => n(d, 'Berk') === g('Pazartesi')), her((d) => n(d, 'Demir') === g('Salı')), her((d) => n(d, 'Esra') === g('Cuma')), her((d) => n(d, 'Ceyda') === g('Cuma')), her((d) => n(d, 'Demir') < n(d, 'Esra'))], 212),
  },
  {
    id: 'aay-p1-03', zorluk: 'hard', aciklama:
      'Berk Salı olsaydı Demir ondan daha geç bir güne düşerdi; Perşembe yasak olduğu için Demir ya Çarşamba ya Cuma olurdu. Demir Çarşamba ise ardışık Arda–Ceyda ikilisine yalnız Perşembe-Cuma kalır ve Pazartesi’ye zorunlu olarak Esra düşer. Demir Cuma ise ikiliye Çarşamba-Perşembe kalır ve Pazartesi’ye yine Esra düşer. Her iki yol da Esra’nın Pazartesi olamayacağı öncülüne çarpar; Berk Salı olamaz. Öteki dört ifade en az bir çizelgede gerçekleşir.',
    baslik: 'Nöbet · kesinlikle yanlış', ortakMetin: S1_METIN, dunyalar: nobet,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(
      ['Berk Salı günü nöbetçidir.', 'Berk Perşembe günü nöbetçidir.', 'Ceyda Cuma günü nöbetçidir.', 'Esra Perşembe günü nöbetçidir.', 'Arda Pazartesi günü nöbetçidir.'],
      [['Berk', 'Salı'], ['Berk', 'Perşembe'], ['Ceyda', 'Cuma'], ['Esra', 'Perşembe'], ['Arda', 'Pazartesi']].map(([k, t]) => hicbiri((d) => n(d, k) === g(t))), 213),
  },
  {
    id: 'aay-p1-04', zorluk: 'medium', aciklama:
      'Kaya ile Levent aynı timdedir. Trafik tek kişilik olduğu için ikisi birden oraya giremez. Çevik iki kişiliktir ama bir yerini Onur tutmaktadır, dolayısıyla Kaya ile Levent oraya da sığmaz. Geriye yalnız üç kişilik Devriye timi kalır. Öteki şıkların hepsi bazı dağılımlarda doğru, bazılarında yanlıştır.',
    baslik: 'Tim · kesinlikle doğru', ortakMetin: S2_METIN, dunyalar: tim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(
      ['Kaya Devriye timindedir.', 'Pelin Çevik timindedir.', 'Melis Trafik timindedir.', 'Nur Devriye timindedir.', 'Levent Çevik timindedir.'],
      [['Kaya', 'Devriye'], ['Pelin', 'Çevik'], ['Melis', 'Trafik'], ['Nur', 'Devriye'], ['Levent', 'Çevik']].map(([k, t]) => her((d) => d[k] === t)), 214),
  },
  {
    id: 'aay-p1-05', zorluk: 'medium', aciklama:
      'Devriye’nin üç yerinden ikisini Kaya ile Levent, Çevik’in iki yerinden birini Onur tutar. Melis, Nur ve Pelin geriye kalan üç yeri — bir Devriye, bir Çevik, bir Trafik — paylaşır. Pelin Trafik timinde olamayacağına göre Trafik’teki memur ya Melis ya Nur’dur ve ikisi de gerçekleşebilir.',
    baslik: 'Tim · Trafik timindeki kişi', ortakMetin: S2_METIN, dunyalar: tim,
    kok: 'Yukarıdaki bilgilere göre, Trafik timinde görevli olabilecek memurlar aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(
      ['Melis veya Nur', 'Melis veya Pelin', 'Nur veya Pelin', 'Yalnız Melis', 'Yalnız Nur'],
      [['Melis', 'Nur'], ['Melis', 'Pelin'], ['Nur', 'Pelin'], ['Melis'], ['Nur']].map((s) => tamDeger('trafik', s)), 215),
  },
  {
    id: 'aay-p1-06', zorluk: 'medium', aciklama:
      'Kaya ile Levent Devriye’nin üç yerinden ikisini, Onur Çevik’in iki yerinden birini doldurur. Melis, Nur ve Pelin’e geriye kalan bir Devriye, bir Çevik ve bir Trafik yeri düşer; üçü zorunlu olarak üç ayrı timde bulunur. Bu yüzden Melis ile Nur asla aynı timde olamaz. Öteki dört ifade en az bir dağılımda gerçekleşir.',
    baslik: 'Tim · kesinlikle yanlış', ortakMetin: S2_METIN, dunyalar: tim,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(
      ['Melis ile Nur aynı timdedir.', 'Kaya ile Nur aynı timdedir.', 'Pelin Devriye timindedir.', 'Nur Çevik timindedir.', 'Melis Trafik timindedir.'],
      [hicbiri((d) => d.Melis === d.Nur), hicbiri((d) => d.Kaya === d.Nur), hicbiri((d) => d.Pelin === 'Devriye'), hicbiri((d) => d.Nur === 'Çevik'), hicbiri((d) => d.Melis === 'Trafik')], 216),
  },
  {
    id: 'aay-p1-07', zorluk: 'easy', aciklama:
      'Ekip 1’e Mavi verilmemiştir (öncül). Kırmızı ise Ekip 2 ya da Ekip 4’e verildiğinden Ekip 1’e gelemez. Geriye Sarı ile Yeşil kalır ve ikisi de mümkündür: Ekip 1 Yeşil (Ekip 2 Kırmızı, Ekip 3 Mavi, Ekip 4 Sarı) ya da Ekip 1 Sarı (Ekip 2 Kırmızı, Ekip 3 Mavi, Ekip 4 Yeşil).',
    baslik: 'Kanal · Ekip 1’in olası kanalları', ortakMetin: S3_METIN, dunyalar: kanal,
    kok: 'Yukarıdaki bilgilere göre, Ekip 1’e verilebilecek kanallar aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(
      ['Sarı veya Yeşil', 'Mavi veya Yeşil', 'Yeşil veya Kırmızı', 'Sarı veya Kırmızı', 'Mavi veya Sarı'],
      [['Sarı', 'Yeşil'], ['Mavi', 'Yeşil'], ['Yeşil', 'Kırmızı'], ['Sarı', 'Kırmızı'], ['Mavi', 'Sarı']].map((s) => tamDeger('E1', s)), 217),
  },
  {
    id: 'aay-p1-08', zorluk: 'medium', aciklama:
      'Kırmızı kanal Ekip 2 ya da Ekip 4’tedir. Ekip 4’e Sarı verildiğine göre Kırmızı zorunlu olarak Ekip 2’dedir. Geriye Mavi ile Yeşil kalır; Ekip 1 Mavi alamayacağı için Ekip 1 Yeşil, Ekip 3 Mavi olur. Dağılım tek bir biçimde kapanır.',
    baslik: 'Kanal · Ekip 4 Sarı ise', ortakMetin: S3_METIN, dunyalar: kanalE4Sari,
    kok: 'Yukarıdaki bilgilere göre, Ekip 4’e Sarı kanal verilmişse aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(
      ['Ekip 2’ye Kırmızı kanal verilmiştir.', 'Ekip 1’e Mavi kanal verilmiştir.', 'Ekip 3’e Yeşil kanal verilmiştir.', 'Ekip 2’ye Mavi kanal verilmiştir.', 'Ekip 3’e Kırmızı kanal verilmiştir.'],
      [['E2', 'Kırmızı'], ['E1', 'Mavi'], ['E3', 'Yeşil'], ['E2', 'Mavi'], ['E3', 'Kırmızı']].map(([e, k]) => her((d) => d[e] === k)), 218),
  },
  {
    id: 'aay-p1-09', zorluk: 'hard', aciklama:
      'İki iddia tek tek mümkündür — Ekip 1 Yeşil alabilir, Ekip 2 Mavi alabilir — ama birlikte olamazlar. Ekip 2’ye Mavi verilirse Kırmızı zorunlu olarak Ekip 4’e gider. Geriye Sarı ile Yeşil kalır ve Ekip 3 Sarı alamayacağı için Ekip 3 Yeşil, Ekip 1 ise Sarı olur. Yani Ekip 2 Mavi iken Ekip 1 asla Yeşil olamaz. Öteki dördü gerçekten kurulabilen dağılımlardır.',
    baslik: 'Kanal · kesinlikle yanlış', ortakMetin: S3_METIN, dunyalar: kanal,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(
      ['Ekip 1’e Yeşil, Ekip 2’ye Mavi kanal verilmiştir.', 'Ekip 1’e Yeşil, Ekip 3’e Mavi kanal verilmiştir.', 'Ekip 1’e Sarı, Ekip 2’ye Kırmızı kanal verilmiştir.', 'Ekip 2’ye Sarı, Ekip 4’e Kırmızı kanal verilmiştir.', 'Ekip 3’e Yeşil, Ekip 4’e Kırmızı kanal verilmiştir.'],
      ([['E1', 'Yeşil', 'E2', 'Mavi'], ['E1', 'Yeşil', 'E3', 'Mavi'], ['E1', 'Sarı', 'E2', 'Kırmızı'], ['E2', 'Sarı', 'E4', 'Kırmızı'], ['E3', 'Yeşil', 'E4', 'Kırmızı']] as const)
        .map(([a, ka, b, kb]) => hicbiri((d) => d[a] === ka && d[b] === kb)), 219),
  },
  {
    id: 'aay-p1-10', zorluk: 'medium', aciklama:
      'Alfa görevlendirilirse birinci kural gereği Charlie de görevlendirilir. Bravo ile Charlie birlikte görevlendirilemeyeceğine göre Bravo dışarıda kalır. Öteki koşullu ifadeler ise yalnız Bravo’nun görevlendirildiği dağılımda yanlışlanır.',
    baslik: 'Görev · kesinlikle doğru', ortakMetin: S4_METIN, dunyalar: gorev,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(
      ['Alfa görevlendirilmişse Bravo görevlendirilmemiştir.', 'Bravo görevlendirilmişse Delta da görevlendirilmiştir.', 'Charlie görevlendirilmemişse Alfa görevlendirilmiştir.', 'Delta görevlendirilmemişse Charlie görevlendirilmiştir.', 'Alfa görevlendirilmemişse Delta görevlendirilmiştir.'],
      [her((d) => !d.Alfa || !d.Bravo), her((d) => !d.Bravo || Boolean(d.Delta)), her((d) => Boolean(d.Charlie) || Boolean(d.Alfa)), her((d) => Boolean(d.Delta) || Boolean(d.Charlie)), her((d) => Boolean(d.Alfa) || Boolean(d.Delta))], 220),
  },
  {
    id: 'aay-p1-11', zorluk: 'hard', aciklama:
      'Kurallarla tutarlı yalnız üç dağılım vardır: yalnız Bravo (bir tim); Alfa ile Charlie (iki tim); Bravo ile Delta (iki tim). Üç tim birden görevlendirilemez, çünkü Alfa’nın girmesi Charlie’yi zorunlu kılar, Charlie de Bravo’yu ve dolayısıyla Bravo’ya bağlı olan Delta’yı dışarıda bırakır. Hiç tim görevlendirilmemesi de mümkün değildir; Alfa ya da Bravo’dan en az biri görevlendirilmek zorundadır. Geriye tam olarak 1 ve 2 kalır.',
    baslik: 'Görev · görevlendirilen tim sayısı', ortakMetin: S4_METIN, dunyalar: gorevSayili,
    kok: 'Yukarıdaki bilgilere göre, görevlendirilen tim sayısı aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(
      ['1 veya 2', 'Yalnız 2', '2 veya 3', '1, 2 veya 3', 'Yalnız 1'],
      [[1, 2], [2], [2, 3], [1, 2, 3], [1]].map((k) => tamDeger('sayi', k)), 221),
  },
  {
    id: 'aay-p1-12', zorluk: 'medium', aciklama:
      'Delta görevlendirilirse dördüncü kural gereği Bravo da görevlendirilir. İkinci kural Bravo ile Charlie’nin birlikte görevlendirilmesini yasakladığına göre Charlie dışarıda kalır. Dolayısıyla Charlie ile Delta hiçbir dağılımda birlikte bulunamaz. Öteki dört ifade en az bir dağılımda gerçekleşir.',
    baslik: 'Görev · kesinlikle yanlış', ortakMetin: S4_METIN, dunyalar: gorev,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(
      ['Charlie ile Delta birlikte görevlendirilmiştir.', 'Yalnızca Bravo görevlendirilmiştir.', 'Alfa ile Charlie birlikte görevlendirilmiştir.', 'Bravo ile Delta birlikte görevlendirilmiştir.', 'Alfa görevlendirilmemiştir.'],
      [hicbiri((d) => Boolean(d.Charlie && d.Delta)), hicbiri((d) => Boolean(d.Bravo) && !d.Alfa && !d.Charlie && !d.Delta), hicbiri((d) => Boolean(d.Alfa && d.Charlie)), hicbiri((d) => Boolean(d.Bravo && d.Delta)), hicbiri((d) => !d.Alfa)], 222),
  },
];

raporla(PARTI);
