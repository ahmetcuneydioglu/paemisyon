// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: packages/tokens/design-tokens.json (v3.0.0, Nöbet). Yenile: node packages/tokens/build.mjs

export const tokenVersion = '3.0.0' as const;
export const identityName = 'Nöbet' as const;
export type Scheme = 'dark' | 'light';
export const defaultScheme: Scheme = 'dark';

export const palette = {
  dark: {
    bg: '#17161A',
    surface: '#221F25',
    surfaceAlt: '#2C2830',
    ink: '#F4EEE6',
    inkSoft: '#A79F96',
    inkSubtle: '#908880',
    line: '#34303A',
    accent: '#E3804F',
    accentSoft: '#3A281F',
    accentInk: '#F2A47C',
    onAccent: '#17161A',
    success: '#8FB39A',
    successSoft: '#243029',
    successInk: '#A6CDB1',
    warning: '#E0B15A',
    warningSoft: '#3A2F1C',
    warningInk: '#F0CB7E',
    danger: '#E07A6B',
    dangerSoft: '#3F2422',
    dangerInk: '#F3A396',
    focusRing: '#F2A47C',
  },
  light: {
    bg: '#F1EDE9',
    surface: '#FFFFFF',
    surfaceAlt: '#E8E2DC',
    ink: '#1F1C21',
    inkSoft: '#6A6269',
    inkSubtle: '#6F676E',
    line: '#DBD4CE',
    accent: '#B5532E',
    accentSoft: '#F8E1D4',
    accentInk: '#9C4827',
    onAccent: '#FFFFFF',
    success: '#5F8A6B',
    successSoft: '#E3EEE6',
    successInk: '#3F6A4C',
    warning: '#A87530',
    warningSoft: '#F7EAD2',
    warningInk: '#7A5416',
    danger: '#B8453A',
    dangerSoft: '#F8DDD9',
    dangerInk: '#8E2E25',
    focusRing: '#B5532E',
  },
} as const;
export type ColorName = keyof typeof palette.dark;
/** Şemalar arası ortak tip: değerler şemaya göre değişir, anahtar kümesi aynıdır. */
export type Palette = Record<ColorName, string>;

export const fontFamily = {
  display: { name: 'Bricolage Grotesque', weights: [600, 700] },
  body: { name: 'Instrument Sans', weights: [400, 500, 600, 700] },
} as const;

/** Boylar px; tracking em cinsinden (RN'de letterSpacing = tracking * size).
 *  Ad `typeRoles`: `type` adlı bir dışa aktarım, içe aktarımda `{ type as x }` yazımını
 *  TypeScript'in tür-içe-aktarım sözdizimiyle çakıştırıyor. */
export const typeRoles = {
    display: { family: 'display', size: 64, lineHeight: 60, weight: 700, tracking: -0.04, tabular: true },
    title: { family: 'display', size: 28, lineHeight: 30, weight: 700, tracking: -0.02, tabular: false },
    heading: { family: 'display', size: 20, lineHeight: 26, weight: 600, tracking: -0.01, tabular: false },
    subhead: { family: 'body', size: 15, lineHeight: 20, weight: 600, tracking: 0, tabular: false },
    body: { family: 'body', size: 16, lineHeight: 25, weight: 400, tracking: 0, tabular: false },
    bodySm: { family: 'body', size: 14, lineHeight: 20, weight: 400, tracking: 0, tabular: false },
    label: { family: 'body', size: 11, lineHeight: 14, weight: 600, tracking: 0.1, tabular: false, uppercase: true },
    stat: { family: 'display', size: 22, lineHeight: 24, weight: 700, tracking: -0.02, tabular: true },
} as const;
export type TypeRole = keyof typeof typeRoles;

export const dynamicType = { iosCurveAbovePt: 17, androidMaxScale: 1.3 } as const;

export const space = {
    s1: 4,
    s2: 8,
    s3: 12,
    s4: 16,
    s5: 20,
    s6: 24,
    s8: 32,
    s12: 48,
  screenGutter: 20,
} as const;

export const radius = {
    control: 10,
    card: 14,
    sheet: 20,
    pill: 999,
} as const;

export const size = { touchTarget: 44, icon: 24, iconStroke: 1.75, tabBarItems: 5 } as const;

export const motion = {
    enter: { ms: 180, easing: 'cubic-bezier(0, 0, 0.2, 1)' },
    exit: { ms: 140, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
    stagger: { ms: 24 },
} as const;

export const a11y = { minTouchTarget: 44, minContrastText: 4.5, minContrastLarge: 3 } as const;
