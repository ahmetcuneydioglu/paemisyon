/** Modül içi enjeksiyon anahtarları (servis ↔ bildirim iletimi döngüsel içe aktarmasın diye ayrı dosya). */
export const HUB_SYNC_CLIENT = 'HUB_SYNC_CLIENT';
export const HUB_SYNC_OPTIONS = 'HUB_SYNC_OPTIONS';

export interface HubSyncOptions {
  /** HUB_SYNC_ENABLED=true: cron ve bildirim iletimi açık. */
  enabled: boolean;
  /** Süreç içi cron (CLI'da kapalı). */
  cron: boolean;
}
