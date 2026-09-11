/**
 * Madde metinlerine yapışmış dipnot bloğunu ve değişiklik tablosunu ayıklar.
 *
 * 3201'de görülen kusurun aynısı: PDF'in sonundaki dipnotlar ve değişiklik
 * tablosu son maddenin gövdesine karışmış. Kesim noktası, dipnot ayıracı
 * ("____") ya da "Yönetmeliğin Yayımlandığı Resmî Gazete" başlığıdır.
 *
 *   npx tsx apps/api/scripts/doc39-madde-temizle.ts <kanun-no|slug>   (kuru çalışma)
 *   APPLY=1 ...
 */
import { PrismaClient } from '@prisma/client';
const APPLY = process.env.APPLY === '1';
const KES = /(\n\s*_{4,}|\nYönetmeliğin Yayımlandığı Resmî Gazete|\nYönetmelikte Değişiklik Yapan|\n[^\n]*SAYILI KANUNA EK VE DEĞİŞİKLİK GETİREN|\nKanunun Yayımlandığı Resmî Gazete)/;
const p = new PrismaClient();
(async () => {
  const hedef = process.argv[2];
  if (!hedef) throw new Error('kullanım: … <kanun-no|slug>');
  const leg = await p.legislation.findFirstOrThrow({
    where: hedef.match(/^\d+$/) ? { number: hedef } : { slug: hedef },
  });
  const a = await p.lawArticle.findMany({
    where: { legislationId: leg.id, deletedAt: null },
    select: { id: true, articleNo: true, title: true, text: true },
  });
  const duzelt: { id: string; no: string; eski: number; yeni: string }[] = [];
  for (const x of a) {
    const t = x.text ?? '';
    const m = t.match(KES);
    if (!m) continue;
    const kesik = t.slice(0, m.index).trimEnd();
    duzelt.push({ id: x.id, no: x.articleNo, eski: t.length, yeni: kesik });
  }
  for (const d of duzelt) {
    console.log(`md ${d.no}: ${d.eski} → ${d.yeni.length} krkt`);
    console.log(`   kalan metin: "${d.yeni.slice(0, 160)}"`);
  }
  console.log(`\nDÜZELTİLECEK: ${duzelt.length} / ${a.length}`);
  if (!APPLY) { console.log('(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  for (const d of duzelt) {
    if (!d.yeni.trim()) throw new Error(`md ${d.no}: kesim sonrası metin boş kalıyor, durduruldu`);
    await p.lawArticle.update({ where: { id: d.id }, data: { text: d.yeni } });
  }
  console.log(`✓ ${duzelt.length} madde temizlendi`);
})().finally(() => p.$disconnect());
