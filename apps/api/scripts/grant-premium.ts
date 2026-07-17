/**
 * Test/destek amaçlı premium verme (Doc 8 entitlement modeli).
 * Kullanım: npx ts-node scripts/grant-premium.ts <email> [gunSayisi]
 *   gunSayisi verilmezse süresiz (validUntil=null).
 * Ayrıca bugünkü AI açıklama sayacını sıfırlar (test kolaylığı).
 */
import { PrismaClient } from '@prisma/client';

const email = process.argv[2];
const days = process.argv[3] ? Number(process.argv[3]) : null;

async function main() {
  if (!email) throw new Error('Kullanım: grant-premium.ts <email> [gunSayisi]');
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
