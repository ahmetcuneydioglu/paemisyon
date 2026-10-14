import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { gunAnahtari, gunBaslangici, gunMetni } from '../../../common/gun';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { SettingsService } from '../../../infra/settings/settings.service';

const GUN_MS = 86_400_000;

/**
 * Tur başlatma kanalı: home_* (yeni anasayfa), notif, diger (katalog vb.).
 * `home_resume` burada görünmez: devam etmek yeni oturum açmaz, tur ilk
 * açıldığı kanalda sayılır ve bitince o satırın "completed"ına yansır.
 */
export interface KaynakGunu {
  /** Uygulama günü (TR 04.00'te döner — common/gun.ts), YYYY-MM-DD. */
  day: string;
  source: string;
  started: number;
  completed: number;
  abandoned: number;
  inProgress: number;
}

/** Ana sayfa turunun kapsamı — odak türleriyle (FocusKind) aynı anahtarlar. */
export type HomeKapsam = 'coach' | 'course' | 'topic' | 'wrongs';

export interface HomeV2Metrics {
  days: number;
  /** Pencerenin ilk uygulama günü. */
  from: string;
  /** Gün × kaynak — alıştırma/tekrar/günlük turlar (deneme hariç). */
  daily: KaynakGunu[];
  /** Ana sayfadan açılan turların kapsamı: odağın gerçek kullanımı. */
  homeScope: { scope: HomeKapsam; started: number; completed: number }[];
  /** Bugünün odak seçimleri (daily_focus yalnız son seçimi tutar; koç = satır yok). */
  focusToday: { kind: string; users: number }[];
  /** Tek aktif tur kuralının sağlığı (Doc 48 B-3/B-4). */
  halfTours: { open: number; usersWithMultiple: number; oldestActivityDays: number | null };
  cohort: { flagOn: boolean; betaOrAdminUsers: number };
}

/**
 * Yeni anasayfa metrikleri (Doc 48 Faz 5) — yalnız okuma. Yeni tablo yok:
 * kaynak (`quiz_sessions.source`), kapsam (`topic_id`/`course_id`/`mode`) ve
 * `daily_focus` anlık görüntüsünden türetilir.
 */
@Injectable()
export class AdminMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async homeV2(days: number, now: Date = new Date()): Promise<HomeV2Metrics> {
    const gun = Number.isFinite(days) ? Math.min(60, Math.max(1, Math.trunc(days))) : 14;
    const from = new Date(gunBaslangici(now).getTime() - (gun - 1) * GUN_MS);

    const [daily, homeScope, focusToday, yarim, flagOn, betaOrAdminUsers] = await Promise.all([
      this.prisma.$queryRaw<KaynakGunu[]>(Prisma.sql`
        SELECT ((qs.started_at - interval '1 hour')::date)::text AS day,
               COALESCE(qs.source, 'diger') AS source,
               count(*)::int AS started,
               count(*) FILTER (WHERE qs.status = 'completed')::int AS completed,
               count(*) FILTER (WHERE qs.status = 'abandoned')::int AS abandoned,
               count(*) FILTER (WHERE qs.status = 'in_progress')::int AS "inProgress"
        FROM quiz_sessions qs
        WHERE qs.started_at >= ${from}
          AND qs.mode IN ('practice', 'review', 'daily')
        GROUP BY 1, 2
        ORDER BY 1, 2`),
      this.prisma.$queryRaw<HomeV2Metrics['homeScope']>(Prisma.sql`
        SELECT CASE
                 WHEN qs.mode = 'review' THEN 'wrongs'
                 WHEN qs.topic_id IS NOT NULL THEN 'topic'
                 WHEN qs.course_id IS NOT NULL THEN 'course'
                 ELSE 'coach'
               END AS scope,
               count(*)::int AS started,
               count(*) FILTER (WHERE qs.status = 'completed')::int AS completed
        FROM quiz_sessions qs
        WHERE qs.started_at >= ${from}
          AND starts_with(qs.source, 'home_')
        GROUP BY 1
        ORDER BY 2 DESC`),
      this.prisma.dailyFocus.groupBy({
        by: ['kind'],
        where: { day: gunAnahtari(now) },
        _count: { _all: true },
      }),
      // Filtre yarım tur cron'u ile aynı (quiz/yarim-tur.service.ts); mod
      // listesi YARIM_TUR_MODLARI — eşitliği spec kilitler.
      this.prisma.$queryRaw<{ open: number; users_with_multiple: number; oldest: Date | null }[]>(
        Prisma.sql`
        WITH tur AS (
          SELECT qs.user_id,
                 COALESCE((SELECT max(qa.answered_at) FROM quiz_answers qa
                           WHERE qa.session_id = qs.id), qs.started_at) AS son
          FROM quiz_sessions qs
          WHERE qs.status = 'in_progress' AND qs.mode IN ('practice', 'review', 'daily')
        )
        SELECT count(*)::int AS open,
               (SELECT count(*)::int FROM (
                  SELECT user_id FROM tur GROUP BY user_id HAVING count(*) > 1) cok
               ) AS users_with_multiple,
               min(son) AS oldest
        FROM tur`,
      ),
      this.settings.mobilAnasayfaV2(),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          roles: { some: { role: { key: { in: ['admin', 'beta'] } } } },
        },
      }),
    ]);

    const y = yarim[0];
    return {
      days: gun,
      from: gunMetni(from),
      daily,
      homeScope,
      focusToday: focusToday.map((f) => ({ kind: f.kind, users: f._count._all })),
      halfTours: {
        open: y?.open ?? 0,
        usersWithMultiple: y?.users_with_multiple ?? 0,
        oldestActivityDays: y?.oldest
          ? Math.floor((now.getTime() - new Date(y.oldest).getTime()) / GUN_MS)
          : null,
      },
      cohort: { flagOn, betaOrAdminUsers },
    };
  }
}
