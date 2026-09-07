import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../audit.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { FREE_DAILY_LIMIT_FALLBACK } from '../../../common/plan.constants';

/** Ücretsiz planın anahtarı — limit bu satırda yaşar. */
const FREE_KEY = 'free';

/**
 * Plan yönetimi (7 Eyl 2026) — fiyat ve günlük soru limiti tek yerden.
 *
 * Limit zaten veritabanındaydı (`plans.daily_question_limit`) ve sunucu onu 60
 * saniyelik önbellekle okuyordu; eksik olan panel yüzeyiydi. Değer ancak elle
 * SQL ya da script'le değiştirilebiliyordu.
 *
 * `key` DEĞİŞTİRİLEMEZ: kodun her yerinde sabit olarak geçiyor ('free' limit
 * kaynağı, 'quarterly' webde satılan plan). Anahtarı değiştirmek fiyat
 * sayfasını sessizce boşaltır ve limiti emniyet ağına düşürür.
 */
@Injectable()
export class AdminPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const planlar = await this.prisma.plan.findMany({
      orderBy: [{ isActive: 'desc' }, { key: 'asc' }],
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return planlar.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      price: p.price != null ? Number(p.price) : null,
      currency: p.currency,
      period: p.period,
      dailyQuestionLimit: p.dailyQuestionLimit,
      storeProductIdIos: p.storeProductIdIos,
      storeProductIdAndroid: p.storeProductIdAndroid,
      isActive: p.isActive,
      /** Bu plana bağlı abonelik sayısı — kapatmadan önce görülmeli. */
      subscriptionCount: p._count.subscriptions,
      /** Günlük limitin yaşadığı satır; panel bunu vurgular. */
      limitKaynagi: p.key === FREE_KEY,
    }));
  }

  /**
   * Plan güncelle. Korumalar kasıtlı ve sunucuda:
   *
   * - Ücretsiz plan KAPATILAMAZ — kapanırsa limit emniyet ağına düşer
   *   (FREE_DAILY_LIMIT_FALLBACK) ve panelden yönetilemez hâle gelir.
   * - Ücretsiz planın limiti BOŞ BIRAKILAMAZ — null "sınırsız" demek; ücretsiz
   *   katmanı kazara sınırsız yapmak ürünü sessizce bedavaya çevirir.
   * - Ücretli planın limiti null olmalı; sayı girilirse premium kullanıcı
   *   duvara çarpar. Sayı verilirse reddedilir.
   */
  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: {
      name?: string;
      price?: number | null;
      dailyQuestionLimit?: number | null;
      isActive?: boolean;
      storeProductIdIos?: string | null;
      storeProductIdAndroid?: string | null;
    },
  ) {
    const mevcut = await this.prisma.plan.findUnique({ where: { id } });
    if (!mevcut) throw new NotFoundException('Plan bulunamadı.');
    const ucretsiz = mevcut.key === FREE_KEY;

    if (ucretsiz && dto.isActive === false) {
      throw new BadRequestException(
        'Ücretsiz plan kapatılamaz — günlük soru limiti bu satırda yaşıyor.',
      );
    }
    if (ucretsiz && dto.dailyQuestionLimit === null) {
      throw new BadRequestException(
        'Ücretsiz planın günlük limiti boş bırakılamaz (boş = sınırsız).',
      );
    }
    if (!ucretsiz && typeof dto.dailyQuestionLimit === 'number') {
      throw new BadRequestException(
        'Ücretli planda günlük limit olmaz — premium sınırsızdır, alan boş bırakılır.',
      );
    }

    const guncel = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.dailyQuestionLimit !== undefined
          ? { dailyQuestionLimit: dto.dailyQuestionLimit }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.storeProductIdIos !== undefined
          ? { storeProductIdIos: dto.storeProductIdIos }
          : {}),
        ...(dto.storeProductIdAndroid !== undefined
          ? { storeProductIdAndroid: dto.storeProductIdAndroid }
          : {}),
      },
    });

    await this.audit.log(actor, 'plan.update', 'plan', id, {
      key: mevcut.key,
      oncesi: {
        name: mevcut.name,
        price: mevcut.price != null ? Number(mevcut.price) : null,
        dailyQuestionLimit: mevcut.dailyQuestionLimit,
        isActive: mevcut.isActive,
      },
      sonrasi: dto,
    });
    return {
      ...guncel,
      price: guncel.price != null ? Number(guncel.price) : null,
      /** Önbellek nedeniyle değişikliğin yansıma süresi — panel bunu yazar. */
      yansimaSaniye: 60,
    };
  }

  /**
   * Limit değişikliğinin BUGÜNE etkisi — panel uyarısı için.
   *
   * Limit her cevapta canlı okunuyor, yani düşürmek gün ORTASINDA da geçerli:
   * 30'dan 15'e inersen o gün 20 soru çözmüş ücretsiz kullanıcı anında duvara
   * çarpar. Kaç kişinin etkileneceğini önceden söylemek, kararı körlemesine
   * vermekten iyidir.
   */
  async limitEtkisi(yeniLimit: number) {
    const bugun = new Date();
    bugun.setUTCHours(0, 0, 0, 0);
    const [bugunAktif, etkilenen] = await Promise.all([
      this.prisma.dailyUsage.count({
        where: { usageDate: bugun, questionsAnswered: { gt: 0 } },
      }),
      this.prisma.dailyUsage.count({
        where: { usageDate: bugun, questionsAnswered: { gte: yeniLimit } },
      }),
    ]);
    return {
      yeniLimit,
      mevcutLimit: (await this.prisma.plan.findUnique({ where: { key: FREE_KEY } }))
        ?.dailyQuestionLimit ?? FREE_DAILY_LIMIT_FALLBACK,
      bugunAktifKullanici: bugunAktif,
      /** Yeni limitle BUGÜN anında duvara çarpacak kullanıcı sayısı. */
      aninaDuvaraCarpacak: etkilenen,
    };
  }
}
