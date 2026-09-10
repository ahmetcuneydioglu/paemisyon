/**
 * Doc 41 — bankadaki KAYMAKAMLIK sorularını KÖR denetim partilerine böler.
 *
 * Doc 40'ın parti hattıyla aynı fikir, tek farkla: kaynak PDF değil BANKANIN
 * KENDİSİ. Soru zaten yayında ve doğru şıkkı işaretli — bu yüzden kör dosyaya
 * ne `dogru` bayrağı ne de `aciklama` konur; ikisi de cevabı ele verir.
 * Bankanın cevabı ayrı bir anahtar dosyasına yazılır ve yalnız birleştiriciye
 * verilir (denetçi görmez).
 *
 * Partiler YILA göre kurulur: aynı dosyadaki soruların hepsi aynı sınavdan
 * gelsin ki denetçiye "bu sorular 2020'nin, sen 2026'ya bakıyorsun" diye tek
 * bir tarih söylenebilsin.
 *
 * SALT OKUMA — girdi `banka-kaymakamlik.json`, veritabanına dokunmaz.
 *
 *   npx tsx scripts/kaym-parti-kur.ts <doc-dizini> [--boy 12] [--yil 2020,2021]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

type Kayit = {
  id: string; questionId: string; guncelSurum: boolean; durum: string;
  yil: string | null; sourceLabel: string | null; ders: string | null; konu: string | null;
  stem: string; aciklama: string | null; doc40?: boolean;
  siklar: { label: string; text: string; dogru: boolean }[];
};

const arg = (ad: string, varsayilan?: string) => {
  const i = process.argv.indexOf(`--${ad}`);
  return i === -1 ? varsayilan : process.argv[i + 1];
};

function main() {
  const docDizin = process.argv[2];
  if (!docDizin) throw new Error('kullanım: kaym-parti-kur.ts <doc-dizini> [--boy 12] [--yil 2020,2021]');
  const boy = Number(arg('boy', '12'));
  const yilSuzgec = arg('yil')?.split(',').map((s) => s.trim());

  const hepsi: Kayit[] = JSON.parse(readFileSync(`${docDizin}/banka-kaymakamlik.json`, 'utf8'));

  // Kapsam: yalnız YAYINDAKİ ve Doc 40'ta DENETLENMEMİŞ sorular.
  // Arşivdekiler yayında değil (kullanıcıya gitmiyor), Doc 40'takiler üç
  // denetçiden zaten geçti — ikisini de tekrar denetlemek boşa ajan yakar.
  const kapsam = hepsi.filter(
    (k) => k.durum === 'published' && !k.doc40 && (!yilSuzgec || yilSuzgec.includes(k.yil ?? '')),
  );
  const disarida = hepsi.length - kapsam.length;

  // Kimlik: k<yıl kısaltması><sıra> — kör dosyada UUID görünmesin, denetçi
  // bankada arama yapmaya kalkmasın diye.
  const sirala = [...kapsam].sort((a, b) =>
    (a.yil ?? '').localeCompare(b.yil ?? '') || (a.ders ?? '').localeCompare(b.ders ?? '') || a.stem.localeCompare(b.stem, 'tr'),
  );
  const sayac = new Map<string, number>();
  const kimlikli = sirala.map((k) => {
    const y = (k.yil ?? '00').slice(2);
    const n = (sayac.get(y) ?? 0) + 1;
    sayac.set(y, n);
    return { ...k, kim: `k${y}-${String(n).padStart(2, '0')}` };
  });

  mkdirSync(`${docDizin}/parti`, { recursive: true });

  // Anahtar: bankanın kendi cevabı. Denetçiye GİTMEZ.
  const anahtar: Record<string, string> = {};
  // Eşleme: kimlik → versiyon/soru kimliği. Düzeltme aşamasında gerekli.
  const esleme: Record<string, { versionId: string; questionId: string; yil: string | null; ders: string | null; konu: string | null; durum: string }> = {};
  for (const k of kimlikli) {
    const d = k.siklar.filter((s) => s.dogru);
    if (d.length !== 1) throw new Error(`${k.kim} (${k.id}): doğru şık sayısı ${d.length}`);
    anahtar[k.kim] = d[0].label;
    esleme[k.kim] = { versionId: k.id, questionId: k.questionId, yil: k.yil, ders: k.ders, konu: k.konu, durum: k.durum };
  }
  writeFileSync(`${docDizin}/anahtar-banka.json`, JSON.stringify(anahtar, null, 1));
  writeFileSync(`${docDizin}/esleme.json`, JSON.stringify(esleme, null, 1));

  // Kör partiler: yıl içinde kalarak böl.
  const yillar = [...new Set(kimlikli.map((k) => k.yil ?? '?'))].sort();
  const ozet: string[] = [];
  for (const yil of yillar) {
    const grup = kimlikli.filter((k) => (k.yil ?? '?') === yil);
    const parcaSayisi = Math.max(1, Math.ceil(grup.length / boy));
    const parcaBoy = Math.ceil(grup.length / parcaSayisi);
    for (let i = 0; i < parcaSayisi; i++) {
      const dilim = grup.slice(i * parcaBoy, (i + 1) * parcaBoy);
      if (!dilim.length) continue;
      const ad = `kaym${yil}-${i + 1}`;
      const kor = dilim.map((k) => ({
        id: k.kim,
        sinavYili: k.yil,
        ders: k.ders,
        kok: k.stem,
        siklar: Object.fromEntries(k.siklar.map((s) => [s.label, s.text])),
      }));
      writeFileSync(`${docDizin}/parti/${ad}-kor.json`, JSON.stringify(kor, null, 1));
      ozet.push(`  ${ad.padEnd(12)} ${String(dilim.length).padStart(2)} soru  ${dilim[0].kim}…${dilim[dilim.length - 1].kim}`);
    }
  }

  console.log(`Bankadaki KAYMAKAMLIK sürümü: ${hepsi.length}  ·  kapsam dışı: ${disarida} (arşiv + Doc 40)`);
  console.log(`Denetlenecek: ${kapsam.length}\n`);
  for (const y of yillar) console.log(`  ${y}: ${kimlikli.filter((k) => k.yil === y).length}`);
  console.log('\nPartiler:');
  console.log(ozet.join('\n'));
  console.log(`\n→ ${docDizin}/parti/*-kor.json  ·  anahtar-banka.json  ·  esleme.json`);
}

main();
