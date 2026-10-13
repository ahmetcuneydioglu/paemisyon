/**
 * Günlük sayaç geri doldurma (14 Eki 2026, mobil anasayfa Faz 0 — B1b).
 *
 * 14 Eki 2026'ya kadar QuizService'in günlük sayacı premium kullanıcıda erken
 * dönüyordu: daily_usage.questions_answered premium günlerde hiç yazılmadı.
 * Bugün halkası, haftalık aktif gün, 14 günlük şerit, rütbe, maxDailyQuestions
 * rekoru ve liderlik XP'si bu satırdan okunduğu için hepsi eksik kaldı
 * (ölçüm: 19 kullanıcı, 141 gün, 8.536 soru).
 *
 * Kaynak: quiz_answers ⨝ quiz_sessions — canlı sayaçla AYNI kapsam: deneme ve
 * exam hariç, oturum+soru başına tek satır (yeniden cevap sayılmaz), gün =
 * answered_at'in UTC günü (sayaç da UTC gününe yazar).
 * Yazma: GREATEST(mevcut, sayım) — yalnız eksik günler artar, hiçbir sayı
 * azalmaz; idempotent, tekrar çalıştırmak güvenli.
 *
 *   APPLY=1 ile yazar; onsuz dry-run (etkilenen kullanıcı/gün + en büyük 10 fark).
 *   DB penceresi kuralı: connection_limit=1 (CLAUDE.md).
 */
import { PrismaClient } from '@prisma/client';
import { FREE_DAILY_LIMIT_FALLBACK } from '../src/common/plan.constants';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const APPLY = process.env.APPLY === '1';

interface EksikGun {
  user_id: string;
  gun: Date;
  sayim: number;
  mevcut: number;
  premium: boolean;
}

async function main() {
  const eksik = await prisma.$queryRaw<EksikGun[]>`
    WITH sayim AS (
      SELECT qs.user_id, qa.answered_at::date AS gun, count(*)::int AS n
      FROM quiz_answers qa
      JOIN quiz_sessions qs ON qs.id = qa.session_id
      WHERE qs.mode NOT IN ('deneme', 'exam')
      GROUP BY 1, 2
    )
    SELECT s.user_id, s.gun, s.n AS sayim,
           COALESCE(du.questions_answered, 0)::int AS mevcut,
           COALESCE(e.is_premium AND (e.valid_until IS NULL OR e.valid_until > now()), false)
             AS premium
    FROM sayim s
    LEFT JOIN daily_usage du ON du.user_id = s.user_id AND du.usage_date = s.gun
    LEFT JOIN entitlements e ON e.user_id = s.user_id
    WHERE s.n > COALESCE(du.questions_answered, 0)
    ORDER BY s.n - COALESCE(du.questions_answered, 0) DESC`;

  const kullanicilar = new Set(eksik.map((r) => r.user_id));
  const premiumKullanici = new Set(eksik.filter((r) => r.premium).map((r) => r.user_id));
  const yeniSatir = eksik.filter((r) => r.mevcut === 0).length;
  const toplamFark = eksik.reduce((t, r) => t + (r.sayim - r.mevcut), 0);

  console.log(`Eksik sayaçlı kullanıcı: ${kullanicilar.size} (şu an premium: ${premiumKullanici.size})`);
  console.log(`Eksik gün: ${eksik.length} (satırı hiç olmayan/0: ${yeniSatir}, kısmi: ${eksik.length - yeniSatir})`);
  console.log(`Sayaca eklenecek soru: ${toplamFark}`);
  console.log('\nEn büyük 10 fark (kullanıcı kimliği kısaltılmış):');
  for (const r of eksik.slice(0, 10)) {
    const gun = r.gun.toISOString().slice(0, 10);
    console.log(
      `  ${r.user_id.slice(0, 8)}…  ${gun}  ${r.mevcut} → ${r.sayim}` +
        (r.premium ? '  (premium)' : ''),
    );
  }

  if (!APPLY) {
    console.log('\nDry-run: hiçbir şey yazılmadı. Yazmak için APPLY=1.');
    return;
  }

  const yazilan = await prisma.$executeRaw`
    INSERT INTO daily_usage (user_id, usage_date, questions_answered, daily_limit)
    SELECT qs.user_id, qa.answered_at::date, count(*)::int, ${FREE_DAILY_LIMIT_FALLBACK}
    FROM quiz_answers qa
    JOIN quiz_sessions qs ON qs.id = qa.session_id
    WHERE qs.mode NOT IN ('deneme', 'exam')
    GROUP BY 1, 2
    ON CONFLICT (user_id, usage_date) DO UPDATE
      SET questions_answered = EXCLUDED.questions_answered
      WHERE daily_usage.questions_answered < EXCLUDED.questions_answered`;
  console.log(`\nYazıldı: ${yazilan} satır (eklenen + yükseltilen).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
