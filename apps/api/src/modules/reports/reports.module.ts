import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuditService } from '../admin/audit.service';
import { HubSyncModule } from '../hub-sync/hub-sync.module';

/** Soru hata bildirimleri: kullanıcı ucu burada, yönetim uçları AdminModule'de.
 *  Merkez sorusunun bildirimi HubSyncModule.HubReportForwarder ile merkeze iletilir (Doc 55 F3). */
@Module({
  imports: [HubSyncModule],
  controllers: [ReportsController],
  providers: [ReportsService, AuditService],
  exports: [ReportsService],
})
export class ReportsModule {}
