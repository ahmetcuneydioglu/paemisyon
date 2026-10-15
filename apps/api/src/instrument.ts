/**
 * Sentry (Doc 49 A1, 16 Eki 2026) — hata raporlama. main.ts'in İLK satırında
 * içe aktarılır ki SDK Nest ve Express yüklenmeden önce ayağa kalksın.
 *
 * DSN yoksa (lokal, CI) SDK tamamen pasiftir: ne ağ ne yük. DSN yalnız
 * platform panelinden girilir (SENTRY_DSN), koda yazılmaz.
 * Örnekleme düşük tutulur: hata = hepsi, performans izi = %10.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  // Railway her deploy'da commit SHA'sını verir; Sentry hatayı sürüme bağlar.
  release: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.SENTRY_RELEASE,
  tracesSampleRate: 0.1,
  // Kişisel veri: istek gövdesi, çerez ve yetki başlığı gönderilmez (beforeSend).
  beforeSend(event) {
    // Doc 15 §6: AI'ya giden ve dışarı çıkan her veride PII minimize edilir.
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      if (event.request.headers) delete event.request.headers.authorization;
    }
    return event;
  },
});
