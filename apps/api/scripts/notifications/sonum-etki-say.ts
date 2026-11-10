/**
 * Doc 52/08 — sönüm düzeltmesi prod'a girmeden ÖNCE kaç kullanıcıyı
 * etkileyeceğini sayar. SALT OKUNUR; hiçbir satır yazmaz. Çalıştırma:
 *   DATABASE_URL='postgresql://...&connection_limit=1' \
 *   npx tsx scripts/notifications/sonum-etki-say.ts
 * Mevcut `engagement_tier` (eski kural) ile yeni kuralın ("aktif" → 0) sonucu
 * karşılaştırılır; eşikler decision.logic.ts'deki sabitlerle aynıdır.
 */
import { PrismaClient } from '@prisma/client';
import {
  ACTIVE_ANSWERS_7D,
  ACTIVE_ANSWER_DAYS,
} from '../../src/modules/notifications/decision.logic';

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.$queryRaw<
    {
      tier: number;
      toplam: number;
      aktif: number;
      aktif_pushlu: number;
      aktif_yalniz_web: number;
      a7d: number;
      son3gun: number;
    }[]
  >`
    WITH son AS (
      SELECT q.user_id, max(a.answered_at) AS last_at
      FROM quiz_answers a JOIN quiz_sessions q ON q.id = a.session_id
      WHERE a.answered_at >= now() - (${ACTIVE_ANSWER_DAYS} || ' days')::interval
      GROUP BY q.user_id
    )
    SELECT na.engagement_tier AS tier,
           count(*)::int AS toplam,
           count(*) FILTER (WHERE na.answered_7d >= ${ACTIVE_ANSWERS_7D} OR son.last_at IS NOT NULL)::int AS aktif,
           count(*) FILTER (WHERE (na.answered_7d >= ${ACTIVE_ANSWERS_7D} OR son.last_at IS NOT NULL) AND na.push_enabled)::int AS aktif_pushlu,
           count(*) FILTER (WHERE (na.answered_7d >= ${ACTIVE_ANSWERS_7D} OR son.last_at IS NOT NULL) AND na.push_platforms = '{web}')::int AS aktif_yalniz_web,
           count(*) FILTER (WHERE na.answered_7d >= ${ACTIVE_ANSWERS_7D})::int AS a7d,
           count(*) FILTER (WHERE son.last_at IS NOT NULL)::int AS son3gun
    FROM notification_audience na
    LEFT JOIN son ON son.user_id = na.user_id
    GROUP BY 1 ORDER BY 1`;
  console.log('tier  toplam  aktif(→0)  aktif+push  aktif yalnız web  ≥20/7g  son3gün');
  for (const r of rows)
    console.log(
      `${String(r.tier).padEnd(5)} ${String(r.toplam).padStart(6)}  ${String(r.aktif).padStart(9)}  ${String(r.aktif_pushlu).padStart(10)}  ${String(r.aktif_yalniz_web).padStart(16)}  ${String(r.a7d).padStart(6)}  ${String(r.son3gun).padStart(7)}`,
    );
  const etki = rows.filter((r) => r.tier > 0).reduce((a, r) => a + r.aktif, 0);
  console.log(`\nYeni kuralla tier 1/2'den 0'a inecek kullanıcı: ${etki}`);

  const olay = await prisma.$queryRaw<
    { event_type: string; source: string; platform: string | null; n: number; son: Date }[]
  >`
    SELECT event_type::text, source::text, platform, count(*)::int AS n, max(occurred_at) AS son
    FROM notification_events WHERE event_type IN ('opened','clicked') GROUP BY 1,2,3 ORDER BY 1,2,3`;
  console.log('\nAçma/tıklama olayları (kaynak/platform):');
  for (const o of olay)
    console.log(
      `  ${o.event_type.padEnd(8)} ${o.source.padEnd(6)} ${(o.platform ?? '-').padEnd(8)} ${o.n}  son: ${o.son.toISOString().slice(0, 10)}`,
    );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
