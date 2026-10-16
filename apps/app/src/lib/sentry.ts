import * as Sentry from "@sentry/react-native";
import { env } from "./env";

/** Sentry (Doc 49 A1/F1): DSN yoksa pasif. Yalnız hata; replay yok, izleme %5. */
export function initSentry() {
  Sentry.init({
    dsn: env?.sentryDsn || undefined,
    enabled: Boolean(env?.sentryDsn),
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
    environment: __DEV__ ? "development" : "production",
  });
}

export { Sentry };
