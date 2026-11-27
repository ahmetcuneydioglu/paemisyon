-- Doc 59 — Düello ve çok oyunculu salon (27 Kas 2026). EKLEMELİ: on yeni tablo, üç enum.
-- Mevcut tablolarda değişiklik yok (yalnız yeni tablolardan users/modules/question_versions'a FK).
-- Geri dönüş: yeni tabloları ve enum'ları düşürmek yeterlidir.

-- CreateEnum
CREATE TYPE "DuelKind" AS ENUM ('duel', 'room');

-- CreateEnum
CREATE TYPE "DuelPhase" AS ENUM ('lobby', 'countdown', 'question', 'reveal', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "DuelInvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "duel_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "DuelKind" NOT NULL,
    "phase" "DuelPhase" NOT NULL DEFAULT 'lobby',
    "module_id" UUID NOT NULL,
    "host_id" UUID,
    "name" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,
    "code_expires_at" TIMESTAMP(3),
    "scope_kind" TEXT NOT NULL DEFAULT 'mixed',
    "scope_id" UUID,
    "question_count" INTEGER NOT NULL,
    "seconds_per_question" INTEGER NOT NULL,
    "max_players" INTEGER NOT NULL,
    "current_index" INTEGER NOT NULL DEFAULT -1,
    "phase_started_at" TIMESTAMP(3),
    "phase_ends_at" TIMESTAMP(3),
    "seq" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "rewarded_at" TIMESTAMP(3),

    CONSTRAINT "duel_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_participants" (
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "kicked_at" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "correct_ms" INTEGER NOT NULL DEFAULT 0,
    "answer_ms" INTEGER NOT NULL DEFAULT 0,
    "placement" INTEGER,
    "outcome" TEXT,
    "xp_awarded" INTEGER,
    "rating_delta" INTEGER,

    CONSTRAINT "duel_participants_pkey" PRIMARY KEY ("match_id","user_id")
);

-- CreateTable
CREATE TABLE "duel_match_questions" (
    "match_id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "question_version_id" UUID NOT NULL,
    "correct_option_id" UUID NOT NULL,

    CONSTRAINT "duel_match_questions_pkey" PRIMARY KEY ("match_id","index")
);

-- CreateTable
CREATE TABLE "duel_answers" (
    "match_id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "elapsed_ms" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duel_answers_pkey" PRIMARY KEY ("match_id","index","user_id")
);

-- CreateTable
CREATE TABLE "duel_queue" (
    "user_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "scope_kind" TEXT NOT NULL DEFAULT 'mixed',
    "scope_id" UUID,
    "rating" INTEGER NOT NULL,
    "enqueued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duel_queue_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "duel_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "status" "DuelInvitationStatus" NOT NULL DEFAULT 'pending',
    "match_id" UUID,
    "scope_kind" TEXT NOT NULL DEFAULT 'mixed',
    "scope_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "duel_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_stats" (
    "user_id" UUID NOT NULL,
    "duels" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "correct_total" INTEGER NOT NULL DEFAULT 0,
    "answers_total" INTEGER NOT NULL DEFAULT 0,
    "answer_ms_total" BIGINT NOT NULL DEFAULT 0,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "room_wins" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "room_rating" INTEGER NOT NULL DEFAULT 1000,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duel_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "user_a_id" UUID NOT NULL,
    "user_b_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("user_a_id","user_b_id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duel_matches_code_key" ON "duel_matches"("code");

-- CreateIndex
CREATE INDEX "duel_matches_phase_phase_ends_at_idx" ON "duel_matches"("phase", "phase_ends_at");

-- CreateIndex
CREATE INDEX "duel_matches_kind_phase_module_id_is_public_idx" ON "duel_matches"("kind", "phase", "module_id", "is_public");

-- CreateIndex
CREATE INDEX "duel_matches_finished_at_idx" ON "duel_matches"("finished_at");

-- CreateIndex
CREATE INDEX "duel_participants_user_id_joined_at_idx" ON "duel_participants"("user_id", "joined_at");

-- CreateIndex
CREATE INDEX "duel_queue_module_id_scope_kind_scope_id_enqueued_at_idx" ON "duel_queue"("module_id", "scope_kind", "scope_id", "enqueued_at");

-- CreateIndex
CREATE INDEX "duel_invitations_to_user_id_status_expires_at_idx" ON "duel_invitations"("to_user_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "duel_invitations_from_user_id_created_at_idx" ON "duel_invitations"("from_user_id", "created_at");

-- CreateIndex
CREATE INDEX "duel_stats_rating_idx" ON "duel_stats"("rating");

-- CreateIndex
CREATE INDEX "duel_stats_room_rating_idx" ON "duel_stats"("room_rating");

-- CreateIndex
CREATE INDEX "xp_events_user_id_created_at_idx" ON "xp_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "xp_events_user_id_source_source_id_key" ON "xp_events"("user_id", "source", "source_id");

-- CreateIndex
CREATE INDEX "friendships_user_b_id_idx" ON "friendships"("user_b_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

-- AddForeignKey
ALTER TABLE "duel_matches" ADD CONSTRAINT "duel_matches_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_matches" ADD CONSTRAINT "duel_matches_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_participants" ADD CONSTRAINT "duel_participants_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "duel_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_participants" ADD CONSTRAINT "duel_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_match_questions" ADD CONSTRAINT "duel_match_questions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "duel_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_match_questions" ADD CONSTRAINT "duel_match_questions_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "duel_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_queue" ADD CONSTRAINT "duel_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_queue" ADD CONSTRAINT "duel_queue_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_invitations" ADD CONSTRAINT "duel_invitations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_invitations" ADD CONSTRAINT "duel_invitations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_invitations" ADD CONSTRAINT "duel_invitations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "duel_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_stats" ADD CONSTRAINT "duel_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Elle eklenen kısıtlar (Prisma şemasında ifade edilemez) ──────────────────

-- Kullanıcı başına TEK aktif maç: iki cihazdan / iki istekle aynı anda katılım veritabanında reddedilir.
CREATE UNIQUE INDEX "duel_participants_one_active_per_user" ON "duel_participants"("user_id") WHERE "active";

-- Aynı kişiye bekleyen ikinci davet açılamaz (spam ve yarış koşulu kapısı).
CREATE UNIQUE INDEX "duel_invitations_one_pending_per_pair" ON "duel_invitations"("from_user_id", "to_user_id") WHERE "status" = 'pending';

ALTER TABLE "duel_matches" ADD CONSTRAINT "duel_matches_limits_chk"
  CHECK ("max_players" BETWEEN 2 AND 8 AND "question_count" BETWEEN 1 AND 30 AND "seconds_per_question" BETWEEN 5 AND 120);
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_canonical_chk" CHECK ("user_a_id" < "user_b_id");
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_not_self_chk" CHECK ("blocker_id" <> "blocked_id");

-- ── RLS: istemci bu tablolara HİÇ erişmez. RLS açık + politika yok = anon/authenticated için
-- sıfır satır. API, tablo sahibi rolüyle (Prisma) bağlandığı için etkilenmez.
ALTER TABLE "duel_matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_match_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duel_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "xp_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "friendships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_blocks" ENABLE ROW LEVEL SECURITY;

-- ── Realtime yetkisi: özel kanala yalnız hak sahibi abone olur.
--   duel:<maç id>       → o maçın (atılmamış) katılımcısı
--   duel-user:<kullanıcı id> → yalnız kendisi (davet, eşleşme haberi)
-- Fonksiyon SECURITY DEFINER: çağıran rol duel_participants'ı RLS yüzünden okuyamaz.
-- İstemci yalnız DİNLER; INSERT politikası yok, yayın yalnız sunucudan (servis anahtarı) gelir.
-- realtime şeması yalnız Supabase'de vardır; yerel/gölge veritabanında bu blok atlanır.
DO $do$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL AND to_regprocedure('auth.uid()') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.duel_can_listen(topic text)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
        SELECT CASE
          WHEN topic = 'duel-user:' || (SELECT auth.uid())::text THEN true
          WHEN topic LIKE 'duel:%' THEN EXISTS (
            SELECT 1 FROM public.duel_participants p
            WHERE p.match_id::text = substr(topic, 6)
              AND p.user_id = (SELECT auth.uid())
              AND p.kicked_at IS NULL
          )
          ELSE false
        END
      $body$
    $fn$;
    EXECUTE 'REVOKE ALL ON FUNCTION public.duel_can_listen(text) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.duel_can_listen(text) TO authenticated';
    EXECUTE $pol$
      CREATE POLICY "duel_listen_own_channels" ON realtime.messages
      FOR SELECT TO authenticated
      USING (realtime.messages.extension = 'broadcast' AND public.duel_can_listen((SELECT realtime.topic())))
    $pol$;
  END IF;
END
$do$;
