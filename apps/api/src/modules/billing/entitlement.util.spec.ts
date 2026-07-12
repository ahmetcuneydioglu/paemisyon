import { isEntitlementActive } from './entitlement.util';

describe('isEntitlementActive', () => {
  const now = new Date('2026-07-11T12:00:00Z');

  it('entitlement yoksa false', () => {
    expect(isEntitlementActive(null, now)).toBe(false);
    expect(isEntitlementActive(undefined, now)).toBe(false);
  });

  it('isPremium=false ise false', () => {
    expect(isEntitlementActive({ isPremium: false, validUntil: null }, now)).toBe(false);
  });

  it('premium + süresiz (validUntil=null) ise true', () => {
    expect(isEntitlementActive({ isPremium: true, validUntil: null }, now)).toBe(true);
  });

  it('premium + gelecekte biten süre ise true', () => {
    const future = new Date('2026-08-11T12:00:00Z');
    expect(isEntitlementActive({ isPremium: true, validUntil: future }, now)).toBe(true);
  });

  it('premium ama süresi geçmiş ise false (expiry-aware)', () => {
    const past = new Date('2026-07-10T12:00:00Z');
    expect(isEntitlementActive({ isPremium: true, validUntil: past }, now)).toBe(false);
  });

  it('tam sınırda (validUntil == now) false — süre dolmuş sayılır', () => {
    expect(isEntitlementActive({ isPremium: true, validUntil: now }, now)).toBe(false);
  });
});
