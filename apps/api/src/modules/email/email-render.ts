import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Kampanya gövdesi: Markdown → temizlenmiş HTML → tablo düzenli posta şablonu.
 * Alıcıya özel alanlar şablonda yer tutucu kalır ve gönderim anında doldurulur:
 *   %%UNSUBSCRIBE_URL%%  tek tık çıkış (API), %%PREFERENCES_URL%% tercih sayfası (web),
 *   %%AD%%  kişinin adı (yoksa boş). Markdown içinde {{ad}} yazılabilir.
 */
export type RenderInput = {
  subject: string;
  previewText?: string | null;
  bodyMarkdown: string;
  siteUrl: string;
  fromName: string;
};

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'p',
    'br',
    'strong',
    'em',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'hr',
    'img',
    'code',
  ],
  allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'] },
  allowedSchemes: ['https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener' }),
  },
};

export function markdownToHtml(md: string): string {
  const raw = marked.parse(md, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(raw, SANITIZE);
}

/** Düz metin alternatifi (HTML'den): bağlantılar "metin (adres)" olur. */
export function htmlToText(html: string): string {
  const withLinks = html.replace(
    /<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi,
    (_m, href: string, text: string) =>
      text.trim() && text.trim() !== href ? `${text} (${href})` : href,
  );
  return sanitizeHtml(
    withLinks.replace(/<\/(p|h[1-6]|li|blockquote|tr)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n'),
    {
      allowedTags: [],
      allowedAttributes: {},
    },
  )
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline stilli, tablo düzenli, koyu moda dayanıklı şablon (Gmail/Outlook/Apple Mail). */
export function renderCampaignHtml(input: RenderInput): string {
  const body = markdownToHtml(input.bodyMarkdown.replace(/\{\{\s*ad\s*\}\}/g, '%%AD%%'));
  const preview = input.previewText ? esc(input.previewText) : '';
  const styledBody = body
    .replace(/<h1>/g, '<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0b1f3a;">')
    .replace(
      /<h2>/g,
      '<h2 style="margin:24px 0 12px;font-size:20px;line-height:1.3;color:#0b1f3a;">',
    )
    .replace(
      /<h3>/g,
      '<h3 style="margin:20px 0 8px;font-size:17px;line-height:1.3;color:#0b1f3a;">',
    )
    .replace(/<p>/g, '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#222222;">')
    .replace(/<a /g, '<a style="color:#0b5fff;text-decoration:underline;" ')
    .replace(
      /<(ul|ol)>/g,
      '<$1 style="margin:0 0 14px;padding-left:22px;font-size:16px;line-height:1.6;color:#222222;">',
    )
    .replace(
      /<blockquote>/g,
      '<blockquote style="margin:0 0 14px;padding:10px 14px;border-left:4px solid #d9dee7;background:#f5f7fb;color:#333333;">',
    )
    .replace(/<hr\s*\/?>/g, '<hr style="border:0;border-top:1px solid #e2e6ee;margin:20px 0;">')
    .replace(
      /<img /g,
      '<img style="max-width:100%;height:auto;border:0;display:block;margin:0 0 14px;" ',
    );

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="tr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(input.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin:0; padding:0; background:#eef1f6; -webkit-text-size-adjust:100%; }
  @media (prefers-color-scheme: dark) {
    body, .bg { background:#0f1218 !important; }
    .card { background:#181c25 !important; }
    .card h1, .card h2, .card h3 { color:#f2f4f8 !important; }
    .card p, .card li, .card blockquote { color:#d5d9e2 !important; }
    .foot, .foot a { color:#9aa3b2 !important; }
  }
  @media only screen and (max-width:620px) { .card { padding:20px !important; } }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#eef1f6;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="bg" style="background:#eef1f6;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:0 8px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#0b1f3a;">${esc(input.fromName)}</td></tr>
    <tr><td class="card" style="background:#ffffff;border-radius:12px;padding:32px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      ${styledBody}
    </td></tr>
    <tr><td class="foot" style="padding:18px 8px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
      Bu e-postayı Paemisyon'a kayıtlı olduğun için aldın.
      Bu tür e-postaları artık almak istemiyorsan <a href="%%PREFERENCES_URL%%" style="color:#6b7280;text-decoration:underline;">tercihlerini güncelleyebilir</a>
      ya da <a href="%%UNSUBSCRIBE_URL%%" style="color:#6b7280;text-decoration:underline;">abonelikten çıkabilirsin</a>.<br>
      <a href="${esc(input.siteUrl)}" style="color:#6b7280;text-decoration:underline;">${esc(input.siteUrl.replace(/^https?:\/\//, ''))}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

export type RecipientFields = { unsubscribeUrl: string; preferencesUrl: string; ad: string };

export function fillRecipient(template: string, f: RecipientFields): string {
  return template
    .replace(/%%UNSUBSCRIBE_URL%%/g, f.unsubscribeUrl)
    .replace(/%%PREFERENCES_URL%%/g, f.preferencesUrl)
    .replace(/%%AD%%/g, esc(f.ad));
}
