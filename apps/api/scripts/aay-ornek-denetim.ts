/**
 * Kullanıcının yapay zekâyla ürettiği 10 örnek sorunun çözücüyle denetimi.
 *
 *   npx tsx scripts/aay-ornek-denetim.ts
 */
import {
  bazi, dagilimlar, dizilimler, her, hicbiri, ikiliDunyalar, kume, raporla, tamDeger,
  type Bulmaca,
} from './aay-cozucu';

// ── 1 · nöbet sıralaması ─────────────────────────────────────────
const s1 = dizilimler(['Ahmet', 'Burak', 'Cemil', 'Deniz', 'Engin'], [1, 2, 3, 4, 5]).filter(
  (d) => d.Ahmet === 3 && d.Deniz === (d.Engin as number) + 1 && (d.Burak as number) < (d.Cemil as number),
);

// ── 2 · şube görevlendirme kuralları ─────────────────────────────
const SUBE = ['A', 'B', 'C', 'D'];
const s2 = ikiliDunyalar(SUBE).filter(
  (d) => (!d.A || !d.C) && (!d.B || d.D) && (!d.C || d.A || d.B),
);

// ── 4 · komiser branşları ────────────────────────────────────────
const s4 = dagilimlar(['K', 'L', 'M', 'N', 'P'], { Trafik: 2, 'Olay Yeri': 2, Asayiş: 1 }).filter(
  (d) => d.K === d.L && d.M === 'Trafik',
);

// ── 5 · ifade alma koşulu (avukat VEYA feragat) ──────────────────
const s5 = ikiliDunyalar(['avukat', 'feragat', 'ifade']).filter(
  (d) => !d.ifade || d.avukat || d.feragat,
);

// ── 6 · toplantı sırası ──────────────────────────────────────────
const s6 = dizilimler(['Vali', 'Kaymakam', 'Savci', 'Baskan', 'Digeri'], [1, 2, 3, 4, 5]).filter(
  (d) => d.Vali === (d.Kaymakam as number) + 1 && d.Savci !== 1 && d.Savci !== 5 && d.Baskan === 3,
);

// ── 8 · tim katılımı ─────────────────────────────────────────────
const s8 = ikiliDunyalar(['X', 'Y', 'Z']).filter((d) => (!d.X || !d.Y) && (!d.Z || d.Y) && d.Z);

// ── 10 · klasör renkleri ─────────────────────────────────────────
const s10 = dizilimler(['Mavi', 'Yesil', 'Kirmizi'], [1, 2, 3]).filter(
  (d) => d.Kirmizi !== 1 && (d.Mavi as number) > (d.Yesil as number),
);

const BULMACALAR: Bulmaca[] = [
  {
    id: '1', baslik: 'Nöbet — "Cuma günü kesinlikle kim nöbetçidir?"', dunyalar: s1, isaretli: 'C',
    siklar: [
      { harf: 'A', metin: 'Burak', iddia: her((d) => d.Burak === 5) },
      { harf: 'B', metin: 'Cemil', iddia: her((d) => d.Cemil === 5) },
      { harf: 'C', metin: 'Deniz', iddia: her((d) => d.Deniz === 5) },
      { harf: 'D', metin: 'Engin', iddia: her((d) => d.Engin === 5) },
      { harf: 'E', metin: 'Ahmet', iddia: her((d) => d.Ahmet === 5) },
    ],
  },
  {
    id: '2', baslik: 'Şube — "hangisi kurallara kesinlikle AYKIRIDIR?"', dunyalar: s2, isaretli: 'E',
    siklar: [
      { harf: 'A', metin: 'Sadece B ve D', iddia: hicbiri(kume(SUBE, ['B', 'D'])) },
      { harf: 'B', metin: 'Sadece C ve D', iddia: hicbiri(kume(SUBE, ['C', 'D'])) },
      { harf: 'C', metin: 'Sadece A ve D', iddia: hicbiri(kume(SUBE, ['A', 'D'])) },
      { harf: 'D', metin: 'A, B ve D', iddia: hicbiri(kume(SUBE, ['A', 'B', 'D'])) },
      { harf: 'E', metin: 'Sadece B', iddia: hicbiri(kume(SUBE, ['B'])) },
    ],
  },
  {
    id: '4', baslik: 'Branş — "N kesinlikle hangi branştadır?"', dunyalar: s4, isaretli: 'E',
    siklar: [
      { harf: 'A', metin: 'Trafik', iddia: her((d) => d.N === 'Trafik') },
      { harf: 'B', metin: 'Olay Yeri', iddia: her((d) => d.N === 'Olay Yeri') },
      { harf: 'C', metin: 'Asayiş', iddia: her((d) => d.N === 'Asayiş') },
      { harf: 'D', metin: 'Trafik veya Asayiş', iddia: her((d) => d.N === 'Trafik' || d.N === 'Asayiş') },
      { harf: 'E', metin: 'Olay Yeri veya Asayiş', iddia: her((d) => d.N === 'Olay Yeri' || d.N === 'Asayiş') },
    ],
  },
  {
    id: '5', baslik: 'İfade — "hangisi kesinlikle doğrudur?"', dunyalar: s5, isaretli: 'B',
    siklar: [
      { harf: 'A', metin: 'Avukat yoksa ifade alınamaz', iddia: her((d) => Boolean(d.avukat) || !d.ifade) },
      { harf: 'B', metin: 'Feragat varsa avukata gerek yok', iddia: bazi((d) => Boolean(d.feragat && d.ifade && !d.avukat)) },
      { harf: 'C', metin: 'İfade alındıysa avukat oradadır', iddia: her((d) => !d.ifade || Boolean(d.avukat)) },
      { harf: 'D', metin: 'Feragat yoksa ifade alınamaz', iddia: her((d) => Boolean(d.feragat) || !d.ifade) },
      { harf: 'E', metin: 'Avukat varken feragat de zorunlu', iddia: her((d) => !(d.avukat && d.ifade) || Boolean(d.feragat)) },
    ],
  },
  {
    id: '6', baslik: 'Toplantı — "Vali kaçıncı sırada olabilir?"', dunyalar: s6, isaretli: 'C',
    siklar: [
      { harf: 'A', metin: '1 veya 2', iddia: tamDeger('Vali', [1, 2]) },
      { harf: 'B', metin: '2 veya 4', iddia: tamDeger('Vali', [2, 4]) },
      { harf: 'C', metin: '2 veya 5', iddia: tamDeger('Vali', [2, 5]) },
      { harf: 'D', metin: '4 veya 5', iddia: tamDeger('Vali', [4, 5]) },
      { harf: 'E', metin: '1 veya 5', iddia: tamDeger('Vali', [1, 5]) },
    ],
  },
  {
    id: '8', baslik: 'Tim — "Z katıldıysa hangisi kesinlikle doğrudur?"', dunyalar: s8, isaretli: 'C',
    siklar: [
      { harf: 'A', metin: 'X katılmıştır', iddia: her((d) => Boolean(d.X)) },
      { harf: 'B', metin: 'X ve Y beraber katılmıştır', iddia: her((d) => Boolean(d.X && d.Y)) },
      { harf: 'C', metin: 'Y katılmış, X katılmamıştır', iddia: her((d) => Boolean(d.Y && !d.X)) },
      { harf: 'D', metin: 'Sadece Z katılmıştır', iddia: her(kume(['X', 'Y', 'Z'], ['Z'])) },
      { harf: 'E', metin: 'Hiçbir tim katılmamıştır', iddia: her((d) => !d.X && !d.Y && !d.Z) },
    ],
  },
  {
    id: '10', baslik: 'Klasör — "2 numaralı odada hangi renk vardır?"', dunyalar: s10, isaretli: 'C',
    siklar: [
      { harf: 'A', metin: 'Mavi', iddia: her((d) => d.Mavi === 2) },
      { harf: 'B', metin: 'Yeşil', iddia: her((d) => d.Yesil === 2) },
      { harf: 'C', metin: 'Kırmızı', iddia: her((d) => d.Kirmizi === 2) },
      { harf: 'D', metin: 'Mavi veya Yeşil', iddia: her((d) => d.Mavi === 2 || d.Yesil === 2) },
      { harf: 'E', metin: 'Yeşil veya Kırmızı', iddia: her((d) => d.Yesil === 2 || d.Kirmizi === 2) },
    ],
  },
];

const kararlar = raporla(BULMACALAR);

console.log('\nÇÖZÜCÜ KAPSAMI DIŞINDA (kaba kuvvetle kanıtlanamaz):');
console.log('  3 · argüman zayıflığı — yargı sorusu, kısıt problemi değil');
console.log('  7 · sayı örüntüsü (×2+1 → 63) — tümevarım, sonlu dünya yok');
console.log('  9 · "açıklaması olamaz" — yargı sorusu');

// Kusurlu soruların gerekçesi tek tek yazılır: sayı değil, sebep lazım.
for (const k of kararlar.filter((x) => x.sonuc !== 'KANIT')) {
  const b = BULMACALAR.find((x) => x.id === k.id)!;
  console.log(`\n── ${k.id} · ${k.sonuc}`);
  console.log(`   tutan şık(lar): ${k.tutan.join(', ') || '—'} · işaretli: ${b.isaretli}`);
  for (const d of b.dunyalar.slice(0, 6)) console.log(`   dünya: ${JSON.stringify(d)}`);
  if (b.dunyalar.length > 6) console.log(`   … +${b.dunyalar.length - 6} dünya`);
}
