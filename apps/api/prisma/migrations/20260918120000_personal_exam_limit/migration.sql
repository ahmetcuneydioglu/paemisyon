-- Kişisel denemeye freemium kapısı (18 Eyl 2026).
--
-- Kişisel deneme bugüne dek hem premium kapısından hem günlük soru kotasından
-- MUAFTI: mode='exam' olduğu için quiz.service'teki deneme muafiyetini yan etki
-- olarak devralıyordu. Ücretsiz kullanıcı günde sınırsız kez, her seferinde
-- görmediği sorulardan 100'lük set çözebiliyordu; 30 soruluk ücretsiz limit
-- fiilen anlamsızdı.
--
-- Karar: ücretsiz plan günde 1 kişisel deneme, en çok 25 soru. Kota kuralı
-- DEĞİŞMİYOR (deneme ortasında kesme yok — 2 Eyl 2026 kazası); kapı oturum
-- BAŞLARKEN kurulur.

-- Kişisel deneme oturumu açık işaretlenir. Bugüne dek yalnız örtük olarak
-- (mode='exam' ve exam/archive/topic/course dördü birden NULL) ayırt
-- edilebiliyordu; günlük hak sayımını bu çıkarıma dayamak, mode='exam' ile yeni
-- bir akış eklendiğinde sessizce bozulurdu.
ALTER TABLE "quiz_sessions" ADD COLUMN "personal_exam" BOOLEAN NOT NULL DEFAULT false;

-- Günlük hak sayımının sorgusu: (kullanıcı, kişisel mi, ne zaman başladı).
CREATE INDEX "quiz_sessions_user_id_personal_exam_started_at_idx"
  ON "quiz_sessions" ("user_id", "personal_exam", "started_at");

-- Sayı DB'de yaşar (daily_question_limit ile aynı desen): panelden/scriptten
-- deploysuz ayarlanabilsin. NULL = sınırsız (premium planlar).
ALTER TABLE "plans" ADD COLUMN "personal_exam_daily_limit" INTEGER;
UPDATE "plans" SET "personal_exam_daily_limit" = 1 WHERE "key" = 'free';
