import { articleKeyNumber, hubKeyToArticleNo, toHubArticleKey } from './article-key';

describe('madde anahtarı köprüsü', () => {
  it('PAEMİSYON articleNo → merkez anahtarı (legislation_article_key ile aynı)', () => {
    expect(toHubArticleKey('16')).toBe('16');
    expect(toHubArticleKey('4/A')).toBe('4/a');
    expect(toHubArticleKey('Ek 7')).toBe('ek 7');
    expect(toHubArticleKey('Geçici 1')).toBe('geçici 1');
    expect(toHubArticleKey('EK GEÇİCİ 2')).toBe('ek geçici 2');
    expect(toHubArticleKey('007')).toBe('7');
    expect(toHubArticleKey('P1-1')).toBeNull();
    expect(toHubArticleKey('')).toBeNull();
  });
  it('merkez anahtarı → PAEMİSYON biçimi', () => {
    expect(hubKeyToArticleNo('16')).toBe('16');
    expect(hubKeyToArticleNo('4/a')).toBe('4/A');
    expect(hubKeyToArticleNo('ek 7')).toBe('Ek 7');
    expect(hubKeyToArticleNo('geçici 1')).toBe('Geçici 1');
    expect(hubKeyToArticleNo('ek geçici 2')).toBe('Ek Geçici 2');
  });
  it('gidiş-dönüş kararlıdır', () => {
    for (const k of ['16', '4/a', 'ek 7', 'geçici 1', 'ek geçici 2'])
      expect(toHubArticleKey(hubKeyToArticleNo(k))).toBe(k);
  });
  it('madde aralığı için sayısal çekirdek', () => {
    expect(articleKeyNumber('ek 7')).toBe(7);
    expect(articleKeyNumber('84')).toBe(84);
    expect(articleKeyNumber(null)).toBeNull();
  });
});
