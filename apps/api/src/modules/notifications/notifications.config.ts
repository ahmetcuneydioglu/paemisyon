/**
 * Bildirim motoru ortam okuması (Doc 52 §3, §10). Secret yok.
 *  - NOTIFICATIONS_WORKER=0 → işçi ve kitle yenilemesi kapalı (lokal/test).
 *  - NOTIFICATIONS_PROVIDER=console → FCM ve SES çağrısı yerine log (lokal).
 *  - NOTIFICATIONS_ENV → AppSetting notifications.environment ile eşleşmeli;
 *    eşleşmezse işçi hiçbir şey göndermez (staging asla prod kullanıcısına gidemez).
 */
export const NOTIFICATIONS_CONFIG = {
  /** Bir tick'te çekilen en çok teslim satırı (pooler 15 bağlantı; parti dar tutulur). */
  claimBatch: 200,
  /** Kampanya kitlesi bir tick'te en çok bu kadar kullanıcıya açılır. */
  materializePerTick: 1500,
  materializeBatch: 250,
  /** Kilit zaman aşımı: bu süreden eski `sending` satırlar yeniden alınır. */
  lockStaleMs: 5 * 60_000,
  /** Geçici hata yeniden deneme bekleme süreleri (dk) ve üst sınır. */
  retryDelaysMin: [1, 5, 30, 60, 120],
  maxAttempts: 5,
  /** FCM istek başına mesaj sınırı. */
  fcmChunk: 500,
  dailyCapDefault: 3,
  marketingDailyCapDefault: 1,
  decayWeeklyCapDefault: 2,
  retentionDefault: {
    inbox: 180,
    deliveries: 90,
    events: 180,
    staleDevices: 90,
    inactiveDevices: 180,
  },
  /** Uygulama açılışı last_active_at güncellemesi en çok saatte bir. */
  touchThrottleMs: 60 * 60_000,
} as const;

export const notificationsWorkerEnabled = () => process.env.NOTIFICATIONS_WORKER !== '0';
export const notificationsProvider = (): 'fcm' | 'console' =>
  process.env.NOTIFICATIONS_PROVIDER === 'console' ? 'console' : 'fcm';
export const notificationsEnv = () => (process.env.NOTIFICATIONS_ENV ?? '').trim();
export const workerId = () =>
  `${process.env.RAILWAY_REPLICA_ID ?? process.env.HOSTNAME ?? 'local'}:${process.pid}`;
