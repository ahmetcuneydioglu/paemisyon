/**
 * Paemisyon -> Telegram questions.json disa aktarma
 *
 * Calistirma (Paemisyon proje kokunde):
 *   npx tsx scripts/export-telegram.ts
 *
 * Ciktilar:
 *   telegram-export/questions.json   -> poster.py'nin okudugu dosya
 *   telegram-export/rapor.txt        -> atlanan ve kisaltilan sorularin listesi
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

// ── Ayarlar ────────────────────────────────────────────────────────────────
const OUT_DIR = "telegram-export";
const ONLY_FREE_TOPICS = true;   // true: premium konulari disarida birak
const EXAM_TYPE_KEY: string | null = null; // ornek: "paem" — null ise hepsi
const MAX_QUESTIONS: number | null = null; // ornek: 200 — null ise hepsi

// Telegram Bot API sinirlari
const MAX_STEM = 300;
const MAX_OPTION = 100;
const MAX_EXPLANATION = 200;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 12;
const MAX_MESSAGE = 4096;

// ── Yardimcilar ────────────────────────────────────────────────────────────

/** HTML temizler ama SATIR SONLARINI KORUR — onculler alt alta kalsin diye. */
function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")        // yatay bosluklari sadelestir
    .replace(/ *\n */g, "\n")       // satir basi/sonu bosluklarini at
    .replace(/\n{3,}/g, "\n\n")     // ucten fazla bos satir olmasin
    .trim();
}

/**
 * "I. ... II. ... III. ..." bicimindeki onculleri alt alta getirir.
 * Guvenlik: en az IKI Roma rakami isareti yoksa hicbir sey yapmaz —
 * metinde tek basina gecen "V." gibi kisaltmalari bozmamak icin.
 */
const ROMAN = /\b(I{1,3}|IV|V|VI{0,3}|IX|X)\.(?=\s)/g;

function splitPremises(s: string): string {
  const marks = s.match(ROMAN);
  if (!marks || marks.length < 2) return s;

  // Her Roma rakamindan once satir kir (metnin en basindaki haric)
  let out = s.replace(/([^\n])\s+(?=\b(?:I{1,3}|IV|V|VI{0,3}|IX|X)\.\s)/g, "$1\n");

  // Son oncul ile asil soru cumlesi genelde bitisik kalir; ayirmayi dene
  out = out.replace(
    /([.:;])\s+((?:[A-ZÇĞİÖŞÜ0-9][^\n]{0,80}?)?(?:gore|göre|hangisi|hangileri)\b)/,
    "$1\n\n$2"
  );

  return out;
}

/** Once cumle sonunda, olmazsa kelime sinirinda kirpar. */
function truncate(s: string, limit: number): string {
  if (s.length <= limit) return s;

  // 1) Tam cumle sinirinda bitir — yarim kalmis cumle birakmaz
  const window = s.slice(0, limit);
  const lastStop = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! ")
  );
  if (lastStop > limit * 0.5) return window.slice(0, lastStop + 1).trim();

  // 2) Olmadi, kelime sinirinda kes
  const cut = s.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

type Report = { skipped: string[]; truncated: string[] };

// ── Ana akis ───────────────────────────────────────────────────────────────

async function main() {
  const rows = await prisma.question.findMany({
    where: {
      deletedAt: null,
      currentVersionId: { not: null },
      currentVersion: { status: "published" },
      ...(ONLY_FREE_TOPICS ? { topic: { isPremium: false } } : {}),
      ...(EXAM_TYPE_KEY
        ? {
            topic: {
              ...(ONLY_FREE_TOPICS ? { isPremium: false } : {}),
              course: {
                sections: { some: { section: { examType: { key: EXAM_TYPE_KEY } } } },
              },
            },
          }
        : {}),
    },
    include: {
      currentVersion: {
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          legalReferences: true,
        },
      },
      topic: {
        include: { course: true, legislation: true },
      },
    },
    ...(MAX_QUESTIONS ? { take: MAX_QUESTIONS } : {}),
  });

  console.log(`Veritabanindan ${rows.length} yayinda soru cekildi.`);

  const out: any[] = [];
  const report: Report = { skipped: [], truncated: [] };
  let labelMode = 0;

  for (const q of rows) {
    const v = q.currentVersion!;
    const short = q.id.slice(0, 8);

    // ── soru metni
    const stem = splitPremises(stripHtml(v.stem));
    if (!stem) {
      report.skipped.push(`${short}: soru metni bos`);
      continue;
    }

    // ── siklar
    const opts = v.options;
    if (opts.length < MIN_OPTIONS || opts.length > MAX_OPTIONS) {
      report.skipped.push(`${short}: sik sayisi ${opts.length}`);
      continue;
    }

    const texts = opts.map((o) => stripHtml(o.text));
    const emptyIdx = texts.findIndex((t) => t.length === 0);
    if (emptyIdx !== -1) {
      report.skipped.push(`${short}: ${emptyIdx + 1}. sik bos`);
      continue;
    }

    // 100 karakteri asan sik ATLANMAZ: poster.py harf moduna gecer,
    // tam sik metinlerini poll oncesi mesaja yazar. Sadece on mesajin
    // 4096 karakteri asmadigindan emin oluyoruz.
    const needsLabels = texts.some((t) => t.length > MAX_OPTION);
    if (needsLabels || stem.length > MAX_STEM) {
      const preambleLen =
        stem.length + texts.reduce((a, t) => a + t.length + 5, 0) + 40;
      if (preambleLen > MAX_MESSAGE) {
        report.skipped.push(`${short}: on mesaj ~${preambleLen} karakter (max ${MAX_MESSAGE})`);
        continue;
      }
      if (needsLabels) labelMode++;
    }

    // ── dogru cevap: is_correct olan sikkin sort_order sirasindaki indeksi
    const correctIdxs = opts
      .map((o, i) => (o.isCorrect ? i : -1))
      .filter((i) => i !== -1);

    if (correctIdxs.length !== 1) {
      report.skipped.push(
        `${short}: ${correctIdxs.length} adet dogru sik isaretli (1 olmali)`
      );
      continue;
    }
    const correctIndex = correctIdxs[0];

    // ── kategori: once kanun kisaltmasi, sonra konu, sonra ders
    const leg = q.topic.legislation;
    const category =
      leg?.shortName?.trim() ||
      leg?.number?.trim() ||
      q.topic.name?.trim() ||
      q.topic.course?.name?.trim() ||
      undefined;

    // ── aciklama: 200 karakteri asarsa once atif, olmazsa kirp
    // TAM metni yaziyoruz. poster.py poll icin 200'e kirpar, tam halini
    // poll'un altina spoiler mesaj olarak gonderir.
    let explanation: string | undefined;
    const raw = stripHtml(v.explanation ?? "");
    const citation = v.legalReferences[0]?.citation?.trim();

    if (raw) {
      explanation = raw;
      if (raw.length > MAX_EXPLANATION) {
        report.truncated.push(`${short}: aciklama ${raw.length} krk -> spoiler mesaj`);
      }
    } else if (citation) {
      explanation = citation;
    }

    out.push({
      id: q.id,
      ...(category ? { category } : {}),
      question: stem,
      options: texts,
      correct_option_id: correctIndex,
      ...(explanation ? { explanation } : {}),
    });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "questions.json"),
    JSON.stringify(out, null, 2),
    "utf-8"
  );

  const reportText = [
    `Toplam cekilen: ${rows.length}`,
    `Aktarilan:      ${out.length}`,
    `Atlanan:        ${report.skipped.length}`,
    `Spoiler mesajli: ${report.truncated.length}`,
    `Harf modu:      ${labelMode}`,
    "",
    "── ATLANANLAR ──",
    ...report.skipped,
    "",
    "── ACIKLAMASI SPOILER MESAJA TASINANLAR ──",
    ...report.truncated,
  ].join("\n");

  writeFileSync(join(OUT_DIR, "rapor.txt"), reportText, "utf-8");

  const longStems = out.filter((q) => q.question.length > MAX_STEM).length;

  console.log(`\nAktarilan: ${out.length}`);
  console.log(`Atlanan:   ${report.skipped.length}`);
  console.log(`200 krk asan aciklama: ${report.truncated.length} (spoiler mesaj olarak gider)`);
  console.log(`300 karakteri asan soru: ${longStems} (on mesaj olarak gider)`);
  console.log(`Harf moduna gececek soru: ${labelMode} (uzun sik)`);
  console.log(`\nDosyalar: ${OUT_DIR}/questions.json ve ${OUT_DIR}/rapor.txt`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
