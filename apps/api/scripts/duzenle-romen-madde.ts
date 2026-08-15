/**
 * Romen rakamlı (I. II. III.) maddeleri düz akan soru köklerini çok satırlı
 * biçime çevirir:
 *   - her madde işareti yeni satıra,
 *   - kapanış sorusu güvenli ipucuyla ("Yukarıdaki…", "5237 sayılı…") kendi
 *     satırına — ipucu yoksa DOKUNULMAZ (yanlış bölmektense yapışık kalsın),
 *   - sonda kalan çıplak "I II III" başlık kalıntısı "(I-II-III)" satırına.
 * Mevcut satır sonları KORUNUR (işlem idempotent). contentHash etkilenmez
 * (parmak izi whitespace'i normalleştirir).
 * --uygula olmadan yalnız sayar + örnek gösterir.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ROMAN = '(?:X|IX|VIII|VII|VI|V|IV|III|II|I)';
// Madde işareti: boşluk/satır sonu ardından "I. Büyük-harf/rakam/tırnak".
// Nokta sonrası boşluk isteğe bağlı ("III.Yabancı" da yakalanır).
// Tarihî adlandırmalar madde DEĞİLDİR: "II. İnönü Muharebesi", "II. Dünya
// Savaşı", "II. Meşrutiyet", padişah adları…
const NOT_ITEM =
  '(?!(?:Dünya Savaş|İnönü|Meşrutiyet|Abdülhamit|Abdülhamid|Mahmut|Mahmud|' +
  'Murat|Murad|Selim|Bayezid|Beyazıt|Mehmet|Mehmed|Mustafa Kemal|Wilhelm|' +
  'Katerina|Balkan Savaş|Viyana Kuşatma))';
const ITEM_RE = new RegExp(
  `\\s+(${ROMAN})\\.\\s*(?=[A-ZÇĞİÖŞÜ0-9“"'])${NOT_ITEM}`,
  'g',
);
// Sonda çıplak roman dizisi: "… hangisidir? I II III"
const TRAIL_RE = new RegExp(`\\s+(${ROMAN}(?:\\s+${ROMAN})+)\\s*$`);
// Kapanış cümlesi başlangıç ipuçları (yalnız güvenli, büyük-harf kalıplar).
const CUE = new RegExp(
  '\\s(?=(?:Yukarıdaki\\w*|Yukarıda\\b|Buna göre|Numaralanmış|Verilenler\\w*|' +
    'Bunlardan|Aşağıdaki\\w*|\\d{3,4} sayılı |T\\.C\\. ))',
);

function reformat(stem: string): string | null {
  // Yalnız GERÇEK listeler: bağımsız "I." maddesi + "II." birlikte olmalı.
  // ("II. Dünya Savaşı", "II. Abdülhamit" gibi düz metinler dışarıda kalır.)
  if (!/(^|\s)I\.\s/.test(stem) || !/(^|\s)II\.\s/.test(stem)) return null;
  // Satır sonlarını KORU; yalnız satır içi boşlukları sadeleştir.
  let out = stem
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();

  // 1) Sondaki çıplak "I II III" kalıntısı → sonda "(I-II-III)" satırı.
  let trail = '';
  const t = TRAIL_RE.exec(out);
  if (t) {
    trail = t[1].replace(/\s+/g, '-');
    out = out.slice(0, t.index).trimEnd();
  }

  // 2) Madde işaretleri yeni satıra (zaten satırdaysa değişmez).
  out = out.replace(ITEM_RE, (_, r: string) => `\n${r}. `);

  // 3) Kapanış: yalnız 'hangi' içeren ve bir MADDEYLE başlayan son satırda,
  //    yalnız güvenli ipucu eşleşirse böl. İpucu yoksa olduğu gibi bırak.
  const lines = out.split('\n');
  const last = lines.length - 1;
  const line = lines[last];
  const startsWithItem = new RegExp(`^${ROMAN}\\. `).test(line);
  if (startsWithItem && line.toLocaleLowerCase('tr').includes('hangi')) {
    const cue = CUE.exec(line);
    if (cue && cue.index > 0) {
      lines[last] =
        `${line.slice(0, cue.index).trimEnd()}\n${line.slice(cue.index).trimStart()}`;
      out = lines.join('\n');
    }
  }

  if (trail) out = `${out}\n(${trail})`;

  return out !== stem ? out : null;
}

async function main() {
  const apply = process.argv.includes('--uygula');
  const versions = await prisma.questionVersion.findMany({
    where: {
      status: { in: ['published', 'in_review', 'draft'] },
      question: { deletedAt: null },
      stem: { contains: 'II.' },
    },
    select: { id: true, status: true, stem: true },
  });
  console.log(`aday (II. içeren): ${versions.length}`);

  let changed = 0;
  const samples: { once: string; sonra: string }[] = [];
  for (const v of versions) {
    const yeni = reformat(v.stem);
    if (yeni == null) continue;
    changed++;
    if (samples.length < 5) samples.push({ once: v.stem, sonra: yeni });
    if (apply) {
      await prisma.questionVersion.update({
        where: { id: v.id },
        data: { stem: yeni },
      });
    }
  }
  for (const s of samples) {
    console.log('\n── ÖNCE ──\n' + s.once.slice(0, 280));
    console.log('── SONRA ──\n' + s.sonra.slice(0, 320));
  }
  console.log(apply ? `\nuygulandı: ${changed}` : `\ndeğişecek: ${changed} (--uygula)`);
}
main().finally(() => prisma.$disconnect());
