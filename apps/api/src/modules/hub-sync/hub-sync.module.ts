import { Module } from '@nestjs/common';
import { HubSyncApplier } from './hub-sync.applier';
import { HubSyncClient } from './hub-sync.client';
import { HUB_SYNC_CLIENT, HUB_SYNC_OPTIONS, HubSyncService, type HubSyncOptions } from './hub-sync.service';

/**
 * Soru Merkezi adaptörü (Doc 55). Ortam: HUB_SYNC_URL, HUB_SYNC_SECRET (loglanmaz),
 * HUB_SYNC_ENABLED ('true' → süreç içi cron, her 10 dk). Anahtar yoksa istemci null'dır:
 * cron hiçbir şey yapmaz, servis yalnız scripts/hub-sync.ts ile elle koşturulabilir.
 */
@Module({
  providers: [
    HubSyncApplier,
    {
      provide: HUB_SYNC_CLIENT,
      useFactory: (): HubSyncClient | null => {
        const baseUrl = process.env.HUB_SYNC_URL;
        const secret = process.env.HUB_SYNC_SECRET;
        return baseUrl && secret ? new HubSyncClient({ baseUrl, secret }) : null;
      },
    },
    {
      provide: HUB_SYNC_OPTIONS,
      useFactory: (): HubSyncOptions => ({ enabled: process.env.HUB_SYNC_ENABLED === 'true', cron: true }),
    },
    HubSyncService,
  ],
  exports: [HubSyncService, HubSyncApplier],
})
export class HubSyncModule {}
