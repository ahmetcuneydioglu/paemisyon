import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service';

/** Push altyapısı (Faz 2) — global: me/admin controller'ları enjekte eder. */
@Global()
@Module({
  providers: [PushService],
  exports: [PushService],
})
export class NotificationsModule {}
