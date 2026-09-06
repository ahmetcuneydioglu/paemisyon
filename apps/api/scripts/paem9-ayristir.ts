/**
 * Doc 36 — PAEM 9 (2025) resmî kitapçığını ayrıştırır.
 *
 * Kaynak: iki sütunlu A4 kitapçık, metin katmanı temiz (OCR YOK).
 * Metin script'in kendisi tarafından çıkarılır (ham/paem9-{A,B}.txt):
 *   pdftotext -layout -x 0   -W 300  → sol sütun
 *   pdftotext -layout -x 300 -W 296  → sağ sütun
 * Cevap anahtarı sayfası sütunlu DEĞİL, sayfa genişliğinde bir tablodur;
 * o sayfa kırpılmadan alınır (kırpılırsa tablo ikiye bölünür).
 *
 * Kitapçığın SON sayfasında resmî cevap anahtarı var; `iD` gibi "i" önekli
 * harfler İPTAL edilen soruyu gösterir (A: 88-89-90, B: 85-86-87).
 *
 * A/B ÇAPRAZ DOĞRULAMA — bedava denetim katmanı: aynı soru iki kitapçıkta
 * farklı sırada ve ayrı anahtar satırıyla var. Eşleşen sorularda iki anahtar
 * AYNI ŞIK METNİNİ göstermiyorsa ayrıştırma hatalıdır; script HATA verir.
 *
 *   npx tsx scripts/paem9-ayristir.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/36-paem-cikmis-sorular';
const PDF = `${process.env.HOME}/Documents/PaemÇıkmışSorular/Paem9.pdf`;
/** Kitapçıkların sayfa aralığı; her birinin SON sayfası cevap anahtarıdır. */
const KITAPCIK = { A: { ilk: 1, son: 18 }, B: { ilk: 19, son: 36 } } as const;

/** PDF'ten sütun sütun metin çıkarır; anahtar sayfasını kırpmadan alır. */
function metniCikar(grup: 'A' | 'B'): string {
  const { ilk, son } = KITAPCIK[grup];
  const cagir = (args: string[]) =>
    execFileSync('pdftotext', ['-layout', ...args, PDF, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const parcalar: string[] = [];
  for (let p = ilk; p <= son; p++) {
    const sayfa = ['-f', String(p), '-l', String(p)];
    if (p === son) parcalar.push(cagir(sayfa));
    else {
      parcalar.push(cagir([...sayfa, '-x', '0', '-y', '0', '-W', '300', '-H', '842']));
      parcalar.push(cagir([...sayfa, '-x', '300', '-y', '0', '-W', '296', '-H', '842']));
    }
  }
  return parcalar.join('');
}

export type Soru = {
  no: number;
  grup: 'A' | 'B';
  /** "82 - 84. soruları aşağıdaki bilgilere göre cevaplayınız." bloğunun
   *  metni — üç soru bunu paylaşır. Bankaya yazarken köke önden eklenir,
   *  yoksa soru tek başına cevaplanamaz. */
  ortakMetin?: string;
  kok: string;
  siklar: Record<string, string>;
  dogru?: string;
  iptal?: boolean;
  /** Şekil/grafik/tablo görseli olan soru — metin tek başına yetmez. */
  gorselli: boolean;
};

/** Sayfa üstbilgisi tam metni; sütun kırpması bunu ORTADAN böler, o yüzden
 *  parçaları da elenmeli — yoksa şıkkın sonuna "EĞİTİMİ YAZILI SINAVI" yapışır. */
const USTBILGI = '2025 PAEM İLK DERECE AMİRLİK EĞİTİMİ YAZILI SINAVI';

/** Sayfa üstbilgisi (ya da parçası), sayfa numarası, kitapçık harfi. */
const gurultuMu = (s: string) => {
  const g = s.replace(/\s*-\s*[AB]$/, '').trim(); // "... SINAVI - B" → "... SINAVI"
  return g === '' || /^\d{1,2}$/.test(g) || /^[AB]$/.test(s) || (g.length > 3 && USTBILGI.includes(g));
};

/** Kökün, metinde bulunmayan bir çizime/grafiğe atıf yaptığı kalıplar.
 *  "hızlı bir şekilde" gibi masum kullanımları yakalamamak için "yukarıdaki"
 *  komşuluğu aranır. */
const GORSEL = /yukarıda(ki)?\s+\S*\s*(şekil|grafik|tablo)|şekil dizisi|sembolle eşleş/i;

/** Sütun içi hizalama boşlukları anlam taşımaz. */
const sadeBosluk = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Sütun kırpması, bir sonraki sorunun ilk sözcüğünü ("Yukarıdaki") önceki
 * bloğun sonuna düşürebiliyor: ortak metnin ya da E şıkkının sonunda tek
 * başına kalıyor. Hiçbir şık ya da bilgi bloğu bu sözcükle bitmez.
 */
const sarkaniAt = (s: string) => s.replace(/\s*Yukarıdaki\s*$/, '').trim();

/** Karşılaştırma için: boşluk, noktalama ve büyük/küçük harf farkını sil. */
const parmakIzi = (s: string) =>
  s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]/gu, '');

function anahtariOku(satirlar: string[]): Map<number, { harf: string; iptal: boolean }> {
  const bas = satirlar.findIndex((s) => /Grubu Cevap Anahtarı/i.test(s));
  if (bas < 0) throw new Error('cevap anahtarı bulunamadı');
  const anahtar = new Map<number, { harf: string; iptal: boolean }>();
  // Anahtar bloklar hâlinde: bir satır 20 numara, ardından o numaraların
  // harfleri. Harf satırı sayfa genişliğinde bölünebildiği için harfler
  // numara sayısına ulaşana kadar BİRİKTİRİLİR.
  let bekleyen: number[] = [];
  let harfler: string[] = [];
  const bogum = () => {
    if (!bekleyen.length || harfler.length !== bekleyen.length) return;
    bekleyen.forEach((no, i) => {
      const h = harfler[i];
      anahtar.set(no, { harf: h.replace(/^i/, ''), iptal: h.startsWith('i') });
    });
    bekleyen = [];
    harfler = [];
  };
  for (const ham of satirlar.slice(bas + 1)) {
    const s = sadeBosluk(ham);
    if (!s) continue;
    const parcalar = s.split(' ');
    // Tek başına duran sayı sayfa numarasıdır; anahtar blokları 10'lu/20'li.
    if (parcalar.length >= 5 && parcalar.every((p) => /^\d{1,3}$/.test(p))) {
      if (bekleyen.length) throw new Error(`anahtar eksik kaldı: ${bekleyen[0]}-${bekleyen.at(-1)}`);
      bekleyen = parcalar.map(Number);
      continue;
    }
    if (!bekleyen.length) continue;
    // "iD" bitişik gelebildiği gibi "i" ve "D" ayrı jeton da olabilir.
    for (const p of parcalar) {
      if (p === 'i') { harfler.push('i'); continue; }
      if (!/^i?[A-E]$/.test(p)) throw new Error(`anahtarda beklenmedik jeton: "${p}"`);
      if (harfler.at(-1) === 'i') harfler[harfler.length - 1] = 'i' + p;
      else harfler.push(p);
    }
    bogum();
  }
  if (bekleyen.length) throw new Error(`anahtar eksik kaldı: ${bekleyen[0]}-${bekleyen.at(-1)}`);
  return anahtar;
}

/**
 * İptal edilen sorularda kitapçığa "Bu soru iptal edilmiştir." damgası
 * BASILMIŞ; pdftotext bu damgayı kökün kelimeleri arasına serpiştiriyor
 * ("Bu bilgilere soru iptal göre, ..."). Damganın kelimeleri sırayla ayıklanır.
 */
function iptalYazisiniSok(kok: string): string {
  const damga = ['Bu', 'soru', 'iptal', 'edilmiştir.'];
  if (!damga.every((k) => kok.includes(k))) return kok;
  // "iptalbilgilere" / "edilmiştir.göre" gibi yapışmaları önce ayır.
  let jetonlar = kok.split(' ').flatMap((j) => {
    for (const k of damga) {
      if (j !== k && j.startsWith(k)) return [k, j.slice(k.length)];
      if (j !== k && j.endsWith(k)) return [j.slice(0, -k.length), k];
    }
    return [j];
  });
  let i = 0;
  jetonlar = jetonlar.filter((j) => (i < damga.length && j === damga[i] ? (i++, false) : true));
  // Damga "Yukarıdaki" sözcüğünün üstüne bastığı için pdftotext onu hiç
  // üretemiyor; kalıp bellisi olduğundan geri konur.
  const temiz = sadeBosluk(jetonlar.join(' '));
  return /^bilgilere göre/i.test(temiz) ? `Yukarıdaki ${temiz}` : temiz;
}

/**
 * Türkçe sorularında numaralar sözcüklerin ALTINA ayrı bir satıra basılıyor:
 *
 *     Seninle sonunda    aynı   görüş birliğine
 *               I         II           III
 *
 * Satırlar sırayla birleştirilirse numaralar cümlenin sonuna yığılır ve soru
 * çözülemez hâle gelir (ilk turda iki denetçi de bu yüzden yanıldı). Numara
 * satırı, her rakamın SÜTUN KONUMUNA bakılarak üstteki sözcüğün arkasına
 * yerleştirilir.
 */
function romaNumaralariniGom(satirlar: string[]): string[] {
  const cikti = [...satirlar];
  const yalnizRoma = /^\s*(?:[IVX]+\s+){1,}[IVX]+\s*$/;
  for (let i = 0; i < cikti.length; i++) {
    if (!yalnizRoma.test(cikti[i])) continue;
    let j = i - 1;
    while (j >= 0 && cikti[j].trim() === '') j--;
    if (j < 0) continue;
    const hedef = cikti[j];
    const kelimeler = [...hedef.matchAll(/\S+/g)].map((m) => ({ bas: m.index!, son: m.index! + m[0].length }));
    if (!kelimeler.length) continue;
    const eklemeler: { yer: number; metin: string }[] = [];
    for (const m of cikti[i].matchAll(/[IVX]+/g)) {
      const sutun = m.index!;
      // Rakamın hizasındaki (ya da hizasından önce başlayan son) sözcük.
      const k = kelimeler.filter((w) => w.bas <= sutun + 1).at(-1) ?? kelimeler[0];
      eklemeler.push({ yer: k.son, metin: ` ${m[0]}` });
    }
    let yeni = hedef;
    for (const e of eklemeler.sort((a, b) => b.yer - a.yer)) yeni = yeni.slice(0, e.yer) + e.metin + yeni.slice(e.yer);
    cikti[j] = yeni;
    cikti[i] = '';
  }
  return cikti;
}

function sorulariOku(satirlar: string[], grup: 'A' | 'B'): Soru[] {
  const son = satirlar.findIndex((s) => /Grubu Cevap Anahtarı/i.test(s));
  const govde = romaNumaralariniGom(satirlar.slice(0, son < 0 ? undefined : son))
    .filter((s) => !gurultuMu(sadeBosluk(s)));

  const sorular: Soru[] = [];
  const ortak = new Map<number, string>(); // soru no → ortak metin
  let toplanan: { ilk: number; son: number; satirlar: string[] } | null = null;
  let sonNo = 0; // en son açılan soru — ortak metin bloğu aktif'i kapattığı için ayrı tutulur
  let aktif: { no: number; kokSatir: string[]; siklar: Record<string, string>; sonSik?: string } | null = null;
  const kapat = () => {
    if (!aktif) return;
  const kok = iptalYazisiniSok(sadeBosluk(aktif.kokSatir.join(' ')));
    sorular.push({
      no: aktif.no,
      grup,
      ortakMetin: ortak.get(aktif.no),
      kok,
      siklar: Object.fromEntries(Object.entries(aktif.siklar).map(([h, t]) => [h, sarkaniAt(t as string)])),
      gorselli: GORSEL.test(kok),
    });
    aktif = null;
  };

  for (const ham of govde) {
    const s = sadeBosluk(ham);
    if (!s) continue;
    // Yeni soru YALNIZ sıradaki numarayla başlar — metin içindeki "13. madde"
    // yanlışlıkla soru başlığı sayılmasın.
    // "82 - 84. soruları aşağıdaki bilgilere göre cevaplayınız." — üç sorunun
    // paylaştığı bilgi bloğu başlıyor. Kapatılmazsa blok, bir önceki sorunun
    // E şıkkına yapışır.
    const ortakBas = s.match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})\.\s*soruları/);
    if (ortakBas) {
      kapat();
      toplanan = { ilk: Number(ortakBas[1]), son: Number(ortakBas[2]), satirlar: [] };
      continue;
    }
    const bas = s.match(/^(\d{1,3})\.\s*(.*)$/);
    if (toplanan && bas && Number(bas[1]) === toplanan.ilk) {
      // Yönerge cümlesi ("...aşağıdaki bilgilere göre [ve birbirinden bağımsız
      // olarak] cevaplayınız.") başlık satırından taşabiliyor; ilk
      // "cevaplayınız." dâhil olmak üzere baştaki yönerge atılır.
      const metin = sadeBosluk(toplanan.satirlar.join(' ')).replace(/^.{0,120}?cevaplayınız\.\s*/i, '');
      for (let n = toplanan.ilk; n <= toplanan.son; n++) ortak.set(n, sarkaniAt(metin));
      toplanan = null;
    }
    if (toplanan) { toplanan.satirlar.push(s); continue; }
    if (bas && Number(bas[1]) === sonNo + 1) {
      kapat();
      sonNo = Number(bas[1]);
      aktif = { no: sonNo, kokSatir: bas[2] ? [bas[2]] : [], siklar: {} };
      continue;
    }
    if (!aktif) continue;
    const sik = s.match(/^([A-E])\)\s*(.*)$/);
    if (sik) {
      aktif.sonSik = sik[1];
      aktif.siklar[sik[1]] = sik[2];
      continue;
    }
    if (aktif.sonSik) aktif.siklar[aktif.sonSik] += ' ' + s;
    else aktif.kokSatir.push(s);
  }
  kapat();
  return sorular;
}

function main() {
  const kitapciklar: Record<'A' | 'B', Soru[]> = { A: [], B: [] };
  for (const grup of ['A', 'B'] as const) {
    const yol = `${KOK}/ham/paem9-${grup}.txt`;
    if (!existsSync(`${KOK}/ham`)) mkdirSync(`${KOK}/ham`, { recursive: true });
    const metin = metniCikar(grup);
    writeFileSync(yol, metin);
    const satirlar = metin.split('\n');
    const anahtar = anahtariOku(satirlar);
    const sorular = sorulariOku(satirlar, grup);
    for (const s of sorular) {
      const a = anahtar.get(s.no);
      if (!a) throw new Error(`${grup}/${s.no}: anahtarda yok`);
      s.dogru = a.harf;
      s.iptal = a.iptal;
    }
    console.log(
      `${grup}: soru ${sorular.length} · anahtar ${anahtar.size} · iptal ${sorular.filter((x) => x.iptal).length}` +
        ` · görselli ${sorular.filter((x) => x.gorselli).length}` +
        ` · şıkkı eksik ${sorular.filter((x) => Object.keys(x.siklar).length !== 5).length}`,
    );
    kitapciklar[grup] = sorular;
  }

  // ── A/B çapraz doğrulama ──
  // Ortak metinli sorularda kök tek başına AYIRT ETMİYOR ("Yukarıdaki
  // bilgilere göre ... kesinlikle doğrudur?" üç grupta da aynı); eşleştirme
  // ortak metin + kök + şık kümesi üzerinden yapılır.
  const kimlik = (s: Soru) =>
    parmakIzi((s.ortakMetin ?? '') + s.kok + Object.values(s.siklar).sort().join(''));
  const indeks = new Map<string, Soru>();
  for (const s of kitapciklar.B) indeks.set(kimlik(s), s);
  let eslesen = 0;
  const sorunlar: string[] = [];
  for (const a of kitapciklar.A) {
    const b = indeks.get(kimlik(a));
    if (!b) { sorunlar.push(`A/${a.no} B'de eşleşmedi: ${a.kok.slice(0, 60)}`); continue; }
    eslesen++;
    if (a.iptal !== b.iptal) sorunlar.push(`A/${a.no}-B/${b.no}: iptal durumu farklı`);
    if (parmakIzi(a.ortakMetin ?? '') !== parmakIzi(b.ortakMetin ?? ''))
      sorunlar.push(`A/${a.no}-B/${b.no}: ortak metin farklı`);
    const ma = a.siklar[a.dogru!], mb = b.siklar[b.dogru!];
    if (!a.iptal && parmakIzi(ma ?? '') !== parmakIzi(mb ?? ''))
      sorunlar.push(`A/${a.no}-B/${b.no}: anahtar farklı şıkkı gösteriyor\n    A(${a.dogru}) ${ma}\n    B(${b.dogru}) ${mb}`);
  }
  console.log(`\nçapraz doğrulama: ${eslesen}/${kitapciklar.A.length} eşleşti, ${sorunlar.length} sorun`);
  for (const p of sorunlar.slice(0, 20)) console.log('  ! ' + p);

  writeFileSync(`${KOK}/ham/paem9-cozumlenmis.json`, JSON.stringify(kitapciklar, null, 1));
  console.log(`\n→ ham/paem9-cozumlenmis.json`);
}
main();
