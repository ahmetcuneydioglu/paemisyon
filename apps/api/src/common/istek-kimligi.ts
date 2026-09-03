/**
 * Rate-limit kovası: isteği KİM yaptı?
 *
 * Eskiden throttler varsayılanı `req.ip` idi. Railway'in edge proxy'si arkasında
 * bu değer gerçek kullanıcının adresi değil, iç proxy adresidir: 300 istek/dk
 * limiti kullanıcı başına değil, PAYLAŞILAN kovalarda sayılıyordu. Kalabalık bir
 * canlı denemede (50 kişi ≈ 300 istek/dk) rastgele kişilerin 429 yemesi demekti.
 *
 * Artık kimlik doğrulanmış istek KULLANICIYA göre sayılır; misafir isteği IP'ye
 * göre. Buradaki `sub` DOĞRULANMAZ (imza denetimi zaten JwtAuthGuard'da yapılır)
 * — yalnız kova adı üretir. Uydurma `sub` ile limitten kaçmayı, app.module'deki
 * ikinci (IP tabanlı, geniş) throttler kapatır.
 */
export function istekKimligi(req: { headers?: Record<string, unknown>; ip?: string }): string {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const sub = jwtSub(auth.slice(7));
    if (sub) return `u:${sub}`;
  }
  return `ip:${req.ip ?? 'bilinmiyor'}`;
}

function jwtSub(token: string): string | null {
  if (token.length > 8192) return null; // şişirilmiş başlıkla CPU yakma
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
    };
    return typeof json.sub === 'string' && json.sub.length > 0 && json.sub.length <= 128
      ? json.sub
      : null;
  } catch {
    return null; // bozuk token → IP'ye düş
  }
}
