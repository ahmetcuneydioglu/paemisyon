/** SALT OKUMA: bankada Private Use Area (gömülü font) karakteri taraması. */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const PUA = /[-]/;
async function main() {
  const v = await p.questionVersion.findMany({
    where: { question: { deletedAt: null } },
    select: {
      id: true, stem: true, explanation: true, status: true,
      question: { select: { topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { id: true, text: true } },
    },
  });
  let kok = 0, sik = 0, ac = 0;
  const dersler = new Map<string, number>();
  const kodlar = new Map<string, number>();
  const durum = new Map<string, number>();
  for (const x of v) {
    let vurdu = false;
    if (PUA.test(x.stem)) { kok++; vurdu = true; }
    if (x.explanation && PUA.test(x.explanation)) { ac++; vurdu = true; }
    if (x.options.some((o) => PUA.test(o.text))) { sik++; vurdu = true; }
    if (!vurdu) continue;
    const d = x.question.topic.course.name;
    dersler.set(d, (dersler.get(d) ?? 0) + 1);
    durum.set(x.status, (durum.get(x.status) ?? 0) + 1);
    for (const c of x.stem + (x.explanation ?? '') + x.options.map((o) => o.text).join(''))
      if (PUA.test(c)) kodlar.set(c, (kodlar.get(c) ?? 0) + 1);
  }
  console.log(`toplam sürüm: ${v.length}`);
  console.log(`PUA içeren — kök: ${kok} · şık: ${sik} · açıklama: ${ac}`);
  console.log(`ders dağılımı: ${JSON.stringify(Object.fromEntries(dersler))}`);
  console.log(`durum: ${JSON.stringify(Object.fromEntries(durum))}`);
  console.log('kod noktaları:');
  for (const [c, n] of [...kodlar].sort((a, b) => b[1] - a[1]))
    console.log(`   U+${c.codePointAt(0)!.toString(16).toUpperCase()} → ${n} kez`);
}
main().finally(() => p.$disconnect());
