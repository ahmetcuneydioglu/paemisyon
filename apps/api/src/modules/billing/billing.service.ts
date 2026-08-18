import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AppleVerifier, VerifiedTransaction } from './apple-verifier.service';
import { GooglePlayVerifier } from './google-play-verifier.service';
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
    private readonly google: GooglePlayVerifier,
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
    return this.grant(userId, {
      provider: 'apple',
      productId: tx.productId,
      transactionId: tx.originalTransactionId,
      expiresDate: tx.expiresDate,
      revocationDate: tx.revocationDate,
      environment: tx.environment,
    });
  }

  /**
   * Google Play satın almasını doğrula ve premium'u ver.
   *
   * Abonelik mi tek seferlik ürün mü olduğunu PLAN belirler (istemci değil):
   * `period` lifetime ise products, değilse subscriptionsv2 uçları sorulur.
   */
  async verifyGoogle(userId: string, purchaseToken: string, productId?: string) {
    if (!productId) {
      throw new BadRequestException('Google doğrulaması için productId gerekli.');
    }
    const plan = await this.findPlanByProduct(productId);
    const purchase =
      plan.period === 'lifetime'
        ? await this.google.verifyProduct(productId, purchaseToken)
        : await this.google.verifySubscription(purchaseToken);

    return this.grant(userId, {
      provider: 'google',
      // Abonelikte ürün kimliği lineItems'tan gelir; boşsa istemcininkine düş.
      productId: purchase.productId || productId,
      transactionId: purchase.purchaseToken,
      expiresDate: purchase.expiresDate,
      revocationDate: purchase.revocationDate,
      environment: purchase.environment,
    });
  }

  /** Ürün kimliğinden plan; `isActive` filtresi YOK (bkz. aşağıdaki not). */
  private async findPlanByProduct(productId: string) {
    // DİKKAT: `isActive` filtresi YOK. Pasif plan "artık satılmıyor" demektir,
    // "eski satın almalar geçersiz" demek DEĞİL. Filtreliyken emekliye ayrılan
    // bir paketin sahibi doğrulama alamıyor, istemci de işlemi kalıcı hatalı
    // sayıp kapatıyordu — ödenmiş premium buharlaşırdı.
    const plan = await this.prisma.plan.findFirst({
      where: {
        OR: [
          { storeProductIdIos: productId },
          { storeProductIdAndroid: productId },
        ],
      },
    });
    if (!plan) {
      throw new BadRequestException(`Ürün bir plana eşlenmedi: ${productId}`);
    }
    return plan;
  }

  /**
   * Mağazadan bağımsız ORTAK entitlement yazımı (Apple + Google).
   * Doğrulama mağazaya özgüdür; premium kararı ve kayıt düzeni ortaktır.
   */
  private async grant(
    userId: string,
    tx: {
      provider: 'apple' | 'google';
      productId: string;
      transactionId: string;
      expiresDate: Date | null;
      revocationDate: Date | null;
      environment: string;
    },
  ) {
    const plan = await this.findPlanByProduct(tx.productId);
    const active = this.isActive(tx);
    const status = active ? 'active' : 'expired';

    // Idempotent: aynı işlem tekrar doğrulanırsa satır çoğaltma.
    const existing = await this.prisma.subscription.findFirst({
      where: { originalTransactionId: tx.transactionId },
    });

    // GÜVENLİK: bir ödeme yalnız TEK hesaba premium verir. Aynı işlem başka
    // hesapla doğrulanırsa (aile paylaşımı/hesap değişimi) abonelik yeni
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
            provider: tx.provider,
            status,
            currentPeriodEnd: tx.expiresDate,
          },
        })
      : await this.prisma.subscription.create({
          data: {
            userId,
            planId: plan.id,
            provider: tx.provider,
            status,
            originalTransactionId: tx.transactionId,
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

  /**
   * Google Play RTDN (Doc 15 — Apple bildiriminin karşılığı).
   *
   * Bildirimin İÇERİĞİNE GÜVENİLMEZ: yalnız "hangi satın alma değişti"
   * bilgisi alınır (purchaseToken), durum Google API'ye yeniden sorularak
   * türetilir. Böylece sahte bir Pub/Sub isteği premium açamaz.
   *
   * voidedPurchase (iade/geri alma) ayrı ele alınır: orada satın alma artık
   * sorgulanamaz, doğrudan erişim kapatılır.
   */
  async handleGoogleNotification(dataB64: string) {
    let payload: {
      subscriptionNotification?: { purchaseToken?: string; subscriptionId?: string };
      oneTimeProductNotification?: { purchaseToken?: string; sku?: string };
      voidedPurchaseNotification?: { purchaseToken?: string };
      testNotification?: unknown;
    };
    try {
      payload = JSON.parse(Buffer.from(dataB64, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException('Bildirim verisi çözülemedi.');
    }

    // Play Console "Send test notification" — doğrulandı, işlem yok.
    if (payload.testNotification) {
      this.logger.log('Play test bildirimi alındı.');
      return { ok: true };
    }

    const voided = payload.voidedPurchaseNotification?.purchaseToken;
    if (voided) {
      // İade: satın alma artık geçerli değil, erişimi hemen kapat.
      const sub = await this.prisma.subscription.findFirst({
        where: { originalTransactionId: voided },
      });
      if (sub) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'cancelled' },
        });
        await this.prisma.entitlement.updateMany({
          where: { userId: sub.userId, sourceSubscriptionId: sub.id },
          data: { isPremium: false },
        });
        this.userSync.invalidate(sub.userId);
        this.logger.log(`Play iadesi işlendi (user=${sub.userId}).`);
      }
      return { ok: true };
    }

    const token =
      payload.subscriptionNotification?.purchaseToken ??
      payload.oneTimeProductNotification?.purchaseToken;
    const productId =
      payload.subscriptionNotification?.subscriptionId ??
      payload.oneTimeProductNotification?.sku;
    if (!token) return { ok: true }; // ilgilenmediğimiz bir bildirim tipi

    const sub = await this.prisma.subscription.findFirst({
      where: { originalTransactionId: token },
    });
    if (!sub) {
      // Kullanıcı henüz uygulamadan doğrulamadıysa eşleyecek hesap yoktur;
      // istemci ilk açılışta /billing/verify ile eşleyecek. 200 dönmezsek
      // Pub/Sub aynı bildirimi tekrar tekrar yollar.
      this.logger.warn(`Play bildirimi eşleşmedi: ${token.slice(0, 12)}…`);
      return { ok: true };
    }

    const isLifetime = payload.oneTimeProductNotification != null;
    const purchase = isLifetime
      ? await this.google.verifyProduct(productId ?? '', token)
      : await this.google.verifySubscription(token);

    const active = this.isActive(purchase);
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: purchase.revocationDate ? 'cancelled' : active ? 'active' : 'expired',
        currentPeriodEnd: purchase.expiresDate,
      },
    });
    // Entitlement yalnız bu abonelikten besleniyorsa güncellenir (manuel
    // premium başka kaynaktan verilmişse ona dokunma).
    await this.prisma.entitlement.updateMany({
      where: { userId: sub.userId, sourceSubscriptionId: sub.id },
      data: { isPremium: active, validUntil: purchase.expiresDate },
    });
    this.userSync.invalidate(sub.userId);
    this.logger.log(
      `Play bildirimi işlendi → ${active ? 'premium' : 'düştü'} (user=${sub.userId}).`,
    );
    return { ok: true };
  }

  /** Süresiz ürün (ömürlük) hep aktif; iade/geri alma (revocation) her tipte düşürür. */
  private isActive(tx: { expiresDate: Date | null; revocationDate: Date | null }): boolean {
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
