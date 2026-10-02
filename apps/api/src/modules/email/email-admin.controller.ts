import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from '../admin/audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  CampaignsQueryDto,
  ContactsQueryDto,
  SendTestDto,
  UpsertCampaignDto,
} from './dto/email.dto';
import { EmailCampaignsService } from './email-campaigns.service';
import { EmailContactsService } from './email-contacts.service';
import { EmailSenderService } from './email-sender.service';
import { EMAIL_CONFIG } from './email.config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SesService } from './ses.service';

/** /api/v1/admin/email/* — yalnız admin; her mutasyon denetim kaydına yazılır. */
@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EmailAdminController {
  constructor(
    private readonly campaigns: EmailCampaignsService,
    private readonly contacts: EmailContactsService,
    private readonly sender: EmailSenderService,
    private readonly ses: SesService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Sağlık ──
  @Get('health')
  async health() {
    if (!this.ses.enabled) return { enabled: false };
    const since = new Date(Date.now() - 86_400_000);
    const [account, identities, suppressed, last24, contacts] = await Promise.all([
      this.ses.account(true),
      Promise.all(EMAIL_CONFIG.identities.map((i) => this.ses.identity(i))),
      this.ses.suppressedCount().catch(() => null),
      this.prisma.emailSend.groupBy({
        by: ['status'],
        where: { sentAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.emailContact.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries(last24.map((s) => [s.status, s._count._all])) as Record<
      string,
      number
    >;
    const sent = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      enabled: true,
      account,
      identities,
      suppressedOnSes: suppressed,
      last24h: {
        sent,
        delivered: counts.delivered ?? 0,
        bounced: counts.bounced ?? 0,
        complained: counts.complained ?? 0,
        deliveryRate: sent ? (counts.delivered ?? 0) / sent : null,
        bounceRate: sent ? (counts.bounced ?? 0) / sent : null,
        complaintRate: sent ? (counts.complained ?? 0) / sent : null,
      },
      contacts: Object.fromEntries(contacts.map((c) => [c.status, c._count._all])),
      thresholds: EMAIL_CONFIG.safety,
      defaults: EMAIL_CONFIG.defaultFrom,
    };
  }

  // ── Kişiler ──
  @Get('contacts')
  contactsList(@Query() q: ContactsQueryDto) {
    return this.contacts.list(q);
  }

  @Post('contacts/:id/unsubscribe')
  async contactUnsubscribe(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const r = await this.contacts.adminUnsubscribe(id);
    await this.audit.log(actor, 'email.contact.unsubscribe', 'email_contact', id);
    return r;
  }

  // ── Kampanyalar ──
  @Get('campaigns')
  list(@Query() q: CampaignsQueryDto) {
    return this.campaigns.list(q.status);
  }

  @Post('campaigns')
  async create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpsertCampaignDto) {
    const c = await this.campaigns.create(dto, actor.id);
    await this.audit.log(actor, 'email.campaign.create', 'email_campaign', c.id, {
      name: c.name,
      topic: c.topic,
    });
    return c;
  }

  @Get('campaigns/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.get(id);
  }

  @Put('campaigns/:id')
  async update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCampaignDto,
  ) {
    const c = await this.campaigns.update(id, dto);
    await this.audit.log(actor, 'email.campaign.update', 'email_campaign', id);
    return c;
  }

  @Get('campaigns/:id/preview')
  preview(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.preview(id);
  }

  @Post('campaigns/:id/audience')
  async audience(@Param('id', ParseUUIDPipe) id: string) {
    const c = await this.campaigns.get(id);
    return this.campaigns.audiencePreview(c.topic, c.audience as never);
  }

  @Post('campaigns/:id/test')
  async test(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendTestDto,
  ) {
    const r = await this.campaigns.sendTest(id, dto.to);
    await this.audit.log(actor, 'email.campaign.test', 'email_campaign', id, { to: dto.to });
    return r;
  }

  @Post('campaigns/:id/start')
  async start(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { expectedCount: number },
  ) {
    const r = await this.campaigns.start(id, { expectedCount: Number(body?.expectedCount) });
    await this.audit.log(actor, 'email.campaign.start', 'email_campaign', id, r);
    return r;
  }

  @Post('campaigns/:id/pause')
  async pause(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const r = await this.campaigns.pause(id, `admin: ${actor.email}`);
    await this.audit.log(actor, 'email.campaign.pause', 'email_campaign', id);
    return r;
  }

  @Post('campaigns/:id/resume')
  async resume(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const r = await this.campaigns.resume(id);
    await this.audit.log(actor, 'email.campaign.resume', 'email_campaign', id);
    return r;
  }

  @Delete('campaigns/:id')
  async cancel(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const r = await this.campaigns.cancel(id);
    await this.audit.log(actor, 'email.campaign.cancel', 'email_campaign', id);
    return r;
  }

  /** İşçiyi elle tetikle (panelden "şimdi gönder" — cron'u beklemeden). */
  @Post('worker/tick')
  async tick(@CurrentUser() actor: AuthenticatedUser) {
    const r = await this.sender.tick();
    await this.audit.log(actor, 'email.worker.tick', 'email_worker', null, r);
    return r;
  }
}
