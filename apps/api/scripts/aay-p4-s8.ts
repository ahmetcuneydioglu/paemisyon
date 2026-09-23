/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 8 — apartman (kat sırası × hane büyüklüğü).
 *
 * Aile: PAEM 9/88-90 (poliklinik) — beş öğeli bir SIRA ve her öğeye bir
 * SAYI. İskelet bilerek farklı hem oradan hem 6. senaryodan (kargo): sayılar
 * bir çok küme sayımıyla ("tek sıfırlı durak") değil, KONUMLA kilitleniyor —
 * alt iki katın toplamı yedi (ancak 4 + 3), üst kat tek kişilik ve başka tek
 * kişilik hane yok, dolayısıyla üçüncü–dördüncü kat 3 + 2. Aileler bu kat
 * sayılarına bir BİTİŞİKLİK (Bulut, Aksoy’un hemen üstünde), bir FARK (Çetin
 * = Duman + 2) ve bir KARŞILAŞTIRMA (Ekinci, Aksoy’dan kalabalık) öncülüyle
 * bağlanıyor. Anahtar çıkarım olmayana ergi: Bulut beşinci katta olsaydı
 * Duman iki, Çetin dört kişilik olur, Aksoy dördüncü katta üç kişiyle kalır
 * ve Ekinci’ye dört kişilik yer kalmazdı; bu yüzden beşinci katta Duman
 * oturur. Açık kalan: Aksoy–Bulut ikilisinin 2-3. ya da 3-4. katta olması;
 * 3-4. kattaysa birinci–ikinci katın Çetin/Ekinci sırası ile üçüncü–dördüncü
 * katın 3/2 paylaşımı — 1 + 2 × 2 = 5 çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "toplam on üç kişi", "iki hanede toplam yedi kişi",
 *     "iki fazladır", "daha fazla kişi"; "en az / en çok" hiç yok (üst kat
 *     kuralı "diğer dört haneden hiçbiri tek kişilik değildir" diye yazıldı)
 *   - katların yönü metinde açık: birinci kat en alttaki, beşinci en üstteki
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *   - yeterlilik sorusunun (p4-24) dört çeldiricisi bilginin HİÇBİR değerinde
 *     çözümü tekleştirmez (PAEM 10/83 gibi): "bazı değerlerde yeter" okuması
 *     da yalnız doğru şıkkı verir; p4-23’te iki çeldirici olası ama kesin değil
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s8
 */
import { bazi, dizilimler, her, romenSik, sik, yeterli, type Bulmaca, type Dunya } from './aay-cozucu';

const AILE = ['Aksoy', 'Bulut', 'Çetin', 'Duman', 'Ekinci'];
const KAT = [1, 2, 3, 4, 5];

const METIN =
  'Beş katlı bir apartmanın her katında yalnızca bir hane oturmaktadır. Bu haneler Aksoy, Bulut, Çetin, Duman ve Ekinci aileleridir ve her aile katlardan yalnızca birinde oturmaktadır. Katlar aşağıdan yukarıya doğru numaralanmıştır: birinci kat en alttaki, beşinci kat en üstteki kattır. Her hanede bir, iki, üç ya da dört kişi yaşamaktadır. Apartmanla ilgili bilinenler şunlardır:\n' +
  '- Apartmanda toplam on üç kişi yaşamaktadır.\n' +
  '- Birinci ve ikinci katlarda oturan iki hanede toplam yedi kişi yaşamaktadır.\n' +
  '- Beşinci katta oturan hane tek kişiliktir; diğer dört haneden hiçbiri tek kişilik değildir.\n' +
  '- Bulut ailesi, Aksoy ailesinin hemen üst katında oturmaktadır.\n' +
  '- Çetin ailesinin hanesindeki kişi sayısı, Duman ailesinin hanesindeki kişi sayısından iki fazladır.\n' +
  '- Ekinci ailesinin hanesinde, Aksoy ailesinin hanesinden daha fazla kişi yaşamaktadır.';

/** i. katta oturan ailenin hanesindeki kişi sayısı. */
const kattakiSayi = (d: Dunya, i: number) => d[`${AILE.find((a) => d[`${a}_kat`] === i)}_kisi`] as number;

// Metnin kurduğu uzay: beş ailenin her kat yerleşimi (5!) × her haneye 1–4 kişi (4^5), sonra öncüller.
const apartman: Dunya[] = [];
for (const kat of dizilimler(AILE, KAT)) {
  for (let m = 0; m < 4 ** 5; m++) {
    const d: Dunya = {};
    AILE.forEach((a, i) => {
      d[`${a}_kat`] = kat[a];
      d[`${a}_kisi`] = (Math.floor(m / 4 ** i) % 4) + 1;
    });
    const kisi = (a: string) => d[`${a}_kisi`] as number;
    const yer = (a: string) => d[`${a}_kat`] as number;
    if (AILE.reduce((t, a) => t + kisi(a), 0) !== 13) continue;
    if (kattakiSayi(d, 1) + kattakiSayi(d, 2) !== 7) continue;
    if (kattakiSayi(d, 5) !== 1 || AILE.some((a) => yer(a) !== 5 && kisi(a) === 1)) continue;
    if (yer('Bulut') !== yer('Aksoy') + 1) continue;
    if (kisi('Çetin') !== kisi('Duman') + 2) continue;
    if (!(kisi('Ekinci') > kisi('Aksoy'))) continue;
    apartman.push(d);
  }
}
const apartmanBulut3 = apartman.filter((d) => d.Bulut_kisi === 3);

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-22', zorluk: 'hard', baslik: 'Apartman · üçüncü katta oturuyor olabilecekler', ortakMetin: METIN, dunyalar: apartman,
    kok: 'Yukarıdaki bilgilere göre,\nI. Aksoy\nII. Bulut\nIII. Çetin\nailelerinden hangileri üçüncü katta oturuyor olabilir?',
    aciklama:
      'Alt iki kattaki yedi kişi ancak 4 ile 3 olabilir; üçüncü–dördüncü kata kalan 13 − 7 − 1 = 5 kişi de tek kişilik hane olmadığı için 3 ile 2’dir. Beşinci kattaki tek kişilik hane Aksoy (üstünde Bulut var), Çetin ya da Ekinci (ikisi de bir haneden kalabalık) olamaz. Bulut olsaydı Duman iki, Çetin dört kişilik olurdu; 2’yi Duman aldığı için dördüncü kattaki Aksoy üç kişilik kalır, tek 4’ü de Çetin aldığından Ekinci ondan kalabalık olamazdı. Beşinci kat Duman’ındır. Aksoy–Bulut ikilisi 1-2. katta da olamaz: Aksoy üç ya da dört kişilik olur, Ekinci’ye daha kalabalık yer kalmaz. İkili 3-4. kattaysa üçüncü katta Aksoy oturur (I), örneğin alttan üste Çetin (3 kişi), Ekinci (4), Aksoy (3), Bulut (2), Duman (1). 2-3. kattaysa üçüncü katta Bulut oturur (II): Ekinci (4), Aksoy (3), Bulut (2), Çetin (3), Duman (1). Üçüncü kat hep ikiliden birinindir, Çetin’in olamaz (III). Doğru cevap I ve II’dir.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Aksoy_kat === 3), bazi((d) => d.Bulut_kat === 3), bazi((d) => d.Çetin_kat === 3)],
      [[1, 2], [1], [2], [3], [1, 3]],
    ),
  },
  {
    id: 'aay-p4-23', zorluk: 'medium', baslik: 'Apartman · Bulut üç kişilikse', ortakMetin: METIN, dunyalar: apartmanBulut3,
    kok: 'Yukarıdaki bilgilere göre, Bulut ailesinin hanesinde üç kişi yaşıyorsa aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Alt iki katta 4 ile 3, üçüncü ve dördüncü katta 3 ile 2, beşinci katta 1 kişi vardır. Bulut, Aksoy’un üstünde olduğundan birinci katta olamaz; ikinci katta olsaydı hemen altındaki Aksoy dört kişilik olur, Ekinci ondan kalabalık olamazdı. Üçüncü katta olsaydı Aksoy ikinci katta üç, Ekinci birinci katta dört kişiyle oturur; dördüncü ve beşinci kat Çetin ile Duman’a kalırdı, ama bu katlardaki 2 ile 1 arasında iki fark yoktur. Bulut beşinci katta da olamaz, orası tek kişiliktir. Bu yüzden Bulut dördüncü kattadır; üçüncü kattaki Aksoy’un hanesi kesinlikle iki kişiliktir. Çetin, Duman’dan; Ekinci, Aksoy’dan kalabalık olduğundan beşinci katta Duman oturur, alt iki katı da üç kişilik Çetin ile dört kişilik Ekinci paylaşır. Bu ikisi katları iki sırayla da paylaşabildiği için Ekinci’nin de Çetin’in de birinci katta olduğu kesin değildir. Çetin dört kişilik değildir, Bulut ikinci katta oturamaz.',
    ...sik(
      [
        'Aksoy ailesinin hanesinde iki kişi yaşamaktadır.',
        'Ekinci ailesi birinci katta oturmaktadır.',
        'Çetin ailesinin hanesinde dört kişi yaşamaktadır.',
        'Çetin ailesi birinci katta oturmaktadır.',
        'Bulut ailesi ikinci katta oturmaktadır.',
      ],
      [
        her((d) => d.Aksoy_kisi === 2),
        her((d) => d.Ekinci_kat === 1),
        her((d) => d.Çetin_kisi === 4),
        her((d) => d.Çetin_kat === 1),
        her((d) => d.Bulut_kat === 2),
      ],
      4082,
    ),
  },
  {
    id: 'aay-p4-24', zorluk: 'hard', baslik: 'Apartman · tam belirlemek için yeterli bilgi', ortakMetin: METIN, dunyalar: apartman,
    kok: 'Tüm ailelerin oturduğu katın ve hanelerinde yaşayan kişi sayısının tam olarak belirlenebilmesi için aşağıdakilerden hangisinin bilinmesi yeterlidir?',
    aciklama:
      'Alt iki katta 4 ile 3, 3-4. katta 3 ile 2, beşinci katta 1 kişi vardır. Beşinci katta Duman oturur (Bulut orada olsaydı Ekinci Aksoy’dan kalabalık olamazdı), bu yüzden Çetin üç kişiliktir. Ekinci üç kişilik olsaydı Aksoy iki, Bulut dört kişilik olur; dört kişilik Bulut ikinci, hemen altındaki Aksoy birinci katta olurdu; orada iki kişilik hane yoktur. Demek ki Ekinci dört kişiliktir ve alt iki kattan birinde oturur; Aksoy–Bulut 1-2. katta olamaz. Aşağıdan yukarıya üç sıra kalır: (a) Ekinci, Aksoy, Bulut, Çetin, Duman; (b) Çetin, Ekinci, Aksoy, Bulut, Duman; (c) Ekinci, Çetin, Aksoy, Bulut, Duman. (a)’da Aksoy 3, Bulut 2’dir; (b) ve (c)’de 3 ile 2 iki biçimde paylaşılır. Çetin’in katı sırayı, Aksoy’un sayısı paylaşımı belirler. Duman’ın katı, Çetin’in ve Ekinci’nin sayısı bellidir; Bulut’un sayısı yalnız paylaşımı verir; Ekinci’nin katı da (a) ile (c)’yi ayırmaz.',
    ...sik(
      [
        'Çetin ailesinin oturduğu kat ile Aksoy ailesinin hanesindeki kişi sayısı',
        'Ekinci ailesinin oturduğu kat ile Çetin ailesinin hanesindeki kişi sayısı',
        'Aksoy ailesinin hanesindeki kişi sayısı ile Bulut ailesinin hanesindeki kişi sayısı',
        'Duman ailesinin oturduğu kat ile Bulut ailesinin hanesindeki kişi sayısı',
        'Çetin ailesinin hanesindeki kişi sayısı ile Ekinci ailesinin hanesindeki kişi sayısı',
      ],
      [
        yeterli((d) => `${d.Çetin_kat}|${d.Aksoy_kisi}`),
        yeterli((d) => `${d.Ekinci_kat}|${d.Çetin_kisi}`),
        yeterli((d) => `${d.Aksoy_kisi}|${d.Bulut_kisi}`),
        yeterli((d) => `${d.Duman_kat}|${d.Bulut_kisi}`),
        yeterli((d) => `${d.Çetin_kisi}|${d.Ekinci_kisi}`),
      ],
      4083,
    ),
  },
];
