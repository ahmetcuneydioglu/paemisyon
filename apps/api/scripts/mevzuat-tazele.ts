/**
 * Doc 32 — MEVZUAT TAZELEYICI. Bankadaki kanun metinlerini resmi kaynakla karsilastirir.
 *
 * NEDEN: Denetimde bulunan 8 kusurun 5'i MEVZUAT DEGISIKLIGINDEN dogmustu
 * (7499 s.K. sure degisiklikleri, 7551 s.K., AYM iptalleri). Soru bankasi
 * bozulmuyor; ALTINDAKI MEVZUAT degisiyor. `eskime-tara.ts` bu degisiklikleri
 * madde metnindeki dipnotlardan yakalar — ama metin bayatsa dipnot da bayattir.
 * Yani zincirin ilk halkasi metnin kendisini tazelemektir.
 *
 * ERISIM: mevzuat.gov.tr'nin PDF adresi ve ana sayfasi bot korumali, ama iki uc
 * curl'e ACIK (30 Agu 2026 itibariyla dogrulandi):
 *   - POST /anasayfa/MevzuatDatatable                 -> mevzuat numarasi arama
 *   - GET  /anasayfa/MevzuatFihristDetayIframe?...    -> tam konsolide metin (HTML)
 * Bu script ikincisini kullanir; hedefi LawArticle.sourceUrl'den cozer.
 *
 * GUVENLIK — varsayilan KURU CALISMA, ve yazma modunda bile:
 *  - Cekilen metinden cozulen madde sayisi bankadakinin %70'inin altina duserse
 *    o kanun ATLANIR (parse bozuldu demektir; yarim metinle bankayi EZMEYIZ).
 *  - Yalnizca METNI DEGISMIS maddeler guncellenir; dokunulmayan madde yazilmaz.
 *  - Her yazma oncesi eski metin yedege alinir.
 *  - Istekler arasi bekleme vardir (kaynagi yormamak icin).
 *
 * AKIS: once bunu calistir, degisen maddeleri gor; uygula; ARDINDAN
 * `eskime-tara.ts` ile o maddelere bagli sorulari tara.
 *
 * BILINEN SINIR (30 Agu 2026 olcumu — TCK):
 *   Bankadaki metinler PDF'ten geldigi icin DIPNOT KIRLILIGI tasiyor: dipnot
 *   cumleleri madde govdesinin ORTASINA girmis (m.86: bankada 1717 karakter,
 *   kaynakta 915). Kaynak HTML temiz. Bu yuzden ham karsilastirma her maddeyi
 *   "degismis" gosteriyordu; normalizasyon (dipnot cumlesi elemesi + onek
 *   kurali + harf-dizisi karsilastirmasi) farki 139'dan 22'ye dusurdu, ama
 *   incelenen orneklerin TAMAMI hala bicimseldi — gercek metin degisikligi
 *   bulunmadi.
 *
 *   Yani bu script su an GUVENILIR BIR ALARM DEGIL. Guvenilir olmasi icin
 *   bankanin bir kez temiz kaynaktan yeniden kurulmasi ve dipnotlarin AYRI
 *   bir alanda saklanmasi gerekir (LawArticle.text govde, ayrica footnotes).
 *   O yapilana kadar cikti "aday listesi" olarak okunmali, otomatik yazma
 *   yapilmamalidir.
 *
 *   npx tsx scripts/mevzuat-tazele.ts                 (tumu, kuru calisma)
 *   npx tsx scripts/mevzuat-tazele.ts --konu "Türk Ceza"
 *   npx tsx scripts/mevzuat-tazele.ts --yaz
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { parseLawText } from '../src/modules/admin/law-articles/law-text-parser';

const p = new PrismaClient();
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/tazeleme-yedek.json`;
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** sourceUrl -> {tur, no, tertip}. Parametre SIRASI onemsiz. */
function hedefCoz(url: string | null): { tur: string; no: string; tertip: string } | null {
  if (!url) return null;
  const g = (k: string) => new RegExp(`${k}=(\\d+)`, 'i').exec(url)?.[1] ?? null;
  const tur = g('MevzuatTur'), no = g('MevzuatNo'), tertip = g('MevzuatTertip');
  return tur && no && tertip ? { tur, no, tertip } : null;
}

/** mevzuat.gov.tr iframe HTML'ini duz metne cevirir (import hattiyla ayni bicim). */
function htmlToMetin(html: string): string {
  let s = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<\/(p|div|tr|br|h[1-6])\s*\/?>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/ /g, ' ');
  return s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

/**
 * Karsilastirma icin normalizasyon. Bankadaki metinler PDF'ten geldigi icin
 * DIPNOTLAR madde govdesine yapisik ("...avukatlar,2 e) Gece..." ve madde
 * sonunda "1 Bu Kanunun yururluk ve uygulama sekli..."); kaynak HTML'de ise
 * dipnotlar govdenin disinda. Bu, gercek bir metin degisikligi DEGILDIR.
 * Dipnot isaretlerini ve bosluk gurultusunu duserek yalniz HARF DIZISINI
 * karsilastiririz.
 */
// Dipnot CUMLELERI: "29/6/2005 tarihli ve 5377 sayili Kanunun 3 uncu maddesiyle
// ... degistirilmistir." Bankadaki PDF kaynakli metinlerde bunlar govdenin
// ORTASINA girmis durumda; kaynak HTML'de govdede yoklar. Karsilastirmadan once
// her iki taraftan da dusulur, yoksa her madde "degismis" gorunur.
const DIPNOT_RE = /\d{1,2}\/\d{1,2}\/\d{4}\s*tarihli\s*ve\s*\d+\s*say[ıi]l[ıi][\s\S]{0,400}?(?:de[ğg]i[şs]tirilmi[şs]tir|eklenmi[şs]tir|y[üu]r[üu]rl[üu][ğg][üu]nden\s*kald[ıi]r[ıi]lm[ıi][şs]t[ıi]r|i[şs]lenmi[şs]tir|iptal\s*edilmi[şs]tir)\.?/gi;

const normal = (s: string) => s
  .replace(DIPNOT_RE, ' ')
  .replace(/\[\d+\]/g, ' ')          // "[2]" dipnot isareti
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('tr')
  .replace(/[^a-zçğıöşü ]/g, '')      // rakam ve noktalama at
  .replace(/\s+/g, ' ').trim();

/**
 * Fark GERCEK mi? Bankadaki metin, kaynagin uzerine dipnot kuyrugu eklenmis
 * hali olabilir. Kaynak, bankanin ONEKI ise (ya da tersi) fark bicimseldir.
 */
function gercekFark(banka: string, kaynak: string): boolean {
  const b = normal(banka), k = normal(kaynak);
  if (b === k) return false;
  if (b.startsWith(k) || k.startsWith(b)) return false;   // dipnot kuyrugu
  return true;
}

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const konuAra = arg('--konu');
  const bekleMs = Number(arg('--bekle') ?? 1200);

  const konular = await p.topic.findMany({
    where: { deletedAt: null, ...(konuAra ? { name: { contains: konuAra, mode: 'insensitive' } } : {}) },
    select: { id: true, name: true,
      lawArticles: { where: { deletedAt: null }, select: { id: true, articleNo: true, text: true, sourceUrl: true, status: true } } },
  });
  const hedefler = konular.filter((k) => k.lawArticles.length > 0);
  console.log(`madde tasiyan konu: ${hedefler.length}\n`);

  const degisenler: Array<{ konu: string; articleNo: string; id: string; eski: string; yeni: string }> = [];
  const atlanan: string[] = [];

  for (const k of hedefler) {
    const h = hedefCoz(k.lawArticles.find((a) => a.sourceUrl)?.sourceUrl ?? null);
    if (!h) { atlanan.push(`${k.name} — sourceUrl'den hedef cozulemedi`); continue; }

    const url = `https://mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=${h.tur}&MevzuatNo=${h.no}&MevzuatTertip=${h.tertip}`;
    // NOT: Node'un yerlesik fetch'i bu ortamda calismiyor ("fetch failed"),
    // curl calisiyor — istek curl'e verildi.
    let html: string;
    try {
      html = execFileSync('curl', ['-sL', '--max-time', '45',
        '-H', 'User-Agent: Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120', url],
        { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
      if (!html || html.length < 2000) { atlanan.push(`${k.name} — bos/kisa yanit (${html?.length ?? 0} bayt)`); continue; }
    } catch (e) {
      atlanan.push(`${k.name} — istek hatasi: ${(e as Error).message}`); continue;
    }
    await bekle(bekleMs);

    const cozulen = parseLawText(htmlToMetin(html));
    // PARSE SAGLIK KONTROLU: yarim metinle bankayi ezmeyiz.
    if (cozulen.length < k.lawArticles.length * 0.7) {
      atlanan.push(`${k.name} — parse saglik kontrolu: ${cozulen.length} madde cozuldu, bankada ${k.lawArticles.length} (%70 esigi altinda)`);
      continue;
    }
    const yeniMap = new Map(cozulen.map((a) => [a.articleNo, a.text]));

    let fark = 0;
    for (const a of k.lawArticles) {
      const yeni = yeniMap.get(a.articleNo);
      if (!yeni) continue;                       // kaynakta yok — dokunma (mulga/numara degisimi olabilir)
      if (!gercekFark(a.text, yeni)) continue;   // bicimsel fark (dipnot/bosluk) — atla
      degisenler.push({ konu: k.name, articleNo: a.articleNo, id: a.id, eski: a.text, yeni });
      fark++;
    }
    console.log(`${fark ? '*' : ' '} ${k.name.slice(0, 52).padEnd(54)} kaynak ${String(cozulen.length).padStart(3)} madde | DEGISEN ${fark}`);
  }

  console.log(`\nDEGISEN MADDE: ${degisenler.length}`);
  const gruplu = new Map<string, string[]>();
  for (const d of degisenler) {
    if (!gruplu.has(d.konu)) gruplu.set(d.konu, []);
    gruplu.get(d.konu)!.push(d.articleNo);
  }
  for (const [k, v] of gruplu) console.log(`   ${k}: m.${v.join(', m.')}`);
  if (atlanan.length) {
    console.log(`\nATLANAN: ${atlanan.length}`);
    for (const a of atlanan) console.log(`   ${a}`);
  }

  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }
  if (!degisenler.length) return;

  writeFileSync(YEDEK, JSON.stringify(degisenler.map((d) => ({ ...d, zaman: new Date().toISOString() })), null, 1));
  for (const d of degisenler) {
    await p.lawArticle.update({ where: { id: d.id }, data: { text: d.yeni, lastVerifiedAt: new Date() } });
  }
  console.log(`\nGUNCELLENDI: ${degisenler.length} madde. Yedek: ${YEDEK}`);
  console.log('\nDIKKAT: kaynak HTML dipnotlari madde govdesinde TASIMAZ. Guncellenen');
  console.log('maddelerde "(Degisik: …)" serhleri korunur ama sayfa dibindeki dipnot');
  console.log('metinleri ("… ibaresi … seklinde degistirilmistir") KAYBOLUR; eskime-tara.ts');
  console.log('bu maddelerde artik degisiklik gecmisi goremez. Bu yuzden yazma, yalnizca');
  console.log('GERCEK metin degisikligi tespit edilen maddelerle sinirli tutulur.');
  console.log('\nSIRADAKI ADIM: npx tsx scripts/eskime-tara.ts --yildan 2018');
})().finally(() => p.$disconnect());
