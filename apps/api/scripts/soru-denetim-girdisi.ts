/**
 * Banka turu (21 Kas 2026) — Kaynak etiketi belli bir ön ekle başlayan yayındaki sorular için KÖR denetim girdisi. SALT OKUNUR.
 *
 *   cd apps/api && npx tsx scripts/soru-denetim-girdisi.ts <çıktı-dizini> --etiket "Özgün soru" [--parca 32]
 *
 * Çıktı:
 *   <dizin>/girdi/parca-NN.json  — denetçiye verilir: kök, şıklar (ANAHTAR YOK), etiket, bağlı madde metinleri
 *   <dizin>/anahtar.json         — yalnız ana oturumda kalır: id → doğru şık harfi, açıklama
 *   <dizin>/mevzuat/<no>.txt     — sorularda geçen mevzuatın tam metni (bağsız ya da başka maddeye dayanan sorular için)
 * Ağustos partisi turundan ders: girdide anahtar işaretli kalırsa "anahtara bakmadan çöz" koşulu sağlanmaz.
 */
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const url = (process.env.DATABASE_URL ?? '').replace(/connection_limit=\d+/, 'connection_limit=1');
const p = new PrismaClient({ datasources: { db: { url } } });
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
const DIZIN = process.argv[2];
const ETIKET = arg('--etiket');
const PARCA = Number(arg('--parca') ?? '32');

(async () => {
  if (!DIZIN || !ETIKET) throw new Error('kullanım: soru-denetim-girdisi.ts <çıktı-dizini> --etiket "<ön ek>" [--parca N]');
  for (const d of ['girdi', 'mevzuat']) mkdirSync(join(DIZIN, d), { recursive: true });
  const rows = await p.question.findMany({
    where: { deletedAt: null, currentVersion: { status: 'published', sourceLabel: { startsWith: ETIKET } } },
    select: { id: true, articleNo: true, topic: { select: { name: true } },
      currentVersion: { select: { stem: true, explanation: true, sourceLabel: true, options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } } },
      articles: { select: { relation: true, lawArticle: { select: { articleNo: true, title: true, text: true, sortKey: true, legislationId: true, legislation: { select: { name: true, number: true } } } } } } },
  });
  const kayit = rows.map((q) => {
    const v = q.currentVersion!;
    const bag = [...q.articles].sort((a, b) => (a.relation === 'primary' ? -1 : 0) - (b.relation === 'primary' ? -1 : 0));
    return { konu: q.topic?.name ?? '—', sira: bag[0]?.lawArticle.sortKey ?? 9e9, dogru: v.options.find((o) => o.isCorrect)?.label ?? '?', aciklama: v.explanation,
      girdi: { id: q.id, konu: q.topic?.name ?? '—', madde: q.articleNo, etiket: v.sourceLabel, kok: v.stem, siklar: v.options.map((o) => `${o.label}) ${o.text}`),
        bagliMaddeler: bag.map((a) => ({ mevzuat: a.lawArticle.legislation?.name, no: a.lawArticle.articleNo, baslik: a.lawArticle.title, metin: a.lawArticle.text.length > 6000 ? a.lawArticle.text.slice(0, 6000) + ' …[kısaltıldı; tam metin mevzuat dizininde]' : a.lawArticle.text })) },
      legIds: bag.map((a) => a.lawArticle.legislationId).filter(Boolean) as string[] };
  }).sort((a, b) => a.konu.localeCompare(b.konu, 'tr') || a.sira - b.sira);
  let n = 0;
  for (let i = 0; i < kayit.length; i += PARCA) writeFileSync(join(DIZIN, 'girdi', `parca-${String(++n).padStart(2, '0')}.json`), JSON.stringify(kayit.slice(i, i + PARCA).map((k) => k.girdi), null, 1));
  writeFileSync(join(DIZIN, 'anahtar.json'), JSON.stringify(Object.fromEntries(kayit.map((k) => [k.girdi.id, { dogru: k.dogru, aciklama: k.aciklama }])), null, 1));
  const legs = await p.legislation.findMany({ where: { id: { in: [...new Set(kayit.flatMap((k) => k.legIds))] } }, select: { name: true, number: true, slug: true, articles: { where: { deletedAt: null, status: 'published' }, orderBy: { sortKey: 'asc' }, select: { articleNo: true, title: true, text: true } } } });
  for (const l of legs) writeFileSync(join(DIZIN, 'mevzuat', `${l.number ?? l.slug}.txt`), `${l.name}\n\n` + l.articles.map((a) => `### MADDE ${a.articleNo}${a.title ? ' — ' + a.title : ''}\n${a.text}`).join('\n\n'));
  const say = new Map<string, number>();
  for (const k of kayit) say.set(k.konu, (say.get(k.konu) ?? 0) + 1);
  console.log(`${kayit.length} soru · ${n} parça · bağsız ${kayit.filter((k) => !k.girdi.bagliMaddeler.length).length}`);
  console.log([...say].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(' · '));
  console.log('mevzuat:', legs.map((l) => `${l.number ?? l.slug} (${l.articles.length})`).join(', '));
  const et = new Map<string, number>();
  for (const k of kayit) { const e = (k.girdi.etiket ?? '').split(' · ').slice(2).join(' · ') || '(ek yok)'; et.set(e, (et.get(e) ?? 0) + 1); }
  console.log('etiket ekleri:', [...et].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(' · '));
})().finally(() => p.$disconnect());
