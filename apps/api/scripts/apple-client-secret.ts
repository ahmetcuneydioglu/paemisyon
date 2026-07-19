/**
 * Apple "Sign in with Apple" client-secret JWT üretir (Supabase → Apple provider →
 * "Secret Key (for OAuth)" alanına yapıştırılır). Apple ham .p8 değil, onunla
 * ES256 imzalanmış bir JWT ister ("Secret key should be a JWT").
 *
 * .p8 içeriği bu makinede kalır; hiçbir yere gönderilmez.
 *
 * Kullanım (apps/api içinden):
 *   APPLE_TEAM_ID=XXXXXXXXXX \
 *   APPLE_KEY_ID=YYYYYYYYYY \
 *   APPLE_CLIENT_ID=com.newpaemisyon.auth.sid \
 *   APPLE_P8_PATH=/tam/yol/AuthKey_YYYYYYYYYY.p8 \
 *   npx ts-node scripts/apple-client-secret.ts
 *
 * Çıktı JWT'yi Supabase'e yapıştır. Apple bu secret'ı 6 AYDA BİR geçersiz kılar —
 * süre dolunca bu scripti tekrar çalıştırıp Supabase'deki değeri güncelle.
 */
import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

async function main() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const clientId = process.env.APPLE_CLIENT_ID?.trim(); // Services ID (bundle değil)
  const p8Path = process.env.APPLE_P8_PATH?.trim();
  const p8Inline = process.env.APPLE_P8?.trim(); // alternatif: içeriği doğrudan ver

  const missing = [
    ['APPLE_TEAM_ID', teamId],
    ['APPLE_KEY_ID', keyId],
    ['APPLE_CLIENT_ID', clientId],
  ].filter(([, v]) => !v);
  if (missing.length || (!p8Path && !p8Inline)) {
    console.error('Eksik değişken(ler):');
    missing.forEach(([k]) => console.error('  - ' + k));
    if (!p8Path && !p8Inline) console.error('  - APPLE_P8_PATH (veya APPLE_P8)');
    console.error('\nTeam ID: Apple Developer → Membership (sağ üst, 10 karakter).');
    console.error('Key ID: oluşturduğun anahtarın 10 karakterlik kimliği.');
    console.error('Client ID: Services ID (ör. com.newpaemisyon.auth.sid) — App ID DEĞİL.');
    process.exit(1);
  }

  const pkcs8 = p8Inline ?? readFileSync(p8Path as string, 'utf8');
  if (!pkcs8.includes('BEGIN PRIVATE KEY')) {
    console.error('.p8 içeriği geçersiz görünüyor (BEGIN PRIVATE KEY yok).');
    process.exit(1);
  }

  const key = await importPKCS8(pkcs8, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  const sixMonths = 180 * 24 * 60 * 60; // Apple üst sınırı ~6 ay (15777000 sn)

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId as string)
    .setIssuedAt(now)
    .setExpirationTime(now + sixMonths)
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId as string)
    .sign(key);

  const expDate = new Date((now + sixMonths) * 1000).toISOString().slice(0, 10);
  console.error(`\n✓ JWT üretildi. Geçerlilik: ${expDate} tarihine kadar (6 ayda bir yenile).`);
  console.error('Aşağıdaki değeri Supabase → Apple → "Secret Key (for OAuth)" alanına yapıştır:\n');
  // JWT'yi stdout'a tek satır yaz (kolay kopyalama).
  console.log(jwt);
}

main().catch((e) => {
  console.error('Hata:', e instanceof Error ? e.message : e);
  process.exit(1);
});
