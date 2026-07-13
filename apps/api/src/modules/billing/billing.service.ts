import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AppleVerifier } from './apple-verifier.service';
import { UserSyncService } from '../auth/user-sync.service';

/**
 * Abonelik doğrulama + entitlement (Doc 15). İstemci StoreKit'ten imzalı işlemi gönderir;
 * SUNUCU doğrular, plana eşler, Subscription + Entitlement'ı günceller. Premium kararı
 * hep buradan türer (istemci "premium'um" diyemez).
 */
@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apple: AppleVerifier,
    private readonly userSync: UserSyncService,
  ) {}

  /** Paywall için satın alınabilir planlar (ücretsiz hariç). */
  async purchasablePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true, key: { not: 'free' } },
      orderBy: { period: 'asc' },
      select: {
        key: true,
        name: true,
        price: true,
        currency: true,
        period: true,
        storeProductIdIos: true,
        storeProductIdAndroid: true,
      },
    });
    return plans.map((p) => ({ ...p, price: p.price?.toString() ?? null }));
  }

  /** Apple StoreKit 2 imzalı işlemini doğrula ve premium'u ver. */
  async verifyApple(userId: string, transactionJws: string) {
    const tx = await this.apple.verify(transactionJws);

    const plan = await this.prisma.plan.findFirst({
      where: {
        isActive: true,
        OR: [
          { storeProductIdIos: tx.productId },
          { storeProductIdAndroid: tx.productId },
        ],
      },
    });
    if (!plan) {
      throw new BadRequestException(`Ürün bir plana eşlenmedi: ${tx.productId}`);
    }

    const active = tx.expiresDate == null || tx.expiresDate.getTime() > Date.now();
    const status = active ? 'active' : 'expired';

    // Idempotent: aynı originalTransactionId tekrar doğrulanırsa satır çoğaltma.
    const existing = await this.prisma.subscription.findFirst({
      where: { originalTransactionId: tx.originalTransactionId },
    });
    const sub = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: {
            userId,
            planId: plan.id,
            provider: 'apple',
            status,
            currentPeriodEnd: tx.expiresDate,
          },
        })
      : await this.prisma.subscription.create({
          data: {
            userId,
            planId: plan.id,
            provider: 'apple',
            status,
            originalTransactionId: tx.originalTransactionId,
            currentPeriodEnd: tx.expiresDate,
          },
        });

    await this.prisma.entitlement.upsert({
      where: { userId },
      update: {
        isPremium: active,
        validUntil: tx.expiresDate,
        sourceSubscriptionId: sub.id,
      },
      create: {
        userId,
        isPremium: active,
        validUntil: tx.expiresDate,
        sourceSubscriptionId: sub.id,
      },
    });

    this.userSync.invalidate(userId); // guard cache — premium anında yansısın
    return {
      isPremium: active,
      validUntil: tx.expiresDate,
      plan: plan.key,
      environment: tx.environment,
    };
  }
}
