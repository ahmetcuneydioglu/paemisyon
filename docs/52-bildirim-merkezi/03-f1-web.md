# Doc 52 / 03 — F1 web: zil, kutu, tercihler (26 Eki 2026)

Durum: **yazıldı ve geçici Docker Postgres + console sağlayıcılı API ile tarayıcıda doğrulandı.** Mobil (Expo) ve prod
migration/deploy bekliyor.

## Yüzeyler (`apps/web`)
| Parça | Dosya | Not |
|---|---|---|
| Zil + rozet | `components/notifications/notification-bell.tsx` | Üst şeritte (`shell/top-strip.tsx`) açılır panel: son 4 bildirim, "Tümünü okundu say", "Tümünü gör"; mobil başlıkta (`shell/mobile-navigation.tsx`) doğrudan `/bildirimler`. Sayaç odağa dönüşte ve 60 sn'de bir |
| Satır | `components/notifications/notification-row.tsx` | Kategori ikonu (lucide), başlık, gövde, göreli zaman, okunmamış noktası; dokununca `clicked` olayı + `webPath` |
| Kutu | `app/(app)/(shell)/bildirimler/page.tsx` + `notification-list.tsx` | Tümü/Okunmamış, gün grupları (Bugün · Dün · Bu hafta · Daha önce), imleçli "daha eski", boş durum, tercih özeti rayı |
| Tercihler | `app/(app)/(shell)/profil/bildirimler/` | Bu tarayıcıda web push (mevcut `web-push.ts` ile token kaydı/silme), push ana anahtarı, hatırlatma saati çipleri + özel saat, sessiz saat, kategori anahtarları (`system` ve `question_report` "Her zaman açık"), e-posta rıza durumu + token'lı tercih bağlantısı |
| Açılma izi | `components/notifications/notification-open-tracker.tsx` (AppShell içinde Suspense) | Web push bağlantısı `?nid=` ile gelir (push.service webLink); kabuk `opened` olayını yazar, parametreyi siler. `/bildirim?git=` sıçraması `nid`'i taşır |
| UI kiti | `components/ui/switch.tsx` | Yeni primitif (44 px, `role="switch"`) |
| Yardımcılar | `lib/notifications.ts` (+ test) | Tipler, gün gruplama, göreli zaman, güvenli web yolu |

Profil "Kısayollar" kartına Bildirimler ve Bildirim tercihleri eklendi. API: `GET /me/notifications/settings` artık
`email` (abone, konular, `preferencesUrl`) döner.

## Doğrulanan
Giriş sonrası `/bildirimler` boş durum → 5 örnek bildirim → liste gün gruplu, zil rozeti 5 → panelden satıra dokunma
`POST …/events` 201, Performans'a gitti, rozet 4 → tercih sayfasında anahtarlar ve çipler `PATCH /me/notifications/settings`.
Web push anahtarı lokalde "yapılandırılmadı" (Firebase web anahtarları yok); prod'da mevcut `NEXT_PUBLIC_FIREBASE_*` ile çalışır.

## Bilinen sınırlar
- Kutudaki "görünür olunca okundu" yok (kasıtlı): okuma dokunuşla ya da toplu düğmeyle.
- Bugün ekranında kampanya kartı (`createInAppBanner`) F2.
- Satır ikonu kategoriye göre; görsel (`imageUrl`) F1 web'de gösterilmiyor.
