/**
 * Kampanya test postası — admin paneldeki "Test gönder" ile aynı yol
 * (EmailCampaignsService.sendTest: [TEST] konu, `ornek` çıkış token'ı,
 * List-Unsubscribe başlıkları). Panel açmadan teslimat denemesi için.
 *
 * Çalıştırma (apps/api içinden; AWS anahtarları ortamda, EMAIL_WORKER=0):
 *   npx ts-node scripts/email-send-test.ts                      # kampanyaları listeler
 *   npx ts-node scripts/email-send-test.ts <kampanyaId> <alıcı>  # test postası gönderir
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { EmailCampaignsService } from '../src/modules/email/email-campaigns.service';

async function main() {
  process.env.EMAIL_WORKER = '0';
  const [campaignId, to] = process.argv.slice(2);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    if (!campaignId || !to) {
      const list = await prisma.emailCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, subject: true, status: true },
      });
      for (const c of list) console.log(`${c.id}  [${c.status}]  ${c.name} — ${c.subject}`);
      return;
    }
    const r = await app.get(EmailCampaignsService).sendTest(campaignId, to);
    console.log('gönderildi:', to, 'SES MessageId:', r.messageId);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
