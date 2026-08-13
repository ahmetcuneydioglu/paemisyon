/**
 * CMK soru bankası ön denetimi — İÇE AKTARMADAN ÖNCE.
 *
 * Girdi 1: soru PDF'i (iki sütun; "N. soru … A-E şıklar … Cevap Açıklama: (X) …")
 * Girdi 2: güncel 5271 CMK metni (mevzuat.gov.tr PDF'i, "Madde N – …")
 *
 * Her soru için Claude'a soru + cevap anahtarı + GÜNCEL kanunun ilgili
 * maddeleri verilir; hüküm: DOGRU / YANLIS / KANUN_DEGISMIS / BELIRSIZ.
 * DB'ye YAZMAZ — çıktı XLSX rapor + JSONL ilerleme (kaldığı yerden sürer).
 *
 * Kullanım:
 *   npx tsx scripts/cmk-mevzuat-denetim.ts <soru.pdf> <kanun.pdf> [--limit N]
 * Çıktılar (soru PDF'inin yanına):
 *   cmk-denetim-rapor.xlsx · cmk-denetim-progress.jsonl
 */
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import ExcelJS from 'exceljs';

// Varsayılan: Sonnet 5 + Batch API (%50 indirim) — Opus canlıya göre ~5x ucuz.
// --model ile değiştirilebilir; --live batch yerine anlık istek atar.
const MODEL = process.env.DENETIM_MODEL ?? 'claude-sonnet-5';
const CONCURRENCY = 4;

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error('ANTHROPIC_API_KEY tanımlı değil (.env).');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: key });

// ── PDF font ligatür onarımı (bu derlemenin gömülü fontuna özgü) ──
const LIGATURES: [RegExp, string][] = [
  [/Ɵ/g, 'ti'],
  [/Ʃ/g, 'tt'],
  [/ƨ/g, 'tı'],
  [/ķ/g, 'fı'],
  [/Ą/g, 'fi'],
];
function repair(s: string): string {
  let out = s;
  for (const [re, rep] of LIGATURES) out = out.replace(re, rep);
  return out.replace(/\s+/g, ' ').trim();
}

// ── 1) Soru PDF'i → yapılandırılmış sorular ──
interface Soru {
  no: number;
  page: number;
  stem: string;
  options: { label: string; text: string }[];
  answer: string | null; // A-E
  explanation: string;
}

type Line = { y: number; text: string };

async function extractQuestions(file: string): Promise<Soru[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const allLines: { page: number; text: string }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const view = page.getViewport({ scale: 1 });
    const mid = view.width / 2;
    const tc = await page.getTextContent();
    const items = (tc.items as { str: string; transform: number[] }[]).filter(
      (it) => it.str.trim(),
    );
    // Sütuna ayır, sütun içinde y (üst→alt) sonra x sırala, satır grupla.
    for (const col of [0, 1]) {
      const colItems = items.filter((it) =>
        col === 0 ? it.transform[4] < mid - 10 : it.transform[4] >= mid - 10,
      );
      const lines = new Map<number, { x: number; s: string }[]>();
      for (const it of colItems) {
        const y = Math.round(it.transform[5] / 4) * 4;
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y)!.push({ x: it.transform[4], s: it.str });
      }
      const sorted: Line[] = [...lines.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([y, parts]) => ({
          y,
          text: repair(parts.sort((a, b) => a.x - b.x).map((q) => q.s).join(' ')),
        }));
      for (const l of sorted) allLines.push({ page: p, text: l.text });
    }
  }

  // Başlık/altbilgi gürültüsü
  const NOISE = [
    /^Ceza Muhakemesi Hukuku$/i,
    /^DİKKAT!?$/i,
    /^Bu testte \d+ soru/i,
    /^Cevaplarınızı/i,
    /^\d{1,3}$/, // sayfa numarası
  ];

  const sorular: Soru[] = [];
  let cur: Soru | null = null;
  let mode: 'stem' | 'options' | 'answer' = 'stem';

  for (const { page, text } of allLines) {
    if (NOISE.some((re) => re.test(text))) continue;

    const qStart = /^(\d{1,3})\.\s+(.*)$/.exec(text);
    const optStart = /^([A-E])\)\s*(.*)$/.exec(text);
    const ansStart = /^Cevap Açıklama\s*:?\s*(.*)$/i.exec(text);

    // Yeni soru — ama şık/madde numaralandırması (I. II.) değil ve mevcut soru
    // cevabını almışken ya da hiç soru yokken.
    if (qStart && (mode === 'answer' || cur === null)) {
      if (cur) sorular.push(cur);
      cur = {
        no: Number(qStart[1]),
        page,
        stem: qStart[2],
        options: [],
        answer: null,
        explanation: '',
      };
      mode = 'stem';
      continue;
    }
    if (!cur) continue;

    if (ansStart) {
      mode = 'answer';
      const rest = ansStart[1];
      const letter = /\(([A-E])\)/.exec(rest);
      if (letter) cur.answer = letter[1];
      cur.explanation = rest.replace(/^\(([A-E])\)\s*/, '');
      continue;
    }
    if (mode === 'answer') {
      // Açıklama devamı; harf ayrı satıra sarktıysa yakala.
      if (!cur.answer) {
        const letter = /^\(([A-E])\)\s*(.*)$/.exec(text);
        if (letter) {
          cur.answer = letter[1];
          cur.explanation = letter[2];
          continue;
        }
      }
      cur.explanation = `${cur.explanation} ${text}`.trim();
      continue;
    }
    if (optStart) {
      mode = 'options';
      cur.options.push({ label: optStart[1], text: optStart[2] });
      continue;
    }
    if (mode === 'options' && cur.options.length > 0) {
      const last = cur.options[cur.options.length - 1];
      last.text = `${last.text} ${text}`.trim();
    } else {
      cur.stem = `${cur.stem} ${text}`.trim();
    }
  }
  if (cur) sorular.push(cur);
  return sorular;
}

// ── 2) Kanun PDF'i → madde dizini ──
async function extractLaw(file: string): Promise<Map<string, string>> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  let full = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = (tc.items as { str: string; transform: number[] }[]).filter(
      (it) => it.str.trim(),
    );
    const lines = new Map<number, { x: number; s: string }[]>();
    for (const it of items) {
      const y = Math.round(it.transform[5] / 4) * 4;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y)!.push({ x: it.transform[4], s: it.str });
    }
    const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, parts] of sorted) {
      full += `${parts.sort((a, b) => a.x - b.x).map((q) => q.s).join(' ')}\n`;
    }
  }
  // Dipnot/sayfa gürültüsünü hafiflet, madde başlıklarına böl.
  const articles = new Map<string, string>();
  const re = /(?:^|\n)\s*(?:(EK|GEÇİCİ)\s+)?(?:Madde|MADDE)\s+(\d+(?:\/[A-Za-z])?)\s*[–—-]/g;
  const marks: { key: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(full))) {
    const key = `${m[1] ? `${m[1].toUpperCase()} ` : ''}${m[2]}`;
    marks.push({ key, index: m.index });
  }
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : full.length;
    const body = full
      .slice(start, end)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
    // Aynı madde birden çok kez geçebilir (değişiklik dipnotları) — İLK
    // (ana metindeki) hâli esas; sonrakiler eklenmez.
    if (!articles.has(marks[i].key)) articles.set(marks[i].key, body);
  }
  return articles;
}

// ── 3) Basit sözcük-örtüşmeli madde araması ──
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLocaleLowerCase('tr')
      .replace(/[^a-zçğıöşü0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5)
      .map((w) => w.slice(0, 6)), // kaba gövdeleme — Türkçe ekleri törpüler
  );
}

function relevantArticles(
  soru: Soru,
  law: Map<string, string>,
  lawTokens: Map<string, Set<string>>,
): string[] {
  const qText = `${soru.stem} ${soru.options.map((o) => o.text).join(' ')} ${soru.explanation}`;
  const qTok = tokenize(qText);
  const scored: { key: string; score: number }[] = [];
  for (const [key, toks] of lawTokens) {
    let hit = 0;
    for (const t of qTok) if (toks.has(t)) hit++;
    if (hit > 2) scored.push({ key, score: hit / Math.log(10 + toks.size) });
  }
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, 6).map((s) => s.key);
  // Soruda açıkça geçen madde numaraları her zaman dahil.
  const cited = qText.matchAll(/(\d{1,3})\s*(?:nci|ncı|üncü|inci)?\s*madde|madde\s*(\d{1,3})/gi);
  for (const c of cited) {
    const no = c[1] ?? c[2];
    if (no && law.has(no) && !picked.includes(no)) picked.push(no);
  }
  return picked.slice(0, 8);
}

// ── 4) AI hükmü ──
interface Hukum {
  hukum: 'DOGRU' | 'YANLIS' | 'KANUN_DEGISMIS' | 'BELIRSIZ';
  dogruCevap: string;
  ilgiliMaddeler: string;
  gerekce: string;
}

function buildPrompt(soru: Soru, maddeler: string[], law: Map<string, string>): string {
  const lawBlock = maddeler
    .map((k) => `— Madde ${k}: ${law.get(k)}`)
    .join('\n\n');
  return (
    `Sen bir ceza muhakemesi hukuku (5271 sayılı CMK) editörüsün. Aşağıdaki ` +
    `çoktan seçmeli soru bir soru bankasına eklenecek; GÜNCEL kanun metnine göre denetle.\n\n` +
    `GÜNCEL CMK'DAN İLGİLİ OLABİLECEK MADDELER (mevzuat.gov.tr):\n${lawBlock}\n\n` +
    `SORU ${soru.no}: ${soru.stem}\n` +
    soru.options.map((o) => `${o.label}) ${o.text}`).join('\n') +
    `\nKitapçığın cevap anahtarı: ${soru.answer ?? 'YOK'}` +
    (soru.explanation ? `\nKitapçığın açıklaması: ${soru.explanation}` : '') +
    `\n\nHüküm ver — açıklama yazmadan DOĞRUDAN { ile başlayıp YALNIZ şu JSON ile yanıtla:\n` +
    `{"hukum":"DOGRU|YANLIS|KANUN_DEGISMIS|BELIRSIZ","dogruCevap":"A-E veya ?","ilgiliMaddeler":"virgüllü madde noları","gerekce":"1-2 cümle"}\n` +
    `Kurallar:\n` +
    `- Önce soruyu KENDİN çöz: dogruCevap = güncel mevzuata göre senin bulduğun şık.\n` +
    `- DOGRU: senin cevabın anahtarla AYNI. (Başka bir şıkta da kusur görsen bile ` +
    `hüküm DOGRU kalır; kusuru gerekçede kısaca not et.)\n` +
    `- YANLIS: senin cevabın anahtardan FARKLI ve bunun sebebi kanun değişikliği değil.\n` +
    `- KANUN_DEGISMIS: anahtar sorunun yazıldığı dönemki mevzuata göre doğruydu; ` +
    `güncel hükümle artık yanlış/eksik. Gerekçede değişikliği belirt.\n` +
    `- BELIRSIZ: verilen metin + bilginle net karar veremiyorsun (tartışmalı doktrin, ` +
    `birden çok savunulabilir cevap dahil).\n` +
    `- TUTARLILIK ŞARTI: hukum=YANLIS ise dogruCevap anahtardan farklı OLMAK ZORUNDA.\n` +
    `- Verilen madde metinleri güncel kaynaktır; kendi bilginle çelişirse METNİ esas al.\n` +
    `- Soru doktrin/kavram sorusuysa (madde metni birebir gerekmez) bilginle değerlendir.`
  );
}

function parseHukum(text: string, soru: Soru): Hukum | null {
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return null;
  let parsed: Hukum;
  try {
    parsed = JSON.parse(m[0]) as Hukum;
  } catch {
    return null;
  }
  if (!['DOGRU', 'YANLIS', 'KANUN_DEGISMIS', 'BELIRSIZ'].includes(parsed.hukum)) return null;
  // Deterministik tutarlılık: "yanlış" diyorsa bulduğu cevap anahtardan
  // farklı OLMALI; aynıysa bu bir soru-kalitesi itirazıdır → BELIRSIZ
  // (insan incelemesine düşer, otomatik 'anahtar hatalı' damgası yemez).
  if (parsed.hukum === 'YANLIS' && parsed.dogruCevap === soru.answer) {
    parsed.hukum = 'BELIRSIZ';
    parsed.gerekce = `(AI anahtarla aynı cevabı buldu ama soruda kusur görüyor) ${parsed.gerekce}`;
  }
  return parsed;
}

async function judge(soru: Soru, maddeler: string[], law: Map<string, string>): Promise<Hukum | null> {
  const prompt = buildPrompt(soru, maddeler, law);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return parseHukum(text, soru);
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      if (status === 429 || status === 529 || (status ?? 0) >= 500) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  return null;
}

/** Batch API akışı: tüm istekler tek toplu işte (%50 indirim). Sonuçlar
 *  genelde dakikalar-saatler içinde; 60 sn'de bir yoklanır. */
async function judgeBatch(
  items: { soru: Soru; maddeler: string[] }[],
  law: Map<string, string>,
): Promise<Map<string, Hukum | null>> {
  const keyOf = (s: Soru) => `q${s.page}_${s.no}`;
  const batch = await anthropic.messages.batches.create({
    requests: items.map(({ soru, maddeler }) => ({
      custom_id: keyOf(soru),
      params: {
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user' as const, content: buildPrompt(soru, maddeler, law) }],
      },
    })),
  });
  console.log(`   batch oluşturuldu: ${batch.id} (${items.length} istek) — bekleniyor…`);

  let st = batch;
  while (st.processing_status !== 'ended') {
    await new Promise((r) => setTimeout(r, 60_000));
    st = await anthropic.messages.batches.retrieve(batch.id);
    const c = st.request_counts;
    console.log(`   … ${c.succeeded} tamam / ${c.errored} hata / ${c.processing} sürüyor`);
  }

  const bySoru = new Map(items.map((i) => [keyOf(i.soru), i.soru]));
  const out = new Map<string, Hukum | null>();
  for await (const result of await anthropic.messages.batches.results(batch.id)) {
    const soru = bySoru.get(result.custom_id);
    if (!soru) continue;
    if (result.result.type === 'succeeded') {
      const text = result.result.message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      out.set(result.custom_id, parseHukum(text, soru));
    } else {
      out.set(result.custom_id, null);
    }
  }
  return out;
}

// ── main ──
async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const limitArg = process.argv.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1] ?? limitArg.split('=')[1]) : Infinity;
  const [soruPdf, kanunPdf] = args;
  if (!soruPdf || !kanunPdf) {
    console.error('Kullanım: npx tsx scripts/cmk-mevzuat-denetim.ts <soru.pdf> <kanun.pdf> [--limit N]');
    process.exit(1);
  }

  console.log('① Sorular çıkarılıyor…');
  const sorular = await extractQuestions(soruPdf);
  console.log(`   ${sorular.length} soru bulundu; anahtarı olan: ${sorular.filter((s) => s.answer).length}, 5 şıklı: ${sorular.filter((s) => s.options.length === 5).length}`);

  console.log('② Güncel kanun dizinleniyor…');
  const law = await extractLaw(kanunPdf);
  console.log(`   ${law.size} madde çıkarıldı (örn. Madde 2 ${law.has('2') ? '✓' : '✗'}, 120 ${law.has('120') ? '✓' : '✗'}, 250 ${law.has('250') ? '✓' : '✗'})`);
  const lawTokens = new Map<string, Set<string>>();
  for (const [k, v] of law) lawTokens.set(k, tokenize(v));

  // İlerleme (yeniden çalıştırmada atla)
  const dir = path.dirname(soruPdf);
  const progressPath = path.join(dir, 'cmk-denetim-progress.jsonl');
  const done = new Map<number, Soru & Hukum & { maddeler: string }>();
  if (fs.existsSync(progressPath)) {
    for (const line of fs.readFileSync(progressPath, 'utf8').split('\n').filter(Boolean)) {
      const row = JSON.parse(line);
      done.set(row.no * 10000 + row.page, row);
    }
    console.log(`   (devam: ${done.size} soru önceki koşudan hazır)`);
  }

  const hedef = sorular.filter((s) => s.options.length >= 4 && s.answer).slice(0, limit);
  const queue = hedef.filter((s) => !done.has(s.no * 10000 + s.page));
  const live = process.argv.includes('--live');
  console.log(
    `③ AI denetimi: ${queue.length} soru (model: ${MODEL}, ${live ? `canlı, eşzamanlı ${CONCURRENCY}` : 'Batch API — %50 indirimli'})`,
  );

  const out = fs.createWriteStream(progressPath, { flags: 'a' });
  const fallback = {
    hukum: 'BELIRSIZ' as const,
    dogruCevap: '?',
    ilgiliMaddeler: '',
    gerekce: 'AI yanıtı çözümlenemedi',
  };

  if (!live && queue.length > 0) {
    const items = queue.map((soru) => ({
      soru,
      maddeler: relevantArticles(soru, law, lawTokens),
    }));
    const results = await judgeBatch(items, law);
    for (const { soru, maddeler } of items) {
      const h = results.get(`q${soru.page}_${soru.no}`) ?? null;
      const row = { ...soru, ...(h ?? fallback), maddeler: maddeler.join(',') };
      out.write(`${JSON.stringify(row)}\n`);
      done.set(soru.no * 10000 + soru.page, row);
    }
  } else if (queue.length > 0) {
    let processed = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length > 0) {
          const s = queue.shift()!;
          const maddeler = relevantArticles(s, law, lawTokens);
          const h = await judge(s, maddeler, law);
          const row = { ...s, ...(h ?? fallback), maddeler: maddeler.join(',') };
          out.write(`${JSON.stringify(row)}\n`);
          done.set(s.no * 10000 + s.page, row);
          processed++;
          if (processed % 20 === 0) console.log(`   … ${processed}/${queue.length + processed}`);
        }
      }),
    );
  }
  out.close();

  // ── Rapor ──
  const rows = hedef.map((s) => done.get(s.no * 10000 + s.page)!).filter(Boolean);
  const say = (h: string) => rows.filter((r) => r.hukum === h).length;
  console.log(`\n④ SONUÇ (${rows.length} soru):`);
  console.log(`   ✅ DOGRU          : ${say('DOGRU')}`);
  console.log(`   ❌ YANLIS         : ${say('YANLIS')}`);
  console.log(`   ⚖️ KANUN_DEGISMIS : ${say('KANUN_DEGISMIS')}`);
  console.log(`   ❓ BELIRSIZ       : ${say('BELIRSIZ')}`);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Denetim');
  ws.columns = [
    { header: 'Sayfa', key: 'page', width: 7 },
    { header: 'No', key: 'no', width: 6 },
    { header: 'Hüküm', key: 'hukum', width: 16 },
    { header: 'Anahtar', key: 'answer', width: 9 },
    { header: 'AI Cevap', key: 'dogruCevap', width: 9 },
    { header: 'İlgili Maddeler', key: 'ilgiliMaddeler', width: 16 },
    { header: 'Gerekçe', key: 'gerekce', width: 70 },
    { header: 'Soru', key: 'stem', width: 90 },
    { header: 'Kitapçık Açıklaması', key: 'explanation', width: 60 },
  ];
  const renk: Record<string, string> = {
    DOGRU: 'FFE8F5E9',
    YANLIS: 'FFFFEBEE',
    KANUN_DEGISMIS: 'FFFFF8E1',
    BELIRSIZ: 'FFECEFF1',
  };
  for (const r of rows) {
    const row = ws.addRow(r);
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: renk[r.hukum] } };
  }
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = 'A1:I1';
  const raporPath = path.join(dir, 'cmk-denetim-rapor.xlsx');
  await wb.xlsx.writeFile(raporPath);
  console.log(`\nRapor: ${raporPath}`);
}

main();
