/**
 * Doc 52 F2 duman testi — otomasyon değerlendiricisini GERÇEK bir Postgres'te uçtan uca koşturur
 * (geçici Docker veritabanı; prod'a dokunmaz). Çalıştırma:
 *   DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon \
 *   NOTIFICATIONS_PROVIDER=console NOTIFICATIONS_WORKER=0 NUDGE_CRON=0 \
 *   npx ts-node -r tsconfig-paths/register scripts/notifications/f2-smoke.ts
 * Adımlar: preset tohumu → kullanıcılar + kitle → zamanlı (daily, user_time, dedupe) →
 * olaylı (sonuç, hatırlatma türü süzgeci, açılış öncesi olay, yayın/broadcast) → atıf → prova/liste → temizlik.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { AppEventsService } from '../../src/modules/notifications/app-events.service';
import { AudienceService } from '../../src/modules/notifications/audience.service';
import { AutomationsService } from '../../src/modules/notifications/automations.service';
import { AUTOMATION_PRESETS } from '../../src/modules/notifications/automation.presets';
import type { AuthenticatedUser } from '../../src/modules/auth/auth.types';
import { trClock } from '../../src/modules/notifications/decision.logic';
import { minutesToHhmm } from '../../src/modules/notifications/automation.logic';

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
  const now = new Date();

  // 0) Preset tohumu
  const all = await prisma.notificationAutomation.findMany();
  check(all.length >= AUTOMATION_PRESETS.length, `preset seti tohumlandı (${all.length})`);
  const byCode = new Map(all.map((a) => [a.code, a]));
  check(byCode.get('exam_result_ready')?.status === 'active', 'exam_result_ready açık doğdu (F1 davranışı kesilmez)');
  check(byCode.get('daily_question')?.status === 'paused', 'daily_question kapalı doğdu');

  // 1) Kullanıcılar + token + kitle
  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52f2-' } } });
  const mk = (i: number) =>
    prisma.user.create({
      data: {
        email: `doc52f2-${i}@example.com`,
        displayName: `F2 Aday ${i}`,
        status: 'active',
        onboardingCompletedAt: now,
        dailyGoal: 20,
        pushTokens: { create: { token: `tok-f2-${i}-${Date.now()}`, platform: 'ios', isActive: true } },
      },
    });
  const [u1, u2] = await Promise.all([mk(1), mk(2)]);
  const actor: AuthenticatedUser = { id: u1.id, email: u1.email, roles: ['admin'], isPremium: false };
  // Sessiz saat testi kirletmesin.
  await prisma.userNotificationSettings.createMany({
    data: [u1.id, u2.id].map((userId) => ({ userId, quietStart: '03:00', quietEnd: '03:00' })),
  });
  await audience.refresh(u1.id);
  await audience.refresh(u2.id);
  const aud = await prisma.notificationAudience.findUnique({ where: { userId: u1.id } });
  check(aud?.pushEnabled && aud.dailyQuestionDoneToday === false, 'kitle satırı: push var, günün sorusu çözülmedi');

  // 2) Zamanlı: daily_question "şimdi çalıştır"
  const dq = byCode.get('daily_question')!;
  await automations.setStatus(dq.id, 'active', actor);
  const dry = await automations.runNow(dq.id, true, actor);
  check(dry.matched >= 2 && dry.queued >= 2, `daily_question kuru koşu: ${dry.matched} eşleşen`);
  const r1 = await automations.runNow(dq.id, false, actor);
  check(r1.queued >= 2, `daily_question gerçek koşu: ${r1.queued} kuyruk`);
  const n1 = await prisma.notification.findMany({ where: { automationCode: 'daily_question', userId: { in: [u1.id, u2.id] } } });
  check(n1.length === 2 && n1.every((n) => n.route === 'daily-quiz' && n.title === 'Günün sorusu hazır'), 'iki kutu satırı, daily-quiz rotası');
  const r2 = await automations.runNow(dq.id, false, actor);
  check(r2.queued === 0 || (await prisma.notification.count({ where: { automationCode: 'daily_question', userId: { in: [u1.id, u2.id] } } })) === 2, 'ikinci koşu tekrar üretmedi (günlük dedupe)');
  const runs = await automations.runs(dq.id);
  check(runs.length >= 2 && runs[0].triggerType === 'schedule', 'koşu kayıtları yazıldı');

  // 3) user_time: hatırlatma saati şu dakika → eşleşir
  const { h, m } = trClock(new Date());
  const hhmm = minutesToHhmm(h * 60 + m);
  await prisma.userNotificationSettings.update({ where: { userId: u1.id }, data: { reminderTime: hhmm } });
  const sr = byCode.get('daily_study_reminder')!;
  await automations.setStatus(sr.id, 'active', actor);
  const r3 = await automations.runNow(sr.id, false, actor);
  const n3 = await prisma.notification.findMany({ where: { automationCode: 'daily_study_reminder', userId: { in: [u1.id, u2.id] } } });
  check(n3.some((n) => n.userId === u1.id) && !n3.some((n) => n.userId === u2.id && hhmm !== '19:00'), `user_time: yalnız saati ${hhmm} olan aday (${r3.queued} kuyruk)`);
  check(n3.find((n) => n.userId === u1.id)?.body.includes('20 soru kaldı'), 'değişken {{kalan_soru}} dolduruldu');

  // 4) Olaylı: sonuç açıklandı
  const er = byCode.get('exam_result_ready')!;
  await events.emit('exam_result_ready', u1.id, { entityType: 'exam', entityId: '00000000-0000-0000-0000-00000000aaaa', payload: { examId: '00000000-0000-0000-0000-00000000aaaa', sessionId: '00000000-0000-0000-0000-00000000bbbb', title: 'Haftalık Deneme 12' } });
  const e1 = await automations.runEvents(er, new Date(), {});
  check(e1 && e1.queued === 1, 'exam_result_ready olayı bildirim üretti');
  const n4 = await prisma.notification.findFirst({ where: { automationCode: 'exam_result_ready', userId: u1.id } });
  check(n4?.route === 'deneme-sonuc/00000000-0000-0000-0000-00000000bbbb' && n4.body.includes('Haftalık Deneme 12'), 'rota $payload.sessionId ile çözüldü, {{deneme_adi}} doldu');
  check((await automations.runEvents(er, new Date(), {})) === null, 'aynı olay ikinci kez işlenmedi');

  // 5) Olay süzgeci: hour_before yalnız kendi otomasyonuna
  await events.emit('exam_reminder_due', u2.id, { payload: { kind: 'hour_before', examId: '00000000-0000-0000-0000-00000000aaaa', title: 'Haftalık Deneme 13', saat: '21:00' } });
  const day = byCode.get('exam_reminder_day_before')!;
  const hour = byCode.get('exam_reminder_hour_before')!;
  const ed = await automations.runEvents(day, new Date(), {});
  const eh = await automations.runEvents(hour, new Date(), {});
  check(ed?.queued === 0 && eh?.queued === 1, 'kind süzgeci: day_before filtreledi, hour_before gönderdi');
  const n5 = await prisma.notification.findFirst({ where: { automationCode: 'exam_reminder_hour_before', userId: u2.id } });
  check(n5?.priority === 'high' && n5.title.includes('21:00'), 'hour_before yüksek öncelik, saat değişkeni');

  // 6) Açılış öncesi olay işlenmez
  await events.emit('question_report_resolved', u1.id, { payload: { reportId: 'r1', questionId: '00000000-0000-0000-0000-00000000cccc', outcome: 'resolved', message: 'Düzeltildi.' }, occurredAt: new Date(Date.now() - 60_000) });
  await automations.setStatus(byCode.get('question_report_resolved')!.id, 'active', actor);
  const qr = (await prisma.notificationAutomation.findUnique({ where: { code: 'question_report_resolved' } }))!; // açılış anı yazılmış satır
  check((await automations.runEvents(qr, new Date(), {})) === null, 'açılıştan önceki olay işlenmedi (geriye dönük gönderim yok)');
  await events.emit('question_report_resolved', u1.id, { payload: { reportId: 'r2', questionId: '00000000-0000-0000-0000-00000000cccc', outcome: 'dismissed', message: 'Değişiklik gerekmedi.' } });
  const e6 = await automations.runEvents(qr, new Date(), {});
  check(e6?.queued === 1 && (await prisma.notification.findFirst({ where: { automationCode: 'question_report_resolved' } }))?.body === 'Değişiklik gerekmedi.', 'açılış sonrası olay işlendi, {{sonuc}} doldu');

  // 7) Yayın olayı (broadcast): herkese, olay başına tekil
  await automations.setStatus(byCode.get('exam_published')!.id, 'active', actor);
  const ep = (await prisma.notificationAutomation.findUnique({ where: { code: 'exam_published' } }))!;
  await events.emit('exam_published', u1.id, { payload: { examId: '00000000-0000-0000-0000-00000000dddd', title: 'Yeni Deneme', publishMode: 'serbest', questionCount: 100, durationMinutes: 150 } });
  const e7 = await automations.runEvents(ep, new Date(), {});
  const n7 = await prisma.notification.count({ where: { automationCode: 'exam_published', userId: { in: [u1.id, u2.id] } } });
  check(e7 && e7.matched >= 2 && n7 === 2, `broadcast: ${n7} test kullanıcısına açıldı (kitle ${e7?.matched})`);
  check((await prisma.notification.findFirst({ where: { automationCode: 'exam_published' } }))?.body.includes('100 soru, 150 dakika'), 'broadcast değişkenleri doldu');

  // 8) Atıf: session_completed olayı daily_question bildirimine dönüşüm yazar
  await prisma.notification.updateMany({ where: { automationCode: 'daily_question', userId: u1.id }, data: { clickedAt: new Date() } });
  await events.emit('daily_question_completed', u1.id, { payload: {} });
  await automations.sweep(new Date());
  const conv = await prisma.notification.findFirst({ where: { automationCode: 'daily_question', userId: u1.id } });
  check(conv?.convertedAt != null, 'dönüşüm atfı (daily_question_completed → convertedAt)');
  check((await prisma.appEvent.count({ where: { userId: u1.id, processedAt: null } })) === 0, 'olaylar damgalandı (processedAt)');

  // 9) Panel yüzeyleri
  const list = await automations.list();
  const dqRow = list.find((a) => a.code === 'daily_question')!;
  check(dqRow.sent7d >= 2 && dqRow.lastRun != null && dqRow.scheduleSummary === 'Her gün 09:00', 'liste: 7 gün sayaçları ve takvim özeti');
  const pv = await automations.preview(er.id);
  check(pv.rendered.linkResolved && pv.estimate.pendingEvents >= 1, 'prova: olay yükünden bağlantı çözüldü');

  // 10) Hata → duraklatma (bozuk takvim)
  const broken = await prisma.notificationAutomation.update({ where: { id: dq.id }, data: { schedule: { kind: 'daily', at: 'xx' } } });
  for (let i = 0; i < 3; i++) await automations.sweep(new Date()).catch(() => undefined);
  const after = await prisma.notificationAutomation.findUnique({ where: { id: broken.id } });
  check(after?.status === 'paused' && after.consecutiveErrors >= 3, 'üç üst üste hata otomasyonu duraklattı');

  // Temizlik: presetleri başlangıç durumuna döndür
  await prisma.notificationAutomation.update({ where: { id: dq.id }, data: { schedule: { kind: 'daily', at: '09:00' }, status: 'paused', consecutiveErrors: 0, lastError: null, lastRunAt: null } });
  for (const code of ['daily_study_reminder', 'question_report_resolved', 'exam_published'])
    await prisma.notificationAutomation.update({ where: { code }, data: { status: 'paused', lastRunAt: null } });
  await prisma.appEvent.deleteMany({ where: { userId: { in: [u1.id, u2.id] } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'doc52f2-' } } });
  console.log('\nF2 duman testi tamam.');
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
