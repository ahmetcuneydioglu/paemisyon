/**
 * Doc 48 Faz 4A kontrol noktası — gerçek veriyle /me/coach yeni alanları.
 *
 * SALT OKUMA: Nest uygulaması AYAĞA KALDIRILMAZ (AppModule cron'ları kaydeder,
 * onlar yazar). CoachService doğrudan, connection_limit=1 bir istemciyle kurulur;
 * brief() yalnız okur.
 *
 * Kullanım:
 *   npx tsx scripts/doc48-brief-kontrol.ts                 # örneklem (4 kullanıcı)
 *   npx tsx scripts/doc48-brief-kontrol.ts a@b.com c@d.com  # belirli hesaplar
 *
 * Çıktıda e-posta ve ad YOK: kullanıcı kimliği kısaltılmış basılır.
 */
import { PrismaClient } from '@prisma/client';
import { CoachService } from '../src/modules/coach/coach.service';
import { SettingsService } from '../src/infra/settings/settings.service';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function ornekKullanicilar(): Promise<string[]> {
  // Her biri farklı bir durumu temsil etsin: premium aktif, ücretsiz aktif,
  // uzun süredir pasif (dönüş), yeni (hiç çözmemiş).
  const rows = await prisma.$queryRaw<{ etiket: string; user_id: string }[]>`
    (SELECT 'premium-aktif' AS etiket, du.user_id FROM daily_usage du
       JOIN entitlements e ON e.user_id = du.user_id AND e.is_premium
      ORDER BY du.usage_date DESC LIMIT 1)
    UNION ALL
    (SELECT 'ucretsiz-aktif', du.user_id FROM daily_usage du
       LEFT JOIN entitlements e ON e.user_id = du.user_id
      WHERE COALESCE(e.is_premium, false) = false
      ORDER BY du.usage_date DESC LIMIT 1)
    UNION ALL
    (SELECT 'donus', s.user_id FROM streaks s
      WHERE s.last_active_date < (now() AT TIME ZONE 'utc')::date - 10
      ORDER BY s.last_active_date DESC LIMIT 1)
    UNION ALL
    (SELECT 'yeni', u.id FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
      WHERE COALESCE(us.total_solved, 0) = 0 AND u.onboarding_completed_at IS NOT NULL
      ORDER BY u.created_at DESC LIMIT 1)`;
  for (const r of rows) console.log(`örneklem ${r.etiket}: ${r.user_id.slice(0, 8)}…`);
  return rows.map((r) => r.user_id);
}

async function main() {
  const emails = process.argv.slice(2);
  const ids = emails.length
    ? (await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } })).map((u) => u.id)
    : await ornekKullanicilar();

  const coach = new CoachService(prisma as never, new SettingsService(prisma as never));
  for (const id of ids) {
    const u = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, entitlement: true },
    });
    if (!u) continue;
    const ent = u.entitlement;
    const isPremium =
      ent?.isPremium === true && (ent.validUntil == null || ent.validUntil > new Date());
    const t0 = Date.now();
    const b = await coach.brief({
      id: u.id,
      email: u.email ?? '',
      roles: u.roles.map((r) => r.role.key),
      isPremium,
    });
    const ms = Date.now() - t0;
    const t = b.todayTask;
    console.log(`\n── ${u.id.slice(0, 8)}… (premium: ${isPremium}) — ${ms} ms`);
    console.log(`  flags.homeV2=${b.flags.homeV2}  mode=${b.mode}  kartlar=[${b.cards.map((c) => c.type).join(', ')}]`);
    console.log(`  exam: ${JSON.stringify(b.exam)}`);
    console.log(`  focus: ${b.focus.kind}${b.focus.label ? ' · ' + b.focus.label : ''}`);
    console.log(`  bugün ${b.today.answered}/${b.today.goal} · hafta ${b.gamification.weekly.activeDays}/${b.gamification.weekly.goalDays}`);
    console.log(`  todayTask: [${t.kind}] ${t.title} — ${t.reason}`);
    console.log(`    eylem: ${t.action.label} ${JSON.stringify({ type: t.action.type, count: t.action.count, recipe: t.action.recipe, source: t.action.source })}`);
    console.log(`    ilerleme: ${t.progress ? t.progress.label : '—'}  ikincil: ${t.secondary ? `${t.secondary.kind} · ${t.secondary.title} · ${t.secondary.subtitle}` : '—'}`);
    console.log(
      `  readiness: ${b.readiness.courses.length} ders [${b.readiness.courses
        .map((c) => `${c.name} ${c.accuracy == null ? '—' : Math.round(c.accuracy * 100) + '%'}/${c.solved} ${c.state}`)
        .join('; ')}]`,
    );
    console.log(
      `  en zayıf: ${b.readiness.weakest.map((w) => `${w.name} %${Math.round(w.accuracy * 100)} (${w.solved})`).join(', ') || '—'}  ·  yanlış: ${b.readiness.unresolvedWrongCount}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
