import { ForbiddenException } from '@nestjs/common';
import { errors } from 'jose';
import { JwtAuthGuard } from './jwt-auth.guard';

function ctx(authorization?: string) {
  const req: { headers: Record<string, string>; user?: unknown } = {
    headers: authorization ? { authorization } : {},
  };
  return { req, context: { switchToHttp: () => ({ getRequest: () => req }) } as never };
}

function guard(
  verify: () => Promise<unknown>,
  ensureUser: () => Promise<unknown> = async () => ({ id: 'u' }),
) {
  return new JwtAuthGuard({ verify } as never, { ensureUser } as never);
}

describe('JwtAuthGuard — oturum hatası ile geçici arıza ayrımı (15 Kas 2026 denetimi)', () => {
  it('geçerli token → kullanıcı yüklenir', async () => {
    const { req, context } = ctx('Bearer t');
    await expect(guard(async () => ({ sub: 'u' })).canActivate(context)).resolves.toBe(true);
    expect(req.user).toEqual({ id: 'u' });
  });

  it('başlık yok → 401', async () => {
    await expect(guard(async () => ({})).canActivate(ctx().context)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('süresi dolmuş / imzası tutmayan token → 401', async () => {
    const expired = new errors.JWTExpired('exp', { exp: 1 });
    await expect(
      guard(async () => Promise.reject(expired)).canActivate(ctx('Bearer t').context),
    ).rejects.toMatchObject({ status: 401 });
    const bad = new errors.JWSSignatureVerificationFailed();
    await expect(
      guard(async () => Promise.reject(bad)).canActivate(ctx('Bearer t').context),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('JWKS zaman aşımı / ağ hatası → 503 (kullanıcı çıkarılmaz)', async () => {
    await expect(
      guard(async () => Promise.reject(new errors.JWKSTimeout())).canActivate(
        ctx('Bearer t').context,
      ),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      guard(async () => Promise.reject(new TypeError('fetch failed'))).canActivate(
        ctx('Bearer t').context,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('token geçerli ama veritabanı/havuz hatası → 503', async () => {
    const g = guard(
      async () => ({ sub: 'u' }),
      async () => Promise.reject(new Error("Can't reach database server")),
    );
    await expect(g.canActivate(ctx('Bearer t').context)).rejects.toMatchObject({ status: 503 });
  });

  it('bilinçli HTTP hataları aynen geçer (askıya alınmış hesap 403)', async () => {
    const g = guard(
      async () => ({ sub: 'u' }),
      async () => Promise.reject(new ForbiddenException('ACCOUNT_SUSPENDED')),
    );
    await expect(g.canActivate(ctx('Bearer t').context)).rejects.toMatchObject({ status: 403 });
  });
});
