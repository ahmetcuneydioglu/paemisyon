/**
 * Doc 34 — OCR hasarlı soruları, ORİJİNAL SAYFA GÖRÜNTÜSÜ ile onarım turuna hazırlar.
 *
 * Kaynak taranmış PDF; Vision OCR küçük puntoda Roma rakamlarını bozuyor
 * (III → II) ve Türkçe harflerde hata yapıyor. Bu kusurlar sorunun değil
 * ÇIKARMANIN kusuru: doğrusu sayfa görüntüsünde duruyor.
 *
 * Çıktı her soru için: mevcut (bozuk) metin + bakılacak sayfa görüntüsü.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

function main() {
  const ham = JSON.parse(readFileSync(`${KOK}/ham-100.json`, 'utf8'));
  const sayfaOf = new Map<number, number>(ham.map((q: any) => [q.no, q.sayfa]));
  const aday = JSON.parse(readFileSync(`${KOK}/aday-96.json`, 'utf8'));
  const adayOf = new Map<number, any>(aday.map((q: any) => [q.no, q]));
  const tipler: Record<string, string> = existsSync(`${KOK}/uyari-tipleri.json`)
    ? JSON.parse(readFileSync(`${KOK}/uyari-tipleri.json`, 'utf8')) : {};

  // Hedef: OCR ya da belirsiz etiketli sorular + Roma rakamı taşıyan her soru
  // (Roma rakamı bozulması sessiz: uyarı çıkmasa da yanlış olabilir).
  const romaDesen = /\b[IVX]{1,5}\b/;
  const hedef = new Set<number>();
  for (const [id, tip] of Object.entries(tipler)) {
    if (tip === 'ocr' || tip === 'belirsiz') hedef.add(Number(id.slice(1)));
  }
  for (const q of aday) {
    const metin = q.kok + ' ' + Object.values(q.siklar).join(' ');
    if (romaDesen.test(metin)) hedef.add(q.no);
  }

  // Daha önce onarılmış soruları tekrar gönderme.
  const onarilmis = new Set<number>();
  if (existsSync(`${KOK}/onarim`)) {
    for (const f of readdirSync(`${KOK}/onarim`).filter((x) => /-onarim\.json$/.test(x)))
      for (const o of JSON.parse(readFileSync(`${KOK}/onarim/${f}`, 'utf8'))) onarilmis.add(Number(o.id.slice(1)));
  }
  for (const n of onarilmis) hedef.delete(n);

  const kayitlar = [...hedef].sort((a, b) => a - b).map((no) => {
    const q = adayOf.get(no)!;
    const sayfa = sayfaOf.get(no)!;
    return {
      id: `s${no}`, sayfa,
      gorsel: `sayfa/s-${String(sayfa).padStart(2, '0')}.png`,
      mevcutKok: q.kok, mevcutSiklar: q.siklar,
    };
  });

  // Sayfaya göre öbekle — ajan aynı görüntüyü bir kez okusun.
  const sayfalar = new Map<number, any[]>();
  for (const k of kayitlar) {
    if (!sayfalar.has(k.sayfa)) sayfalar.set(k.sayfa, []);
    sayfalar.get(k.sayfa)!.push(k);
  }
  mkdirSync(`${KOK}/onarim`, { recursive: true });
  const parcalar = [...sayfalar].sort((a, b) => a[0] - b[0]);
  const BOYUT = 4; // parça başına en çok 4 sayfa
  for (let i = 0; i * BOYUT < parcalar.length; i++) {
    const dilim = parcalar.slice(i * BOYUT, (i + 1) * BOYUT);
    writeFileSync(`${KOK}/onarim/tur2-parca-${i + 1}.json`,
      JSON.stringify({ parca: i + 1, sorular: dilim.flatMap(([, v]) => v) }, null, 1));
    console.log(`  tur2-parca-${i + 1}.json → ${dilim.flatMap(([, v]) => v).length} soru, ${dilim.length} sayfa (s.${dilim.map(([s]) => s).join(',')})`);
  }
  console.log(`\ntoplam ${kayitlar.length} soru onarım turuna gidiyor (${sayfalar.size} sayfa)`);
}
main();
