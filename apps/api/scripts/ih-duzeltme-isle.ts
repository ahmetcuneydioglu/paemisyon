/**
 * Doc 33 — düzeltme partisinin (b90) sonuçlarını asıl bölüm dosyalarına işler.
 *
 * Metni onarılan sorular kendi bölümlerinde ESKİ metinle denetlenmişti; b90
 * turu bunları temiz metinle yeniden denetledi. Bu script b90-d{1,2}.json
 * içindeki kayıtları id'sine bakarak ilgili bölümün d1/d2 dosyasında ÜZERİNE
 * YAZAR, böylece bölüm bütünlüğü korunur.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi/denetim';
type Kayit = { id: string; cevap: string; guven: string; dayanak: string; gerekce: string; uyari: string | null };

for (const k of ['d1', 'd2'] as const) {
  const yol = `${KOK}/b90-${k}.json`;
  if (!existsSync(yol)) { console.log(`b90-${k}.json yok — atlandı`); continue; }
  const duzeltme: Kayit[] = JSON.parse(readFileSync(yol, 'utf8'));
  const gruplar = new Map<string, Kayit[]>();
  for (const kayit of duzeltme) {
    const bolum = /^b(\d+)-/.exec(kayit.id)?.[1];
    if (!bolum) { console.log(`⚠ id çözülemedi: ${kayit.id}`); continue; }
    const dosya = `b${bolum.padStart(2, '0')}-${k}.json`;
    if (!gruplar.has(dosya)) gruplar.set(dosya, []);
    gruplar.get(dosya)!.push(kayit);
  }
  for (const [dosya, kayitlar] of gruplar) {
    const yol2 = `${KOK}/${dosya}`;
    if (!existsSync(yol2)) { console.log(`⚠ ${dosya} yok — ${kayitlar.map((x) => x.id).join(',')} işlenemedi`); continue; }
    const mevcut: Kayit[] = JSON.parse(readFileSync(yol2, 'utf8'));
    let n = 0;
    for (const yeni of kayitlar) {
      const i = mevcut.findIndex((x) => x.id === yeni.id);
      if (i < 0) { console.log(`⚠ ${dosya} içinde ${yeni.id} yok`); continue; }
      mevcut[i] = yeni; n++;
    }
    writeFileSync(yol2, JSON.stringify(mevcut, null, 1));
    console.log(`✓ ${dosya}: ${n} kayıt güncellendi (${kayitlar.map((x) => x.id).join(', ')})`);
  }
}
