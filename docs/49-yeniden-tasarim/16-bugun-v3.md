# Bugün v3 — "tek adım" ana sayfa ve Çalış sekmesi (plan, 30 Eki 2026)

Tarih: 30 Eki 2026. Kullanıcı: "ana sayfa tasarımı içime sinmiyor; GYSROTA'da doyuma ulaştım,
aynı klaslık Paemisyon'da yok". Teşhis (tartışma): sorun piksel değil bilgi mimarisi — F9'un
"Nöbet defteri" Bugün'ünde kahraman bir rakam (geri sayım), eylem değil; özet/soru/madde ayrı
ürünler gibi yan yana duruyor; kapılar çoğaldı (Kütüphane 4 kapı + odalar + Mevzuat sekmesi +
Planım). GYSROTA'nın klaslığı azlık ve hiyerarşiden geliyor: tek döngü, tek birincil düğme, sabit
ve az kart. Karar: **GYSROTA'nın iskeleti + Paemisyon'un kimliği** (Nöbet paleti ve Lora kalır).

Wireframe (düşük ayrıntı, kararlar işlenmiş): https://claude.ai/artifact/6T5n7KTNV1ZZEG5nbxU161

## 1. Bugün'ün görevi

Kullanıcıya bugün yapılacak tek şeyi söylemek ve onu bir dokunuşla başlatmak; geri kalan her şey
o tek şeyin bağlamıdır. Kurallar: ekranda tek birincil düğme ("Sıradaki" kartında); kart sayısı
sabit (5), veri yoksa dürüst boş durum; özet/soru/madde aynı adımın halkaları ("4 dk özet, sonra
10 soru"); geri sayım ve hafta bağlamdır; Bugün'de kapı yok.

## 2. Kararlar (kullanıcı, 30 Eki 2026)

1. **Geri sayım:** küçültülmüş ama görünür bir rakam (kahraman değil; üst satırda `display`
   boyunda değil `title` boyunda). Kullanıcı: "çok önemli değil bu kısım".
2. **Sekmeler: beş** — Bugün · Çalış · Denemeler · Mevzuat · Ben. (Kütüphane → Çalış.)
3. **Rota:** koç günün yoğunluğuna göre **2–6 madde** seçer; sabit sayı yok.
4. **Deneme hatırlatması** "Senin için" satırlarında yer alır.

## 3. Yerleşim (Bugün v3, yukarıdan aşağı)

1. **Üst satır:** selam + zil; altında geri sayım rakamı küçük ama görünür ("**184** gün · bu
   hafta 3/5") ve 7 günlük ince çizelge (WeekStrip7 kalır, küçülür).
2. **Sıradaki** (tek birincil kart, panel laciverti): etiket "ANAYASA · YÜRÜTME · en zayıf konun
   %42"; başlık Lora "4 dk özet, sonra 10 soru"; bir cümle gerekçe ("Dün 3 yanlışın bu
   konudandı"); altın düğme **Başla**. Yarım tur varsa kart **Devam et · 6/10 · 12 dk önce**
   olur. Adım türleri: özet, soru, madde (okuma), yanlış tekrarı, deneme; tür ikonla değil
   metinle anlatılır.
3. **Bugünün rotası:** 2–6 maddelik kontrol listesi (günün sorusu, özet, 10 soru, yanlış tekrarı,
   madde okuma, deneme…); tik dolu/boş; alt satır "1/4 · günlük hedef 20 soru: 5" + "Planım ›".
4. **Senin için:** üç satır, her biri tek dokunuşla eylem: yanlış kuyruğu (N soru → Çöz), ikinci
   zayıf konu (→ Başla), yaklaşan deneme (→ Hatırlat / Katıl).
5. **Bu hafta:** "142 soru · %71 doğru · sıra 41 / 1.203" tek satır.
Bildirim/uyarı şeritleri (çevrimdışı, kuyruk, koç hatası) tek şeride iner ve yalnız gerekince.

## 4. Çalış sekmesi (Kütüphane'nin yerine)

İki sabit bölüm: **Ders odaları** (ağırlığa göre 2 sütun kart: ad, ağırlık %, hâkimiyet %) ve
**Araçlar** (Yanlışlarım · Favorilerim · Konu özetleri · Haftalık planım, ince satırlar). Altta
"Serbest tur: Karışık 10 soru". Bugünkü dört kapı kartı araç satırına iner. Mevzuat ayrı sekme
kalır (karar 2).

## 5. Sunucu etkisi (plan)

- `/me/coach` yeni alan **`nextStep`**: `{ kind: 'summary'|'questions'|'article'|'review'|'exam'|
  'resume', title, reason, scope: {courseId, topicId, unitSlug?, articleRef?}, estimateMin,
  cta }` — Bugün yalnız bunu gösterir; kural sunucuda (CLAUDE.md: koç kuralları sunucuda).
- **`route`**: 2–6 kalem `{ key, kind, label, done, cta }` — plan kalemleri + günün sorusu +
  (varsa) deneme; koç yoğunluğa göre keser.
- **`forYou`**: 3 satır `{ kind, label, cta }` (yanlış kuyruğu, 2. zayıf konu, deneme).
- Mevcut alanlar (weekly.days, planBrief, countdown) kalır; TaskHero/PlanShiftList sözleşmesi
  Bugün'den çekilir, Planım kullanmaya devam eder.

## 6. Sıra

1. ~~Wireframe~~ (bu doküman + artifact).
2. **Figma:** PaemisyonNew'de tek yüksek ayrıntılı "Bugün v3" (koyu + açık) ve "Çalış" (koyu);
   kullanıcı agent'a çizdirir (prompt §7), ben incelerim.
3. API `nextStep` / `route` / `forYou` (+spec) → Expo Bugün v3 + Çalış → web /bugun aynı iskelet.
4. Telefon + :3012 doğrulama; sonra TestFlight adayı.

## 7. Figma agent promptu (PaemisyonNew, kopyala-yapıştır)

**Görev:** Paemisyon için **"Bugün v3"** ekranını çiz (393×852; koyu ve açık) ve **"Çalış"**
sekmesini (koyu). Bu dosyadaki "Nihai Bugün · Koyu" (7:1442) ve "Seans" sayfası görsel kaynaktır:
aynı renk, yazı tipi, köşe ve boşluk dili; ama Bugün'ün YERLEŞİMİ değişiyor. Kütüphane/değişken
arama; değerleri doğrudan uygula.

**Değerler (koyu / açık):** bg #121A26 / #FFFCF6 · surface #1E2B3C / #FFFFFF · surfaceAlt
#28374A / #EAE5DA · line #394657 / #D9D7CF · ink #F5F0E5 / #1B293B · inkSoft #BAC4D0 / #596371 ·
inkSubtle #94A0B0 / #6B7482 · accent #E8B46C · accentSoft #2E3447 / #F6E9D2 · accentInk #E8B46C /
#8B5E23 · onAccent #1B293B · panel #1E2B3C / #1B293B · panelInk #F5F0E5 · panelSoft #BAC4D0 ·
success #8FB39A / #5F8A6B · danger #E07A6B / #B8453A · warningInk #F0CB7E / #7A5416. Fontlar
Lora (500/600) ve Inter (400/500/600). Roller: title Lora 600 24/29 · heading Lora 600 20/27 ·
subhead Inter 600 15/20 · body Inter 400 16/25 · bodySm Inter 400 14/20 · label Inter 600 11/14
büyük harf +10%. Köşeler kart 10, kontrol 10, panel 4. Gölge yok; yüzeyler ton farkı ve 1 px line.

**İlke (bağlayıcı):** ekranda TEK birincil düğme (altın, "Sıradaki" kartında). Kart sayısı beş,
sabit. Geri sayım artık kahraman değil. Kart içinde kart yok. Aynı blokta en çok 3 yazı boyu.

**Bugün v3 yerleşimi (yukarıdan aşağı, 20 pt yan boşluk, bloklar arası 20):**
1. **Üst satır (56):** solda `bodySm` inkSoft "İyi akşamlar, Ahmet"; sağda zil ikonu (ghost,
   rozet "2"). Altında **bağlam satırı**: Lora 600 **28** "184" + Inter 15 inkSoft " gün · PAEM
   2027" aynı satırda; sağında Inter 14 inkSoft "bu hafta 3/5". Hemen altında 7 dilimli ince
   çizelge (2 pt; dolu günler success, bugün accent, kalan line).
2. **Sıradaki (birincil kart):** zemin `panel`, köşe 4, iç boşluk 20. Üstte `label` panelSoft
   "SIRADAKİ · ANAYASA · YÜRÜTME"; sağ üstte küçük hap "%42 · en zayıf" (surfaceAlt üstü ink,
   koyu şemada 28374A/F5F0E5). Başlık Lora 600 **24** panelInk "4 dk özet, sonra 10 soru". Altında
   Inter 15/22 panelSoft bir cümle: "Dün 3 yanlışın bu konudandı; önce özeti oku, sonra soruları
   çöz." Altta tam genişlik altın düğme 52 pt "Başla" (onAccent metin, Inter 600 16). İkinci
   varyant: **Devam et** — başlık "Anayasa · Yürütme turuna devam et", alt satır "6/10 · 12 dk
   önce", düğme "Devam et".
3. **Bugünün rotası:** `surface` kart, köşe 10, iç 16. Başlık `label` inkSubtle "BUGÜNÜN ROTASI"
   + sağda bodySm inkSoft "1/4". Dört satır (örnek), her biri 44 pt: solda 20 pt onay kutusu
   (dolu: success zemin + beyaz onay; boş: 1.5 px line), metin Inter 16 ink, sağda bodySm inkSoft
   süre/sayı: "Günün sorusu — doğru" (dolu), "Yürütme özeti — 4 dk", "10 soru — Anayasa", "Yanlış
   tekrarı — 4 soru". Satırlar arası 1 px line. Alt satır bodySm inkSoft "Günlük hedef 20 soru ·
   5" ve sağda accentInk "Planım ›". Madde sayısı 2–6 arasında değişir; iki satırlı bir varyant
   daha çiz (yoğun gün değil).
4. **Senin için:** `label` başlık, altında üç satır (surface kart, 56 pt satırlar, 1 px line):
   "Yanlış kuyruğu · 4 soru" → sağda altın kenarlı hap "Çöz"; "İdari Yargı · %48" → "10 soru";
   "Deneme 4 · Cmt 20:00 · 100 soru" → "Hatırlat". Haplar surface zemin, 1 px accent kenar,
   accentInk metin (açıkta kahve).
5. **Bu hafta:** tek satır, surfaceAlt zemin, köşe 10, iç 12: Inter 15 ink tabular "142 soru ·
   %71 doğru" sağda inkSoft "sıra 41 / 1.203".
Alt sekme çubuğu: Bugün (seçili, altın) · Çalış · Denemeler · Mevzuat · Ben.

**Çalış (koyu):** başlık Lora 600 24 "Çalış", sağda bodySm inkSoft "PAEM · Misyon". Bölüm
"DERS ODALARI · ağırlığa göre": 2 sütun kart (surface, köşe 10, iç 14, yükseklik 92): üstte Inter
600 15 ders adı, altta bodySm inkSoft "%30 ağırlık · %62 hâkimiyet" ve 2 pt ince ilerleme (accent
dolu). 4 kart + "Tümü ›". Bölüm "ARAÇLAR": dört ince satır (56 pt, 1 px line, sağda chevron):
"Yanlışlarım · 4 soru", "Favorilerim · 12 soru", "Konu özetleri · 12 ünite", "Haftalık planım".
Altta "SERBEST TUR" satırı: "Karışık 10 soru" + altın kenarlı hap "Başla". Sekme çubuğunda Çalış
seçili.

**Çizilecekler:** Bugün v3 · Koyu, Bugün v3 · Açık, Bugün v3 · Devam et varyantı (koyu),
Bugün v3 · Hafif gün (rota 2 madde, koyu), Çalış · Koyu. "Bugün v3" adlı yeni sayfa; auto layout;
katmanları token adıyla adlandır.

**Yapma:** 120 pt geri sayım, ikinci birincil düğme, kart içinde kart, gölge, gradyan, emoji,
ders rengi, altın metin açık temada zemin üstünde, dört kapı/ikon ızgarası.

## 8. Figma çizimi ve inceleme (30 Eki 2026)

PaemisyonNew sayfa **"ikon"** `63:261` (kullanıcı adı; içerik Bugün v3): Bugün v3 · Koyu `68:474`,
· Açık `68:577`, · Devam et varyantı `68:680`, · Hafif gün (rota 2) `68:783`, Çalış · Koyu `68:878`.
Ölçüler ve metinler promptla bire bir (bağlam satırı Lora 600 28 + Inter 15; panel köşe 4 iç 20;
başlık Lora 600 24; altın düğme 52; rota kartı surface köşe 10 iç 16, 44 pt satırlar, 20 pt onay
kutusu; Senin için 56 pt satırlar + altın kenarlı haplar; Bu hafta surfaceAlt 46 pt; sekme çubuğu
90). Renkler token değerleri; `Planım ›` ve haplar koyuda altın, açıkta kahve. **Onay: kod bu
çizime göre yazılır.** Kodda uygulanacak notlar (Figma'ya geri yazılmaz):
1. **Koyu temada hiyerarşi:** `panel` koyuda `surface` ile aynı (#1E2B3C); Sıradaki kartı ile rota
   kartı aynı tonda. Kodda ikincil kartlar kit `Card` gibi 1 px `line` kenarlı, Sıradaki kenarsız
   ve köşe 4 — fark kenar + köşe + altın düğmeyle taşınır. Açık temada sorun yok (lacivert panel).
2. **İlk ekran:** 852 pt'te Senin için ve Bu hafta katlanmanın altında kalıyor; kabul (kaydırma).
   Rota 5–6 maddeyken de böyle. Sıradaki kartı her zaman ilk ekranda.
3. **Ders odası kartı (Çalış):** "%30 ağırlık · %62 hâkimiyet" iki satıra kırılıyor; kodda iki ayrı
   küçük satır ("Ağırlık %30" / "Hâkimiyet %62") ve 2 pt ilerleme.
4. **Ben sekme ikonu** çizimde eksik (daire); kodda lucide `User` (F9'daki gibi).
5. Haftalık çizelge 7 dilim 2 pt: mevcut `WeekStrip7` bileşeni küçültülerek kullanılır.

## 9. İlerleme

- **API (30 Eki 2026):** `coach/home-v3.types.ts` (`HomeV3 = { nextStep, route, forYou }`),
  `coach/bugun-v3.logic.ts` saf modül (+9 spec): **nextStep** sırası deneme → taze yarım tur
  (devam) → dönüş/ilk tur → zayıf ünite reçetesi (`summary_then_questions`: "4 dk özet, sonra 10
  soru", eylem `open_summary` `/ozet/<slug>`; `questions`: maddeleriyle 10 soru, `articleNos`
  taşır) → hedef dolduysa yanlış tekrarı / dinlen → Doc 48 görev kartı. **route** 2–6 madde:
  deneme, özet, soru, yanlış tekrarı, Günün Quizi, bitmemiş plan kalemleri (sıradaki konu
  tekrarlanmaz); tamamlananlar sona. **forYou** en çok 3: yanlış kuyruğu, sıradakinden farklı
  ikinci zayıf konu, bugünkü ya da 7 gün içindeki ilk deneme ("Deneme 4 · Cmt 20:00 · 100 soru");
  azsa karışık 10 soru. `TodayTaskAction` eklemeli genişledi (`open_summary`, `articleNos`,
  kaynaklar `home_next`/`home_route`/`home_for_you` + paylaşım `share`; DTO listesine eklendi —
  `/s/<id>` derin bağlantısının `source=share` değeri DTO'da yoktu, 400 verirdi, kapandı).
  `CoachContext.exams.nextUpcoming` eklendi; `CoachBrief.homeV3` eklemeli. Yerel API prod cron
  tuzağı yüzünden çalıştırılmadı; doğrulama birim testleriyle, canlı doğrulama deploy sonrası
  geçici hesapla `/me/coach`. Coach suite 127/127, tsc 0 (prisma generate gerekti: başka oturumun
  `examQuestionAdjustment` modeli), eslint 0.
- **API ek (30 Eki):** `homeV3.week` — son 7 gün soru (`volume.last7`), haftalık aktif gün/hedef,
  rütbe adı (ab37aa1). Canlıda (03d8531 deploy) yeni hesapla `/me/coach.homeV3` doğrulandı:
  nextStep "Seni tanıyalım" (ilk tur), route ["10 soru","Günün Quizi"], forYou ["Haftalık Deneme-1 ·
  Paz 21:00 · 100 soru","Karışık 10 soru"]; `week` bir sonraki deploy'la.
- **Expo (30 Eki, 19383a2 + 5c1dbd1):** kit: `ExamContextLine` (Lora 28 geri sayım + "bu hafta
  3/5" + WeekStrip7), `NextStepCard` (panel, köşe 4, etiket + hap + Lora 24 + tek altın düğme;
  ikincil ghost satır), `RouteList` (surface + 1 px line, 20 pt onay kutusu, 44 pt satırlar,
  "Planım ›"), `ForYouList` (56 pt satır, altın kenarlı hap), `WeekSummaryLine` (surfaceAlt),
  `CourseRoomCard` (2 sütun; "Ağırlık %30" / "Hâkimiyet %62" iki satır + 2 pt ilerleme — §8 not 3).
  `app/(tabs)/index.tsx` Bugün v3: selam + zil; tek şerit (kuyruk > duyuru > çevrimdışı); bağlam
  satırı; canlı deneme penceresi açıksa `LiveExamPanel`, değilse `NextStepCard` (v3 yoksa Doc 48
  `todayTask`'tan türetilir); rota; senin için; bu hafta (`week` yoksa gizli). `run()`:
  `open_summary` → `/ozet/[slug]`, `open_exams` `/denemeler/<id>` → kurallar ekranı, `articleNos`
  → seans parametresi, `wrongs` odağı → `mode=review`. **Kaldırılanlar:** CountdownHero kahramanı,
  TaskHero, PlanShiftList, Hazırlık ve Derslerin listeleri, "Az ama her gün", alt eylem çubuğu
  (Odak + Başla) ve `FocusSheet` (günün odağı seçimi Bugün'den çıktı; sunucu tarafı duruyor).
  **Çalış:** sekme adı Kütüphane → Çalış; `kutuphane/index.tsx`: ders odaları ağırlığa göre 2 sütun,
  araçlar (Yanlışlarım, Favorilerim, Konu özetleri → Anayasa odası, Haftalık planım), serbest tur;
  Mevzuat bölümü çıktı (kendi sekmesi). Galeri "Bugün v3" bölümü. tsc 0, eslint 0. **Doğrulama:**
  telefon Metro'dan paketi aldı (kullanıcı hesabıyla görsel kontrol kullanıcıda); SE simülatöründe
  giriş denemesi Türkçe klavye eşlemesi ('-'→'*', '@'→''') ve askıda kalan `simctl` yüzünden
  başarısız — simülatör doğrulaması sonraki tura. Kalan: web /bugun aynı iskelet (adım 3).
- **Rota düzeltmesi (30 Eki, kullanıcı geri bildirimi — GYSROTA ekranıyla kıyas):** (1) adımlar
  numaralı ve bağlı (GYSROTA'daki 1-2-3-4 zaman çizgisi): `RouteList` numaralı daire + dikey bağ
  çizgisi, sağda "~N dk", tamamlanan adım success daire + onay + üstü çizili; sıra artık yerinde
  kalır (tamamlananlar sona atılmaz). (2) **Tamamlanma gerçek veriden:** API `home.todayTopicAnswered`
  (bugün konu başına cevap — `quiz_answers ⋈ quiz_sessions ⋈ questions` ham sorgu) ve
  `home.reviewDoneToday` (bugün tamamlanmış yanlış turu). Özet adımı her zaman listelenir, reçete
  `questions` ise okunmuş sayılır; "N soru" adımı konuda bugün ≥N cevapla tamamlanır (arada "4/10"
  ayrıntısı); yanlış tekrarı bugünkü tamamlanmış `review` turuyla; Günün Quizi oynandıysa; plan konusu
  bugün ≥10 cevapla; deneme katılımla. `RouteItem.estimateMin` eklendi (özet 4, soru 20 sn/soru,
  plan kalemi kalan dk). Spec 10, coach suite 128/128, tsc 0.
- **Rota özet adımı + Senin için favoriler (30 Eki, kullanıcı geri bildirimi):** (1) Rota, zayıf ünite
  reçetesi özet vermese bile okunmamış bir yayındaki ünite varsa **özet adımı** içerir:
  `SummariesService.nextUnreadUnit(userId, enZayıfKonular)` — önce en zayıf 3 konunun üniteleri, sonra
  herhangi biri, `sortOrder`; hepsi okunduysa adım yok. Süre tahmini ünitenin `readingMinutes`'i.
  (2) **Senin için** en çok 4 satır: yanlış kuyruğu (çözülmemiş yanlış varsa), **Favorilerim · N soru →
  "Tekrar et"** (`fromBookmarks` turu; `TodayTaskAction.fromBookmarks` eklendi, Expo `run()` seans'a
  `fromBookmarks=1` geçer), ikinci zayıf konu, yaklaşan deneme; ikiden azsa karışık 10 soru.
  `home.bookmarkCount` (`bookmarks` sayımı) ve `home.nextSummary` bağlama eklendi. Spec 11, coach
  suite 129/129, tsc 0, eslint 0.
- **Aşağı çek-yenile (31 Eki, kullanıcı geri bildirimi):** hiçbir sekmede yenileme yoktu. Kit
  `Screen` artık `RefreshControl` taşır; varsayılan davranış ekrandaki aktif react-query
  sorgularını yeniden çeker (`refetchQueries({ type: "active" })`), `onRefresh` ile özelleştirilir,
  `refresh={false}` kapatır. Bugün, Çalış, Denemeler, Mevzuat, Ben kökleri `Screen` kullandığı için
  hepsine birden geldi. Favori satırı: canlı API yeni sürümde (`week` + özet adımı doğrulandı);
  telefon eski `/me/coach` yanıtını önbellekten gösteriyordu — yenileyince gelir.
- **Bugünün sayımı (31 Eki, kullanıcı sorusu "kart olsun mu?"):** karar satır, kart değil (tek
  kahraman kuralı; GYSROTA'da da satır). Rota alt satırı: "Bugün 150 soru · %80 doğru · hedef 20 ✓";
  sıfırda "Bugün henüz başlamadın · hedef 20 soru"; dokununca Performans. Yanlış sayısı yazılmaz
  (yanlışlar rota/Senin için'de eylem olarak duruyor; rakam bir yerde, eylem bir yerde). API
  `homeV3.today {answered, correct, accuracyPct, goal}` — ham sorguya `COUNT(*) FILTER (WHERE
  a.is_correct)` eklendi; `home.todayTotals`.
