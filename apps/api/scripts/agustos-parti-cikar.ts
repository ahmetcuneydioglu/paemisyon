/**
 * Banka turu (21 Kas 2026) — 26–27 Ağu 2026 etiketsiz soru partisinin denetim girdisini çıkar. SALT OKUNUR.
 *
 *   cd apps/api && npx tsx scripts/agustos-parti-cikar.ts <çıktı-dizini> [--parca 33]
 *
 * Parti: 26–27 Ağu 2026'da oluşturulmuş, kaynak etiketi olmayan yayındaki sorular (Anayasa, TCK, CMK). Birkaç gün
 * sonra içe aktarılan soruların yeniden yazılmış kopyası gibi duruyor (benzerlik taraması bulgusu). Her soru için
 * bağlı madde metni ve aynı konudaki PARTİ DIŞI en benzer dört soru (olası asıl) yazılır; denetçi ikiz olup
 * olmadığına ve sorunun madde metnine göre doğruluğuna bakar. Dosyalar konu + madde sırasıyla parçalanır.
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const p = new PrismaClient({ datasources: { db: { url } } });
const DIZIN = process.argv[2];
const PARCA = Number(process.argv.includes('--parca') ? process.argv[process.argv.indexOf('--parca') + 1] : '33');
const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[’'‘`´]/g, '').replace(/[^a-zçğıöşü0-9]+/g, ' ').trim();
const kel = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 3));
const jac = (a: Set<string>, b: Set<string>) => { let o = 0; for (const x of a) if (b.has(x)) o++; return o / (a.size + b.size - o || 1); };

(async () => {
  if (!DIZIN) throw new Error('kullanım: agustos-parti-cikar.ts <çıktı-dizini> [--parca N]');
  const rows = await p.question.findMany({
    where: { deletedAt: null, currentVersion: { status: 'published' } },
    select: { id: true, articleNo: true, createdAt: true, topic: { select: { name: true } }, _count: { select: { pastExams: true } },
      currentVersion: { select: { stem: true, explanation: true, sourceLabel: true, options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } } },
      articles: { select: { relation: true, lawArticle: { select: { articleNo: true, title: true, text: true, sortKey: true, legislation: { select: { name: true } } } } } } },
  });
  const gun = (d: Date) => d.toISOString().slice(0, 10);
  const partide = (q: (typeof rows)[number]) => (gun(q.createdAt) === '2026-08-26' || gun(q.createdAt) === '2026-08-27') && !q.currentVersion!.sourceLabel;
  const parti = rows.filter(partide);
  const diger = rows.filter((q) => !partide(q)).map((q) => ({ q, k: kel(q.currentVersion!.stem + ' ' + (q.currentVersion!.options.find((o) => o.isCorrect)?.text ?? '')) }));
  const sik = (v: NonNullable<(typeof rows)[number]['currentVersion']>) => v.options.map((o) => `${o.isCorrect ? '✓' : ' '} ${o.label}) ${o.text}`);
  const kayit = parti.map((q) => {
    const v = q.currentVersion!;
    const k = kel(v.stem + ' ' + (v.options.find((o) => o.isCorrect)?.text ?? ''));
    const aday = diger.filter((d) => d.q.topic?.name === q.topic?.name).map((d) => ({ d, s: jac(k, d.k) })).sort((a, b) => b.s - a.s).slice(0, 4).filter((x) => x.s >= 0.12);
    const birincil = [...q.articles].sort((a, b) => (a.relation === 'primary' ? -1 : 0) - (b.relation === 'primary' ? -1 : 0));
    return {
      sira: birincil[0]?.lawArticle.sortKey ?? 9e9, konu: q.topic?.name ?? '—',
      id: q.id, madde: q.articleNo, kok: v.stem, siklar: sik(v), aciklama: v.explanation,
      bagliMaddeler: birincil.map((a) => ({ mevzuat: a.lawArticle.legislation?.name, no: a.lawArticle.articleNo, baslik: a.lawArticle.title, metin: a.lawArticle.text.length > 5000 ? a.lawArticle.text.slice(0, 5000) + ' …[kısaltıldı]' : a.lawArticle.text })),
      olasiAsillar: aday.map((x) => ({ id: x.d.q.id, benzerlik: +x.s.toFixed(2), kaynak: x.d.q.currentVersion!.sourceLabel ? 'kaynak etiketli' : 'etiketsiz', resmiSinav: x.d.q._count.pastExams > 0, kok: x.d.q.currentVersion!.stem, siklar: sik(x.d.q.currentVersion!) })),
    };
  }).sort((a, b) => a.konu.localeCompare(b.konu, 'tr') || a.sira - b.sira);
  const say = new Map<string, number>();
  for (const k of kayit) say.set(k.konu, (say.get(k.konu) ?? 0) + 1);
  let n = 0;
  for (let i = 0; i < kayit.length; i += PARCA) {
    n++;
    const dilim = kayit.slice(i, i + PARCA).map(({ sira, ...r }) => r);
    writeFileSync(join(DIZIN, `parca-${String(n).padStart(2, '0')}.json`), JSON.stringify(dilim, null, 1));
  }
  console.log(`parti ${kayit.length} soru · ${n} parça · ${[...say].map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
  console.log(`bağsız soru ${kayit.filter((k) => !k.bagliMaddeler.length).length} · olası asılı olmayan ${kayit.filter((k) => !k.olasiAsillar.length).length}`);
})().finally(() => p.$disconnect());
