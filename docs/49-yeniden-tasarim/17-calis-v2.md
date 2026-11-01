# Doc 49/17 — Çalış v2: "Ders seç → ne yapacağını seç"

Durum: **ONAYLI (1 Kas 2026) — kod yazıldı; web ve iPhone 17 doğrulandı; SE görsel doğrulaması ve deploy bekliyor**
Figma (PaemisyonNew `91lHqxSXl25Gz585TnXqfi`, koyu):
- `108:303` Çalış · kart ızgarası (kaydırmasız) — **seçilen ana ekran**
- `105:151` Ders odası · 2×2 eylem kutuları
- `105:302` Konu eylem sayfası (sheet)
- `105:6` Çalış · liste — reddedildi, yalnız karşılaştırma için duruyor
- Bileşenler: `104:2` (Ders kartı `108:295`, Eylem kutusu `104:64`, Ders satırı `104:54`, ikonlar)

## 1. Sorun

Çalış sekmesi iki ayrı şeyi karıştırıyor: ders kartları (yalnız istatistik gibi
görünüyor, içinde ne olduğunu söylemiyor) ve genel "Araçlar" (yanlış, favori, özet,
plan). Aynı araçlar ders odasında da var; kullanıcı hangisini kullanacağını
bilmiyor. Kartlarda "Ağırlık %10" her derste aynı, bilgi taşımıyor. "Konu özetleri"
satırı koda Anayasa'ya özel gömülmüş (`index.tsx:29`).

## 2. İlke

Her seviyede **aynı dört eylem**, yalnız kapsam daralır:

| Seviye | Soru çöz | Konu oku | Yanlışlarım | Favorilerim |
|---|---|---|---|---|
| Çalış (bütün dersler) | Karışık 10 soru | — | Tüm yanlışlar | (tekrar ekranında sekme) |
| Ders odası | dersten 10 soru | ünite özetleri + madde metni | dersin yanlışları | dersin favorileri |
| Konu sayfası | konudan 10 soru | konunun ünite özetleri | konunun yanlışları | konunun favorileri |

Sayılar ve "var/yok" kararları sunucudan gelir; istemci kural bilmez.

## 3. Ekranlar

### 3.1 Çalış ana ekranı (`108:303`)
1. Başlık: "Çalış" + hedef sınav adı.
2. **Kaldığın yer şeridi** — yalnız taze yarım tur varsa (`activeSession`, koçun
   kullandığı aynı tanım: `answered > 0`, son etkinlik taze). "KALDIĞIN YER ·
   <kapsam> · 6/10 · 4 soru kaldı" + "Devam et" (→ `/seans?resume=`). Yoksa şerit
   hiç çizilmez ve ızgara alanı büyür.
3. **Dersler** — 2 sütun kart ızgarası, ağırlığa göre sıralı. Kart: ad (≤2 satır),
   hâkimiyet yüzdesi (Lora, bant rengi), tek künye ("18 yanlış" / "Yanlış yok" /
   ağırlık diğerlerinden farklıysa "Sınavda %30"), 4 pt çubuk. Dokununca ders odası.
4. **Hızlı eylemler** — iki hap düğme: "Karışık 10 soru", "Tüm yanlışlar · N"
   (→ mevcut `kutuphane/tekrar`; favoriler orada sekme).
5. Kaldırılanlar: "Araçlar" bölümü, Anayasa'ya özel özet satırı, "Haftalık planım"
   (Bugün ve Ben › Ayarlar'da zaten var), "Serbest tur" başlığı.

**Ekrana sığma:** ızgara satırları `flex: 1` ile kalan yüksekliği paylaşır.
Kart için alt sınır 96 pt (2 satır ad + değer + çubuk). Kalan alan 4 satıra
yetmiyorsa (iPhone SE 667 pt, büyük Dynamic Type) ekran kaydırmaya düşer ve kartlar
96 pt'de sabitlenir — içerik asla kırpılmaz. Tablette ızgara 3–4 sütuna çıkar
(genişlik ≥ 600 pt → 3, ≥ 900 pt → 4).

### 3.2 Ders odası (`105:151`)
- Stat şeridi aynı (`RoomStatPanel`), koç cümlesi aynı yerde kalır.
- **2×2 eylem kutuları** (yeni `ActionTile`): Soru çöz (birincil, altın) · Konu oku ·
  Yanlışlarım (N) · Favorilerim (N). Sayı 0 ise kutu sönük, alt yazı nedenini söyler
  ("Açık yanlış yok"), dokunulamaz ama ekran okuyucuya "devre dışı" der.
- Alttaki sabit "Başla" çubuğu kalkar (görevini Soru çöz kutusu alır).
- "Araçlar" bölümü kalkar; **Konu oku** bir sheet açar: ünitesi olan konular
  (ünite sayısı, okunan) + dersin mevzuat metinleri (bugünkü `tools.legislation`).
- Konular listesi aynı; satır künyesine "N ünite özeti · N yanlış" eklenir.
  Satıra dokununca **konu eylem sayfası** açılır (ayrı ekran değil).

### 3.3 Konu eylem sayfası (`105:302`)
Mevcut `Sheet` bileşeni. Başlık + "Ders · %38 doğru · 24 soru"; birincil "Soru çöz ·
bu konudan 10 soru"; satırlar: Özeti oku (N ünite · M'si okundu → üniteler;
tek ünite varsa doğrudan `/ozet/[slug]`), Yanlışlarım (N), Favorilerim (N). Sıfır
olan satır sönük. Mevcut `konu/[topicId]` ekranı "Özeti oku" hedefi olarak kalır
(ünite listesi + en zayıf ünite notu orada zaten var).

## 4. API (C1)

1. **`GET /me/study`** (rooms modülü) — Çalış ana ekranının tek kaynağı:
   ```
   { resume: { sessionId, scopeName, answered, total } | null,
     courses: [{ id, name, icon, weightPercent, accuracyPct | null, band,
                 wrongCount, favoriteCount, summaryUnitCount, note }],
     totals: { wrongCount, favoriteCount } }
   ```
   `note` künye metnini sunucu kurar (yanlış sayısı / "Yanlış yok" / farklı
   ağırlık). `resume` koçun `activeSession` tanımını yeniden kullanır (kopya
   kural yok). Yanlış ve favori sayıları ders başına tek `groupBy` ile;
   ücretsiz planın 7 gün tekrar sınırı sayımda da uygulanır (bugünkü tekrar
   kuralıyla aynı yerden).
2. **`/me/course-room`** genişler: `tools.summaryUnitCount`, konu başına
   `summaryUnitCount`, `wrongCount`, `favoriteCount` (konu sayfası için).
3. **`/me/topic-room`** değişmez (üniteler, ilerleme zaten var); sheet sayıları
   course-room'dan gelir, ayrıca istek atılmaz.
4. Testler: `rooms.logic.spec.ts`'e künye/sıralama/resume birim testleri;
   bağlantı sınırı nedeniyle sorgular `Promise.all` içinde en fazla mevcut
   course-room kadar paralel.

Oturum başlatma tarafında değişiklik yok: konu/ders kapsamlı tekrar ve favori
turları sunucuda zaten destekleniyor (`quiz.service.ts` `mode=review` + `topicId`
/`courseId`, `fromBookmarks` + `topicId`/`courseId`).

## 5. Expo (C2)

Yeni bileşenler (kit, yeniden kullanılabilir — galeriye de eklenir):
- `CourseCard` (`components/domain`) — `CourseRoomCard`'ın yerini alır; props:
  `name, accuracyPct, band, note, onPress`, `minHeight` ızgaradan gelir.
- `ResumeStrip` (`components/domain`) — sol altın çizgili panel + Devam et.
- `ActionTile` (`components/ui`) — `icon, title, subtitle, variant: primary|default,
  disabled`; ≥44 pt hedef, `accessibilityState.disabled`.
- `PillButton` (`components/ui`) — hızlı eylem hapları (varsa mevcut düğme
  varyantına eklenir, yeni bileşen açılmaz).
- `TopicActionSheet` (`components/domain`) — mevcut `Sheet` üstünde.
- `ReadingSheet` (`components/domain`) — ders odası "Konu oku".

Ekranlar: `(tabs)/kutuphane/index.tsx` yeniden yazılır (`useStudyHub`),
`ders/[id].tsx` eylem kutuları + sheet'ler; `konu/[topicId].tsx` değişmez.
Kaynak etiketi (`source`) değerleri: `study_hub`, `course_room`, `topic_room`.

Tema: bütün renkler token'dan (bant tonları `success/accent/danger`), açık temada
aynı yapı. Animasyon: kart basışı opaklık + hafif ölçek (mevcut desen), sheet
yerleşik geçişi. Dynamic Type: ad 2 satırda kesilir, kart yüksekliği büyür,
ızgara kaydırmaya düşer.

## 6. Doğrulama

- Simülatör: iPhone 17 Pro (852) kaydırmasız sığma; SE (667) kaydırma ve kırpılma
  yok; iPad 3 sütun; koyu + açık; en büyük Dynamic Type.
- Akışlar (gerçek hesap, canlı API): yarım tur → şerit → Devam et; ders kartı →
  oda → dört kutu; konu → sheet → konu yanlışları turu (sorular gerçekten o
  konudan); favori 0 olan konuda satır sönük.
- Figma karelerinin görüntüsüyle yan yana karşılaştırma; sapmalar burada ve
  kullanıcıya yazılır.
- API: `npx nest build` + birim testleri; deploy tek kalemde.

## 7. Sıra

C1 API → C2 Expo (ana ekran → ders odası → sheet'ler) → doğrulama → deploy
(API önce; eski istemci yeni uçları kullanmadığı için geriye uyumlu) →
TestFlight kararı kullanıcıda.

## 8. Açık sorular

1. Açık tema Figma'da çizilsin mi, yoksa token'larla koda geçip ekrandan mı
   onaylanır? (Öneri: koddan onay; Figma ajan bütçesi kısıtlı.)
2. Web'deki Kütüphane kapıları aynı yapıya taşınsın mı? (Bu planın dışında.)

## 9. Uygulama notları ve plandan sapmalar (1 Kas 2026)

**API:** `GET /me/study?moduleId=` (rooms modülü; `moduleId` web'in sınav seçicisi için, verilmezse hedef
sınav). Yarım tur seçimi koçtan `today-task.logic.ts`'e taşındı (`yarimTurSorgusu`, `enTazeYarimTur`) —
Bugün ve Çalış aynı turu görür; şerit yalnız en az bir cevabı olan taze turda (`kaldiginYer`). Künye
(`dersKunyesi`, `konuKunyesi`) ve yaygın ağırlık sunucuda, birim testli. `course-room` konu satırına
`wrongCount`, `favoriteCount`, `units {count, read, firstSlug}`, `note`; `tools.summaryUnitCount`.
Oturum kaynağına `study_hub` eklendi (DTO beyaz listesi).

**Sapmalar:**
1. Ücretsiz planın 7 günlük tekrar penceresi sayımlara UYGULANMADI — mevcut ders odası sayımlarıyla
   tutarlı kalındı (tur başlatmada pencere sunucuda zaten uygulanıyor). Ayrı karar konusu.
2. "Tüm yanlışlar" toplamı bütün dersleri sayar (tekrar ekranıyla aynı kapsam), yalnız hedef sınavı değil.
3. Hap etiketleri kısaldı ("Yanlışlar · N" / "Favoriler · N" / "Yanlışlarım") — 375 pt'de tek satır.
4. Ders adı kartta en çok 3 satır ("Ceza Muhakemesi Hukuku" dar ekranda 2 satıra sığmıyor).
5. Konu sayfasının altına "Konu sayfasını aç" eklendi (koç notu, plan, ilgili maddeler oradan).
6. Web'de başlık "Kütüphane" kaldı (kenar çubuğu adı); dört kapı kartı kalktı — Plan, Mevzuat,
   Yanlışlarım, Favorilerim kenar çubuğunda zaten var.
7. Tekrar ekranının sekme sayıları `/me/study` toplamından (liste 50 ile sınırlı olduğu için
   önceden "50" görünüyordu).

**Doğrulama:** API 138 birim testi + `nest build`; uç canlı veride salt okuma betiğiyle denendi
(PAEM 8 ders, sıralama ve künye doğru). Web (`web-calis-v2`, :3016) koyu/açık, 1280 ve 375 px'te
Kütüphane, ders odası, konu ve "Konu oku" diyaloglarıyla doğrulandı. Mobil: iPhone 17 (874 pt) açık ve
koyu temada gerçek hesapla — ızgara kaydırmasız sığıyor, ders odası, konu sayfası ve sayfadan
gezinme (iOS kapanış sonrası) çalışıyor. iPhone SE'de oturum olmadığı için görsel doğrulama yapılmadı. Yerel doğrulama Nest'siz bir
vekille yapıldı (`apps/api/scripts/_tek-seferlik/calis-v2-vekil.ts`, gitignore'da): yeni iki ucu
yeni kodla canlı DB'den salt okuma cevaplar, gerisini canlı API'ye iletir — yerel Nest canlı DB'ye
bağlanırsa bildirim işleyicisi (30 sn) çift gönderim riski taşır.
