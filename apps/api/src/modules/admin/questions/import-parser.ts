import { createHash } from 'crypto';
import * as iconv from 'iconv-lite';
import * as Papa from 'papaparse';
import * as ExcelJS from 'exceljs';

/**
 * Toplu soru içe aktarma ayrıştırıcısı (Doc 9 §4.4). SAF fonksiyonlar — birim
 * test edilebilir. Türkiye gerçeği: TR Excel, CSV'yi noktalı virgül + Windows-1254
 * ile kaydeder; ikisine de tolerans gösterilir.
 *
 * Şablon sütunları: soru | A | B | C | D | E | dogru | aciklama | zorluk
 * (E ve aciklama/zorluk opsiyonel; başlık büyük/küçük harf duyarsız.)
 */

export interface ParsedQuestionRow {
  rowNo: number; // dosyadaki satır numarası (başlık dahil sayım, insan-dostu)
  stem: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { label: string; text: string; isCorrect: boolean }[];
}

export interface RowError {
  rowNo: number;
  message: string;
}

export interface ParseReport {
  totalRows: number;
  valid: ParsedQuestionRow[];
  errors: RowError[];
  /** PDF kitapçıktan otomatik saptanan kaynak etiketi (panel önerisi). */
  detectedSource?: string | null;
  /** Kitapçık kapağındaki konu sırası ve soru aralıkları. */
  detectedSections?: DetectedSectionRange[];
}

export interface DetectedSectionRange {
  name: string;
  questionCount: number;
  startRow: number;
  endRow: number;
}

/** Konu + eşleşme desenleri — suggestTopic girdisi (Doc 20). */
export interface TopicKeywordEntry {
  id: string;
  name: string;
  matchKeywords: string[];
  /** Keyword yoksa güvenli ad fallback'i için ders adı. */
  courseName?: string;
}

export interface TopicSuggestion {
  id: string;
  name: string;
  matchedKeyword: string;
}

/** TR-duyarlı küçük harf — "İYUK" ve "657 SAYILI" tutarlı eşleşsin. */
function trLower(s: string): string {
  return s.toLocaleLowerCase('tr-TR');
}

/**
 * İçerik eşleşmesi için metin normalizasyonu (Doc 20 EK 2). TR küçük harf +
 * tipografik birleştirme (kıvrık tırnak → düz, en/em-dash → tire, yumuşak tire
 * sil) + whitespace sıkıştırma. PDF çıkarımı gürültüsünü yener; noktalama
 * SİLİNMEZ (aşırı birleşmeyi önlemek için).
 */
function normalizeForHash(s: string): string {
  return trLower(s)
    .replace(/[‘’‛ʼ′]/g, "'") // ' ' ‛ ʼ ′ → '
    .replace(/[“”″]/g, '"') // " " ″ → "
    .replace(/[–—−]/g, '-') // – — − → -
    .replace(/­/g, '') // yumuşak tire
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Soru içerik parmak izi (Doc 20 EK 2) — tekrar tespiti için sha256.
 * Kök + ŞIK METİNLERİNİN SIRALI birleşimi; doğru cevap harfi ve şık sırası/
 * etiketleri DIŞLANIR. Böylece MEB A/B kitapçığındaki aynı soru (şıkları
 * karışık, doğru cevabı farklı harf) AYNI parmak izini üretir. Saf fonksiyon.
 */
export function questionFingerprint(stem: string, optionTexts: string[]): string {
  const normStem = normalizeForHash(stem);
  const normOpts = optionTexts.map(normalizeForHash).sort();
  return createHash('sha256').update(normStem + '\n' + normOpts.join('\n')).digest('hex');
}

/**
 * Soru kökünden kanun maddesi numarası çıkarır (Madde Atlası — Doc 25 §4).
 * Saf fonksiyon; kanun bilgisi konudan gelir, burada YALNIZ madde aranır.
 *
 * Yakalanan kalıplar (gerçek MEB/ÖDSGM kökleri):
 *  - "... Kanunu'nun 16'ncı maddesine göre", "16 ncı madde", "16. maddesi"
 *  - "madde 16", "Madde 4/A"
 *  - "m.16", "md. 16", "PVSK m. 16/2"
 *  - "ek madde 6" → "Ek 6", "geçici madde 2" → "Geçici 2", "Ek 1 inci madde"
 *
 * Normalizasyon: harf ekleri büyütülür ("4/a" → "4/A"); fıkra atılır
 * ("16/2" → "16" — bölü SONRASI rakamsa fıkradır, harfse ayrı maddedir).
 * Birden çok madde geçiyorsa İLK geçen kazanır (kök tipik tek maddeye dayanır).
 */
export function detectArticleNo(stem: string): string | null {
  const text = stem.replace(/[’‘‛ʼ′]/g, "'");
  // Sıra: özgülden genele. Her desen (no, tip) yakalar; ilk konum kazanır.
  const patterns: { re: RegExp; kind?: 'ek' | 'gecici' }[] = [
    // "ek madde 6" / "geçici madde 2" / "ek 1 inci madde"
    { re: /\bek\s+madde\s+(\d+[A-Za-zÇĞİÖŞÜçğıöşü]?)/giu, kind: 'ek' },
    { re: /\bgeçici\s+madde\s+(\d+)/giu, kind: 'gecici' },
    { re: /\bek\s+(\d+)\s*(?:'?\s*[iıuü]nc[iıuü])?\.?\s*madde/giu, kind: 'ek' },
    { re: /\bgeçici\s+(\d+)\s*(?:'?\s*[iıuü]nc[iıuü])?\.?\s*madde/giu, kind: 'gecici' },
    // "madde 16", "Madde 4/A"
    { re: /\bmadde\s+(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)/giu },
    // "16'ncı maddesi", "16 ncı madde", "16. madde", "16 üncü madde"
    {
      re: /\b(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)\s*(?:'?\s*(?:[iıuü]?nc[iıuü]))?\.?\s*madde/giu,
    },
    // "m.16", "md. 16"
    { re: /\bmd?\.\s*(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)/giu },
  ];

  let best: { index: number; value: string } | null = null;
  for (const { re, kind } of patterns) {
    for (const m of text.matchAll(re)) {
      const value = normalizeArticle(m[1], kind);
      if (value == null) continue;
      if (best === null || m.index! < best.index) {
        best = { index: m.index!, value };
      }
    }
  }
  return best?.value ?? null;
}

function normalizeArticle(raw: string, kind?: 'ek' | 'gecici'): string | null {
  let v = raw.trim();
  const slash = v.indexOf('/');
  if (slash >= 0) {
    const suffix = v.slice(slash + 1);
    // Bölü sonrası rakam = fıkra → at; harf = ayrı madde (4/A) → büyüt.
    v = /^\d+$/.test(suffix)
      ? v.slice(0, slash)
      : `${v.slice(0, slash)}/${suffix.toLocaleUpperCase('tr-TR')}`;
  }
  if (!/^\d/.test(v)) return null;
  if (kind === 'ek') return `Ek ${v}`;
  if (kind === 'gecici') return `Geçici ${v}`;
  return v;
}

/**
 * Soru kökünü konuların matchKeywords'lerine göre eşler (Doc 20 §2).
 * TÜM kökü tarar — kanun adı boşluk-doldurmalı soruda kökün sonunda geçebilir.
 * Birden çok eşleşmede EN UZUN keyword kazanır (en özgül konu). Yoksa null.
 * Saf fonksiyon: DB yok, birim test edilebilir.
 */
export function suggestTopic(
  stem: string,
  topics: TopicKeywordEntry[],
): TopicSuggestion | null {
  const hay = normalizeForMatch(stem);
  const compactHay = compactForAcronym(hay);
  let best: (TopicSuggestion & { score: number }) | null = null;
  for (const t of topics) {
    // Veritabanındaki açık anahtarlar önceliklidir. Eski/göç edilmiş konularda
    // liste boş olabildiği için konu ve ders adı daha düşük öncelikli fallback'tir.
    const candidates = [
      ...t.matchKeywords.map((value) => ({ value, explicit: true })),
      { value: t.name, explicit: false },
      ...(t.courseName ? [{ value: t.courseName, explicit: false }] : []),
    ];
    for (const { value, explicit } of candidates) {
      const needle = normalizeForMatch(value);
      if (needle.length === 0) continue;
      // C.M.K / CMK gibi kısa kısaltmalarda nokta ve boşlukları tamamen yok say.
      const compactNeedle = compactForAcronym(needle);
      const acronymMatch = compactNeedle.length >= 2 && compactNeedle.length <= 6
        && compactHay.includes(compactNeedle);
      if (!hay.includes(needle) && !acronymMatch) continue;

      // Uzun/özgül eşleşme kazanır; eşitlikte açık DB keyword'ü ad fallback'inden
      // üstündür. Bu, genel ders adlarının özel kanun anahtarını ezmesini önler.
      const score = compactNeedle.length * 2 + (explicit ? 1 : 0);
      if (best === null || score > best.score) {
        best = { id: t.id, name: t.name, matchedKeyword: value, score };
      }
    }
  }
  if (!best) return null;
  const { score: _score, ...suggestion } = best;
  return suggestion;
}

/**
 * Kitapçık kapağından gelen bölüm adını modüldeki güvenli varsayılan konuya
 * eşler. Açık konu adı önceliklidir; ders tek konuluysa o konu kullanılır.
 * Çok kanunlu "Polis Mevzuatı" gibi derslerde genel bir konu uydurulmaz.
 */
export function suggestTopicFromSection(
  sectionName: string,
  topics: TopicKeywordEntry[],
): TopicSuggestion | null {
  const section = normalizeForMatch(sectionName);
  if (!section) return null;

  const courseTopics = topics.filter((topic) => {
    if (!topic.courseName) return false;
    const course = normalizeForMatch(topic.courseName);
    return course === section || course.includes(section) || section.includes(course);
  });
  if (courseTopics.length === 0) return null;

  const byKeywordRichness = (a: TopicKeywordEntry, b: TopicKeywordEntry) =>
    b.matchKeywords.length - a.matchKeywords.length;
  const exact = courseTopics
    .filter((topic) => normalizeForMatch(topic.name) === section)
    .sort(byKeywordRichness)[0];
  const contained = courseTopics
    .filter((topic) => {
      const name = normalizeForMatch(topic.name);
      return name.length >= 5 && (section.includes(name) || name.includes(section));
    })
    .sort((a, b) => {
      const lengthDiff = Math.abs(normalizeForMatch(a.name).length - section.length)
        - Math.abs(normalizeForMatch(b.name).length - section.length);
      return lengthDiff || byKeywordRichness(a, b);
    })[0];
  const target = exact ?? contained ?? (courseTopics.length === 1 ? courseTopics[0] : null);
  return target
    ? { id: target.id, name: target.name, matchedKeyword: `Bölüm planı: ${sectionName}` }
    : null;
}

/**
 * Resmî bölüm planı varsa onu ders sınırı kabul eder. Keyword aynı ders içinde
 * daha özel bir konu bulduysa korunur; başka derse taşıyorsa bölüm hedefi kazanır
 * (örn. Genel Kültür aralığındaki Atatürk sözü İnkılap'a kaçmamalı).
 */
export function suggestTopicForRow(
  stem: string,
  sectionName: string | null,
  topics: TopicKeywordEntry[],
): TopicSuggestion | null {
  const keywordSuggestion = suggestTopic(stem, topics);
  const sectionSuggestion = sectionName
    ? suggestTopicFromSection(sectionName, topics)
    : null;
  if (!sectionSuggestion) return keywordSuggestion;
  if (!keywordSuggestion) return sectionSuggestion;

  const keywordCourse = topics.find((topic) => topic.id === keywordSuggestion.id)?.courseName;
  const sectionCourse = topics.find((topic) => topic.id === sectionSuggestion.id)?.courseName;
  return keywordCourse && sectionCourse && keywordCourse === sectionCourse
    ? keywordSuggestion
    : sectionSuggestion;
}

/** Sınıflandırma eşleşmesi: noktalama biçimi semantiği değiştirmez. */
function normalizeForMatch(s: string): string {
  return trLower(s)
    .replace(/[‘’‛ʼ′]/g, "'")
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactForAcronym(s: string): string {
  return s.replace(/\s+/g, '');
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

const DIFFICULTY_MAP: Record<string, 'easy' | 'medium' | 'hard'> = {
  kolay: 'easy',
  orta: 'medium',
  zor: 'hard',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  '': 'medium',
};

/** Türkçe duyarlı başlık normalizasyonu: 'DOĞRU' → 'dogru', ' Açıklama ' → 'aciklama'. */
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

/** Byte içeriğini metne çevirir: UTF-8 (BOM'lu/BOM'suz) → değilse Windows-1254 (TR Excel). */
export function decodeText(buffer: Buffer): string {
  let buf = buffer;
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3); // UTF-8 BOM
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return iconv.decode(buf, 'windows-1254');
  }
}

/** CSV'yi hücre matrisine çevirir (ayraç otomatik: , veya ;). */
export function parseCsv(buffer: Buffer): string[][] {
  const text = decodeText(buffer);
  const result = Papa.parse<string[]>(text.trim(), {
    delimitersToGuess: [';', ',', '\t'],
    skipEmptyLines: true,
  });
  return result.data.map((row) => row.map((c) => (c ?? '').toString()));
}

/** XLSX'i hücre matrisine çevirir (ilk sayfa). */
export async function parseXlsx(buffer: Buffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    // 1-indexed; values dizisinin 0'ı boştur.
    for (let c = 1; c <= row.cellCount; c++) {
      const v = row.getCell(c).value;
      cells.push(v == null ? '' : typeof v === 'object' && 'richText' in (v as object)
        ? (v as { richText: { text: string }[] }).richText.map((t) => t.text).join('')
        : String((v as { result?: unknown }).result ?? v));
    }
    rows.push(cells);
  });
  return rows;
}

/** Hücre matrisini doğrulanmış soru satırlarına çevirir. */
export function mapRows(rows: string[][]): ParseReport {
  if (rows.length === 0) {
    return { totalRows: 0, valid: [], errors: [{ rowNo: 0, message: 'Dosya boş.' }] };
  }

  // Başlık satırını bul (ilk 3 satırda "soru" içeren satır).
  const headerIdx = rows.findIndex(
    (r, i) => i < 3 && r.some((c) => normalizeHeader(c) === 'soru'),
  );
  if (headerIdx === -1) {
    return {
      totalRows: rows.length,
      valid: [],
      errors: [
        {
          rowNo: 1,
          message:
            "Başlık satırı bulunamadı. İlk satır şu sütunları içermeli: soru, A, B, C, D, (E), dogru, (aciklama), (zorluk). Şablonu indirip kullanabilirsin.",
        },
      ],
    };
  }

  const header = rows[headerIdx].map(normalizeHeader);
  const col = (name: string) => header.indexOf(name);
  const stemCol = col('soru');
  const correctCol = col('dogru');
  const explanationCol = col('aciklama');
  const difficultyCol = col('zorluk');
  const optionCols = OPTION_LABELS.map((l) => ({ label: l, idx: col(normalizeHeader(l)) }));

  if (correctCol === -1) {
    return {
      totalRows: rows.length - headerIdx - 1,
      valid: [],
      errors: [{ rowNo: headerIdx + 1, message: "'dogru' sütunu zorunlu (doğru şıkkın harfi: A-E)." }],
    };
  }

  const valid: ParsedQuestionRow[] = [];
  const errors: RowError[] = [];
  const dataRows = rows.slice(headerIdx + 1);

  dataRows.forEach((row, i) => {
    const rowNo = headerIdx + i + 2; // insan-dostu satır no (1-tabanlı + başlık)
    const cell = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

    const stem = cell(stemCol);
    if (stem.length === 0) return; // tamamen boş satırı sessizce atla
    if (stem.length < 5) {
      errors.push({ rowNo, message: 'Soru kökü çok kısa (en az 5 karakter).' });
      return;
    }

    const options = optionCols
      .map((o) => ({ label: o.label, text: cell(o.idx) }))
      .filter((o) => o.text.length > 0);
    if (options.length < 2) {
      errors.push({ rowNo, message: 'En az 2 dolu şık (A, B, …) gerekli.' });
      return;
    }
    // Şıklar A'dan itibaren boşluksuz ilerlemeli (A,B,D olmaz — D'nin yeri belirsiz).
    const expectedLabels = OPTION_LABELS.slice(0, options.length);
    if (!options.every((o, j) => o.label === expectedLabels[j])) {
      errors.push({ rowNo, message: 'Şıklar sıralı dolmalı (A ve B boşken D dolamaz).' });
      return;
    }

    const correctRaw = normalizeHeader(cell(correctCol)).toUpperCase();
    const correctLabel = correctRaw.charAt(0);
    if (!options.some((o) => o.label === correctLabel)) {
      errors.push({
        rowNo,
        message: `'dogru' sütunu dolu şıklardan birinin harfi olmalı (${options.map((o) => o.label).join('/')}). Bulunan: '${cell(correctCol)}'.`,
      });
      return;
    }

    const diffRaw = normalizeHeader(cell(difficultyCol));
    const difficulty = DIFFICULTY_MAP[diffRaw];
    if (difficulty === undefined) {
      errors.push({ rowNo, message: `Zorluk 'kolay/orta/zor' olmalı. Bulunan: '${cell(difficultyCol)}'.` });
      return;
    }

    valid.push({
      rowNo,
      stem,
      explanation: cell(explanationCol) || null,
      difficulty,
      options: options.map((o) => ({ ...o, isCorrect: o.label === correctLabel })),
    });
  });

  return { totalRows: dataRows.length, valid, errors };
}

// ─────────────────────────────────────────────
// MEB/ÖDSGM soru kitapçığı PDF'i (resmî sınav kitapçığı formatı)
// ─────────────────────────────────────────────

const ODSGM_HEADER = 'ÖLÇME, DEĞERLENDİRME VE SINAV HİZMETLERİ';
const KEY_TITLE = 'CEVAP ANAHTARI';
const QNUM_RE = /^(\d{1,3})\.\s+/;
const KEY_LINE_RE = /^(\d{1,3})\.\s*([A-E])\s*$/;
const CODE_QNUM_RE = /^\((\d{3,12})\)\s*$/;
const CODE_KEY_LINE_RE = /^\((\d{3,12})\)\s*([A-E])\s*$/;

interface OptionSegment {
  label: string;
  text: string;
}

/**
 * PDF motoru kısa şıkları aynı satırda döndürebilir:
 *   "A) Ocak\tB) Mart" veya "C) Mayıs   D) Eylül"
 * Satır başındaki ve tab/iki+ boşlukla ayrılan tüm şıkları çıkarır. Tek boşluğu
 * ayraç saymayarak seçenek metnindeki olağan "B)" benzeri kullanımlara karşı
 * gereksiz bölünmeyi sınırlar.
 */
export function parseBookletOptionLine(line: string): OptionSegment[] {
  // Satır zaten bir şıkla başlıyorsa PDF motorunun tek boşluğa indirdiği
  // devam işaretlerini de kabul et ("C) Kırk beş D) Altmış"). Şıkla
  // başlamayan olağan metinde ise yanlış pozitifleri önlemek için eski
  // tab/iki+ boşluk eşiği korunur.
  const marker = /^[A-E]\)\s*/.test(line)
    ? /(?:^|\s+)([A-E])\)\s*/g
    : /(?:^|\t+| {2,})([A-E])\)\s*/g;
  const matches = [...line.matchAll(marker)];
  if (matches.length === 0) return [];

  return matches.map((match, index) => ({
    label: match[1],
    text: line
      .slice(match.index! + match[0].length, matches[index + 1]?.index ?? line.length)
      .trim(),
  }));
}

/**
 * Kapaktaki "KONULAR / SORU SAYISI" tablosunu ardışık soru aralıklarına
 * dönüştürür. Toplam, ayrıştırılan soru sayısıyla uyuşmuyorsa güvenlik için
 * sonuç kullanılmaz.
 */
export function detectBookletSections(
  pageTexts: string[],
  totalRows: number,
): DetectedSectionRange[] {
  const cover = pageTexts.find((text) => text.includes('KONULAR') && text.includes('SORU SAYISI'));
  if (!cover) return [];
  const lines = cover.split('\n').map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => line.includes('KONULAR') && line.includes('SORU SAYISI'));
  if (headerIndex === -1) return [];

  const found: { name: string; questionCount: number }[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const match = /^(.+?)\s+(\d{1,3})$/.exec(line);
    if (!match || /^\d+$/.test(match[1].trim())) continue;
    const questionCount = Number(match[2]);
    if (questionCount <= 0 || questionCount > totalRows) continue;
    found.push({ name: match[1].trim(), questionCount });
  }
  if (found.length === 0 || found.reduce((sum, row) => sum + row.questionCount, 0) !== totalRows) {
    return [];
  }

  let startRow = 1;
  return found.map((row) => {
    const range = { ...row, startRow, endRow: startRow + row.questionCount - 1 };
    startRow = range.endRow + 1;
    return range;
  });
}

/** Satır sonu tirelerini onarır ("sayıl-\nmamıştır" → "sayılmamıştır"). */
export function dehyphenate(text: string): string {
  return text
    .replace(/-\s*\n\s*/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface BookletQuestion {
  no: number;
  /** Cevap anahtarındaki kimlik: klasik kitapçıkta "1", e-sınavda "130383". */
  answerKeyId: string;
  stem: string;
  options: Map<string, string>;
}

export function parseBookletAnswerKeyLine(
  line: string,
): { id: string; answer: string } | null {
  const match = KEY_LINE_RE.exec(line) ?? CODE_KEY_LINE_RE.exec(line);
  return match ? { id: match[1], answer: match[2] } : null;
}

export function parseBookletQuestionCode(line: string): string | null {
  return CODE_QNUM_RE.exec(line)?.[1] ?? null;
}

/**
 * Resmî kitapçık PDF'ini rapora çevirir (Doc 9 §4.4 genişletmesi).
 * Kurallar Python prototipinde gerçek kitapçıkla doğrulandı:
 * - Yalnız ÖDSGM üstbilgili sayfalar soru sayfasıdır (kapak talimatlarındaki
 *   "1. Adaylar..." maddeleri soru sanılmaz — ilk denemede yakalanan hata).
 * - Cevap anahtarı son sayfalardaki "CEVAP ANAHTARI" bölümünden eşlenir.
 * - Soru başı, BEKLENEN sıra numarasıyla doğrulanır (gövdedeki "5. madde"
 *   gibi metinler yeni soru başlatamaz).
 * Görsel/tablolu sorular (şıkları metinden çıkmayan) hata satırı olur —
 * skipErrors ile atlanıp kalanlar aktarılabilir.
 */
/** Regex özel karakterlerini kaçır (kitapçık adı deseni için). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Kitapçık adını ilk ÖDSGM'li sayfanın üstbilgisinden saptar
 * (örn. "ZABIT KÂTİBİ A"). İlk 3 satırdan kurum adı ve sayfa numarası
 * olmayanı seçer; sonuna yapışmış sayfa numarası varsa kırpar.
 */
export function detectBookletTitle(pageTexts: string[]): string | null {
  const candidates: string[] = [];
  for (const page of pageTexts.filter((text) => text.includes(ODSGM_HEADER))) {
    const lines = page
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
    for (const line of lines) {
      if (line.includes(ODSGM_HEADER) || /^\d{1,3}$/.test(line)) continue;
      const title = line.replace(/\s*\d{1,3}$/, '').trim();
      if (title.length >= 3 && title.length <= 80) candidates.push(title);
    }
  }

  const frequency = new Map<string, number>();
  for (const title of candidates) {
    const key = title.replace(/\s+/g, ' ');
    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  }

  for (const title of candidates) {
    // Bazı resmî başlıklar sıra sayısıyla başlar ("8. DÖNEM ... A").
    // Bu nedenle yalnız QNUM_RE ile elemek, başlığı soru sanıp her sayfanın
    // son E şıkkına sızdırır. Kitapçık türü harfi + başlık sinyalini
    // birlikte arayarak gerçek soru satırlarını dışlarız.
    const hasBookletType = /\s[A-E]$/u.test(title);
    const hasHeadingSignal =
      !QNUM_RE.test(title) || /\b(?:DÖNEM|EĞİTİMİ|SINAVI|KİTAPÇIĞI|TESTİ)\b/iu.test(title);
    // E-sınav kitapçıklarında A/B türü olmayabilir. İlk satırlarda iki+
    // soru sayfasında aynen tekrarlanan metin de güvenli kitapçık başlığıdır.
    const isRepeatedHeader = (frequency.get(title.replace(/\s+/g, ' ')) ?? 0) >= 2;
    if ((hasBookletType && hasHeadingSignal) || isRepeatedHeader) {
      return title;
    }
  }
  return null;
}

/** Kitapçık başlığını tab/boşluk farklarına toleranslı biçimde söker. */
export function stripBookletTitle(text: string, title: string): string {
  const flexibleTitle = title
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join('\\s+');
  const titleRe = new RegExp(`\\s*${flexibleTitle}(?:\\s*\\d{1,3})?`, 'gu');
  const cleaned = text.replace(titleRe, ' ');
  // Başlık yoksa satırı byte-düzeyinde koru: iki+ boşluk, PDF'de yan yana
  // basılan "A) ...   B) ..." şıklarının anlamlı ayıracıdır.
  return cleaned === text ? text : cleaned.replace(/\s{2,}/g, ' ').trim();
}

export async function parseBookletPdf(buffer: Buffer): Promise<ParseReport> {
  // pdf-parse'ı tembel yükle — CSV/XLSX yolu PDF motorunu hiç ödemesin.
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();

  const questionLines: string[] = [];
  const answerKey = new Map<string, string>();
  const sourceLines: string[] = [];
  let inKey = false;

  // Kitapçık adı ("ZABIT KÂTİBİ A" gibi) HER sayfanın üstbilgisinde tekrar
  // eder ve pdf-parse bunu bazen içerik satırına YAPIŞTIRIR ("...konabilir.
  // ZABIT KÂTİBİ A") — satır-bazlı filtre yakalayamaz; soru metnine sızıp
  // hem içeriği kirletir hem parmak izini bozar (canlıda yakalanan hata).
  // İlk ÖDSGM'li sayfanın üstbilgisinden adı sapta, her yerden sök.
  const bookletTitle = detectBookletTitle(result.pages.map((p) => p.text ?? ''));

  for (const page of result.pages) {
    const text = page.text ?? '';
    const pageHasKey = text.includes(KEY_TITLE);
    if (!inKey && !pageHasKey && !text.includes(ODSGM_HEADER)) continue;

    for (const raw of text.split('\n')) {
      let line = raw.trim();
      if (!line) continue;
      if (line.includes(KEY_TITLE)) {
        inKey = true;
        continue;
      }
      if (inKey || pageHasKey) {
        const keyEntry = parseBookletAnswerKeyLine(line);
        if (keyEntry) {
          inKey = true;
          answerKey.set(keyEntry.id, keyEntry.answer);
        } else if (!inKey) {
          // Anahtar sayfasının başlık satırları → kaynak etiketi adayı
          // (örn. "30 KASIM 2025 TARİHİNDE YAPILAN ... SINAVI").
          sourceLines.push(line);
        }
        continue;
      }
      // Kitapçık adını (yapışık geldiği yerler dahil) sök, SONRA üstbilgi
      // denetimleri: kurum adı, yalnız sayfa numarası.
      if (bookletTitle) line = stripBookletTitle(line, bookletTitle);
      if (!line || line.includes(ODSGM_HEADER) || /^\d{1,3}$/.test(line)) continue;
      line = line
        .replace(/\s*TEST BİTTİ\..*$/, '')
        .replace(/\s*CEVAPLARINIZI KONTROL EDİNİZ\..*$/, '');
      if (line) questionLines.push(line);
    }
  }

  // ── Satırları soru bloklarına böl ──
  const questions: BookletQuestion[] = [];
  let current: BookletQuestion | null = null;
  let part: string | null = null; // 'stem' | 'A'..'E'
  let expectedNo = 1;
  for (const line of questionLines) {
    const questionCode = parseBookletQuestionCode(line);
    if (questionCode && answerKey.has(questionCode)) {
      if (current) questions.push(current);
      current = {
        no: expectedNo,
        answerKeyId: questionCode,
        stem: '',
        options: new Map(),
      };
      part = 'stem';
      expectedNo++;
      continue;
    }
    const qm = QNUM_RE.exec(line);
    if (qm && Number(qm[1]) === expectedNo) {
      if (current) questions.push(current);
      current = {
        no: expectedNo,
        answerKeyId: qm[1],
        stem: line.replace(QNUM_RE, ''),
        options: new Map(),
      };
      part = 'stem';
      expectedNo++;
      continue;
    }
    if (!current) continue;
    const optionSegments = parseBookletOptionLine(line);
    if (optionSegments.length > 0) {
      for (const option of optionSegments) {
        part = option.label;
        current.options.set(option.label, option.text);
      }
      continue;
    }
    if (part === 'stem') current.stem += '\n' + line;
    else if (part) current.options.set(part, current.options.get(part)! + '\n' + line);
  }
  if (current) questions.push(current);

  // ── Rapora dönüştür (rowNo = kitapçıktaki soru numarası) ──
  const valid: ParsedQuestionRow[] = [];
  const errors: RowError[] = [];
  for (const q of questions) {
    const opts = [...q.options.entries()]
      .map(([label, text]) => ({ label, text: dehyphenate(text) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const correct = answerKey.get(q.answerKeyId);
    if (!correct) {
      errors.push({ rowNo: q.no, message: `Soru ${q.no}: cevap anahtarında karşılığı yok.` });
      continue;
    }
    const expectedLabels = OPTION_LABELS.slice(0, opts.length);
    if (opts.length < 4 || !opts.every((o, i) => o.label === expectedLabels[i])) {
      const found = opts.length > 0 ? opts.map((o) => o.label).join('/') : 'hiçbiri';
      errors.push({
        rowNo: q.no,
        message: `Soru ${q.no}: şıklar metinden tam çıkarılamadı (bulunan: ${found}; PDF yerleşimi, görsel veya tablo kaynaklı olabilir) — elle ekle.`,
      });
      continue;
    }
    if (!opts.some((o) => o.label === correct)) {
      errors.push({ rowNo: q.no, message: `Soru ${q.no}: doğru şık '${correct}' dolu şıklar arasında yok.` });
      continue;
    }
    valid.push({
      rowNo: q.no,
      stem: dehyphenate(q.stem),
      explanation: null, // kaynak metinden açıklama KOPYALANMAZ — editoryal yazılır
      difficulty: 'medium',
      options: opts.map((o) => ({ ...o, isCorrect: o.label === correct })),
    });
  }

  // Kaynak önerisi: "... TARİHİNDE YAPILAN <kurum> <sınav>" satırları.
  const detectedSource =
    sourceLines.length > 0
      ? dehyphenate(sourceLines.join(' ')).replace(/\s*SORU KİTAPÇIĞI.*$/i, '').trim() || null
      : null;

  const detectedSections = detectBookletSections(
    result.pages.map((page) => page.text ?? ''),
    questions.length,
  );

  return { totalRows: questions.length, valid, errors, detectedSource, detectedSections };
}

/** Dosya (csv/xlsx/pdf) → doğrulanmış rapor. */
export async function parseImportFile(buffer: Buffer, filename: string): Promise<ParseReport> {
  const isPdf =
    filename.toLowerCase().endsWith('.pdf') ||
    (buffer.length >= 4 && buffer.subarray(0, 4).toString('latin1') === '%PDF');
  if (isPdf) return parseBookletPdf(buffer);
  const isXlsx =
    filename.toLowerCase().endsWith('.xlsx') ||
    (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b); // PK zip imzası
  const rows = isXlsx ? await parseXlsx(buffer) : parseCsv(buffer);
  return mapRows(rows);
}
