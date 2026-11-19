/**
 * Banka turu (19 Kas 2026) — Betikle değişen maddelerde KAYMIŞ kullanıcı vurgularını onar.
 *
 *   npx tsx scripts/vurgu-onar.ts <yedek.json> [--yaz]
 *
 * Yedek, `mevzuat-madde-tazele` ya da `mevzuat-dipnot-temizle` yedeğidir (eski metin oradan okunur). Vurgunun
 * şimdiki konumundaki metin snippet'iyle uyuşmuyorsa eski metindeki vurgulu parça yeni metinde aranır
 * (`lib/vurgu-esle`) ve konum güncellenir. Yalnız startOffset/endOffset yazılır. Varsayılan KURU.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { vurguEsle } from './lib/vurgu-esle';

const base = process.env.DATABASE_URL!;
const p = new PrismaClient({ datasources: { db: { url: base.replace(/connection_limit=\d+/, 'connection_limit=1') } } });
const duz = (s: string) => s.replace(/\s+/g, ' ').trim();

(async () => {
  const ham = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const maddeler: { id: string; articleNo: string; text: string }[] = Array.isArray(ham) ? ham : ham.maddeler;
  const YAZ = process.argv.includes('--yaz');
  const yaz: { id: string; startOffset: number; endOffset: number }[] = [];
  let saglam = 0, bulunamayan = 0;
  for (const m of maddeler) {
    const a = await p.lawArticle.findUnique({ where: { id: m.id }, select: { text: true, highlights: { select: { id: true, startOffset: true, endOffset: true, snippet: true } } } });
    if (!a) continue;
    for (const h of a.highlights) {
      const simdiki = a.text.slice(h.startOffset, h.endOffset);
      if (duz(simdiki).startsWith(duz(h.snippet).replace(/([.;:,)”"…])\d{1,3}(?= |$)/g, '$1').slice(0, 400)) && simdiki.length) { saglam++; continue; }
      const e = vurguEsle(h, m.text, a.text);
      if (!e) { bulunamayan++; console.log(`  ! md ${m.articleNo}: bulunamadı «${duz(h.snippet).slice(0, 70)}»`); continue; }
      console.log(`  ~ md ${m.articleNo}: ${h.startOffset}–${h.endOffset} → ${e.startOffset}–${e.endOffset} «${duz(a.text.slice(e.startOffset, e.endOffset)).slice(0, 60)}»`);
      yaz.push({ id: h.id, ...e });
    }
  }
  console.log(`\nsağlam ${saglam} · onarılacak ${yaz.length} · bulunamayan ${bulunamayan}`);
  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)'); return; }
  await p.$transaction(async (tx) => { for (const v of yaz) await tx.articleHighlight.update({ where: { id: v.id }, data: { startOffset: v.startOffset, endOffset: v.endOffset } }); });
  console.log(`✓ ${yaz.length} vurgu onarıldı`);
})().finally(() => p.$disconnect());
