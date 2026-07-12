/**
 * Premium'un GERÇEKTEN aktif olup olmadığı (Doc 15). `isPremium` bayrağı
 * tek başına yeterli değil — abonelik süresi (`validUntil`) geçmişse premium kapalıdır.
 * Tek doğruluk kaynağı budur; hem auth (req.user.isPremium) hem quiz limiti kullanır.
 */
export function isEntitlementActive(
  entitlement: { isPremium: boolean; validUntil: Date | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!entitlement?.isPremium) return false;
  if (entitlement.validUntil == null) return true; // süresiz (örn. manuel grant)
  return entitlement.validUntil.getTime() > now.getTime();
}
