#!/usr/bin/env node
/**
 * Token kapısı (Doc 49/11 §2.1): apps/web/src içinde
 *  - ham hex renk (#rrggbb / #rgb) → HATA. Tek istisna satır içi işaret:
 *    `tokens-check: izin — <gerekçe>` (logo, Google "G", lig madalya rengi — tema
 *    token'ı olmayan marka/üçüncü taraf renkleri). Dosya bazlı izin listesi yok (W-F).
 *  - v2 `--tk-` değişkeni → HATA (W-F'de köprü silindi)
 *  - miras/geçiş adları (navy, brand, session/live/streak/atlas, font-heading,
 *    rounded-sm/md/lg, tk-scope, tk-caption, Tailwind hazır paleti) → HATA.
 *   node scripts/tokens-check.mjs            (strict: her bulgu hata; CI bunu koşar)
 *   node scripts/tokens-check.mjs --lax      (geçiş adlarını yalnız sayar; yerel keşif)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
const strict = !process.argv.includes("--lax");
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(n)) files.push(p);
  }
})(ROOT);

const HEX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
/* Tailwind hazır paleti (red-500, slate-900, …): renk yalnız token'dan. */
const HAZIR_PALET =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
const TK = /--tk-[a-z-]+/g;
const GECIS = [
  /\b(?:bg|text|border|ring|from|to)-(?:navy|brand|session|live|streak|atlas|grey-bg)\b/g,
  /\bfont-heading\b/g,
  /\brounded-(?:sm|md|lg)\b/g,
  /\btk-(?:scope|caption)\b/g, // tk-interactive v3 geçiş yardımcısı olarak kalır
  /\btext-text\b|\bborder-border\b|\bshadow-card\b/g,
];
const hatalar = [];
const gecis = new Map();
for (const f of files) {
  const rel = relative(ROOT, f);
  const src = readFileSync(f, "utf8");
  for (const line of src.split("\n").entries()) {
    const [i, t] = line;
    if (t.includes("tokens-check: izin")) continue;
    for (const m of t.matchAll(HEX))
      hatalar.push(`${rel}:${i + 1} ham hex ${m[0]}`);
    for (const m of t.matchAll(TK))
      hatalar.push(`${rel}:${i + 1} v2 değişkeni ${m[0]}`);
    if (!rel.endsWith(".css"))
      for (const m of t.matchAll(HAZIR_PALET))
        gecis.set(m[0], (gecis.get(m[0]) ?? 0) + 1);
  }
  if (!rel.endsWith(".css")) {
    for (const re of GECIS)
      for (const m of src.matchAll(re))
        gecis.set(m[0], (gecis.get(m[0]) ?? 0) + 1);
  }
}
const gecisToplam = [...gecis.values()].reduce((a, b) => a + b, 0);
console.log(
  `tokens-check: ${files.length} dosya; hata ${hatalar.length}; geçiş adı ${gecisToplam}`,
);
for (const h of hatalar) console.log("  ✗ " + h);
if (gecisToplam) {
  const top = [...gecis].sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log(
    `  ${strict ? "✗ " : ""}geçiş adları: ` + top.map(([k, v]) => `${k}×${v}`).join(", "),
  );
  if (strict)
    for (const f of files) {
      const rel = relative(ROOT, f);
      if (rel.endsWith(".css")) continue;
      const src = readFileSync(f, "utf8");
      const hits = [...GECIS, HAZIR_PALET].flatMap((re) => [...src.matchAll(re)].map((m) => m[0]));
      if (hits.length) console.log(`    ${rel}: ${[...new Set(hits)].join(", ")}`);
    }
}
if (hatalar.length || (strict && gecisToplam)) process.exit(1);
