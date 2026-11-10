# Doc 52 / 08 — Sönüm katmanı uygulama içi etkinliği tanır (10 Kas 2026)

Durum: **yazıldı; jest (44 test) ve tsc temiz; yerel Docker Postgres'te prod örüntüsüyle doğrulandı. Prod'a
uygulanmadı.** Şema değişikliği yok; kitle SQL'i (saatlik yenileme) ve karar akışı değişti. Prod'a çıkış: deploy
sonrası ilk saatlik yenilemede tier'lar kendiliğinden düzelir (`07 * * * *`).

## Bulgu
Günde ~105 soru çözen, 10 günlük serisi olan web-push'lu bir kullanıcı `engagement_tier=2` idi: soru bildirimi
sonucu push'u `decay_email_only` ile bastırıldı, yalnız e-posta gitti. Sebep: sönüm katmanı "cevabı" yalnız
`notification_events` tablosundaki push açma/tıklama olayından okuyordu. Prod sayımı (kaynak oturum, 10 Kas):
59 tier-2 kullanıcıdan 13'ü son 7 günde ≥20 soru çözmüş, 6'sı yalnız web push.

## Karar 1 — "Cevap" uygulama içi etkinliği de kapsar
Doc 24 §7 madde 6: *"7 gün cevapsızsa frekans otomatik düşer (haftada 2'ye), 30 gün sonra sadece haftalık
e-posta raporu. Susmayı bilen ürün, geri dönülen üründür."* Maddenin amacı **sessiz kalan kullanıcıyı rahatsız
etmemek**; ölçüsü "cevap"tır, "push dokunma" değil. Uygulamada soru çözen kullanıcı ürüne cevap vermektedir;
push'u açmaması sönüm değil kanal alışkanlığıdır (web push'ta bildirim panelinden gelmeden sekmeyi açmak
olağandır). Doc 52 §6 notundaki "herhangi bir açılma → 0'a döner" cümlesi de "dönüş" sinyalini esas alır; dönüşün
en güçlü kanıtı uygulamanın kendisinde olmaktır. Bu yüzden kural Doc 24 ile çelişmez, onu doğru ölçer.

Kural (tek tanım `engagementTierFor`, `decision.logic.ts`; kitle SQL'indeki CASE onun karşılığıdır):

| Sıra | Koşul | Tier |
|---|---|---|
| 1 | son 7 günde ≥ **20** cevap **ya da** son **3** günde bir cevap (`ACTIVE_ANSWERS_7D`, `ACTIVE_ANSWER_DAYS`) | 0 |
| 2 | 30 günde ≥ 5 push gitti ve 30 gündür açma/tıklama yok | 2 |
| 3 | 7 günde ≥ 5 push gitti ve 7 gündür açma/tıklama yok | 1 |
| 4 | kalan | 0 |

Eşik gerekçesi: "≥20/7 gün" haftada 3 kısa seans demektir (günlük hedef varsayılanı 10 soru); "son 3 gün"
eşiği az soru çözen ama hâlâ gelen kullanıcıyı korur. Üç günden uzun ara + 20'nin altı cevap → sönüm işler; 5 gün
önce 19 soru çözmüş kullanıcı tier 2'de kalır (fikstürde `eski-cevap` profili). `users.last_active_at`
KULLANILMADI: saatte bir güncellenen bir "uygulama açıldı" damgası, arka plan token yenilemesiyle de oynayabilir;
cevap kaydı daha dürüst sinyaldir.

## Karar 2 — İşlem bildirimleri sönümden muaf (`decayExempt`)
`question_report` (soru/kart bildirimi sonucu) kullanıcının **kendi eylemine** verilen yanıttır: kullanıcı
sonucu bekler, kategori tercihle kapatılamaz (Doc 55). Sönüm "istenmeyen push'u kıs" mekanizmasıdır; beklenen
yanıtı kısmak güveni kırar. `system` de muaf (hizmet duyurusu; zaten kapatılamaz). Uygulanışı
`CategoryPolicy.decayExempt` + §6 kural 10a'da `!policy.decayExempt` koşulu. Muafiyet YALNIZ sönümü aşar: günlük
kapı, sessiz saat, cihaz yok, rıza kuralları aynen işler. Diğer kategoriler (streak, exam, new_content…) muaf
değildir — onlar ürünün inisiyatifidir, sönümün hedefi tam da onlardır.

## Bulgu 2 — Web push açılışı kaydedilmiyordu (düzeltildi)
Zincir: `push.service.webLink` → FCM `webpush.fcmOptions.link = <webPath>?nid=<id>` → tarayıcı sayfayı açar →
`NotificationOpenTracker` (`?nid=`) `POST /me/notifications/:id/events {opened, web}` yazar → `notification_events`.
İzleyici `AppShell` içindeydi; push hedeflerinin çoğu L3 odak sayfalarıdır (`/seans` günün sorusu, alıştırma,
zayıf konu, yanlış tekrarı; `/kartlar`) ve orada kabuk YOK → bu açılışlar hiç yazılmıyordu. Yalnız `/bugun`,
`/denemeler`, `/sonuc`, `/performans` gibi kabuklu hedefler sayılıyordu. İzleyici `(app)/layout.tsx`'e (tüm
girişli rotalar) ve `(dual)/layout.tsx` girişli dalına taşındı; kabuktan kaldırıldı (çift kayıt olmasın).
Girişsiz açılışta middleware `next=<yol>?nid=…` ile yönlendirir, nid korunur. Mobil (Expo) açılışı ayrı yoldan
(`source: push`) yazar; bu değişiklikten etkilenmez.

## Doğrulama
- `decision.logic.spec.ts`: `engagementTierFor` 4 durum (aktif-ama-push-açmamış, az-ama-son-3-gün, eşik altı,
  açma süresi) + muafiyet testi (question_report/system tier 2'de gider, cihaz yoksa yine düşer). 44/44 yeşil.
- Docker (`paem-pg-doc52`/`paemisyon`, migration'lar güncellendi), `scripts/notifications/sonum-fikstur.ts`:
  62 kullanıcı; sonuç eski→yeni: aktif-web 6 kişi 2→0, aktif-ios 7 kişi 2→0, az-ama-dün 1 kişi 2→0, eski-cevap
  2→2, sönmüş 46 kişi 2→2, tier1 1→1. 13 aktif aday düştü, 46 sönmüş kullanıcı yerinde kaldı.
- Prod etki sayımı (`scripts/notifications/sonum-etki-say.ts`, salt okunur, `connection_limit=1`, 10 Kas 2026
  23:05 TR):

  | tier | toplam | aktif → 0 | aktif + push | aktif yalnız web | ≥20/7g | son 3 gün |
  |---|---|---|---|---|---|---|
  | 0 | 1264 | 224 | 6 | 2 | 147 | 174 |
  | 1 | 1 | 1 | 1 | 1 | 0 | 1 |
  | 2 | 59 | 15 | 15 | 3 | 13 | 12 |

  Deploy ile tier 1/2'den 0'a inecek kullanıcı: **16** (15'i tier 2; hepsi push'lu, 4'ü yalnız web push). Tier 0'daki
  224 aktif kullanıcı zaten 0'dır, değişmez. Açma/tıklama olaylarının tamamı: `clicked/inbox/ios` 12,
  `clicked/web` 14 (kutu satırı tıklaması), `opened/push/ios` 2, `opened/web` 4 — toplam 32. Web push açılışı
  (`opened/web`) tüm zamanlarda 4: Bulgu 2'yi prod verisi de doğrular, `/seans` ve `/kartlar` hedefli açılışlar
  sayılmıyordu.

## Dosyalar
`audience.service.ts` (CASE + `a7.last_at`), `decision.logic.ts` (`engagementTierFor`, sabitler, kural 10a),
`notification.categories.ts` (`decayExempt`), `decision.logic.spec.ts`, web `(app)/layout.tsx`,
`(dual)/layout.tsx`, `app-shell.tsx`, `scripts/notifications/sonum-fikstur.ts`, `sonum-etki-say.ts`.
