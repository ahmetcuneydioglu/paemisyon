/**
 * İnsan Hakları soru bankası PDF'i → yapılandırılmış JSON (SALT OKUMA, DB YOK).
 *
 * Kitap düzeni: her bölüm "BAŞLIK → 1..N soru → CEVAP ANAHTARI" bloğu.
 * Şıklar iki sütuna basıldığı için tek satırda birden çok şık olabilir
 * ("A) Yetki \t B) Talep"). Tireli satır sonları birleştirilir.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { maddeListesiniDuzelt, puaVarMi } from './madde-listesi-duzelt';

const SIK = /([A-E])\)\s*/g;
const SORU_NO = /^(\d{1,3})[.)]\s*(.*)$/;
const ANAHTAR = /(\d{1,3})\s*[-–]\s*([A-E])/g;

interface Soru {
  /** Bölüm sırası — başlık metni tekrar edebildiği için tek ayırt edici. */
  bolumNo: number;
  /** Kitabın soru altına koyduğu bilgi kutusu (varsa) — şıkka yapışmamalı. */
  kitapNotu: string;
  /** Şık satırlarının en geniş hâli — sarma tespiti için (aşağıya bkz.). */
  sutun: number;
  /** Şıklara en son katkı yapan ham satırın uzunluğu. */
  sonSatir: number;
  bolum: string;
  no: number;
  kok: string;
  siklar: { label: string; text: string; ilkSatir: string }[];
  dogru: string | null;
  sayfa: number;
}

/** Üstbilgi/altbilgi gürültüsü: sayfa no, yazar adı, kitap tanıtımı. */
function gurultuMu(l: string): boolean {
  return (
    /^\d{1,3}$/.test(l) ||
    /Süleyman ARSLANTÜRK/i.test(l) ||
    /^https?:/.test(l) ||
    /t\.me\//i.test(l) ||
    /TANITIM AMAÇLI/i.test(l)
  );
}

/** Tümü büyük harf → bölüm başlığı satırı (şık/soru satırı değilse). */
function baslikMi(l: string): boolean {
  if (SORU_NO.test(l) || /^[A-E]\)/.test(l)) return false;
  const harf = l.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '');
  if (harf.length < 6) return false;
  return harf === harf.toLocaleUpperCase('tr-TR');
}

function main() {
  const ham = readFileSync(process.argv[2], 'utf8');
  const sorular: Soru[] = [];
  let sayfa = 0;
  let bolum = '';
  let baslikParcalari: string[] = [];
  // Bir bölümün soruları; CEVAP ANAHTARI görülünce cevaplar bunlara işlenir.
  let bekleyen: Soru[] = [];
  let bolumNo = 0;
  const tutarsiz: string[] = [];
  let anahtarModu = false;
  let anahtar = new Map<number, string>();
  let aktif: Soru | null = null;

  const bolumuKapat = () => {
    // Sayfa ortasındaki bilgi kutuları ("» madde işaretli" listeler) numaralı
    // satır gibi görünür ama şıkkı yoktur — soru değildir, elenir.
    bekleyen = bekleyen.filter((s) => s.siklar.length > 0);
    if (bekleyen.length === 0) { anahtar = new Map(); anahtarModu = false; aktif = null; return; }
    bolumNo += 1;
    if (anahtar.size !== bekleyen.length) {
      tutarsiz.push(`bölüm ${bolumNo} "${bolum.slice(0, 50)}": ${bekleyen.length} soru / ${anahtar.size} anahtar`);
    }
    for (const s of bekleyen) { s.bolumNo = bolumNo; s.dogru = anahtar.get(s.no) ?? null; }
    sorular.push(...bekleyen);
    bekleyen = [];
    anahtar = new Map();
    anahtarModu = false;
    aktif = null;
    baslikParcalari = [];
  };

  for (const rawLine of ham.split('\n')) {
    const line = rawLine.replace(/\t/g, ' ').trim();
    const sayfaEsl = /^===== SAYFA (\d+) =====$/.exec(line);
    if (sayfaEsl) {
      sayfa = Number(sayfaEsl[1]);
      if (bekleyen.length === 0) baslikParcalari = [];
      continue;
    }
    if (!line) continue;
    if (gurultuMu(line)) continue;

    if (/^CEVAP ANAHTARI/i.test(line)) { anahtarModu = true; aktif = null; continue; }

    if (anahtarModu) {
      const eslesmeler = [...line.matchAll(ANAHTAR)];
      if (eslesmeler.length > 0) {
        for (const m of eslesmeler) anahtar.set(Number(m[1]), m[2]);
        continue;
      }
      bolumuKapat(); // anahtar bitti, yeni bölüm başlıyor
    }

    if (baslikMi(line)) {
      // Başlık sayfa ÜSTBİLGİSİ olarak her sayfada tekrar eder. Bölüm zaten
      // başlamışsa (soru geldiyse) bu bir tekrardır — yok say. Bölümü yalnız
      // CEVAP ANAHTARI bloğunun bitişi kapatır.
      if (bekleyen.length > 0) continue;
      if (!baslikParcalari.includes(line)) baslikParcalari.push(line);
      bolum = baslikParcalari.join(' ');
      continue;
    }

    const soruEsl = SORU_NO.exec(line);
    if (soruEsl && !/^[A-E]\)/.test(line)) {
      baslikParcalari = [];
      aktif = { bolumNo: 0, kitapNotu: '', sutun: 0, sonSatir: 0, bolum, no: Number(soruEsl[1]), kok: soruEsl[2], siklar: [], dogru: null, sayfa };
      bekleyen.push(aktif);
      continue;
    }
    if (!aktif) continue;

    // Şık satırı — tek satırda birden fazla şık olabilir.
    const sikEsl = [...line.matchAll(SIK)];
    if (sikEsl.length > 0 && /^[A-E]\)/.test(line)) {
      aktif.sutun = Math.max(aktif.sutun, line.length);
      aktif.sonSatir = line.length;
      for (let i = 0; i < sikEsl.length; i++) {
        const bas = sikEsl[i].index! + sikEsl[i][0].length;
        const son = i + 1 < sikEsl.length ? sikEsl[i + 1].index! : line.length;
        const parca = line.slice(bas, son).trim();
        aktif.siklar.push({ label: sikEsl[i][1], text: parca, ilkSatir: parca });
      }
      continue;
    }
    // Devam satırı: son şıkka ya da köke eklenir (tire birleştirmesiyle).
    const ek = (onceki: string) =>
      onceki.endsWith('-') ? onceki.slice(0, -1) + line : `${onceki} ${line}`;

    // Kitap, bazı soruların altına bilgi kutusu koyuyor. Metin katmanında bu
    // kutu son şıkkın hemen ardından gelir ve naif "devam satırı" mantığı onu
    // E şıkkına yapıştırır ("E) Otuz Herkes, Anayasada güvence altına…").
    // Ayırt etme: şıkların hepsi gelmişse ve hepsi KISA/TAMAMLANMIŞsa, gelen
    // satır şıkkın devamı olamaz — nottur. Uzun şıklı sorularda gerçek satır
    // kaydırması olabileceği için orada eski davranış korunur.
    const sonSik = aktif.siklar[aktif.siklar.length - 1];

    // Sarma mı, bilgi notu mu? Kitap sabit genişlikte sütuna dizilmiş: SARILAN
    // bir satır sütunu neredeyse doldurur. Sütunun çok gerisinde biten satırdan
    // sonra gelen metin şıkkın devamı olamaz — kitabın bilgi kutusudur
    // ("E) Yargıtay Başkanı" + "4483 sayılı kanun kapsamında…").
    const acikDevam =
      !!sonSik && (/[-,]$/.test(sonSik.text) || /\s(ve|veya|ile|ya da)$/i.test(sonSik.text));
    const cumleBitti = !!sonSik && /[.?!]$/.test(sonSik.text.trim());
    const satirSutunuDoldurdu = aktif.sutun > 0 && aktif.sonSatir >= aktif.sutun * 0.75;
    const notBasladi =
      aktif.kitapNotu.length > 0 ||
      (aktif.siklar.length >= 5 && !acikDevam && (cumleBitti || !satirSutunuDoldurdu));

    if (notBasladi) {
      aktif.kitapNotu = aktif.kitapNotu ? ek(aktif.kitapNotu) : line;
    } else if (aktif.siklar.length > 0) {
      sonSik.text = ek(sonSik.text);
      aktif.sutun = Math.max(aktif.sutun, line.length);
      aktif.sonSatir = line.length;
    } else {
      aktif.kok = ek(aktif.kok);
    }
  }
  bolumuKapat();

  // Bilgi kutusu son şıkka yapışmışsa (sezgisel kural yakalayamadıysa) yapısal
  // gerçeğe dön: şıkkın KENDİ ham satırındaki metin şıktır, gerisi nottur.
  for (const s of sorular) {
    const son = s.siklar[s.siklar.length - 1];
    if (!son) continue;
    const u = s.siklar.map((o) => o.text.length);
    const digerEnUzun = Math.max(...u.slice(0, -1));
    if (son.text.length > 60 && son.text.length > digerEnUzun * 3 && son.ilkSatir.length < son.text.length) {
      const artik = son.text.slice(son.ilkSatir.length).trim();
      son.text = son.ilkSatir;
      s.kitapNotu = [artik, s.kitapNotu].filter(Boolean).join(' ');
    }
  }

  // SIRA ÖNEMLİ: önce boşluk temizliği, SONRA madde listesi kurulumu. Ters
  // sırada \s{2,} deseni listedeki boş satırı (\n\n) yiyor ve kapanış sorusu
  // son maddeye yapışık kalıyor.
  const temiz = sorular.map((s) => ({
    ...s,
    kok: maddeListesiniDuzelt(s.kok.replace(/\s{2,}/g, ' ').trim()),
    siklar: s.siklar.map((o) => ({ label: o.label, text: o.text.replace(/\s{2,}/g, ' ').trim() })),
    kitapNotu: s.kitapNotu.replace(/\s{2,}/g, ' ').trim(),
    sutun: undefined,
    sonSatir: undefined,
  }));
  writeFileSync(process.argv[3], JSON.stringify(temiz, null, 2));

  const bolumler = new Map<string, number>();
  for (const s of temiz) {
    const k = `${String(s.bolumNo).padStart(2)}. ${s.bolum}`;
    bolumler.set(k, (bolumler.get(k) ?? 0) + 1);
  }
  console.log(`TOPLAM SORU: ${temiz.length}`);
  console.log(`cevabı yok  : ${temiz.filter((s) => !s.dogru).length}`);
  console.log(`5 şık değil : ${temiz.filter((s) => s.siklar.length !== 5).length}`);
  console.log(`boş şık     : ${temiz.filter((s) => s.siklar.some((o) => !o.text)).length}`);
  console.log(`kitap notu  : ${temiz.filter((s) => s.kitapNotu).length}`);
  const sisen = temiz.filter((s) => {
    const u = s.siklar.map((o) => o.text.length);
    const enUzun = Math.max(...u);
    const digerEnUzun = Math.max(...u.slice(0, -1));
    return enUzun > 60 && enUzun > digerEnUzun * 3;
  });
  console.log(`şişmiş son şık (elle bak): ${sisen.length}`);
  for (const s of sisen.slice(0, 8)) console.log(`   b${s.bolumNo} #${s.no}: ${s.siklar[s.siklar.length - 1].text.slice(0, 90)}`);
  if (tutarsiz.length) {
    console.log('\nTUTARSIZ BÖLÜMLER (soru sayısı ≠ anahtar sayısı):');
    for (const t of tutarsiz) console.log('  ' + t);
  } else console.log('\ntüm bölümlerde soru sayısı = anahtar sayısı ✓');
  console.log('\nBÖLÜMLER:');
  for (const [b, n] of bolumler) console.log(`  ${String(n).padStart(3)}  ${b}`);
}
main();
