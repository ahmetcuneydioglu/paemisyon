/**
 * Doc 39 — aday soruların BÜTÜN bankadaki en benzer sorularını bulur (salt okur).
 *
 * Neden: `-mevcut-sorular.txt` yalnız o mevzuatın konusundaki soruları,
 * `-diger-konu-sorulari.txt` yalnız kanun numarasını anan soruları taşır. Aynı
 * hükmü başka bir mevzuatın adıyla ölçen soru ikisinde de çıkmaz. 12 Kas 2026'da
 * 6222 md 12/2 sorusunun mükerreri Arama Yönetmeliği md 23 sorusu olarak çıktı ve
 * bu yüzden ancak gözcünün elle taramasıyla yakalandı. Bu betik bütün bankayı
 * (yayında + incelemede, silinmemiş) tarar; kalite gözcüsünün mükerrer kararı için
 * aday başına en benzer soruları skoruyla dosyaya yazar. Karar gözcünündür.
 *
 * Benzerlik: kök + doğru şık sözcükleri (küçük harf, Türkçe büyük/küçük harf,
 * 6 harflik kök kesimi, durak sözcükler atılır), IDF ağırlıklı kapsama:
 *   skor = Σ idf(ortak) / Σ idf(aday)  → aday sorunun ne kadarı o soruda var.
 *
 *   npx tsx scripts/doc39-benzer-ara.ts <doc-dizini> <parti> [<parti> …]
 *   ESIK=0.20 ADET=8 …   (varsayılan eşik 0.15, aday başına 5 soru)
 *
 * Eşik düşük tutulur: farklı sözcüklerle kurulmuş aynı hüküm sorusu sözcük
 * düzeyinde az örtüşür (6222 md 12/2 ↔ Arama Yön. md 23 mükerreri 0,21 skorla
 * ikinci sıradaydı). Liste aday çıkarır; mükerrer kararını gözcü verir.
 * Çıktı: <doc-dizini>/denetim/<parti>-benzer.txt
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const [doc, ...partiler] = process.argv.slice(2);
if (!doc || !partiler.length) throw new Error('kullanım: doc39-benzer-ara.ts <doc-dizini> <parti> [<parti> …]');
const ESIK = Number(process.env.ESIK ?? '0.15');
const ADET = Number(process.env.ADET ?? '5');
const base = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  datasources: { db: { url: base.includes('connection_limit') ? base : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1` } },
});

const DURAK = new Set(
  ('ve veya ile bir bu şu o da de ki için göre gibi kadar olarak olan olup olması olmak olduğu olduğunu ' +
    'aşağıdakilerden aşağıdaki hangisi hangisidir hangileri hangisinde hangisine yukarıdaki verilenlerden ' +
    'doğrudur yanlıştır değildir doğru yanlış sayılı kanun kanunu kanunun kanuna yönetmelik yönetmeliği ' +
    'yönetmeliğe madde maddesi maddesinde fıkra fıkrası bent ise en çok az daha her hiç mi mı mu mü ' +
    'yalnız ancak sadece ilgili hakkında halinde hâlinde durumunda tarafından üzere edilir edilen yapılır ' +
    'yer alır almaz değil iii ii i iv v').split(/\s+/),
);
const kucuk = (s: string) => s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');
const sozcukler = (s: string) =>
  [...new Set(kucuk(s).replace(/[’'`´]/g, ' ').split(/[^a-zçğıöşüâîû0-9]+/)
    .filter((w) => w.length > 2 && !DURAK.has(w)).map((w) => w.slice(0, 6)))];

type Aday = { id: string; kok: string; siklar: Record<string, string>; dogru: string };
type Banka = { id: string; ders: string; konu: string; durum: string; kok: string; siklar: { l: string; t: string; d: boolean }[] };

async function main() {
  const banka: Banka[] = await prisma.$queryRawUnsafe(`
    select q.id, c.name ders, t.name konu, v.status::text durum, v.stem kok,
      (select json_agg(json_build_object('l',o.label,'t',o.text,'d',o.is_correct) order by o.sort_order)
         from question_options o where o.question_version_id=v.id) siklar
    from questions q join question_versions v on v.id=q.current_version_id
    join topics t on t.id=q.topic_id join courses c on c.id=t.course_id
    where q.deleted_at is null and v.status in ('published','in_review')`);
  const metin = (b: Banka) => `${b.kok} ${(b.siklar ?? []).filter((o) => o.d).map((o) => o.t).join(' ')}`;
  const bs = banka.map((b) => sozcukler(metin(b)));
  // Ters dizin + IDF
  const df = new Map<string, number>();
  const ters = new Map<string, number[]>();
  bs.forEach((ws, i) => ws.forEach((w) => { df.set(w, (df.get(w) ?? 0) + 1); (ters.get(w) ?? ters.set(w, []).get(w)!).push(i); }));
  const N = banka.length;
  const idf = (w: string) => Math.log((N + 1) / ((df.get(w) ?? 0) + 1)) + 1;

  for (const parti of partiler) {
    const aday: Aday[] = JSON.parse(readFileSync(`${doc}/aday/${parti}.json`, 'utf8'));
    const out = [`# ${parti} — bankadaki en benzer sorular (bütün banka, ${N} soru; eşik ${ESIK}, aday başına ${ADET})`,
      '# skor = aday kök+doğru şık sözcüklerinin (IDF ağırlıklı) ne kadarının o soruda geçtiği. Yüksek skor mükerrer DEMEK DEĞİLDİR; karar gözcünündür.', ''];
    let isaret = 0;
    for (const a of aday) {
      const aw = sozcukler(`${a.kok} ${a.siklar[a.dogru] ?? ''}`);
      const top = aw.reduce((s, w) => s + idf(w), 0) || 1;
      const puan = new Map<number, number>();
      for (const w of aw) {
        const liste = ters.get(w); if (!liste || liste.length > 3000) continue; // çok yaygın sözcük aday seçmez
        const i_ = idf(w); for (const i of liste) puan.set(i, (puan.get(i) ?? 0) + i_);
      }
      const en = [...puan.entries()].map(([i, s]) => [i, s / top] as const).filter(([, s]) => s >= ESIK)
        .sort((x, y) => y[1] - x[1]).slice(0, ADET);
      out.push(`## ${a.id}`, `ADAY: ${a.kok.replace(/\s+/g, ' ').slice(0, 300)}`, `ADAY DOĞRU: ${a.siklar[a.dogru] ?? '?'}`);
      if (!en.length) out.push('  (eşiği geçen benzer soru yok)');
      for (const [i, s] of en) {
        const b = banka[i]; isaret++;
        out.push(`  — skor ${s.toFixed(2)} | ${b.ders} / ${b.konu} | ${b.durum} | id ${b.id}`,
          `    ${b.kok.replace(/\s+/g, ' ').slice(0, 400)}`,
          ...(b.siklar ?? []).map((o) => `    ${o.l}) ${o.t}${o.d ? '  ✔' : ''}`));
      }
      out.push('');
    }
    writeFileSync(`${doc}/denetim/${parti}-benzer.txt`, out.join('\n'), 'utf8');
    console.log(`${parti}: ${aday.length} aday · eşiği geçen ${isaret} eşleşme → denetim/${parti}-benzer.txt`);
  }
}
main().finally(() => prisma.$disconnect());
