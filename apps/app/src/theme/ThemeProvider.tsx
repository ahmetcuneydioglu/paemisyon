import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import { readLocal, writeLocal } from "@/lib/local-store";
import { COMPACT_WIDTH, compactType, defaultScheme, palette, radius, space, type, type Palette, type Scheme, type TypeScale } from "./tokens";

export type ThemePreference = "system" | "light" | "dark";

export type Theme = {
  scheme: Scheme;
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  colors: Palette;
  radius: typeof radius;
  space: typeof space;
  /** Dar ekranda `compactType`, değilse `type`. */
  type: TypeScale;
};

const ThemeContext = createContext<Theme>({
  scheme: defaultScheme,
  preference: "system",
  setPreference: () => {},
  colors: palette[defaultScheme],
  radius,
  space,
  type,
});

/**
 * Nöbet: koyu birincil. Tercih `system | light | dark`; cihazda saklanır ki açılışta
 * sunucu beklenmesin (Doc 49 §1). Sistem tercihi okunamazsa varsayılan şema kullanılır.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const compact = useWindowDimensions().width < COMPACT_WIDTH;
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let active = true;
    void readLocal<ThemePreference>("theme-preference", "system").then((v) => {
      if (active && (v === "system" || v === "light" || v === "dark")) setPreferenceState(v);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme: Scheme = preference === "system" ? (systemScheme === "light" ? "light" : systemScheme === "dark" ? "dark" : defaultScheme) : preference;
    return {
      scheme,
      preference,
      setPreference: (next) => {
        setPreferenceState(next);
        void writeLocal("theme-preference", next);
      },
      colors: palette[scheme],
      radius,
      space,
      type: compact ? compactType : type,
    };
  }, [preference, systemScheme, compact]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
