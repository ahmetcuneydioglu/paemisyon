import { fillRecipient, htmlToText, markdownToHtml, renderCampaignHtml } from './email-render';
import { canonicalString, isValidCertUrl } from './sns-signature';
import { maskEmail } from './email-contacts.service';

describe('e-posta şablonu', () => {
  it('markdown temizlenir: betik ve http: bağlantı düşer, https kalır', () => {
    const html = markdownToHtml(
      'Merhaba **{{ad}}**\n\n<script>alert(1)</script>\n\n[git](https://paemisyon.com) [kötü](javascript:alert(1))',
    );
    expect(html).toContain('<strong>');
    expect(html).not.toContain('<script');
    expect(html).toContain('href="https://paemisyon.com"');
    expect(html).not.toContain('javascript:');
  });

  it('şablon alıcı alanlarını doldurur ve çıkış bağlantısı taşır', () => {
    const t = renderCampaignHtml({
      subject: 'Yeniden yayındayız',
      previewText: 'Kısa özet',
      bodyMarkdown: 'Selam {{ad}}',
      siteUrl: 'https://paemisyon.com',
      fromName: 'Paemisyon',
    });
    expect(t).toContain('%%UNSUBSCRIBE_URL%%');
    const html = fillRecipient(t, {
      unsubscribeUrl: 'https://api/u/t1',
      preferencesUrl: 'https://web/p/t1',
      ad: 'Ayşe <b>',
    });
    expect(html).toContain('href="https://api/u/t1"');
    expect(html).toContain('Selam Ayşe &lt;b&gt;');
    expect(html).not.toContain('%%');
    expect(html).toContain('color-scheme');
  });

  it('düz metin alternatifi bağlantı adresini korur', () => {
    const text = htmlToText('<p>Merhaba</p><p><a href="https://x.com/a">Uygulamayı indir</a></p>');
    expect(text).toBe('Merhaba\nUygulamayı indir (https://x.com/a)');
  });

  it('adres maskelenir', () => {
    expect(maskEmail('ahmet@gmail.com')).toBe('a***@gmail.com');
  });
});

describe('SNS imza', () => {
  it('sertifika adresi yalnız sns.<bölge>.amazonaws.com https pem', () => {
    expect(
      isValidCertUrl('https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-abc.pem'),
    ).toBe(true);
    expect(isValidCertUrl('https://sns.eu-central-1.amazonaws.com.evil.com/x.pem')).toBe(false);
    expect(isValidCertUrl('http://sns.eu-central-1.amazonaws.com/x.pem')).toBe(false);
  });

  it('kanonik dizge alan sırası ve boş Subject atlanır', () => {
    const s = canonicalString({
      Type: 'Notification',
      MessageId: 'm',
      TopicArn: 't',
      Message: 'msg',
      Timestamp: 'ts',
      SignatureVersion: '1',
      Signature: '',
      SigningCertURL: '',
    });
    expect(s).toBe('Message\nmsg\nMessageId\nm\nTimestamp\nts\nTopicArn\nt\nType\nNotification\n');
  });
});

describe('özel bloklar', () => {
  it('kartlar, buton ve not blokları tablo HTML üretir; içerik temizlenir', () => {
    const html = markdownToHtml(
      'Giriş\n\n:::kartlar\nSINAV | Komiser **Yardımcılığı**\n8 ders · Mevzuat\n---\nSINAV | Misyon Koruma\n8 ders\n:::\n\n:::buton [App Store](https://apps.apple.com/x) [Play](https://play.google.com/y)\n:::\n\n:::not\nEski hesabın <script>x</script> aktarılmadı.\n:::\n\nSon',
    );
    expect(html).toContain('<p>Giriş</p>');
    expect(html).toContain('Komiser <strong>Yardımcılığı</strong>');
    expect(html).toContain('Misyon Koruma');
    expect((html.match(/<table/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(html).toContain('href="https://apps.apple.com/x"');
    expect(html).toContain('href="https://play.google.com/y"');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('BLOKYERTUTUCU');
    expect(html).toContain('<p>Son</p>');
  });
});

describe('mağaza rozetleri', () => {
  it(':::magazalar App Store ve Google Play görsellerini bağlantıyla üretir', () => {
    const html = markdownToHtml('A\n\n:::magazalar\n:::\n\nB');
    expect(html).toContain('apps.apple.com');
    expect(html).toContain('play.google.com');
    expect(html).toContain('img/appStore.png');
    expect(html).not.toContain('magazalar');
  });
});

describe('düğme stili', () => {
  it('buton bağlantısına genel <a> stili binmez (metin beyaz kalır)', () => {
    const html = renderCampaignHtml({
      subject: 's',
      previewText: null,
      bodyMarkdown: ":::buton [Web'de aç](https://www.paemisyon.com)\n:::",
      siteUrl: 'https://www.paemisyon.com',
      fromName: 'P',
    });
    const btn = html.match(
      /<a [^>]*href="https:\/\/www\.paemisyon\.com"[^>]*>Web(&#39;|')de aç<\/a>/,
    );
    expect(btn).not.toBeNull();
    expect((btn![0].match(/style=/g) ?? []).length).toBe(1);
    expect(btn![0]).toContain('color:#ffffff');
  });
});
