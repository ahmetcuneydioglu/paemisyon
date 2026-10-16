import { CEVAP_SURESI_TAVAN_SN, calismaSaniyesi, calismaSuresiEkle } from './calisma-suresi';

describe('çalışma süresi (Doc 49 S1-D)', () => {
  it('ms → sn yuvarlanır; geçersiz 0; cevap tavanı 10 dk', () => {
    expect(calismaSaniyesi(42_400)).toBe(42);
    expect(calismaSaniyesi(null)).toBe(0);
    expect(calismaSaniyesi(-5)).toBe(0);
    expect(calismaSaniyesi(Number.NaN)).toBe(0);
    expect(calismaSaniyesi(3_600_000)).toBe(CEVAP_SURESI_TAVAN_SN);
    expect(calismaSaniyesi(3_600_000, 1800)).toBe(1800);
  });
  it('0 saniye yazmaz; hata yutulur', async () => {
    const calls: unknown[] = [];
    const prisma = {
      $executeRaw: async (...a: unknown[]) => {
        calls.push(a);
        return 1;
      },
    };
    await calismaSuresiEkle(prisma as never, 'u1', 0);
    expect(calls).toHaveLength(0);
    await calismaSuresiEkle(prisma as never, 'u1', 30);
    expect(calls).toHaveLength(1);
    const bozuk = {
      $executeRaw: async () => {
        throw new Error('pooler');
      },
    };
    await expect(calismaSuresiEkle(bozuk as never, 'u1', 30)).resolves.toBeUndefined();
  });
});
