# Doc 52 / 06 — F3: A/B, akıllı saat, kişisel otomasyonlar, AI öneri, CSV (28 Eki 2026)

Durum: **yazıldı, Docker Postgres'te duman testinden geçti (f3-smoke, 13 kontrol); admin formu tipi/lint temiz.**
Prod'a çıkış: migration `20261028090000_notification_smart` (eklemeli: `notification_campaigns.smart_window_*`,
`notification_audience.best_engagement_hour`) `migrate deploy` ile; AI öneri için Railway'de `ANTHROPIC_API_KEY`
zaten var (AI açıklama aynı anahtarı kullanır).

## A/B varyant
- `UpsertCampaignDto.variants[]` (en çok 4; anahtar tekil; ağırlık toplamı 100); verilmezse tek A varyantı.
- Taslak/planlı kampanyada varyant seti yeniden yazılır (`deleteMany + create`); gönderimden sonra düzenlenmez.
- Atama deterministik: `md5(campaignId + userId)` ilk 8 hex → [0,100) ağırlık aralığı (`pickVariant`); aynı kullanıcı
  aynı varyantı alır, test gönderimi de aynı kuralla.
- Analiz: `GET campaigns/:id/analytics` → `variants[] {key, weight, total, sent, opened, clicked, converted}`; detay sayfasında
  karşılaştırma tablosu. Admin formunda A/B anahtarı, A ağırlığı, B başlık/gövde (B aynı hedef, CTA ve e-posta içeriğini kullanır).

## Akıllı saat
- Kitle: `best_engagement_hour` = son 28 gün cevapların TR saat histogramının tepesi; kayıt < 3 gün ise kayıt saati
  (Doc 24 "ilk 3 gün giriş saati"). Saatlik yenilemede hesaplanır; ham veri `quiz_answers` (90 gün saklama ilkesi gizlilik
  metnine yazıldı).
- Kampanya `sendMode=smart` + `smartWindowStart/End` (TR HH:MM): kitle hemen açılır, her alıcının kutu satırı ve teslimi
  `smartSendAt` ile kendi saatine planlanır (pencereye kırpılır, an geçtiyse yarın). `enqueue` yeni `scheduleAt` girdisini
  karar ertelemesiyle birleştirir (en geç olan kazanır). `send_now` akıllı modu korur.
- Otomasyon `user_time`: kullanıcı `smartTimingEnabled` (vars. açık) ve en iyi saati biliniyorsa o saatin tam başı,
  değilse tercih saati (`effectiveReminderTime`). Tercih satırı olmayan ama en iyi saati bilinen kullanıcı da o saatte.
- Tercih: web `/profil/bildirimler` ve Expo Ayarlar'da "Akıllı saat" anahtarı + açıklama; web gizlilik sayfasına
  işleme amacı maddesi eklendi.

## Yeni preset'ler (kapalı doğar)
| Kod | Tetik | Koşul | İçerik |
|---|---|---|---|
| weak_topic | her gün 18:00 | zayıf konu var, hedef dolmamış, push | "{{zayif_konu}}: on soru" → `topic:<id>` |
| personal_record | olay `exam_submitted` (`personalBest`) | — | "Kişisel rekor: {{net}} net" → sonuç |
| personalized_session | hatırlatma saati −60 dk | zayıf konu var, hedef dolmamış | "Bugünkü reçeten hazır" → `topic:<id>` |

- `enrich` kancası: preset, kitle satırında olmayan veriyi (zayıf konu adı) kullanıcı başına getirir; yoksa gönderim yok
  (`no_payload`). Prova örnek alıcıyla zenginleştirir.
- Segment DSL'e `is_not_empty` operatörü eklendi (dizi alanları).
- Derin bağlantı kayıt defterine `weak_topic` (param `topicId`; mobil `topic:<uuid>` → 10 soruluk konu turu, web
  `/seans?mode=practice&topicId=…`); Expo `deep-links.ts` eşlemesi eklendi (min sürüm 2.1.0).
- Üretici: `quiz.service` deneme tesliminde `previousBest`/`personalBest` yükü (önceki tamamlanmış denemelerin en yüksek neti).

## AI metin önerisi
`POST /admin/notifications/suggest {category, goal, draft?, count}` → `SuggestService` (Claude `claude-sonnet-5-5`,
yalnız kategori + amaç + taslak gider; kaynak etiketi, kişisel veri, soru metni gitmez). 1–5 öneri; her öneri
`templateWarnings` ile denetlenir, emoji/yasaklı kelime `blocked` (panel soluk gösterir, forma yazılamaz). İnsan onayı
zorunlu: öneri yalnız forma yazılır ("A'ya yaz" / "B'ye yaz"), editör düzenler. Anahtar yoksa 503.

## CSV
`GET /admin/notifications/history/export` aynı süzgeçlerle en çok 10.000 satır; `;` ayraçlı, UTF-8 BOM (Excel), e-posta
maskeli. Admin Gönderim Geçmişi'nde "CSV indir" (Bearer ile indirme, `downloadFile`).

## Doğrulama
`scripts/notifications/f3-smoke.ts`: yeni kullanıcıda en iyi saat = kayıt saati → iki varyantlı akıllı kampanya (ağırlık
doğrulaması, 12 alıcı, dağılım, deterministik atama, scheduledAt pencerede, analiz varyant kırılımı) → zayıf konu
zenginleştirme ve `topic:<id>` rotası → personal_record yalnız rekorda. Jest `automation.logic.spec` +3 (31 toplam).

## Bilinen sınırlar
- Akıllı saat pencere gece yarısını aşamaz (başlangıç < bitiş).
- A/B kazanan ilanı / otomatik kazanan seçimi yok; karşılaştırma tablo düzeyinde.
- `personalized_session` koç reçetesini henüz seans olarak üretmiyor; zayıf konu turuna yönlendirir.
- AI önerisi canlıda denenmedi (lokal anahtar yok); hata yolu 503 testte görüldü.
