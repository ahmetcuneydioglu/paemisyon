#!/usr/bin/env node
/**
 * Token kapısı (Doc 49/11 §2.1): apps/web/src içinde
 *  - ham hex renk (#rrggbb / #rgb) → HATA (legacy.css hariç — W-F'de o da silinir)
 *  - v2 `--tk-` değişkeni → geçiş (globals.css'te v3'e eşlenir; W-E/W-F'de hata olur)
 *  - marka/üçüncü taraf renkleri (logo, Google düğmesi, lig kademeleri, landing degrade):
 *    HEX_IZIN listesi — W-F'de boşalır
 *  - miras/geçiş adları (navy, brand, session/live/streak/atlas, font-heading, rounded-sm/md/lg,
 *    tk-scope, tk-caption, tk-interactive) → şimdilik SAYILIR (W-E/W-F'de hataya döner).
 *   node scripts/tokens-check.mjs            (rapor + çıkış kodu)
 *   node scripts/tokens-check.mjs --strict   (geçiş adları da hata)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
const strict = process.argv.includes("--strict");
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(n)) files.push(p);
  }
})(ROOT);

const HEX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
/* Tailwind hazır paleti (red-500, slate-900, …): renk yalnız token'dan. Bugün 110 kullanım
   (miras/public sayfalar) → geçiş sayılır; --strict (W-F) ile hata. */
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
/* W-F'de boşalacak ham hex izinleri (gerekçe yanında). */
const HEX_IZIN = new Set([
  "components/brand-mark.tsx", // logo renkleri (marka; v3 logosu W-F)
  "components/auth/social-login-buttons.tsx", // Google "G" marka renkleri
  "components/leaderboard/rank-tier.ts", // lig kademe renkleri — W-E'de token'a bağlanır
  "app/(site)/page.tsx", // landing degrade — W-F
]);
const hatalar = [];
const gecis = new Map();
for (const f of files) {
  const rel = relative(ROOT, f);
  const src = readFileSync(f, "utf8");
  if (!rel.endsWith("legacy.css")) {
    for (const line of src.split("\n").entries()) {
      const [i, t] = line;
      if (t.includes("tokens-check: izin")) continue;
      if (!HEX_IZIN.has(rel))
        for (const m of t.matchAll(HEX))
          hatalar.push(`${rel}:${i + 1} ham hex ${m[0]}`);
      if (!rel.endsWith("globals.css"))
        for (const m of t.matchAll(TK))
          gecis.set(m[0], (gecis.get(m[0]) ?? 0) + 1);
      if (!rel.endsWith(".css"))
        for (const m of t.matchAll(HAZIR_PALET))
          gecis.set(m[0], (gecis.get(m[0]) ?? 0) + 1);
    }
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
    "  geçiş adları (W-E/W-F): " + top.map(([k, v]) => `${k}×${v}`).join(", "),
  );
}
if (hatalar.length || (strict && gecisToplam)) process.exit(1);
