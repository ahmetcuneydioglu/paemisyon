/**
 * Derleme PDF → içe aktarma XLSX dönüştürücüsü (tek seferlik araç, DB YOK).
 *
 * Hedef: ders derlemesi PDF'leri (AÖF/LMS soru arşivleri gibi) — resmî kitapçık
 * formatında olmayan, cevabı iki farklı yolla işaretlenmiş dosyalar:
 *   1) Soru altında "Cevap Açıklama: (B) ..." / "Cevap: B" satırı (+ açıklama)
 *   2) Doğru şıkkın üzerine çizilmiş SARI (#ffff00) vurgu dikdörtgeni
 *
 * Çıktı: panel içe aktarma şablonu (soru|A|B|C|D|E|dogru|aciklama|zorluk)
 *   - "Hazır"  : cevabı çözülmüş + temiz metinli satırlar (direkt yüklenir)
 *   - "İncele" : cevapsız / bozuk metinli / şıkları eksik satırlar (sebep sütunlu)
 *
 * Kullanım: npx ts-node scripts/extract-derleme-pdf.ts <girdi.pdf> [cikti.xlsx]
 *
 * Not: "ti" hece kaybı (font subsetting hatası) bazı bölümlerde metni bozuyor
 * ("İhtilal" → "İh lal"). Bozuk satır bankaya GİRMEZ — İncele'ye düşer.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

// ── pdf.js satır modeli ──

interface Line {
  page: number;
  y: number;
  text: string;
  /** Satır bir sarı vurgu kutusuyla kesişiyor mu? */
  yellow: boolean;
}

interface ExtractedQuestion {
  page: number;
  no: string;
  stem: string;
  options: { label: string; text: string; yellow: boolean }[];
  answerLetter: string | null; // "Cevap ..." satırından (en güvenilir)
  explanation: string | null;
  yellowLetter: string | null; // sarı kutudan (soruya fiziksel bağlı)
  keyLetter: string | null; // bölüm anahtar listesinden (numara eşleşmesi)
  /** Mükerrer kopyada FARKLI cevap görüldü — otomatik yükleme güvenli değil. */
  copyConflict?: string;
}

const OPTION_RE = /^([a-eA-E])[).]\s*(.*)$/;
const QNUM_RE = /^(\d{1,3})\s*[-–).]\s*(.*)$/;
// LMS dışa aktarımı: soru "Soru 18" başlığıyla açılır.
const SORU_HEADER_RE = /^Soru\s+(\d{1,3})\b\s*(.*)$/;
// Bölüm başındaki sıkışık cevap anahtarı: "1. D 2. B 3. C ... 7. Iptal ..."
const KEYLIST_ENTRY_RE = /(\d{1,3})\s*[.\-]\s*(İptal|Iptal|IPTAL|[A-E])\b/g;
// "Cevap Açıklama: (B) ...", "Cevap: B", "Cevap : B)", "CEVAP B"
const ANSWER_RE =
  /^Cevap(?:\s*Açıklama)?\s*:?\s*[([]?\s*([A-Ea-e])\s*[)\]]?\s*[:.\-–]?\s*(.*)$/iu;
// Bölüm başlığı / sayfa gürültüsü — soruya eklenmemesi gereken satırlar.
// Son grup: LMS quiz dökümü tablo artıkları (Seçenek/puan/boş sütunları).
const NOISE_RE =
  /^[>(]|LMS|BÜT\b|VİZE\b|FİNAL\b|Dönem|Ünite|^Atatürk İlkeleri|^Not\s*:|^www\.|^\d+\s*\/\s*\d+$|Seçenek|Cevaplamış Öğrenci|Soru Puanı|^Boş$|^\d+,\d+$|^DİKKAT!/iu;

/** Font subsetting hatası onarımı: Ɵ/ɵ glifi aslında "ti" hecesidir
 *  ("CumhuriyeƟn" → "Cumhuriyetin", "verilmişƟr" → "verilmiştir"). */
function repairLigatures(s: string): string {
  return s.replace(/[Ɵɵ]/g, 'ti').replace(/İti̇?laf/g, 'İtilaf');
}

/** Bozuk metin ("ti" düşmesi) sinyali: bariz hece kırıkları. */
const CORRUPT_HINTS =
  /\b(İh lal|ik dar|mille n|Devle ’|Devle '|hüküme n|vekille r|müca[ds]ele n)\b/u;

/** Kısa "kelime kırığı" oranı — bozuk bölümlerde tek/çift harf parçalar artar. */
function fragmentScore(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) return 0;
  const whitelist = new Set(['o', 'bu', 'şu', 've', 'ya', 'de', 'da', 'ki', 'ne', 'en', 'ay', 'ön', 'öz', 'üç', 'iki', 'ilk', 'son', 'I', 'II', 'III', 'IV', 'V', 'a', 'b', 'c', 'd', 'e']);
  const frags = words.filter(
    (w) => /^[a-zçğıöşü]{1,2}$/u.test(w) && !whitelist.has(w.toLocaleLowerCase('tr-TR')),
  ).length;
  return frags / words.length;
}

function isCorrupt(text: string): boolean {
  return CORRUPT_HINTS.test(text) || fragmentScore(text) > 0.06;
}

async function extractLines(pdfPath: string): Promise<Line[]> {
  // pdf.js'i tembel yükle (pdf-parse'ın getirdiği sürüm).
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buf = fs.readFileSync(pdfPath);
  const doc = await getDocument({ data: new Uint8Array(buf) }).promise;
  const lines: Line[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const [ops, tc] = await Promise.all([page.getOperatorList(), page.getTextContent()]);

    // Sarı vurgu kutuları (küçük dikdörtgenler; tam sayfa clip'i elenir).
    let cur: string | null = null;
    const boxes: [number, number, number, number][] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];
      if (fn === OPS.setFillRGBColor) cur = String(args[0]).toLowerCase();
      if (fn === OPS.constructPath && cur === '#ffff00') {
        const mm = args[2] as Float32Array;
        const w = mm[2] - mm[0];
        const h = mm[3] - mm[1];
        if (w > 5 && w < 450 && h > 3 && h < 40) boxes.push([mm[0], mm[1], mm[2], mm[3]]);
      }
    }

    // Metin öğeleri → satırlar (y toleransı 3pt; x sırasına göre, boşluk onarımı).
    type Item = { x: number; y: number; w: number; str: string };
    const items: Item[] = [];
    for (const it of tc.items as { str?: string; width?: number; transform: number[] }[]) {
      if (!it.str || !it.str.trim()) continue;
      items.push({ x: it.transform[4], y: it.transform[5], w: it.width ?? 0, str: it.str });
    }

    // ── Sütun tespiti ── Derlemenin bazı bölümleri İKİ sütunlu; salt y'ye
    // göre gruplamak iki sütunu tek satıra karıştırıp soruları parçalıyordu
    // (a) satırı sayımı ~2100 iken 951 blok — kaybın ana nedeni buydu).
    // Orta çizgiyi kesen öğe oranı düşükse sayfa iki sütun kabul edilir;
    // önce sol sütun, sonra sağ sütun ayrı ayrı satırlaştırılır.
    const mid = page.getViewport({ scale: 1 }).width / 2;
    const crossing = items.filter((it) => it.x < mid - 5 && it.x + it.w > mid + 5).length;
    const rightStart = items.filter((it) => it.x >= mid).length;
    const twoCol =
      items.length > 20 && rightStart / items.length > 0.2 && crossing / items.length < 0.05;

    const buildLines = (colItems: Item[]) => {
      colItems.sort((a, b) => b.y - a.y || a.x - b.x);
      let bucket: Item[] = [];
      const flush = () => {
        if (bucket.length === 0) return;
        bucket.sort((a, b) => a.x - b.x);
        let text = '';
        let prevEnd: number | null = null;
        for (const it of bucket) {
          if (prevEnd !== null && it.x - prevEnd > 1.0 && !text.endsWith(' ')) text += ' ';
          text += it.str;
          prevEnd = it.x + it.w;
        }
        const y = bucket[0].y;
        const yellow = boxes.some(
          ([x1, y1, x2, y2]) =>
            bucket.some((it) => it.x < x2 && it.x + it.w > x1) && y > y1 && y < y2,
        );
        lines.push({ page: p, y, text: text.trim(), yellow });
        bucket = [];
      };
      for (const it of colItems) {
        if (bucket.length > 0 && Math.abs(it.y - bucket[0].y) > 3) flush();
        bucket.push(it);
      }
      flush();
    };

    if (twoCol) {
      buildLines(items.filter((it) => it.x + it.w / 2 < mid));
      buildLines(items.filter((it) => it.x + it.w / 2 >= mid));
    } else {
      buildLines(items);
    }
  }
  return lines;
}

function parseQuestions(lines: Line[]): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  let q: ExtractedQuestion | null = null;
  let part: 'stem' | 'option' | 'explanation' | null = null;
  // Bölüm başındaki sıkışık cevap anahtarı ("1. D 2. B …") — soru numarasına
  // göre uygulanır; yeni anahtar listesi eskisini DEĞİŞTİRİR (numara sıfırlanır).
  let sectionKey = new Map<string, string>();

  const push = () => {
    if (q && q.options.length >= 2) {
      if (sectionKey.has(q.no)) q.keyLetter = sectionKey.get(q.no)!;
      questions.push(q);
    }
    q = null;
    part = null;
  };

  for (const line of lines) {
    const t = repairLigatures(line.text);

    // Sıkışık cevap anahtarı satırı: ≥3 "N. HARF" kaydı → bölüm anahtarı.
    const keyEntries = [...t.matchAll(KEYLIST_ENTRY_RE)];
    if (keyEntries.length >= 3 && /CEVAP ANAHTARI|^\s*\d/.test(t)) {
      push();
      sectionKey = new Map(
        keyEntries
          .filter((m) => /^[A-E]$/.test(m[2]))
          .map((m) => [m[1], m[2]]),
      );
      continue;
    }

    // LMS dökümü: "Soru 18" başlığı yeni soru açar (numara güvenilmez olabilir).
    const sm = SORU_HEADER_RE.exec(t);
    if (sm) {
      push();
      q = {
        page: line.page,
        no: sm[1],
        stem: sm[2] ?? '',
        options: [],
        answerLetter: null,
        explanation: null,
        yellowLetter: null,
        keyLetter: null,
      };
      part = 'stem';
      continue;
    }

    const qm = QNUM_RE.exec(t);
    // Yeni soru: satır BAŞINDA numara her zaman yeni blok açar. (Önceki
    // "stem içindeyken açma" guard'ı, şıkları farklı biçimli tek bir soru
    // yüzünden koca bölümleri yutuyordu — 952 blok vs ~2500 beklenti.)
    // Yıl yakalanmasın: "1923 - 1930 arası..." gibi satırlar için numara
    // ≤ 300 zaten; ayrıca cevap listesi satırları ("1. B") 2 şık şartına
    // takılıp elenir.
    if (qm) {
      push();
      q = {
        page: line.page,
        no: qm[1],
        stem: qm[2] ?? '',
        options: [],
        answerLetter: null,
        explanation: null,
        yellowLetter: null,
        keyLetter: null,
      };
      part = 'stem';
      continue;
    }
    if (!q) continue;

    const am = ANSWER_RE.exec(t);
    if (am && q.options.length >= 2) {
      q.answerLetter = am[1].toUpperCase();
      q.explanation = (am[2] ?? '').trim() || null;
      part = 'explanation';
      continue;
    }

    const om = OPTION_RE.exec(t);
    if (om && part !== 'explanation') {
      const label = om[1].toUpperCase();
      // Şıklar sıralı gelir (a→e); sırasız harf, metin içi "b)" yakalanmasıdır.
      const expected = 'ABCDE'[q.options.length];
      if (label === expected) {
        q.options.push({ label, text: om[2].trim(), yellow: line.yellow });
        if (line.yellow) q.yellowLetter = label;
        part = 'option';
        continue;
      }
    }

    // Devam satırları
    if (NOISE_RE.test(t)) continue;
    if (part === 'stem') q.stem += ' ' + t;
    else if (part === 'option') {
      const last = q.options[q.options.length - 1];
      last.text += ' ' + t;
      if (line.yellow && !q.yellowLetter) q.yellowLetter = last.label;
    } else if (part === 'explanation') q.explanation = ((q.explanation ?? '') + ' ' + t).trim();
  }
  push();
  return questions;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Kullanım: extract-derleme-pdf.ts <girdi.pdf> [cikti.xlsx]');
    process.exit(1);
  }
  const output =
    process.argv[3] ?? path.join(path.dirname(input), path.basename(input, '.pdf') + '-sorular.xlsx');

  console.log('PDF okunuyor…');
  const lines = await extractLines(input);
  console.log('satır:', lines.length, '| sarı satır:', lines.filter((l) => l.yellow).length);

  const questions = parseQuestions(lines);
  console.log('ayrıştırılan soru bloğu:', questions.length);

  // ── İç mükerrer BİRLEŞTİRME ── Derlemede aynı soru birçok bölümde tekrar
  // ediyor (769 kopyaya kadar). Kopyalar atlanmaz, SİNYALLERİ birleştirilir:
  // bir kopyada sarı işaret, diğerinde açıklama olabilir — ikisi de kazanılır.
  const byFp = new Map<string, ExtractedQuestion>();
  let dupCount = 0;
  for (const q of questions) {
    q.stem = q.stem.replace(/\s+/g, ' ').trim();
    for (const o of q.options) o.text = o.text.replace(/\s+/g, ' ').trim();
    if (q.explanation) q.explanation = q.explanation.replace(/\s+/g, ' ').trim();

    const fp = questionFingerprint(q.stem, q.options.map((o) => o.text));
    const prev = byFp.get(fp);
    if (!prev) {
      byFp.set(fp, q);
      continue;
    }
    dupCount++;
    prev.answerLetter ??= q.answerLetter;
    prev.yellowLetter ??= q.yellowLetter;
    prev.keyLetter ??= q.keyLetter;
    if (!prev.explanation && q.explanation) prev.explanation = q.explanation;
    // Kopyalar arası cevap çelişkisi ayrı işaretlenir (İncele'ye düşer).
    if (q.answerLetter && prev.answerLetter && q.answerLetter !== prev.answerLetter) {
      prev.copyConflict = q.answerLetter;
    }
  }

  // Cevap çözümü + kalite sınıflandırması.
  const ready: (ExtractedQuestion & { dogru: string })[] = [];
  const review: (ExtractedQuestion & { dogru: string | null; reason: string })[] = [];

  for (const q of byFp.values()) {

    // Cevap çözümü — güven sırası: soruya bitişik "Cevap" satırı > sarı
    // vurgu > bölüm anahtar listesi. Anahtar listesi numara eşleşmesine
    // dayandığı için bölümler arasında SIZABİLİR; soruya bitişik satır
    // varken anahtar çelişkisi dikkate alınmaz. Kalan gerçek çelişkiler
    // (satır↔sarı, sarı↔anahtar, kopyalar arası) İncele'ye düşer.
    if (q.answerLetter && q.keyLetter && !q.yellowLetter) q.keyLetter = null;
    const signals = [q.answerLetter, q.yellowLetter, q.keyLetter].filter(
      (s): s is string => s != null,
    );
    // Çoğunluk oylaması: 3 sinyalden ≥2'si aynıysa o harf kazanır (tek
    // aykırı sinyal — çoğunlukla bölüm anahtarı sızıntısı — düşürülür).
    const tally = new Map<string, number>();
    for (const sgl of signals) tally.set(sgl, (tally.get(sgl) ?? 0) + 1);
    const majority = [...tally.entries()].find(([, n]) => n >= 2)?.[0] ?? null;
    const conflicting = new Set(signals).size > 1 && !majority;
    const dogru = majority ?? q.answerLetter ?? q.yellowLetter ?? q.keyLetter;
    const allText = [q.stem, ...q.options.map((o) => o.text)].join(' ');

    if (q.options.length < 4) {
      review.push({ ...q, dogru, reason: `şık eksik (${q.options.length})` });
    } else if (q.stem.length < 15) {
      review.push({ ...q, dogru, reason: 'kök çok kısa' });
    } else if (isCorrupt(allText)) {
      review.push({ ...q, dogru, reason: 'bozuk metin (ti düşmesi olabilir)' });
    } else if (!dogru) {
      review.push({ ...q, dogru: null, reason: 'cevap işareti yok' });
    } else if (q.copyConflict && q.copyConflict !== dogru) {
      review.push({ ...q, dogru, reason: `kopyalar farklı cevap (${dogru} / ${q.copyConflict})` });
    } else if (conflicting) {
      review.push({
        ...q,
        dogru,
        reason: `cevap çelişkisi (${[q.answerLetter && `satır:${q.answerLetter}`, q.yellowLetter && `sarı:${q.yellowLetter}`, q.keyLetter && `anahtar:${q.keyLetter}`].filter(Boolean).join(' ')})`,
      });
    } else if (!q.options.some((o) => o.label === dogru)) {
      review.push({ ...q, dogru, reason: `cevap harfi (${dogru}) şıklarda yok` });
    } else {
      // Açıklama bozuksa açıklama düşer, soru kalır.
      if (q.explanation && isCorrupt(q.explanation)) q.explanation = null;
      ready.push({ ...q, dogru });
    }
  }

  // ── Kök bazlı çapraz kontrol ── Şık SIRASI farklı kopyalar parmak iziyle
  // birleşir ama küçük yazım farkları kaçabilir. Aynı köke sahip iki hazır
  // satır FARKLI doğru-METNİ gösteriyorsa (örn. Mareşal sorusu: Sakarya vs
  // Çanakkale — kaynağın kendi cevap hatası) ikisi de İncele'ye iner:
  // yanlış anahtar, eksik sorudan pahalıdır.
  const normStem = (s: string) =>
    s.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const byStem = new Map<string, (typeof ready)[number][]>();
  for (const r of ready) {
    const k = normStem(r.stem);
    byStem.set(k, [...(byStem.get(k) ?? []), r]);
  }
  for (const group of byStem.values()) {
    if (group.length < 2) continue;
    const answerTexts = new Set(
      group.map((r) =>
        normStem(r.options.find((o) => o.label === r.dogru)?.text ?? ''),
      ),
    );
    if (answerTexts.size > 1) {
      for (const r of group) {
        const i = ready.indexOf(r);
        if (i >= 0) ready.splice(i, 1);
        review.push({ ...r, reason: 'aynı soru farklı cevap (kaynak hatalı olabilir)' });
      }
    } else {
      // Aynı cevap — fazla kopyaları sessizce tekilleştir.
      for (const r of group.slice(1)) {
        const i = ready.indexOf(r);
        if (i >= 0) {
          ready.splice(i, 1);
          dupCount++;
        }
      }
    }
  }

  // Çapraz sinyal raporu: birden çok sinyali olup uyuşanlar (güven ölçüsü).
  const both = ready.filter(
    (q) => [q.answerLetter, q.yellowLetter, q.keyLetter].filter(Boolean).length > 1,
  );
  const conflict: typeof ready = []; // çelişenler artık İncele'de

  // ── XLSX ──
  const wb = new ExcelJS.Workbook();
  const header = ['soru', 'A', 'B', 'C', 'D', 'E', 'dogru', 'aciklama', 'zorluk'];
  const mk = (name: string, extra: string[] = []) => {
    const ws = wb.addWorksheet(name);
    ws.addRow([...header, ...extra]);
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.columns.forEach((c, i) => (c.width = i === 0 ? 70 : i === 7 ? 50 : i > 8 ? 28 : 22));
    return ws;
  };
  const wsReady = mk('Hazır');
  for (const q of ready) {
    const opt = (l: string) => q.options.find((o) => o.label === l)?.text ?? '';
    wsReady.addRow([q.stem, opt('A'), opt('B'), opt('C'), opt('D'), opt('E'), q.dogru, q.explanation ?? '', 'medium']);
  }
  const wsReview = mk('İncele', ['sebep', 'sayfa']);
  for (const q of review) {
    const opt = (l: string) => q.options.find((o) => o.label === l)?.text ?? '';
    wsReview.addRow([q.stem, opt('A'), opt('B'), opt('C'), opt('D'), opt('E'), q.dogru ?? '', q.explanation ?? '', 'medium', q.reason, q.page]);
  }
  await wb.xlsx.writeFile(output);

  console.log('──────────────────────────────');
  console.log('HAZIR      :', ready.length, `(Cevap satırından: ${ready.filter((x) => x.answerLetter).length}, sarıdan: ${ready.filter((x) => !x.answerLetter && x.yellowLetter).length}, açıklamalı: ${ready.filter((x) => x.explanation).length})`);
  console.log('İNCELE     :', review.length);
  const byReason = new Map<string, number>();
  for (const r of review) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  for (const [k, v] of byReason) console.log('   -', k, ':', v);
  console.log('İÇ MÜKERRER:', dupCount, '(atlandı)');
  console.log('çapraz sinyal: ikisi de olan', both.length, '| ÇELİŞEN', conflict.length);
  if (conflict.length > 0) {
    conflict.slice(0, 5).forEach((c) => console.log('   ! s', c.page, c.stem.slice(0, 50), '→ Cevap:', c.answerLetter, 'sarı:', c.yellowLetter));
  }
  console.log('çıktı:', output);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
