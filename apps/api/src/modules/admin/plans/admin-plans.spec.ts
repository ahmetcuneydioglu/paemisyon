import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminPlansService } from './admin-plans.service';

/**
 * Plan korumaları (7 Eyl 2026). Fiyat ve ücretsiz katmanın sınırı ürünün
 * ticari çekirdeği; yanlış bir tık ürünü sessizce bedavaya çevirebilir.
 */

function mock(plan: {
  key: string;
  dailyQuestionLimit?: number | null;
  isActive?: boolean;
} | null) {
  const yazilan: unknown[] = [];
  const prisma = {
    plan: {
      findUnique: async () =>
        plan
          ? {
              id: 'p1',
              name: 'Plan',
              price: null,
              dailyQuestionLimit: plan.dailyQuestionLimit ?? null,
              isActive: plan.isActive ?? true,
              ...plan,
            }
          : null,
      update: async (args: unknown) => {
        yazilan.push(args);
        return { id: 'p1', price: null, ...(plan ?? {}) };
      },
      findMany: async () => [],
    },
    dailyUsage: { count: async () => 0 },
  };
  const audit = { log: async () => undefined };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { servis: new AdminPlansService(prisma as any, audit as any), yazilan };
}

const aktor = { id: 'u1', roles: ['admin'] } as never;

describe('AdminPlansService.update', () => {
  it('ücretsiz planın limiti güncellenir', async () => {
    const { servis, yazilan } = mock({ key: 'free', dailyQuestionLimit: 30 });
    await servis.update(aktor, 'p1', { dailyQuestionLimit: 50 });
    expect(yazilan).toHaveLength(1);
  });

  it('ücretsiz plan KAPATILAMAZ — limit o satırda yaşıyor', async () => {
    // Kapanırsa sunucu emniyet ağı değerine düşer ve panelden yönetilemez.
    const { servis } = mock({ key: 'free', dailyQuestionLimit: 30 });
    await expect(
      servis.update(aktor, 'p1', { isActive: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ücretsiz planın limiti boş bırakılamaz — boş = sınırsız', async () => {
    // Ücretsiz katmanı kazara sınırsız yapmak ürünü sessizce bedavaya çevirir.
    const { servis } = mock({ key: 'free', dailyQuestionLimit: 30 });
    await expect(
      servis.update(aktor, 'p1', { dailyQuestionLimit: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ücretli plana sayısal limit verilemez — premium sınırsızdır', async () => {
    const { servis } = mock({ key: 'quarterly', dailyQuestionLimit: null });
    await expect(
      servis.update(aktor, 'p1', { dailyQuestionLimit: 20 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ücretli plan kapatılabilir', async () => {
    const { servis, yazilan } = mock({ key: 'monthly', dailyQuestionLimit: null });
    await servis.update(aktor, 'p1', { isActive: false });
    expect(yazilan).toHaveLength(1);
  });

  it('ücretli planın limiti null olarak bırakılabilir', async () => {
    const { servis, yazilan } = mock({ key: 'yearly', dailyQuestionLimit: null });
    await servis.update(aktor, 'p1', { dailyQuestionLimit: null, price: 999 });
    expect(yazilan).toHaveLength(1);
  });

  it('olmayan plan 404', async () => {
    const { servis } = mock(null);
    await expect(servis.update(aktor, 'yok', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
