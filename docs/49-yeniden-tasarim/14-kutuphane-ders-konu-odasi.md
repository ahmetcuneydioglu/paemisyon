# Kütüphane — Ders odası ve Konu odası (plan, onaylı 20 Eki 2026)

Figma: PaemisyonNew sayfa "Page 1" → "Ders odası · Koyu/Açık" (15:621 / 15:816),
"Konu odası · Koyu/Açık" (15:740 / 15:935), tam akışlar 15:1026 / 15:1146.
Karar: ders kartına dokunan kullanıcı menü değil **ders odası** görür: durum paneli → koç
satırı → **konular (gövde)** → araçlar → tek "Başla". Konuya dokununca **konu odası**
(küçük sayfa): durum, koç cümlesi, "Bu konuda" (yanlışlar, favoriler, ilgili maddeler),
"Başla · <konu>'dan 10 soru" + ikincil "Yanlışları çöz". Bilgi kartları KARAR BEKLİYOR —
kodda hiç gösterilmez (ne satır ne yer tutucu). "Son turların" ilk sürümde yok (konu
bazlı tur geçmişi tutulmuyor; sonra).

## Kurallar
- Veri ve cümleler sunucudan (`/me/course-room/:courseId`, `/me/topic-room/:topicId`);
  istemci eşik bilmez. Yüzde tonu sunucudan gelen `band`: `weak` (<%50), `normal`,
  `strong` (≥%75) — Performans zayıf konu eşiğiyle aynı sabitten.
- "En zayıf" = konu listesindeki en düşük doğruluk (en az 5 çözümlü konular arasında).
- Tur kaynakları: `source: "course_room" | "topic_room"` (HomeSource'a eklenir).
- Native başlık tek satır ("Yürütme"); ders adı panel üstünde etiket.
- Kaynak etiketi/sourceLabel yine gösterilmez.

## Aşamalar
| K1 API | `CourseRoomService`: ders durumu (doğruluk, çözülen, sınav payı, en zayıf), konular (ad, soru, doğruluk, band, plan bağı), araç sayıları (yanlış, favori, kanun madde sayısı + slug), koç cümlesi; konu odası: durum, band, planda mı, yanlış/favori sayısı, ilgili madde aralığı (topic↔article eşlemesi varsa), koç cümlesi | spec'ler; E2E yerel |
| K2 Expo | `kutuphane/ders/[id]` ders odası olarak yeniden; yeni `kutuphane/konu/[topicId]`; kit: `StatPanel`(panel), `TopicRow`; source'lar | sim + telefon |
| K3 Web | `/kutuphane/ders/[id]` ve `/kutuphane/konu/[id]` aynı iki ekran | pane + axe |
| K4 | Bilgi kartları — ayrı plan (dayanaklı, önceden üretilmiş, insan onaylı) | — |

## İlerleme
- **K1 API (20 Eki 2026, 52a2a6b):** `modules/rooms` — `GET /me/course-room/:courseId`
  (ders: doğruluk/çözülen/band, hedef sınavdaki bölüm payı, en zayıf konu, koç cümlesi,
  konular + alt konular [solved, accuracyPct, band, inPlanThisWeek, isPremium, isLaw,
  lawSlug], araçlar: açık yanlış, favori (herhangi listedeki tekil soru), yayımlı mevzuat
  madde sayısına göre), `GET /me/topic-room/:topicId` (konu özeti, plan bağı + kalan dk,
  son 5 cevaptan koç cümlesi, yanlış/favori, ilgili madde aralığı). `rooms.logic` saf (band
  tek eşik `zayif-konu.ts`: <10 çözüm sparse, zayıf <%60, güçlü ≥%70; 5 spec). Tur
  kaynakları `course_room`/`topic_room`. E2E yerel API: boş ders → "ilk turun seni bekliyor",
  12 cevap sonrası %33/weak, koç "12 sorunun 4'ü doğru", konu odası "Son 5 cevabın 1'i doğru",
  404 doğru. Not: Anayasa Hukuku'na 12 mevzuat bağlı — istemci 3 ana metin + "N mevzuat
  daha" gösterir. API 457 test.
- **K2 Expo (20 Eki 2026):** `kutuphane/ders/[id]` ders odası olarak yeniden (eski sheet'li
  ders detayı kalktı): `RoomStatPanel` (panel; yüzde yoksa "Henüz çözülmedi"), `CoachLine`,
  konu satırları (ince ilerleme, band tonu sunucudan, Premium kilidi, "Planında" rozeti,
  alt konular girintili) → konu odası, Araçlar (yanlışlar → review turu, favoriler → Tekrar,
  en çok 3 mevzuat + "N mevzuat daha"), sabit "Başla · 10 soru · <ders>". Yeni
  `kutuphane/konu/[topicId]`: panel (ders adı etiket), koç cümlesi, Bu konuda (yanlışlar,
  favoriler, ilgili maddeler → Madde Atlası), plan kalan dk, sabit "Başla · 10 soru · <konu>"
  + ikincil "Yanlışları çöz · N". Etiketlerde ek yok (ünlü uyumu). Bilgi kartları ve tur
  geçmişi yok. `features/rooms/queries.ts` (tipler, hook'lar, `bandTone`). **Göz testi
  (iPhone 17, yerel API, geçici hesap):** ders odası %33/weak, koç cümlesi, 16 konu, araçlar;
  konu odası "Son 5 cevabın 1'i doğru", yanlış 8; Başla → 10 soruluk tur, DB'de
  `source=topic_room`. Bugün görevi de planın konusunu gösterdi ("Planında bu hafta: Genel
  Kültür" / "Başla · 8 soru · Genel Kültür"). Kalan: telefon turu, web (K3).
- **Telefon turu düzeltmeleri (20 Eki 2026):** (1) Uzun "En zayıf" konu adı (3201 Sayılı
  Emniyet Teşkilat Kanunu) panelin sol sütununu sıkıştırıp rakamı dikey kırıyordu —
  `RoomStatPanel` sol sütun sabit, sağ sütun esnek + 2 satır. (2) Favoriler satırı Tekrar
  sekmesine gidiyor, soru açmıyordu: sunucu favori turunu yalnız kapsamsız kabul ediyordu →
  `fromBookmarks` artık ders/konu kapsamıyla çalışır (soru havuzu kapsamla süzülür); odalar
  kapsamlı favori turu başlatır. Ayrıca favori sayısı yanlış tablodan (kişisel listeler)
  okunuyordu → `bookmarks` (raw join). E2E: yer imi 1 → konu/ders favoriteCount 1, kapsamlı
  turlar 201.
- **Yanlışlar satırı (20 Eki 2026):** aynı kök neden — sunucu `review` turunu kapsamla
  reddediyordu ("Yanlış tekrarı kapsam almaz"). Artık `review` + `topicId`/`courseId` kabul
  edilir, yanlış havuzu o kapsamla süzülür (konu listesi `topicIds` hâlâ reddedilir). E2E:
  iki derste yanlış → konu kapsamlı review 5 soru tek konu, ders kapsamlı 5, kapsamsız 9.
- **K3 Web (20 Eki 2026):** `/kutuphane/ders/[id]` ders odası olarak yeniden (DataTable'lı
  ders detayı kalktı; `/catalog/modules` dolaşımı yerine tek `/me/course-room`), yeni
  `/kutuphane/konu/[id]`. Kit: `components/rooms/RoomStatPanel` (panel, sol sütun sabit),
  `CoachLine`, `ToolRow` (href yoksa pasif); `lib/rooms.ts` (`bandTextClass`, `kisaAd`);
  `public-api.ts` CourseRoom/TopicRoom/Band. Başla düğmesi başlıkta sağda (web'de sabit alt
  çubuk yok; sayfa kısa). Yanlışlar/favoriler `/seans?mode=review|favorites&courseId|topicId`
  — oynatıcıya `source` parametresi eklendi (course_room/topic_room). Mevzuat satırları
  `/kanun/<slug>`'a, "N mevzuat daha" `/kanunlar`'a. **Doğrulama:** tsc 0, eslint 0,
  tokens-check 218/0 (ilk denemede `rounded-sm` yakalandı → kaldırıldı), vitest 80/80;
  panelde geçici hesap: ders odası (%17 weak, koç cümlesi, 16 konu, araçlar), konu odası,
  375 px taşma yok, axe koyu+açık 0; ders kapsamlı yanlış turu `/seans`'ta 201 ile açıldı.
  Kalan: push (API+web+mobil birlikte), bilgi kartları planı (K4), web Kütüphane kapı
  kartları 1280 px (F9-E ile).
