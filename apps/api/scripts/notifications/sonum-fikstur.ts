/**
 * Doc 52/08 — sönüm (decay) katmanı uygulama içi etkinlik düzeltmesi: yerel
 * Docker Postgres'te prod örüntüsünü kurar ve kitle yenilemesini çalıştırır.
 * Prod'a DOKUNMAZ. Çalıştırma:
 *   DATABASE_URL=postgresql://postgres:doc52@localhost:55433/paemisyon \
 *   NOTIFICATIONS_PROVIDER=console NOTIFICATIONS_WORKER=0 \
 *   npx ts-node -r tsconfig-paths/register scripts/notifications/sonum-fikstur.ts
 *
 * Kurulan örüntü (10 Kas 2026 prod sayımı: 59 tier-2 kullanıcıdan 13'ü aktif):
 *   - 13 "aktif ama push açmamış": 30 günde ≥5 push, hiç opened/clicked yok,
 *     son 7 günde ≥20 cevap (biri günde ~105 soru çözen web-push'lu aday).
 *   - 46 "gerçekten sönmüş": ≥5 push, açılma yok, cevap yok → 2'de kalmalı.
 *   - 1 "az cevaplı ama dün çözmüş": 3 cevap, son 1 gün → 0'a inmeli.
 *   - 1 "eski cevap": 19 cevap, sonuncusu 5 gün önce → 2'de kalmalı (eşik altı).
 *   - 1 tier-1 adayı: 7 günde 5 push, 10 gün önce açmış, cevap yok → 1.
 * Her satır için eski kural (yalnız push açma) ile yeni kural yan yana basılır.
 */
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { AudienceService } from '../../src/modules/notifications/audience.service';

const PREFIX = 'doc52s-';
const DAY = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * DAY);

type Profil = {
  tag: string;
  n: number;
  pushes30d: number;
  pushes7d: number;
  openedDaysAgo: number | null;
  answers7d: number;
  lastAnswerDaysAgo: number | null;
  platform: 'web' | 'ios';
  bekle: 0 | 1 | 2;
};

const PROFILLER: Profil[] = [
  {
    tag: 'aktif-web',
    n: 6,
    pushes30d: 12,
    pushes7d: 5,
    openedDaysAgo: null,
    answers7d: 105 * 7,
    lastAnswerDaysAgo: 0,
    platform: 'web',
    bekle: 0,
  },
  {
    tag: 'aktif-ios',
    n: 7,
    pushes30d: 8,
    pushes7d: 3,
    openedDaysAgo: null,
    answers7d: 25,
    lastAnswerDaysAgo: 4,
    platform: 'ios',
    bekle: 0,
  },
  {
    tag: 'sonmus',
    n: 46,
    pushes30d: 9,
    pushes7d: 2,
    openedDaysAgo: null,
    answers7d: 0,
    lastAnswerDaysAgo: null,
    platform: 'ios',
    bekle: 2,
  },
  {
    tag: 'az-ama-dun',
    n: 1,
    pushes30d: 7,
    pushes7d: 2,
    openedDaysAgo: null,
    answers7d: 3,
    lastAnswerDaysAgo: 1,
    platform: 'web',
    bekle: 0,
  },
  {
    tag: 'eski-cevap',
    n: 1,
    pushes30d: 7,
    pushes7d: 2,
    openedDaysAgo: null,
    answers7d: 19,
    lastAnswerDaysAgo: 5,
    platform: 'ios',
    bekle: 2,
  },
  {
    tag: 'tier1',
    n: 1,
    pushes30d: 6,
    pushes7d: 5,
    openedDaysAgo: 10,
    answers7d: 0,
    lastAnswerDaysAgo: null,
    platform: 'ios',
    bekle: 1,
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const audience = app.get(AudienceService);

  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  const ids: { id: string; tag: string; bekle: number }[] = [];
  for (const p of PROFILLER) {
    for (let i = 0; i < p.n; i++) {
      const u = await prisma.user.create({
        data: {
          email: `${PREFIX}${p.tag}-${i}@test.local`,
          displayName: `${p.tag} ${i}`,
          status: 'active',
          onboardingCompletedAt: ago(60),
          lastActiveAt: p.lastAnswerDaysAgo === null ? ago(40) : ago(p.lastAnswerDaysAgo),
        },
      });
      ids.push({ id: u.id, tag: p.tag, bekle: p.bekle });
      await prisma.pushToken.create({
        data: { token: `tok-${PREFIX}${p.tag}-${i}`, userId: u.id, platform: p.platform },
      });
      // Push gönderimleri: 30 gün içinde pushes30d adet, bunların pushes7d'si son 7 günde.
      for (let k = 0; k < p.pushes30d; k++) {
        const sentAt = k < p.pushes7d ? ago(1 + (k % 6)) : ago(8 + (k % 20));
        const n = await prisma.notification.create({
          data: {
            userId: u.id,
            category: 'exam',
            title: 'Deneme',
            body: 'Fikstür',
            channels: ['push', 'inbox'],
            deliveryStatus: 'sent',
            createdAt: sentAt,
            scheduledAt: sentAt,
          },
        });
        await prisma.notificationDelivery.create({
          data: {
            notificationId: n.id,
            userId: u.id,
            channel: 'push',
            target: `tok-${PREFIX}${p.tag}-${i}`,
            status: 'sent',
            sentAt,
          },
        });
        if (k === 0 && p.openedDaysAgo !== null)
          await prisma.notificationEvent.create({
            data: {
              notificationId: n.id,
              userId: u.id,
              eventType: 'opened',
              source: p.platform === 'web' ? 'web' : 'push',
              occurredAt: ago(p.openedDaysAgo),
            },
          });
      }
      // Cevaplar: answers7d adet, sonuncusu lastAnswerDaysAgo gün önce, gerisi 7 gün içine yayılı.
      if (p.answers7d > 0 && p.lastAnswerDaysAgo !== null) {
        const s = await prisma.quizSession.create({
          data: {
            userId: u.id,
            mode: 'practice',
            totalQuestions: p.answers7d,
            status: 'completed',
            startedAt: ago(6.9),
          },
        });
        const rows = Array.from({ length: p.answers7d }, (_, j) => ({
          sessionId: s.id,
          questionId: randomUUID(),
          questionVersionId: randomUUID(),
          isCorrect: j % 2 === 0,
          answeredAt:
            j === 0
              ? ago(p.lastAnswerDaysAgo as number)
              : new Date(
                  ago(6.9).getTime() +
                    ((6.9 - (p.lastAnswerDaysAgo as number)) * DAY * j) / p.answers7d,
                ),
        }));
        await prisma.quizAnswer.createMany({ data: rows });
      }
    }
  }
  console.log(`Fikstür kuruldu: ${ids.length} kullanıcı.`);

  const yazilan = await audience.refresh(null);
  console.log(`Kitle yenilendi: ${yazilan} satır.`);

  // Eski kural (yalnız push açma) ile yeni kuralı yan yana say.
  const rows = await prisma.$queryRaw<
    { tag: string; eski: number; yeni: number; n: number; a7: number }[]
  >`
    SELECT regexp_replace(u.email, '^' || ${PREFIX} || '(.*)-[0-9]+@.*$', '\\1') AS tag,
           CASE
             WHEN ps.sent30 >= 5 AND (po.last_open IS NULL OR po.last_open < now() - interval '30 days') THEN 2
             WHEN ps.sent7 >= 5 AND (po.last_open IS NULL OR po.last_open < now() - interval '7 days') THEN 1
             ELSE 0 END AS eski,
           na.engagement_tier AS yeni, count(*)::int AS n, min(na.answered_7d)::int AS a7
    FROM users u
    JOIN notification_audience na ON na.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT count(*) FILTER (WHERE d.sent_at >= now() - interval '7 days')::int AS sent7,
             count(*) FILTER (WHERE d.sent_at >= now() - interval '30 days')::int AS sent30
      FROM notification_deliveries d WHERE d.user_id = u.id AND d.channel = 'push' AND d.status = 'sent') ps ON true
    LEFT JOIN LATERAL (
      SELECT max(ev.occurred_at) AS last_open FROM notification_events ev
      WHERE ev.user_id = u.id AND ev.event_type IN ('opened','clicked')) po ON true
    WHERE u.email LIKE ${PREFIX + '%'}
    GROUP BY 1, 2, 3 ORDER BY 1`;
  console.log('\nprofil            eski→yeni  kişi  min answered_7d');
  for (const r of rows)
    console.log(
      `${r.tag.padEnd(18)} ${r.eski} → ${r.yeni}      ${String(r.n).padStart(3)}   ${r.a7}`,
    );

  let hata = 0;
  for (const p of PROFILLER) {
    const got = rows.filter((r) => r.tag === p.tag);
    const ok = got.length === 1 && got[0].yeni === p.bekle && got[0].n === p.n;
    if (!ok) hata++;
    console.log(`${ok ? '✓' : '✗'} ${p.tag}: beklenen tier ${p.bekle}, ${p.n} kişi`);
  }
  const duzelen = rows.filter((r) => r.eski === 2 && r.yeni === 0).reduce((a, r) => a + r.n, 0);
  console.log(`\nEski kuralda tier 2 iken yeni kuralda 0'a inen: ${duzelen} kullanıcı.`);

  if (process.env.KEEP !== '1') {
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    console.log('Fikstür temizlendi (KEEP=1 ile bırakılabilir).');
  }
  await app.close();
  if (hata) {
    console.error(`${hata} profil beklenenden saptı.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
