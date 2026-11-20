/**
 * Banka turu (21 Kas 2026) — Yayındaki sorularda MÜKERRER ve ÇELİŞEN soru taraması. SALT OKUNUR.
 *
 *   cd apps/api && npx tsx scripts/banka-benzer-tara.ts [--esik 0.8] [--cikti <dosya-öneki>]
 *
 * Neden: ders ve ünite turlarında tek tek işaretlenen "mükerrer çift" listeleri kayda geçmedi; contentHash
 * yalnız birebir aynı kök + şıkları yakalar ("1982 Anayasası'na göre" / "1982 Anayasasına göre" farkı kaçar).
 *
 * Yöntem: aynı KONUDAKİ yayınlı sorular ikişer ikişer karşılaştırılır.
 *   kök benzerliği  = kök kelime kümelerinin Jaccard'ı (Türkçe küçük harf, noktalama atılır, ≤2 harfli kelime düşer)
 *   şık benzerliği  = şık metin kümelerinin Jaccard'ı (şık bütün olarak; sıra önemsiz)
 * Sınıflar:
 *   AYNI     — kök ≥ 0.95 ve şık kümesi aynı (≥ 0.99), doğru şık aynı
 *   MUKERRER — kök ≥ eşik ve doğru şık metni aynı
 *   CELISKI  — kök ≥ 0.9, şık kümesi büyük ölçüde aynı (≥ 0.6) ama DOĞRU ŞIK FARKLI (biri yanlış anahtarlı olabilir)
 * Hangisinin kalacağına betik karar VERMEZ; yalnız ölçütleri yazar: resmî sınav bağı, sınavda kullanım,
 * derste gömülü olma (docs/57 `:::soru <id>`), kaynak etiketi, açıklama uzunluğu.
 * Çıktı: <önek>.json ve <önek>.md (varsayılan docs/32-yayin-denetimi/benzerlik-<tarih>).
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const p = new PrismaClient({ datasources: { db: { url } } });
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
const ESIK = Number(arg('--esik') ?? '0.8');
const KOK = join(__dirname, '../../..');
const ONEK = arg('--cikti') ?? join(KOK, `docs/32-yayin-denetimi/benzerlik-${new Date().toISOString().slice(0, 10)}`);

const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[’'‘`´]/g, '').replace(/[^a-zçğıöşü0-9]+/g, ' ').trim();
const kelimeler = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 2 || /^\d+$/.test(w) || /^(i|ii|iv|v|vi)$/.test(w)));
function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (!a.size && !b.size) return 1;
  let ortak = 0;
  for (const x of a) if (b.has(x)) ortak++;
  return ortak / (a.size + b.size - ortak);
}

type S = { id: string; konu: string; stem: string; kok: Set<string>; siklar: Set<string>; dogru: string; etiket: string | null; resmi: number; sinav: number; ack: number; ders: boolean; sik: number };

(async () => {
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null }, currentOfQuestion: { isNot: null } },
    select: { stem: true, explanation: true, sourceLabel: true, _count: { select: { examQuestions: true } },
      options: { select: { text: true, isCorrect: true } },
      question: { select: { id: true, topic: { select: { name: true } }, _count: { select: { pastExams: true } } } } },
  });
  let gomulu = new Set<string>();
  try {
    const out = execFileSync('grep', ['-rhoE', '^:::soru [0-9a-f-]{36}', join(KOK, 'docs/57-konu-anlatimi')], { encoding: 'utf8', maxBuffer: 16 << 20 });
    gomulu = new Set(out.split('\n').map((l) => l.slice(8).trim()).filter(Boolean));
  } catch { /* ders klasörü yoksa gömülü bilgisi boş kalır */ }
  const S: S[] = rows.map((r) => ({
    id: r.question.id, konu: r.question.topic?.name ?? '—', stem: r.stem, kok: kelimeler(r.stem),
    siklar: new Set(r.options.map((o) => norm(o.text))), dogru: norm(r.options.find((o) => o.isCorrect)?.text ?? ''),
    etiket: r.sourceLabel, resmi: r.question._count.pastExams, sinav: r._count.examQuestions,
    ack: (r.explanation ?? '').length, ders: gomulu.has(r.question.id), sik: r.options.length,
  }));
  const konular = new Map<string, S[]>();
  for (const s of S) konular.set(s.konu, [...(konular.get(s.konu) ?? []), s]);

  type Cift = { sinif: 'AYNI' | 'MUKERRER' | 'CELISKI'; kok: number; sik: number; a: S; b: S };
  const ciftler: Cift[] = [];
  for (const [, L] of konular) {
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j];
      if (a.kok.size < 4 || b.kok.size < 4) continue;
      const boy = Math.min(a.kok.size, b.kok.size) / Math.max(a.kok.size, b.kok.size);
      if (boy < ESIK) continue; // Jaccard ≤ boy oranı
      const k = jaccard(a.kok, b.kok);
      if (k < ESIK) continue;
      const sk = jaccard(a.siklar, b.siklar);
      const ayniDogru = a.dogru === b.dogru && a.dogru !== '';
      if (ayniDogru) ciftler.push({ sinif: k >= 0.95 && sk >= 0.99 ? 'AYNI' : 'MUKERRER', kok: k, sik: sk, a, b });
      else if (k >= 0.9 && sk >= 0.6) ciftler.push({ sinif: 'CELISKI', kok: k, sik: sk, a, b });
    }
  }
  const sira = { CELISKI: 0, AYNI: 1, MUKERRER: 2 } as const;
  ciftler.sort((x, y) => sira[x.sinif] - sira[y.sinif] || x.a.konu.localeCompare(y.a.konu, 'tr') || y.kok - x.kok);
  const ozet = (s: S) => `\`${s.id.slice(0, 8)}\` ${s.sik} şık · ${s.resmi ? 'RESMÎ SINAV' : s.sinav ? `sınavda ${s.sinav}` : 'sınavsız'}${s.ders ? ' · DERSTE' : ''} · ${s.etiket ? s.etiket.slice(0, 44) : 'etiketsiz'} · açıklama ${s.ack}`;
  const say = (k: string) => ciftler.filter((c) => c.sinif === k).length;
  const md: string[] = [`# Banka benzerlik taraması (${new Date().toISOString().slice(0, 10)})`, '',
    `Yayındaki ${S.length} soru, ${konular.size} konu. Kök eşiği ${ESIK}. Çift sayısı: ÇELİŞKİ ${say('CELISKI')} · AYNI ${say('AYNI')} · MÜKERRER ${say('MUKERRER')}.`, ''];
  let son = '';
  for (const c of ciftler) {
    const bas = `${c.sinif} — ${c.a.konu}`;
    if (bas !== son) { md.push(`## ${bas}`, ''); son = bas; }
    md.push(`- kök ${c.kok.toFixed(2)} · şık ${c.sik.toFixed(2)}`, `  - ${ozet(c.a)}`, `    ${c.a.stem.replace(/\s+/g, ' ').slice(0, 170)}`, `    ✓ ${c.a.dogru.slice(0, 110)}`,
      `  - ${ozet(c.b)}`, ...(norm(c.a.stem) === norm(c.b.stem) ? [] : [`    ${c.b.stem.replace(/\s+/g, ' ').slice(0, 170)}`]), ...(c.a.dogru === c.b.dogru ? [] : [`    ✓ ${c.b.dogru.slice(0, 110)}`]), '');
  }
  writeFileSync(`${ONEK}.md`, md.join('\n'));
  writeFileSync(`${ONEK}.json`, JSON.stringify(ciftler.map((c) => ({ sinif: c.sinif, kok: +c.kok.toFixed(3), sik: +c.sik.toFixed(3), konu: c.a.konu,
    a: { id: c.a.id, resmi: c.a.resmi, sinav: c.a.sinav, ders: c.a.ders, etiket: c.a.etiket, ack: c.a.ack, sik: c.a.sik },
    b: { id: c.b.id, resmi: c.b.resmi, sinav: c.b.sinav, ders: c.b.ders, etiket: c.b.etiket, ack: c.b.ack, sik: c.b.sik } })), null, 1));
  console.log(md[2]);
  const konuSay = new Map<string, number>();
  for (const c of ciftler) konuSay.set(c.a.konu, (konuSay.get(c.a.konu) ?? 0) + 1);
  console.log([...konuSay].sort((x, y) => y[1] - x[1]).slice(0, 25).map(([k, n]) => `${k.slice(0, 34)} ${n}`).join(' · '));
  console.log(`yazıldı: ${ONEK}.md`);
})().finally(() => p.$disconnect());
