#!/usr/bin/env node
/**
 * Token üretimi (Doc 49 F0): design-tokens.json → build/tokens.css, build/tokens.ts,
 * build/tokens.dart. Bağımlılık yok, Node 20+. Üretilenler repoda tutulur
 * (tüketici app'ler build çalıştırmak zorunda kalmasın); CI `--check` ile
 * JSON'la üretilen dosyaların eşit olduğunu doğrular.
 *
 *   node build.mjs           # üret
 *   node build.mjs --check   # üretileni mevcutla kıyasla, fark varsa 1 ile çık
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, 'design-tokens.json'), 'utf8'));
const outDir = join(here, 'build');
const check = process.argv.includes('--check');

const HEADER = (comment) =>
  `${comment} ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: packages/tokens/design-tokens.json (v${tokens.version}, ${tokens.identity.name}). Yenile: node packages/tokens/build.mjs\n`;

const colorNames = Object.keys(tokens.color);
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

// ── CSS ──
function css() {
  const vars = (scheme) =>
    colorNames.map((n) => `  --color-${kebab(n)}: ${tokens.color[n][scheme]};`).join('\n');
  const type = Object.entries(tokens.typography.roles)
    .map(([n, r]) => {
      const fam = tokens.typography.family[r.family];
      return [
        `  --type-${kebab(n)}-size: ${r.size}px;`,
        `  --type-${kebab(n)}-line: ${r.lineHeight}px;`,
        `  --type-${kebab(n)}-weight: ${r.weight};`,
        `  --type-${kebab(n)}-tracking: ${r.tracking}em;`,
        `  --type-${kebab(n)}-family: "${fam.name}", ${fam.fallback};`,
      ].join('\n');
    })
    .join('\n');
  const space = Object.entries(tokens.spacing)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => `  --space-${k}: ${v}px;`)
    .join('\n');
  const radius = Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`).join('\n');
  const motion = Object.entries(tokens.motion)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [`  --motion-${k}-ms: ${v.ms}ms;`, v.easing ? `  --motion-${k}-ease: ${v.easing};` : null].filter(Boolean).join('\n'))
    .join('\n');
  const dark = tokens.identity.defaultScheme === 'dark';
  return `${HEADER('/*')} */
/* Varsayılan şema: ${tokens.identity.defaultScheme}. data-theme="light|dark" zorlar; yoksa sistem tercihi.
   .theme-light / .theme-dark sınıfları bir alt ağaçta şemayı zorlar (F7 geçişi: miras public sayfalar). */
:root {
${vars(tokens.identity.defaultScheme)}
${type}
${space}
  --space-screen-gutter: ${tokens.spacing.$screenGutter}px;
${radius}
${motion}
  --size-touch-target: ${tokens.size.touchTarget}px;
  --size-icon: ${tokens.size.icon}px;
  --size-icon-stroke: ${tokens.size.iconStroke};
  --font-display: "${tokens.typography.family.display.name}", ${tokens.typography.family.display.fallback};
  --font-body: "${tokens.typography.family.body.name}", ${tokens.typography.family.body.fallback};
  color-scheme: ${tokens.identity.defaultScheme};
}
:root[data-theme="${dark ? 'light' : 'dark'}"],
.theme-${dark ? 'light' : 'dark'} {
${vars(dark ? 'light' : 'dark')}
  color-scheme: ${dark ? 'light' : 'dark'};
}
/* Alt ağaçta varsayılan şemayı geri zorlamak için (ör. miras sayfalar içinde). */
.theme-${tokens.identity.defaultScheme} {
${vars(tokens.identity.defaultScheme)}
  color-scheme: ${tokens.identity.defaultScheme};
}
@media (prefers-color-scheme: ${dark ? 'light' : 'dark'}) {
  :root:not([data-theme="${tokens.identity.defaultScheme}"]) {
${vars(dark ? 'light' : 'dark')}
    color-scheme: ${dark ? 'light' : 'dark'};
  }
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-enter-ms: 0ms;
    --motion-exit-ms: 0ms;
    --motion-stagger-ms: 0ms;
  }
}
`;
}

// ── TypeScript ──
function ts() {
  const scheme = (s) =>
    '{\n' + colorNames.map((n) => `    ${n}: '${tokens.color[n][s]}',`).join('\n') + '\n  }';
  const roles = Object.entries(tokens.typography.roles)
    .map(
      ([n, r]) =>
        `    ${n}: { family: '${r.family}', size: ${r.size}, lineHeight: ${r.lineHeight}, weight: ${r.weight}, tracking: ${r.tracking}, tabular: ${r.tabular}${r.uppercase ? ', uppercase: true' : ''} },`,
    )
    .join('\n');
  const space = Object.entries(tokens.spacing)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => `    s${k}: ${v},`)
    .join('\n');
  const radius = Object.entries(tokens.radius).map(([k, v]) => `    ${k}: ${v},`).join('\n');
  const motion = Object.entries(tokens.motion)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => `    ${k}: { ms: ${v.ms}${v.easing ? `, easing: '${v.easing}'` : ''} },`)
    .join('\n');
  return `${HEADER('//')}
export const tokenVersion = '${tokens.version}' as const;
export const identityName = '${tokens.identity.name}' as const;
export type Scheme = 'dark' | 'light';
export const defaultScheme: Scheme = '${tokens.identity.defaultScheme}';

export const palette = {
  dark: ${scheme('dark')},
  light: ${scheme('light')},
} as const;
export type ColorName = keyof typeof palette.dark;
/** Şemalar arası ortak tip: değerler şemaya göre değişir, anahtar kümesi aynıdır. */
export type Palette = Record<ColorName, string>;

export const fontFamily = {
  display: { name: '${tokens.typography.family.display.name}', weights: [${tokens.typography.family.display.weights.join(', ')}] },
  body: { name: '${tokens.typography.family.body.name}', weights: [${tokens.typography.family.body.weights.join(', ')}] },
} as const;

/** Boylar px; tracking em cinsinden (RN'de letterSpacing = tracking * size).
 *  Ad \`typeRoles\`: \`type\` adlı bir dışa aktarım, içe aktarımda \`{ type as x }\` yazımını
 *  TypeScript'in tür-içe-aktarım sözdizimiyle çakıştırıyor. */
export const typeRoles = {
${roles}
} as const;
export type TypeRole = keyof typeof typeRoles;

export const dynamicType = { iosCurveAbovePt: ${tokens.typography.dynamicType.iosCurveAbovePt}, androidMaxScale: ${tokens.typography.dynamicType.androidMaxScale} } as const;

export const space = {
${space}
  screenGutter: ${tokens.spacing.$screenGutter},
} as const;

export const radius = {
${radius}
} as const;

export const size = { touchTarget: ${tokens.size.touchTarget}, icon: ${tokens.size.icon}, iconStroke: ${tokens.size.iconStroke}, tabBarItems: ${tokens.size.tabBarItems} } as const;

export const motion = {
${motion}
} as const;

export const a11y = { minTouchTarget: ${tokens.a11y.minTouchTarget}, minContrastText: ${tokens.a11y.minContrastText}, minContrastLarge: ${tokens.a11y.minContrastLarge} } as const;
`;
}

// ── Dart (geçiş süresince Flutter paritesi; ThemeExtension bağlaması app'te) ──
function dart() {
  const hex = (h) => `Color(0xFF${h.slice(1).toUpperCase()})`;
  const scheme = (s, cls) =>
    `class ${cls} {\n  ${cls}._();\n` +
    colorNames.map((n) => `  static const Color ${n} = ${hex(tokens.color[n][s])};`).join('\n') +
    '\n}';
  return `${HEADER('//')}
import 'dart:ui';

const String tokenVersion = '${tokens.version}';
const String identityName = '${tokens.identity.name}';

${scheme('dark', 'NobetDark')}

${scheme('light', 'NobetLight')}

class NobetSpace {
  NobetSpace._();
${Object.entries(tokens.spacing).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `  static const double s${k} = ${v};`).join('\n')}
  static const double screenGutter = ${tokens.spacing.$screenGutter};
}

class NobetRadius {
  NobetRadius._();
${Object.entries(tokens.radius).map(([k, v]) => `  static const double ${k} = ${v};`).join('\n')}
}

class NobetSize {
  NobetSize._();
  static const double touchTarget = ${tokens.size.touchTarget};
  static const double icon = ${tokens.size.icon};
  static const double iconStroke = ${tokens.size.iconStroke};
}
`;
}

const outputs = { 'tokens.css': css(), 'tokens.ts': ts(), 'tokens.dart': dart() };
if (!existsSync(outDir)) mkdirSync(outDir);
let drift = false;
for (const [name, content] of Object.entries(outputs)) {
  const path = join(outDir, name);
  if (check) {
    const cur = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (cur !== content) {
      drift = true;
      console.error(`FARK: build/${name} kaynakla eşit değil — \`node packages/tokens/build.mjs\` çalıştır.`);
    }
  } else {
    writeFileSync(path, content);
    console.log(`yazıldı: build/${name} (${content.length} b)`);
  }
}
if (check) {
  if (drift) process.exit(1);
  console.log('build/ kaynakla eşit.');
}
