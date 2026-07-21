/**
 * Fiyatlandırma güncellemesi: web'in tek satılabilir planı 3 AYLIK 499,99 TL.
 *
 * NOT: İlk geçiş artık `20260721090100_premium_quarterly_plan` migration'ı ile
 * dağıtımda OTOMATİK uygulanır — bu scripti çalıştırmana gerek yok. Script,
 * ileride fiyat/limit değiştirmek ya da mevcut durumu görmek (kuru çalışma)
 * istediğinde elde kalan araçtır.
 *
 * Ne yapar (hepsi idempotent, hiçbir satır SİLİNMEZ):
 *   1. free planın günlük soru limitini 30'a çeker,
 *   2. 'quarterly' planını oluşturur/günceller (3 Aylık Premium, 499.99 TRY),
 *   3. diğer satılabilir planları (monthly/yearly) isActive=false yapar —
 *      mevcut abonelikler etkilenmez, yalnız satın alma listesinden düşerler.
 *
 * Ödeme manuel yürüdüğü için mağaza ürün kimlikleri (iOS/Android) boşaltılır.
 *
 * ÖNCE migration: npx prisma migrate deploy  (PlanPeriod.quarterly eklenir)
 * Çalıştırma:     npx ts-node scripts/set-premium-plan.ts [--apply]
 *                 --apply verilmezse yalnız ne yapacağını yazar (kuru çalışma).
 */
import { PrismaClient } from '@prisma/client';
import { FREE_DAILY_LIMIT_FALLBACK } from '../src/common/plan.constants';

const APPLY = process.argv.includes('--apply');

// Limit tek kaynaktan gelir; burada tekrar yazılmaz (sapma olmasın).
const FREE_DAILY_LIMIT = FREE_DAILY_LIMIT_FALLBACK;
const PREMIUM = {
  key: 'quarterly',
  name: '3 Aylık Premium',
  price: '499.99',
  currency: 'TRY',
  period: 'quarterly' as const,
};

async function main() {
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
    const before = await prisma.plan.findMany({ orderBy: { key: 'asc' } });
    console.log('── ÖNCE ──');
    for (const p of before) {
      console.log(
        `  ${p.key.padEnd(10)} ${p.name.padEnd(20)} ${String(p.price ?? '—').padStart(8)} ${p.currency}` +
          ` · ${p.period} · limit=${p.dailyQuestionLimit ?? 'sınırsız'} · aktif=${p.isActive}`,
      );
    }

    if (!APPLY) {
      console.log('\n[KURU ÇALIŞMA] Uygulamak için --apply ekle. Yapılacaklar:');
      console.log(`  free.dailyQuestionLimit → ${FREE_DAILY_LIMIT}`);
      console.log(`  ${PREMIUM.key} planı upsert → ${PREMIUM.name}, ${PREMIUM.price} ${PREMIUM.currency}`);
      console.log('  diğer satılabilir planlar (free ve quarterly dışı) → isActive=false');
      return;
    }

    await prisma.plan.update({
      where: { key: 'free' },
      data: { dailyQuestionLimit: FREE_DAILY_LIMIT },
    });

    await prisma.plan.upsert({
      where: { key: PREMIUM.key },
      update: {
        name: PREMIUM.name,
        price: PREMIUM.price,
        currency: PREMIUM.currency,
        period: PREMIUM.period,
        dailyQuestionLimit: null, // premium = sınırsız
        isActive: true,
        // Ödeme manuel (Telegram/Instagram) — mağaza eşlemesi yok.
        storeProductIdIos: null,
        storeProductIdAndroid: null,
      },
      create: {
        key: PREMIUM.key,
        name: PREMIUM.name,
        price: PREMIUM.price,
        currency: PREMIUM.currency,
        period: PREMIUM.period,
        dailyQuestionLimit: null,
        isActive: true,
      },
    });

    const deactivated = await prisma.plan.updateMany({
      where: { key: { notIn: ['free', PREMIUM.key] }, isActive: true },
      data: { isActive: false },
    });

    const after = await prisma.plan.findMany({ orderBy: { key: 'asc' } });
    console.log(`\n── SONRA ── (${deactivated.count} eski plan pasifleştirildi)`);
    for (const p of after) {
      console.log(
        `  ${p.key.padEnd(10)} ${p.name.padEnd(20)} ${String(p.price ?? '—').padStart(8)} ${p.currency}` +
          ` · ${p.period} · limit=${p.dailyQuestionLimit ?? 'sınırsız'} · aktif=${p.isActive}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('HATA:', e.message ?? e);
  process.exit(1);
});
