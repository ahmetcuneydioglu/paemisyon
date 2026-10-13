/**
 * Yarım tur birikimini eritme (Doc 48 B-5, 14 Eki 2026 kararı: dry-run sonrası
 * geriye dönük işleme).
 *
 * Kapsam: durumu in_progress olan alıştırma/yanlış/günlük turları. Her kullanıcının
 * son 7 gün içinde hareket görmüş EN YENİ turu açık kalır (devam edilebilir — tek
 * aktif tur); diğerlerinin hepsi kapanır. Çözülen cevaplar emek olarak yazılır
 * (user_stats solved/correct, konu ilerlemesi, yanlış listesi); tur sayısına,
 * skora, rozete ve seriye GİRMEZ. Çekirdek servisle ve cron'la aynı:
 * src/modules/quiz/yarim-tur.ts → turuTerkEt (atomik sahiplenme, idempotent).
 *
 *   APPLY=1 ile yazar; onsuz dry-run (tur/cevap/kullanıcı sayısı, en büyük 10 fark).
 *   DB penceresi kuralı: connection_limit=1, lokal backend kapalı (CLAUDE.md).
 */
import { PrismaClient } from '@prisma/client';
import { ProgressService } from '../src/modules/progress/progress.service';
import { BAYAT_TUR_GUN, turuTerkEt } from '../src/modules/quiz/yarim-tur';

const base = process.env.DATABASE_URL!;
const url = base.includes('connection_limit')
  ? base.replace(/connection_limit=\d+/, 'connection_limit=1')
  : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1`;
const prisma = new PrismaClient({ datasources: { db: { url } } });
const APPLY = process.env.APPLY === '1';

interface Hedef {
  id: string;
  user_id: string;
  gecerli: number;
  dogru: number;
  yanlis: number;
}

async function main() {
  // Turun soru setindeki (question_order) cevaplar geçerlidir — tamamlamayla aynı kural.
  const hedefler = await prisma.$queryRaw<Hedef[]>`
    WITH tur AS (
      SELECT qs.id, qs.user_id, qs.question_order,
             COALESCE((SELECT max(qa.answered_at) FROM quiz_answers qa WHERE qa.session_id = qs.id),
                      qs.started_at) AS son
      FROM quiz_sessions qs
      WHERE qs.status = 'in_progress' AND qs.mode IN ('practice', 'review', 'daily')
    ),
    sirali AS (
      SELECT tur.*, row_number() OVER (PARTITION BY user_id ORDER BY son DESC) AS sira FROM tur
    )
    SELECT s.id, s.user_id,
           count(qa.*) FILTER (WHERE s.question_order IS NULL
              OR qa.question_version_id::text IN (SELECT jsonb_array_elements_text(s.question_order)))::int AS gecerli,
           count(qa.*) FILTER (WHERE qa.is_correct = true AND (s.question_order IS NULL
              OR qa.question_version_id::text IN (SELECT jsonb_array_elements_text(s.question_order))))::int AS dogru,
           count(qa.*) FILTER (WHERE qa.is_correct = false AND qa.selected_option_id IS NOT NULL AND (s.question_order IS NULL
              OR qa.question_version_id::text IN (SELECT jsonb_array_elements_text(s.question_order))))::int AS yanlis
    FROM sirali s
    LEFT JOIN quiz_answers qa ON qa.session_id = s.id
    -- Kullanıcının en yeni turu, son 7 günde hareket gördüyse açık kalır.
    WHERE NOT (s.sira = 1 AND s.son >= now() - make_interval(days => ${BAYAT_TUR_GUN}::int))
    GROUP BY s.id, s.user_id`;

  const kullanicilar = new Map<string, { tur: number; cozulen: number; dogru: number }>();
  for (const h of hedefler) {
    const k = kullanicilar.get(h.user_id) ?? { tur: 0, cozulen: 0, dogru: 0 };
    k.tur += 1;
    k.cozulen += h.dogru + h.yanlis;
    k.dogru += h.dogru;
    kullanicilar.set(h.user_id, k);
  }
  const cevapli = hedefler.filter((h) => h.gecerli > 0);
  const toplamCozulen = [...kullanicilar.values()].reduce((t, k) => t + k.cozulen, 0);
  const toplamDogru = [...kullanicilar.values()].reduce((t, k) => t + k.dogru, 0);
  const emekKazanan = [...kullanicilar.values()].filter((k) => k.cozulen > 0).length;

  console.log(`Kapanacak yarım tur: ${hedefler.length} (cevaplı: ${cevapli.length}, cevapsız: ${hedefler.length - cevapli.length})`);
  console.log(`Etkilenen kullanıcı: ${kullanicilar.size} (emeği istatistiğe girecek: ${emekKazanan})`);
  console.log(`İşlenecek geçerli cevap: ${hedefler.reduce((t, h) => t + h.gecerli, 0)}`);
  console.log(`İstatistiğe eklenecek çözülen: ${toplamCozulen} (doğru: ${toplamDogru})`);
  console.log('\nEn çok emeği yazılacak 10 kullanıcı (kimlik kısaltılmış):');
  const ilk10 = [...kullanicilar.entries()].sort((a, b) => b[1].cozulen - a[1].cozulen).slice(0, 10);
  for (const [id, k] of ilk10) {
    const st = await prisma.userStats.findUnique({ where: { userId: id }, select: { totalSolved: true } });
    const once = st?.totalSolved ?? 0;
    console.log(`  ${id.slice(0, 8)}…  ${k.tur} tur  çözülen ${once} → ${once + k.cozulen}`);
  }

  if (!APPLY) {
    console.log('\nDry-run: hiçbir şey yazılmadı. Yazmak için APPLY=1.');
    return;
  }

  const ilerleme = new ProgressService(prisma as never);
  let kapanan = 0;
  let islenen = 0;
  for (const [i, h] of hedefler.entries()) {
    const r = await turuTerkEt(prisma, ilerleme, h.id);
    if (r.kapandi) {
      kapanan += 1;
      islenen += r.cevap;
    }
    if ((i + 1) % 100 === 0) console.log(`  … ${i + 1}/${hedefler.length}`);
  }
  console.log(`\nKapandı: ${kapanan} tur, işlenen cevap: ${islenen}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
