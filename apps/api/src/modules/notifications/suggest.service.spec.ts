import { suggestionCheck, suggestionVariables } from './suggest.service';

describe('AI öneri değişken kapısı', () => {
  it('modele yalnız kampanyada dolan değişkenleri verir; deneme adı yalnız denemeye bağlıyken', () => {
    const vars = suggestionVariables(false);
    expect(vars).toEqual(expect.arrayContaining(['ad', 'streak', 'sinava_kalan_gun']));
    expect(vars).not.toContain('deneme_adi');
    expect(vars).not.toContain('zayif_konu');
    expect(vars).not.toContain('link');
    expect(suggestionVariables(true)).toContain('deneme_adi');
  });

  it('kampanyada boş gidecek ya da tanımsız değişkenli öneriyi engeller (19 Kas 2026 canlı örneği)', () => {
    const live = suggestionCheck(
      '{{zayif_konu}} için bu hafta ölçüm',
      '{{deneme_adi}} içinde {{zayif_konu}} soruları da var.',
      false,
    );
    expect(live.blocked).toBe(true);
    expect(live.warnings.map((w) => w.code)).toEqual(['no_source', 'no_source']);

    expect(suggestionCheck('Deneme hazır', '{{uydurma}} seni bekliyor', true).blocked).toBe(true);
  });

  it('dolan değişkenli temiz öneriyi geçirir', () => {
    expect(
      suggestionCheck('Haftalık deneme açıldı', '{{ad}}, {{deneme_adi}} yayında.', true),
    ).toEqual({ warnings: [], blocked: false });
    expect(suggestionCheck('Seri sürüyor', '{{streak}} gündür turdasın.', false).blocked).toBe(
      false,
    );
  });
});
