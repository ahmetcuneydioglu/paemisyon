import { mixQuota, pickMix, type MixPools } from './session-mix.logic';

/** Deterministik "shuffle": sırayı korur — testler öngörülebilir. */
const identity = <T>(a: T[]): T[] => a;

const q = (id: string, topicId: string) => ({ id, topicId });

describe('mixQuota (Doc 25 §5 reçetesi)', () => {
  it('normal: ~%25 yanlış + %40 zayıf + kalan yeni; toplam = count', () => {
    expect(mixQuota(20, false)).toEqual({ wrong: 5, weak: 8, fresh: 7 });
    expect(mixQuota(10, false)).toEqual({ wrong: 3, weak: 4, fresh: 3 });
  });
  it('sınav modunda tersine döner: yanlış ağırlıklı, yeni azalır (Doc 24 §1)', () => {
    expect(mixQuota(20, true)).toEqual({ wrong: 10, weak: 6, fresh: 4 });
  });
  it('küçük seansta toplam korunur', () => {
    const s = mixQuota(5, false);
    expect(s.wrong + s.weak + s.fresh).toBe(5);
  });
});

describe('pickMix', () => {
  const pools: MixPools = {
    pool: [
      q('w1', 'tA'), q('w2', 'tA'), // yanlışlar
      q('z1', 'tZ'), q('z2', 'tZ'), q('z3', 'tZ'), // zayıf konu
      q('n1', 'tN'), q('n2', 'tN'), // yeni konu
      q('h1', 'tH'), q('h2', 'tH'), // çok çalışılmış konu
    ],
    wrongIds: new Set(['w1', 'w2']),
    weakTopicIds: new Set(['tZ']),
    heavyTopicIds: new Set(['tH']),
  };

  it('dilim öncelikleri: yanlış → zayıf → yeni; heavy son çaredir', () => {
    const out = pickMix(6, pools, { wrong: 2, weak: 2, fresh: 2 }, identity);
    expect(out.map((x) => x.id)).toEqual(['w1', 'w2', 'z1', 'z2', 'n1', 'n2']);
  });

  it('yanlış havuzu boşsa kota zayıfa devredilir — seans yine dolar', () => {
    const noWrong: MixPools = { ...pools, wrongIds: new Set() };
    const out = pickMix(6, noWrong, { wrong: 2, weak: 2, fresh: 2 }, identity);
    expect(out).toHaveLength(6);
    expect(out.filter((x) => x.topicId === 'tZ').length).toBeGreaterThanOrEqual(3);
  });

  it('havuz küçükse tekrarsız doldurur, count aşılmaz', () => {
    const tiny: MixPools = {
      pool: [q('a', 't1'), q('b', 't2')],
      wrongIds: new Set(['a']),
      weakTopicIds: new Set(),
      heavyTopicIds: new Set(),
    };
    const out = pickMix(10, tiny, { wrong: 3, weak: 4, fresh: 3 }, identity);
    expect(out.map((x) => x.id).sort()).toEqual(['a', 'b']);
  });

  it('her şey heavy ise bile seans dolar (son çare dilimi)', () => {
    const allHeavy: MixPools = {
      pool: [q('h1', 'tH'), q('h2', 'tH'), q('h3', 'tH')],
      wrongIds: new Set(),
      weakTopicIds: new Set(),
      heavyTopicIds: new Set(['tH']),
    };
    const out = pickMix(3, allHeavy, { wrong: 1, weak: 1, fresh: 1 }, identity);
    expect(out).toHaveLength(3);
  });
});
