/**
 * Tarayıcı tarafı Sentry (Doc 49 A1). Yalnız hata yakalama; oturum tekrarı
 * (replay) ve ağır izleme bilinçli olarak KAPALI — public sayfaların LCP'si
 * (web-perf kararları) ve kişisel veri. DSN yoksa SDK pasif.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.05,
  // Tarayıcı eklentileri ve ağ kopmaları gürültü üretir; bastır.
  ignoreErrors: ['ResizeObserver loop', 'Load failed', 'NetworkError', 'Failed to fetch'],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
