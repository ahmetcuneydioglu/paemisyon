// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: packages/tokens/design-tokens.json (v4.0.0, Nöbet defteri). Yenile: node packages/tokens/build.mjs

export const tokenVersion = '4.0.0' as const;
export const identityName = 'Nöbet defteri' as const;
export type Scheme = 'dark' | 'light';
export const defaultScheme: Scheme = 'dark';

export const palette = {
  dark: {
    bg: '#121A26',
    surface: '#1E2B3C',
    surfaceAlt: '#28374A',
    ink: '#F5F0E5',
    inkSoft: '#BAC4D0',
    inkSubtle: '#94A0B0',
    line: '#394657',
    accent: '#E8B46C',
    accentSoft: '#2E3447',
    accentInk: '#E8B46C',
    onAccent: '#1B293B',
    panel: '#1E2B3C',
    panelInk: '#F5F0E5',
    panelSoft: '#BAC4D0',
    success: '#8FB39A',
    successSoft: '#213229',
    successInk: '#A6CDB1',
    warning: '#E0B15A',
    warningSoft: '#3A3220',
    warningInk: '#F0CB7E',
    danger: '#E07A6B',
    dangerSoft: '#3F2630',
    dangerInk: '#F3A396',
    focusRing: '#E8B46C',
  },
  light: {
    bg: '#FFFCF6',
    surface: '#FFFFFF',
    surfaceAlt: '#EAE5DA',
    ink: '#1B293B',
    inkSoft: '#596371',
    inkSubtle: '#6B7482',
    line: '#D9D7CF',
    accent: '#E8B46C',
    accentSoft: '#F6E9D2',
    accentInk: '#8B5E23',
    onAccent: '#1B293B',
    panel: '#1B293B',
    panelInk: '#F5F0E5',
    panelSoft: '#BAC4D0',
    success: '#5F8A6B',
    successSoft: '#E3EEE6',
    successInk: '#3F6A4C',
    warning: '#A87530',
    warningSoft: '#F7EAD2',
    warningInk: '#7A5416',
    danger: '#B8453A',
    dangerSoft: '#F8DDD9',
    dangerInk: '#8E2E25',
    focusRing: '#8B5E23',
  },
} as const;
export type ColorName = keyof typeof palette.dark;
/** Şemalar arası ortak tip: değerler şemaya göre değişir, anahtar kümesi aynıdır. */
export type Palette = Record<ColorName, string>;

export const fontFamily = {
  display: { name: 'Lora', weights: [400, 500, 600] },
  body: { name: 'Inter', weights: [400, 500, 600, 700] },
} as const;

/** Boylar px; tracking em cinsinden (RN'de letterSpacing = tracking * size).
 *  Ad `typeRoles`: `type` adlı bir dışa aktarım, içe aktarımda `{ type as x }` yazımını
 *  TypeScript'in tür-içe-aktarım sözdizimiyle çakıştırıyor. */
export const typeRoles = {
    hero: { family: 'display', size: 120, lineHeight: 108, weight: 500, tracking: -0.03, tabular: true },
    display: { family: 'display', size: 64, lineHeight: 60, weight: 500, tracking: -0.03, tabular: true },
    title: { family: 'display', size: 24, lineHeight: 29, weight: 600, tracking: -0.01, tabular: false },
    heading: { family: 'display', size: 20, lineHeight: 27, weight: 600, tracking: 0, tabular: false },
    subhead: { family: 'body', size: 15, lineHeight: 20, weight: 600, tracking: 0, tabular: false },
    body: { family: 'body', size: 16, lineHeight: 25, weight: 400, tracking: 0, tabular: false },
    bodySm: { family: 'body', size: 14, lineHeight: 20, weight: 400, tracking: 0, tabular: false },
    label: { family: 'body', size: 11, lineHeight: 14, weight: 600, tracking: 0.1, tabular: false, uppercase: true },
    stat: { family: 'display', size: 22, lineHeight: 24, weight: 600, tracking: -0.01, tabular: true },
    brand: { family: 'display', size: 20, lineHeight: 27, weight: 600, tracking: 0, tabular: false },
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
    panel: 4,
    control: 10,
    card: 10,
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
