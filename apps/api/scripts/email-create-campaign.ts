/**
 * Kampanya taslağını betikle kurar ve isteğe bağlı test postası gönderir.
 * Başlatma panelden ya da --start ile (kitle sayısı onayı ister) yapılır.
 *
 *   npx ts-node scripts/email-create-campaign.ts --name "Duyuru 1" --subject "…" --preview "…" \
 *     --body docs/…/govde.md --tags brevo_first300 --sources legacy_paem705,manual,live_user \
 *     --daily-cap 300 --rate 2 [--test-to adres] [--start <beklenen kitle sayısı>]
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { EmailCampaignsService } from '../src/modules/email/email-campaigns.service';

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const need = (n: string) => {
  const v = opt(n);
  if (!v) {
    console.error(`--${n} zorunlu`);
    process.exit(1);
  }
  return v;
};

async function main() {
  process.env.EMAIL_WORKER = '0';
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const prisma = app.get(PrismaService);
  const campaigns = app.get(EmailCampaignsService);
  const admin = await prisma.user.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
    select: { id: true, email: true },
  });
  if (!admin) throw new Error('admin yok');

  const name = need('name');
  let c = await prisma.emailCampaign.findFirst({ where: { name } });
  const dto = {
    name,
    topic: (opt('topic') ?? 'duyuru') as 'duyuru' | 'kampanya',
    subject: need('subject'),
    previewText: opt('preview') ?? null,
    bodyMarkdown: readFileSync(need('body'), 'utf8'),
    audience: {
      sources: (opt('sources') ?? 'legacy_paem705').split(',').filter(Boolean),
      legacyYears: (opt('years') ?? '').split(',').filter(Boolean).map(Number),
      tags: (opt('tags') ?? '').split(',').filter(Boolean),
    },
    dailyCap: Number(opt('daily-cap') ?? 150),
    sendRatePerSec: Number(opt('rate') ?? 1),
  };
  if (c) {
    c = await campaigns.update(c.id, dto);
    console.log('güncellendi:', c.id, c.status);
  } else {
    c = await campaigns.create(dto, admin.id);
    console.log('oluşturuldu:', c.id);
  }
  const aud = await campaigns.audiencePreview(c.topic, c.audience as never);
  console.log(
    'kitle:',
    aud.count,
    aud.breakdown
      .map((b) => `${b.source}${b.legacyYear ? ' ' + b.legacyYear : ''}=${b.count}`)
      .join(' · '),
  );

  const testTo = opt('test-to');
  if (testTo) {
    const r = await campaigns.sendTest(c.id, testTo);
    console.log('test postası:', r.messageId);
  }
  const start = opt('start');
  if (start) {
    const r = await campaigns.start(c.id, { expectedCount: Number(start) });
    console.log('BAŞLATILDI, kuyruk:', r.targeted);
  }
  await app.close();
}
main().catch((e) => {
  console.error('HATA:', (e as Error).message);
  process.exit(1);
});
