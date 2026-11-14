import { execFileSync } from 'node:child_process';
import { createPrivateKey, X509Certificate } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CompactSign } from 'jose';
import { AppleVerifier } from './apple-verifier.service';

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function unsigned(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'ES256' },
) {
  return `${b64url(header)}.${b64url(payload)}.sig`;
}

function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    prev[k] = process.env[k];
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  }
  try {
    return fn();
  } finally {
    for (const k of Object.keys(prev)) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
}

function makeVerifier(trustLocal: boolean, nodeEnv = 'test') {
  return withEnv(
    {
      BILLING_TRUST_LOCAL_STOREKIT: trustLocal ? 'true' : 'false',
      NODE_ENV: nodeEnv,
      BILLING_BUNDLE_ID: undefined,
    },
    () => new AppleVerifier(),
  );
}

describe('AppleVerifier.decode', () => {
  const v = makeVerifier(true);

  it('geçerli JWS header+payload çözer', () => {
    const { payload } = v.decode(unsigned({ productId: 'x' }));
    expect(payload.productId).toBe('x');
  });

  it('3 parçası olmayan JWS reddedilir', () => {
    expect(() => v.decode('a.b')).toThrow();
  });
});

describe('AppleVerifier.verify — yerel StoreKit yolu', () => {
  const local = {
    environment: 'LocalTesting',
    productId: 'com.paemisyon.premium.monthly',
    expiresDate: 1800000000000,
  };

  it('trustLocal AÇIK → yerel işlem kabul + alanlar normalize', async () => {
    const tx = await makeVerifier(true).verify(unsigned(local));
    expect(tx.productId).toBe('com.paemisyon.premium.monthly');
    expect(tx.environment).toBe('LocalTesting');
    expect(tx.expiresDate).toBeInstanceOf(Date);
  });

  it('trustLocal KAPALI → yerel işlem reddedilir (422, 401 değil)', async () => {
    await expect(makeVerifier(false).verify(unsigned(local))).rejects.toMatchObject({
      status: 422,
    });
  });

  it('production’da trustLocal açık olsa bile imzasız yerel işlem reddedilir', async () => {
    await expect(makeVerifier(true, 'production').verify(unsigned(local))).rejects.toMatchObject({
      status: 422,
    });
  });
});

/**
 * Gerçek zincir doğrulaması: openssl ile test kökü → Apple OID'li ara → Apple OID'li leaf.
 * Doğrulayıcının güvendiği kök test köküyle değiştirilir; her şey Apple'ınkiyle aynı yoldan geçer.
 */
describe('AppleVerifier.verify — imzalı zincir', () => {
  let dir: string;
  const pem = (name: string) => readFileSync(join(dir, name), 'utf8');
  const der64 = (name: string) => new X509Certificate(pem(name)).raw.toString('base64');
  let rootDer: Buffer;

  const ssl = (...args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: 'pipe' });
  const key = (name: string) =>
    ssl('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', name);
  const selfSigned = (k: string, cn: string, out: string, ext: string) =>
    ssl(
      'req',
      '-x509',
      '-new',
      '-key',
      k,
      '-sha256',
      '-days',
      '30',
      '-subj',
      `/CN=${cn}`,
      '-config',
      'ext.cnf',
      '-extensions',
      ext,
      '-out',
      out,
    );
  const issued = (
    k: string,
    cn: string,
    caCert: string,
    caKey: string,
    out: string,
    ext: string,
  ) => {
    ssl('req', '-new', '-key', k, '-subj', `/CN=${cn}`, '-config', 'ext.cnf', '-out', `${out}.csr`);
    ssl(
      'x509',
      '-req',
      '-in',
      `${out}.csr`,
      '-CA',
      caCert,
      '-CAkey',
      caKey,
      '-CAcreateserial',
      '-days',
      '30',
      '-sha256',
      '-extfile',
      'ext.cnf',
      '-extensions',
      ext,
      '-out',
      out,
    );
  };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'apple-chain-'));
    writeFileSync(
      join(dir, 'ext.cnf'),
      [
        '[req]',
        'distinguished_name=dn',
        '[dn]',
        '[v3_ca]',
        'basicConstraints=critical,CA:TRUE',
        'keyUsage=critical,keyCertSign,cRLSign',
        '[v3_int]',
        'basicConstraints=critical,CA:TRUE',
        'keyUsage=critical,keyCertSign,cRLSign',
        '1.2.840.113635.100.6.2.1=ASN1:NULL',
        '[v3_leaf]',
        'basicConstraints=critical,CA:FALSE',
        'keyUsage=critical,digitalSignature',
        '1.2.840.113635.100.6.11.1=ASN1:NULL',
        '',
      ].join('\n'),
    );
    key('root.key');
    selfSigned('root.key', 'Test Apple Root', 'root.pem', 'v3_ca');
    key('int.key');
    issued('int.key', 'Test WWDR', 'root.pem', 'root.key', 'int.pem', 'v3_int');
    key('leaf.key');
    issued('leaf.key', 'Test Receipt Signing', 'int.pem', 'int.key', 'leaf.pem', 'v3_leaf');
    // Saldırgan: kendi anahtarıyla, adı gerçek ara sertifikayla AYNI sahte bir CA ve onun leaf'i.
    key('evil-ca.key');
    selfSigned('evil-ca.key', 'Test WWDR', 'evil-ca.pem', 'v3_int');
    key('evil-leaf.key');
    issued(
      'evil-leaf.key',
      'Test Receipt Signing',
      'evil-ca.pem',
      'evil-ca.key',
      'evil-leaf.pem',
      'v3_leaf',
    );
    rootDer = new X509Certificate(pem('root.pem')).raw;
    jest.spyOn(AppleVerifier, 'rootCertificates').mockReturnValue([rootDer]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  });

  const tx = (over: Record<string, unknown> = {}) => ({
    transactionId: '2000000000000001',
    originalTransactionId: '2000000000000001',
    bundleId: 'com.paemisyon.paemisyon',
    productId: 'com.paemisyon.premium.monthly',
    type: 'Auto-Renewable Subscription',
    environment: 'Sandbox',
    signedDate: Date.now(),
    purchaseDate: Date.now(),
    expiresDate: Date.now() + 30 * 86_400_000,
    appAccountToken: '11111111-2222-3333-4444-555555555555',
    ...over,
  });

  async function sign(payload: Record<string, unknown>, leafKey: string, chain: string[]) {
    return new CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
      .setProtectedHeader({ alg: 'ES256', x5c: chain.map(der64) })
      .sign(createPrivateKey(pem(leafKey)));
  }

  it('geçerli zincir + doğru bundle → kabul, alanlar normalize', async () => {
    const jws = await sign(tx(), 'leaf.key', ['leaf.pem', 'int.pem', 'root.pem']);
    const out = await makeVerifier(false).verify(jws);
    expect(out.productId).toBe('com.paemisyon.premium.monthly');
    expect(out.environment).toBe('Sandbox');
    expect(out.expiresDate).toBeInstanceOf(Date);
    expect(out.appAccountToken).toBe('11111111-2222-3333-4444-555555555555');
  });

  it('BULGU 1: issuer adı ara sertifikayla aynı, kendi anahtarıyla imzalı sahte leaf → reddedilir', async () => {
    // Eski checkIssued denetimi bu zinciri geçiriyordu (yalnız ad karşılaştırır).
    expect(
      new X509Certificate(pem('evil-leaf.pem')).checkIssued(new X509Certificate(pem('int.pem'))),
    ).toBe(true);
    const jws = await sign(
      tx({ type: 'Non-Consumable', expiresDate: undefined }),
      'evil-leaf.key',
      ['evil-leaf.pem', 'int.pem', 'root.pem'],
    );
    await expect(makeVerifier(false).verify(jws)).rejects.toMatchObject({ status: 422 });
  });

  it('JWS başka anahtarla imzalanmış (leaf sertifikası gerçek) → reddedilir', async () => {
    const jws = await sign(tx(), 'evil-leaf.key', ['leaf.pem', 'int.pem', 'root.pem']);
    await expect(makeVerifier(false).verify(jws)).rejects.toMatchObject({ status: 422 });
  });

  it('başka uygulamanın işlemi (bundleId) → reddedilir; env boşken de denetim açık', async () => {
    const jws = await sign(tx({ bundleId: 'com.baska.uygulama' }), 'leaf.key', [
      'leaf.pem',
      'int.pem',
      'root.pem',
    ]);
    await expect(makeVerifier(false).verify(jws)).rejects.toMatchObject({ status: 422 });
  });

  it('Apple leaf OID’i olmayan sertifika (ör. ara sertifika leaf yerine) → reddedilir', async () => {
    const jws = await sign(tx(), 'int.key', ['int.pem', 'root.pem', 'root.pem']);
    await expect(makeVerifier(false).verify(jws)).rejects.toMatchObject({ status: 422 });
  });

  it('Production ortamlı imzalı işlem → Production doğrulayıcısından geçer', async () => {
    const jws = await sign(tx({ environment: 'Production' }), 'leaf.key', [
      'leaf.pem',
      'int.pem',
      'root.pem',
    ]);
    const out = await makeVerifier(false).verify(jws);
    expect(out.environment).toBe('Production');
  });

  it('bilinmeyen ortam değeri → reddedilir', async () => {
    const jws = await sign(tx({ environment: 'Uydurma' }), 'leaf.key', [
      'leaf.pem',
      'int.pem',
      'root.pem',
    ]);
    await expect(makeVerifier(false).verify(jws)).rejects.toMatchObject({ status: 422 });
  });

  it('bildirim zarfı: geçerli imza → çözülür; sahte imza → 422', async () => {
    const body = {
      notificationType: 'DID_RENEW',
      notificationUUID: '00000000-0000-0000-0000-000000000001',
      version: '2.0',
      signedDate: Date.now(),
      data: {
        bundleId: 'com.paemisyon.paemisyon',
        environment: 'Sandbox',
        signedTransactionInfo: 'x.y.z',
      },
    };
    const good = await sign(body, 'leaf.key', ['leaf.pem', 'int.pem', 'root.pem']);
    const note = await makeVerifier(false).verifyNotification(good);
    expect(note.notificationType).toBe('DID_RENEW');
    expect(note.signedTransactionInfo).toBe('x.y.z');

    const forged = await sign(body, 'evil-leaf.key', ['evil-leaf.pem', 'int.pem', 'root.pem']);
    await expect(makeVerifier(false).verifyNotification(forged)).rejects.toMatchObject({
      status: 422,
    });
  });
});
