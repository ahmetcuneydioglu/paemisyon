-- Doc 53 PVSK (31 Eki 2026) — ünite açık madde listesi. EKLEMELİ: sayısal olmayan maddeler
-- ("4/A", "Ek 6", "Geçici 2") için aralık yerine liste; boş liste = aralık (Anayasa) aynen çalışır.
ALTER TABLE "summary_units" ADD COLUMN "article_nos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
