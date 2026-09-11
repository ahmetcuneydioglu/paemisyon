/** Senaryo keşfi: öncülleri ver, çözücü NEYİN kesin olduğunu söylesin. */
import { dizilimler, dagilimlar, ikiliDunyalar, type Dunya } from './aay-cozucu';

export function tara(ad: string, ds: Dunya[], alanlar: string[]) {
  console.log(`\n═══ ${ad} · ${ds.length} dünya`);
  if (ds.length === 0) return;
  for (const a of alanlar) {
    const degerler = [...new Set(ds.map((d) => String(d[a])))].sort();
    console.log(`  ${a.padEnd(10)} ${degerler.length === 1 ? 'KESİN' : `${degerler.length} olası`}  ${degerler.join(', ')}`);
  }
}

// ── Senaryo 1 · nöbet çizelgesi ──────────────────────────────────
const N = ['Arda', 'Berk', 'Ceyda', 'Demir', 'Esra'];
const n = (d: Dunya, k: string) => d[k] as number;
const nobet = dizilimler(N, [1, 2, 3, 4, 5]).filter(
  (d) => n(d, 'Ceyda') === n(d, 'Arda') + 1 && n(d, 'Berk') < n(d, 'Demir') && n(d, 'Esra') !== 1 && n(d, 'Demir') !== 4,
);
tara('1 · nöbet', nobet, N);
for (const d of nobet) console.log('   ', N.map((k) => `${k}:${d[k]}`).join('  '));

// ── Senaryo 2 · tim kontenjanı ───────────────────────────────────
const T = ['Kaya', 'Levent', 'Melis', 'Nur', 'Onur', 'Pelin'];
const tim = dagilimlar(T, { Devriye: 3, Çevik: 2, Trafik: 1 }).filter(
  (d) => d.Kaya === d.Levent && d.Melis !== d.Nur && d.Onur === 'Çevik' && d.Kaya !== 'Çevik',
);
tara('2 · tim', tim, T);

// ── Senaryo 3 · telsiz kanalı eşleştirme ─────────────────────────
const E = ['Ekip1', 'Ekip2', 'Ekip3', 'Ekip4'];
const kanal = dizilimler(E, ['Mavi', 'Yeşil', 'Kırmızı', 'Sarı']).filter(
  (d) => d.Ekip1 !== 'Mavi' && d.Ekip3 !== 'Sarı' && (d.Ekip2 === 'Kırmızı' || d.Ekip4 === 'Kırmızı'),
);
tara('3 · kanal', kanal, E);

// ── Senaryo 4 · koşullu görevlendirme ────────────────────────────
const B = ['Alfa', 'Bravo', 'Charlie', 'Delta'];
const gorev = ikiliDunyalar(B).filter(
  (d) => (!d.Alfa || d.Charlie) && (!d.Bravo || !d.Charlie) && (d.Alfa || d.Bravo) && (!d.Delta || d.Bravo),
);
tara('4 · görev', gorev, B);
for (const d of gorev) console.log('   ', B.map((k) => `${k}:${d[k] ? '✓' : '·'}`).join(' '));
