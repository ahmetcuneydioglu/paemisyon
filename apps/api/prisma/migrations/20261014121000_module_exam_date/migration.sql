-- Hedef sınavın RESMÎ tarihi (Doc 48 A2, 14 Eki 2026 — Faz 0 kararı 1: resmî +
-- kişisel). Kullanıcının kendi tarihi (users.target_exam_date) varsa o geçerli;
-- yoksa geri sayım bu tarihten. Tarih açıklanmamışsa NULL: koç sınav moduna
-- girmez, anasayfa "Sınav tarihini ekle" der. Panelden (İçerik Ağacı) girilir.
-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "exam_date" DATE;
