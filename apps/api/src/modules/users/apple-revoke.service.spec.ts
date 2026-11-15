import { SignJWT, exportPKCS8, generateKeyPair, jwtVerify, type KeyLike } from 'jose';
import { AppleRevokeService } from './apple-revoke.service';

type Call = { url: string; body: URLSearchParams };

async function idToken(sub: string) {
  const { privateKey } = await generateKeyPair('ES256');
  return new SignJWT({}).setProtectedHeader({ alg: 'ES256' }).setSubject(sub).sign(privateKey);
}

function fakeFetch(responses: Record<string, () => Promise<Response>>, calls: Call[]) {
  return (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: new URLSearchParams(String(init?.body ?? '')) });
    const path = new URL(url).pathname;
    return responses[path]();
  }) as unknown as typeof fetch;
}

const json =
  (b: unknown, status = 200) =>
  async () =>
    new Response(JSON.stringify(b), { status });

describe('AppleRevokeService', () => {
  const env = { ...process.env };
  let publicKey: KeyLike;

  beforeEach(async () => {
    const pair = await generateKeyPair('ES256', { extractable: true });
    publicKey = pair.publicKey;
    // .p8 Railway'e tek satır yazılır: satır sonları \n kaçışıyla.
    process.env.APPLE_SIWA_PRIVATE_KEY = (await exportPKCS8(pair.privateKey)).replace(/\n/g, '\\n');
    process.env.APPLE_SIWA_KEY_ID = 'KEY123';
    delete process.env.APPLE_SIWA_TEAM_ID;
    delete process.env.APPLE_SIWA_CLIENT_ID;
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it('anahtar yoksa ağa çıkmadan not_configured döner', async () => {
    delete process.env.APPLE_SIWA_KEY_ID;
    const calls: Call[] = [];
    const svc = new AppleRevokeService();
    svc.fetchImpl = fakeFetch({}, calls);
    await expect(svc.revoke('code', 'sub-1')).resolves.toBe('not_configured');
    expect(calls).toHaveLength(0);
  });

  it('kodu jetona çevirir ve yenileme jetonunu iptal eder; istemci sırrı Apple biçiminde', async () => {
    const calls: Call[] = [];
    const svc = new AppleRevokeService();
    svc.fetchImpl = fakeFetch(
      {
        '/auth/token': json({
          refresh_token: 'rt-1',
          access_token: 'at-1',
          id_token: await idToken('sub-1'),
        }),
        '/auth/revoke': async () => new Response('', { status: 200 }),
      },
      calls,
    );
    await expect(svc.revoke('code-1', 'sub-1')).resolves.toBe('revoked');

    expect(calls.map((c) => c.url)).toEqual([
      'https://appleid.apple.com/auth/token',
      'https://appleid.apple.com/auth/revoke',
    ]);
    expect(calls[0].body.get('code')).toBe('code-1');
    expect(calls[0].body.get('grant_type')).toBe('authorization_code');
    expect(calls[0].body.get('client_id')).toBe('com.paemisyon.paemisyon');
    expect(calls[1].body.get('token')).toBe('rt-1');
    expect(calls[1].body.get('token_type_hint')).toBe('refresh_token');

    const { payload, protectedHeader } = await jwtVerify(
      calls[0].body.get('client_secret')!,
      publicKey,
      {
        issuer: '3U4QPG9Q82',
        audience: 'https://appleid.apple.com',
        subject: 'com.paemisyon.paemisyon',
      },
    );
    expect(protectedHeader).toMatchObject({ alg: 'ES256', kid: 'KEY123' });
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(300);
  });

  it('kod başka bir Apple kimliğine aitse iptal etmez', async () => {
    const calls: Call[] = [];
    const svc = new AppleRevokeService();
    svc.fetchImpl = fakeFetch(
      { '/auth/token': json({ refresh_token: 'rt', id_token: await idToken('baska') }) },
      calls,
    );
    await expect(svc.revoke('code', 'sub-1')).resolves.toBe('skipped');
    expect(calls).toHaveLength(1);
  });

  it('Apple kodu reddederse failed döner, hata fırlatmaz', async () => {
    const svc = new AppleRevokeService();
    svc.fetchImpl = fakeFetch({ '/auth/token': json({ error: 'invalid_grant' }, 400) }, []);
    await expect(svc.revoke('eski-kod', 'sub-1')).resolves.toBe('failed');
  });

  it('ağ hatasında failed döner, hata fırlatmaz', async () => {
    const svc = new AppleRevokeService();
    svc.fetchImpl = (async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    await expect(svc.revoke('code', null)).resolves.toBe('failed');
  });
});
