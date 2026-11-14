import { ConflictException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { GooglePlayVerifier } from './google-play-verifier.service';

type Ent = {
  userId: string;
  isPremium: boolean;
  validUntil: Date | null;
  sourceSubscriptionId: string | null;
};
type Sub = {
  id: string;
  userId: string;
  status: string;
  currentPeriodEnd: Date | null;
  originalTransactionId: string;
};

function setup(state: { ent?: Ent | null; subs?: Sub[] } = {}) {
  const ents = new Map<string, Ent>(state.ent ? [[state.ent.userId, state.ent]] : []);
  const db = {
    get ent() {
      return [...ents.values()].at(-1) ?? null;
    },
    entOf: (userId: string) => ents.get(userId) ?? null,
    subs: state.subs ?? [],
  };
  const prisma = {
    entitlement: {
      findUnique: jest.fn(
        async ({ where }: { where: { userId: string } }) => ents.get(where.userId) ?? null,
      ),
      upsert: jest.fn(
        async ({
          where,
          update,
          create,
        }: {
          where: { userId: string };
          update: Partial<Ent>;
          create: Ent;
        }) => {
          const cur = ents.get(where.userId);
          const next = cur ? { ...cur, ...update } : create;
          ents.delete(where.userId);
          ents.set(where.userId, next);
          return next;
        },
      ),
    },
    subscription: {
      findMany: jest.fn(async ({ where }: { where: { userId: string; status: string } }) =>
        db.subs.filter((s) => s.userId === where.userId && s.status === where.status),
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { originalTransactionId: string } }) =>
          db.subs.find((s) => s.originalTransactionId === where.originalTransactionId) ?? null,
      ),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<Sub> }) => {
        const s = db.subs.find((x) => x.id === where.id)!;
        Object.assign(s, data);
        return s;
      }),
      create: jest.fn(async ({ data }: { data: Omit<Sub, 'id'> }) => {
        const s = { id: `sub-${db.subs.length + 1}`, ...data };
        db.subs.push(s);
        return s;
      }),
    },
    plan: {
      findFirst: jest.fn(async () => ({ id: 'plan-m', key: 'premium_monthly', period: 'monthly' })),
    },
  };
  const userSync = { invalidate: jest.fn() };
  const apple = { verify: jest.fn(), verifyNotification: jest.fn() };
  const google = { verifyProduct: jest.fn(), verifySubscription: jest.fn() };
  const svc = new BillingService(
    prisma as never,
    apple as never,
    google as never,
    userSync as never,
  );
  return { svc, db, prisma, apple, google, userSync };
}

const NOW = new Date('2026-11-15T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe('BillingService.recomputeEntitlement (bulgu 6: tek yuvalı hak)', () => {
  it('süresiz manuel premium, daha kısa aboneliğe kısalmaz', async () => {
    const { svc, db } = setup({
      ent: { userId: 'u', isPremium: true, validUntil: null, sourceSubscriptionId: null },
      subs: [
        {
          id: 's1',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: days(20),
          originalTransactionId: 't1',
        },
      ],
    });
    await svc.recomputeEntitlement('u', NOW);
    expect(db.ent).toMatchObject({ isPremium: true, validUntil: null, sourceSubscriptionId: null });
  });

  it('ömürlük + aylık: aylığın bitişi premium’u kapatmaz', async () => {
    const { svc, db } = setup({
      ent: { userId: 'u', isPremium: true, validUntil: days(-1), sourceSubscriptionId: 's-aylik' },
      subs: [
        {
          id: 's-aylik',
          userId: 'u',
          status: 'expired',
          currentPeriodEnd: days(-1),
          originalTransactionId: 't1',
        },
        {
          id: 's-omur',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: null,
          originalTransactionId: 't2',
        },
      ],
    });
    await svc.recomputeEntitlement('u', NOW);
    expect(db.ent).toMatchObject({
      isPremium: true,
      validUntil: null,
      sourceSubscriptionId: 's-omur',
    });
  });

  it('en geç biten abonelik kazanır; süresi geçmiş "active" satır sayılmaz', async () => {
    const { svc, db } = setup({
      subs: [
        {
          id: 'a',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: days(5),
          originalTransactionId: 't1',
        },
        {
          id: 'b',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: days(40),
          originalTransactionId: 't2',
        },
        {
          id: 'c',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: days(-3),
          originalTransactionId: 't3',
        },
      ],
    });
    await svc.recomputeEntitlement('u', NOW);
    expect(db.ent).toMatchObject({
      isPremium: true,
      validUntil: days(40),
      sourceSubscriptionId: 'b',
    });
  });

  it('hiç geçerli kaynak yok → premium kapalı; süresi dolmuş manuel hak geri gelmez', async () => {
    const { svc, db, userSync } = setup({
      ent: { userId: 'u', isPremium: true, validUntil: days(-2), sourceSubscriptionId: null },
    });
    await svc.recomputeEntitlement('u', NOW);
    expect(db.ent).toMatchObject({ isPremium: false, sourceSubscriptionId: null });
    expect(userSync.invalidate).toHaveBeenCalledWith('u');
  });
});

describe('BillingService.verifyApple — taşıma ve manuel hak', () => {
  it('abonelik başka hesaba taşınınca eski hesap kalan kaynaklarıyla yeniden hesaplanır', async () => {
    const { svc, db, apple } = setup({
      subs: [
        {
          id: 's1',
          userId: 'A',
          status: 'active',
          currentPeriodEnd: days(10),
          originalTransactionId: 'tx1',
        },
      ],
    });
    apple.verify.mockResolvedValue({
      productId: 'p',
      originalTransactionId: 'tx1',
      expiresDate: days(10),
      revocationDate: null,
      environment: 'Sandbox',
    });
    jest.useFakeTimers().setSystemTime(NOW);
    try {
      const r = await svc.verifyApple('B', 'jws');
      expect(r.isPremium).toBe(true);
      expect(db.subs[0].userId).toBe('B');
      expect(db.entOf('B')).toMatchObject({ isPremium: true, sourceSubscriptionId: 's1' });
      expect(db.entOf('A')).toMatchObject({ isPremium: false, sourceSubscriptionId: null });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('BillingService.handleGoogleNotification — bekleyen ödeme', () => {
  it('Play beklemede (409) → 200 döner, abonelik değişmez', async () => {
    const { svc, db, google } = setup({
      subs: [
        {
          id: 's1',
          userId: 'u',
          status: 'active',
          currentPeriodEnd: days(3),
          originalTransactionId: 'tok',
        },
      ],
    });
    google.verifySubscription.mockRejectedValue(new ConflictException('beklemede'));
    const data = Buffer.from(
      JSON.stringify({ subscriptionNotification: { purchaseToken: 'tok', subscriptionId: 'p' } }),
    ).toString('base64');
    await expect(svc.handleGoogleNotification(data)).resolves.toEqual({ ok: true });
    expect(db.subs[0].status).toBe('active');
  });
});

describe('GooglePlayVerifier — bekleyen ve ödenmemiş satın alma (bulgu 4)', () => {
  const realFetch = global.fetch;
  function verifierReturning(body: Record<string, unknown>, status = 200) {
    const v = new GooglePlayVerifier();
    (v as unknown as { account: unknown }).account = { client_email: 'x', private_key: 'x' };
    (v as unknown as { token: unknown }).token = { value: 't', expiresAt: Date.now() + 3_600_000 };
    global.fetch = jest.fn(async () => ({
      ok: status < 400,
      status,
      json: async () => body,
      text: async () => '',
    })) as never;
    return v;
  }
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('abonelik PENDING → 409 (premium açılmaz, istemci işlemi kapatmaz)', async () => {
    const v = verifierReturning({
      subscriptionState: 'SUBSCRIPTION_STATE_PENDING',
      lineItems: [{ productId: 'p' }],
    });
    await expect(v.verifySubscription('tok')).rejects.toMatchObject({ status: 409 });
  });

  it('abonelikte bitiş tarihi yok → süresiz sayılmaz', async () => {
    const v = verifierReturning({
      subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD',
      lineItems: [{ productId: 'p' }],
    });
    const out = await v.verifySubscription('tok');
    expect(out.expiresDate).toBeInstanceOf(Date);
    expect(out.expiresDate!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('ürün purchaseState=2 (beklemede) → 409; 0 → geçerli; 1 → iade', async () => {
    await expect(
      verifierReturning({ purchaseState: 2 }).verifyProduct('life', 'tok'),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await verifierReturning({ purchaseState: 0 }).verifyProduct('life', 'tok')).revocationDate,
    ).toBeNull();
    expect(
      (await verifierReturning({ purchaseState: 1 }).verifyProduct('life', 'tok')).revocationDate,
    ).toBeInstanceOf(Date);
  });

  it('Google 5xx/403 → 503 (401 değil: istemci kullanıcıyı çıkarmasın)', async () => {
    await expect(verifierReturning({}, 503).verifySubscription('tok')).rejects.toMatchObject({
      status: 503,
    });
    await expect(verifierReturning({}, 403).verifySubscription('tok')).rejects.toMatchObject({
      status: 503,
    });
  });
});
