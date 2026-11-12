/**
 * Kişi adı kuralları — tek yer (13 Kas 2026, yayın öncesi Faz 1).
 *
 * Neden: ad yalnız `user_metadata.display_name`'den okunuyordu. Google adı `full_name`/`name`,
 * Apple `full_name` (girişten SONRA, istemci yazar) taşır; bu yüzden 700 Google kullanıcısının
 * 667'si, 389 Apple kullanıcısının 371'i e-posta önekiyle görünüyordu (256'sı Apple gizli
 * adresinin anlamsız öneki). Kullanıcı kararı (13 Kas 2026): başkalarının gördüğü yerlerde
 * "Ad S." (ad + soyad baş harfi), kişinin kendi satırında ve selamlamada kendi adı.
 */

const RELAY_DOMAIN = 'privaterelay.appleid.com';
export const ANONIM_AD = 'Aday';

export function emailLocalPart(email: string): string {
  return email.includes('@') ? email.split('@')[0] : email;
}

export function isRelayEmail(email: string | null | undefined): boolean {
  return (email ?? '').toLowerCase().endsWith(`@${RELAY_DOMAIN}`);
}

/** Ad hiç girilmemiş, yerine e-postadan türemiş mi (ya da boş/anonim)? Yalnız bunlar kendiliğinden düzeltilir. */
export function isPlaceholderName(displayName: string | null | undefined, email: string): boolean {
  const name = (displayName ?? '').trim();
  if (!name || name === ANONIM_AD) return true;
  return name === emailLocalPart(email).slice(0, 128);
}

/** Supabase metadata'sından ad: display_name → full_name → name (en az 2 karakter). */
export function nameFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  for (const key of ['display_name', 'full_name', 'name']) {
    const raw = m[key];
    if (typeof raw === 'string') {
      const v = raw.trim().replace(/\s+/g, ' ');
      if (v.length >= 2) return v.slice(0, 128);
    }
  }
  return null;
}

/** İlk kayıt adı: metadata adı; yoksa Apple gizli adresinde "Aday", diğerlerinde e-posta öneki. */
export function initialDisplayName(metadata: unknown, email: string): string {
  const fromMeta = nameFromMetadata(metadata);
  if (fromMeta) return fromMeta;
  if (!email.includes('@') || isRelayEmail(email)) return ANONIM_AD;
  return emailLocalPart(email).slice(0, 128);
}

/** Başkalarına görünen ad: "Ahmet Can Demir" → "Ahmet D."; tek kelime olduğu gibi; boş → "Aday". */
export function publicName(displayName: string | null | undefined): string {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ANONIM_AD;
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0].toLocaleUpperCase('tr-TR')}.`;
}

/** Kişinin kendi satırı tam adıyla, diğerleri "Ad S." ile. */
export function nameFor(displayName: string | null | undefined, isMe: boolean): string {
  return isMe ? (displayName ?? '').trim() || ANONIM_AD : publicName(displayName);
}
