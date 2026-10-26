/**
 * Şablon değişkenleri ve metin kuralları (Doc 52 §7, Doc 26 "Bildirim dili").
 * `{{ad}}`, `{{ad|Aday}}` (varsayılanlı) ve eski `{ad}` biçimi desteklenir.
 * Beyaz liste dışı değişken boş kalmaz: olduğu gibi bırakılır ve uyarı üretir.
 */
export const TEMPLATE_VARIABLES = [
  'ad',
  'streak',
  'zayif_konu',
  'sinava_kalan_gun',
  'deneme_adi',
  'net',
  'sira',
  'hafta_soru',
  'hafta_dogruluk',
  'dun_dogruluk',
  'kalan_soru',
  'kalan_soru_no',
  'gelisen_konu',
  'soru_no',
  // F2 otomasyon yükleri
  'rakip',
  'gerekli_dogru',
  'rozet',
  'soru_sayisi',
  'sure',
  'saat',
  'onceki_net',
  'sonuc',
  'sinav_adi',
  'link',
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateVars = Partial<Record<TemplateVariable, string | number | null | undefined>>;

export const TITLE_MAX = 40;
export const BODY_MAX = 150;

const VAR_RE = /\{\{\s*([a-z_]+)\s*(?:\|\s*([^}]*?)\s*)?\}\}|\{([a-z_]+)\}/g;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const FORBIDDEN = ['seni özledik', 'geri dön', 'fırsatları kaçırma', 'kaçırma!'];

const known = new Set<string>(TEMPLATE_VARIABLES);

/** HTML kaçışı yok: bu metin push/kutu düz metnidir; e-posta tarafı ayrıca kaçışlar. */
export function fillTemplate(text: string, vars: TemplateVars): string {
  return text.replace(
    VAR_RE,
    (m, name1: string | undefined, fallback: string | undefined, name2) => {
      const name = (name1 ?? name2) as string;
      if (!known.has(name)) return m;
      const v = vars[name as TemplateVariable];
      if (v == null || v === '') return fallback ?? (name === 'ad' ? 'Aday' : '');
      return String(v);
    },
  );
}

/** Metindeki değişken adları (beyaz liste dışı olanlar da). */
export function templateVariables(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(VAR_RE)) out.add((m[1] ?? m[3]) as string);
  return [...out];
}

export type TemplateWarning = { code: string; message: string };

/** Yayın engeli değil, uyarı: panel gösterir; `emoji` ve `forbidden` gönderimde reddedilir. */
export function templateWarnings(title: string, body: string): TemplateWarning[] {
  const w: TemplateWarning[] = [];
  if (title.length > TITLE_MAX)
    w.push({ code: 'title_long', message: `Başlık ${title.length}/${TITLE_MAX} karakter.` });
  if (body.length > BODY_MAX)
    w.push({
      code: 'body_long',
      message: `Gövde ${body.length}/${BODY_MAX} karakter; Android 2 satırdan sonra kısaltır.`,
    });
  if (EMOJI_RE.test(title) || EMOJI_RE.test(body))
    w.push({ code: 'emoji', message: 'Bildirim metninde emoji kullanılmaz (Doc 52 karar 10).' });
  const low = `${title} ${body}`.toLocaleLowerCase('tr-TR');
  for (const f of FORBIDDEN)
    if (low.includes(f))
      w.push({ code: 'forbidden', message: `Jenerik ifade yasak (Doc 26): "${f}".` });
  for (const v of [...templateVariables(title), ...templateVariables(body)])
    if (!known.has(v))
      w.push({ code: 'unknown_variable', message: `Bilinmeyen değişken: {{${v}}}.` });
  return w;
}

export function firstName(displayName: string | null | undefined): string {
  return (displayName ?? '').trim().split(/\s+/)[0] || 'Aday';
}
