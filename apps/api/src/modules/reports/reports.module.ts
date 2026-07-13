import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuditService } from '../admin/audit.service';

/** Soru hata bildirimleri: kullanıcı ucu burada, yönetim uçları AdminModule'de. */
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, AuditService],
  exports: [ReportsService],
})
export class ReportsModule {}
