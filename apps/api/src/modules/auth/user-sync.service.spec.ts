import type { JWTPayload } from 'jose';
import {
  displayNameFromClaims,
  emailVerifiedFromClaims,
  UserSyncService,
} from './user-sync.service';

describe('displayNameFromClaims', () => {
  it('kayıt metadata adını kırparak kullanır', () => {
    expect(
      displayNameFromClaims(
        { user_metadata: { display_name: '  Ahmet Can  ' } } as JWTPayload,
        'ahmet@example.com',
      ),
    ).toBe('Ahmet Can');
  });

  it('geçerli metadata yoksa e-posta yerel kısmına düşer', () => {
    expect(displayNameFromClaims({} as JWTPayload, 'aday@example.com')).toBe('aday');
  });
});

describe('emailVerifiedFromClaims', () => {
  it('Supabase user_metadata doğrulama bayrağını okur', () => {
    expect(emailVerifiedFromClaims({ user_metadata: { email_verified: true } } as JWTPayload)).toBe(
      true,
    );
  });

  it('doğrulama kanıtı olmayan tokenı doğrulanmış saymaz', () => {
    expect(emailVerifiedFromClaims({} as JWTPayload)).toBe(false);
  });
});

describe('UserSyncService.ensureUser', () => {
  it('ilk isteği atomik upsert ve çakışmaya dayanıklı rol atamasıyla hazırlar', async () => {
    const role = { id: 'role-user', key: 'user' };
    const tx = {
      user: {
        upsert: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'aday@example.com',
          status: 'active',
        }),
      },
      userRole: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      role: { findUnique: jest.fn().mockResolvedValue(role) },
      entitlement: {
        upsert: jest.fn().mockResolvedValue({ isPremium: false, validUntil: null }),
      },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
    };
    const service = new UserSyncService(prisma as never);

    const result = await service.ensureUser({
      sub: 'user-1',
      email: 'aday@example.com',
      email_verified: true,
      user_metadata: { display_name: 'Aday Kullanıcı' },
    } as JWTPayload);

    expect(result).toEqual({
      id: 'user-1',
      email: 'aday@example.com',
      roles: ['user'],
      isPremium: false,
    });
    expect(tx.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        create: expect.objectContaining({ displayName: 'Aday Kullanıcı' }),
      }),
    );
    expect(tx.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', roleId: 'role-user' }],
      skipDuplicates: true,
    });
    expect(tx.entitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('aynı kullanıcı için eşzamanlı istekleri tek veritabanı okumasında birleştirir', async () => {
    const existing = {
      id: 'user-1',
      email: 'aday@example.com',
      emailVerifiedAt: new Date(),
      status: 'active',
      roles: [{ role: { key: 'user' } }],
      entitlement: { isPremium: false, validUntil: null },
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve(existing), 5)),
          ),
        update: jest.fn(),
      },
    };
    const service = new UserSyncService(prisma as never);
    const claims = {
      sub: 'user-1',
      email: 'aday@example.com',
      email_verified: true,
    } as JWTPayload;

    const [first, second, third] = await Promise.all([
      service.ensureUser(claims),
      service.ensureUser(claims),
      service.ensureUser(claims),
    ]);

    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });
});
