/**
 * PDF ligatür/kodlama artıklarını düzeltir (soru bankası + mevzuat maddeleri):
 *  1. NFC normalizasyonu (ayrık aksan işaretleri: s+◌̧ → ş vb.)
 *  2. Soft hyphen (U+00AD) silme
 *  3. Ligatür harfleri: Ō→ft, ƨ→tı, Ʃ→tt, ƫ→tti, ķ→fı, ƴ→ttı, Ĭ→sl, Ņ→fk, Ô→Ö
 *
 * Varsayılan dry-run: her değişikliği bağlamıyla listeler. APPLY=1 yazar.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LIG: Record<string, string> = {
  Ō: 'ft',
  ƨ: 'tı',
  Ʃ: 'tt',
  ƫ: 'tti',
  ķ: 'fı',
  ƴ: 'ttı',
  Ĭ: 'sl',
  Ņ: 'fk',
  Ô: 'Ö',
};
const LIG_RE = new RegExp(`[${Object.keys(LIG).join('')}]`, 'g');

function fix(t: string): string {
  return t
    .normalize('NFC')
    .replace(/­/g, '')
    .replace(/ƫ(?=t)/g, 't') // "aiƫtir"→"aittir": t'den önce ƫ tek t'dir
    .replace(LIG_RE, (ch) => LIG[ch])
    .replace(/\bsattir\b/g, 'saattir') // "48 saƫr" → kaynakta "saattir"
    .replace(/\btarafıdan\b/g, 'tarafından'); // "taraķdan" kaynak dizgi hatası
}

function diffCtx(before: string, after: string): string[] {
  // Ligatür değişimlerinin bağlamını raporla (NFC/soft-hyphen hariç — çok kalabalık)
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(LIG_RE.source, 'g');
  while ((m = re.exec(before)) !== null) {
    const i = m.index;
    out.push(
      `${m[0]}→${LIG[m[0]]} | …${before.slice(Math.max(0, i - 30), i + 30).replace(/\n/g, ' ')}…`,
    );
  }
  void after;
  return out;
}

async function main() {
  const apply = process.env.APPLY === '1';
  let vChanged = 0;
  let oChanged = 0;
  let aChanged = 0;

  // Soru sürümleri (stem + explanation)
  const versions = await prisma.questionVersion.findMany({
    select: { id: true, stem: true, explanation: true },
  });
  for (const v of versions) {
    const stem = fix(v.stem);
    const expl = v.explanation ? fix(v.explanation) : v.explanation;
    if (stem !== v.stem || expl !== v.explanation) {
      vChanged++;
      for (const c of diffCtx(v.stem + '\n' + (v.explanation ?? ''), ''))
        console.log(`soru ${v.id.slice(0, 8)}: ${c}`);
      if (apply)
        await prisma.questionVersion.update({
          where: { id: v.id },
          data: { stem, explanation: expl },
        });
    }
  }

  // Şıklar
  const options = await prisma.questionOption.findMany({
    select: { id: true, text: true },
  });
  for (const o of options) {
    const text = fix(o.text);
    if (text !== o.text) {
      oChanged++;
      for (const c of diffCtx(o.text, ''))
        console.log(`şık ${o.id.slice(0, 8)}: ${c}`);
      if (apply)
        await prisma.questionOption.update({ where: { id: o.id }, data: { text } });
    }
  }

  // Mevzuat maddeleri (title + text) — aynı PDF kaynaklı artıklar olabilir
  const articles = await prisma.lawArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, text: true, articleNo: true },
  });
  for (const a of articles) {
    const text = fix(a.text);
    const title = a.title ? fix(a.title) : a.title;
    if (text !== a.text || title !== a.title) {
      aChanged++;
      for (const c of diffCtx((a.title ?? '') + '\n' + a.text, ''))
        console.log(`madde ${a.articleNo} ${a.id.slice(0, 8)}: ${c}`);
      if (apply)
        await prisma.lawArticle.update({ where: { id: a.id }, data: { text, title } });
    }
  }

  console.log(
    `\ndeğişen: ${vChanged} soru sürümü, ${oChanged} şık, ${aChanged} madde ${apply ? '(YAZILDI)' : '(dry-run — APPLY=1 ile yaz)'}`,
  );
  await prisma.$disconnect();
}
main();
