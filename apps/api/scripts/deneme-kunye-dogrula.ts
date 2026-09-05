/**
 * Doc 34 — açıklamalardaki madde künyelerini resmî metne karşı MEKANİK doğrular.
 *
 * Uydurma madde numarasını yakalamanın en ucuz yolu metinde aramaktır; bunun
 * için ikinci bir modele sormak gerekmez. mevzuat/ altındaki her dosyanın
 * madde numaraları indekslenir, künyeden çıkarılan numara orada aranır.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';

/** dosya → { maddeNolar, anahtarlar } */
const indeks: { dosya: string; ad: string; no: string | null; maddeler: Set<string> }[] = [];
for (const f of readdirSync(`${KOK}/mevzuat`).filter((x) => x.endsWith('.md') && x !== '00-INDEKS.md')) {
  const icerik = readFileSync(`${KOK}/mevzuat/${f}`, 'utf8');
  const maddeler = new Set<string>();
  for (const l of icerik.split('\n')) {
    const m = /^## Madde (.+?)(?: — |$)/.exec(l.trim());
    if (m) maddeler.add(m[1].trim());
  }
  const ad = icerik.split('\n')[0].replace(/^#\s*/, '').trim();
  indeks.push({ dosya: f, ad, no: /^(\d{3,4})-/.exec(f)?.[1] ?? null, maddeler });
}

/** Künyeden hedef mevzuatı bul: kanun numarası ya da ad parçası. */
function hedefBul(kunye: string) {
  const noEsl = /\b(\d{3,4})\b/.exec(kunye);
  if (noEsl) {
    const h = indeks.find((x) => x.no === noEsl[1]);
    if (h) return h;
  }
  const k = kunye.toLocaleLowerCase('tr-TR');
  if (/anayasa/.test(k) && !/mahkemesi kanunu/.test(k)) return indeks.find((x) => /anayasasi/.test(x.dosya));
  if (/y[öo]netmelik/.test(k)) return indeks.find((x) => /yonetmel/.test(x.dosya));
  return undefined;
}

let toplam = 0, dogru = 0;
const sorunlu: string[] = [], atlanan: string[] = [];
/** Açıklama turu + kurtarma turu önerileri — ikisi de bankaya künye yazıyor. */
const kaynaklar: { id: string; dayanak: string | null }[] = [];
if (existsSync(`${KOK}/aciklama`))
  for (const f of readdirSync(`${KOK}/aciklama`).filter((x) => x.endsWith('.json')))
    for (const a of JSON.parse(readFileSync(`${KOK}/aciklama/${f}`, 'utf8')))
      kaynaklar.push({ id: a.id, dayanak: a.dayanak });
if (existsSync(`${KOK}/kurtarma`))
  for (const f of readdirSync(`${KOK}/kurtarma`).filter((x) => /-oneri\.json$/.test(x)))
    for (const o of JSON.parse(readFileSync(`${KOK}/kurtarma/${f}`, 'utf8')))
      if (o.duzeltme?.dayanak) kaynaklar.push({ id: `${o.id}(kurtarma)`, dayanak: o.duzeltme.dayanak });

{
  for (const a of kaynaklar) {
    if (!a.dayanak) continue;
    toplam++;
    const h = hedefBul(a.dayanak);
    if (!h) { atlanan.push(`${a.id}: ${a.dayanak} (elde metin yok)`); continue; }
    // "Ek md 30" / "Geçici md 5" biçiminde nitelik ÖNCE gelir; düz "md 30"
    // deseni bunu kaçırıp yanlış madde arar. Önce nitelikli biçimi dene.
    const m =
      /\b(Ek|Geçici|Mükerrer)\s*(?:m(?:d|adde)\.?\s*)?(\d+)/i.exec(a.dayanak)
        ? (() => {
            const x = /\b(Ek|Geçici|Mükerrer)\s*(?:m(?:d|adde)\.?\s*)?(\d+)/i.exec(a.dayanak)!;
            const nitelik = x[1][0].toLocaleUpperCase('tr-TR') + x[1].slice(1).toLocaleLowerCase('tr-TR');
            return [x[0], `${nitelik} ${x[2]}`] as unknown as RegExpExecArray;
          })()
        : /m(?:d|adde)\.?\s*(?:no\.?\s*)?([0-9]+(?:\/[A-Za-zÇĞİÖŞÜçğıöşü0-9-]+)?)/i.exec(a.dayanak);
    if (!m) { atlanan.push(`${a.id}: ${a.dayanak} (madde numarası yok)`); continue; }
    const ham = m[1].trim();
    const adaylar = [ham, ham.split('/')[0], ham.replace(/\s+/g, ' ')];
    if (adaylar.some((x) => h.maddeler.has(x))) dogru++;
    else sorunlu.push(`${a.id}: ${h.ad.slice(0, 40)} md ${ham} METİNDE YOK → "${a.dayanak}"`);
  }
}
console.log(`künyeli açıklama : ${toplam}`);
console.log(`metinde doğrulandı: ${dogru}`);
console.log(`doğrulanamaz     : ${atlanan.length}`);
console.log(`SORUNLU          : ${sorunlu.length}`);
for (const s of sorunlu) console.log(`  ✗ ${s}`);
