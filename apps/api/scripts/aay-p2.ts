/**
 * Analitik Akıl Yürütme · 2. parti — 4 senaryo × 3 soru.
 *
 * 1. partinin kusuru soruların yanlışlığı değil, AKIL YÜRÜTMENİN TEKDÜZELİĞİYDİ:
 * dört senaryo da tek katmanlıydı (sıralama, gruplama, eşleştirme, koşul).
 * PAEM 9'un kendi üç kurgusuna bakınca hepsinin İKİ yapıyı üst üste bindirdiği
 * görülüyor — eşleştirme+eleme ağacı, sıralama+nitelik+dönüşüm, sıralama+küme
 * dağıtımı. Bu parti o katmanlılığı hedefler ve taksonomideki dördüncü ekseni,
 * yer-yön-konum kurgusunu, bankaya ilk kez sokar.
 *
 *   npx tsx scripts/aay-p2.ts
 */
import {
  dizilimler, her, hicbiri, karsilasti, raporla, sik, tamDeger, turnuvalar,
  type Bulmaca, type Dunya,
} from './aay-cozucu';

// ── S5 · eleme turnuvası (eşleştirme + tur ağacı) ────────────────
const TAKIM = ['Şahin', 'Kartal', 'Doğan', 'Atmaca', 'Şimşek', 'Yıldırım', 'Poyraz', 'Bora'];
const tur = (d: Dunya, a: string, b: string) =>
  d[`r1_${a}`] === b ? 1 : d[`r2_${a}`] === b ? 2 : d[`r3_${a}`] === b ? 3 : 0;
const yenildi = (d: Dunya, a: string, b: string) => {
  const t = tur(d, a, b);
  return t === 0 ? false : t === 3 ? d.sampiyon !== a : !d[`k${t}_${a}`];
};
const finalde = (d: Dunya, t: string) => String(d.final).split('|').includes(t);
const S5_METIN =
  'Sekiz ekibin katıldığı bir atış müsabakası tek maçlık eleme usulüyle, üç tur hâlinde oynanmıştır. Eşleşmeler her turda kura ile belirlenmiş, yenilen ekip müsabakadan elenmiştir. Katılan ekipler Şahin, Kartal, Doğan, Atmaca, Şimşek, Yıldırım, Poyraz ve Bora’dır. Müsabaka ile ilgili bilinenler şunlardır:\n' +
  '- İlk turda Şahin ile Kartal eşleşmiştir.\n' +
  '- Doğan, Atmaca’ya yenilerek elenmiştir.\n' +
  '- Şimşek’in ikinci maçı Yıldırım ile olmuştur.\n' +
  '- Şimşek, Yıldırım’a yenilerek elenmiştir.';
const musabaka = turnuvalar(TAKIM).filter(
  (d) => d.r1_Şahin === 'Kartal' && yenildi(d, 'Doğan', 'Atmaca') &&
    d.r2_Şimşek === 'Yıldırım' && yenildi(d, 'Şimşek', 'Yıldırım'),
);

// ── S6 · yer-yön-konum (karşılıklı odalar) ───────────────────────
const KARSI: Record<number, number> = { 1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3 };
const satir = (a: number) => Math.ceil(a / 3);
const yanyana = (a: number, b: number) => Math.abs(a - b) === 1 && satir(a) === satir(b);
const BIRIM = ['Arşiv', 'Bilişim', 'Emanet', 'Nöbetçi', 'Santral', 'Silahhane'];
const o = (d: Dunya, k: string) => d[k] as number;
const S6_METIN =
  'Bir emniyet müdürlüğü binasının koridorunda karşılıklı altı oda vardır. Koridorun bir yanında soldan sağa 1, 2 ve 3 numaralı odalar; tam karşılarında ise 4, 5 ve 6 numaralı odalar bulunmaktadır: 1 numaralı odanın karşısı 4, 2 numaralı odanın karşısı 5, 3 numaralı odanın karşısı 6 numaralı odadır. Arşiv, Bilişim, Emanet, Nöbetçi, Santral ve Silahhane birimleri bu odalara birer birer yerleştirilmiştir. Yerleşim ile ilgili bilinenler şunlardır:\n' +
  '- Arşiv’in karşısındaki odada Emanet bulunmaktadır.\n' +
  '- Santral ile Bilişim aynı sırada ve ardışık numaralı odalardadır.\n' +
  '- Silahhane’nin karşısındaki odada Santral bulunmaktadır.\n' +
  '- Nöbetçi, 4, 5 veya 6 numaralı odalardan birindedir.';
const odaTum = dizilimler(BIRIM, [1, 2, 3, 4, 5, 6]).filter(
  (d) => KARSI[o(d, 'Arşiv')] === o(d, 'Emanet') && yanyana(o(d, 'Santral'), o(d, 'Bilişim')) &&
    KARSI[o(d, 'Silahhane')] === o(d, 'Santral') && o(d, 'Nöbetçi') > 3,
);
const oda = odaTum;
const odaNobetci4 = oda.filter((d) => o(d, 'Nöbetçi') === 4);

// ── S7 · sayı dağıtımı (tablo kurgusu) ───────────────────────────
const S7_METIN =
  'Bir uygulamada görevlendirilen Alfa, Beta, Gama ve Delta ekiplerine toplam 12 telsiz dağıtılmıştır. Her ekibe en az bir telsiz verilmiştir. Dağıtım ile ilgili bilinenler şunlardır:\n' +
  '- Alfa ekibine verilen telsiz sayısı, Beta ekibine verilenden fazladır.\n' +
  '- Gama ekibine verilen telsiz sayısı, Delta ekibine verilenin iki katıdır.\n' +
  '- Beta ekibine en az iki telsiz verilmiştir.';
const telsiz: Dunya[] = [];
for (let a = 1; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let c = 1; c <= 9; c++) {
  const e = 12 - a - b - c;
  if (e >= 1 && a > b && c === e * 2) telsiz.push({ Alfa: a, Beta: b, Gama: c, Delta: e });
}

// ── S8 · sıralama + nitelik + dönüşüm ────────────────────────────
const SUBE = ['Asayiş', 'Trafik', 'Kaçakçılık', 'Siber', 'Terörle', 'Narkotik'];
const SALON = ['Asayiş', 'Trafik', 'Narkotik'];
const s = (d: Dunya, k: string) => d[k] as number;
const S8_METIN =
  'Bir koordinasyon toplantısında Asayiş, Trafik, Kaçakçılık, Siber, Terörle ve Narkotik şubeleri birer brifing vermiştir. Brifingler birinci sıradan altıncı sıraya kadar arka arkaya yapılmış, her şube yalnız bir brifing vermiştir. Brifingler ya toplantı salonunda ya da çevrim içi verilmiştir. Bilinenler şunlardır:\n' +
  '- İlk üç brifing salonda verilmiştir ve bunlar Asayiş, Trafik ve Narkotik şubelerinin brifingleridir.\n' +
  '- Siber’in brifingi çevrim içi verilmiş; Trafik’in brifinginden hemen sonra, Kaçakçılık’ın brifinginden hemen önce yapılmıştır.\n' +
  '- Terörle ile Kaçakçılık’ın brifingleri ardışık sıralarda yapılmıştır.\n' +
  '- Çevrim içi verilen brifing sayısı toplam ikidir.';
const brifing: Dunya[] = [];
for (const d of dizilimler(SUBE, [1, 2, 3, 4, 5, 6])) {
  if (!SALON.every((k) => s(d, k) <= 3)) continue;
  if (s(d, 'Siber') !== s(d, 'Trafik') + 1) continue;
  if (s(d, 'Kaçakçılık') !== s(d, 'Siber') + 1) continue;
  if (Math.abs(s(d, 'Terörle') - s(d, 'Kaçakçılık')) !== 1) continue;
  for (const x of SUBE.filter((k) => !SALON.includes(k) && k !== 'Siber')) brifing.push({ ...d, c2: x });
}
/** Çevrim içi brifingler başa alınır; diğerleri kendi sırasını korur. */
const brifingKacakcilik = brifing.filter((d) => d.c2 === 'Kaçakçılık');
const yeniSira = (d: Dunya, k: string): number => {
  const c = ['Siber', d.c2 as string].sort((x, y) => s(d, x) - s(d, y));
  if (c.includes(k)) return c.indexOf(k) + 1;
  return 3 + SUBE.filter((x) => !c.includes(x)).sort((x, y) => s(d, x) - s(d, y)).indexOf(k);
};

export const PARTI: (Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' })[] = [
  {
    id: 'aay-p2-01', zorluk: 'hard',
    aciklama: 'Şahin ile Kartal ilk turda birbiriyle, Doğan ile Atmaca da birbiriyle eşleşmiştir. Şimşek ikinci maçını Yıldırım ile oynadığına göre ikisi de ilk turu geçmiştir; demek ki Şimşek ile Yıldırım ilk turda birbiriyle eşleşmemiş, ayrı maçlarda başka ekipleri elemişlerdir. Geriye ilk tur rakibi olarak yalnız Poyraz ile Bora kalır ve bunlar Şimşek ile Yıldırım arasında iki türlü paylaşılabilir. Dolayısıyla Poyraz ilk turda ya Yıldırım ya Şimşek ile karşılaşmıştır.',
    baslik: 'Turnuva · Poyraz’ın olası ilk tur rakibi', ortakMetin: S5_METIN, dunyalar: musabaka,
    kok: 'Yukarıdaki bilgilere göre, Poyraz’ın ilk turda karşılaşmış olabileceği ekipler aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(['Yıldırım veya Şimşek', 'Yıldırım veya Bora', 'Şimşek veya Atmaca', 'Yıldırım, Şimşek veya Bora', 'Yalnız Şimşek'],
      [['Yıldırım', 'Şimşek'], ['Yıldırım', 'Bora'], ['Şimşek', 'Atmaca'], ['Yıldırım', 'Şimşek', 'Bora'], ['Şimşek']].map((t) => tamDeger('r1_Poyraz', t)), 1200),
  },
  {
    id: 'aay-p2-02', zorluk: 'hard',
    aciklama: 'Atmaca ilk turda Doğan ile eşleşmiştir; ikinci turda karşısına Şahin–Kartal eşleşmesinin galibi çıkar, finalde ise Yıldırım vardır. Şimşek ise ilk turda Poyraz ya da Bora ile, ikinci turda Yıldırım ile oynamış ve elenmiştir. Dolayısıyla Atmaca ile Şimşek’in yolu hiçbir turda kesişmez. Öteki dört ikili en az bir kurada karşılaşabilir.',
    baslik: 'Turnuva · karşılaşamayacak ikili', ortakMetin: S5_METIN, dunyalar: musabaka,
    kok: 'Yukarıdaki bilgilere göre, aşağıdaki ekiplerden hangi ikisi müsabakanın herhangi bir turunda karşılaşmış olamaz?',
    ...sik(['Atmaca ve Şimşek', 'Yıldırım ve Kartal', 'Atmaca ve Kartal', 'Yıldırım ve Şahin', 'Poyraz ve Yıldırım'],
      ([['Atmaca', 'Şimşek'], ['Yıldırım', 'Kartal'], ['Atmaca', 'Kartal'], ['Yıldırım', 'Şahin'], ['Poyraz', 'Yıldırım']] as const)
        .map(([a, b]) => hicbiri((d) => karsilasti(d, a, b))), 1201),
  },
  {
    id: 'aay-p2-03', zorluk: 'hard',
    aciklama: 'Poyraz ile Bora’nın ilk tur rakipleri zorunlu olarak Şimşek ile Yıldırım’dır; Şimşek de Yıldırım da ikinci tura çıktığına göre Poyraz ve Bora ilk turda elenmiştir. Şimşek ikinci turda Yıldırım’a yenilmiş, Doğan ise ilk turda Atmaca’ya yenilmiştir. Geriye şampiyon olabilecek ekip olarak Şahin, Kartal, Atmaca ve Yıldırım kalır ve dördü de gerçekten şampiyon olabilir.',
    baslik: 'Turnuva · şampiyon olabilecekler', ortakMetin: S5_METIN, dunyalar: musabaka,
    kok: 'Yukarıdaki bilgilere göre, müsabakanın şampiyonu olabilecek ekipler aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(['Şahin, Kartal, Atmaca, Yıldırım', 'Şahin, Kartal, Atmaca, Poyraz', 'Şahin, Kartal, Yıldırım, Bora', 'Kartal, Atmaca, Yıldırım, Poyraz', 'Şahin, Atmaca, Yıldırım, Bora'],
      [['Şahin', 'Kartal', 'Atmaca', 'Yıldırım'], ['Şahin', 'Kartal', 'Atmaca', 'Poyraz'], ['Şahin', 'Kartal', 'Yıldırım', 'Bora'], ['Kartal', 'Atmaca', 'Yıldırım', 'Poyraz'], ['Şahin', 'Atmaca', 'Yıldırım', 'Bora']]
        .map((t) => tamDeger('sampiyon', t)), 1202),
  },
  {
    id: 'aay-p2-04', zorluk: 'medium',
    aciklama: 'Silahhane, Santral’in karşısında olduğuna göre ikisi ayrı sıralardadır. Nöbetçi de 4, 5 veya 6 numaralı odalarda, yani Silahhane ile aynı sırada bulunur — çünkü Santral’in sırasında Bilişim’e de yer açılması gerekir: Santral ile Bilişim yan yana olduğu için aynı sıradadır ve Arşiv ile Emanet karşılıklı olduğundan biri o sırada, biri karşısındadır. Böylece Nöbetçi ile Silahhane her yerleşimde aynı sıraya düşer. Öteki şıklar bazı yerleşimlerde doğru, bazılarında yanlıştır.',
    baslik: 'Oda · kesinlikle doğru', ortakMetin: S6_METIN, dunyalar: oda,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(['Nöbetçi ile Silahhane aynı sıradaki odalardadır.', 'Arşiv 1 numaralı odadadır.', 'Santral 2 numaralı odadadır.', 'Arşiv ile Santral aynı sıradaki odalardadır.', 'Emanet 6 numaralı odadadır.'],
      [her((d) => satir(o(d, 'Nöbetçi')) === satir(o(d, 'Silahhane'))), her((d) => o(d, 'Arşiv') === 1), her((d) => o(d, 'Santral') === 2), her((d) => satir(o(d, 'Arşiv')) === satir(o(d, 'Santral'))), her((d) => o(d, 'Emanet') === 6)], 1203),
  },
  {
    id: 'aay-p2-05', zorluk: 'hard',
    aciklama: 'Nöbetçi 4 numaralı odadaysa karşısındaki 1 numaralı odada Bilişim bulunur; çünkü Bilişim’in karşısında her yerleşimde Nöbetçi vardır. Santral, Bilişim ile yan yana olacağından 2 numaralı odaya düşer ve karşısındaki 5 numaralı odaya Silahhane geçer. Geriye kalan 3 ve 6 numaralı odalar karşılıklı olduğu için Arşiv ile Emanet’e kalır, ama hangisinin hangi odada olduğu belirlenemez.',
    baslik: 'Oda · Nöbetçi 4 numaralı odada ise', ortakMetin: S6_METIN, dunyalar: odaNobetci4,
    kok: 'Yukarıdaki bilgilere göre, Nöbetçi 4 numaralı odada ise aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(['Santral 2 numaralı odadadır.', 'Arşiv 3 numaralı odadadır.', 'Emanet 6 numaralı odadadır.', 'Silahhane 6 numaralı odadadır.', 'Bilişim 2 numaralı odadadır.'],
      [her((d) => o(d, 'Santral') === 2), her((d) => o(d, 'Arşiv') === 3), her((d) => o(d, 'Emanet') === 6), her((d) => o(d, 'Silahhane') === 6), her((d) => o(d, 'Bilişim') === 2)], 1204),
  },
  {
    id: 'aay-p2-06', zorluk: 'hard',
    aciklama: 'Santral koridorun hangi sırasında olursa olsun, Silahhane karşısındaki sıraya düşer. Bilişim de Santral ile ardışık olduğundan onunla aynı sıradadır. Arşiv ile Emanet karşılıklı olduğuna göre biri Santral’in sırasında, öteki karşısındadır; böylece Santral’in sırası Santral, Bilişim ve Arşiv–Emanet’ten biriyle dolar. Nöbetçi’ye yalnız karşı sıra kalır, yani Nöbetçi ile Santral hiçbir yerleşimde aynı sırada bulunamaz. Öteki dört ifade en az bir yerleşimde gerçekleşir.',
    baslik: 'Oda · kesinlikle yanlış', ortakMetin: S6_METIN, dunyalar: oda,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(['Nöbetçi ile Santral aynı sıradaki odalardadır.', 'Arşiv 1 numaralı odadadır.', 'Santral 3 numaralı odadadır.', 'Bilişim 3 numaralı odadadır.', 'Nöbetçi 6 numaralı odadadır.'],
      [hicbiri((d) => satir(o(d, 'Nöbetçi')) === satir(o(d, 'Santral'))), hicbiri((d) => o(d, 'Arşiv') === 1), hicbiri((d) => o(d, 'Santral') === 3), hicbiri((d) => o(d, 'Bilişim') === 3), hicbiri((d) => o(d, 'Nöbetçi') === 6)], 1205),
  },
  {
    id: 'aay-p2-07', zorluk: 'medium',
    aciklama: 'Gama’ya verilen sayı Delta’nın iki katı olduğundan Delta 1 ise Gama 2, Delta 2 ise Gama 4, Delta 3 ise Gama 6 olur. Delta 3 olsaydı Gama ile birlikte 9 telsiz gider, Alfa ile Beta’ya 3 kalırdı; Beta en az 2 ve Alfa ondan fazla olacağı için bu mümkün değildir. Geriye Delta için 1 ve 2 kalır; ikisi de gerçekleşir.',
    baslik: 'Telsiz · Delta’nın olası sayıları', ortakMetin: S7_METIN, dunyalar: telsiz,
    kok: 'Yukarıdaki bilgilere göre, Delta ekibine verilebilecek telsiz sayıları aşağıdakilerin hangisinde tam olarak verilmiştir?',
    ...sik(['1 veya 2', 'Yalnız 1', '1, 2 veya 3', '2 veya 3', 'Yalnız 2'],
      [[1, 2], [1], [1, 2, 3], [2, 3], [2]].map((k) => tamDeger('Delta', k)), 1206),
  },
  {
    id: 'aay-p2-08', zorluk: 'hard',
    aciklama: 'Beta en az 2 olduğuna ve Alfa ondan fazla olduğuna göre Alfa en az 3’tür. Alfa 3 olsaydı Beta 2 olur, Gama ile Delta’ya 7 telsiz kalırdı; Gama Delta’nın iki katı olduğundan ikisinin toplamı Delta’nın üç katıdır ve 7 üçe bölünmez. Aynı gerekçeyle Alfa 4 olduğunda toplam 6 kalır ve Delta 2, Gama 4 olur — bu mümkündür. Dolayısıyla Alfa’ya her dağıtımda en az 4 telsiz düşer. Öteki dört ifade en az bir dağıtımda yanlışlanır.',
    baslik: 'Telsiz · Alfa’nın alt sınırı', ortakMetin: S7_METIN, dunyalar: telsiz,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(['Alfa ekibine en az 4 telsiz verilmiştir.', 'Beta ekibine en az 3 telsiz verilmiştir.', 'Gama ekibine en az 3 telsiz verilmiştir.', 'Delta ekibine 1 telsiz verilmiştir.', 'Alfa ile Gama ekiplerine eşit sayıda telsiz verilmiştir.'],
      [her((d) => (d.Alfa as number) >= 4), her((d) => (d.Beta as number) >= 3), her((d) => (d.Gama as number) >= 3), her((d) => d.Delta === 1), her((d) => d.Alfa === d.Gama)], 1207),
  },
  {
    id: 'aay-p2-09', zorluk: 'hard',
    aciklama: 'Alfa 8 olsaydı geriye 4 telsiz kalırdı. Gama, Delta’nın iki katı olduğuna göre bu ikisi birlikte Delta’nın üç katı kadar telsiz alır; Delta 1 ise üçü, Delta 2 ise altısı gider. Delta 2 olursa 4 telsize sığmaz; Delta 1 olursa Beta’ya yalnız 1 telsiz kalır, oysa Beta en az 2 almak zorundadır. Bu yüzden Alfa 8 olamaz. Alfa için mümkün değerler 4, 5, 6 ve 7’dir.',
    baslik: 'Telsiz · kesinlikle yanlış', ortakMetin: S7_METIN, dunyalar: telsiz,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    ...sik(['Alfa ekibine 8 telsiz verilmiştir.', 'Alfa ekibine 4 telsiz verilmiştir.', 'Alfa ekibine 5 telsiz verilmiştir.', 'Alfa ekibine 6 telsiz verilmiştir.', 'Alfa ekibine 7 telsiz verilmiştir.'],
      ([8, 4, 5, 6, 7] as const).map((v) => hicbiri((d) => d.Alfa === v)), 1208),
  },
  {
    id: 'aay-p2-10', zorluk: 'medium',
    aciklama: 'Siber’in brifingi çevrim içi olduğuna göre ilk üç sırada olamaz; Trafik’ten hemen sonra geldiği için Trafik en geç üçüncü, Siber de dördüncü sıradadır. Trafik ilk üç brifingden biri olduğundan ve Siber dördüncü sıraya oturduğundan Trafik zorunlu olarak üçüncüdür. Ardından Kaçakçılık beşinci, Terörle ise ona bitişik tek boş sıra olan altıncı olur. Asayiş ile Narkotik ilk iki sırayı iki türlü paylaşabildiğinden onlara ilişkin hiçbir şık kesinleşmez.',
    baslik: 'Brifing · kesinlikle doğru', ortakMetin: S8_METIN, dunyalar: brifing,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle doğrudur?',
    ...sik(['Terörle şubesi altıncı sırada brifing vermiştir.', 'Asayiş şubesi birinci sırada brifing vermiştir.', 'Narkotik şubesi ikinci sırada brifing vermiştir.', 'Kaçakçılık’ın brifingi çevrim içi verilmiştir.', 'Terörle’nin brifingi çevrim içi verilmiştir.'],
      [her((d) => s(d, 'Terörle') === 6), her((d) => s(d, 'Asayiş') === 1), her((d) => s(d, 'Narkotik') === 2), her((d) => d.c2 === 'Kaçakçılık'), her((d) => d.c2 === 'Terörle')], 1209),
  },
  {
    id: 'aay-p2-11', zorluk: 'hard',
    aciklama: 'Trafik üçüncü, Siber dördüncü, Kaçakçılık beşinci ve Terörle altıncı sıradadır. Kaçakçılık’ın brifingi de çevrim içiyse başa alınacak iki brifing Siber ile Kaçakçılık olur; ikisi arasında Siber daha erken olduğu için yeni listede Siber birinci, Kaçakçılık ikinci sıraya geçer. Geriye kalan Asayiş, Narkotik, Trafik ve Terörle kendi aralarındaki sırayı koruyarak üçüncü sıradan itibaren dizilir; Terörle hepsinden sonra geldiği için altıncı sırada kalır.',
    baslik: 'Brifing · Kaçakçılık çevrim içiyse dönüşüm', ortakMetin: S8_METIN, dunyalar: brifingKacakcilik,
    kok: 'Yukarıdaki bilgilere göre, Kaçakçılık’ın brifingi de çevrim içi verilmişse, çevrim içi brifingler listenin başına alınıp diğer şubeler kendi aralarındaki sırayı koruduğunda Terörle kaçıncı sırada olur?',
    ...sik(['Altıncı', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci'],
      [6, 2, 3, 4, 5].map((v) => her((d) => yeniSira(d, 'Terörle') === v)), 1210),
  },
  {
    id: 'aay-p2-12', zorluk: 'hard',
    aciklama: 'Çevrim içi brifingler Siber ile Kaçakçılık ya da Siber ile Terörle’dir; ikisinde de Siber daha erken olduğu için yeni listenin başına Siber, ardından öteki çevrim içi şube geçer. Geriye kalan dört şube kendi sırasını koruyarak üçüncü sıradan itibaren dizilir. Kaçakçılık çıkarsa kalanlar Asayiş/Narkotik, Trafik ve Terörle; Terörle çıkarsa Asayiş/Narkotik, Trafik ve Kaçakçılık olur. Her iki durumda da Trafik beşinci sıraya oturur. Asayiş ile Narkotik üçüncü ve dördüncü sırayı iki türlü paylaşır, Kaçakçılık ile Terörle ise ikinci ya da altıncı sıraya düşebilir.',
    baslik: 'Brifing · dönüşüm sonrası kesin bilinen', ortakMetin: S8_METIN, dunyalar: brifing,
    kok: 'Yukarıdaki bilgilere göre, çevrim içi verilen brifingler listenin başına alınır ve diğer şubeler kendi aralarındaki sırayı korursa, yeni listede aşağıdaki şubelerden hangisinin sırası kesin olarak bilinir?',
    ...sik(['Trafik', 'Asayiş', 'Narkotik', 'Kaçakçılık', 'Terörle'],
      ['Trafik', 'Asayiş', 'Narkotik', 'Kaçakçılık', 'Terörle'].map((k) =>
        (ds: Dunya[]) => ds.length > 0 && new Set(ds.map((d) => yeniSira(d, k))).size === 1), 1211),
  },
];

raporla(PARTI);
