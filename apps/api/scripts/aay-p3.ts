/**
 * Analitik Akıl Yürütme · 3. parti — 12 KISA, tek başına duran soru.
 *
 * İlk iki parti uzun kurgu bloklarıyla çalışıyordu: senaryo metni 700 karakteri
 * aşıyor ve üç soru aynı bloğa asılıyordu. Bu iki maliyeti getirdi — adayın
 * okuma yükü ve aynı senaryonun soruları arasındaki sızıntı. Burada her soru
 * kendi öncüllerini taşır, blok yoktur; sızıntı tanımı gereği imkânsızdır.
 * Zorluk da kasıtlı olarak aşağı çekilir: hedef "çözülebilir ama düşündürür".
 *
 *   npx tsx scripts/aay-p3.ts
 */
import {
  bazi, dizilimler, her, hicbiri, ikiliDunyalar, raporla, sik, tamDeger,
  type Bulmaca, type Dunya,
} from './aay-cozucu';

const n = (d: Dunya, k: string) => d[k] as number;
const tek = (d: Dunya): Dunya[] => [d];

// ── küçük dünya kurucular ────────────────────────────────────────
const kosu = dizilimler(['Ali', 'Berk', 'Can', 'Deniz'], [1, 2, 3, 4])
  .filter((d) => n(d, 'Berk') < n(d, 'Ali') && n(d, 'Deniz') < n(d, 'Can'));

const boy = dizilimler(['Ayşe', 'Burcu', 'Ceren', 'Dilek'], [1, 2, 3, 4])
  .filter((d) => n(d, 'Ayşe') > n(d, 'Burcu') && n(d, 'Ceren') > n(d, 'Ayşe') && n(d, 'Dilek') < n(d, 'Burcu'));

const belge = ikiliDunyalar(['A', 'B', 'C']).filter((d) => (!d.A || d.B) && (!d.C || !d.B) && d.C);

const zanli = ikiliDunyalar(['dA', 'dB', 'dC']).filter((d) =>
  Boolean(d.dA) === !d.dB && Boolean(d.dB) === !d.dC && Boolean(d.dC) === (!d.dA && !d.dB) &&
  [d.dA, d.dB, d.dC].filter(Boolean).length === 1);

/** Sekiz yönlü pusula, 45° adımlarla. */
const YON = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
const don = (bas: string, adim: number[]) => YON[(YON.indexOf(bas) + adim.reduce((a, b) => a + b, 0) + 800) % 8];
const devriye = tek({ yon: don('Kuzey', [2, -1]) });             // sağa 90°, sola 45°

const gorev = dizilimler(['Kaan', 'Lale', 'Mert'], ['Devriye', 'Büro', 'Nöbet'])
  .filter((d) => d.Kaan !== 'Devriye' && d.Lale !== 'Devriye');

const kat = dizilimler(['A', 'B', 'C', 'D', 'E'], [1, 2, 3, 4, 5])
  .filter((d) => n(d, 'B') === n(d, 'A') + 1 && n(d, 'C') === 5 && n(d, 'D') < n(d, 'A'));

const nufus = dizilimler(['A', 'B', 'C', 'D'], [1, 2, 3, 4])
  .filter((d) => n(d, 'A') > n(d, 'B') && n(d, 'C') < n(d, 'D') && n(d, 'B') > n(d, 'D'));

const ADAY = ['A', 'B', 'C', 'D'];
const komisyon = ikiliDunyalar(ADAY).filter((d) =>
  ADAY.filter((k) => d[k]).length === 2 && !(d.A && d.B) && (!d.C || d.D));

const kurum = ikiliDunyalar(['sofor', 'ehliyet', 'stajyer'])
  .filter((d) => (!d.sofor || d.ehliyet) && (!d.stajyer || !d.ehliyet));

const puan = dizilimler(['Efe', 'Fırat', 'Gizem'], [1, 2, 3])
  .filter((d) => n(d, 'Efe') < n(d, 'Gizem') && n(d, 'Fırat') !== 3);

/** Dört kişilik yuvarlak masa: 1↔3 ve 2↔4 karşılıklı, saat yönünde numaralı. */
const masa = dizilimler(['A', 'B', 'C', 'D'], [1, 2, 3, 4]).filter((d) =>
  (n(d, 'A') + 2 - 1) % 4 + 1 === n(d, 'C') && (n(d, 'A') % 4) + 1 === n(d, 'B'));

export const PARTI: (Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' })[] = [
  {
    id: 'aay-p3-01', zorluk: 'easy', baslik: 'Koşu · kesinlikle yanlış', dunyalar: kosu,
    ortakMetin: 'Bir koşuda Ali, Berk, Can ve Deniz yarışmış ve hepsi farklı sıralarda bitirmiştir. Berk, Ali’den önce; Deniz ise Can’dan önce bitirmiştir.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    aciklama: 'Berk, Ali’den önce bitirdiğine göre Ali’nin önünde en az bir yarışmacı vardır; bu yüzden Ali birinci olamaz. Öteki dört ifade en az bir sıralamada gerçekleşir.',
    ...sik(['Ali birinci olmuştur.', 'Berk birinci olmuştur.', 'Deniz ikinci olmuştur.', 'Can dördüncü olmuştur.', 'Ali üçüncü olmuştur.'],
      ([['Ali', 1], ['Berk', 1], ['Deniz', 2], ['Can', 4], ['Ali', 3]] as const).map(([k, v]) => hicbiri((d) => n(d, k) === v)), 1020),
  },
  {
    id: 'aay-p3-02', zorluk: 'easy', baslik: 'Boy · kesinlikle doğru', dunyalar: boy,
    ortakMetin: 'Ayşe, Burcu’dan uzundur. Ceren, Ayşe’den uzundur. Dilek ise Burcu’dan kısadır.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'Verilenler tek bir sıralama kurar: Ceren, Ayşe’den; Ayşe, Burcu’dan; Burcu da Dilek’ten uzundur. Dolayısıyla en uzun kişi Ceren, en kısa kişi Dilek’tir.',
    ...sik(['En uzun kişi Ceren’dir.', 'En kısa kişi Burcu’dur.', 'Dilek, Ayşe’den uzundur.', 'En uzun kişi Ayşe’dir.', 'Ceren, Dilek’ten kısadır.'],
      [her((d) => n(d, 'Ceren') === 4), her((d) => n(d, 'Burcu') === 1), her((d) => n(d, 'Dilek') > n(d, 'Ayşe')), her((d) => n(d, 'Ayşe') === 4), her((d) => n(d, 'Ceren') < n(d, 'Dilek'))], 1021),
  },
  {
    id: 'aay-p3-03', zorluk: 'medium', baslik: 'Belge · koşullu çıkarım', dunyalar: belge,
    ortakMetin: 'Bir kurumda A belgesini alan her personel B belgesini de almıştır. C belgesi olan hiçbir personel ise B belgesi almamıştır.',
    kok: 'Buna göre, C belgesi olan bir personel için aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'C belgesi olan personel B belgesi alamaz. A belgesini alsaydı B belgesini de almış olması gerekirdi; bu mümkün olmadığına göre A belgesini de almamıştır.',
    ...sik(['A belgesini almamıştır.', 'A belgesini almıştır.', 'B belgesini almıştır.', 'A ve B belgelerinin ikisini de almıştır.', 'B belgesini almamış, A belgesini almıştır.'],
      [her((d) => !d.A), her((d) => Boolean(d.A)), her((d) => Boolean(d.B)), her((d) => Boolean(d.A && d.B)), her((d) => !d.B && Boolean(d.A))], 1022),
  },
  {
    id: 'aay-p3-04', zorluk: 'medium', baslik: 'Zanlı · doğruyu söyleyen', dunyalar: zanli,
    ortakMetin: 'Üç zanlıdan yalnız biri doğruyu söylemekte, diğer ikisi yalan söylemektedir.\n- A: “B yalan söylüyor.”\n- B: “C yalan söylüyor.”\n- C: “A da B de yalan söylüyor.”',
    kok: 'Buna göre, doğruyu söyleyen zanlı aşağıdakilerden hangisidir?',
    aciklama: 'A doğruyu söyleseydi B yalan söylerdi; o hâlde B’nin sözü yanlış olur ve C doğruyu söylerdi — iki kişi doğruyu söylemiş olurdu. C doğruyu söyleseydi A da B de yalan söylerdi; ama A’nın yalan olması B’nin doğruyu söylemesi demektir, yine çelişki çıkar. Geriye B kalır: B doğruyu söyler, C yalan söyler, A’nın sözü de yanlış olur. Bu dağılım her üç ifadeyle uyuşur.',
    ...sik(['B', 'A', 'C', 'A ile C', 'Belirlenemez'],
      [her((d) => Boolean(d.dB)), her((d) => Boolean(d.dA)), her((d) => Boolean(d.dC)), her((d) => Boolean(d.dA && d.dC)), (ds) => new Set(ds.map((d) => `${d.dA}${d.dB}${d.dC}`)).size > 1], 1023),
  },
  {
    id: 'aay-p3-05', zorluk: 'easy', baslik: 'Devriye · yön', dunyalar: devriye,
    ortakMetin: 'Kuzeye doğru ilerleyen bir devriye aracı önce sağa doğru 90 derece, ardından sola doğru 45 derece dönmüştür.',
    kok: 'Buna göre araç en son hangi yöne doğru ilerlemektedir?',
    aciklama: 'Kuzeye giderken sağa 90 derece dönen araç doğuya yönelir. Ardından sola 45 derece döndüğünde kuzey ile doğunun tam ortasına, yani kuzeydoğuya yönelmiş olur.',
    ...sik(['Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Kuzey', 'Kuzeybatı'],
      ['Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Kuzey', 'Kuzeybatı'].map((y) => her((d) => d.yon === y)), 1024),
  },
  {
    id: 'aay-p3-06', zorluk: 'easy', baslik: 'Görev · kesinlikle doğru', dunyalar: gorev,
    ortakMetin: 'Kaan, Lale ve Mert adlı üç memura Devriye, Büro ve Nöbet görevlerinden biri verilmiştir; her memur yalnız bir görev üstlenmiştir. Ne Kaan ne de Lale Devriye görevindedir.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'Devriye görevi ne Kaan’a ne Lale’ye verildiğine göre zorunlu olarak Mert’e kalır. Büro ile Nöbet görevlerini ise Kaan ile Lale paylaşır; hangisinin hangi görevi üstlendiği verilenlerden çıkmaz, bu yüzden onlara ilişkin hiçbir ifade kesinleşmez.',
    ...sik(['Mert Devriye görevindedir.', 'Kaan Büro görevindedir.', 'Lale Nöbet görevindedir.', 'Kaan Nöbet görevindedir.', 'Lale Büro görevindedir.'],
      ([['Mert', 'Devriye'], ['Kaan', 'Büro'], ['Lale', 'Nöbet'], ['Kaan', 'Nöbet'], ['Lale', 'Büro']] as const).map(([k, v]) => her((d) => d[k] === v)), 1025),
  },
  {
    id: 'aay-p3-07', zorluk: 'medium', baslik: 'Kat · D’nin olası katları', dunyalar: kat,
    ortakMetin: 'Beş katlı bir binanın her katında A, B, C, D ve E birimlerinden biri bulunmaktadır; her birim yalnız bir kattadır. B, A’nın hemen üst katındadır. C en üst kattadır. D ise A’dan alt bir kattadır.',
    kok: 'Buna göre, D biriminin bulunabileceği katlar aşağıdakilerin hangisinde tam olarak verilmiştir?',
    aciklama: 'C beşinci katta olduğuna göre A ile B ikilisi 2-3 ya da 3-4 katlarına yerleşir; A birinci katta olamaz, çünkü altında D’ye yer kalmaz. A ikinci kattaysa D birinci kata, A üçüncü kattaysa D birinci ya da ikinci kata düşer. Böylece D için birinci ve ikinci katların ikisi de mümkündür, üçüncü kat ise değildir.',
    ...sik(['1 veya 2', 'Yalnız 1', '1, 2 veya 3', '2 veya 3', 'Yalnız 2'],
      [[1, 2], [1], [1, 2, 3], [2, 3], [2]].map((k) => tamDeger('D', k)), 1026),
  },
  {
    id: 'aay-p3-08', zorluk: 'easy', baslik: 'Nüfus · en az olan', dunyalar: nufus,
    ortakMetin: 'Nüfusları birbirinden farklı dört ilçeden A’nın nüfusu B’den, B’nin nüfusu D’den fazladır. C’nin nüfusu ise D’den azdır.',
    kok: 'Buna göre, nüfusu en az olan ilçe aşağıdakilerden hangisidir?',
    aciklama: 'Verilenler tek bir sıralama kurar: A, B’den; B, D’den; D de C’den kalabalıktır. Dolayısıyla en kalabalık ilçe A, en az nüfuslu ilçe C’dir.',
    ...sik(['C', 'A', 'B', 'D', 'Belirlenemez'],
      [her((d) => n(d, 'C') === 1), her((d) => n(d, 'A') === 1), her((d) => n(d, 'B') === 1), her((d) => n(d, 'D') === 1),
       (ds) => new Set(ds.map((d) => ['A', 'B', 'C', 'D'].find((k) => n(d, k) === 1))).size > 1], 1027),
  },
  {
    id: 'aay-p3-09', zorluk: 'medium', baslik: 'Komisyon · kesinlikle doğru', dunyalar: komisyon,
    ortakMetin: 'Bir komisyona A, B, C ve D adaylarından tam olarak ikisi seçilecektir. A seçilirse B seçilemez. C seçilirse D de seçilmek zorundadır.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'Komisyon iki kişiliktir. A ile B birlikte seçilemez. C seçilirse D de seçilmek zorunda olduğundan C’nin yanına başka bir aday sığmaz; yani C seçilirse ikili C ile D olur. C seçilmezse ikili A ya da B’nin yanına D’yi alır, çünkü geriye yalnız D kalmıştır. Üç durumun da ortak yanı D’nin seçilmiş olmasıdır.',
    ...sik(['D seçilmiştir.', 'C seçilmiştir.', 'A seçilmiştir.', 'B seçilmiştir.', 'C ile D birlikte seçilmiştir.'],
      [her((d) => Boolean(d.D)), her((d) => Boolean(d.C)), her((d) => Boolean(d.A)), her((d) => Boolean(d.B)), her((d) => Boolean(d.C && d.D))], 1028),
  },
  {
    id: 'aay-p3-10', zorluk: 'medium', baslik: 'Kurum · küme çıkarımı', dunyalar: kurum,
    ortakMetin: 'Bir kurumdaki bütün şoförlerin ehliyeti vardır. Stajyerlerin ise hiçbirinin ehliyeti yoktur.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'Şoför olmak ehliyet sahibi olmayı gerektirir; stajyer olmak ise ehliyetsizliği gerektirir. Bir kişi hem stajyer hem şoför olsaydı ehliyeti hem olur hem olmazdı. Dolayısıyla hiçbir stajyer şoför değildir. Öteki ifadeler verilenlerden çıkmaz.',
    ...sik(['Hiçbir stajyer şoför değildir.', 'Ehliyeti olan herkes şofördür.', 'Bazı stajyerler şoför olabilir.', 'Bütün şoförler stajyerdir.', 'Ehliyeti olmayan herkes stajyerdir.'],
      [hicbiri((d) => Boolean(d.stajyer && d.sofor)), her((d) => !d.ehliyet || Boolean(d.sofor)), bazi((d) => Boolean(d.stajyer && d.sofor)), her((d) => !d.sofor || Boolean(d.stajyer)), her((d) => Boolean(d.ehliyet) || Boolean(d.stajyer))], 1029),
  },
  {
    id: 'aay-p3-11', zorluk: 'easy', baslik: 'Puan · kesinlikle doğru', dunyalar: puan,
    ortakMetin: 'Bir sınavdan farklı puanlar alan Efe, Fırat ve Gizem’den Efe, Gizem’den yüksek puan almamıştır. Fırat’ın puanı da en yüksek değildir.',
    kok: 'Buna göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama: 'Efe, Gizem’den yüksek puan almadığına ve puanlar farklı olduğuna göre Gizem, Efe’den yüksektir; demek ki en yüksek puan Efe’nin değildir. Fırat’ınki de en yüksek olmadığına göre en yüksek puan Gizem’indir. Efe ile Fırat’ın kendi aralarındaki sıra belirlenemez.',
    ...sik(['En yüksek puanı Gizem almıştır.', 'En düşük puanı Efe almıştır.', 'Fırat, Efe’den yüksek puan almıştır.', 'Efe ikinci sıradadır.', 'En düşük puanı Fırat almıştır.'],
      [her((d) => n(d, 'Gizem') === 3), her((d) => n(d, 'Efe') === 1), her((d) => n(d, 'Fırat') > n(d, 'Efe')), her((d) => n(d, 'Efe') === 2), her((d) => n(d, 'Fırat') === 1)], 1030),
  },
  {
    id: 'aay-p3-12', zorluk: 'easy', baslik: 'Masa · soldaki kişi', dunyalar: masa,
    ortakMetin: 'Dört kişilik yuvarlak bir masada A, B, C ve D karşılıklı oturmaktadır; her kişinin tam karşısında bir kişi vardır. C, A’nın tam karşısında oturmaktadır. B ise A’nın sağındadır.',
    kok: 'Buna göre, A’nın solunda kim oturmaktadır?',
    aciklama: 'A ile C karşılıklı olduğuna göre geriye kalan iki yer B ile D’nindir; bu yerler A’nın sağı ile soludur. B’nin A’nın sağında oturduğu verildiğine göre A’nın soluna zorunlu olarak D düşer.',
    ...sik(['D', 'B', 'C', 'Kimse', 'Belirlenemez'],
      [...(['D', 'B', 'C'] as const).map((k) => her((d) => ((n(d, 'A') + 2) % 4) + 1 === n(d, k))),
       hicbiri(() => true),
       (ds) => new Set(ds.map((d) => ['B', 'C', 'D'].find((k) => ((n(d, 'A') + 2) % 4) + 1 === n(d, k)))).size > 1], 1031),
  },
];

raporla(PARTI);
