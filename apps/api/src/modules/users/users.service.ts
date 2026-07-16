import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserSyncService } from '../auth/user-sync.service';

/**
 * Kullanıcı işlemleri: onboarding tamamlama + KVKK hesap silme (Doc 11, Doc 13 S7).
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userSync: UserSyncService,
  ) {}

  /** Onboarding (Doc 24 Gün 0 — 3 soru): sınav + tarih + günlük hedef; idempotent. */
  async completeOnboarding(
    userId: string,
    dto: { moduleId: string; targetExamDate?: string | null; dailyGoal?: number },
  ) {
    const module = await this.prisma.examType.findFirst({
      where: { id: dto.moduleId, isActive: true },
    });
    if (!module) throw new BadRequestException('Geçersiz modül.');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredModuleId: dto.moduleId,
        onboardingCompletedAt: new Date(), // tekrar çağrılırsa tarih tazelenir, sorun değil
        dailyGoal: dto.dailyGoal,
        targetExamDate:
          dto.targetExamDate === undefined
            ? undefined
            : dto.targetExamDate === null
              ? null
              : new Date(`${dto.targetExamDate}T00:00:00.000Z`),
      },
      select: { preferredModuleId: true, onboardingCompletedAt: true },
    });
    return {
      onboardingCompleted: true,
      preferredModuleId: user.preferredModuleId,
      preferredModuleName: module.name,
    };
  }

  /**
   * KVKK hesap silme (Doc 9 §5, App Store zorunluluğu).
   * - PII ANONİMLEŞTİRİLİR (e-posta/isim/avatar), satır silinmez → istatistik
   *   bütünlüğü ve abonelik/denetim kayıtları bozulmaz.
   * - Supabase Auth kullanıcısı SİLİNİR (service_role varsa) → tekrar giriş imkânsız.
   * - status=deleted → guard bir daha içeri almaz (anahtar yoksa bile güvenli).
   */
  async deleteAccount(user: AuthenticatedUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@deleted.paemisyon.local`,
        displayName: 'Silinmiş Kullanıcı',
        avatarUrl: null,
        status: 'deleted',
        deletedAt: new Date(),
        preferredModuleId: null,
      },
    });
    // Cihaz-dışı erişim kalmasın: entitlement kapat.
    await this.prisma.entitlement.updateMany({
      where: { userId: user.id },
      data: { isPremium: false, validUntil: null, sourceSubscriptionId: null },
    });

    this.userSync.invalidate(user.id); // guard cache — silme anında yansısın

    // Supabase Auth tarafındaki kimliği sil (varsa service_role anahtarı).
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let authDeleted = false;
    if (supabaseUrl && serviceKey) {
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        authDeleted = res.ok;
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error('[kvkk] Supabase auth silme başarısız:', res.status, await res.text());
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[kvkk] Supabase auth silme hatası:', e);
      }
    }
    // authDeleted=false olsa bile status=deleted → guard erişimi keser (aşağıda).
    return { deleted: true, authDeleted };
  }
}
