/**
 * Bankadaki mevzuat metinlerinin resmî kaynağa göre EKSİK kalan değişikliklerini bulur.
 *
 * Neden ayrı bir tarayıcı: `mevzuat-tazele.ts` ham metin farkına bakıyor ve iki
 * yerde kör — (1) normalizasyonu RAKAMLARI siliyor, yani süre/ceza değişikliğini
 * göremiyor; (2) madde bölmesi satır başı başlık bekliyor, yönetmelik sayfalarında
 * ve 3201 gibi "işlenemeyen hükümler" eki taşıyan kanunlarda bozuluyor.
 * 24 Eyl 2026'da 7593 s.K.'nın (RG 18/8/2026) bankaya hiç işlenmediği böyle
 * fark edilmedi.
 *
 * Bu tarayıcı metin karşılaştırmaz; resmî metnin KENDİ DEĞİŞİKLİK İŞARETLERİNİ
 * okur: satır içi şerhler ("(Ek:8/8/2026-7593/2 md.)", "(Değişik cümle:24/12/2025-
 * 7571/14 md.)") ve dipnotlar ("8/8/2026 tarihli ve 7593 sayılı Kanunun 15 inci
 * maddesiyle … değiştirilmiştir"). Kaynakta bir maddeye işlenmiş değişikliğin kanun
 * numarası bankadaki madde metninde HİÇ geçmiyorsa o madde eskidir. Kaynakta olup
 * bankada olmayan madde YENİ, kaynakta mülga olup bankada yürürlükte görünen madde
 * MÜLGA olarak raporlanır.
 *
 * SALT OKUR. Çıktı: raporu ve kaynak madde metinlerini içeren JSON (tazeleme adımı
 * bu dosyadan beslenir).
 *
 *   npx tsx scripts/mevzuat-degisiklik-tara.ts <cikti.json> [--konu "Çocuk Koruma"] [--yildan 2024]
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { kaynakGetir } from './lib/mevzuat-kaynak';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

/** Satır içi şerh: "(Ek:8/8/2026-7593/2 md.)", "(Değişik fıkra:6/12/2019-7196/7 md.)", "(Mülga:…)". */
const SERH = /\((Ek|Değişik|Mülga|Yeniden düzenleme|İptal)[^:()]{0,30}:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(?:KHK-)?(\d{3,4})\/\d+\s*md\.?\s*\)/g;
const DIPNOT_OLAY = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+tarihli\s+ve\s+(\d{3,4})\s+sayılı/;

type Olay = { tur: string; tarih: string; kanun: string; kaynak: 'şerh' | 'dipnot'; ozet: string };
function olaylar(madde: string, dipnot: Map<string, string>): Olay[] {
  const out: Olay[] = [];
  for (const m of madde.matchAll(SERH))
    out.push({ tur: m[1], tarih: `${m[4]}-${m[3].padStart(2, '0')}-${m[2].padStart(2, '0')}`, kanun: m[5], kaynak: 'şerh', ozet: m[0] });
  for (const r of madde.matchAll(/\[(\d+)\]/g)) {
    const t = dipnot.get(r[1]);
    const m = t && DIPNOT_OLAY.exec(t);
    if (m) out.push({ tur: 'dipnot', tarih: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, kanun: m[4], kaynak: 'dipnot', ozet: t!.slice(0, 240) });
  }
  return out;
}

(async () => {
  const cikti = process.argv[2];
  if (!cikti || cikti.startsWith('--')) throw new Error('kullanım: mevzuat-degisiklik-tara.ts <cikti.json> [--konu ad] [--yildan 2024]');
  const konuAra = arg('--konu');
  const yildan = Number(arg('--yildan') ?? 2024);

  const legs = await p.legislation.findMany({
    where: { deletedAt: null, ...(konuAra ? { name: { contains: konuAra, mode: 'insensitive' } } : {}) },
    select: { id: true, name: true, number: true, articles: { where: { deletedAt: null }, select: { id: true, articleNo: true, text: true, status: true, sourceUrl: true } } },
  });
  const rapor: any[] = [];
  for (const l of legs.filter((x) => x.articles.length)) {
    const u = l.articles.find((a) => a.sourceUrl)?.sourceUrl ?? '';
    const g = (k: string) => new RegExp(`${k}=(\\d+)`, 'i').exec(u)?.[1];
    const no = g('MevzuatNo') ?? l.number ?? undefined;
    if (!no) { rapor.push({ ad: l.name, hata: 'sourceUrl ve kanun numarası yok' }); continue; }
    // Kayıtlı tertip yanlış olabiliyor (PVSK'da 5 kayıtlı, doğrusu 3); bölünemezse öteki tertipler denenir.
    const { maddeler, dipnot, url: kaynakUrl } = kaynakGetir(g('MevzuatTur') ?? '1', no, [g('MevzuatTertip')!, '5', '3', '4'], l.articles.length * 0.5);
    // Sağlık kontrolü: kaynak bankanın yarısından az madde verdiyse bölme bozulmuştur — hüküm kurma.
    if (maddeler.length < l.articles.length * 0.5) { rapor.push({ ad: l.name, kaynakUrl, hata: `bölme şüpheli: kaynak ${maddeler.length}, banka ${l.articles.length}` }); console.log(`? ${l.name} — bölme şüpheli (${maddeler.length}/${l.articles.length})`); continue; }
    const banka = new Map(l.articles.map((a) => [a.articleNo, a]));
    const eski: any[] = [], yeni: any[] = [], mulga: any[] = [];
    for (const m of maddeler) {
      const olay = olaylar(m.metin, dipnot).filter((o) => Number(o.tarih.slice(0, 4)) >= yildan);
      const b = banka.get(m.no);
      if (!b) { if (!/^\S+\s+\S+\s*[–—-]\s*\(Mülga/.test(m.metin)) yeni.push({ no: m.no, olay, kaynak: m.metin }); continue; }
      const eksik = olay.filter((o) => !new RegExp(`\\b${o.kanun}\\b`).test(b.text ?? ''));
      if (eksik.length) eski.push({ no: m.no, id: b.id, olay: eksik, kaynak: m.metin, banka: b.text });
      if (/[–—-]\s*\(Mülga[^)]*20(2[4-9])/.test(m.metin.slice(0, 120)) && !/Mülga/.test((b.text ?? '').slice(0, 200))) mulga.push({ no: m.no, id: b.id });
    }
    rapor.push({ ad: l.name, kaynakUrl, kaynakMadde: maddeler.length, bankaMadde: l.articles.length, eski, yeni, mulga });
    const kanunlar = [...new Set([...eski, ...yeni].flatMap((x) => x.olay.map((o: Olay) => `${o.kanun}(${o.tarih.slice(0, 7)})`)))];
    console.log(`${eski.length || yeni.length || mulga.length ? '*' : ' '} ${l.name.slice(0, 60).padEnd(62)} eski ${String(eski.length).padStart(2)} · yeni ${String(yeni.length).padStart(2)} · mülga ${mulga.length}  ${kanunlar.join(' ')}`);
  }
  writeFileSync(cikti, JSON.stringify(rapor, null, 1));
  console.log(`\nrapor → ${cikti}`);
})().finally(() => p.$disconnect());
