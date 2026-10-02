import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { EMAIL_CONFIG } from './email.config';

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

const BRAND = {
  navy: '#173f71',
  navyDark: '#052c5c',
  green: '#60b500',
  orange: '#de8822',
  ink: '#1f2937',
  soft: '#6b7280',
  bg: '#f7f7f7',
  border: '#e8e8e8',
};
const FONT = "-apple-system,Segoe UI,Roboto,'Open Sans',Helvetica,Arial,sans-serif";

/** Satır içi markdown (kalın, bağlantı) → temiz HTML; blok öğeleri yok. */
function inline(md: string): string {
  const raw = marked.parseInline(md, { async: false, gfm: true }) as string;
  return sanitizeHtml(raw, { ...SANITIZE, allowedTags: ['strong', 'em', 'a', 'code', 'br'] });
}

/**
 * Özel bloklar (Brevo düzenine karşılık; tablo düzenli, posta istemcisi güvenli):
 *   :::kartlar            iki sütunlu kartlar; kartlar `---` ile ayrılır, ilk satır `ETİKET | Başlık`
 *   :::buton [Metin](url) tam genişlik düğme (birden çok satır olabilir)
 *   :::not                vurgulu kutu
 *   :::
 */
function renderCards(body: string): string {
  const cards = body
    .split(/\n---\n/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [first, ...rest] = c.split('\n');
      const m = first.match(/^(.*?)\s*\|\s*(.*)$/);
      const label = m ? m[1].trim() : '';
      const title = m ? m[2].trim() : first.trim();
      return { label, title, text: rest.join('\n').trim() };
    });
  const cell = (k: { label: string; title: string; text: string } | null) =>
    k
      ? `<td width="50%" valign="top" style="padding:6px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};border-radius:10px;"><tr><td style="padding:16px;font-family:${FONT};">` +
        (k.label
          ? `<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.green};margin-bottom:6px;">${inline(k.label)}</div>`
          : '') +
        `<div style="font-size:17px;font-weight:700;color:${BRAND.navy};line-height:1.3;margin-bottom:6px;">${inline(k.title)}</div>` +
        (k.text
          ? `<div style="font-size:13px;line-height:1.5;color:${BRAND.soft};">${inline(k.text).replace(/\n/g, '<br>')}</div>`
          : '') +
        `</td></tr></table></td>`
      : '<td width="50%"></td>';
  let rows = '';
  for (let i = 0; i < cards.length; i += 2)
    rows += `<tr>${cell(cards[i])}${cell(cards[i + 1] ?? null)}</tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px -6px 14px;"><tbody>${rows}</tbody></table>`;
}

function renderButtons(body: string): string {
  const links = [...body.matchAll(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g)];
  if (!links.length) return '';
  return links
    .map(
      (l, i) =>
        `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:${i ? 8 : 4}px 0 ${i === links.length - 1 ? 18 : 0}px;"><tr><td align="center" bgcolor="${i === 0 ? BRAND.navy : '#ffffff'}" style="border-radius:8px;border:2px solid ${BRAND.navy};"><a href="${l[2]}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:700;color:${i === 0 ? '#ffffff' : BRAND.navy};text-decoration:none;">${inline(l[1])}</a></td></tr></table>`,
    )
    .join('');
}

/** :::magazalar — App Store / Google Play rozetleri (web'deki PNG'ler). */
function renderStores(): string {
  const b = EMAIL_CONFIG.brand;
  const badge = (x: { url: string; img: string; w: number; h: number }, alt: string) =>
    `<td style="padding:4px 10px 4px 0;"><a href="${x.url}" target="_blank" rel="noopener"><img src="${x.img}" width="${x.w}" height="${x.h}" alt="${alt}" style="display:block;border:0;width:${x.w}px;height:${x.h}px;"></a></td>`;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 18px;"><tr>${badge(b.appStore, "App Store'dan indir")}${badge(b.playStore, "Google Play'den indir")}</tr></table>`;
}

function renderNote(body: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 14px;"><tr><td style="padding:12px 16px;background:#fff8e6;border-left:4px solid ${BRAND.orange};border-radius:6px;font-family:${FONT};font-size:15px;line-height:1.55;color:${BRAND.ink};">${inline(body.trim()).replace(/\n/g, '<br>')}</td></tr></table>`;
}

function extractBlocks(md: string): { md: string; blocks: string[] } {
  const blocks: string[] = [];
  const out = md.replace(
    /^:::(kartlar|buton|not|magazalar)[ \t]*(.*)\n([\s\S]*?)^:::[ \t]*$/gm,
    (_m, kind: string, head: string, body: string) => {
      const content = kind === 'buton' ? `${head}\n${body}` : body;
      const html =
        kind === 'kartlar'
          ? renderCards(content)
          : kind === 'buton'
            ? renderButtons(content)
            : kind === 'magazalar'
              ? renderStores()
              : renderNote(content);
      blocks.push(html);
      return `\n\nBLOKYERTUTUCU${blocks.length - 1}\n\n`;
    },
  );
  return { md: out, blocks };
}

export function markdownToHtml(md: string): string {
  const { md: stripped, blocks } = extractBlocks(md);
  const raw = marked.parse(stripped, { async: false, gfm: true, breaks: true }) as string;
  const clean = sanitizeHtml(raw, SANITIZE);
  return clean.replace(/<p>BLOKYERTUTUCU(\d+)<\/p>/g, (_m, i: string) => blocks[Number(i)] ?? '');
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
    .replace(/<h1>/g, '<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#173f71;">')
    .replace(
      /<h2>/g,
      '<h2 style="margin:24px 0 12px;font-size:20px;line-height:1.3;color:#0b1f3a;">',
    )
    .replace(
      /<h3>/g,
      '<h3 style="margin:20px 0 8px;font-size:17px;line-height:1.3;color:#0b1f3a;">',
    )
    .replace(/<p>/g, '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#222222;">')
    .replace(/<a /g, '<a style="color:#173f71;text-decoration:underline;" ')
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
    <tr><td class="band" bgcolor="#173f71" style="background:#173f71;border-radius:12px 12px 0 0;padding:18px 28px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td bgcolor="#ffffff" style="background:#ffffff;border-radius:12px;padding:4px;line-height:0;"><a href="${esc(EMAIL_CONFIG.brand.siteUrl)}" target="_blank" rel="noopener"><img src="${EMAIL_CONFIG.brand.iconUrl}" width="40" height="40" alt="" style="display:block;border:0;border-radius:9px;width:40px;height:40px;"></a></td>
        <td style="padding-left:12px;font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:-.01em;color:#ffffff;">${esc(input.fromName)}</td>
      </tr></table>
    </td></tr>
    <tr><td class="card" style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;font-family:${FONT};">
      ${styledBody}
    </td></tr>
    <tr><td class="foot" style="padding:18px 8px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
      Bu e-postayı Paemisyon'a kayıtlı olduğun için aldın.
      Bu tür e-postaları artık almak istemiyorsan <a href="%%PREFERENCES_URL%%" style="color:#6b7280;text-decoration:underline;">tercihlerini güncelleyebilir</a>
      ya da <a href="%%UNSUBSCRIBE_URL%%" style="color:#6b7280;text-decoration:underline;">abonelikten çıkabilirsin</a>.<br>
      <a href="${esc(input.siteUrl)}" style="color:#6b7280;text-decoration:underline;">${esc(input.siteUrl.replace(/^https?:\/\//, ''))}</a>
      ${EMAIL_CONFIG.brand.social.map((x) => ` · <a href="${esc(x.href)}" target="_blank" rel="noopener" style="color:#6b7280;text-decoration:underline;">${esc(x.label)}</a>`).join('')}
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
