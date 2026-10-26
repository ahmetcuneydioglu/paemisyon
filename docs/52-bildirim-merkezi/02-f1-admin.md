# Doc 52 / 02 — F1 admin paneli: Bildirim Merkezi (26 Eki 2026)

Durum: **on ekran yazıldı, geçici Docker Postgres + `console` sağlayıcılı API ile tarayıcıda uçtan uca doğrulandı.**
Web ve mobil aday yüzeyleri ile prod migration/deploy bekliyor.

## Ekranlar (`apps/admin/src/app/(panel)/notifications/`)
| Sekme | Dosya | Doğrulanan |
|---|---|---|
| Genel Bakış | `page.tsx` | sayaçlar, kill switch/ortam şeridi, 30 gün seri, bastırma nedenleri, sıradakiler |
| Yeni Bildirim | `new/page.tsx` + `components/notifications/campaign-form.tsx` | üç sütun (içerik · hedefleme kural kurucu · telefon önizleme), alt çubuk; Taslak → Prova (10 maskeli örnek, çözülmüş metin, rota) → Test gönder (1 tester) → Gönder (alıcı sayısıyla onay) → detay sayfası |
| Kampanyalar | `campaigns/page.tsx`, `campaigns/[id]/page.tsx`, `campaigns/[id]/edit/page.tsx` | liste + filtre; detay sayaçları, kanal/platform kırılımı, bastırma, duraklat/iptal/kopyala; işçi `sending → sent` geçişi (console push log'da) |
| Otomatik Bildirimler | `automations/page.tsx` | F2 yer tutucu: hazır set kartları, bugün motora bağlı cron'lar notu |
| Segmentler | `segments/page.tsx` + `rule-builder.tsx` | kural kurucu, anlık sayım (`segments/estimate`), kayıt, tabloda özet |
| Şablonlar | `templates/page.tsx` | kategori sekmeleri, kart önizleme, yan panel kayıt; değişkenler sunucuda çıkarılır |
| Planlanmış | `scheduled/page.tsx` | güne göre gruplu planlı/gönderilen kampanyalar, admin iptali |
| Gönderim Geçmişi | `history/page.tsx` | filtre + sayfalama; maskeli e-posta, platform, durum, neden, etkileşim |
| Analizler | `analytics/page.tsx` | 7/30/90 gün, kategori çubukları, açılma saati histogramı, kanal/platform, segment, günlük seri; A/B F3 notu |
| Ayarlar | `settings/page.tsx` | kapılar, saklama, testerlar (ekle/çıkar), ortam kapısı, kitle yenileme, kill switch onay penceresi |

Ortak bileşenler `apps/admin/src/components/notifications/`: `tabs.tsx`, `ui.tsx` (StatCard, Pill, Chip, Field, Toggle,
Warnings, ConfirmDialog, BarRow, SeriesChart), `rule-builder.tsx`, `phone-preview.tsx`, `campaign-form.tsx` (`useIsAdmin`).
Menü girdisi "Bildirim Merkezi" (editor de görür; gönder/iptal/kill switch/tester yalnız admin, API de zorlar).

## Doğrulama tarifi (prod'a dokunmaz)
1. Docker Postgres (01-f1-api.md) + `prisma db seed`.
2. API: `PORT=3010 DATABASE_URL=… NOTIFICATIONS_PROVIDER=console npm run start:dev` (apps/api).
3. Admin: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3010/api/v1 npm run dev` (apps/admin, :3001); `.claude/launch.json`
   girdileri `api-doc52`, `admin-doc52`.
4. Giriş prod Supabase hesabıyla; ilk girişte API kullanıcıyı geçici DB'de JIT açar ve panel "yalnız admin/editör"
   diyerek oturumu kapatır → `INSERT INTO user_roles … role admin` sonra yeniden giriş.
5. Tester + sahte token (`push_tokens`) ekle, Ayarlar › "Kitle tablosunu şimdi yenile". Sessiz saatte (23–08) test
   ediyorsan `user_notification_settings.quiet_start = quiet_end` yap, yoksa push 08:00'e ertelenir (doğru davranış).

## Doğrulama sırasında düzeltilenler
- `SegmentEstimateDto/UpsertSegmentDto.rules` ve `segmentRules` dekoratörsüzdü; ValidationPipe `property rules should not exist` ile reddediyordu.
- Şablon `variables` sunucuda hesaplanmıyordu (kart "değişken yok" gösteriyordu).
- İlk "Taslak kaydet/Prova" sayfayı edit rotasına taşıyıp prova sonucunu siliyordu; artık kimlik state'te, adres sessizce güncellenir.
- Ayarlar'da `notifications.environment` etiketi CSS uppercase ile "NOTİFİCATİONS" oluyordu.

## Bilinen sınırlar
- Analizler/Genel Bakış serisi gece rollup'ından beslenir; aynı gün veri için `RollupService.rollupDay` elle çağrılır.
- Kampanya düzenleme yalnız taslak/planlı; "Kopyala" diğerleri için.
- Şablon panelinde parametreli hedefler (tek soru, deneme, kanun) yok; bunlar kampanya formunda seçilir.
