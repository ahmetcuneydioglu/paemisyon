// Kontrast testi (Doc 49 F0 / §1.1 kuralı): design-tokens.json'daki her metin/zemin
// çifti iki şemada da WCAG eşiğini geçmeli (text >= 4.5, large >= 3.0).
// node --test packages/tokens/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const t = JSON.parse(readFileSync(join(here, 'design-tokens.json'), 'utf8'));

function luminance(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

for (const scheme of ['dark', 'light']) {
  for (const p of t.contrastPairs.pairs) {
    const min = p.size === 'large' ? t.a11y.minContrastLarge : t.a11y.minContrastText;
    test(`${scheme}: ${p.fg} / ${p.bg} >= ${min}`, () => {
      const fg = t.color[p.fg]?.[scheme];
      const bg = t.color[p.bg]?.[scheme];
      assert.ok(fg && bg, `token eksik: ${p.fg} ya da ${p.bg}`);
      const c = contrast(fg, bg);
      assert.ok(c >= min, `${p.fg} ${fg} / ${p.bg} ${bg} = ${c.toFixed(2)} < ${min}`);
    });
  }
}

test('her renk token\'ının dark ve light değeri var ve geçerli hex', () => {
  for (const [name, v] of Object.entries(t.color)) {
    for (const s of ['dark', 'light']) {
      assert.match(v[s] ?? '', /^#[0-9A-F]{6}$/i, `${name}.${s}`);
    }
  }
});

test('tipografi: her rol bilinen bir aileye bağlı, satır yüksekliği boydan küçük değil', () => {
  for (const [name, r] of Object.entries(t.typography.roles)) {
    assert.ok(t.typography.family[r.family], `${name}: aile ${r.family}`);
    assert.ok(r.lineHeight >= r.size * 0.9, `${name}: satır ${r.lineHeight} < boy ${r.size}`);
    assert.ok(t.typography.family[r.family].weights.includes(r.weight), `${name}: ağırlık ${r.weight} ailede yüklü değil`);
  }
});

test('dokunma hedefi ve ikon ölçüleri a11y eşiğiyle tutarlı', () => {
  assert.ok(t.size.touchTarget >= t.a11y.minTouchTarget);
});
