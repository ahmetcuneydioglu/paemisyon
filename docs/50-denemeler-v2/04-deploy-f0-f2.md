# Doc 50 / 04 — F0–F2 deploy notu

Tarih: 24 Ekim 2026. Commit: `c1cf3c4` (`origin/main`, 26998a0..c1cf3c4). Üç commit:
F0 veri modeli ve motor, F1 web, F2 admin. Dal önce `origin/main`'e (F10-C, F10-P) rebase
edildi; tek çakışma `/sonuc` sayfasıydı — Doc 50 sürümü korunup F10-C seans kitinin
`ResultPanel` (net hero) ve `CoachLine` parçaları içine alındı. Oynatıcı otomatik birleşti
(F10-C derisi + Doc 50 anlık geri bildirim).

Push öncesi: API 483 test, web 95 test, admin lint temiz; sızıntı taraması yalnız migration
`.sql` dosyasını buldu (meşru). Deploy = `git push origin main` (Railway api, Vercel web+admin).

## İlk deneme düştü, ikinci geçti

1. `c1cf3c4` (05:18): Vercel web + admin başarılı, **Railway başarısız**. İki neden:
   `nest build` bildirim üretimi dışa aktarılmamış `PackQuestion` tipine takıldı (yerel `tsc` bunu
   göstermez; `nest build` gösterir); migration arşiv oturumlarını `exam_id`'ye taşırken eski
   `(user_id, exam_id)` tekil indeksi hâlâ duruyordu → 23505. Prisma migration'ı tek işlemde geri
   aldı: canlıda hiçbir sütun/tip/indeks oluşmadı, veri değişmedi; yalnız `_prisma_migrations` satırı
   başarısız kaldı.
2. **Ders:** Prisma CLI `.env`'deki `DATABASE_URL`'i ortam değişkenine TERCİH ediyor; Docker'a
   yöneltilmiş sanılan ilk prova canlıda çalıştı (aynı hatayla düşüp geri alındı). Güvenli prova:
   `prisma/` klasörünü `.env` içermeyen geçici dizine kopyalayıp `DATABASE_URL` + `DIRECT_URL`
   vererek `migrate deploy --schema`. Boş Postgres 16'da 51 migration'lık zincir geçti.
3. Kullanıcı `prisma migrate resolve --rolled-back 20261027090000_denemeler_v2` çalıştırdı
   (canlıya yazma, oturumun izni dışında). `cf511f1` push edildi (05:52): üç statü de başarılı,
   migration uygulandı.

## Canlı doğrulama (24 Eki 2026, cf511f1)

- `GET /health` ok, DB up. `GET /exams`: 3 eski deneme `publishMode=takvimli`, `availability=closed`,
  `practiceAfterEnd=false` (eski arşiv anahtarı taşındı), `examTypeId=null` (iki aktif tür → panelden
  seçilecek; sonuçta ders dağılımı kullanıcının hedef sınavından okunur).
- `GET /exams/:id/leaderboard` (Deneme-2, 21 resmî çözüm): `available=true`, `frozenAt=null` (eski
  deneme dondurulmaz, canlı sorgu), sıra/net/yanlış/süre doğru; `name` tek kelimelik kullanıcı
  adlarını olduğu gibi döndürüyor (kısaltma yalnız ad-soyad'da).
- `GET /exams/:id`: `distribution=[]` (sınav türü yok), `canStart*` false (kapalı, pratik kapalı).
- Web/admin: tarayıcı sonucu aşağıda; `curl` 429 (Vercel bot koruması), ölçüm tarayıcıyla.
