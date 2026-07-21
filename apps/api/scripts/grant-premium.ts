/**
 * Manuel premium verme (Doc 8 entitlement modeli) — Telegram/Instagram üzerinden
 * ödeme alındığında kullanılır.
 *
 * Kullanım: npx ts-node scripts/grant-premium.ts <email> [gunSayisi|--suresiz]
 *   gunSayisi verilmezse SATILAN PAKET kadar (3 aylık = 90 gün) verilir.
 *   Süresiz vermek artık AÇIKÇA belirtilmeli: `--suresiz`.
 *
 * Neden: eskiden argüman unutulduğunda süresiz premium veriliyordu — 3 aylık
 * ödeme karşılığında ömür boyu erişim, sessizce.
 *
 * Ayrıca bugünkü AI açıklama sayacını sıfırlar (destek kolaylığı).
 */
import { PrismaClient } from '@prisma/client';
import { PREMIUM_GRANT_DAYS } from '../src/common/plan.constants';

const email = process.argv[2];
const arg = process.argv[3];
const forever = arg === '--suresiz' || arg === '--forever';
const days = forever ? null : arg ? Number(arg) : PREMIUM_GRANT_DAYS;

if (!forever && (!Number.isFinite(days as number) || (days as number) <= 0)) {
  console.error(`HATA: geçersiz gün sayısı "${arg}". Pozitif bir sayı ver ya da --suresiz kullan.`);
  process.exit(1);
}

async function main() {
  if (!email)
    throw new Error(
      `Kullanım: grant-premium.ts <email> [gunSayisi|--suresiz]  (varsayılan ${PREMIUM_GRANT_DAYS} gün)`,
    );
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url.includes('connection_limit')
          ? url
          : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`,
      },
    },
  });
  try {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, displayName: true },
    });
    if (!user) throw new Error(`Kullanıcı bulunamadı: ${email}`);

    const validUntil = days ? new Date(Date.now() + days * 86_400_000) : null;
    await prisma.entitlement.upsert({
      where: { userId: user.id },
      update: { isPremium: true, validUntil },
      create: { userId: user.id, isPremium: true, validUntil },
    });

    // Bugünkü AI sayacını sıfırla (başarısız denemelerde yanan haklar).
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.$executeRaw`
      UPDATE daily_usage SET ai_explanations_used = 0
      WHERE user_id = ${user.id}::uuid AND usage_date = ${today}`;

    console.log(
      `OK: ${user.email} (${user.displayName}) → premium`,
      validUntil ? `(${days} gün, ${validUntil.toISOString().slice(0, 10)}'e kadar)` : '(süresiz)',
      '· bugünkü AI sayacı sıfırlandı',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('HATA:', e.message ?? e);
  process.exit(1);
});
