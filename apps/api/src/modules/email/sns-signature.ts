import { createVerify } from 'node:crypto';

/**
 * Amazon SNS mesaj imzası doğrulama (SignatureVersion 1 = SHA1, 2 = SHA256).
 * Bağımlılıksız: sertifika yalnız sns.<bölge>.amazonaws.com üzerinden https ile
 * alınır ve bellekte önbelleğe alınır. Doğrulanmayan mesaj işlenmez.
 */
export type SnsMessage = {
  Type: 'Notification' | 'SubscriptionConfirmation' | 'UnsubscribeConfirmation';
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  Subject?: string;
  SubscribeURL?: string;
  Token?: string;
  UnsubscribeURL?: string;
};

const CERT_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;
const certCache = new Map<string, string>();

export function isValidCertUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && CERT_HOST.test(u.hostname) && u.pathname.endsWith('.pem');
  } catch {
    return false;
  }
}

/** İmzalanan dizge: alan adı + '\n' + değer + '\n', belirli sırayla. */
export function canonicalString(msg: SnsMessage): string {
  const fields =
    msg.Type === 'Notification'
      ? (['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'] as const)
      : ([
          'Message',
          'MessageId',
          'SubscribeURL',
          'Timestamp',
          'Token',
          'TopicArn',
          'Type',
        ] as const);
  let out = '';
  for (const f of fields) {
    const v = msg[f];
    if (v === undefined || v === null) continue;
    out += `${f}\n${v}\n`;
  }
  return out;
}

export async function fetchCert(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const cached = certCache.get(url);
  if (cached) return cached;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`SNS sertifikası alınamadı (${res.status})`);
  const pem = await res.text();
  certCache.set(url, pem);
  return pem;
}

export function verifyWithCert(msg: SnsMessage, pem: string): boolean {
  const algo = msg.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
  const verifier = createVerify(algo);
  verifier.update(canonicalString(msg), 'utf8');
  return verifier.verify(pem, msg.Signature, 'base64');
}

export async function verifySnsMessage(
  msg: SnsMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!msg?.Signature || !msg.SigningCertURL || !isValidCertUrl(msg.SigningCertURL)) return false;
  if (msg.SignatureVersion !== '1' && msg.SignatureVersion !== '2') return false;
  const pem = await fetchCert(msg.SigningCertURL, fetchImpl);
  try {
    return verifyWithCert(msg, pem);
  } catch {
    return false;
  }
}
