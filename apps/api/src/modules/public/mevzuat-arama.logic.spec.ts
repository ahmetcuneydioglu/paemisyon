import { kelimeGovdesi, onekSorgusu } from './mevzuat-arama.logic';

describe('mevzuat araması önek sorgusu', () => {
  it('Türkçe ekleri tolere eden gövdeler üretir', () => {
    expect(onekSorgusu('kimlik sorma')).toBe('kimli:* & sor:*');
    expect(onekSorgusu('zor kullanma')).toBe('zor:* & kullan:*');
    expect(onekSorgusu('Gözaltı')).toBe('gozalti:*');
    expect(onekSorgusu('yakalamak')).toBe('yakala:*');
  });
  it('kısa ve anlamsız kelimeleri atar, enjeksiyona kapalıdır', () => {
    expect(kelimeGovdesi('ve')).toBeNull();
    expect(onekSorgusu("x' | !")).toBeNull();
    expect(onekSorgusu('arama & (silme)')).toBe('ara:* & sil:*');
  });
  it('kısa kökte eki korur ("alma" gövdesi "al" olmaz)', () => {
    expect(kelimeGovdesi('alma')).toBe('alma');
  });
});
