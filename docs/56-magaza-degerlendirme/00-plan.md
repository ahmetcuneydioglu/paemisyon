# Doc 56 — Mağaza değerlendirme istemi (App Store / Google Play)

Durum: **onaylı; F0+F1 yazıldı ve yerelde E2E doğrulandı** (3 Kas 2026). F2 Expo, F3 admin, F4 deploy sırada. Figma: dosya `1YZRWO3azniW8NU5CvV1BZ`,
sayfa "Mağaza Değerlendirme (Doc 56)" (`114:263`); B koyu `114:401`, B açık `114:470`,
B seri `116:27`, not kutusu `115:85`. A (satır içi kart) elendi, sayfada "ELENDİ" etiketiyle durur.

## 1. Amaç ve ilke

Mağaza puanı ve yorumu edinim için kritik. Kullanıcıya **yalnız mutlu anlarda**, **seyrek** ve
**kural dışına çıkmadan** "değerlendir" denir. İlkeler:

- Değerlendirme yalnız **yerel istemle** alınır: iOS `SKStoreReviewController`, Android
  Google In-App Review (`expo-store-review`). Özel yıldız diyaloğu yok; mağazaya dış bağlantı
  yalnız yedek yol.
- **Ön eleme yok.** "Beğendin mi?" diye sorup yanıta göre mağaza / geri bildirim ayrımı
  yapılmaz (Google In-App Review politikası bunu açıkça yasaklar; Apple hoş görmez). Bizim
  alt sayfa fikir sormaz, anı kutlar ve tek şey ister.
- **Kural sunucuda yaşar** (Doc 52 ile aynı ilke). İstemci hangi anda, kaç günde bir, kime
  sorulacağını bilmez; sunucunun verdiği `reviewPrompt` nesnesini gösterir ve sonucu bildirir.
- "Sorun bildir / öneri" yolu bu akışa bağlanmaz; Ayarlar'da her zaman durur.
- Metinde **yıldız ya da sayı geçmez** ("bir yıldız bırak" ters çağrışım yapar). Ad her yerde
  **Paemisyon**.

## 2. Yüzey (karar: B — alt sayfa)

Sonuç ekranı **kapatıldıktan sonra** (Bugün'e dönüş tamamlanınca) açılan alt sayfa; sonucu
örtmez. Hazır `Sheet` bileşeni (`apps/app/src/components/ui/sheet.tsx`) kullanılır.

| Parça | Değer |
|---|---|
| Etiket (label, accentInk) | ana göre: "Bir dakikan var mı?" / "7 günlük seri" / "30 günlük seri" / "Haftalık deneme" |
| Başlık (Lora SemiBold 24) | ana göre, sunucudan |
| Gövde (Inter 16/25, inkSoft) | ana göre, sunucudan |
| Birincil buton | **Değerlendir** → yerel istem |
| Hayalet buton | **Şimdi değil** → kapanır, sönüm başlar |
| Kapanış | kaydırma ve perdeye dokunma = "Şimdi değil" ile aynı |

Metinler (onaylı):

- **Varsayılan (mesaj 3):** etiket "Bir dakikan var mı?", başlık "Bugün iyi gitti.", gövde
  "Paemisyon'la çalışmak hoşuna gidiyorsa mağazadaki değerlendirmen bizim için çok şey ifade eder."
- **Seri (mesaj 4):** etiket "7 günlük seri" (30'da "30 günlük seri"), başlık "7 gündür
  buradasın.", gövde "Bu düzeni Paemisyon'la kurduysan mağazada anlat. Bir sonraki aday belki
  senin cümlenle başlar."
- **Haftalık deneme:** etiket "Haftalık deneme", başlık "Bu hafta üst dilimdesin.", gövde mesaj 3'ün
  gövdesi. (Yeni metin değil; varsayılanın başlığı değişir.)

Erişilebilirlik: butonlar ≥44 pt; sheet açılınca odak başlığa; VoiceOver'da perde "Kapat".

## 3. Tetik anları ve engeller

**An (moment)** — sunucu, tur tamamlanınca sırayla bakar, ilk tutan kazanır:

1. `streak_30`: seri bugün 30'a ulaştı
2. `streak_7`: seri bugün 7'ye ulaştı
3. `weekly_top`: bugün kapanan haftalık denemede kullanıcı üst %25'te (deneme sonucu ekranından
   dönüşte; finalize sonrası)
4. `personal_best`: ≥10 soruluk turda doğruluk kullanıcının önceki en iyisinin üstünde ve ≥%80
5. `badge`: bu turda yeni rozet kazanıldı (`earnedBadges.length > 0`)

**Engeller (hepsi geçilmeli):**

- Kayıttan bu yana ≥3 gün **ve** ≥5 tamamlanmış tur
- Son **30 gün** içinde hiçbir istem gösterilmemiş (gösterim = sheet açıldı)
- "Şimdi değil" denmişse son istemden ≥30 gün; "Değerlendir" denmişse ≥180 gün
- Son 14 günde soru bildirimi/şikayet ya da destek e-postası göndermemiş
  (`question_reports` ve destek kanalı; destek kanalı yoksa yalnız soru bildirimi)
- Tur kötü değil: doğruluk <%50 olan turda hiçbir an tetiklenmez (seri anı dahil; yarın sorar)
- Deneme (`mode = 'deneme'`) sonucu ekranında sorulmaz; haftalık için `weekly_top` ayrı
- Admin kill switch kapalı değil
- Platform iOS ya da Android (web'e hiç dönmez)

Apple yılda 3 gösterim kotasını kendisi uygular ve gösterip göstermediğini söylemez; bizim
"gösterim" kaydımız sheet'in açılmasıdır, yerel istemin değil.

## 4. Veri modeli

```prisma
model ReviewPrompt {
  id        String   @id @default(uuid())
  userId    String
  platform  String   // 'ios' | 'android'
  moment    String   // 'streak_30' | 'streak_7' | 'weekly_top' | 'personal_best' | 'badge'
  outcome   String   // 'shown' | 'accepted' | 'dismissed'
  sessionId String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
  @@map("review_prompts")
}
```

Satır `shown` ile açılır, istemci sonucu bildirince aynı satır `accepted` / `dismissed` olur
(`PATCH`). Kapanmadan uygulama ölürse `shown` kalır; sönüm hesabında `shown` da sayılır.

Ayar anahtarları (`SettingsService`, Doc 52 deseni):
`review_prompt_kill_switch` (bool, varsayılan false), `review_prompt_min_gap_days` (int, 30),
`review_prompt_after_accept_days` (int, 180).

## 5. API

- `completeSession` yanıtına `reviewPrompt: { id, moment, label, title, body } | null` eklenir.
  Hesap `ReviewPromptService.evaluate(userId, { sessionResult, earnedBadges, streakAfter,
  platform })` içinde; `platform` istemcinin gönderdiği `X-Platform` başlığından (yoksa null →
  istem yok). Eşzamanlı iki tamamlamada çift satır olmasın diye değerlendirme + `shown` satırı
  tek transaction'da, `userId` üstünde son 30 gün kontrolüyle.
- `PATCH /me/review-prompts/:id { outcome: 'accepted' | 'dismissed' }` — yalnız sahibi, yalnız
  `shown` → sonuç geçişi.
- Haftalık `weekly_top` için ayrıca `GET /me/review-prompts/pending` yok; deneme sonucu
  yanıtına aynı alan eklenir (finalize sonrası ilk sonuç görüntüleme).
- Admin: `GET /admin/review-prompts/summary` → platform × an × sonuç sayıları, son 30/90 gün.

Saf mantık `review-prompt.logic.ts` (an seçimi + engeller, spec'li); DB erişimi serviste.

## 6. Expo

- `expo-store-review` eklenir (config plugin gerekmez; Android için `com.google.android.play:review`
  Expo tarafından gelir).
- `sonuc.tsx` ve `deneme-sonuc`: yanıttaki `reviewPrompt` varsa `home()` yerine
  `router.replace("/(tabs)")` sonrası Bugün ekranı sheet'i açar. Taşıma: `useReviewPromptStore`
  (zustand, bellek içi) — sonuç ekranı `set(prompt)`, Bugün `useEffect` ile okuyup `Sheet`
  açar, açılınca `shown` zaten sunucuda; "Değerlendir" → `StoreReview.requestReview()` (iOS'ta
  `isAvailableAsync` yanlışsa `storeUrl` ile mağaza sayfası) → `PATCH accepted`; kapanış →
  `PATCH dismissed`.
- Bileşen: `ReviewPromptSheet` (`src/components/domain/`), galeriye (`app/galeri.tsx`) örnek
  eklenir; koyu/açık token'larla.
- `X-Platform` başlığı API istemcisine eklenir (`Platform.OS`).

## 7. Admin

Ayarlar sayfasına "Mağaza değerlendirme" bölümü: kill switch, iki gün sayısı; altında son 30
günün sayaçları (gösterim / kabul / erteleme, iOS–Android). Mağaza puanının kendisi dışarıdan
izlenir (App Store Connect / Play Console); panel yalnız bizim huniyi gösterir.

## 8. Fazlar

| Faz | İş | Doğrulama |
|---|---|---|
| F0 | Prisma modeli + migration, ayar anahtarları, `review-prompt.logic.ts` + spec | `npm test` (logic), lokal Docker DB'de migration |
| F1 | `ReviewPromptService.evaluate`, `completeSession` + deneme sonucu alanı, `PATCH` ucu, `X-Platform` | Docker DB'de tohumlu kullanıcıyla curl: 5 tur sonrası personal_best döner, 2. çağrıda null (30 gün), kill switch → null |
| F2 | Expo: `expo-store-review`, store, `ReviewPromptSheet`, Bugün'de açılış, galeri örneği | Simülatörde lokal API ile uçtan uca; dev client'ta `requestReview` sessiz kalabilir, telefonda Release ile görülür |
| F3 | Admin bölümü + özet ucu | Panelde sayaçlar gerçek veriyle |
| F4 | Deploy (push onayla), prod'da kill switch **açık** başlar; TestFlight/EAS ile mobil sürüm; 1 hafta sonra kill switch kapatılır | Prod SQL ile ilk gösterimler |

Tahmin: F0+F1 bir gün, F2 yarım gün, F3 yarım gün.

## 9. Açık sorular (onayda karar)

1. **Mevcut mobil sürümde çalışmaz:** sheet ve `expo-store-review` yeni derleme ister; web/API
   tarafı önce çıkar, alan `null` olmayan yanıtı eski istemci yok sayar (ek alan kırmaz).
2. `weekly_top` eşiği %25 mi, ilk 10 mu? Öneri %25 (katılım düşük haftalarda ilk 10 herkes olur).
3. "Destek e-postası gönderdi" sinyali bizde yok; şimdilik yalnız soru bildirimi sayılır.
4. Android'de In-App Review bazen hiç görünmez (Play kotası); yedek olarak "Değerlendir"e ikinci
   basışta mağaza sayfası açılsın mı? Öneri: hayır, tek basış; sessiz kalırsa kalır.

## 10. F0+F1 uygulama notu (3 Kas 2026)

- Kod: `apps/api/src/modules/review-prompt/` (`review-prompt.logic.ts` saf mantık + 9 spec,
  `review-prompt.service.ts`, `review-prompt.controller.ts` `PATCH /me/review-prompts/:id`,
  modül). `completeSession(userId, sessionId, reason, { platform })` ve
  `ExamsService.getAttempt(user, id, { platform })` `reviewPrompt` alanı döndürür; platform
  `X-Platform` başlığından (`ios` | `android`), yoksa hiç sorgu yapılmaz.
- Yarış koruması: `INSERT … WHERE NOT EXISTS (son minGapDays)` tek SQL; `setOutcome` yalnız
  `shown` satırını değiştirir, ikinci bildirim `changed:false` döner.
- Ayar anahtarları: `review_prompt.kill_switch`, `review_prompt.min_gap_days`,
  `review_prompt.after_accept_days` (Settings önbelleği 60 sn).
- Yerel E2E (Docker `paem-ozet-pg`, :55432/paem; API `api-doc56` :3023; betik scratchpad
  `doc56-e2e.sh`): kişisel rekor → `personal_best` istemi; PATCH dismissed → `changed:true`,
  tekrar → `changed:false`; ikinci tur → null (sönüm); başlıksız → null; kill switch → null;
  seri 6→7 → `streak_7` (rozet kazanılmasına rağmen öncelik seride). Not: test kullanıcısı
  premium yapılmalı (ücretsiz günlük soru kotası batch cevapları reddediyor) ve yalnız cevap
  anahtarı olan konu (`65aef8de…`) kullanılmalı.
- Açık soru 2 (haftalık eşik): kodda üst %25 uygulandı; 4 (Android yedek yol): yok.
