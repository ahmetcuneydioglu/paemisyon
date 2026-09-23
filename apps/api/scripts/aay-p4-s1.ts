/**
 * Analitik Akıl Yürütme · 4. parti · senaryo 1 — kurs kaydı (kurs × grup).
 *
 * ÖRNEK MODÜL: 4-5. partinin öteki senaryoları bu dosyanın biçimini izler.
 *
 * Aile: PAEM 10/81-83 (lunapark) — her kişinin İKİ niteliği var (kurs ve
 * grup) ve sayım öncülleri tabloyu daraltıyor. İskelet bilerek farklı:
 *   - kontenjanlar EŞİTSİZ (Resim üç, Seramik iki, Fotoğraf bir kişi);
 *   - iki niteliği bağlayan bir KAPSAMA kuralı var ("her kursa kaydolanlar
 *     arasında hafta içi grubunu seçen en az bir kişi vardır"); üç kişilik
 *     hafta içi grubuyla birleşince her kursta TAM BİR hafta içi kişisi
 *     olduğu çıkar (Resim 1+2, Seramik 1+1, Fotoğraf 1+0);
 *   - "aynı kurs, farklı grup" çifti ve "sabit kişi iki kişilik kursun
 *     yerini tutar" hamlesi yok. Ana çıkarım şu: aynı grubu seçen üç kişi
 *     bir grubu tek başına doldurur; bu grup hafta sonu olsaydı ikisi Resim’de
 *     olmalıydı, oysa ikisi Resim’e kaydolmamıştır — demek ki üçü hafta içinde
 *     ve her biri ayrı kurstadır.
 * Açık kalan iki nokta: Ayla ile Erkan’dan hangisinin Seramik’te olduğu (2)
 * ve Seramik’teki hafta sonu yerinin Cansu, Demet, Funda’dan kime düştüğü
 * (3) — 2 × 3 = 6 çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "Resim kursuna üç, Seramik kursuna iki …",
 *     "üçü hafta içi grubunu, üçü hafta sonu grubunu", "en az bir kişi"
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *   - Roma rakamlı "olabilir" sorusunda doğru kümenin üyeleri aynı çözümde
 *     BİRLİKTE de gerçekleşir ("birlikte olabilir mi" okuması da aynı cevabı
 *     verir); dışarıda kalan öncül verilmiş bir öncülden değil çıkarımdan düşer
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p4-s1
 */
import { bazi, her, romenSik, sik, yeterli, type Bulmaca, type Dunya } from './aay-cozucu';

const KISI = ['Ayla', 'Bora', 'Cansu', 'Demet', 'Erkan', 'Funda'];
const KURS = ['Resim', 'Seramik', 'Fotoğraf'];
const GRUP = ['hafta içi', 'hafta sonu'];

const METIN =
  'Bir kültür merkezinin açtığı Resim, Seramik ve Fotoğraf kurslarına Ayla, Bora, Cansu, Demet, Erkan ve Funda adlı altı kişi kaydolmuştur. Her kişi bu üç kurstan yalnızca birine kaydolmuş, ayrıca hafta içi ve hafta sonu olmak üzere iki gruptan yalnızca birini seçmiştir. Kayıtlarla ilgili bilinenler şunlardır:\n' +
  '- Resim kursuna üç, Seramik kursuna iki, Fotoğraf kursuna bir kişi kaydolmuştur.\n' +
  '- Kişilerden üçü hafta içi grubunu, üçü hafta sonu grubunu seçmiştir.\n' +
  '- Her kursa kaydolanlar arasında hafta içi grubunu seçen en az bir kişi vardır.\n' +
  '- Ayla, Bora ve Erkan aynı grubu seçmiştir.\n' +
  '- Ayla da Erkan da Resim kursuna kaydolmamıştır.';

// Metnin kurduğu uzay: her kişiye bir kurs ve bir grup (3^6 × 2^6), sonra öncüller.
const kayit: Dunya[] = [];
for (let m = 0; m < 3 ** 6; m++) {
  for (let g = 0; g < 2 ** 6; g++) {
    const d: Dunya = {};
    KISI.forEach((k, i) => {
      d[`${k}_kurs`] = KURS[Math.floor(m / 3 ** i) % 3];
      d[`${k}_grup`] = GRUP[(g >> i) & 1];
    });
    const kursSay = (c: string) => KISI.filter((k) => d[`${k}_kurs`] === c).length;
    if (kursSay('Resim') !== 3 || kursSay('Seramik') !== 2 || kursSay('Fotoğraf') !== 1) continue;
    const icSay = KISI.filter((k) => d[`${k}_grup`] === 'hafta içi').length;
    if (icSay !== 3 || KISI.length - icSay !== 3) continue;
    if (!KURS.every((c) => KISI.some((k) => d[`${k}_kurs`] === c && d[`${k}_grup`] === 'hafta içi'))) continue;
    if (d.Ayla_grup !== d.Bora_grup || d.Bora_grup !== d.Erkan_grup) continue;
    if (d.Ayla_kurs === 'Resim' || d.Erkan_kurs === 'Resim') continue;
    kayit.push(d);
  }
}
const kayitCansuDemet = kayit.filter((d) => d.Cansu_kurs === d.Demet_kurs);

/** Soru 03 yalnız kursları sorar; gruplar zaten her çözümde aynıdır. */
const kurslar = (d: Dunya) => KISI.map((k) => d[`${k}_kurs`]).join('|');
const kursundakiler = (d: Dunya, c: string) => KISI.filter((k) => d[`${k}_kurs`] === c).join(',');

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p4-01', zorluk: 'medium', baslik: 'Kurs · Seramik’e kaydolmuş olabilecekler', ortakMetin: METIN, dunyalar: kayit,
    kok: 'Yukarıdaki bilgilere göre,\nI. Ayla\nII. Bora\nIII. Cansu\nadlı kişilerden hangileri Seramik kursuna kaydolmuş olabilir?',
    aciklama:
      'Hafta içi grubunda üç kişi vardır ve her kursta bu gruptan en az bir kişi bulunur; üç kişi üç kursa ancak birer birer dağılabilir. Buna göre Fotoğraf’taki tek kişi hafta içindedir, Resim’de bir hafta içi ile iki hafta sonu, Seramik’te bir hafta içi ile bir hafta sonu kişisi vardır. Ayla, Bora ve Erkan aynı grubu seçtiği için üç kişilik bir grubu tek başlarına doldururlar. Bu grup hafta sonu olsaydı ikisinin Resim’de olması gerekirdi; oysa Ayla da Erkan da Resim’e kaydolmamıştır. Demek ki üçü hafta içindedir ve ayrı kurslardadır: Bora Resim’dedir, Seramik’e kaydolmuş olamaz (II). Ayla Seramik’teki hafta içi kişisi olabilir (I). Seramik’teki hafta sonu yeri Cansu, Demet ve Funda’dan birine düşer ve bu kişi Cansu olabilir (III); Ayla ile Cansu Seramik’te birlikte de bulunabilir. Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [bazi((d) => d.Ayla_kurs === 'Seramik'), bazi((d) => d.Bora_kurs === 'Seramik'), bazi((d) => d.Cansu_kurs === 'Seramik')],
      [[1, 3], [1], [1, 2], [2, 3], [1, 2, 3]],
    ),
  },
  {
    id: 'aay-p4-02', zorluk: 'medium', baslik: 'Kurs · Cansu ile Demet aynı kursta ise', ortakMetin: METIN, dunyalar: kayitCansuDemet,
    kok: 'Yukarıdaki bilgilere göre, Cansu ile Demet aynı kursa kaydolmuşsa aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'Her kursta tam bir hafta içi kişisi vardır: hafta içi grubu üç kişidir ve her kursta en az bir kişi bu gruptandır. Ayla, Bora ve Erkan aynı grubu doldurur; bu grup hafta sonu olsaydı ikisi Resim’de olmalıydı, oysa Ayla ile Erkan Resim’e kaydolmamıştır. Bu yüzden onlar hafta içinde, Cansu, Demet ve Funda hafta sonundadır. Hafta sonu kişilerinin ikisi Resim’de, biri Seramik’tedir. Cansu ile Demet aynı kursa kaydolduysa bu kurs, iki hafta sonu yeri olan Resim’dir; Seramik’teki tek hafta sonu yeri Funda’ya kalır. Ayla ile Erkan’dan hangisinin Seramik’te olduğu belirlenemez; bu yüzden Erkan’ın Fotoğraf’ta ya da Funda ile Ayla’nın aynı kursta olması kesin değildir. Demet hafta sonundadır, Fotoğraf’taki kişi de hafta içindedir; bu iki şık yanlıştır.',
    ...sik(
      [
        'Funda Seramik kursuna kaydolmuştur.',
        'Erkan Fotoğraf kursuna kaydolmuştur.',
        'Funda ile Ayla aynı kursa kaydolmuştur.',
        'Demet hafta içi grubunu seçmiştir.',
        'Fotoğraf kursuna kaydolan kişi hafta sonu grubunu seçmiştir.',
      ],
      [
        her((d) => d.Funda_kurs === 'Seramik'),
        her((d) => d.Erkan_kurs === 'Fotoğraf'),
        her((d) => d.Funda_kurs === d.Ayla_kurs),
        her((d) => d.Demet_grup === 'hafta içi'),
        her((d) => KISI.every((k) => d[`${k}_kurs`] !== 'Fotoğraf' || d[`${k}_grup`] === 'hafta sonu')),
      ],
      4012,
    ),
  },
  {
    id: 'aay-p4-03', zorluk: 'hard', baslik: 'Kurs · kursları belirlemek için yeterli bilgi', ortakMetin: METIN, dunyalar: kayit,
    kok: 'Kimin hangi kursa kaydolduğunun tam olarak belirlenebilmesi için aşağıdakilerden hangisinin bilinmesi yeterlidir?',
    aciklama:
      'Her kursta tam bir hafta içi kişisi olduğundan ve Ayla ile Erkan Resim’e kaydolmadığından Ayla, Bora ve Erkan hafta içindedir; Bora Resim’de, Ayla ile Erkan ise Seramik ile Fotoğraf’tadır. Cansu, Demet ve Funda hafta sonundadır; ikisi Resim’de, biri Seramik’tedir. Açık kalan iki nokta vardır: Ayla ile Erkan’dan hangisinin Seramik’te olduğu ve Seramik’teki hafta sonu yerinin kime düştüğü. Seramik’teki iki kişi bilinirse ikisi de yanıtlanır; geri kalanlar kendiliğinden yerleşir. Resim’deki üç kişi de Demet ile Funda’nın kursları da yalnız ikinci noktayı yanıtlar. Bora’nın kursu zaten bellidir; Erkan’ın kursu yalnız birinci noktayı yanıtlar. Hafta sonu grubunu seçenler de zaten bellidir. Bu dört bilgiyle tablo tek biçime inmez.',
    ...sik(
      [
        'Seramik kursuna kaydolan iki kişinin kim olduğu',
        'Resim kursuna kaydolan üç kişinin kim olduğu',
        'Bora’nın ve Erkan’ın kaydolduğu kurslar',
        'Demet’in ve Funda’nın kaydolduğu kurslar',
        'Hafta sonu grubunu seçen üç kişinin kim olduğu',
      ],
      [
        yeterli((d) => kursundakiler(d, 'Seramik'), kurslar),
        yeterli((d) => kursundakiler(d, 'Resim'), kurslar),
        yeterli((d) => `${d.Bora_kurs}|${d.Erkan_kurs}`, kurslar),
        yeterli((d) => `${d.Demet_kurs}|${d.Funda_kurs}`, kurslar),
        yeterli((d) => KISI.filter((k) => d[`${k}_grup`] === 'hafta sonu').join(','), kurslar),
      ],
      4013,
    ),
  },
];
