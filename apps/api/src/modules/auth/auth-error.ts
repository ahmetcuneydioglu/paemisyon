import { errors } from 'jose';

/**
 * Token doğrulama hatası OTURUMUN geçersizliği mi, yoksa geçici bir altyapı arızası mı?
 *
 * İstemci 401'de oturumu tazeler, yine 401 gelirse çıkış yapar. Altyapı arızası (JWKS'e
 * erişilemedi, zaman aşımı) 401'e sarılırsa sağlam oturumlar topluca düşer (Fable denetimi,
 * 15 Kas 2026). Bu yüzden yalnız token'ın KENDİSİNİ reddeden jose hataları "geçersiz" sayılır:
 * süresi dolmuş, imzası tutmayan, claim'i (issuer/audience) uymayan, çözülemeyen token, ya da
 * JWKS'te eşleşen anahtar yok (anahtar döndürülmüş, token eski).
 */
export function isInvalidTokenError(err: unknown): boolean {
  if (!(err instanceof errors.JOSEError)) return false;
  if (err instanceof errors.JWKSTimeout) return false;
  // createRemoteJWKSet, JWKS yanıtı 200 değilse ya da gövde bozuksa genel JOSEError fırlatır.
  if (err.code === 'ERR_JOSE_GENERIC' && /JSON Web Key Set/i.test(err.message)) return false;
  if (err instanceof errors.JWKSInvalid) return false;
  return true;
}
