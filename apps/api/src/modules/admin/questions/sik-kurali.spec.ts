import { sikKuraliHatasi } from './sik-kurali';

describe('sikKuraliHatasi (beş şık kuralı — Doc 49 A0 / T2)', () => {
  it('yeni soru: yalnız 5 şık geçer', () => {
    expect(sikKuraliHatasi(5)).toBeNull();
    expect(sikKuraliHatasi(4)).toMatch(/tam 5 şık/);
    expect(sikKuraliHatasi(2)).toMatch(/tam 5 şık/);
  });

  it("düzenleme: 5 şıklı soru 4'e indirilemez", () => {
    expect(sikKuraliHatasi(5, 5, 5)).toBeNull();
    expect(sikKuraliHatasi(4, 5, 5)).toMatch(/tam 5 şık/);
  });

  it("düzenleme: eski 4 şıklı soru 4 kalabilir ya da 5'e çıkabilir, 3'e inemez", () => {
    expect(sikKuraliHatasi(4, 5, 4)).toBeNull();
    expect(sikKuraliHatasi(5, 5, 4)).toBeNull();
    expect(sikKuraliHatasi(3, 5, 4)).toMatch(/mevcut 4 şık/);
  });
});
