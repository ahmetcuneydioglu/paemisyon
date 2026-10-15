-- Ret notu soruda yaşar (Doc 49 A0 / T5, 16 Eki 2026). Önceden not yalnız
-- audit_log.detail içine yazılıyordu ve panel o sütunu göstermediği için
-- editöre hiç ulaşmıyordu. Not, reddedilen sürümün üstünde durur; sürüm
-- yeniden incelemeye gönderilince temizlenir.
ALTER TABLE "question_versions" ADD COLUMN "review_note" TEXT;
