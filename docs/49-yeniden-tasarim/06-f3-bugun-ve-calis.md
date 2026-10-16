# Doc 49 / 06 — F3: Bugün (Yerleşim B, 8 durum, odak sheet) ve Çalış (seans, sonuç)

Tarih: 16 Ekim 2026. Dal `claude/f3-bugun-calis`. Plan: `00-plan.md` §3 F3.
Kapanış ölçütü: beta hesabında gerçek veriyle, simülatörde tam tur.

## Figma'dan ne alındı

Doc 48'in onaylı wireframe'leri (`qHrLLOXtJSIqpKxTx2FrYi`, sayfa "Wireframe — Bugün")
yerleşim referansı olarak okundu: B1–B8 (Yerleşim B, sekiz durum) ve O1–O4 (odak akışı).
Nöbet dili bu yerleşimlerin üstüne giydirildi; Faz 2 karar listesi (zayıf konular başta,
dönüşte gizli, kartta tek ilerleme, "Şimdilik bitir" bağlantısı, odak üç satır, ders→konu
inişi aynı sheet'te, kök düğme seçimi söyler) birebir uygulandı. Kapanan ekranlar aynı
dosyaya Nöbet aynası olarak yazılır (bkz. §Figma aynası).

## Bugün (`app/(tabs)/index.tsx`)

- Durum satırı: `CountdownHeader` (resmî/kişisel tarih; yoksa "Tarih bekleniyor"), haftalık
  noktalar `gamification.weekly`.
- Görev kartı `TaskHero`: `todayTask.kind` → yedi tür; `reason` tek satır gerekçe; `progress`
  tek ilerleme; `resume` türünde "Şimdilik bitir, sonucu gör" (`finishSessionId`); `secondary`
  en çok bir ikincil satır (D4).
- Hazırlık: en zayıf 3 konu satırı ("10 soru ›", `home_weak_topic` kanalı), dönüşte gizli;
  ders satırları `CourseTile` (`home_suggestion`); veri yoksa dürüst boş durum.
- Yerleşim B çubuğu: "Odak · <etiket> ▾" + sunucunun `todayTask.action.label`'ı; `done`
  türünde ikincil stil; `resume`/`exam` türünde odak düğmesi yok.
- Çevrimdışı: `NetworkError` → son bilinen brief (react-query önbelleği) + uyarı + CTA'da
  "Çevrimdışı" rozeti; yarım tur devam eylemi açık kalır.
- Sekiz durumun hepsi sunucu alanından çizilir; istemci hiçbir eşik bilmez.

## Odak sheet'i (`src/features/home/focus-sheet.tsx`)

Üç satır tek anatomi (radyo); "Ders veya konu" aynı sheet içinde dersler → konular
("Dersin tamamı" ilk satır, `mastery`/`solvedCount`/zayıf, premium rozeti). Seçim
`PUT /me/focus`; brief yeniden çekilir, CTA etiketi sunucudan gelir ("Başla · 5 soru ·
Anayasa"). Kapanınca köke döner; odak gün boyu kalır.

## Seans oynatıcı (`app/seans.tsx`) ve sonuç (`app/sonuc.tsx`)

- Params: `resume=<sessionId>` ya da `source, count, recipe, focusKind, courseId, topicId`.
  `wrongs` odağı `mode=review`, diğerleri `practice`.
- Dokunuş cevaptır; `POST /quiz/sessions/:id/answers` geri bildirimi anında: doğru/yanlış/
  kaçırılan doğru/pasif durumları ikonla; açıklama kartı; dayanak satırı; "Maddeyi oku"
  sheet'i (resmî metin, kaynak, doğrulama tarihi). Açıklama yoksa dürüst cümle.
- Son soruda "Turu bitir" → `POST /complete` (idempotent) → sonuç; Bugün brief'i geçersiz
  kılınır. Çıkışta onay; tur sunucuda kalır (Bugün'den devam). Çevrimdışı kuyruk F5.
- Sonuç: doğru/yanlış/boş, doğruluk, süre, konu kırılımı (sunucu verirse), yeni rozet,
  "Bugün'e dön".

## Doğrulama (16 Eki 2026, iPhone 17, beta hesabı)

- Bugün dönüş durumunda açıldı (zayıf konular gizli, "Başla · 5 soru").
- Odak sheet → Ders veya konu → Anayasa Hukuku → premium konu: sunucu "Bu konu premium
  içeriktir" dedi, hata sheet'te göründü (→ premium rozeti eklendi); "Anayasa" seçildi,
  görev kartı ve CTA sunucudan güncellendi.
- Tur: 5 soru cevaplandı (biri dört şıklı eski soru, biri açıklamasız), geri bildirim
  durumları doğru; sonuç 4/5, %80, 1 dk; Bugün'e dönüş.
- Lint: React Compiler kuralları için saat erişimi olay işleyicisine, tur bitirme effect'ten
  olaya taşındı.

## Dışarıda bırakılanlar

- `open_exams` eylemi Denemeler yer tutucusuna gider (F4).
- Mevzuat "kaldığın yer" satırı: `GET /me/reading-progress` ile F4 Kütüphane'de.
- Çevrimdışı cevap kuyruğu ve push kaydı: F5.
