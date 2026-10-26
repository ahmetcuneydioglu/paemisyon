import { rulesSummary, rulesToWhere, validateRules } from './segment-dsl';

const U = '4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

describe('segment DSL', () => {
  it('beyaz liste dışı alan ve operatör reddedilir', () => {
    expect(() => validateRules({ field: 'email', cmp: 'eq', value: 'x' })).toThrow();
    expect(() =>
      validateRules({ field: 'lastActiveDays', cmp: 'contains_any', value: [1] }),
    ).toThrow();
    expect(() =>
      validateRules({ field: 'preferredModuleId', cmp: 'eq', value: "x' OR 1=1" }),
    ).toThrow();
  });

  it('derinlik ve kural sayısı sınırlı', () => {
    const deep = {
      op: 'and',
      rules: [
        { op: 'or', rules: [{ op: 'and', rules: [{ field: 'isPremium', cmp: 'is_true' }] }] },
      ],
    };
    expect(() => validateRules(deep)).toThrow();
    const many = {
      op: 'and',
      rules: Array.from({ length: 21 }, () => ({ field: 'isPremium', cmp: 'is_true' })),
    };
    expect(() => validateRules(many)).toThrow();
  });

  it('Prisma where üretir', () => {
    const g = validateRules({
      op: 'and',
      rules: [
        { field: 'lastActiveDays', cmp: 'gt', value: '5' },
        { field: 'isPremium', cmp: 'is_false' },
        {
          op: 'or',
          rules: [
            { field: 'accuracy30d', cmp: 'lt', value: 60 },
            { field: 'weakTopicIds', cmp: 'contains_any', value: [U] },
          ],
        },
        { field: 'hasOpenExam', cmp: 'is_true' },
      ],
    });
    const w = rulesToWhere(g);
    expect(w).toEqual({
      AND: [
        { lastActiveDays: { gt: 5 } },
        { isPremium: false },
        { OR: [{ accuracy30d: { lt: 60 } }, { weakTopicIds: { hasSome: [U] } }] },
        { openExamSessionId: { not: null } },
      ],
    });
    expect(rulesSummary(g)).toContain(
      'Son aktiflik (gün) > 5 VE Premium hayır VE (30 gün doğruluk (%) < 60 VEYA Zayıf konu içerir 1 değer) VE Yarım deneme var evet',
    );
  });

  it('boş grup herkes demektir', () => {
    expect(rulesToWhere(validateRules({ op: 'and', rules: [] }))).toEqual({});
    expect(rulesSummary(validateRules({ op: 'and', rules: [] }))).toBe('Herkes');
  });
});
