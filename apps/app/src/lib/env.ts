import { z } from "zod";

/**
 * Ortam değişkenleri (Doc 49 F1). Yalnız EXPO_PUBLIC_* okunur; pakete gömülür, gizli değildir.
 * Service role / `sb_secret_` anahtarı bu istemciye giremez; şema reddeder (gys-mobil kalıbı).
 */
const schema = z
  .object({
    apiBaseUrl: z.url("EXPO_PUBLIC_API_BASE_URL geçerli bir URL olmalı."),
    supabaseUrl: z.url("EXPO_PUBLIC_SUPABASE_URL geçerli bir URL olmalı."),
    supabaseAnonKey: z
      .string()
      .min(1, "EXPO_PUBLIC_SUPABASE_ANON_KEY boş.")
      .refine(
        (key) => !key.startsWith("sb_secret_") && !key.includes("service_role"),
        "Mobil istemciye yalnız anon/publishable key verilir; service role yasaktır.",
      ),
    googleWebClientId: z.string().default(""),
    googleIosClientId: z.string().default(""),
    sentryDsn: z.string().default(""),
  })
  // Release paketinde yerel (http) adres olamaz.
  .refine((v) => !isReleaseBuild() || (v.apiBaseUrl.startsWith("https://") && v.supabaseUrl.startsWith("https://")), {
    message: "Release derlemesi yerel (http) adres taşıyor; canlı değerler .env.production.local'da olmalı.",
  });

/** React Native `__DEV__`; Node (testler) tanımlamaz, orada geliştirme sayılır. */
function isReleaseBuild(): boolean {
  return typeof __DEV__ !== "undefined" && !__DEV__;
}

const parsed = schema.safeParse({
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
});

export const env = parsed.success ? parsed.data : null;
export const envError = parsed.success ? null : parsed.error.issues.map((i) => i.message).join(" ");
