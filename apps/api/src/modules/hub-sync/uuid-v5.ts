import { createHash } from 'crypto';

/**
 * RFC 4122 sürüm 5 UUID (SHA-1). PostgreSQL uuid-ossp `uuid_generate_v5(ns, name)` ile bayt bayt aynı:
 * sha1(ns_bytes || utf8(name)), sürüm ve varyant bitleri ayarlanır. Seçenek kimliği sözleşmesi
 * (merkez G2 planı §3.2): id = v5(<merkez sürüm UUID'si>, 'A'..'E').
 */
export function uuidV5(namespace: string, name: string): string {
  const ns = namespace.replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(ns)) throw new Error(`Geçersiz ad alanı UUID: ${namespace}`);
  const hash = createHash('sha1')
    .update(Buffer.from(ns, 'hex'))
    .update(Buffer.from(name, 'utf8'))
    .digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // sürüm 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 varyantı
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function hubOptionId(hubVersionId: string, optionKey: string): string {
  return uuidV5(hubVersionId, optionKey);
}
