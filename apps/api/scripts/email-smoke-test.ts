/**
 * E-posta zinciri duman testi (Faz 4) — SES SİMÜLATÖR adresleriyle, gerçek
 * alıcı yok. Kotayı tüketmez, itibarı etkilemez.
 *
 *   kişi (manual, simülatör) → kampanya → start (kitle dondurma) → tick (SES) →
 *   sentetik SES olayları (processEvent) → durumlar → temizlik.
 *
 * Çalıştırma (apps/api içinden; AWS anahtarları ortamda, EMAIL_WORKER=0):
 *   npx ts-node scripts/email-smoke-test.ts [--keep]
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { EmailCampaignsService } from '../src/modules/email/email-campaigns.service';
import { EmailEventsService } from '../src/modules/email/email-events.service';
import { EmailSenderService } from '../src/modules/email/email-sender.service';
import { EmailContactsService } from '../src/modules/email/email-contacts.service';
import { SesService } from '../src/modules/email/ses.service';
import { randomBytes } from 'node:crypto';

const KEEP = process.argv.includes('--keep');
const SIM = ['success', 'bounce', 'complaint', 'ooto'].map((k) => `${k}@simulator.amazonses.com`);

async function main() {
  process.env.EMAIL_WORKER = '0';
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const campaigns = app.get(EmailCampaignsService);
  const sender = app.get(EmailSenderService);
  const events = app.get(EmailEventsService);
  const contacts = app.get(EmailContactsService);
  const ses = app.get(SesService);
  if (!ses.enabled) throw new Error('SES devre dışı: AWS anahtarı ortamda yok.');

  const admin = await prisma.user.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
    select: { id: true },
  });
  if (!admin) throw new Error('admin kullanıcı yok');

  // 1) Simülatör kişileri (manual)
  await prisma.emailContact.deleteMany({ where: { email: { in: SIM } } });
  await prisma.emailContact.createMany({
    data: SIM.map((email) => ({
      email,
      source: 'manual',
      displayName: email.split('@')[0],
      consentSource: 'smoke_test',
      consentAt: new Date(),
      unsubscribeToken: randomBytes(32).toString('base64url'),
    })),
  });
  // biri konu tercihini kapatmış olsun → kitleye girmemeli
  const ooto = await prisma.emailContact.findUniqueOrThrow({ where: { email: SIM[3] } });
  await prisma.emailTopicPreference.create({
    data: { contactId: ooto.id, topic: 'duyuru', subscribed: false },
  });

  // 2) Kampanya
  const c = await campaigns.create(
    {
      name: `SMOKE ${new Date().toISOString()}`,
      topic: 'duyuru',
      subject: 'Duman testi',
      previewText: 'Simülatör',
      bodyMarkdown:
        '# Merhaba {{ad}}\n\nBu bir **duman testidir**. [Siteye git](https://paemisyon.com)\n\n- madde bir\n- madde iki',
      audience: { sources: ['manual'] },
      dailyCap: 10,
      sendRatePerSec: 1,
    },
    admin.id,
  );
  const aud = await campaigns.audiencePreview('duyuru', { sources: ['manual'] });
  console.log(
    'kitle:',
    aud.count,
    aud.sample.map((s) => s.email),
  );
  if (aud.count !== 3)
    throw new Error(`kitle 3 olmalı (tercih kapalı ooto dışarıda), geldi: ${aud.count}`);

  // 3) Test postası zorunluluğu
  await campaigns.start(c.id, { expectedCount: 3 }).then(
    () => {
      throw new Error('test postası olmadan başlamamalıydı');
    },
    (e) => console.log('beklenen ret:', (e as Error).message),
  );
  const t = await campaigns.sendTest(c.id, SIM[0]);
  console.log('test postası MessageId:', t.messageId);

  // 4) Başlat + tick
  const started = await campaigns.start(c.id, { expectedCount: 3 });
  console.log('başlatıldı, hedef:', started.targeted);
  const r1 = await sender.tick();
  console.log('tick 1:', r1);
  const r2 = await sender.tick(); // idempotency: ikinci tick yeni gönderim yapmamalı
  console.log('tick 2:', r2);
  if (r2.sent !== 0) throw new Error('ikinci tick yeniden gönderdi!');

  const sends = await prisma.emailSend.findMany({
    where: { campaignId: c.id },
    select: { email: true, status: true, sesMessageId: true },
  });
  console.table(sends);
  if (sends.some((s) => s.status !== 'sent' || !s.sesMessageId))
    throw new Error('bütün gönderimler sent + MessageId olmalı');

  // 5) Sentetik SES olayları (SNS imzası deploy sonrası gerçek konuyla sınanır)
  const byEmail = Object.fromEntries(sends.map((s) => [s.email, s.sesMessageId!]));
  const now = new Date().toISOString();
  await events.processEvent({
    eventType: 'Delivery',
    mail: { messageId: byEmail[SIM[0]], timestamp: now, destination: [SIM[0]] },
    delivery: { timestamp: now, recipients: [SIM[0]] },
  });
  await events.processEvent({
    eventType: 'Bounce',
    mail: { messageId: byEmail[SIM[1]], timestamp: now, destination: [SIM[1]] },
    bounce: {
      bounceType: 'Permanent',
      bounceSubType: 'General',
      timestamp: now,
      bouncedRecipients: [{ emailAddress: SIM[1], diagnosticCode: 'smtp; 550' }],
    },
  });
  await events.processEvent({
    eventType: 'Complaint',
    mail: { messageId: byEmail[SIM[2]], timestamp: now, destination: [SIM[2]] },
    complaint: {
      complaintFeedbackType: 'abuse',
      timestamp: now,
      complainedRecipients: [{ emailAddress: SIM[2] }],
    },
  });
  const dup = await events.processEvent({
    eventType: 'Bounce',
    mail: { messageId: byEmail[SIM[1]], timestamp: now, destination: [SIM[1]] },
    bounce: {
      bounceType: 'Permanent',
      bounceSubType: 'General',
      timestamp: now,
      bouncedRecipients: [{ emailAddress: SIM[1] }],
    },
  });
  console.log('yinelenen olay:', dup);
  if (dup.handled !== 'duplicate') throw new Error('yinelenen olay elenmedi');

  const after = await prisma.emailContact.findMany({
    where: { email: { in: SIM } },
    select: { email: true, status: true },
  });
  console.table(after);
  const camp = await campaigns.get(c.id);
  console.log('kampanya:', camp.status, {
    sent: camp.sentCount,
    delivered: camp.deliveredCount,
    bounced: camp.bouncedCount,
    complained: camp.complainedCount,
    sends: camp.sends,
  });

  // 6) Çıkış: tek tık + tercih
  const ok = await prisma.emailContact.findUniqueOrThrow({ where: { email: SIM[0] } });
  await contacts.unsubscribeAll(ok.unsubscribeToken, 'one_click', c.id);
  const prefs = await contacts.preferences(ok.unsubscribeToken);
  console.log('çıkış sonrası:', prefs);
  if (prefs.status !== 'unsubscribed') throw new Error('tek tık çıkış çalışmadı');
  await contacts.preferences('gecersiz-token-xxxxxxxxxxxxxxxx').then(
    () => {
      throw new Error('geçersiz belirteç 404 olmalıydı');
    },
    (e) => console.log('beklenen 404:', (e as Error).message),
  );

  if (!KEEP) {
    await prisma.emailCampaign.delete({ where: { id: c.id } });
    await prisma.emailContact.deleteMany({ where: { email: { in: SIM } } });
    console.log('temizlendi');
  }
  await app.close();
  console.log('\nDUMAN TESTİ BAŞARILI');
}

main().catch((e) => {
  console.error('DUMAN TESTİ BAŞARISIZ:', e);
  process.exit(1);
});
