import { emailBodyWithCta, fillTemplate, templateVariables, templateWarnings } from './template';
import { markdownToHtml } from '../email/email-render';
import { resolveDeepLink, webPathFromRoute } from './deep-links';

describe('şablon', () => {
  it('değişkenleri doldurur: {{ad}}, {{ad|Aday}}, eski {ad}; bilinmeyen kalır', () => {
    expect(fillTemplate('{{ad}}, {{deneme_adi}} hazır', { ad: 'Ahmet', deneme_adi: 'HD 12' })).toBe(
      'Ahmet, HD 12 hazır',
    );
    expect(fillTemplate('{{ad|Dostum}}!', {})).toBe('Dostum!');
    expect(fillTemplate('{{ad}}!', {})).toBe('Aday!');
    expect(fillTemplate('Merhaba {ad}', { ad: 'Ayşe' })).toBe('Merhaba Ayşe');
    expect(fillTemplate('{{bilinmeyen}}', {})).toBe('{{bilinmeyen}}');
    expect(templateVariables('{{ad}} {{streak}} {ad}')).toEqual(['ad', 'streak']);
  });

  it('uyarılar: uzunluk, emoji, jenerik ifade, bilinmeyen değişken', () => {
    const w = templateWarnings('Seni özledik 🔥', 'x'.repeat(151) + ' {{foo}}');
    const codes = w.map((x) => x.code);
    expect(codes).toEqual(
      expect.arrayContaining(['body_long', 'emoji', 'forbidden', 'unknown_variable']),
    );
    expect(templateWarnings('Günün sorusu hazır', 'Dün %70 doğruluk.')).toEqual([]);
  });
});

describe('derin bağlantı kayıt defteri', () => {
  const sid = '4f1a6b2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';
  it('rota ve web yolu üretir', () => {
    expect(resolveDeepLink({ target: 'exam_result', params: { sessionId: sid } })).toEqual({
      route: `deneme-sonuc/${sid}`,
      webPath: `/sonuc/${sid}`,
      minAppVersion: '2.0.0',
    });
    expect(resolveDeepLink({ target: 'daily_question' }).route).toBe('daily-quiz');
    expect(resolveDeepLink({ target: 'exams' }).webPath).toBe('/denemeler');
    expect(resolveDeepLink({ target: 'exam', params: { examId: sid } }).webPath).toBe(
      `/denemeler/${sid}/baslamadan-once`,
    );
    expect(resolveDeepLink(null).webPath).toBe('/bugun');
  });
  it('uygulama güncellemesi: sürüm kapısı parametredeki mağaza sürümüdür', () => {
    expect(resolveDeepLink({ target: 'app_update', params: { version: '2.0.0' } })).toEqual({
      route: 'store',
      webPath: '/',
      minAppVersion: '2.0.0',
    });
    expect(
      resolveDeepLink({ target: 'app_update', params: { version: ' 2.1.3 ' } }).minAppVersion,
    ).toBe('2.1.3');
    // Sürümsüz ya da bozuk sürüm: hangi uygulamanın eski olduğu bilinemez, reddedilir.
    expect(() => resolveDeepLink({ target: 'app_update' })).toThrow();
    expect(() => resolveDeepLink({ target: 'app_update', params: { version: '2.1' } })).toThrow();
    expect(webPathFromRoute('store')).toBe('/');
  });
  it('bozuk parametreyi reddeder', () => {
    expect(() => resolveDeepLink({ target: 'exam_result', params: { sessionId: 'x' } })).toThrow();
  });
  it('eski rota dizgesini web yoluna çevirir (apps/web bildirimRotasi ile aynı)', () => {
    expect(webPathFromRoute(`deneme-sonuc/${sid}`)).toBe(`/sonuc/${sid}`);
    expect(webPathFromRoute('leaderboard')).toBe('/liderlik');
    expect(webPathFromRoute(`/denemeler/${sid}`)).toBe(`/denemeler/${sid}/baslamadan-once`);
    expect(webPathFromRoute(`/denemeler/${sid}/sorular`)).toBe(`/denemeler/${sid}/sorular`);
    expect(webPathFromRoute('//evil.com')).toBe('/bugun');
  });
});

describe('e-posta eylem düğmesi', () => {
  const url = 'https://paemisyon.com/denemeler/x/baslamadan-once';
  it('gövde aynı adrese bağlanıyorsa düğme eklenmez (çift bağlantı yok)', () => {
    const body = `Merhaba,\n\n[Denemeyi aç](${url})`;
    expect(emailBodyWithCta(body, 'Denemeyi gör', url)).toBe(body);
  });
  it('bağlantısız gövdeye düğme bloğu eklenir ve buton olarak işlenir', () => {
    const md = emailBodyWithCta('Yeni deneme yayında.', 'Denemeyi gör', url);
    expect(md).toContain(`:::buton [Denemeyi gör](${url})`);
    expect(markdownToHtml(md)).not.toContain(':::');
  });
  it('adres yoksa gövde değişmez', () => {
    expect(emailBodyWithCta('Metin', 'X', null)).toBe('Metin');
  });
});
