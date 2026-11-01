/**
 * İçe aktarım yapışması taraması (SALT OKUR).
 *
 * PDF'ten alınan sorularda bir şıkkın sonuna başka bir sorunun metni ya da kitabın
 * sayfa başlığı yapışabiliyor. Örnek (9 Eki 2026): Erzurum Kongresi sorusunun E
 * şıkkı "26 Ağustos 1919 Meclisi'ne hangi ilimizden milletvekili…" diye sürüyordu;
 * iki İnsan Hakları sorusunda "TEST - 1 MEVZUAT • ANAYASA İnsan HaklarıAGS" başlığı
 * vardı. Bu betik yalnız güçlü izleri arar — "herhangi/hangi" gibi sıradan sözcükler
 * bilerek dışarıda (ilk denemede 164 yanlış alarm verdiler).
 *
 *   npx tsx scripts/sik-yapisma-tara.ts
 *
 * Bulunan şık `sik-metni-guncelle.ts` ile düzeltilir (ibare tek geçmeli, iz deftere düşer).
 */
import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit') ? base.replace(/connection_limit=\d+/, 'connection_limit=1') : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

/** Şıkta olmaması gereken izler: soru kalıbı, madde imi, kırık "ti" ligatürü, cevap anahtarı. */
const SIK: [string, RegExp][] = [
  ['soru kalıbı', /aşağıdakilerden\s+hangisi|hangisidir\s*\?/i],
  ['soru işaretinden sonra metin', /\?\s+\S{2,}/],
  ['madde imi', /•/],
  ['kırık ligatür', /\w ş r(ı|\b)|rılmış r\b/],
  ['cevap anahtarı', /\b(Cevap|Yanıt)\s*[:：]\s*[A-E]\b/],
];
/** Her alanda (kök, şık, açıklama) olmaması gereken kitap/sayfa artıkları. */
const ARTIK = /TEST\s*-\s*\d+|MEVZUAT\s*•|\bAGS\b|\bSayfa\s*(No)?\s*:?\s*\d+|\bÜnite No\b|www\.\S+/;

(async () => {
  const v = await p.questionVersion.findMany({
    where: { status: { in: ['published', 'in_review'] }, question: { deletedAt: null } },
    select: { id: true, questionId: true, status: true, stem: true, explanation: true,
      question: { select: { topic: { select: { name: true } } } }, options: { select: { label: true, text: true }, orderBy: { sortOrder: 'asc' } } },
  });
  let n = 0;
  for (const x of v) {
    const bul: string[] = [];
    if (ARTIK.test(x.stem)) bul.push(`KÖK [sayfa artığı]: ${x.stem.slice(0, 140)}`);
    for (const o of x.options) {
      const r = SIK.find(([, re]) => re.test(o.text));
      if (r) bul.push(`${o.label} [${r[0]}]: ${o.text.slice(0, 160)}`);
      else if (ARTIK.test(o.text)) bul.push(`${o.label} [sayfa artığı]: ${o.text.slice(0, 160)}`);
    }
    if (ARTIK.test(x.explanation ?? '')) bul.push(`AÇIKLAMA [sayfa artığı]: …${(x.explanation ?? '').match(new RegExp(`.{0,50}(${ARTIK.source}).{0,50}`))?.[0]}…`);
    if (!bul.length) continue;
    n++;
    console.log(`\n${x.questionId.slice(0, 8)} · sürüm ${x.id} · ${x.status} · ${x.question.topic.name}\n  ${bul.join('\n  ')}`);
  }
  console.log(`\n${v.length} soru tarandı · ${n} şüpheli`);
})().finally(() => p.$disconnect());
