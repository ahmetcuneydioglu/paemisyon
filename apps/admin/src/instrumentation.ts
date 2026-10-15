/**
 * Next.js instrumentation kancası (Doc 49 A1): sunucu ve edge çalışma zamanında
 * Sentry'yi başlatır, sunucu bileşeni/route handler hatalarını yakalar.
 * DSN yoksa SDK pasif (bkz. sentry.server.config.ts).
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
