/**
 * Doc 52 F3 duman testi — A/B varyant ataması, akıllı saat, zayıf konu zenginleştirme, kişisel rekor olayı
 * (geçici Docker veritabanı; prod'a dokunmaz). Çalıştırma:
 *   DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon \
 *   NOTIFICATIONS_PROVIDER=console NOTIFICATIONS_WORKER=0 NUDGE_CRON=0 \
 *   npx ts-node -r tsconfig-paths/register scripts/notifications/f3-smoke.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { AppEventsService } from '../../src/modules/notifications/app-events.service';
import { AudienceService } from '../../src/modules/notifications/audience.service';
import { AutomationsService } from '../../src/modules/notifications/automations.service';
import { CampaignsService } from '../../src/modules/notifications/campaigns.service';
import { SuggestService } from '../../src/modules/notifications/suggest.service';
import type { AuthenticatedUser } from '../../src/modules/auth/auth.types';
import { trClock } from '../../src/modules/notifications/decision.logic';

function check(cond: unknown, msg: string) {
  if (!cond) throw new Error(`KONTROL BAŞARISIZ: ${msg}`);
  console.log(`✓ ${msg}`);
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const events = app.get(AppEventsService);
  const audience = app.get(AudienceService);
  const automations = app.get(AutomationsService);
  const campaigns = app.get(CampaignsService);
  const suggest = app.get(SuggestService);
  const now = new Date();

  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52f3-' } } });
  const users = [];
  for (let i = 1; i <= 12; i++) {
    users.push(
      await prisma.user.create({
        data: {
          email: `doc52f3-${i}@example.com`,
          displayName: `F3 Aday ${i}`,
          status: 'active',
          onboardingCompletedAt: now,
          pushTokens: {
            create: { token: `tok-f3-${i}-${Date.now()}`, platform: 'ios', isActive: true },
          },
        },
      }),
    );
  }
  const actor: AuthenticatedUser = {
    id: users[0].id,
    email: users[0].email,
    roles: ['admin'],
    isPremium: false,
  };
  await prisma.userNotificationSettings.createMany({
    data: users.map((u) => ({ userId: u.id, quietStart: '03:00', quietEnd: '03:00' })),
  });
  for (const u of users) await audience.refresh(u.id);
  // Yeni kullanıcı (kayıt < 3 gün): en iyi saat = kayıt saati (TR)
  const a1 = await prisma.notificationAudience.findUnique({ where: { userId: users[0].id } });
  check(
    a1?.bestEngagementHour === trClock(now).h,
    `yeni kullanıcıda en iyi saat kayıt saati (${a1?.bestEngagementHour})`,
  );

  // 1) A/B kampanya: 12 alıcı, A %50 / B %50, akıllı saat 09:00–21:00
  const c = await campaigns.create(
    {
      name: 'F3 A/B deneme',
      category: 'exam',
      title: 'A başlığı',
      body: 'A gövdesi',
      channels: ['push', 'inbox'],
      audienceMode: 'users',
      userIds: users.map((u) => u.id),
      sendMode: 'smart',
      smartWindowStart: '09:00',
      smartWindowEnd: '21:00',
      variants: [
        { key: 'A', weight: 50, title: 'A başlığı', body: 'A gövdesi' },
        { key: 'B', weight: 50, title: 'B başlığı', body: 'B gövdesi' },
      ],
    },
    actor,
  );
  check(
    c.variants.length === 2 && c.smartWindowStart === '09:00',
    'kampanya iki varyant + akıllı pencereyle oluştu',
  );
  await expectThrow(
    () =>
      campaigns.create(
        {
          name: 'x',
          category: 'exam',
          title: 't',
          body: 'b',
          variants: [
            { key: 'A', weight: 70, title: 'a', body: 'b' },
            { key: 'B', weight: 40, title: 'a', body: 'b' },
          ],
        } as never,
        actor,
      ),
    'ağırlık toplamı 100 değilse reddedilir',
  );
  await campaigns.transition(c.id, 'send_now', actor, 12);
  const full = await prisma.notificationCampaign.findUniqueOrThrow({
    where: { id: c.id },
    include: { variants: true },
  });
  const opened = await campaigns.materialize(full, 100);
  check(opened >= 12, `kitle açıldı (${opened}; testerlar da dahil olabilir)`);
  const rows = await prisma.notification.findMany({
    where: { campaignId: c.id, userId: { in: users.map((u) => u.id) } },
    select: { userId: true, variantId: true, title: true, scheduledAt: true },
  });
  check(rows.length === 12, '12 test alıcısının her birine bir satır');
  const byVariant = new Map<string | null, number>();
  for (const r of rows) byVariant.set(r.variantId, (byVariant.get(r.variantId) ?? 0) + 1);
  check(
    byVariant.size === 2 && [...byVariant.values()].every((n) => n >= 2),
    `varyant dağılımı ${[...byVariant.values()].join('/')}`,
  );
  const again = await prisma.notification.findMany({
    where: { campaignId: c.id, userId: { in: users.map((u) => u.id) } },
    select: { variantId: true, userId: true },
  });
  const { createHash } = await import('node:crypto');
  const vA = full.variants.find((v) => v.key === 'A')!;
  const vB = full.variants.find((v) => v.key === 'B')!;
  const expected = (userId: string) => {
    const x =
      (parseInt(createHash('md5').update(`${c.id}${userId}`).digest('hex').slice(0, 8), 16) %
        10_000) /
      100;
    return x < vA.weight ? vA.id : vB.id;
  };
  check(
    again.every((r) => r.variantId === expected(r.userId)),
    'atama deterministik: md5(campaignId+userId) ağırlık aralığı',
  );
  const winStart = 9 * 60,
    winEnd = 21 * 60;
  check(
    rows.every((r) => {
      const { h, m } = trClock(r.scheduledAt);
      return (
        h * 60 + m >= winStart &&
        h * 60 + m <= winEnd &&
        r.scheduledAt.getTime() >= now.getTime() - 60_000
      );
    }),
    'akıllı saat: her alıcının scheduledAt TR 09:00–21:00 penceresinde ve geçmişte değil',
  );
  const an = await campaigns.analytics(c.id);
  check(
    an.variants.length === 2 && an.variants.reduce((s, v) => s + v.total, 0) >= 12,
    'analiz varyant kırılımı',
  );

  // 2) Zayıf konu zenginleştirme (weak_topic)
  // Docker kataloğu boş olabilir: geçici modül → ders → konu.
  let topic = await prisma.topic.findFirst({ select: { id: true, name: true } });
  let tmpCourse: string | null = null;
  if (!topic) {
    const course = await prisma.course.create({
      data: { name: 'F3 Geçici Ders' },
      select: { id: true },
    });
    tmpCourse = course.id;
    topic = await prisma.topic.create({
      data: { courseId: course.id, name: 'Yakalama ve Gözaltı', matchKeywords: [] },
      select: { id: true, name: true },
    });
  }
  check(!!topic, `konu bulundu: ${topic?.name}`);
  await prisma.userTopicProgress.create({
    data: {
      userId: users[1].id,
      topicId: topic!.id,
      solvedCount: 5,
      correctCount: 1,
      mastery: 0.2,
    } as never,
  });
  await audience.refresh(users[1].id);
  const a2 = await prisma.notificationAudience.findUnique({ where: { userId: users[1].id } });
  check(a2?.weakTopicIds.includes(topic!.id), 'kitle: zayıf konu listesi doldu');
  const wt = await prisma.notificationAutomation.findUniqueOrThrow({
    where: { code: 'weak_topic' },
  });
  await automations.setStatus(wt.id, 'active', actor);
  const r = await automations.runNow(wt.id, false, actor);
  const n2 = await prisma.notification.findFirst({
    where: { automationCode: 'weak_topic', userId: users[1].id },
  });
  check(
    r.queued >= 1 && n2?.title === `${topic!.name}: on soru` && n2.route === `topic:${topic!.id}`,
    'weak_topic: konu adı ve topic:<id> rotası',
  );
  check(
    (await prisma.notification.count({
      where: { automationCode: 'weak_topic', userId: users[2].id },
    })) === 0,
    'zayıf konusu olmayan adaya gitmedi',
  );

  // 3) Kişisel rekor olayı
  const pr = await prisma.notificationAutomation.findUniqueOrThrow({
    where: { code: 'personal_record' },
  });
  await automations.setStatus(pr.id, 'active', actor);
  const prRow = (await prisma.notificationAutomation.findUnique({
    where: { code: 'personal_record' },
  }))!;
  await events.emit('exam_submitted', users[3].id, {
    payload: {
      sessionId: '00000000-0000-0000-0000-00000000eeee',
      net: 71.25,
      before: 65,
      personalBest: true,
    },
  });
  await events.emit('exam_submitted', users[4].id, {
    payload: {
      sessionId: '00000000-0000-0000-0000-00000000ffff',
      net: 50,
      before: 65,
      personalBest: false,
    },
  });
  const er = await automations.runEvents(prRow, new Date(), {});
  const n3 = await prisma.notification.findFirst({ where: { automationCode: 'personal_record' } });
  check(
    er?.queued === 1 &&
      n3?.userId === users[3].id &&
      n3.title === 'Kişisel rekor: 71,25 net' &&
      n3.body.includes('65'),
    'personal_record yalnız rekorda, {{net}}/{{onceki_net}} doldu',
  );

  // 4) AI öneri kullanılabilirliği (anahtar yoksa 503 beklenir)
  console.log(
    `· AI öneri servisi: ${suggest.available ? 'anahtar var' : 'anahtar yok (503 döner)'}`,
  );

  // Temizlik
  for (const code of ['weak_topic', 'personal_record'])
    await prisma.notificationAutomation.update({
      where: { code },
      data: { status: 'paused', lastRunAt: null },
    });
  await prisma.notificationCampaign.delete({ where: { id: c.id } });
  await prisma.appEvent.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52f3-' } } });
  if (tmpCourse) {
    await prisma.topic.deleteMany({ where: { courseId: tmpCourse } });
    await prisma.course.delete({ where: { id: tmpCourse } });
  }
  console.log('\nF3 duman testi tamam.');
  await app.close();
}

async function expectThrow(fn: () => Promise<unknown>, msg: string) {
  try {
    await fn();
  } catch {
    console.log(`✓ ${msg}`);
    return;
  }
  throw new Error(`KONTROL BAŞARISIZ: ${msg}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
