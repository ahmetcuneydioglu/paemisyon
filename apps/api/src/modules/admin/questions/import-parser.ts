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

/** Dosya (csv/xlsx) → doğrulanmış rapor. */
export async function parseImportFile(buffer: Buffer, filename: string): Promise<ParseReport> {
  const isXlsx =
    filename.toLowerCase().endsWith('.xlsx') ||
    (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b); // PK zip imzası
  const rows = isXlsx ? await parseXlsx(buffer) : parseCsv(buffer);
  return mapRows(rows);
}
