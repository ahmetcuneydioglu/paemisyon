/**
 * "rn" (\r\n) kalıntısı — küçük-harf devamlı biçim ("Millirnkararlarında").
 * Eski fix-rn-artifacts.ts yalnız rn+BÜYÜK deseni ele almıştı.
 * Kelime bazlı çalışır: 'rn' içeren token beyaz listedeyse (meşru kelime)
 * dokunulmaz; değilse 'rn' → boşluk. stem + şıklar + açıklamalar taranır.
 *   npx tsx scripts/fix-rn-kucuk.ts            → DRY-RUN
 *   npx tsx scripts/fix-rn-kucuk.ts --uygula   → yaz
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Meşru 'rn' içeren kelime başlangıçları (TR-lower karşılaştırılır).
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

// Elle bilinen kelime-içi satır sonları (boşluk DEĞİL birleştirme gerekir).
const OVERRIDES = new Map<string, string>([['tarnşımasına', 'taşımasına']]);

const degisenler = new Map<string, string>();

const L = "a-zçğıöşüA-ZÇĞİÖŞÜ"; // harf sınıfı (TR dahil)
const LEAD_RE = new RegExp(`^(?:rn)+(?=[${L}])`);
// rn'nin solunda ≥2 harf YA DA noktalama; sağında ≥2 harf.
const SPLIT_RE = new RegExp(`(?:(?<=[${L}’']{2})|(?<=[.,;:!?)”"]))rn(?=[${L}]{2})`);

/** Tek token'ı özyinelemeli düzelt: beyaz-liste parça parça uygulanır. */
function fixWord(w: string): string {
  const ov = OVERRIDES.get(w.toLocaleLowerCase('tr'));
  if (ov != null) return ov;
  const lower = w.toLocaleLowerCase('tr').replace(/^[^a-zçğıöşü]+/, '');
  if (WHITELIST.some((p) => lower.startsWith(p))) return w;
  const lead = LEAD_RE.exec(w);
  if (lead) return fixWord(w.slice(lead[0].length));
  const idx = w.search(SPLIT_RE);
  if (idx < 0) return w;
  return `${fixWord(w.slice(0, idx))} ${fixWord(w.slice(idx + 2))}`;
}

function fixText(text: string): string {
  const out = text.replace(/[^\s]*rn[^\s]*/g, (token) => {
    const fixed = fixWord(token);
    if (fixed !== token) degisenler.set(token, fixed);
    return fixed;
  });
  return out.replace(/ {2,}/g, ' ').trim();
}

async function main() {
  const apply = process.argv.includes('--uygula');
  let total = 0;
  const show: string[] = [];

  // 1) Soru kökleri
  const versions = await prisma.$queryRawUnsafe<{ id: string; stem: string }[]>(
    `SELECT qv.id, qv.stem FROM question_versions qv
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND qv.stem ~ 'rn'`);
  for (const v of versions) {
    const yeni = fixText(v.stem);
    if (yeni === v.stem) continue;
    total++;
    if (show.length < 6) show.push(`KÖK  ${v.stem.slice(0, 110)}\n  →  ${yeni.slice(0, 110)}`);
    if (apply) await prisma.questionVersion.update({ where: { id: v.id }, data: { stem: yeni } });
  }

  // 2) Açıklamalar
  const expl = await prisma.$queryRawUnsafe<{ id: string; explanation: string }[]>(
    `SELECT qv.id, qv.explanation FROM question_versions qv
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND qv.explanation ~ 'rn'`);
  for (const v of expl) {
    const yeni = fixText(v.explanation);
    if (yeni === v.explanation) continue;
    total++;
    if (show.length < 10) show.push(`AÇK  ${v.explanation.slice(0, 110)}\n  →  ${yeni.slice(0, 110)}`);
    if (apply) await prisma.questionVersion.update({ where: { id: v.id }, data: { explanation: yeni } });
  }

  // 3) Şıklar
  const choices = await prisma.$queryRawUnsafe<{ id: string; text: string }[]>(
    `SELECT c.id, c.text FROM question_options c
     JOIN question_versions qv ON qv.id = c.question_version_id
     JOIN questions q ON q.id = qv.question_id
     WHERE q.deleted_at IS NULL AND qv.status IN ('published','in_review','draft')
       AND c.text ~ 'rn'`);
  for (const c of choices) {
    const yeni = fixText(c.text);
    if (yeni === c.text) continue;
    total++;
    if (show.length < 14) show.push(`ŞIK  ${c.text.slice(0, 110)}\n  →  ${yeni.slice(0, 110)}`);
    if (apply) await prisma.questionOption.update({ where: { id: c.id }, data: { text: yeni } });
  }

  console.log(show.join('\n\n'));
  console.log('\n── DEĞİŞEN TÜM TOKENLAR ──');
  for (const [a, b] of [...degisenler].sort()) console.log(`${a}  →  ${b}`);
  console.log(`\n${apply ? 'uygulandı' : 'değişecek'}: ${total} (kök ${versions.length}, açıklama ${expl.length}, şık ${choices.length} aday)`);
}
main().finally(() => prisma.$disconnect());
