/**
 * Yanlış konuya bağlanmış soruları doğru konuya TAŞIR (yalnız `questions.topic_id` değişir;
 * soru metni, sürümü, madde bağı ve geçmiş cevaplar aynen kalır).
 *
 * Güvenlik: varsayılan KURU; soru kimliği öneki TAM BİR soruyla eşleşmezse ya da hedef konu
 * bulunamazsa durur; her taşıma docs/32-yayin-denetimi/konu-tasima.jsonl defterine eski ve
 * yeni konuyla düşer (geri alma bu defterden yapılır).
 *
 *   npx tsx scripts/soru-konu-tasi.ts <plan.json>          (kuru)
 *   npx tsx scripts/soru-konu-tasi.ts <plan.json> --yaz
 *
 * plan.json: [{ "soru": "<soru id öneki>", "hedef": "<konu id öneki>", "gerekce": "…" }]
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const u = new URL(process.env.DATABASE_URL!);
u.searchParams.set('connection_limit', '1');
const p = new PrismaClient({ datasources: { db: { url: u.toString() } } });
const DEFTER = join(__dirname, '../../../docs/32-yayin-denetimi/konu-tasima.jsonl');

type Is = { soru: string; hedef: string; gerekce: string };

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const plan: Is[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const konular = await p.topic.findMany({ select: { id: true, name: true, course: { select: { name: true } } } });
  const hazir: { id: string; eski: string; eskiAd: string; yeni: string; yeniAd: string; gerekce: string }[] = [];

  for (const is of plan) {
    const hedefler = konular.filter((k) => k.id.startsWith(is.hedef));
    if (hedefler.length !== 1) throw new Error(`hedef konu ${is.hedef}: ${hedefler.length} eşleşme — DURDU`);
    const sorular = await p.$queryRaw<{ id: string; topic_id: string; stem: string }[]>`
      select q.id::text, q.topic_id::text, coalesce(v.stem, '') as stem
      from questions q left join question_versions v on v.id = q.current_version_id
      where q.deleted_at is null and q.id::text like ${is.soru + '%'}`;
    if (sorular.length !== 1) throw new Error(`soru ${is.soru}: ${sorular.length} eşleşme — DURDU`);
    const s = sorular[0];
    const eski = konular.find((k) => k.id === s.topic_id)!;
    const h = hedefler[0];
    if (s.topic_id === h.id) { console.log(`= ${is.soru}: zaten "${h.name}" konusunda — atlandı`); continue; }
    hazir.push({ id: s.id, eski: eski.id, eskiAd: eski.name, yeni: h.id, yeniAd: h.name, gerekce: is.gerekce });
    console.log(`\n→ ${is.soru}  ${s.stem.replace(/\s+/g, ' ').slice(0, 110)}`);
    console.log(`   ${eski.course.name} / ${eski.name}\n   ⇒ ${h.course.name} / ${h.name}`);
  }

  console.log(`\nTOPLAM: ${hazir.length} taşıma`);
  if (!YAZ) { console.log('(KURU ÇALIŞMA — --yaz ile uygulanır)'); return; }

  const simdi = new Date();
  await p.$transaction(async (tx) => {
    for (const x of hazir) await tx.question.update({ where: { id: x.id }, data: { topicId: x.yeni } });
  }, { timeout: 60_000 });
  appendFileSync(DEFTER, hazir.map((x) => JSON.stringify({
    zaman: simdi.toISOString(), soru: x.id, eskiKonu: x.eski, eskiAd: x.eskiAd, yeniKonu: x.yeni, yeniAd: x.yeniAd, gerekce: x.gerekce,
  })).join('\n') + '\n');
  console.log(`\n✓ ${hazir.length} soru taşındı · defter: ${DEFTER}`);
})().finally(() => p.$disconnect());
