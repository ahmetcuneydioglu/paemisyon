/**
 * CMK SÜRELER — 100 soruluk deneme üretimi (kaynak: YALNIZ verilen kanun PDF'i).
 * Aşamalar: ① süre içeren maddeleri çıkar ② tema gruplarıyla soru ürettir
 * (Batch API) ③ her soruyu dayanak maddesiyle doğrulat ④ JSON kaydet.
 * Kullanım: npx tsx scripts/cmk-sure-sinav.ts <kanun.pdf> [--sadece-envanter]
 * Çıktı: kanun PDF'inin yanına cmk-sure-sorular.json
 */
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.DENETIM_MODEL ?? 'claude-sonnet-5';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── kanun çıkarımı (denetim scriptiyle aynı yöntem) ──
async function extractLaw(file: string): Promise<Map<string, string>> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  let full = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = (tc.items as { str: string; transform: number[] }[]).filter((it) => it.str.trim());
    const lines = new Map<number, { x: number; s: string }[]>();
    for (const it of items) {
      const y = Math.round(it.transform[5] / 4) * 4;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y)!.push({ x: it.transform[4], s: it.str });
    }
    for (const [, parts] of [...lines.entries()].sort((a, b) => b[0] - a[0])) {
      full += `${parts.sort((a, b) => a.x - b.x).map((q) => q.s).join(' ')}\n`;
    }
  }
  const articles = new Map<string, string>();
  const re = /(?:^|\n)\s*(?:(EK|GEÇİCİ)\s+)?(?:Madde|MADDE)\s+(\d+(?:\/[A-Za-z])?)\s*[–—-]/g;
  const marks: { key: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(full))) marks.push({ key: `${m[1] ? `${m[1]} ` : ''}${m[2]}`, index: m.index });
  for (let i = 0; i < marks.length; i++) {
    const body = full
      .slice(marks[i].index, i + 1 < marks.length ? marks[i + 1].index : full.length)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
    if (!articles.has(marks[i].key)) articles.set(marks[i].key, body);
  }
  return articles;
}

const SURE_RE =
  /\b(saat|gün|hafta|ay|yıl)\b|derh[âa]l|gecikmeksizin|en geç|bir defa|uzatılabilir|itibaren|önce|sonra|kadar|süre/i;

export interface Soru {
  stem: string;
  options: string[]; // 5 metin
  dogruIndex: number; // 0-4
  zorluk: 'kolay' | 'orta' | 'zor';
  tip: string;
  madde: string;
  dayanak: string;
  aciklama: string;
}

function parseJsonArray(text: string): unknown[] | null {
  const start = text.indexOf('[');
  if (start < 0) return null;
  const raw = text.slice(start);
  try {
    return JSON.parse(raw) as unknown[];
  } catch {
    // Kesik dizi onarımı: son tamamlanmış nesneye kadar kes, diziyi kapat.
    const cut = raw.lastIndexOf('}');
    if (cut > 0) {
      try {
        return JSON.parse(`${raw.slice(0, cut + 1)}]`) as unknown[];
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function main() {
  const [kanunPdf] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dir = path.dirname(kanunPdf);
  const outPath = path.join(dir, 'cmk-sure-sorular.json');

  console.log('① Kanun dizinleniyor…');
  const law = await extractLaw(kanunPdf);
  // Süre hükmü içeren maddeler (başlangıç maddeleri; içinde zaman ifadesi geçen)
  const sureArticles = [...law.entries()].filter(([, body]) => SURE_RE.test(body));
  console.log(`   ${law.size} madde; süre/zaman ifadesi içeren: ${sureArticles.length}`);
  if (process.argv.includes('--sadece-envanter')) {
    console.log(sureArticles.map(([k]) => k).join(', '));
    return;
  }

  // ② Tema grupları: ardışık maddeler doğal tema oluşturur — 11 gruba böl
  // (11 grup × 11 soru = 121 aday; doğrulamadan düşenler için pay).
  const GROUPS = 11;
  const perGroup = Math.ceil(sureArticles.length / GROUPS);
  const chunks: [string, string][][] = [];
  for (let i = 0; i < sureArticles.length; i += perGroup) chunks.push(sureArticles.slice(i, i + perGroup));

  const genPrompt = (chunk: [string, string][], idx: number) =>
    `Sen bir ceza muhakemesi hukuku soru yazarısıdır. TEK KAYNAK aşağıdaki ` +
    `5271 sayılı CMK madde metinleridir — hafızandaki/eski mevzuat bilgisi KULLANMA; ` +
    `bu metinlerde açıkça yazmayan hiçbir süreyi doğru bilgi olarak üretme.\n\n` +
    chunk.map(([k, v]) => `─ Madde ${k}: ${v}`).join('\n\n') +
    `\n\nGÖREV: Bu maddelerdeki SÜRE/ZAMAN hükümlerinden 11 özgün çoktan seçmeli soru üret.\n` +
    `Kurallar:\n` +
    `- 5 şık, TEK doğru cevap. Çeldiriciler yukarıdaki metinlerde GERÇEKTEN geçen başka sürelerden seçilsin.\n` +
    `- Zorluk dağılımı: 2 kolay, 6 orta, 3 zor.\n` +
    `- Tip çeşitliliği (hepsinden en az bir): bilgi, olay (kısa vaka + tarih/saat hesaplama), karşılaştırma, yanlış/doğru hüküm, madde-süre eşleştirme.\n` +
    `- "CMK m.X'e göre" kalıbını KULLANMA (yalnız eşleştirme tipinde serbest); işlemin/kurumun adını kullan.\n` +
    `- Aynı hükmü kelime değişikliğiyle tekrar sorma; farklı yön (başlangıç, uzatma, azami, istisna, yetkili makam) ölç.\n` +
    `- Grup ${idx + 1}/11 — sorular yalnız yukarıdaki maddelerden.\n` +
    `Kod bloğu/açıklama YOK; doğrudan [ karakteriyle başlayıp TEK SATIR sıkışık JSON dizisiyle yanıtla:\n` +
    `[{"stem":"…","options":["…","…","…","…","…"],"dogruIndex":0,"zorluk":"kolay|orta|zor","tip":"bilgi|olay|karsilastirma|yanlis-dogru|eslestirme","madde":"102","dayanak":"maddeden kısa alıntı","aciklama":"öğretici kısa açıklama (neden doğru + kritik istisna/uzatma)"}]`;

  console.log(`② Üretim: ${chunks.length} grup × 11 soru (model: ${MODEL}, batch)…`);
  const batch = await anthropic.messages.batches.create({
    requests: chunks.map((chunk, i) => ({
      custom_id: `g${i}`,
      params: {
        model: MODEL,
        max_tokens: 24000,
        messages: [{ role: 'user' as const, content: genPrompt(chunk, i) }],
      },
    })),
  });
  console.log(`   üretim batch: ${batch.id}`);
  let st = batch;
  while (st.processing_status !== 'ended') {
    await new Promise((r) => setTimeout(r, 30_000));
    st = await anthropic.messages.batches.retrieve(batch.id);
    console.log(`   … ${st.request_counts.succeeded} grup tamam`);
  }
  const adaylar: Soru[] = [];
  for await (const result of await anthropic.messages.batches.results(batch.id)) {
    if (result.result.type !== 'succeeded') continue;
    const text = result.result.message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const arr = parseJsonArray(text);
    if (!arr) continue;
    for (const q of arr as Soru[]) {
      if (q.stem && Array.isArray(q.options) && q.options.length === 5 && q.dogruIndex >= 0 && q.dogruIndex <= 4) {
        adaylar.push(q);
      }
    }
  }
  console.log(`   aday soru: ${adaylar.length}`);

  // ③ Doğrulama: her soru, dayandığı maddenin TAM metniyle çapraz kontrol
  console.log('③ Doğrulama batch…');
  const vPrompt = (q: Soru) => {
    const tokens = q.madde.split(/[,;]+/).map((t) => t.trim()).filter(Boolean);
    const maddeler: string[] = [];
    for (const t of tokens) {
      const num = t.replace(/^(?:CMK\s*)?(?:m(?:adde)?\.?\s*)?/i, '').trim();
      for (const key of law.keys()) {
        if (key === num || key.toLocaleUpperCase('tr') === num.toLocaleUpperCase('tr')) {
          if (!maddeler.includes(key)) maddeler.push(key);
        }
      }
    }
    if (maddeler.length === 0) {
      // Fallback: soru metniyle en çok örtüşen 3 süre maddesi
      const words = new Set(q.stem.toLocaleLowerCase('tr').split(/\W+/).filter((w) => w.length >= 5));
      const scored = [...law.entries()]
        .map(([k, v]) => {
          const lv = v.toLocaleLowerCase('tr');
          let hit = 0;
          for (const w of words) if (lv.includes(w)) hit++;
          return { k, hit };
        })
        .sort((a, b) => b.hit - a.hit)
        .slice(0, 3);
      for (const s2 of scored) if (s2.hit > 2) maddeler.push(s2.k);
    }
    const ctx = maddeler.slice(0, 4).map((k) => `─ Madde ${k}: ${law.get(k)}`).join('\n\n') || '(madde bulunamadı)';
    return (
      `Aşağıdaki soruyu YALNIZ verilen güncel CMK metniyle denetle.\n\n${ctx}\n\n` +
      `SORU: ${q.stem}\n${q.options.map((o, i) => `${'ABCDE'[i]}) ${o}`).join('\n')}\n` +
      `İddia edilen doğru: ${'ABCDE'[q.dogruIndex]} — Açıklama: ${q.aciklama}\n\n` +
      `Kontrol: (1) doğru şık metinle birebir uyumlu mu? (2) TEK doğru şık mı — çeldiricilerden herhangi biri de savunulabilir mi? (3) süre/başlangıç/uzatma karışmış mı?\n` +
      `Doğrudan { ile başlayıp YALNIZ şu JSON: {"gecerli":true|false,"sebep":"kısa"}`
    );
  };
  const vBatch = await anthropic.messages.batches.create({
    requests: adaylar.map((q, i) => ({
      custom_id: `v${i}`,
      params: { model: MODEL, max_tokens: 800, messages: [{ role: 'user' as const, content: vPrompt(q) }] },
    })),
  });
  console.log(`   doğrulama batch: ${vBatch.id}`);
  let vst = vBatch;
  while (vst.processing_status !== 'ended') {
    await new Promise((r) => setTimeout(r, 30_000));
    vst = await anthropic.messages.batches.retrieve(vBatch.id);
    console.log(`   … ${vst.request_counts.succeeded} doğrulama tamam`);
  }
  const gecerli = new Map<number, boolean>();
  const sebep = new Map<number, string>();
  for await (const result of await anthropic.messages.batches.results(vBatch.id)) {
    const i = Number(result.custom_id.slice(1));
    if (result.result.type !== 'succeeded') continue;
    const text = result.result.message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const m = /\{[\s\S]*\}/.exec(text);
    if (!m) continue;
    try {
      const p = JSON.parse(m[0]) as { gecerli: boolean; sebep: string };
      gecerli.set(i, p.gecerli);
      sebep.set(i, p.sebep);
    } catch {
      /* geçersiz say */
    }
  }
  const onayli = adaylar.filter((_, i) => gecerli.get(i) === true);
  const elenen = adaylar.length - onayli.length;
  console.log(`   doğrulamadan geçen: ${onayli.length} (elenen: ${elenen})`);

  fs.writeFileSync(
    outPath,
    JSON.stringify({ onayli, elenenler: adaylar.filter((_, i) => gecerli.get(i) !== true).map((q, j) => ({ ...q, sebep: sebep.get(adaylar.indexOf(q)) })) }, null, 1),
  );
  console.log(`Kaydedildi: ${outPath}`);
}
main();
