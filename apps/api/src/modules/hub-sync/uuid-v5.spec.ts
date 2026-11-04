import { hubOptionId, uuidV5 } from './uuid-v5';

describe('uuidV5 (uuid-ossp uuid_generate_v5 ile aynı)', () => {
  it('RFC 4122 örnek vektörü: DNS ad alanı + www.example.com', () => {
    expect(uuidV5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'www.example.com')).toBe(
      '2ed6657d-e927-568b-95e1-2665a8aea6a2',
    );
  });
  it("seçenek kimliği merkez sürüm UUID'si ve A..E anahtarıyla belirlenir; rastgele değildir", () => {
    const a = hubOptionId('980ad8a5-63e6-4930-ac3a-dd8db3fad582', 'A');
    expect(a).toBe(hubOptionId('980ad8a5-63e6-4930-ac3a-dd8db3fad582', 'A'));
    expect(a).not.toBe(hubOptionId('980ad8a5-63e6-4930-ac3a-dd8db3fad582', 'B'));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('geçersiz ad alanını reddeder', () => {
    expect(() => uuidV5('abc', 'A')).toThrow();
  });
});
