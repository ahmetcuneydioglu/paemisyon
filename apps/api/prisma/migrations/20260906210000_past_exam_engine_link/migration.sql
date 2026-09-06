-- Doc 36: çıkmış sınav ↔ deneme motoru bağı (yalnız yabancı anahtar eklenir).
ALTER TABLE "past_exams" ADD CONSTRAINT "past_exams_exam_id_fkey"
    FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
