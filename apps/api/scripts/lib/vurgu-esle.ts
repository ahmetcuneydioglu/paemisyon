/**
 * Madde metni betikle değiştiğinde (dipnot temizliği, tazeleme) kullanıcı vurgularını yeni metne taşır.
 * Vurgu konumla saklanır (startOffset/endOffset); metin değişince konum kayar. Eşleme boşluğa duyarsızdır
 * (eski içe aktarımda satır içi satır sonları vardı), birden çok eşleşmede eski konuma oranca en yakını seçilir.
 * Bulunamazsa null döner: çağıran yazmamalı ya da açıkça bildirmelidir.
 */
export function vurguEsle(h: { startOffset: number; endOffset: number; snippet: string }, eski: string, yeni: string) {
  // Önce eski metindeki vurgulu kısmın TAMAMI (snippet 500 karakterde kesilebiliyor, PVSK md 20), dipnot
  // numarası düşürülmüş hâliyle; bulunamazsa snippet.
  const tam = eski.slice(h.startOffset, h.endOffset).replace(/([.;:,)”"…])\d{1,3}(?=\s|$)/g, '$1');
  return vurguAra(tam, h.startOffset, eski, yeni) ?? vurguAra(h.snippet, h.startOffset, eski, yeni);
}

function vurguAra(parca: string, startOffset: number, eski: string, yeni: string) {
  const kel = parca.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!kel.length || !kel[0]) return null;
  const re = new RegExp(kel.join('\\s+'), 'g');
  const adaylar = [...yeni.matchAll(re)];
  if (!adaylar.length) return null;
  const oran = startOffset / Math.max(1, eski.length); // birden çok eşleşmede eski konuma en yakını
  // Aynı ifade maddede birkaç kez geçebilir (3201 md 55: "Birinci Hukuk Müşaviri"): önce vurgunun hemen önündeki
  // kelimeler yeni metinde de önünde duran aday, eşitlikte eski konuma oranca en yakını.
  const once = eski.slice(0, startOffset).trim().split(/\s+/).slice(-5).map((w) => w.replace(/\d+$/, ''));
  const baglam = (ix: number) => {
    const y = yeni.slice(0, ix).trim().split(/\s+/).slice(-5);
    let n = 0;
    while (n < once.length && n < y.length && once[once.length - 1 - n] === y[y.length - 1 - n]) n++;
    return n;
  };
  const m = adaylar.reduce((x, y) => {
    const bx = baglam(x.index!), by = baglam(y.index!);
    if (bx !== by) return by > bx ? y : x;
    return Math.abs(y.index! / yeni.length - oran) < Math.abs(x.index! / yeni.length - oran) ? y : x;
  });
  return { startOffset: m.index!, endOffset: m.index! + m[0].length };
}
