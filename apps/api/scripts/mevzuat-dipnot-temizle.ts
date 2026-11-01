/**
 * Doc 48 — Madde metinlerine karışmış dipnotları resmî kaynaktan yeniden yazarak temizler.
 *
 * PDF'ten aktarılmış maddelerde sayfa dipnotları (değişiklik notları), sayfa kesimindeki
 * sonraki maddenin başlığı ve satır sonu dipnot numaraları gövdeye karışmış. Kalıpla silmek
 * güvenli değil (dipnot devam satırları gövdeden ayırt edilemiyor); bu yüzden madde
 * mevzuat.gov.tr HTML konsolide metninden yeniden alınır (`lib/mevzuat-kaynak`).
 *
 * YALNIZ SİLME KAPISI: yeni metnin kelime dizisi eski metnin kelime dizisinin alt dizisi
 * olmalı — yeni metin eskiden yalnız bir şey ÇIKARIR, hiçbir şey EKLEMEZ. Sınıflar:
 *   A  kapıdan geçer, çıkarılan her parça dipnot görünümünde → `--yaz` ile yazılır
 *   B  kaynak bir şey ekliyor / çıkarılan parça dipnota benzemiyor / vurgu eşlenemiyor → elle
 *   C  madde kaynakta bulunamadı ya da temiz gövde boş → elle
 *   kelime dizisi aynı olan maddeye (temiz madde) dokunulmaz.
 *
 * Yazılan madde kaynağın paragraf biçimine geçer (paragraf başına bir satır; Doc 48 §6 (a)).
 * Kullanıcı vurgularının ofsetleri saklı `snippet` yeni metinde aranarak yeniden hesaplanır.
 * `effectiveInfo`, `sourceUrl`, durum korunur; `lastVerifiedAt` güncellenir. Yazmadan önce
 * eski satırlar yedeğe alınır, her yazım `mevzuat-tazeleme.jsonl` defterine düşer.
 *
 *   npx tsx scripts/mevzuat-dipnot-temizle.ts <kanun-no|ad başı> [--rapor <dosya.md>]   (kuru)
 *   npx tsx scripts/mevzuat-dipnot-temizle.ts <kanun-no|ad başı> --yaz [--beklenen <A sayısı, hariç düşülmüş>] [--haric <md,md>]
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { kaynakGetir, temizle } from './lib/mevzuat-kaynak';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const D32 = join(__dirname, '../../../docs/32-yayin-denetimi');
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

/** Kelime dizisi: harf/rakam öbekleri, Türkçe küçük harf, şapka korunur (hâkim ≠ hakim). */
const kelimeler = (s: string) => s.toLocaleLowerCase('tr').match(/\p{L}+|\p{N}+/gu) ?? []; // "kısım81" → kısım, 81

/** Dipnot görünümü: değişiklik notunun kelimeleri ya da tarih. */
const DIPNOT_SOZ = /^(tarihli|sayılı|ibaresi|ibareleri|ibaresinden|ibarelerinden|değiştirilmiştir|değiştirilmiş|eklenmiştir|eklenmiş|çıkarılmıştır|çıkarılmış|iptal|edilmiştir|kanunlaşmıştır|teselsül|ettirilmiştir|yürürlükten|kaldırılmıştır|işlendiği|metne|khk|nin|nın|maddesiyle|fıkrasıyla|bendiyle|kararıyla|bakınız)$/;

type Kosu = { bas: number; son: number; kelime: string[] }; // eski dizide [bas, son)

/** LCS hizalaması: eskide eşleşmeyen (silinen) ve yenide eşleşmeyen (eklenen) kelime koşuları.
 *  Kapı için eklenen boş olmalı; doluysa B raporunda neyin eklendiği gösterilir. */
function hizala(eski: string[], yeni: string[]): { silinen: Kosu[]; eklenen: string[] } {
  const n = eski.length, m = yeni.length;
  // Ortak baş/son kırpılır: tablo yalnız farklı orta bölgede kurulur.
  let bas = 0; while (bas < n && bas < m && eski[bas] === yeni[bas]) bas++;
  let son = 0; while (son < n - bas && son < m - bas && eski[n - 1 - son] === yeni[m - 1 - son]) son++;
  const E = eski.slice(bas, n - son), Y = yeni.slice(bas, m - son);
  const a = E.length, b = Y.length;
  if (b === 0) return { silinen: a ? [{ bas, son: bas + a, kelime: E }] : [], eklenen: [] };
  if (a === 0) return { silinen: [], eklenen: [Y.join(' ')] };
  const L = Array.from({ length: a + 1 }, () => new Uint16Array(b + 1));
  for (let i = a - 1; i >= 0; i--)
    for (let j = b - 1; j >= 0; j--) L[i][j] = E[i] === Y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const kosular: Kosu[] = [];
  const eklenen: string[] = [];
  let i = 0, j = 0, acik: Kosu | null = null, ek: string[] | null = null;
  while (i < a || j < b) {
    if (i < a && j < b && E[i] === Y[j] && L[i][j] === L[i + 1][j + 1] + 1) { acik = null; ek = null; i++; j++; continue; }
    if (i < a && (j >= b || L[i + 1][j] >= L[i][j + 1])) {
      if (!acik) { acik = { bas: bas + i, son: bas + i, kelime: [] }; kosular.push(acik); }
      acik.kelime.push(E[i]); acik.son = bas + i + 1; i++;
    } else {
      if (!ek) { ek = []; eklenen.push(''); }
      ek.push(Y[j]); eklenen[eklenen.length - 1] = ek.join(' '); j++;
    }
  }
  return { silinen: kosular, eklenen };
}

/** Aralarında en çok `bosluk` eşleşen kelime olan koşular tek küme sayılır: LCS dipnotun
 *  alıntıladığı eski ibareyi gövdedeki aynı kelimelere bağlayıp dipnotu parçalayabiliyor. */
function kumele(k: Kosu[], bosluk = 8): Kosu[] {
  const out: Kosu[] = [];
  for (const x of k) {
    const s = out[out.length - 1];
    if (s && x.bas - s.son <= bosluk) { s.kelime.push('…', ...x.kelime); s.son = x.son; } else out.push({ ...x, kelime: [...x.kelime] });
  }
  return out;
}

function dipnotMu(k: Kosu, basliklar: Set<string>, eski: string, eskiKelime: number): boolean {
  const w = k.kelime.filter((x) => x !== '…');
  // Satır sonu dipnot numarası ("verir.11", "hâkimini, 3", "(…)13,"): yalnız sayı ve eski metinde
  // noktalamaya yapışık duruyorsa. Gövdedeki bir sayının ("madde 155") düşmesi kabul edilmez.
  if (w.length <= 3 && w.every((x) => /^\d{1,3}$/.test(x) || yapisikNumara(x)))
    return w.every((n) => new RegExp(`[\\p{L}.;:,)”"…]\\s?${n}(?![\\d/])`, 'u').test(eski)); // "kararlar70" de
  // Kitap/kısım/bölüm başlığı sayfa kesiminde maddeye karışmış ("İKİNCİ KİTAP Özel Hükümler").
  // Ardından bölüm adı ve sonraki maddenin başlığı da gelebilir; 30 kelimeyle sınırlı.
  if (w.length <= 30 && /^(?:(?:birinci|ikinci|üçüncü|dördüncü|beşinci|altıncı|yedinci|sekizinci|dokuzuncu|onuncu)(?: \S+){0,2} (?:kitap|kısım|bölüm|kesim)|(?:kitap|kısım|bölüm|kesim) (?:\d+|[ıivxlc]+))\b/.test(w.join(' '))) return true;
  if (w.some((x) => DIPNOT_SOZ.test(x))) return true;
  if (/\b\d{1,2} \d{1,2} \d{4}\b/.test(w.join(' '))) return true; // gg/aa/yyyy
  // Sonraki madde başlığı (ve kısım/bölüm başlıkları): yalnız metnin SONUNDAYSA ve ya bankanın başlık/bölüm
  // kaydıyla ya da AYNI maddenin kaynak bölümünün sonundaki, Word başlık sınıfıyla (MaddeBasl, ksmblm)
  // işaretli paragraflarla eşleşiyorsa. Yasadaki herhangi bir başlıkla eşleştirmek yetmez.
  const metin = w.filter((x) => !/^\d+$/.test(x)).join(' ');
  return !!metin && k.son >= eskiKelime - 3 && [...basliklar].some((b) => b === metin || (metin.length >= 6 && b.includes(metin)));
}

/** Yan yana iki dipnot numarası boşluksuz yapışmış: "2930" = 29 + 30, "8182" = 81 + 82. */
function yapisikNumara(x: string): boolean {
  if (!/^\d{2,12}$/.test(x)) return false;
  const devam = (kalan: string, onceki: number): boolean => {
    if (!kalan) return true;
    const s = String(onceki + 1);
    return kalan.startsWith(s) && devam(kalan.slice(s.length), onceki + 1);
  };
  for (let i = 1; i < x.length; i++) if (devam(x.slice(i), Number(x.slice(0, i)))) return true;
  return false;
}

/** Vurgu ofsetlerini yeni metinde snippet arayarak yeniden hesaplar. */
function vurguEsle(h: { startOffset: number; endOffset: number; snippet: string }, eski: string, yeni: string) {
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
  const m = adaylar.reduce((x, y) => (Math.abs(y.index! / yeni.length - oran) < Math.abs(x.index! / yeni.length - oran) ? y : x));
  return { startOffset: m.index!, endOffset: m.index! + m[0].length };
}

(async () => {
  const hedef = process.argv[2];
  if (!hedef || hedef.startsWith('--')) throw new Error('kullanım: … <kanun-no|ad başı> [--rapor dosya.md] [--yaz]');
  const YAZ = process.argv.includes('--yaz');
  const simdi = new Date();

  const leg = await p.legislation.findFirstOrThrow({
    where: { deletedAt: null, ...(/^\d+$/.test(hedef) ? { number: hedef } : { name: { startsWith: hedef } }) },
    select: { id: true, name: true, number: true,
      articles: { where: { deletedAt: null }, orderBy: { sortKey: 'asc' },
        select: { id: true, articleNo: true, title: true, text: true, sourceUrl: true, status: true, lastVerifiedAt: true, effectiveInfo: true,
          highlights: { select: { id: true, startOffset: true, endOffset: true, snippet: true } } } } },
  });
  const u = leg.articles.find((a) => /MevzuatNo=/i.test(a.sourceUrl ?? ''))?.sourceUrl ?? '';
  const g = (k: string) => new RegExp(`${k}=(\\d+)`, 'i').exec(u)?.[1];
  const pdf = /MevzuatMetin\/(\d+)\.(\d+)\.(\d+)\.pdf/i.exec(leg.articles.find((a) => a.sourceUrl)?.sourceUrl ?? '');
  const tur = g('MevzuatTur') ?? pdf?.[1] ?? '1';
  const no = g('MevzuatNo') ?? pdf?.[3] ?? leg.number;
  if (!no) throw new Error(`${leg.name}: kaynak numarası bulunamadı`);
  const k = kaynakGetir(tur, no, [g('MevzuatTertip') ?? pdf?.[2] ?? '5', '5', '3', '4'], leg.articles.length * 0.5);
  const kaynak = new Map(k.maddeler.map((m) => [m.no, m.metin]));

  const basliklar = new Set<string>();
  for (const a of leg.articles) if (a.title) basliklar.add(kelimeler(a.title).join(' '));
  for (const b of await p.legislationSection.findMany({ where: { legislationId: leg.id }, select: { heading: true } })) basliklar.add(kelimeler(b.heading).join(' '));

  type Sonuc = { id: string; no: string; sinif: 'A' | 'B' | 'C'; neden?: string; eski: string; yeni?: string; kumeler: string[]; vurgular: { id: string; startOffset: number; endOffset: number }[] };
  const sonuclar: Sonuc[] = [];
  let temiz = 0;
  for (const a of leg.articles) {
    const km = kaynak.get(a.articleNo);
    const govde = km ? temizle(km).govde : '';
    const isaretli = /^\d{1,3} \d{1,2}\/\d{1,2}\/\d{4} tarihli/m.test(a.text) || /[.;:,)”"]\d{1,3}$/m.test(a.text);
    if (!govde) {
      if (isaretli) sonuclar.push({ id: a.id, no: a.articleNo, sinif: 'C', neden: km ? 'temiz gövde boş' : 'kaynakta bulunamadı', eski: a.text, kumeler: [], vurgular: [] });
      continue;
    }
    if (govde === a.text) { temiz++; continue; }
    const { silinen: kos, eklenen } = hizala(kelimeler(a.text), kelimeler(govde));
    // Bu maddenin kaynak bölümünün sonundaki başlıklar: tek tek ve art arda birleşik hâlleri.
    const kb = (km ? temizle(km).kuyrukBasliklar : []).filter((b) => !/[.;,][”"’)\]]*$/.test(b)).map((b) => kelimeler(b).join(' ')); // cümle başlık değildir
    const buBasliklar = new Set([...basliklar, ...kb, ...kb.map((_, i) => kb.slice(i).join(' '))]);
    if (eklenen.length) { sonuclar.push({ id: a.id, no: a.articleNo, sinif: 'B', neden: `kaynak ekliyor: «${eklenen.join(' / ').slice(0, 300)}»`, eski: a.text, yeni: govde, kumeler: kumele(kos).map((x) => x.kelime.join(' ')), vurgular: [] }); continue; }
    if (!kos.length) { temiz++; continue; } // yalnız biçim/noktalama farkı: dokunulmaz
    const kumeler = kumele(kos);
    const eskiK = kelimeler(a.text).length;
    const yabanci = kumeler.filter((x) => !dipnotMu(x, buBasliklar, a.text, eskiK));
    const vurgular: Sonuc['vurgular'] = [];
    let vurguHata = '';
    for (const h of a.highlights) { const e = vurguEsle(h, a.text, govde); if (e) vurgular.push({ id: h.id, ...e }); else vurguHata = `vurgu eşlenemedi: "${h.snippet.slice(0, 60)}"`; }
    const sinif = yabanci.length || vurguHata ? 'B' : 'A';
    sonuclar.push({ id: a.id, no: a.articleNo, sinif, neden: yabanci.length ? `dipnota benzemeyen silinen parça: «${yabanci.map((x) => x.kelime.join(' ')).join(' / ').slice(0, 200)}»` : vurguHata || undefined,
      eski: a.text, yeni: govde, kumeler: kumeler.map((x) => x.kelime.join(' ')), vurgular });
  }
  const say = (s: string) => sonuclar.filter((x) => x.sinif === s).length;
  const kaynakFazla = k.maddeler.filter((m) => !leg.articles.some((a) => a.articleNo === m.no)).map((m) => m.no);
  console.log(`${leg.name} — banka ${leg.articles.length} madde · kaynak ${k.maddeler.length} (${k.url})`);
  console.log(`A (yazılacak) ${say('A')} · B (elle) ${say('B')} · C (kaynakta yok) ${say('C')} · dokunulmayan ${temiz}`);
  if (kaynakFazla.length) console.log(`kaynakta olup bankada olmayan (bu betiğin işi değil): ${kaynakFazla.join(', ')}`);
  for (const x of sonuclar.filter((s) => s.sinif !== 'A')) console.log(`  ${x.sinif} md ${x.no}: ${x.neden}`);

  const rapor = arg('--rapor');
  if (rapor) {
    const r: string[] = [`# ${leg.name} — dipnot temizliği kuru raporu`, '', `${simdi.toLocaleString('tr-TR')} · kaynak: ${k.url}`, '',
      `| Sınıf | Madde |`, `|---|---|`, `| A — yazılacak | ${say('A')} |`, `| B — elle incelenecek | ${say('B')} |`, `| C — kaynakta yok | ${say('C')} |`, `| Dokunulmayan (temiz) | ${temiz} |`, ''];
    for (const s of ['B', 'C', 'A'] as const) {
      const xs = sonuclar.filter((x) => x.sinif === s);
      if (!xs.length) continue;
      r.push(`## ${s === 'A' ? 'A — yazılacak' : s === 'B' ? 'B — elle incelenecek' : 'C — kaynakta yok'}`, '');
      for (const x of xs) {
        r.push(`### md. ${x.no}`, '');
        if (x.neden) r.push(`**Neden:** ${x.neden}`, '');
        if (x.kumeler.length) r.push('**Silinen parçalar:**', '', ...x.kumeler.map((c) => `- ${c}`), '');
        if (x.vurgular.length) r.push(`**Vurgu:** ${x.vurgular.length} vurgu yeniden eşlendi.`, '');
        {
          r.push('<details><summary>Eski / yeni metin</summary>', '', '**Eski**', '', '```', x.eski, '```', '');
          if (x.yeni) r.push('**Yeni**', '', '```', x.yeni, '```', '');
          r.push('</details>', '');
        }
      }
    }
    writeFileSync(rapor, r.join('\n'));
    console.log(`rapor: ${rapor}`);
  }

  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile yalnız A sınıfı yazılır)'); return; }
  // Son denetimde şüpheli bulunan maddeler yazımdan çıkarılır: --haric "56,Ek 3"
  const haric = new Set((arg('--haric') ?? '').split(',').map((x) => x.trim()).filter(Boolean));
  const yazilacak = sonuclar.filter((x) => x.sinif === 'A' && !haric.has(x.no));
  // Kuru rapordan sonra kaynak değişmişse (yeni değişiklik yayımlandı) onaylanan küme bu değildir: yazma.
  const beklenen = arg('--beklenen');
  if (beklenen !== undefined && Number(beklenen) !== yazilacak.length)
    throw new Error(`A sayısı kuru rapordakinden farklı (beklenen ${beklenen}, bulunan ${yazilacak.length}); hiçbir şey yazılmadı`);
  if (!yazilacak.length) { console.log('yazılacak madde yok'); return; }

  // Saatli ad: aynı kanun aynı gün ikinci kez yazılırsa ilk yedek (orijinal metin) ezilmesin.
  const yedekYol = join(D32, `dipnot-yedek-${simdi.toISOString().slice(0, 19).replace(/:/g, '')}-${leg.number ?? leg.id.slice(0, 8)}.json`);
  writeFileSync(yedekYol, JSON.stringify(yazilacak.map((x) => {
    const a = leg.articles.find((y) => y.id === x.id)!;
    return { id: a.id, articleNo: a.articleNo, text: a.text, lastVerifiedAt: a.lastVerifiedAt, highlights: a.highlights };
  }), null, 1));
  await p.$transaction(async (tx) => {
    for (const x of yazilacak) {
      await tx.lawArticle.update({ where: { id: x.id }, data: { text: x.yeni!, lastVerifiedAt: simdi } });
      for (const v of x.vurgular) await tx.articleHighlight.update({ where: { id: v.id }, data: { startOffset: v.startOffset, endOffset: v.endOffset } });
    }
  }, { timeout: 120_000 });
  appendFileSync(join(D32, 'mevzuat-tazeleme.jsonl'),
    yazilacak.map((x) => JSON.stringify({ zaman: simdi.toISOString(), tur: 'dipnot-temizle', mevzuat: leg.name, madde: x.no, kaynak: k.url })).join('\n') + '\n');
  console.log(`✓ ${yazilacak.length} madde yazıldı · yedek: ${yedekYol}`);
})().finally(() => p.$disconnect());
