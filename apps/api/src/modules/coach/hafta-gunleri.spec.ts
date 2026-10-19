import { haftaGunleri } from './hafta-gunleri';

describe('haftaGunleri (Doc 49/13 F9-B)', () => {
  const pzt = new Date('2026-10-12T00:00:00.000Z');
  const d = (n: number) => new Date(pzt.getTime() + n * 86_400_000);
  it('Perşembe: Pzt–Çar aktif, bugün pasif, kalanlar gelecek', () => {
    expect(haftaGunleri([d(0), d(1), d(2)], d(3), pzt)).toEqual([
      'done',
      'done',
      'done',
      'today',
      'future',
      'future',
      'future',
    ]);
  });
  it('bugün aktifse done; kaçan gün missed', () => {
    expect(haftaGunleri([d(0), d(3)], d(3), pzt)).toEqual([
      'done',
      'missed',
      'missed',
      'done',
      'future',
      'future',
      'future',
    ]);
  });
  it('Pazartesi sabahı: tek today, altı future', () => {
    expect(haftaGunleri([], d(0), pzt)).toEqual([
      'today',
      'future',
      'future',
      'future',
      'future',
      'future',
      'future',
    ]);
  });
});
