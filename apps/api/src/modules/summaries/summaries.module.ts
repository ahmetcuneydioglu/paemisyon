import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeSummariesController, PublicSummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

/// Konu özetleri (Doc 53): public okuma + kullanıcı ilerlemesi. Admin uçları AdminModule'de.
@Module({
  imports: [AuthModule],
  controllers: [PublicSummariesController, MeSummariesController],
  providers: [SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
