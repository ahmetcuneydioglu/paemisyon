/**
 * Doc 34 — uyarıları OCR kusuru / gerçek soru kusuru diye ayırır.
 *
 * Kaynak taranmış PDF olduğu için uyarıların çoğu harf hatasından geliyor;
 * bunlar sorunun değil ÇIKARMANIN kusuru ve onarılabilir. Gerçek kusurla
 * karıştırılırsa kurtarılabilir sorular boşuna elenir.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

const OCR_DESEN = /\bOCR\b|yaz[ıi]m (hatas|bozuk)|harf hatas|imla|karakter|eksik harf|noktalama|b[üu]y[üu]k\/k[üu][çc][üu]k harf|typo|d[üu]zeltilmeli.*(harf|yaz[ıi]m)/i;
const GERCEK_DESEN = /birden fazla (do[ğg]ru|[şs][ıi]k)|iki [şs][ıi]k|hi[çc]bir [şs][ıi]k|hi[çc]biri do[ğg]ru|ayn[ıi] h[üu]km|tek do[ğg]ru (cevap|[şs][ıi]k) yok|k[öo]k belirsiz|yan[ıi]lt[ıi]c[ıi]|m[üu]kerrer [şs][ıi]k|cevab[ıi] de[ğg]i[şs]/i;

interface Sonuc { id: string; parti: string; karar: string; tip: string; uyari: string }
const sonuclar: Sonuc[] = [];
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x))) {
  const parti = f.replace('-karar.json', '');
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) {
    if (!k.uyarilar?.length) continue;
    for (const u of k.uyarilar) {
      const gercek = GERCEK_DESEN.test(u);
      const ocr = OCR_DESEN.test(u);
      // Hem OCR hem gerçek kusur anlatan uyarı GERÇEK sayılır (ağır olan kazanır).
      const tip = gercek ? 'gercek' : ocr ? 'ocr' : 'belirsiz';
      sonuclar.push({ id: k.id, parti, karar: k.karar, tip, uyari: u });
    }
  }
}
const soruTipi = new Map<string, string>();
for (const s of sonuclar) {
  const mevcut = soruTipi.get(s.id);
  if (mevcut === 'gercek') continue;
  if (s.tip === 'gercek' || !mevcut) soruTipi.set(s.id, s.tip);
  else if (mevcut === 'belirsiz' && s.tip === 'ocr') soruTipi.set(s.id, 'ocr');
}
const say = (t: string) => [...soruTipi.values()].filter((x) => x === t).length;
console.log(`uyarı alan soru : ${soruTipi.size}`);
console.log(`  yalnız OCR    : ${say('ocr')}   → metin onarımıyla kurtulur`);
console.log(`  gerçek kusur  : ${say('gercek')} → soru düzeltmesi gerekir`);
console.log(`  belirsiz      : ${say('belirsiz')} → elle bakılmalı`);
writeFileSync(`${KOK}/uyari-tipleri.json`, JSON.stringify(Object.fromEntries(soruTipi), null, 1));
console.log('\nGERÇEK KUSUR bildirilen sorular:');
for (const [id, t] of soruTipi) if (t === 'gercek') {
  const u = sonuclar.find((s) => s.id === id && s.tip === 'gercek')!;
  console.log(`  ${id.padEnd(6)} ${u.uyari.slice(0, 120)}`);
}
console.log('\nBELİRSİZ:');
for (const [id, t] of soruTipi) if (t === 'belirsiz') {
  const u = sonuclar.find((s) => s.id === id)!;
  console.log(`  ${id.padEnd(6)} ${u.uyari.slice(0, 120)}`);
}
