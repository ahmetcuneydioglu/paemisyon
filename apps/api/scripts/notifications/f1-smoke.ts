/**
 * Doc 52 F1 duman testi — motoru GERÇEK bir Postgres'te uçtan uca çalıştırır
 * (geçici Docker veritabanı; prod'a dokunmaz). Çalıştırma:
 *   DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon \
 *   NOTIFICATIONS_PROVIDER=console NOTIFICATIONS_WORKER=0 \
 *   npx ts-node -r tsconfig-paths/register scripts/notifications/f1-smoke.ts
 * Adımlar: kullanıcı + token + ayar → enqueue (normal, sessiz saat, tekrar,
 * kategori kapalı, cihazsız) → kitle yenileme → kampanya (tahmin, prova, test,
 * send_now) → işçi tick (console sağlayıcı) → kutu/olay/okundu → rollup → temizlik.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { AudienceService } from '../../src/modules/notifications/audience.service';
import { CampaignsService } from '../../src/modules/notifications/campaigns.service';
import { DeliveryWorker } from '../../src/modules/notifications/delivery.worker';
import { RollupService } from '../../src/modules/notifications/rollup.service';
import { TestersService } from '../../src/modules/notifications/testers.service';
import { SETTING_KEYS, SettingsService } from '../../src/infra/settings/settings.service';

function check(cond: unknown, msg: string) {
  if (!cond) throw new Error(`KONTROL BAŞARISIZ: ${msg}`);
  console.log(`✓ ${msg}`);
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const notifications = app.get(NotificationsService);
  const audience = app.get(AudienceService);
  const campaigns = app.get(CampaignsService);
  const worker = app.get(DeliveryWorker);
  const rollup = app.get(RollupService);
  const testers = app.get(TestersService);
  const settings = app.get(SettingsService);

  // Temiz başlangıç
  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52-' } } });
  const u1 = await prisma.user.create({
    data: {
      email: 'doc52-ahmet@test.local',
      displayName: 'Ahmet Can',
      status: 'active',
      onboardingCompletedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });
  const u2 = await prisma.user.create({
    data: { email: 'doc52-nodevice@test.local', displayName: 'Cihazsız Aday', status: 'active' },
  });
  const u3 = await prisma.user.create({
    data: { email: 'doc52-kapali@test.local', displayName: 'Kapalı Aday', status: 'active' },
  });
  await prisma.pushToken.create({
    data: { token: 'tok-ahmet-ios-0001', userId: u1.id, platform: 'ios', deviceId: 'dev-1' },
  });
  await prisma.pushToken.create({
    data: { token: 'tok-ahmet-web-0001', userId: u1.id, platform: 'web' },
  });
  await prisma.pushToken.create({
    data: { token: 'tok-kapali-web-001', userId: u3.id, platform: 'web' },
  });
  // u1/u2/u3: sessiz saat kapalı (start=end) — işçi anında göndersin; u4: varsayılan sessiz saat (gece testi).
  for (const u of [u1, u2, u3])
    await prisma.userNotificationSettings.create({
      data: {
        userId: u.id,
        quietStart: '00:00',
        quietEnd: '00:00',
        categories: u.id === u3.id ? { exam: false } : {},
      },
    });
  const u4 = await prisma.user.create({
    data: { email: 'doc52-gece@test.local', displayName: 'Gece Adayı', status: 'active' },
  });
  await prisma.pushToken.create({
    data: { token: 'tok-gece-and-0001', userId: u4.id, platform: 'android' },
  });
  await prisma.streak.create({ data: { userId: u1.id, currentStreak: 5, longestStreak: 9 } });
  const actor = { id: u1.id, email: u1.email, roles: ['admin'], isPremium: false };

  // 1) enqueue — normal (öğleden sonra, sessiz saat dışı)
  const noon = new Date(); // sessiz saat kapalı; gerçek an
  const r1 = await notifications.enqueue({
    userId: u1.id,
    category: 'exam',
    title: 'Sonucun açıklandı',
    body: '{{ad}}, Haftalık Deneme 12: 61,25 net.',
    deepLink: { target: 'exams' },
    channels: ['push', 'inbox'],
    dedupeKey: 'smoke:1',
    now: noon,
  });
  check(r1.status === 'queued', `enqueue normal → queued (${JSON.stringify(r1)})`);
  const n1 = await prisma.notification.findUniqueOrThrow({
    where: { id: (r1 as { notificationId: string }).notificationId },
    include: { deliveries: true },
  });
  check(n1.body.startsWith('Ahmet,'), `şablon {{ad}} dolduruldu: "${n1.body}"`);
  check(
    n1.deliveries.filter((d) => d.channel === 'push' && d.status === 'queued').length === 2,
    'iki aktif cihaz için iki push teslimi',
  );
  check(n1.webPath === '/denemeler' && n1.route === 'denemeler', 'deep link rota + web yolu');

  // 2) tekrar (dedupe)
  const r2 = await notifications.enqueue({
    userId: u1.id,
    category: 'exam',
    title: 'Sonucun açıklandı',
    body: 'x',
    channels: ['push'],
    dedupeKey: 'smoke:1',
    now: noon,
  });
  check(r2.status === 'dropped' && r2.reason === 'duplicate', 'aynı dedupeKey → duplicate');

  // 3) sessiz saat (TR 23:30): normal ertelenir
  const night = new Date();
  night.setUTCHours(20, 30, 0, 0);
  const r3 = await notifications.enqueue({
    userId: u4.id,
    category: 'exam',
    title: 'Gece',
    body: 'y',
    channels: ['push', 'inbox'],
    dedupeKey: 'smoke:3',
    now: night,
  });
  check(
    r3.status === 'queued' &&
      (r3 as { channels: Record<string, string> }).channels.push === 'defer',
    `sessiz saatte push ertelendi (${JSON.stringify((r3 as { channels: unknown }).channels)})`,
  );
  const n3 = await prisma.notification.findUniqueOrThrow({
    where: { id: (r3 as { notificationId: string }).notificationId },
  });
  check(n3.scheduledAt.getTime() > night.getTime(), 'kutu scheduledAt sessiz saat bitimine alındı');

  // 4) kategori kapalı
  const r4 = await notifications.enqueue({
    userId: u3.id,
    category: 'exam',
    title: 'Kapalı',
    body: 'z',
    channels: ['push', 'inbox'],
    dedupeKey: 'smoke:4',
    now: noon,
  });
  check(r4.status === 'suppressed', `kategori kapalı → suppressed (${r4.status})`);

  // 5) cihazsız → yalnız kutu
  const r5 = await notifications.enqueue({
    userId: u2.id,
    category: 'exam',
    title: 'Cihazsız',
    body: 'w',
    channels: ['push', 'inbox'],
    dedupeKey: 'smoke:5',
    now: noon,
  });
  check(r5.status === 'inbox_only', `cihaz yok → inbox_only (${r5.status})`);
  const n5 = await prisma.notification.findUniqueOrThrow({
    where: { id: (r5 as { notificationId: string }).notificationId },
  });
  check(n5.deliveryStatus === 'no_device', 'deliveryStatus no_device');

  // 6) emoji reddi
  let emojiRejected = false;
  try {
    await notifications.enqueue({
      userId: u1.id,
      category: 'exam',
      title: 'Selam 🔥',
      body: 'x',
      channels: ['push'],
      now: noon,
    });
  } catch {
    emojiRejected = true;
  }
  check(emojiRejected, 'emoji içeren metin reddedildi');

  // 7) kitle yenileme
  const rows = await audience.refresh(null);
  check(rows >= 4, `kitle tablosu yazıldı: ${rows} satır`);
  const a1 = await prisma.notificationAudience.findUniqueOrThrow({ where: { userId: u1.id } });
  check(
    a1.pushEnabled && a1.pushPlatforms.includes('ios') && a1.streakCurrent === 5,
    `kitle: push ${a1.pushPlatforms.join('/')}, seri ${a1.streakCurrent}, bugün gönderilen ${a1.notificationsSentToday}`,
  );

  // 8) kampanya: tester + tahmin + prova + test + send_now
  await testers.add(u1.email, u1.id);
  const c = await campaigns.create(
    {
      name: 'Smoke kampanya',
      category: 'new_content',
      title: 'Yeni sorular eklendi',
      body: '{{ad}}, 100 yeni soru seni bekliyor.',
      channels: ['push', 'inbox'],
      audienceMode: 'segment',
      segmentRules: {
        op: 'and',
        rules: [{ field: 'pushPlatforms', cmp: 'contains_any', value: ['ios', 'web'] }],
      },
      sendMode: 'now',
    } as never,
    actor,
  );
  const est = await campaigns.estimate({ ...c, channels: c.channels });
  check(
    est.total === 2,
    `segment tahmini: ${est.total} (iOS/web cihazlı 2 kullanıcı; Android'li gece adayı dışarıda)`,
  );
  const pv = await campaigns.preview(c.id);
  check(
    pv.sample.length === 2 && pv.rendered.title === 'Yeni sorular eklendi',
    'prova örnek + metin',
  );
  const t = await campaigns.testSend(c.id, actor);
  check(t.sent === 1, `test gönderimi testerlara: ${t.sent}`);
  let wrongConfirm = false;
  try {
    await campaigns.transition(c.id, 'send_now', actor, 99);
  } catch {
    wrongConfirm = true;
  }
  check(wrongConfirm, 'yanlış alıcı sayısıyla ikinci onay reddedildi');
  await campaigns.transition(c.id, 'send_now', actor, est.total);

  // 9) işçi tick (console sağlayıcı): kampanya açılır, teslimler gönderilir
  const t1 = await worker.tick();
  check(t1.materialized === 2, `kampanya kitleye açıldı: ${t1.materialized}`);
  const t2 = await worker.tick();
  check(t1.sent + t2.sent >= 3, `teslim gönderildi (console): ${t1.sent + t2.sent}`);
  const cc = await prisma.notificationCampaign.findUniqueOrThrow({ where: { id: c.id } });
  check(
    cc.status === 'sent' && cc.sentCount === 3,
    `kampanya durumu ${cc.status}, sentCount ${cc.sentCount} (test gönderimi sayılmaz)`,
  );
  const deferred = await prisma.notificationDelivery.findMany({
    where: { notificationId: n3.id, channel: 'push' },
  });
  check(
    deferred.every((d) => d.status === 'queued'),
    'ertelenen push henüz gönderilmedi (nextAttemptAt ileride)',
  );

  // 10) kutu, okundu, olay, sayaç
  const inbox = await notifications.inbox(u1.id, { limit: 10 });
  check(
    inbox.items.some((i) => i.id === n1.id),
    `kutu listesi (${inbox.items.length} satır)`,
  );
  const inbox4 = await notifications.inbox(u4.id, { limit: 10 });
  check(!inbox4.items.some((i) => i.id === n3.id), 'ertelenen bildirim kutuda henüz görünmez');
  const unread = await notifications.unreadCount(u1.id);
  check(unread >= 1, `okunmamış: ${unread}`);
  await notifications.recordEvent(u1.id, n1.id, {
    type: 'opened',
    source: 'push',
    platform: 'ios',
    appVersion: '2.0.0',
  });
  const n1b = await prisma.notification.findUniqueOrThrow({ where: { id: n1.id } });
  check(!!n1b.openedAt && !!n1b.readAt, 'opened olayı openedAt + readAt yazdı');
  await notifications.readAll(u1.id);
  check((await notifications.unreadCount(u1.id)) === 0, 'tümünü okundu say');

  // 11) tercih güncelleme + system kapatılamaz
  await notifications.updateSettings(u1.id, {
    categories: { streak: false },
    reminderTime: '21:00',
  });
  let sysRejected = false;
  try {
    await notifications.updateSettings(u1.id, { categories: { system: false } });
  } catch {
    sysRejected = true;
  }
  check(sysRejected, 'system kategorisi kapatılamaz');
  const s1 = await notifications.settings(u1.id);
  check(s1.categories.streak === false && s1.reminderTime === '21:00', 'tercihler kaydedildi');

  // 12) kill switch
  await settings.set(SETTING_KEYS.notificationsKillSwitch, 'true');
  const rk = await notifications.enqueue({
    userId: u1.id,
    category: 'exam',
    title: 'Kapalı',
    body: 'k',
    channels: ['push'],
    now: noon,
  });
  check(rk.status === 'dropped' && rk.reason === 'kill_switch', 'kill switch her şeyi düşürür');
  await settings.set(SETTING_KEYS.notificationsKillSwitch, 'false');

  // 13) rollup + temizlik SQL'leri çalışır
  const rr = await rollup.rollupDay(new Date());
  check(rr >= 1, `günlük özet satırı: ${rr}`);
  const pg = await rollup.purge();
  check(typeof pg.inbox === 'number', `temizlik çalıştı: ${JSON.stringify(pg)}`);

  // Temizlik
  await prisma.notificationCampaign.deleteMany({ where: { name: { startsWith: 'Smoke' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52-' } } });
  await app.close();
  console.log('\nDoc 52 F1 duman testi TAMAM.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
