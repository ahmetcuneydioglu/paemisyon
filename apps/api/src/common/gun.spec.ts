import { gunAnahtari, gunBaslangici, gunMetni, haftaBasi, haftaBaslangici } from './gun';

/** TR saatiyle bir an (UTC+3 sabit). */
const tr = (s: string) => new Date(`${s}+03:00`);

describe('uygulama günü — TR 04.00 (Doc 48 D2)', () => {
  it('03.59 TR hâlâ önceki gün, 04.00 TR yeni gün', () => {
    expect(gunMetni(tr('2026-10-14T03:59:59'))).toBe('2026-10-13');
    expect(gunMetni(tr('2026-10-14T04:00:00'))).toBe('2026-10-14');
  });

  it('gece nöbeti: 01.00 ve 03.30 TR önceki günün emeği', () => {
    expect(gunMetni(tr('2026-10-14T01:00:00'))).toBe('2026-10-13');
    expect(gunMetni(tr('2026-10-14T03:30:00'))).toBe('2026-10-13');
  });

  it('gece yarısı (00.00 TR) gün DEĞİŞTİRMEZ; eski UTC sınırı (03.00 TR) da', () => {
    expect(gunMetni(tr('2026-10-13T23:59:00'))).toBe('2026-10-13');
    expect(gunMetni(tr('2026-10-14T00:00:00'))).toBe('2026-10-13');
    expect(gunMetni(tr('2026-10-14T03:00:00'))).toBe('2026-10-13');
  });

  it('gün anahtarı UTC gece yarısı Date (@db.Date kolonlarıyla uyumlu)', () => {
    expect(gunAnahtari(tr('2026-10-14T10:00:00')).toISOString()).toBe('2026-10-14T00:00:00.000Z');
  });

  it('gün başlangıcı TR 04.00 anı', () => {
    expect(gunBaslangici(tr('2026-10-14T10:00:00')).toISOString()).toBe('2026-10-14T01:00:00.000Z');
    expect(gunBaslangici(tr('2026-10-14T02:00:00')).toISOString()).toBe('2026-10-13T01:00:00.000Z');
  });

  it('hafta Pazartesi TR 04.00 başlar; Pazartesi 03.30 hâlâ önceki hafta', () => {
    // 2026-10-12 Pazartesi
    expect(haftaBasi(tr('2026-10-14T10:00:00')).toISOString().slice(0, 10)).toBe('2026-10-12');
    expect(haftaBasi(tr('2026-10-12T03:30:00')).toISOString().slice(0, 10)).toBe('2026-10-05');
    expect(haftaBasi(tr('2026-10-12T04:30:00')).toISOString().slice(0, 10)).toBe('2026-10-12');
    expect(haftaBaslangici(tr('2026-10-18T23:00:00')).toISOString()).toBe(
      '2026-10-12T01:00:00.000Z',
    );
  });
});
