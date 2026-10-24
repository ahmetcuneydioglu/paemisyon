# Doc 50 / 04 — F0–F2 deploy notu

Tarih: 24 Ekim 2026. Commit: `c1cf3c4` (`origin/main`, 26998a0..c1cf3c4). Üç commit:
F0 veri modeli ve motor, F1 web, F2 admin. Dal önce `origin/main`'e (F10-C, F10-P) rebase
edildi; tek çakışma `/sonuc` sayfasıydı — Doc 50 sürümü korunup F10-C seans kitinin
`ResultPanel` (net hero) ve `CoachLine` parçaları içine alındı. Oynatıcı otomatik birleşti
(F10-C derisi + Doc 50 anlık geri bildirim).

Push öncesi: API 483 test, web 95 test, admin lint temiz; sızıntı taraması yalnız migration
`.sql` dosyasını buldu (meşru). Deploy = `git push origin main` (Railway api, Vercel web+admin).

## Canlı doğrulama

(aşağıya doldurulur)
