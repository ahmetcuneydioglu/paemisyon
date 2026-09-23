/**
 * Analitik Akıl Yürütme · 5. parti · senaryo 7 — satranç turnuvası (üç şehir, eleme).
 *
 * Aile: PAEM 9/82-84 (tenis turnuvası) — sekiz oyunculu, tek maçlık eleme;
 * sorular "kim kiminle karşılaşmış / kimi yenmiş olabilir, olamaz" üzerine
 * kurulur. İskelet bilerek farklı: oyuncular ÜÇ şehirden (3-3-2) gelir ve iki
 * şehir kuralı tabloyu daraltır:
 *   - "ilk turda kimse kendi şehrinden biriyle eşleşmemiştir" Umut’un ilk tur
 *     rakibini bir Rizeliye bağlar (Bolulular ilk turu kazanmıştır);
 *   - "finalistler farklı şehirlerdendir" ikinci turda Nazlı’yı eler, çünkü
 *     Nazlı kazansaydı finalde Tolga ile iki Bolulu karşılaşırdı.
 * Sayım öncülü ("Bolulu üç oyuncunun her biri ilk turu kazanmıştır") ikinci
 * turun dördüncü oyuncusunu Umut’a bağlar; final her çözümde Tolga–Umut’tur.
 * "Sinan tek maçını şampiyona kaybetmiştir" öncülü turnuvayı iki kola ayırır:
 * Umut Sinan’ı yenip şampiyon olur (Yeşim’i Kaan, Nazlı ya da Tolga yener;
 * altı çözüm) ya da Umut Yeşim’i, Tolga Sinan’ı yener ve Tolga şampiyon olur
 * (iki çözüm) — sekiz çözüm.
 *
 * Yazım kuralları (aay-paem10-dogrula.ts kalibrasyonundan):
 *   - sayılar tek anlamlı: "üç oyuncunun her biri", "yalnızca bir maç kazanmıştır",
 *     "yalnızca bir maç oynamış"; tur adları açık (ilk tur, ikinci tur, final)
 *   - kura her turda serbest (metinde yazılı), çözücünün turnuvalar() modeliyle aynı
 *   - dünyalar SENARYO METNİNDEN kurulur; metinde olmayan kısıt kodda olmaz
 *
 *   npx tsx scripts/aay-taslak-kontrol.ts aay-p5-s7
 */
import { bazi, her, hicbiri, karsilasti, romenSik, sik, turnuvalar, type Bulmaca, type Dunya } from './aay-cozucu';

const SEHIR: Record<string, string> = {
  Kaan: 'Bolu', Nazlı: 'Bolu', Tolga: 'Bolu',
  Pınar: 'Mardin', Rüzgar: 'Mardin', Umut: 'Mardin',
  Sinan: 'Rize', Yeşim: 'Rize',
};
const OYUNCU = Object.keys(SEHIR);
const BOLU = OYUNCU.filter((o) => SEHIR[o] === 'Bolu');
const RIZE = OYUNCU.filter((o) => SEHIR[o] === 'Rize');

const METIN =
  'Bir satranç turnuvasına üç şehirden toplam sekiz oyuncu katılmıştır: Bolu’dan Kaan, Nazlı ve Tolga; Mardin’den Pınar, Rüzgar ve Umut; Rize’den Sinan ve Yeşim. Turnuva ilk tur, ikinci tur ve final olmak üzere üç turda, tek maçlık eleme usulüyle oynanmıştır. Her turun eşleşmeleri kura ile belirlenmiş, her maçın bir galibi olmuş ve maçı kaybeden oyuncu turnuvadan elenmiştir. Finali kazanan oyuncu şampiyon olmuştur. Turnuvayla ilgili bilinenler şunlardır:\n' +
  '- İlk turda hiçbir oyuncu kendi şehrinden bir oyuncuyla eşleşmemiştir.\n' +
  '- Final maçında karşılaşan iki oyuncu farklı şehirlerdendir.\n' +
  '- Bolu’dan gelen üç oyuncunun her biri ilk turdaki maçını kazanmıştır.\n' +
  '- Umut ikinci turda Nazlı ile karşılaşmıştır.\n' +
  '- Kaan turnuvada yalnızca bir maç kazanmıştır.\n' +
  '- Sinan turnuvada yalnızca bir maç oynamış ve bu maçı turnuvanın şampiyonuna kaybetmiştir.';

/** Oyuncunun kazandığı maç sayısı: ilk tur + ikinci tur + final. */
const galibiyet = (d: Dunya, o: string) =>
  Number(d[`k1_${o}`]) + Number(d[`k2_${o}`]) + Number(d.sampiyon === o);
/** "a ilk turda b’yi yenmiştir" */
const ilkTurYendi = (d: Dunya, a: string, b: string) => d[`r1_${a}`] === b && d[`k1_${a}`] === true;
/** a, turnuvanın herhangi bir turunda b’yi yendi mi (ilk tur, ikinci tur ya da final). */
const yendi = (d: Dunya, a: string, b: string) =>
  ilkTurYendi(d, a, b) || (d[`r2_${a}`] === b && d[`k2_${a}`] === true) || (d[`r3_${a}`] === b && d.sampiyon === a);
const finalistler = (d: Dunya) => String(d.final).split('|');

// Metnin kurduğu uzay: sekiz oyunculu eleme turnuvasının bütün kura ve sonuç bileşimleri, sonra öncüller.
const turnuva = turnuvalar(OYUNCU).filter((d) => {
  if (!OYUNCU.every((o) => SEHIR[d[`r1_${o}`] as string] !== SEHIR[o])) return false;
  const [f1, f2] = finalistler(d);
  if (SEHIR[f1] === SEHIR[f2]) return false;
  if (!BOLU.every((o) => d[`k1_${o}`] === true)) return false;
  if (d.r2_Umut !== 'Nazlı') return false;
  if (galibiyet(d, 'Kaan') !== 1) return false;
  if (d.k1_Sinan !== false || d.r1_Sinan !== d.sampiyon) return false;
  return true;
});
const turnuvaTolgaPinar = turnuva.filter((d) => ilkTurYendi(d, 'Tolga', 'Pınar'));

type Soru = Bulmaca & { ortakMetin: string; kok: string; aciklama: string; zorluk: 'easy' | 'medium' | 'hard' };

export const PARTI: Soru[] = [
  {
    id: 'aay-p5-19', zorluk: 'medium', baslik: 'Satranç · kesinlikle yanlış olan', ortakMetin: METIN, dunyalar: turnuva,
    kok: 'Yukarıdaki bilgilere göre, aşağıdakilerden hangisi kesinlikle yanlıştır?',
    aciklama:
      'Bolulu üç oyuncu ilk turu geçmiş, Umut da ikinci turda oynamıştır; ikinci turdaki dört oyuncu Kaan, Nazlı, Tolga ve Umut’tur. Umut Nazlı ile eşleştiğine göre öteki maç Kaan–Tolga’dır; Kaan ile Tolga her durumda karşılaşmıştır. Kaan yalnızca bir maç kazandığı için bu maçı Tolga kazanmıştır. Nazlı Umut’u yenseydi finalde Tolga ile iki Bolulu karşılaşırdı; finalistler farklı şehirlerden olduğuna göre Nazlı ikinci turda elenmiştir. Nazlı ile Tolga ilk turda aynı şehirden oldukları, ikinci turda ayrı maçlarda bulundukları, finalde de Nazlı elendiği için karşılaşamaz. Tolga’nın şampiyon olması, Nazlı’nın ya da Kaan’ın ilk turda Pınar’ı yenmesi ise mümkündür.',
    ...sik(
      [
        'Nazlı ile Tolga turnuvanın herhangi bir turunda karşılaşmıştır.',
        'Kaan ile Tolga turnuvanın herhangi bir turunda karşılaşmıştır.',
        'Tolga turnuvada üç maç kazanmıştır.',
        'Nazlı ilk turda Pınar’ı yenmiştir.',
        'Kaan ilk turda Pınar’ı yenmiştir.',
      ],
      [
        hicbiri((d) => karsilasti(d, 'Nazlı', 'Tolga')),
        hicbiri((d) => karsilasti(d, 'Kaan', 'Tolga')),
        hicbiri((d) => galibiyet(d, 'Tolga') === 3),
        hicbiri((d) => ilkTurYendi(d, 'Nazlı', 'Pınar')),
        hicbiri((d) => ilkTurYendi(d, 'Kaan', 'Pınar')),
      ],
      5071,
    ),
  },
  {
    id: 'aay-p5-20', zorluk: 'hard', baslik: 'Satranç · bir Rizeliyi yenmiş olabilecekler', ortakMetin: METIN, dunyalar: turnuva,
    kok: 'Yukarıdaki bilgilere göre,\nI. Nazlı\nII. Rüzgar\nIII. Umut\nadlı oyunculardan hangileri turnuvada Rize’den gelen oyunculardan birini yenmiş olabilir?',
    aciklama:
      'İkinci turdaki dört oyuncu Bolulu üç oyuncu ile Umut’tur; ilk turu geçen tek Mardinli Umut’tur. Rüzgar ilk turda elendiği için hiç maç kazanmamıştır (II olamaz). Umut’un ilk tur rakibi Bolulu olamaz, çünkü Bolulular ilk turu kazanmıştır; Mardinli de olamaz. Umut her durumda ilk turda bir Rizeliyi yenmiştir (III). Nazlı ikinci turda Umut’a elenir, çünkü kazansaydı finalde iki Bolulu karşılaşırdı; bu yüzden şampiyon olamaz ve tek maçını şampiyona kaybeden Sinan’ı yenmiş olamaz. Ancak Umut Sinan’ı yenip şampiyon olur, Nazlı da ilk turda Yeşim’i yenerse bütün koşullar sağlanır (I olabilir). Doğru cevap I ve III’tür.',
    // Doğru küme İLK verilir; şıklar kanonik sırada dizilir (romenSik).
    ...romenSik(
      [
        bazi((d) => RIZE.some((r) => yendi(d, 'Nazlı', r))),
        bazi((d) => RIZE.some((r) => yendi(d, 'Rüzgar', r))),
        bazi((d) => RIZE.some((r) => yendi(d, 'Umut', r))),
      ],
      [[1, 3], [3], [1, 2], [2, 3], [1, 2, 3]],
    ),
  },
  {
    id: 'aay-p5-21', zorluk: 'hard', baslik: 'Satranç · Tolga ilk turda Pınar’ı yendiyse', ortakMetin: METIN, dunyalar: turnuvaTolgaPinar,
    kok: 'Yukarıdaki bilgilere göre, Tolga ilk turda Pınar’ı yenmişse aşağıdakilerden hangisi kesinlikle doğrudur?',
    aciklama:
      'İkinci turda Kaan, Nazlı, Tolga ve Umut vardır. Tolga Kaan’ı yenmiştir; Nazlı Umut’u yenseydi finalde iki Bolulu karşılaşacağı için finale Umut çıkmıştır. Final Tolga–Umut’tur ve şampiyon bu ikisinden biridir. Sinan tek maçını şampiyona kaybettiğine göre Sinan’ı ilk turda yenen oyuncu şampiyondur. Tolga ilk turda Pınar’la oynadıysa Sinan’ı yenen Tolga değildir; öyleyse Sinan’ı yenen ve şampiyon olan Umut’tur. Umut ilk turda Sinan’ı yendiği için Yeşim’le oynamamış, Rizelilerden Sinan da Bolulu bir oyuncuya değil Umut’a yenilmiştir. Rüzgar ile Yeşim’in ilk tur rakipleri Kaan ile Nazlı’dır, ama hangisinin kimi yendiği belirlenemez; bu yüzden ne Kaan–Rüzgar ne de Kaan–Yeşim eşleşmesi kesindir.',
    ...sik(
      [
        'Umut turnuvanın şampiyonu olmuştur.',
        'Kaan ilk turda Rüzgar’ı yenmiştir.',
        'Umut ilk turda Yeşim’i yenmiştir.',
        'Yeşim ilk turda Kaan’a yenilmiştir.',
        'Rize’den gelen iki oyuncunun her biri ilk turda Bolu’dan gelen bir oyuncuya yenilmiştir.',
      ],
      [
        her((d) => d.sampiyon === 'Umut'),
        her((d) => ilkTurYendi(d, 'Kaan', 'Rüzgar')),
        her((d) => ilkTurYendi(d, 'Umut', 'Yeşim')),
        her((d) => ilkTurYendi(d, 'Kaan', 'Yeşim')),
        her((d) => RIZE.every((r) => d[`k1_${r}`] === false && SEHIR[d[`r1_${r}`] as string] === 'Bolu')),
      ],
      5073,
    ),
  },
];
