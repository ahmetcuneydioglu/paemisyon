-- Devam eden seans (Doc 27 §2.4): seansın soru sırası kalıcı olur ki
-- "kaldığın yerden devam" gerçek anlamda mümkün olsun. Nullable + additive.
ALTER TABLE "quiz_sessions" ADD COLUMN "question_order" JSONB;
