/**
 * mevzuat.gov.tr konsolide metnini çekme, maddelere bölme ve madde gövdesini
 * temizleme — `mevzuat-degisiklik-tara.ts` ile `mevzuat-madde-tazele.ts` ortak kullanır.
 *
 * Mevcut `law-text-parser` madde başlığını SATIR BAŞINDA arar; yönetmelik
 * sayfalarında başlık satır içinde kaldığı için bozulur. Burada başlık metnin
 * herhangi bir yerinde tanınır, sayfa sonundaki değişiklik cetveli / işlenemeyen
 * hükümler eki kesilir ve dipnot tanımları ayrı tutulur.
 */
import { execFileSync } from 'child_process';

/**
 * Kaynak Word'den dışa aktarılmış HTML: kaynak koddaki satır sonları ~80 karakterde yapılan SARMALAMADIR,
 * paragraf değildir. Önce tüm boşluklar teke indirilir; paragraf sınırı yalnız blok etiketlerinden gelir.
 */
export function htmlToMetin(html: string): string {
  let s = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/\s+/g, ' ');
  s = s.replace(/<\/(p|div|tr|br|h[1-6])\s*\/?>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/ /g, ' ');
  return s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

const EK_BASLANGIC = /(\d+\s+SAYILI\s+KANUNA\s+EK\s+VE\s+DEĞİ\s?ŞİKLİK|KANUNA\s+İ?\s?ŞLENEMEYEN\s+HÜKÜMLER|İŞLENEMEYEN\s+HÜKÜMLER|Yönetmeliğin\s+Yayımlandığı\s+Resmî\s+Gazete|Yönetmelikte\s+Değişiklik\s+Yapan)/;
export const DIPNOT_TANIM = /\[(\d+)\]\s*((?:\d{1,2}\/\d{1,2}\/\d{4}\s+tarihli|Anayasa\s+Mahkemesi)[^[]{0,700})/g;
const BASLIK = /(?:^|\n|\s)((?:EK|Ek|GEÇİCİ|Geçici)\s+)?(?:MADDE|Madde)\s+(\d+(?:\/[A-ZÇĞİÖŞÜ])?)\s*[–—-]/g;

const kanonik = (ek: string | undefined, no: string) => (!ek ? no : /^ek/i.test(ek) ? `Ek ${no}` : `Geçici ${no}`);

export type KaynakMadde = { no: string; metin: string };

export function bol(metin: string): { maddeler: KaynakMadde[]; dipnot: Map<string, string> } {
  const kes = metin.search(EK_BASLANGIC);
  const govde = kes > 0 ? metin.slice(0, kes) : metin;
  const dipnot = new Map<string, string>();
  for (const m of metin.matchAll(DIPNOT_TANIM)) if (!dipnot.has(m[1])) dipnot.set(m[1], m[2].trim());
  const temiz = govde.replace(DIPNOT_TANIM, ' ');
  const basliklar = [...temiz.matchAll(BASLIK)].map((m) => ({ no: kanonik(m[1]?.trim(), m[2]), bas: m.index! + m[0].indexOf(m[1] ?? 'M') }));
  const gorulen = new Set<string>();
  const maddeler: KaynakMadde[] = [];
  basliklar.forEach((b, i) => {
    if (gorulen.has(b.no)) return; // aynı numara ikinci kez: atıf ya da ek tablo — ilki esastır
    gorulen.add(b.no);
    maddeler.push({ no: b.no, metin: temiz.slice(b.bas, basliklar[i + 1]?.bas ?? temiz.length).trim() });
  });
  return { maddeler, dipnot };
}

/** Kaynağı çeker; kayıtlı tertip yanlışsa öteki tertipleri dener (PVSK: kayıtlı 5, doğrusu 3). */
export function kaynakGetir(tur: string, no: string, tertipler: string[], asgariMadde: number) {
  let son = { maddeler: [] as KaynakMadde[], dipnot: new Map<string, string>(), url: '' };
  for (const t of [...new Set(tertipler.filter(Boolean))]) {
    const url = `https://mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=${tur}&MevzuatNo=${no}&MevzuatTertip=${t}`;
    let html = '';
    try {
      html = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'User-Agent: Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120', url], { encoding: 'utf-8', maxBuffer: 64 << 20 });
    } catch { html = ''; }
    execFileSync('sleep', ['1.5']);
    son = { ...bol(htmlToMetin(html)), url };
    if (son.maddeler.length >= asgariMadde) break;
  }
  return son;
}

/** Madde başlığı sayılabilecek satır: noktalamayla bitmiyor, fıkra/bent açmıyor. Uzun başlık var
 *  (5395 md 41/F: 111 karakter) — sınır gövde paragrafını başlık sanmamak için. */
const baslikSatiri = (l: string) =>
  l.length <= 160 && !/[.:;,)]$/.test(l) && !/^(\(\d+\)|[a-zçğıöşü]\)|\d+\.)/.test(l);

/** Gövde başındaki şerh, bankadaki biçimde kendi satırında durur: "(Ek: 16/6/1985 - 3233/7 md.)" ⏎ "Polis, …". */
const BAS_SERH = /^(\((?:Ek|Değişik|Mülga|Yeniden düzenleme)[^()]*\))\s+(?!\(\d+\))(\S)/;

/**
 * Kaynak madde bölümünü bankadaki biçime getirir:
 *  - "Madde 31-" / "Ek Madde 7 –" etiketi düşer (künye ayrı gösterilir), "(Değişik: …)" şerhleri KALIR;
 *  - "[N]" dipnot işaretleri düşer;
 *  - her satır kaynağın bir paragrafıdır (bkz. htmlToMetin); numarasız fıkralar (PVSK, 3713) da ayrı kalır.
 *    Yalnız noktalamasız biten satırın ardından küçük harfle süren satır (Word'ün paragraf içinde
 *    bıraktığı kırılım) öncekine eklenir;
 *  - bölümün sonuna yapışmış SONRAKİ maddenin başlığı (ve kısım/bölüm başlıkları) ayrılır.
 */
export function temizle(bolum: string): { govde: string; sondakiBaslik: string | null } {
  const satirlar = bolum.replace(/\[\d+\]/g, ' ').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (satirlar.length) satirlar[0] = satirlar[0].replace(/^((?:EK|Ek|GEÇİCİ|Geçici)\s+)?(?:MADDE|Madde)\s+\d+(?:\/[A-ZÇĞİÖŞÜ])?\s*[–—-]\s*/, '');
  const kuyruk: string[] = [];
  while (satirlar.length > 1 && baslikSatiri(satirlar[satirlar.length - 1])) kuyruk.unshift(satirlar.pop()!);
  const devam = (onceki: string | undefined, l: string) => !!onceki && !/[.:;,)]$/.test(onceki) && /^[a-zçğıöşü]/.test(l) && !/^[a-zçğıöşü]\)\s/.test(l);
  const basliklar: string[] = [];
  for (const l of kuyruk) {
    if (devam(basliklar[basliklar.length - 1], l)) basliklar[basliklar.length - 1] += ' ' + l;
    else basliklar.push(l);
  }
  const paragraflar: string[] = [];
  for (const l of satirlar) {
    if (devam(paragraflar[paragraflar.length - 1], l)) paragraflar[paragraflar.length - 1] += ' ' + l;
    else paragraflar.push(l);
  }
  if (paragraflar.length) paragraflar[0] = paragraflar[0].replace(BAS_SERH, '$1\n$2');
  // Son başlık sonraki maddenin başlığıdır; öncesindekiler kısım/bölüm başlıkları olabilir.
  return { govde: paragraflar.join('\n').replace(/ +([,.;:])/g, '$1').trim(), sondakiBaslik: basliklar.length ? basliklar[basliklar.length - 1] : null };
}
