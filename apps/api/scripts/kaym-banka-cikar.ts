/**
 * Doc 41 — Bankadaki KAYMAKAMLIK sorularını çıkarır (SALT OKUMA).
 *
 * Doc 40 yalnız 2022 sınavının 62 sorusunu denetledi; bankada `sourceLabel`
 * "KAYMAKAMLIK" içeren başka sorular da var ve hiçbiri 2022→2026 güncellik
 * denetiminden geçmedi. Bu script onları künyesiyle çıkarır: hangi yılın
 * sınavı, hangi ders, hangi durum (published/archived) ve Doc 40'ta zaten
 * denetlenmiş olanlar (contentHash ile) işaretlenir.
 *
 *   npx tsx scripts/kaym-banka-cikar.ts <cikti-dizini> [--doc40 <kanonik-62.json>]
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';

const base = process.env.DATABASE_URL!;
const url = `${base.split('?')[0]}?connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

/** sourceLabel içindeki 4 haneli yıl — "KAYMAKAMLIK 2022 …" gibi. */
const yilCikar = (s: string | null) => s?.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;

async function main() {
  const [ciktiDizin] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!ciktiDizin) throw new Error('kullanım: kaym-banka-cikar.ts <cikti-dizini>');

  const vs = await p.questionVersion.findMany({
    where: {
      sourceLabel: { contains: 'KAYMAKAMLIK', mode: 'insensitive' },
      question: { deletedAt: null },
    },
    select: {
      id: true, questionId: true, versionNo: true, status: true, stem: true,
      explanation: true, sourceLabel: true, contentHash: true, difficulty: true,
      createdAt: true, publishedAt: true,
      options: { select: { id: true, label: true, text: true, isCorrect: true }, orderBy: { label: 'asc' } },
      question: {
        select: {
          id: true, deletedAt: true, currentVersionId: true,
          topic: { select: { id: true, name: true, parent: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: [{ sourceLabel: 'asc' }, { createdAt: 'asc' }],
  });

  const kayitlar = vs.map((v) => ({
    id: v.id,
    questionId: v.questionId,
    guncelSurum: v.question.currentVersionId === v.id,
    durum: v.status,
    yil: yilCikar(v.sourceLabel),
    sourceLabel: v.sourceLabel,
    contentHash: v.contentHash,
    ders: v.question.topic?.parent?.name ?? v.question.topic?.name ?? null,
    konu: v.question.topic?.name ?? null,
    topicId: v.question.topic?.id ?? null,
    zorluk: v.difficulty,
    olusturma: v.createdAt.toISOString().slice(0, 10),
    stem: v.stem,
    aciklama: v.explanation,
    siklar: v.options.map((o) => ({ label: o.label, text: o.text, dogru: o.isCorrect })),
  }));

  mkdirSync(ciktiDizin, { recursive: true });
  writeFileSync(`${ciktiDizin}/banka-kaymakamlik.json`, JSON.stringify(kayitlar, null, 2));

  // Doc 40'ta denetlenmiş sorular — kesişimi contentHash yerine metinle de yakala.
  // Doc 40'ın kanonik metni taranmış sayfadan çıkarıldı, bankadaki metin ayrı
  // bir içe aktarımdan geldi: tam eşleşme aramak kesişimi olduğundan az
  // gösteriyor (21 yerine 32). Kelime örtüşmesi (Jaccard) kullanılıyor.
  // Eşleşme YILLA da sınırlı: Doc 40 yalnız 2022 sınavını denetledi, o yüzden
  // başka yılın sorusu Doc 40'ta "denetlenmiş" sayılamaz — 2020'de bu eşiği
  // aşan tek soru (İl Özel İdaresi/vali) elle bakıldı, gerçekten farklı bir soru.
  const D40_YIL = '2022';
  const D40_ESIK = 0.6;
  const d40i = process.argv.indexOf('--doc40');
  const d40Yol = d40i === -1 ? undefined : process.argv[d40i + 1];
  let d40n: Set<string>[] = [];
  if (d40Yol && existsSync(d40Yol)) {
    const kelime = (s: string) =>
      new Set(
        s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3),
      );
    const kanonik: Array<{ stem?: string; kok?: string }> = JSON.parse(readFileSync(d40Yol, 'utf8'));
    d40n = kanonik.map((k) => kelime(k.stem ?? k.kok ?? '')).filter((s) => s.size);
    for (const k of kayitlar) {
      if (k.yil !== D40_YIL) { (k as any).doc40 = false; continue; }
      const a = kelime(k.stem);
      const en = Math.max(...d40n.map((b) => {
        const kes = [...a].filter((x) => b.has(x)).length;
        return kes / (a.size + b.size - kes || 1);
      }));
      (k as any).doc40 = en >= D40_ESIK;
    }
  }

  // Künye
  const say = (f: (k: (typeof kayitlar)[number]) => string | null) => {
    const m = new Map<string, number>();
    for (const k of kayitlar) m.set(f(k) ?? '(yok)', (m.get(f(k) ?? '(yok)') ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const yaz = (b: string, r: [string, number][]) =>
    console.log(`\n${b}\n` + r.map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`).join('\n'));

  console.log(`Toplam sürüm: ${kayitlar.length}  ·  güncel sürüm: ${kayitlar.filter((k) => k.guncelSurum).length}`);
  yaz('Durum', say((k) => k.durum));
  yaz('Yıl', say((k) => k.yil));
  yaz('Ders', say((k) => k.ders));
  yaz('sourceLabel', say((k) => k.sourceLabel));
  yaz('İçe aktarım tarihi', say((k) => k.olusturma));
  if (d40n.length) {
    const kes = kayitlar.filter((k) => (k as any).doc40);
    console.log(`\nDoc 40 kesişimi: ${kes.length} / ${kayitlar.length}  (kanonik ${d40n.length}, yıl ${D40_YIL})`);
    writeFileSync(`${ciktiDizin}/banka-kaymakamlik.json`, JSON.stringify(kayitlar, null, 2));
  }
  const eksik = kayitlar.filter((k) => k.siklar.length !== 5);
  if (eksik.length) console.log(`\nUYARI — 5 şıklı olmayan: ${eksik.length} (${eksik.map((e) => `${e.id.slice(0, 8)}:${e.siklar.length}`).join(', ')})`);
  const cevapsiz = kayitlar.filter((k) => !k.siklar.some((s) => s.dogru));
  if (cevapsiz.length) console.log(`UYARI — doğru şıkkı işaretsiz: ${cevapsiz.length}`);
  console.log(`\n→ ${ciktiDizin}/banka-kaymakamlik.json`);
}

main().finally(() => p.$disconnect());
