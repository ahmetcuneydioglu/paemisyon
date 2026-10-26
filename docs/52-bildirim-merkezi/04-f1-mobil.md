# Doc 52 / 04 — F1 mobil (Expo): zil, kutu, tercihler, push dokunuşu (26 Eki 2026)

Durum: **yazıldı ve iPhone 17 simülatöründe, geçici Docker Postgres'e bağlı lokal API (3010) ile doğrulandı.**
Fiziksel cihazda push dokunuşu (`opened` olayı, `minAppVersion` düşüşü) kod yoluyla hazır, canlı FCM ile henüz
denenmedi (simülatörde FCM jetonu yok).

## Yüzeyler (`apps/app`)
| Parça | Dosya | Not |
|---|---|---|
| Zil + rozet | `app/(tabs)/index.tsx` üst satır, `components/ui/count-badge.tsx` (`CountBadge`, `IconBadgeButton`) | 44 pt hedef, rozet 1–99 / "99+", erişilebilirlik etiketi "Bildirimler, 3 okunmamış"; sayaç 60 sn bayatlar, odağa dönüşte ve push gelince yenilenir |
| Satır | `components/domain/notification-row.tsx` (`NotificationRow`) | Web ile aynı anatomi: kategori ikonu, başlık, gövde, göreli zaman, okunmamış noktası, CTA metni; `needsUpdate` → "Güncelleme gerekli" rozeti; `compact` varyantı |
| Kutu | `app/bildirimler.tsx` (kök yığın, sekme çubuğu yok) | Tümü / Okunmamış · N, "Tümünü okundu say", gün grupları (SectionList), aşağı kaydırınca imleçli devam, çekerek yenile, boş durum, "180 gün saklanır" dipnotu; başlık sağında tercih kısayolu |
| Tercihler | `features/notifications/preferences.tsx` (`NotificationPreferences`) — Ayarlar › Bildirimler bölümü | Ana anahtar = sunucu `pushEnabled` × cihaz izni (izin yoksa ister, reddedilmişse Ayarlar'a yollar); 12 kategori 4 grupta, kapatılamayanlar kilitli, push kapalıyken yalnız-push kategoriler soluk; hatırlatma saati, sessiz saat başlangıç/bitiş çipleri; e-posta satırı mevcut web tercih sayfasına (`preferencesUrl`) açılır. İyimser PATCH, hata geri alır |
| Sorgular | `features/notifications/queries.ts` | Tipler (web ile birebir), anahtarlar, `useUnreadCount`, `useInbox` (sonsuz), `useNotificationSettings`, `useUpdateNotificationSettings`, `useReadAll`, `recordNotificationEvent` (kutu + rozet önbelleğini anında günceller), `needsUpdate`, `relativeTime`, `groupInbox` |
| Push | `lib/push.ts` | Jeton kaydı `deviceId` + `appVersion` ile; her dokunuş `openFromPush`'tan geçer: `data.notificationId` varsa `opened` (platform, sürüm), `data.minAppVersion` > sürüm ise `/bildirimler`, yoksa `routeToHref(route)`; ön plan mesajı rozeti yeniler ve yerel bildirime aynı veriyi taşır |
| Kimlik | `lib/app-meta.ts` | `appVersion()` (app.config `version`), `deviceId()` (ilk açılışta üretilen rastgele UUID, yerelde saklı), `versionAtLeast()` |
| Yerel hatırlatma | `lib/reminders.ts` | Emekli: günlük hatırlatma artık sunucudan (`study_reminder`, `reminderTime`). Eski sürümde kurulmuş yerel planı açılışta iptal eder, tercihi kapatır; yeni plan kurmaz |
| UI kiti | `components/ui/temel.tsx` `Button size="sm"` | Satır içi ikincil eylem (44 pt) — "Tümünü okundu say" |
| Galeri | `app/galeri.tsx` "Liste satırları" | Zil rozeti varyantları, üç kutu satırı (okunmamış, okunmuş, güncelleme gerekli) |

Kök `_layout.tsx` yığınına `bildirimler` ekranı eklendi (başlıklı). Ayarlar'daki eski yerel hatırlatma anahtarı ve
"Koç bildirimleri" satırı kaldırıldı; yerine sunucu tercihleri geldi.

## Doğrulanan (simülatör, Docker DB kullanıcısı neilonlukas@gmail.com)
Bugün'de zil rozeti 4 → `/bildirimler` gün gruplu 5 satır, "Okunmamış · 4"; `statistics` satırı (`minAppVersion`
2.1.0 > 2.0.0) "Güncelleme gerekli" → satıra dokunma `notification_events` (clicked, inbox, ios, 2.0.0) + `read_at`,
seans açıldı (Docker DB'de yayınlı soru olmadığı için "Tur açılamadı" — içerik, bildirim değil) → geri dönünce satır
yerinde okundu, sayaç 1 → "Tümünü okundu say" DB'de 0 okunmamış → Ayarlar: 21:00 çipi `reminder_time=21:00`, Seri
anahtarı `categories.streak=true`, kapatılamaz satırlar kilitli, push-only kategori izin yokken soluk.

## Lokal doğrulama tarifi (gotcha'lar)
- Expo SDK 58 `.env.local` değerlerini **paket içine modül olarak** gömer ve çalışma anında `process.env`'in
  üstüne yazar; kabuktan verilen `EXPO_PUBLIC_API_BASE_URL` bu yüzden yetmez. Lokal API'ye bağlanmak için
  `.env.local`'daki adresi geçici değiştir (yedek al, bitince geri koy) ve Metro'yu yeniden başlat.
- `CI=1` ile başlatılan Metro dosya izlemez: kaynak ya da `.env` değişikliği için Metro'yu yeniden başlatıp uygulamayı
  soğuk açmak gerekir (`simctl terminate` + `launch`).
- Dev client'ı başka bir Metro'ya almak: `xcrun simctl openurl <udid> "paemisyon://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>"`.
- Docker DB kullanıcısında `onboarding_completed_at` boşsa uygulama tanıtıma düşer; sütunu doldur.

## Bilinen sınırlar / F2'ye kalanlar
- Sola kaydırarak "kapat" (`dismissed`) yok; satır görseli (`imageUrl`) gösterilmiyor.
- `/bildirimler`'den tercih kısayolu Ben sekmesine atlar (yığında geri oku yok); F2'de Ayarlar'ın altına
  ayrı "Bildirimler" ekranı açılabilir.
- Bugün ekranında kampanya kartı (`createInAppBanner`) F2.
- Ayarlar'daki ana anahtar simülatörde her zaman kapalı görünür (FCM izni/jetonu yok); cihazda denenmeli.
