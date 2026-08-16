import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AppleVerifier, VerifiedTransaction } from './apple-verifier.service';
import { UserSyncService } from '../auth/user-sync.service';

/**
 * Abonelik doğrulama + entitlement (Doc 15). İstemci StoreKit'ten imzalı işlemi gönderir;
 * SUNUCU doğrular, plana eşler, Subscription + Entitlement'ı günceller. Premium kararı
 * hep buradan türer (istemci "premium'um" diyemez).
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

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

    const active = this.isActive(tx);
    const status = active ? 'active' : 'expired';

    // Idempotent: aynı originalTransactionId tekrar doğrulanırsa satır çoğaltma.
    const existing = await this.prisma.subscription.findFirst({
      where: { originalTransactionId: tx.originalTransactionId },
    });

    // GÜVENLİK: bir ödeme yalnız TEK hesaba premium verir. Aynı JWS başka
    // hesapla doğrulanırsa (Apple aile paylaşımı/hesap değişimi) abonelik yeni
    // hesaba TAŞINIR — ama eski hesabın bu abonelikten gelen entitlement'ı
    // İPTAL edilir. Aksi halde 1 ödeme = N hesap premium açığı doğardı.
    if (existing && existing.userId !== userId) {
      await this.prisma.entitlement.updateMany({
        where: { userId: existing.userId, sourceSubscriptionId: existing.id },
        data: { isPremium: false, sourceSubscriptionId: null },
      });
      this.userSync.invalidate(existing.userId);
    }

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

  /** Süresiz ürün (ömürlük) hep aktif; iade/geri alma (revocation) her tipte düşürür. */
  private isActive(tx: VerifiedTransaction): boolean {
    if (tx.revocationDate != null) return false;
    return tx.expiresDate == null || tx.expiresDate.getTime() > Date.now();
  }

  /**
   * App Store Server Notification v2 (Doc 15): Apple; yenileme, süre dolumu,
   * iade ve geri almaları buraya bildirir. Olay-bazlı değil DURUM-bazlı işlenir:
   * bildirimin taşıdığı doğrulanmış işlemden abonelik durumu yeniden hesaplanır —
   * hangi bildirim tipi gelirse gelsin sonuç işlemin kendisinden türer.
   */
  async handleAppleNotification(signedPayload: string) {
    const note = await this.apple.verifyNotification(signedPayload);

    // ASC "Send Test Notification" ve işlemsiz tipler: doğrulandı, işlem yok.
    if (!note.signedTransactionInfo) {
      this.logger.log(`Apple bildirimi (işlemsiz): ${note.notificationType}`);
      return { ok: true };
    }

    const tx = await this.apple.verify(note.signedTransactionInfo);
    const sub = await this.prisma.subscription.findFirst({
      where: { originalTransactionId: tx.originalTransactionId },
    });
    if (!sub) {
      // Kullanıcı uygulamadan hiç doğrulamadıysa eşleyecek hesap yoktur;
      // istemci ilk açılışta /billing/verify ile eşleyecek. Sessizce kabul et
      // (200 dönmezsek Apple aynı bildirimi tekrar tekrar yollar).
      this.logger.warn(
        `Apple bildirimi eşleşmedi: ${note.notificationType} tx=${tx.originalTransactionId}`,
      );
      return { ok: true };
    }

    const active = this.isActive(tx);
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: tx.revocationDate ? 'cancelled' : active ? 'active' : 'expired',
        currentPeriodEnd: tx.expiresDate,
      },
    });
    // Entitlement yalnız bu abonelikten besleniyorsa güncellenir (manuel/premium
    // başka kaynaktan verilmişse ona dokunma).
    await this.prisma.entitlement.updateMany({
      where: { userId: sub.userId, sourceSubscriptionId: sub.id },
      data: { isPremium: active, validUntil: tx.expiresDate },
    });
    this.userSync.invalidate(sub.userId);
    this.logger.log(
      `Apple bildirimi işlendi: ${note.notificationType}/${note.subtype ?? '-'} → ${active ? 'premium' : 'düştü'} (user=${sub.userId})`,
    );
    return { ok: true };
  }
}
