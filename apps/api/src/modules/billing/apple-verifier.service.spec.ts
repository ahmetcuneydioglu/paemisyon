import { AppleVerifier } from './apple-verifier.service';

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jws(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: 'ES256' }) {
  return `${b64url(header)}.${b64url(payload)}.sig`;
}

function makeVerifier(trustLocal: boolean) {
  const prev = process.env.BILLING_TRUST_LOCAL_STOREKIT;
  process.env.BILLING_TRUST_LOCAL_STOREKIT = trustLocal ? 'true' : 'false';
  const v = new AppleVerifier();
  process.env.BILLING_TRUST_LOCAL_STOREKIT = prev;
  return v;
}

describe('AppleVerifier.decode', () => {
  const v = makeVerifier(true);

  it('geçerli JWS header+payload çözer', () => {
    const { payload } = v.decode(jws({ productId: 'x' }));
    expect(payload.productId).toBe('x');
  });

  it('3 parçası olmayan JWS reddedilir', () => {
    expect(() => v.decode('a.b')).toThrow();
  });
});

describe('AppleVerifier.verify — yerel StoreKit yolu', () => {
  const local = { environment: 'LocalTesting', productId: 'com.paemisyon.premium.monthly', expiresDate: 1800000000000 };

  it('trustLocal AÇIK → yerel işlem kabul + alanlar normalize', async () => {
    const v = makeVerifier(true);
    const tx = await v.verify(jws(local));
    expect(tx.productId).toBe('com.paemisyon.premium.monthly');
    expect(tx.environment).toBe('LocalTesting');
    expect(tx.expiresDate).toBeInstanceOf(Date);
  });

  it('trustLocal KAPALI → yerel işlem reddedilir', async () => {
    const v = makeVerifier(false);
    await expect(v.verify(jws(local))).rejects.toThrow();
  });
});

describe('AppleVerifier.verify — production yolu güvenliği', () => {
  it('Production ortamı + sertifika zinciri yok → reddedilir (forge koruması)', async () => {
    const v = makeVerifier(true); // trustLocal önemsiz; env Production
    await expect(
      v.verify(jws({ environment: 'Production', productId: 'x' }, { alg: 'ES256' })),
    ).rejects.toThrow();
  });

  it('Production + boş x5c → reddedilir', async () => {
    const v = makeVerifier(true);
    await expect(
      v.verify(jws({ environment: 'Production', productId: 'x' }, { alg: 'ES256', x5c: [] })),
    ).rejects.toThrow();
  });
});
