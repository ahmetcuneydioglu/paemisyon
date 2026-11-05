# Doc 56 / 06 — Aşama 7: entegrasyon ve test

Tarih: 5 Kasım 2026. Durum: **yerel uçtan uca turu yapıldı (web + admin + API); iki görsel kusur
düzeltildi; cihaz testi, üretim hattı betikleri ve bayrak açma bekliyor.** Önceki: [05-f6-admin.md](05-f6-admin.md).
Aşama 1–6 PR #19 ile main'de (5 Kas 02:24 UTC); bu belge o kodun lokal doğrulamasını anlatır.

## 1. Düzenek (yerel; prod'a dokunulmadı)

| Parça | Değer |
|---|---|
| Veritabanı | Docker `paem-ozet-pg` (:55432, `paem`): Yasama I ünitesi yayında, Anayasa md 75–86 + 101/106 mevcut. `prisma migrate deploy` ile `20261105000000_bilgi_kartlari` uygulandı. |
| Deste | `scripts/kart-yukle.ts docs/56-bilgi-kartlari/pilot/anayasa-yasama-1.json` → 28 kart `in_review`, 35 referans. |
| Sunucular | launch.json `api-e2e-local` :3007, `admin-e2e` :3011, `web-doc54` :3015 (hepsi yerel DB). |
| Kimlik | Gerçek Supabase girişi (web: neilonlukas hesabı, rol `user`; admin: canahmettt, rol `admin`). |

## 2. Senaryolar ve sonuçlar

| Senaryo | Katman | Sonuç |
|---|---|---|
| Admin liste: beş istatistik (Yayında 0 · İncelemede 28 · Eskimiş 0 · Kontrol bekleyen 28 · Toplam 28), filtreler, kaynak etiketi "yalnız panel" | Panel | ✓ |
| Kart ayrıntısı: doğrulama raporu (`✓ 3 → referans metninde`), md 86 resmî metni, "Yayına hazır" kapısı, AI uyarısı | Panel | ✓ |
| Panelden tek kart yayını → durum "Yayında", `audit_logs` `flashcard.publish` 1 satır | Panel + API | ✓ (kalan 27 kart yalnız yerel DB'de SQL ile yayına alındı; prod'da 28'i de incelemede) |
| **Kapı**: bayrak kapalı + rol `user` → `POST /me/flashcards/sessions` 404 `FLASHCARDS_DISABLED`, web "Bilgi kartları henüz açık değil" | API + web | ✓ |
| **Beta yolu**: aynı kullanıcıya `beta` rolü (yerel SQL) → oynatıcı açıldı. Not: `UserSyncService` rol önbelleği 60 s; rol verildikten sonra bir dakika 404 sürer. | API | ✓ |
| Oynatıcı: 20 kart "Tüm kartlar", çevirme (düğme + Boşluk), Biliyorum → `events` 201, "Biliyorum işaretlendi · Geri al" şeridi, 2/20 | Web | ✓ |
| Her sayfa yüklemesi tek oturum açar; yeni oturum öncekini kapatır (`completed_at`) — strict-mode çift effect yalnız hatalı istekte görüldü | API | ✓ |
| "Bu konudan soru çöz" → `/seans?topicId&count=10&source=flashcards&scope=…` → `POST /quiz/sessions` 201, 10 soru, md 76/83 Anayasa soruları, şık grubu çizildi | Web + API | ✓ (ünitesiz "Tüm kartlar" kapsamında madde daraltması yok; ünite kapsamında `articleNos` gider) |
| Bugün rotası: "Kart tekrarı · 1 kart · kuyruk temiz" adımı 3. sırada, tamamlandı işareti | Web | ✓ |
| Performans: "Bilgi kartları" bloğu — Öğrenildi 0/28, Tekrar 0 (kuyruk temiz), Bugün 1/20 (henüz ölçülmedi), ders satırı "Anayasa Hukuku 0/28 öğrenildi · Çalış" | Web | ✓ (tek "Biliyorum" öğrenildi saymaz — "tek doğru yetmez" kuralı) |
| Birim | API | `flashcards` + `admin/flashcards` 5 dosya / 56 test geçti; web `tokens:check` 0 hata; admin `tsc` + eslint temiz |

## 3. Bulunan ve düzeltilen kusurlar

1. **Web oynatıcı dar ekranda taşıyordu.** `.kart-cevirici` grid'inin tek sütunu `auto` olduğu için uzun
   soru metni kartı 702 px'e açıyordu (375 ve 718 px viewport'ta yatay kaydırma, metin kesik).
   Düzeltme `globals.css`: `grid-template-columns: minmax(0, 1fr)` + `.kart-yuz { min-width: 0 }`.
   375'te kart 343 px, `scrollWidth == innerWidth`. Aşama 4'te 1280 ve `next build` doğrulanmış,
   375 göz testi yapılmamıştı.
2. **Admin liste "Konu · ünite" sütunu** 1280 px'te bile kelime kelime kırılıyordu (tablo genişliği
   ön yüze gidiyor). Sütuna `min-w-[14rem] max-w-[18rem]` + `truncate` + `title` verildi.

İkisi de commit edilmedi (bu oturumun çalışma ağacında).

## 4. Yapılmayan / sıradaki

- **Cihaz testi (Expo):** reanimated + gesture-handler yeni dev build ister; kaydırma eşiği, jest/dokunma
  çakışması, uçak modu kuyruğu yalnız cihazda (SE / Pro Max). Henüz build alınmadı.
- **Üretim hattı:** `kart-girdi.ts` / `kart-uret.ts` yazılmadı; 47 ünite için türetim ayrı karar (maliyet + inceleme yükü).
- **İki cihaz arası ilerleme, yayından kaldırılan kartın kuyruktan düşmesi:** API spec'te var, canlı denenmedi.
- **Bayrak açma sırası:** prod'da pilot kartlar panelden tek tek yayınlanır → `beta` rolüyle canlı göz testi →
  `flashcards_enabled` panelden açılır. Bildirim preset'i `flashcards_due` `paused` doğar, panelden açılır.
