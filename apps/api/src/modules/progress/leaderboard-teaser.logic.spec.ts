import { teaserLine } from './leaderboard-teaser.logic';

describe('teaserLine (Bugün lider tahtası takip cümlesi)', () => {
  it('puanı olmayana davet; tahta boşsa ilk sıra çağrısı', () => {
    expect(teaserLine(null, 0)).toContain('bomboş');
    expect(teaserLine(null, 12)).toBe('Bugün 1 doğru yap, tahtaya adını yazdır.');
  });
  it('zirve, beraberlik ve fark cümleleri', () => {
    expect(teaserLine({ rank: 1, points: 40, pointsToNext: null, nextName: null }, 9)).toContain('Zirvedesin');
    expect(teaserLine({ rank: 4, points: 20, pointsToNext: 0, nextName: 'Ayşe' }, 9)).toBe(
      'Ayşe ile berabersin — 1 doğruyla öne geç.',
    );
    expect(teaserLine({ rank: 4, points: 20, pointsToNext: 3, nextName: 'Ayşe' }, 9)).toBe(
      'Önünde Ayşe var — fark 3 doğru.',
    );
  });
  it('üstteki bilinmiyorsa (ilk 3 dışında, sıra 2+) genel cümle', () => {
    expect(teaserLine({ rank: 7, points: 5, pointsToNext: null, nextName: null }, 9)).toBe(
      'Her doğru cevap seni yukarı taşır.',
    );
  });
});
