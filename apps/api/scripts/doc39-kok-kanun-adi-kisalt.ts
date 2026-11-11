/**
 * Doc 39 — mevzuat türetimi sorularının KÖKÜNDE kanunun uzun adını kısa biçime
 * indirir (kullanıcı talebi, 11 Kas 2026: uzun ad kökü gereksiz uzatıyor).
 *   "6136 sayılı Ateşli Silahlar … Kanun'a göre"  → "6136 sayılı Kanun'a göre"
 *   "2559 sayılı Polis Vazife ve Salâhiyet Kanunu'na göre" → "2559 sayılı PVSK'ya göre"
 *
 * Eşleme bir JSON dosyasından okunur: [["<eski>", "<yeni>"], …]. Ekler eşlemeye
 * dahil yazılır (PVSK'da ek değişiyor: "Kanunu'na" → "PVSK'ya"); her iki kesme
 * işareti biçimi (' / ’) ayrı satır olarak verilmelidir. Uzun eşleme önce uygulanır.
 *
 * Varsayılan kapsam: `in_review` sürümler. YAYINDA=1 ile yayındaki sürümler de
 * YERİNDE güncellenir (yeni sürüm açılmaz; yayın bağı korunur) — yalnız
 * kullanıcının açık talebiyle. `contentHash` her durumda yeniden hesaplanır.
 * Aynı eşleme `aday/<kanun>-p*.json` köklerine de uygulanır.
 *
 *   npx tsx scripts/doc39-kok-kanun-adi-kisalt.ts <doc-dizini> <kanun-no> <esleme.json>
 *   APPLY=1 [YAYINDA=1] … ile yazılır (varsayılan kuru çalışma)
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const YAYINDA = process.env.YAYINDA === '1';
const base = process.env.DATABASE_URL!;
const p = new PrismaClient({
  datasources: { db: { url: base.includes('connection_limit') ? base : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1` } },
});

(async () => {
  const [doc, kanunNo, eslemeYol] = process.argv.slice(2);
  if (!doc || !kanunNo || !eslemeYol) throw new Error('kullanım: … <doc-dizini> <kanun-no> <esleme.json>');
  const esleme = (JSON.parse(readFileSync(eslemeYol, 'utf8')) as [string, string][])
    .sort((a, b) => b[0].length - a[0].length);
  const donustur = (s: string) => esleme.reduce((acc, [eski, yeni]) => acc.split(eski).join(yeni), s);

  const leg = await p.legislation.findFirstOrThrow({ where: { number: kanunNo }, select: { topicId: true } });
  const v = await p.questionVersion.findMany({
    where: {
      status: { in: YAYINDA ? ['in_review', 'published'] : ['in_review'] },
      sourceLabel: { startsWith: 'Mevzuat türetimi — ' },
      question: { topicId: leg.topicId!, deletedAt: null },
      OR: esleme.map(([eski]) => ({ stem: { contains: eski } })),
    },
    select: { id: true, status: true, stem: true, options: { select: { text: true }, orderBy: { sortOrder: 'asc' } } },
  });

  const say: Record<string, number> = {};
  for (const x of v) {
    const yeni = donustur(x.stem);
    if (yeni === x.stem) continue;
    say[x.status] = (say[x.status] ?? 0) + 1;
    console.log(`\n[${x.status}]\n- ${x.stem.slice(0, 130)}…\n+ ${yeni.slice(0, 130)}…`);
    if (APPLY) {
      await p.questionVersion.update({
        where: { id: x.id },
        data: { stem: yeni, contentHash: questionFingerprint(yeni.trim(), x.options.map((o) => o.text.trim())) },
      });
    }
  }

  let dosyaSoru = 0;
  for (const f of readdirSync(`${doc}/aday`).filter((n) => n.startsWith(`${kanunNo}-`) && n.endsWith('.json'))) {
    const yol = `${doc}/aday/${f}`;
    const d = JSON.parse(readFileSync(yol, 'utf8')) as { kok: string }[];
    let n = 0;
    for (const q of d) { const y = donustur(q.kok); if (y !== q.kok) { q.kok = y; n++; } }
    dosyaSoru += n;
    if (APPLY && n) writeFileSync(yol, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
  console.log(`\nbankada değişecek kök: ${JSON.stringify(say)} · aday dosyalarında: ${dosyaSoru}`);
  console.log(APPLY ? '✓ yazıldı' : '(kuru çalışma — APPLY=1 ile yazılır)');
})().finally(() => p.$disconnect());
