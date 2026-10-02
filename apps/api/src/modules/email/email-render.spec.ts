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
