/**
 * 16 Nisan 2023 EGM Misyon Koruma Sınavı — İngilizce anahtar kayması sonrası yeniden puanlama.
 *
 * Bağlam (10 Kas 2026): içe aktarım 91–100. soruların cevap anahtarını İngilizce yerine Almanca
 * sütunundan okumuştu; 20 sorunun doğru şıkkı resmî anahtarla düzeltildi. Bu betik o sorulara
 * daha önce verilmiş cevapları ve onlardan türeyen özetleri yeni anahtara göre düzeltir:
 *   1. quiz_answers.is_correct — seçilen şıkkın GÜNCEL doğruluğu
 *   2. quiz_sessions.correct_count / wrong_count / score — yalnız bitmiş (completed/abandoned),
 *      deneme olmayan oturumlar; score = correct/total*100 (quiz.service ile aynı formül)
 *   3. user_stats.total_correct — bitmiş oturumlardaki fark kadar
 *   4. user_topic_progress — konu correct_count farkı, mastery = correct/solved
 *   5. wrong_answers — yanlışa dönen: sayaç +1 ve açılır; doğruya dönen: sayaç −1, sıfırsa satır silinir
 * Devam eden (in_progress) oturumlarda yalnız 1. adım uygulanır; özetleri tur bitince servis yazar.
 *
 * Kullanım (apps/api içinden, connection_limit=1 ile):
 *   npx tsx scripts/ingilizce-anahtar-yeniden-puanla.ts            # kuru çalıştırma, yalnız rapor
 *   npx tsx scripts/ingilizce-anahtar-yeniden-puanla.ts --apply    # uygular; önce yedek JSON yazar
 * Yedek: scripts/out/ingilizce-yeniden-puanla-<zaman>.json (etkilenen satırların eski hâli).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const SOURCE_LABEL = '16 NİSAN 2023 EGM MİSYON KORUMA SINAVI';
const TOPIC_NAME = 'İngilizce';
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

type Affected = {
  answer_id: string;
  session_id: string;
  user_id: string;
  question_id: string;
  topic_id: string;
  status: string;
  is_exam: boolean;
  total_questions: number;
  old_ok: boolean | null;
  new_ok: boolean;
  selected: boolean;
};

async function main() {
  const rows = await prisma.$queryRaw<Affected[]>`
    SELECT a.id AS answer_id, a.session_id, s.user_id, a.question_id, q.topic_id,
           s.status::text AS status, (s.exam_id IS NOT NULL) AS is_exam, s.total_questions,
           a.is_correct AS old_ok, COALESCE(o.is_correct, false) AS new_ok,
           (a.selected_option_id IS NOT NULL) AS selected
    FROM quiz_answers a
    JOIN quiz_sessions s ON s.id = a.session_id
    JOIN questions q ON q.id = a.question_id
    JOIN question_versions qv ON qv.id = q.current_version_id
    JOIN topics t ON t.id = q.topic_id
    LEFT JOIN question_options o ON o.id = a.selected_option_id
    WHERE qv.source_label = ${SOURCE_LABEL} AND t.name = ${TOPIC_NAME}
    ORDER BY a.answered_at`;

  const changed = rows.filter((r) => r.selected && (r.old_ok ?? false) !== r.new_ok);
  const finalized = (r: Affected) => (r.status === 'completed' || r.status === 'abandoned') && !r.is_exam;

  // Oturum, kullanıcı ve (kullanıcı, konu) başına doğru-sayısı farkı — yalnız bitmiş oturumlar.
  const bySession = new Map<string, { delta: number; total: number; user: string }>();
  const byUser = new Map<string, number>();
  const byUserTopic = new Map<string, { user: string; topic: string; delta: number }>();
  const wrongPlus: { user: string; question: string }[] = [];
  const wrongMinus: { user: string; question: string }[] = [];
  for (const r of changed) {
    if (!finalized(r)) continue;
    const d = r.new_ok ? 1 : -1;
    const s = bySession.get(r.session_id) ?? { delta: 0, total: r.total_questions, user: r.user_id };
    s.delta += d;
    bySession.set(r.session_id, s);
    byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + d);
    const k = `${r.user_id}|${r.topic_id}`;
    const ut = byUserTopic.get(k) ?? { user: r.user_id, topic: r.topic_id, delta: 0 };
    ut.delta += d;
    byUserTopic.set(k, ut);
    (r.new_ok ? wrongMinus : wrongPlus).push({ user: r.user_id, question: r.question_id });
  }

  console.log(`Etkilenen cevap: ${rows.length}; değişen: ${changed.length} ` +
    `(doğruya dönen ${changed.filter((r) => r.new_ok).length}, yanlışa dönen ${changed.filter((r) => !r.new_ok).length}); ` +
    `bitmiş oturum: ${bySession.size}, kullanıcı: ${byUser.size}, devam eden oturumdaki değişen: ${changed.filter((r) => !finalized(r)).length}`);

  if (!apply) {
    console.log('Kuru çalıştırma — --apply verilmedi.');
    return;
  }

  // Yedek: eski hâller.
  const sessionIds = [...bySession.keys()];
  const userIds = [...byUser.keys()];
  const backup = {
    at: new Date().toISOString(),
    answers: changed,
    sessions: await prisma.quizSession.findMany({
      where: { id: { in: sessionIds } },
      select: { id: true, correctCount: true, wrongCount: true, blankCount: true, score: true, totalQuestions: true },
    }),
    userStats: await prisma.userStats.findMany({ where: { userId: { in: userIds } } }),
    topicProgress: await prisma.userTopicProgress.findMany({
      where: { OR: [...byUserTopic.values()].map((x) => ({ userId: x.user, topicId: x.topic })) },
    }),
    wrongAnswers: await prisma.wrongAnswer.findMany({
      where: { OR: [...wrongPlus, ...wrongMinus].map((x) => ({ userId: x.user, questionId: x.question })) },
    }),
  };
  const outDir = join(__dirname, 'out');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `ingilizce-yeniden-puanla-${backup.at.replace(/[:.]/g, '-')}.json`);
  writeFileSync(outPath, JSON.stringify(backup, (_k, v) => (typeof v === 'bigint' ? Number(v) : v), 2));
  console.log(`Yedek yazıldı: ${outPath}`);

  await prisma.$transaction(async (tx) => {
    // 1. cevaplar
    for (const r of changed) {
      await tx.quizAnswer.update({ where: { id: r.answer_id }, data: { isCorrect: r.new_ok } });
    }
    // 2. oturum sayaçları ve puan
    for (const [id, s] of bySession) {
      await tx.$executeRaw`
        UPDATE quiz_sessions SET
          correct_count = GREATEST(0, correct_count + ${s.delta}),
          wrong_count = GREATEST(0, wrong_count - ${s.delta}),
          score = CASE WHEN score IS NULL OR total_questions = 0 THEN score
                       ELSE ROUND((GREATEST(0, correct_count + ${s.delta}))::numeric * 100 / total_questions, 2) END
        WHERE id = ${id}::uuid`;
    }
    // 3. kullanıcı toplamları
    for (const [user, delta] of byUser) {
      await tx.$executeRaw`UPDATE user_stats SET total_correct = GREATEST(0, total_correct + ${delta}) WHERE user_id = ${user}::uuid`;
    }
    // 4. konu ilerlemesi
    for (const x of byUserTopic.values()) {
      await tx.$executeRaw`
        UPDATE user_topic_progress SET
          correct_count = LEAST(solved_count, GREATEST(0, correct_count + ${x.delta})),
          mastery = CASE WHEN solved_count > 0
                         THEN LEAST(solved_count, GREATEST(0, correct_count + ${x.delta}))::decimal / solved_count ELSE 0 END
        WHERE user_id = ${x.user}::uuid AND topic_id = ${x.topic}::uuid`;
    }
    // 5. Yanlışlarım
    for (const w of wrongPlus) {
      await tx.$executeRaw`
        INSERT INTO wrong_answers (user_id, question_id) VALUES (${w.user}::uuid, ${w.question}::uuid)
        ON CONFLICT (user_id, question_id) DO UPDATE SET
          wrong_count = wrong_answers.wrong_count + 1, last_wrong_at = now(), resolved_at = NULL`;
    }
    for (const w of wrongMinus) {
      await tx.$executeRaw`UPDATE wrong_answers SET wrong_count = wrong_count - 1 WHERE user_id = ${w.user}::uuid AND question_id = ${w.question}::uuid`;
      await tx.$executeRaw`DELETE FROM wrong_answers WHERE user_id = ${w.user}::uuid AND question_id = ${w.question}::uuid AND wrong_count <= 0`;
    }
  }, { maxWait: 30_000, timeout: 300_000 }); // pooler üstünden onlarca ardışık ifade; varsayılan 5 sn yetmiyor
  console.log('Uygulandı.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
