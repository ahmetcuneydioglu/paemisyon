import { Module } from '@nestjs/common';
import { AuditService } from '../admin/audit.service';
import { AuthModule } from '../auth/auth.module';
import { EmailAdminController } from './email-admin.controller';
import { EmailCampaignsService } from './email-campaigns.service';
import { EmailContactsService } from './email-contacts.service';
import { EmailEventsController } from './email-events.controller';
import { EmailEventsService } from './email-events.service';
import { EmailPublicController } from './email-public.controller';
import { EmailSenderService } from './email-sender.service';
import { SesService } from './ses.service';

/**
 * E-posta modülü (docs/47-eposta-ses): Amazon SES ile toplu bilgilendirme,
 * SNS olayları, oturumsuz çıkış/tercih, admin kampanya uçları, gönderici işçi.
 */
@Module({
  imports: [AuthModule],
  controllers: [EmailPublicController, EmailEventsController, EmailAdminController],
  providers: [
    SesService,
    EmailContactsService,
    EmailCampaignsService,
    EmailEventsService,
    EmailSenderService,
    AuditService,
  ],
  exports: [SesService],
})
export class EmailModule {}
