/**
 * "rn" (\r\n) kalıntısı — KENAR biçimleri. fix-rn-kucuk.ts yalnız iki yanı
 * harf olan rn'leri ele almıştı; noktalama/madde işareti/boşluk komşulu
 * biçimler kaçtı (2026-08-16 simülatör testi: "…sıralanmıştır:rn• I." ve
 * "…almaz?rn"). Bu script şunları düzeltir:
 *   - noktalama sonrası satır sonu rn'i:  "almaz?rn"  → "almaz?"
 *   - noktalama + rn + metin:             "?rnYukarıdaki" → "?\nYukarıdaki"
 *   - madde işareti öncesi rn:            "rn•" → "\n•" (solda meşru kelime
 *     varsa WHITELIST korur: modern•, pattern• …)
 *   - tek başına rn token'ı:              " rn " → " "
 *   - satır/metin başı rn + BÜYÜK harf:   "rnII." → "II."
 * İki yanı harf olan rn'lere DOKUNMAZ (o iş fix-rn-kucuk.ts'nin).
 *   npx tsx scripts/fix-rn-kenar.ts            → DRY-RUN
 *   npx tsx scripts/fix-rn-kenar.ts --uygula   → yaz
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// fix-rn-kucuk.ts ile aynı yaklaşım: meşru 'rn' içeren kelime başlangıçları.
const WHITELIST = [
  'örne', 'tırna', 'intern', 'dern', 'alterna', 'kararnam', 'karnaval',
  'turn', 'burnu', 'burun', 'ihbarnam', 'sibernetik', 'guernica', 'mudurnu',
  'morning', 'learne', 'learni', 'earne', 'earni', 'warne', 'warni', 'journ',
  'modern', 'güvernör', 'eternal', 'external', 'governe', 'governm', 'zırnık',
  'edirne', 'arnavut', 'lüzern', 'bern', 'verne', 'çernob', 'körner',
  'corner', 'tornad', 'tornavida', 'kernel', 'furni', 'overnight', 'ethernet',
  'california', 'guverno', 'lokarno', 'concern', 'pattern', 'western',
  'eastern', 'northern', 'southern', 'attorney', 'halikarnas', 'fernando',
  'garnizon', 'gurnah', 'burne', 'burni', 'burnt', 'hükûmetn',
];

const LOWER = 'a-zçğıöşü';
const PUNCT = '.,;:!?)»”"’…';
const BULLET = '•▪●◦·';

function whitelisted(token: string): boolean {
  const lower = token
    .toLocaleLowerCase('tr')
    .replace(new RegExp(`^[^${LOWER}]+`), '');
  return WHITELIST.some((p) => lower.startsWith(p));
}

const ornekler = new Map<string, string>();

function ctx(text: string, idx: number, len: number): void {
  const a = Math.max(0, idx - 45);
  const b = Math.min(text.length, idx + len + 45);
  ornekler.set(text.slice(a, b), '');
}

/** joiner: kök/açıklamada '\n' (rn bir satır sonuydu), şıkta ' '. */
function fixText(text: string, joiner: '\n' | ' '): string {
  let out = text;

  // 1) Noktalama + rn + boşluk/son → rn silinir ("almaz?rn").
  out = out.replace(
    new RegExp(`(?<=[${PUNCT}])(?:rn)+(?=\\s|$)`, 'g'),
    (m, idx: number) => (ctx(out, idx, m.length), ''),
  );

  // 2) Noktalama + rn + metin → satır sonu geri gelir ("?rnYukarıdaki", ":rn•").
  out = out.replace(
    new RegExp(`(?<=[${PUNCT}])(?:rn)+(?=\\S)`, 'g'),
    (m, idx: number) => (ctx(out, idx, m.length), joiner),
  );

  // 3) Madde işareti öncesi rn ("kelimern•"). Solda harf varsa whitelist korur.
  out = out.replace(
    new RegExp(`(?:rn)+(?=\\s*[${BULLET}])`, 'g'),
    (m, idx: number) => {
      const before = out.slice(0, idx);
      const tokenMatch = new RegExp(`[${LOWER}A-ZÇĞİÖŞÜ’']+$`, 'i').exec(before);
      if (tokenMatch && whitelisted(tokenMatch[0] + 'rn')) return m;
      ctx(out, idx, m.length);
      // Zaten satır başındaysa ("⏎rn•") yeni satır ekleme, sadece sil.
      return idx === 0 || out[idx - 1] === '\n' ? '' : joiner;
    },
  );

  // 4) Tek başına rn token'ı (" rn ", satır başı "rn ").
  out = out.replace(
    /(?<=^|\s)(?:rn)+(?=\s|$)/g,
    (m, idx: number) => (ctx(out, idx, m.length), ''),
  );

  // 5) Satır/metin başı rn + BÜYÜK harf/rakam/tırnak ("rnII. madde").
  out = out.replace(
    /(?<=^|\n)(?:rn)+(?=[A-ZÇĞİÖŞÜ0-9“"'(])/g,
    (m, idx: number) => (ctx(out, idx, m.length), ''),
  );

  // Boşluk temizliği (mevcut satır yapısı korunur).
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function main() {
  const apply = process.argv.includes('--uygula');
  let total = 0;
  const show: string[] = [];
  const push = (tag: string, once: string, sonra: string) => {
    if (show.length < 20)
      show.push(`${tag}  ${once.slice(0, 130)}\n  →  ${sonra.slice(0, 130)}`);
  };

  // 1) Soru kökleri
  const versions = await prisma.$queryRawUnsafe<{ id: string; stem: string }[]>(
    `SELECT qv.id, qv.stem FROM question_versions qv
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND qv.stem ~ 'rn'`);
  let stemN = 0;
  for (const v of versions) {
    const yeni = fixText(v.stem, '\n');
    if (yeni === v.stem) continue;
    total++; stemN++;
    push('KÖK', v.stem, yeni);
    if (apply) await prisma.questionVersion.update({ where: { id: v.id }, data: { stem: yeni } });
  }

  // 2) Açıklamalar
  const expl = await prisma.$queryRawUnsafe<{ id: string; explanation: string }[]>(
    `SELECT qv.id, qv.explanation FROM question_versions qv
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND qv.explanation ~ 'rn'`);
  let explN = 0;
  for (const v of expl) {
    const yeni = fixText(v.explanation, '\n');
    if (yeni === v.explanation) continue;
    total++; explN++;
    push('AÇK', v.explanation, yeni);
    if (apply) await prisma.questionVersion.update({ where: { id: v.id }, data: { explanation: yeni } });
  }

  // 3) Şıklar
  const choices = await prisma.$queryRawUnsafe<{ id: string; text: string }[]>(
    `SELECT c.id, c.text FROM question_options c
     JOIN question_versions qv ON qv.id = c.question_version_id
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND c.text ~ 'rn'`);
  let optN = 0;
  for (const c of choices) {
    const yeni = fixText(c.text, ' ');
    if (yeni === c.text) continue;
    total++; optN++;
    push('ŞIK', c.text, yeni);
    if (apply) await prisma.questionOption.update({ where: { id: c.id }, data: { text: yeni } });
  }

  console.log(show.join('\n\n'));
  console.log('\n── EŞLEŞME BAĞLAMLARI ──');
  for (const k of [...ornekler.keys()].sort())
    console.log(`  …${k.replace(/\n/g, '⏎')}…`);
  console.log(`\n${apply ? 'uygulandı' : 'değişecek'}: ${total} (kök ${stemN}, açıklama ${explN}, şık ${optN})`);
}
main().finally(() => prisma.$disconnect());
