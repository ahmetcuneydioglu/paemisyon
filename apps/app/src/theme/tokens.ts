/**
 * Token köprüsü (Doc 49 F1): tek kaynak `packages/tokens/build/tokens.ts` (JSON'dan üretilir).
 * Bu dosya yalnız React Native'e özgü türevleri ekler: yüklü font adları, `type` rollerinin
 * RN TextStyle karşılığı (letterSpacing = tracking × size), dar ekran ölçeği.
 */
import type { TextStyle } from "react-native";
import { a11y, defaultScheme, motion, palette, radius, size, space, typeRoles, type ColorName, type Palette, type Scheme, type TypeRole } from "@tokens";

export { a11y, defaultScheme, motion, palette, radius, size, space };
export type { ColorName, Palette, Scheme, TypeRole };

/** `@expo-google-fonts` paket adları; `useFonts` ile yüklenir (app/_layout.tsx). */
export const fontFamily = {
  display: { 600: "BricolageGrotesque_600SemiBold", 700: "BricolageGrotesque_700Bold" },
  body: { 400: "InstrumentSans_400Regular", 500: "InstrumentSans_500Medium", 600: "InstrumentSans_600SemiBold", 700: "InstrumentSans_700Bold" },
} as const;

type RoleStyle = TextStyle & { fontSize: number; lineHeight: number; fontFamily: string };

function roleStyle(role: TypeRole, scale = 1): RoleStyle {
  const r = typeRoles[role];
  const fam = r.family === "display" ? fontFamily.display : fontFamily.body;
  const weight = (fam as Record<number, string>)[r.weight] ?? Object.values(fam)[0]!;
  const fontSize = Math.round(r.size * scale);
  return {
    fontSize,
    lineHeight: Math.round(r.lineHeight * scale),
    fontFamily: weight,
    letterSpacing: r.tracking * fontSize,
    ...(r.tabular ? { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] } : {}),
    ...("uppercase" in r && r.uppercase ? { textTransform: "uppercase" as const } : {}),
  };
}

export type TypeScale = Record<TypeRole, RoleStyle>;

const roles = Object.keys(typeRoles) as TypeRole[];
export const type: TypeScale = Object.fromEntries(roles.map((r) => [r, roleStyle(r)])) as TypeScale;

/** Dar ekran eşiği (pt): iPhone SE/mini ve 360 dp Android'ler. 17 pt üstü boylar %6 küçülür. */
export const COMPACT_WIDTH = 390;
export const compactType: TypeScale = Object.fromEntries(
  roles.map((r) => [r, roleStyle(r, typeRoles[r].size > 17 ? 0.94 : 1)]),
) as TypeScale;

/** Hazır stil nesneleri; bileşenler renkleri `useTheme().colors` üzerinden alır. */
export const hairline = 1;
