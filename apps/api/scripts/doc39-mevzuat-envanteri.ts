/**
 * Polis mevzuatı envanteri — hangi mevzuattan bankaya kaç soru yüklenmiş.
 *
 * Konu ağacı Course > Topic (parentId ile alt konu). Mevzuat kayıtları
 * Legislation.topicId ile bir konuya bağlı. Rapor hem konu bazlı sayıyı hem
 * kaynağı (Doc 39 mevzuat türetimi / önceki banka) ve yayın durumunu verir.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
  const dersler = await p.course.findMany({ select: { id: true, name: true } });
  const hedef = dersler.filter((d) => /mevzuat|polis/i.test(d.name));
  console.log('DERSLER:', dersler.map((d) => d.name).join(' · '));
  console.log('\nMEVZUAT DERSİ:', hedef.map((d) => d.name).join(', ') || '(bulunamadı)');

  const konular = await p.topic.findMany({
    where: { deletedAt: null, ...(hedef.length ? { courseId: { in: hedef.map((d) => d.id) } } : {}) },
    select: { id: true, name: true, parentId: true, courseId: true },
    orderBy: { sortOrder: 'asc' },
  });
  const legs = await p.legislation.findMany({ select: { topicId: true, number: true, name: true } });
  const legByTopic = new Map(legs.filter((l) => l.topicId).map((l) => [l.topicId!, l]));

  const satir: { ad: string; leg: string; toplam: number; yayin: number; kuyruk: number; d39: number }[] = [];
  for (const k of konular) {
    const qs = await p.question.findMany({
      where: { topicId: k.id, deletedAt: null },
      select: { versions: { where: { status: { in: ['published', 'in_review'] } },
        select: { status: true, sourceLabel: true }, orderBy: { versionNo: 'desc' }, take: 1 } },
    });
    const v = qs.map((q) => q.versions[0]).filter(Boolean);
    if (!v.length && !legByTopic.has(k.id)) continue;
    satir.push({
      ad: k.name,
      leg: legByTopic.get(k.id)?.number ?? '',
      toplam: v.length,
      yayin: v.filter((x) => x!.status === 'published').length,
      kuyruk: v.filter((x) => x!.status === 'in_review').length,
      d39: v.filter((x) => x!.sourceLabel?.startsWith('Mevzuat türetimi')).length,
    });
  }
  satir.sort((a, b) => b.toplam - a.toplam);
  const md = ['# Polis mevzuatı envanteri — konu bazında soru sayısı\n',
    '| Konu | No | Toplam | Yayında | Kuyrukta | Doc 39 |', '|---|---|---:|---:|---:|---:|'];
  console.log('\n' + 'konu'.padEnd(58) + 'toplam yayın kuyruk  Doc39');
  console.log('─'.repeat(88));
  for (const s of satir) {
    console.log(`${s.ad.slice(0, 56).padEnd(58)}${String(s.toplam).padStart(5)}${String(s.yayin).padStart(6)}${String(s.kuyruk).padStart(7)}${String(s.d39).padStart(7)}`);
    md.push(`| ${s.ad} | ${s.leg} | ${s.toplam} | ${s.yayin} | ${s.kuyruk} | ${s.d39} |`);
  }
  const t = satir.reduce((a, s) => ({ toplam: a.toplam + s.toplam, yayin: a.yayin + s.yayin, kuyruk: a.kuyruk + s.kuyruk, d39: a.d39 + s.d39 }), { toplam: 0, yayin: 0, kuyruk: 0, d39: 0 });
  console.log('─'.repeat(88));
  console.log(`${'TOPLAM'.padEnd(58)}${String(t.toplam).padStart(5)}${String(t.yayin).padStart(6)}${String(t.kuyruk).padStart(7)}${String(t.d39).padStart(7)}`);
  console.log(`\nsorusu olan konu: ${satir.filter((s) => s.toplam > 0).length} · BOŞ konu: ${satir.filter((s) => s.toplam === 0).length}`);
  md.push(`| **TOPLAM** | | **${t.toplam}** | ${t.yayin} | ${t.kuyruk} | ${t.d39} |`);
  writeFileSync('docs/39-polis-mevzuati-soru-uretimi/rapor/mevzuat-envanteri.md', md.join('\n') + '\n', 'utf8');
})().finally(() => p.$disconnect());
