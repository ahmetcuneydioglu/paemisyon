/**
 * Bankadaki madde metinlerini mevzuat.gov.tr konsolide metninden TAZELER ve eksik
 * maddeleri EKLER — `mevzuat-degisiklik-tara.ts`in bulduğu hedefler için.
 *
 * İlke (LawArticle anayasası): metin AI ile üretilmez/özetlenmez; birebir resmî
 * metin yazılır, kaynak ve doğrulama tarihi (lastVerifiedAt, effectiveInfo) dolar.
 * Güncellenen madde yayındaki durumunu korur; eklenen madde kullanıcı onaylı tam
 * tazeleme turunda (24 Eyl 2026) yayında açılır — gövde kaynağın kendisidir.
 *
 * Güvenlik:
 *  - Varsayılan KURU ÇALIŞMA: eski/yeni metin yan yana basılır.
 *  - Kaynaktan madde bulunamazsa ya da temizlenmiş gövde boşsa o hedef ATLANIR.
 *  - Yazmadan önce eski satırlar yedeğe alınır (docs/32-yayin-denetimi/tazeleme-yedek-<tarih>.json),
 *    her işlem docs/32-yayin-denetimi/mevzuat-tazeleme.jsonl defterine düşer.
 *
 *   npx tsx scripts/mevzuat-madde-tazele.ts <plan.json> [--tam]   (kuru; --tam gövdeyi kesmeden basar)
 *   npx tsx scripts/mevzuat-madde-tazele.ts <plan.json> --yaz
 *
 * plan.json: [{ "mevzuat": "<Legislation.name başı>", "guncelle": ["31"], "ekle": ["5/A"],
 *              "effectiveInfo": "8/8/2026 tarihli ve 7593 sayılı Kanun değişikliği işlenmiş metin" }]
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { articleSortKey } from '../src/modules/admin/law-articles/law-text-parser';
import { kaynakGetir, temizle } from './lib/mevzuat-kaynak';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const D32 = join(__dirname, '../../../docs/32-yayin-denetimi');

type Plan = { mevzuat: string; guncelle?: string[]; ekle?: string[]; effectiveInfo: string };

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const KES = process.argv.includes('--tam') ? Infinity : 420;
  const plan: Plan[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const simdi = new Date();
  const gun = simdi.toLocaleDateString('tr-TR');
  const yedek: any[] = [];
  const islemler: { tur: 'guncelle' | 'ekle'; legId: string; topicId: string | null; mevzuat: string; no: string; id?: string; sectionId?: string | null; baslik?: string | null; eski?: string; yeni: string; kaynakUrl: string; effectiveInfo: string }[] = [];
  // Bazı mevzuat eski içe aktarımdan ham sıra anahtarı taşıyor (5275: "16"=16, kanonik 1600) — araya madde
  // eklenemez. Kanonik anahtara geçmek sırayı KORUYORSA yeniden anahtarlanır; bozuyorsa ekleme atlanır.
  const yenidenAnahtar: { legId: string; mevzuat: string; maddeler: { id: string; articleNo: string; eski: number }[] }[] = [];

  for (const pl of plan) {
    const leg = await p.legislation.findFirstOrThrow({
      where: { name: { startsWith: pl.mevzuat }, deletedAt: null },
      select: { id: true, name: true, number: true, topicId: true,
        articles: { where: { deletedAt: null }, select: { id: true, articleNo: true, text: true, title: true, sectionId: true, sortKey: true, sourceUrl: true, status: true, effectiveInfo: true, lastVerifiedAt: true }, orderBy: { sortKey: 'asc' } } },
    });
    const u = leg.articles.find((a) => a.sourceUrl)?.sourceUrl ?? '';
    const g = (k: string) => new RegExp(`${k}=(\\d+)`, 'i').exec(u)?.[1];
    const k = kaynakGetir(g('MevzuatTur') ?? '1', g('MevzuatNo') ?? leg.number!, [g('MevzuatTertip')!, '5', '3', '4'], leg.articles.length * 0.5);
    const kaynak = new Map(k.maddeler.map((m, i) => [m.no, { ...m, onceki: k.maddeler[i - 1] }]));
    console.log(`\n######## ${leg.name} — kaynak ${k.maddeler.length} madde (${k.url})`);

    for (const no of pl.guncelle ?? []) {
      const b = leg.articles.find((a) => a.articleNo === no);
      const km = kaynak.get(no);
      if (!b || !km) { console.log(`  ✗ md ${no}: ${!b ? 'bankada yok' : 'kaynakta yok'} — ATLANDI`); continue; }
      const { govde } = temizle(km.metin);
      if (!govde) { console.log(`  ✗ md ${no}: temiz gövde boş — ATLANDI`); continue; }
      islemler.push({ tur: 'guncelle', legId: leg.id, topicId: leg.topicId, mevzuat: leg.name, no, id: b.id, eski: b.text, yeni: govde, kaynakUrl: k.url, effectiveInfo: pl.effectiveInfo });
      yedek.push({ mevzuat: leg.name, ...b });
      console.log(`  ~ md ${no}\n    ESKİ: ${(b.text ?? '').replace(/\n/g, ' ⏎ ').slice(0, KES)}\n    YENİ: ${govde.replace(/\n/g, ' ⏎ ').slice(0, KES)}`);
    }
    const uyumsuz = leg.articles.filter((a) => a.sortKey !== articleSortKey(a.articleNo));
    if ((pl.ekle ?? []).length && uyumsuz.length) {
      const sira = (f: (a: (typeof leg.articles)[number]) => number) => [...leg.articles].sort((a, b) => f(a) - f(b)).map((a) => a.id).join();
      if (sira((a) => a.sortKey) !== sira((a) => articleSortKey(a.articleNo))) {
        console.log(`  ✗ sıra anahtarı kanonik değil ve kanoniğe geçmek sırayı bozuyor — EKLEMELER ATLANDI`);
        pl.ekle = [];
      } else {
        yenidenAnahtar.push({ legId: leg.id, mevzuat: leg.name, maddeler: uyumsuz.map((a) => ({ id: a.id, articleNo: a.articleNo, eski: a.sortKey })) });
        for (const a of uyumsuz) a.sortKey = articleSortKey(a.articleNo);
        console.log(`  ↕ ${uyumsuz.length} maddenin sıra anahtarı kanoniğe alınacak (sıra korunuyor)`);
      }
    }
    for (const no of pl.ekle ?? []) {
      if (leg.articles.some((a) => a.articleNo === no)) { console.log(`  ✗ md ${no}: bankada ZATEN var — ATLANDI`); continue; }
      const km = kaynak.get(no);
      if (!km) { console.log(`  ✗ md ${no}: kaynakta yok — ATLANDI`); continue; }
      const { govde } = temizle(km.metin);
      const baslik = km.onceki ? temizle(km.onceki.metin).sondakiBaslik : null;
      // Bölüm: sıralamada hemen öncesindeki banka maddesinin bölümü.
      const sira = articleSortKey(no);
      const onceki = [...leg.articles].reverse().find((a) => a.sortKey < sira);
      islemler.push({ tur: 'ekle', legId: leg.id, topicId: leg.topicId, mevzuat: leg.name, no, sectionId: onceki?.sectionId ?? null, baslik, yeni: govde, kaynakUrl: k.url, effectiveInfo: pl.effectiveInfo });
      console.log(`  + md ${no} [${baslik ?? 'başlıksız'}] (bölüm: md ${onceki?.articleNo ?? '—'} ile aynı)\n    ${govde.replace(/\n/g, ' ⏎ ').slice(0, KES)}`);
    }
  }

  console.log(`\nTOPLAM: ${islemler.filter((x) => x.tur === 'guncelle').length} güncelleme · ${islemler.filter((x) => x.tur === 'ekle').length} ekleme`);
  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)'); return; }

  const yedekYol = join(D32, `tazeleme-yedek-${simdi.toISOString().slice(0, 10)}.json`);
  writeFileSync(yedekYol, JSON.stringify({ maddeler: yedek, siraAnahtari: yenidenAnahtar }, null, 1));
  await p.$transaction(async (tx) => {
    for (const r of yenidenAnahtar)
      for (const a of r.maddeler) await tx.lawArticle.update({ where: { id: a.id }, data: { sortKey: articleSortKey(a.articleNo) } });
    for (const x of islemler) {
      if (x.tur === 'guncelle') {
        await tx.lawArticle.update({ where: { id: x.id }, data: { text: x.yeni, effectiveInfo: `${x.effectiveInfo} (mevzuat.gov.tr konsolide metni, ${gun})`, lastVerifiedAt: simdi, sourceUrl: x.kaynakUrl } });
      } else {
        await tx.lawArticle.create({ data: {
          topicId: x.topicId!, legislationId: x.legId, sectionId: x.sectionId, articleNo: x.no, title: x.baslik, text: x.yeni,
          sortKey: articleSortKey(x.no), sourceName: 'mevzuat.gov.tr', sourceUrl: x.kaynakUrl, status: 'published',
          effectiveInfo: `${x.effectiveInfo} (mevzuat.gov.tr konsolide metni, ${gun})`, lastVerifiedAt: simdi,
        } });
      }
    }
    for (const legId of [...new Set(islemler.map((x) => x.legId))])
      await tx.legislation.update({ where: { id: legId }, data: { lastVerifiedAt: simdi } });
  }, { timeout: 120_000 });
  appendFileSync(join(D32, 'mevzuat-tazeleme.jsonl'), [
    ...yenidenAnahtar.map((r) => JSON.stringify({ zaman: simdi.toISOString(), tur: 'sira-anahtari', mevzuat: r.mevzuat, madde: r.maddeler.length })),
    ...islemler.map((x) => JSON.stringify({ zaman: simdi.toISOString(), tur: x.tur, mevzuat: x.mevzuat, madde: x.no, effectiveInfo: x.effectiveInfo, kaynak: x.kaynakUrl })),
  ].join('\n') + '\n');
  console.log(`\n✓ yazıldı · yedek: ${yedekYol}`);
})().finally(() => p.$disconnect());
