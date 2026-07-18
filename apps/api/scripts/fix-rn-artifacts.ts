/**
 * "rn" (\r\n) import artığı temizliği (görev task_6148cfed).
 * Soru köklerinde satır sonu \r\n → düz "rn" metnine dönüşmüş (63 kayıt).
 * Desen: "rn" (tekrarlı olabilir) hemen bir BÜYÜK harften önce = kayıp satır sonu.
 * Türkçe/İngilizce'de kelime-içi "rn"+büyük-harf oluşmadığı için güvenli;
 * yine de yalnız eşleşen kayıtlarda ve büyük-harf-öncesi bağlamda değiştirir.
 *
 * Kullanım:
 *   npx ts-node scripts/fix-rn-artifacts.ts          → DRY-RUN (önce/sonra, yazmaz)
 *   npx ts-node scripts/fix-rn-artifacts.ts --apply   → UYGULA
 * CLAUDE.md: connection_limit=1; DB-yazma penceresinde backend durdur.
 */
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');

// "rn" bir veya daha fazla kez, hemen büyük harf (TR dahil) öncesi.
const ARTIFACT = /(?:rn)+(?=[A-ZŞÇÖÜİĞ])/g;

/** Artığı boşluğa çevir, sonra whitespace'i sadeleştir (satır sonları korunur). */
function clean(stem: string): string {
  let out = stem.replace(ARTIFACT, ' ');
  out = out.replace(/[ \t]*\n[ \t]*/g, '\n'); // satır sonu çevresini kırp
  out = out.replace(/ {2,}/g, ' '); // çoklu boşluk → tek
  return out.trim();
}

function client() {
  const url = process.env.DATABASE_URL!;
  return new PrismaClient({
    datasources: {
      db: {
        url: url.includes('connection_limit')
          ? url
          : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`,
      },
    },
  });
}

async function main() {
  const prisma = client();
  try {
    const rows = await prisma.$queryRawUnsafe<{ id: string; stem: string }[]>(
      `SELECT id, stem FROM question_versions WHERE stem ~ 'rn[A-ZŞÇÖÜİĞ]'`,
    );
    console.log(`Eşleşen sürüm: ${rows.length}\n`);

    let changed = 0;
    let stillDirty = 0;
    for (const r of rows) {
      const next = clean(r.stem);
      if (next === r.stem) continue;
      changed++;
      // Uygulama sonrası hâlâ "rn+Büyük" kalıyor mu? (güvenlik kontrolü)
      if (/rn[A-ZŞÇÖÜİĞ]/.test(next)) stillDirty++;
      if (!APPLY) {
        console.log('─'.repeat(70));
        console.log('ÖNCE:', JSON.stringify(r.stem.slice(0, 160)));
        console.log('SONRA:', JSON.stringify(next.slice(0, 160)));
      } else {
        await prisma.questionVersion.update({ where: { id: r.id }, data: { stem: next } });
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`Değişecek/değişen kayıt: ${changed}`);
    if (stillDirty > 0) console.log(`⚠️ UYARI: ${stillDirty} kayıtta hâlâ artık kalıyor — deseni gözden geçir.`);
    console.log(APPLY ? '✓ UYGULANDI.' : 'DRY-RUN — yazılmadı. Uygulamak için --apply.');
  } finally {
    await prisma.$disconnect();
  }
}
void main();
