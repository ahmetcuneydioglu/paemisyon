# Doc 21 — İçerik Ağacı Yeniden Tasarımı (Kalıcı İçerik Mimarisi)

> Durum: TASLAK — onay bekliyor
> Kapsam: API + iOS + (gelecek) Android + Web + Admin Panel
> İlke: "Sınav Türü → Ders → Konu → Alt Konu → Soru"; yeni sınav türü eklemek
> ŞEMA DEĞİŞİKLİĞİ DEĞİL, VERİ EKLEMEK olmalı.

---

## 1. Mevcut veri modeli (analiz)

### 1.1 Şema (bugün)

```
Module (=sınav türü: paem, misyon, pomem○, pmyo○)
  └─ Course (moduleId FK — ders SINAV TÜRÜNE GÖMÜLÜ)
       └─ Topic (courseId FK; matchKeywords ile içe aktarma eşlemesi)
            └─ Question (topicId FK)
                 └─ QuestionVersion (sürümlü içerik; sourceLabel, contentHash)
```

Topic'e bağlı diğer varlıklar: `UserTopicProgress` (mastery), `TopicMasterySnapshot`
(koç trendi), `QuizSession.topicId/courseId` (oturum kapsamı).

### 1.2 Gerçek veri (16 Tem 2026 itibarıyla; 848 soru)

| Modül | Ders | Konu | Soru | Not |
|---|---|---|---|---|
| PAEM | Genel Mevzuat | 7 | 413 | Eski sistemden göç (İnkilap 191, Genel Kültür 222) |
| PAEM | Polis Mevzuatı | 30 | 10 | Eski göç — konular zaten kanun bazlı (PVSK, 7068…) |
| PAEM | A.Ö.F | 6 | 30 | Eski göç (İnkılap 30) |
| PAEM | Anayasa ve İnkılap T. / İdare-Mahalli / Memur-Kamu / Adli-İdari Yazı İşleri / Genel Yetenek | 24 | 47 | Doc 20 taksonomisi (GYS içe aktarımları) |
| PAEM | Anayasa Hukuku, Türkçe, Genel Kültür, Deneme E2E | 9 | 10 | Dev/iskele içeriği |
| MISYON | Misyon Koruma | 3 | 337 | Protokol 75, Silah 167, İngilizce 95 |

### 1.3 Mevcut yapının sorunları

1. **Ders sınav türüne gömülü** (`Course.moduleId`) → ortak ders (İnsan Hakları)
   iki sınavda = iki kayıt = içerik TEKRARI. Kullanıcının talebiyle çelişir.
2. **Sunum = veri**: Misyon'da "Anayasa ve İdare Hukuku" tek başlık, PAEM'de iki
   ayrı ders — mevcut modelde ifade edilemez.
3. **Alt Konu seviyesi yok**: Ders→Konu iki seviye sabit; "Ceza Hukuku → Suç
   Teorisi → Kast" gibi derinlik kurulamaz.
4. **Ders ağırlıkları yok** (%30/%10…) → gelecekte gerçekçi deneme üretimi
   (sınav dağılımına göre soru seçimi) için zemin yok.
5. Müfredat karmaşası: eski göç ("Genel Mevzuat", "A.Ö.F") + yeni taksonomi +
   dev iskeleti yan yana — tek hedef müfredata toplanmalı.

---

## 2. Yeni veri modeli

### 2.1 Çekirdek fikir: İÇERİK ve MÜFREDAT ayrımı

- **İçerik katmanı** (sınav-türü-bilmez, TEK kopya):
  `Course (küresel ders havuzu) → Topic (ağaç: Konu/Alt Konu) → Question`
- **Müfredat katmanı** (sınav türüne özel SUNUM):
  `ExamType → ExamSection (görünen ders başlığı + ağırlık + sıra) → Course(lar)`

Böylece "İnsan Hakları" içerikte TEK ders; PAEM ve Misyon müfredatları ona
bağlanır. Misyon'un "Anayasa ve İdare Hukuku" başlığı, İKİ içerik dersine
bağlanan TEK bölümdür — veri tekrarı yok, gösterim serbest.

### 2.2 Şema

```prisma
/// Sınav Türü (mevcut `modules` tablosu — Prisma modeli ExamType olarak
/// yeniden adlandırılır, tablo adı değişmez: veri migration'ı yok).
model ExamType {            // @@map("modules")
  id, key, name, description, icon, sortOrder, isActive
  sections ExamSection[]
}

/// Müfredat bölümü: sınav türünde KULLANICIYA GÖRÜNEN ders başlığı.
model ExamSection {         // @@map("exam_sections")  — YENİ
  id          String
  examTypeId  String        // → modules.id
  name        String        // "Anayasa ve İdare Hukuku" (Misyon), "Anayasa Hukuku" (PAEM)
  weightPercent Int         // sınavdaki ağırlık (PAEM GK %30…) — deneme üretimi için
  sortOrder   Int
  courses     ExamSectionCourse[]
}

/// Bölüm ↔ içerik dersi (N:N). Misyon "Anayasa ve İdare Hukuku" → 2 ders.
model ExamSectionCourse {   // @@map("exam_section_courses") — YENİ
  sectionId, courseId, sortOrder
  @@id([sectionId, courseId])
}

/// İçerik dersi — ARTIK KÜRESEL (moduleId KALKAR).
model Course {
  id, name, sortOrder, createdAt, deletedAt
  topics Topic[]
}

/// Konu — SELF-REFERENCING AĞAÇ: parentId null = Konu, dolu = Alt Konu.
/// Derinlik esnek (ileride 3. seviye gerekirse ŞEMA DEĞİŞMEZ).
model Topic {
  id, courseId, parentId String?   // → topics.id (YENİ)
  name, sortOrder, isPremium, matchKeywords[]
  children Topic[]; questions Question[]
}

/// Question.topicId DEĞİŞMEZ — herhangi bir düğüme (tipik yaprak) bağlanır.
```

**Neden bu tasarım:**
- Yeni sınav türü = `ExamType` satırı + `ExamSection` satırları → **migration yok**.
- `Topic.parentId` ile Konu/Alt Konu tek tabloda → `UserTopicProgress`,
  `TopicMasterySnapshot`, `matchKeywords`, koç kuralları, içe aktarma
  sınıflandırıcısı **hiç değişmeden** çalışır (hepsi topicId bazlı).
- Ağırlık bölümde: "PAEM denemesi üret" → bölüm ağırlıklarına göre soru dağıt
  (gelecek özellik için hazır zemin).
- Sunum/veri ayrımı: aynı içerik dersi farklı sınavlarda farklı başlık ve
  ağırlıkla sunulur.

### 2.3 Hedef müfredat (seed verisi)

**İçerik ders havuzu (küresel, TEK kopya):**
Genel Kültür ve Analitik Düşünme · Polis Mevzuatı · Ceza Muhakemesi Hukuku ·
Ceza Hukuku · Anayasa Hukuku · İdare Hukuku · Atatürk İlkeleri ve İnkılap
Tarihi · İnsan Hakları · Protokol Bilgisi · Silah Bilgisi · Güncel ve Kültürel
Konular · Yabancı Dil

**PAEM bölümleri** (toplam %100 ✓):
| Bölüm (görünen) | % | İçerik dersi |
|---|---|---|
| Genel Kültür ve Analitik Düşünme | 30 | Genel Kültür ve Analitik Düşünme |
| Polis Meslek Mevzuatı | 10 | Polis Mevzuatı |
| Ceza Muhakemesi Hukuku | 10 | Ceza Muhakemesi Hukuku |
| Ceza Hukuku | 10 | Ceza Hukuku |
| Anayasa Hukuku | 10 | Anayasa Hukuku |
| İdare Hukuku | 10 | İdare Hukuku |
| Atatürk İlkeleri ve İnkılap Tarihi | 10 | Atatürk İlkeleri ve İnkılap Tarihi |
| İnsan Hakları | 10 | İnsan Hakları |

**Misyon bölümleri** (toplam %100 ✓):
| Bölüm (görünen) | % | İçerik dersi |
|---|---|---|
| İnsan Hakları | 10 | İnsan Hakları *(PAEM ile ORTAK)* |
| Anayasa ve İdare Hukuku | 10 | Anayasa Hukuku + İdare Hukuku *(2 ders → 1 başlık)* |
| Polisi İlgilendiren Mevzuat | 20 | Polis Mevzuatı *(PAEM ile ORTAK — öneri, bkz. §2.5)* |
| Atatürk İlkeleri ve İnkılap Tarihi | 10 | Atatürk İlkeleri ve İnkılap Tarihi *(ORTAK)* |
| Protokol Bilgisi | 10 | Protokol Bilgisi |
| Silah Bilgisi | 20 | Silah Bilgisi |
| Güncel ve Kültürel Konular | 10 | Güncel ve Kültürel Konular |
| Yabancı Dil | 10 | Yabancı Dil |

### 2.4 "Polis Mevzuatı" dersinin alt konuları (tekilleştirilmiş, kanun no önekli)

Kullanıcı listesindeki tekrar (2559 iki kez) çıkarıldı; 772'ye numara öne alındı:

1. 3201 Sayılı Emniyet Teşkilat Kanunu
2. 2559 Sayılı Polis Vazife ve Salâhiyet Kanunu (PVSK)
3. 7068 Sayılı Genel Kolluk Disiplin Hükümleri Kanunu
4. 4483 Sayılı Memurlar ve Diğer Kamu Görevlilerinin Yargılanması Hakkında Kanun
5. 5326 Sayılı Kabahatler Kanunu
6. 3713 Sayılı Terörle Mücadele Kanunu
7. 2911 Sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu
8. 6136 Sayılı Ateşli Silahlar ve Bıçaklar Hakkında Kanun
9. 6222 Sayılı Sporda Şiddet ve Düzensizliğin Önlenmesine Dair Kanun
10. 1774 Sayılı Kimlik Bildirme Kanunu
11. 5395 Sayılı Çocuk Koruma Kanunu
12. 6284 Sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun
13. 7245 Sayılı Çarşı ve Mahalle Bekçileri Kanunu
14. 772 Sayılı Asayişe Müessir Bazı Fiillerin Önlenmesi Hakkında Kanun
15. Adli ve Önleme Aramaları Yönetmeliği
16. Adli Kolluk Yönetmeliği
17. Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği
18. Çocuk Koruma Kanununun Uygulanmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik
19. Emniyet Hizmetleri Sınıfı Mensupları Atama ve Yer Değiştirme Yönetmeliği
20. Polis Merkezi Amirliği Kuruluş, Görev ve Çalışma Yönetmeliği

Her birine `matchKeywords` seed'lenir ("2559", "PVSK", "Polis Vazife"…) →
PDF içe aktarma sınıflandırması bu ağaçta aynen çalışır. Eski sistemden göçen
"Polis Mevzuatı" dersinin 30 konusu bu listeye eşlenir (örtüşme yüksek).

### 2.5 Öneri / karar noktası

PAEM "Polis Meslek Mevzuatı" ile Misyon "Polisi İlgilendiren Mevzuat"ın AYNI
içerik dersini ("Polis Mevzuatı") paylaşması önerilir — iki sınav da aynı
kanunlardan sorar; fark başlık ve ağırlıkta (%10 vs %20). Ayrı içerik
isteniyorsa iki ayrı ders açılır (mimari ikisini de destekler).

---

## 3. Migration planı (expand → veri → kod → contract)

Canlı kullanıcı YOK (lansman öncesi) — yine de geri alınabilir, aşamalı plan:

**Faz A — Şema (additive, kırılım yok):**
1. `exam_sections`, `exam_section_courses` tabloları; `topics.parent_id`
   (nullable self-FK); `courses.module_id` → NULLABLE (drop DEĞİL).
2. Prisma model adlandırması: `Module` → `ExamType` (@@map("modules") — tablo
   değişmez, yalnız kod dili netleşir).

**Faz B — Veri (script: `scripts/migrate-content-tree.ts`, idempotent):**
1. Hedef ders havuzu + PAEM/Misyon bölümleri + ağırlıklar seed (§2.3).
2. "Polis Mevzuatı" alt konu ağacı seed (§2.4, matchKeywords'lü).
3. Mevcut içerik eşlemesi (848 soru, `bulkSetTopic` altyapısıyla):
   | Kaynak (bugün) | Hedef |
   |---|---|
   | Genel Mevzuat/İnkilap Tarihi (191) + A.Ö.F/İnkılap (30) | Atatürk İlkeleri ve İnkılap Tarihi |
   | Genel Mevzuat/Genel Kültür (222) | Genel Kültür ve Analitik Düşünme |
   | Genel Mevzuat/diğer konular (Anayasa, İdare, TCK, CMK, İnsan Hakları) | ilgili yeni derslere |
   | Polis Mevzuatı 30 konu (10 soru) | Polis Mevzuatı alt konularına (ad eşleme + kanun no öneki) |
   | Misyon Koruma/Protokol (75), Silah (167), İngilizce (95) | Protokol Bilgisi, Silah Bilgisi, Yabancı Dil dersleri |
   | Doc 20 taksonomi konuları (GYS içe aktarımları) | ilgili derslere (Anayasa→Anayasa Hukuku, 657→? — Memur mevzuatı PAEM listesinde yok; "Polisi İlgilendiren"e mi arşive mi: panelde karar) |
   | Dev iskeleti (Deneme E2E, örnek Anayasa/Türkçe) | arşiv (soft delete) |
   Otomatik eşleme + rapor; kalanı panelden `bulk-set-topic` ile düzeltilir.
4. Doğrulama: soru sayısı korunumu (848), boşta konu/ders kalmaması.
5. Kirli/askıda kalan eski dersler soft-delete.

**Faz C — Kod geçişi** (bkz. §5-8). API v1 şekli tek seferde güncellenir
(lansman öncesi olduğumuz için v2 uç çoğaltması YOK — tek istemci bizim).

**Faz D — Contract:** `courses.module_id` DROP; ölü kod temizliği.

Geri dönüş: Faz A-B additive olduğundan D'ye kadar eski yapı bozulmaz;
migration script'i çalıştırmadan önce `pg_dump` yedeği alınır.

---

## 4. Etkilenecek ekranlar — genel harita

| Yüzey | Etki | Boyut |
|---|---|---|
| API | katalog uçları yeniden şekillenir; quiz kapsamı; koç dokunuşu; admin | ORTA-BÜYÜK |
| Admin | İçerik Ağacı yeniden (4 seviye + sürükle-bırak); import; soru formu | BÜYÜK |
| iOS | Hedef seçim (küçük), Dersler (bölüm listesi), Konular (ağaç), quiz başlatma | ORTA |
| Web | Yalnız soru-öner formundaki konu seçici | KÜÇÜK |
| Android | Henüz yok — yeni mimariyle doğar | — |

---

## 5. Etkilenecek API'ler

| Uç / servis | Bugün | Yeni |
|---|---|---|
| `GET /catalog/modules` | modül + soru sayısı + kullanıcı bağlamı (module_id join) | sınav türü + AYNI alanlar; soru sayısı `sections→courses→topics` üzerinden |
| `GET /catalog/modules/:id/courses` | dersler | **bölümler** (`sections`: ad, %, bağlı dersler) |
| `GET /catalog/courses/:id/topics` | düz konu listesi | **konu ağacı** (children iç içe; soru sayılarıyla) |
| `GET /catalog/topics/:id` | konu + soru sayısı | aynı (+ alt ağaç toplamı) |
| `POST /quiz/sessions` | topicId VEYA courseId kapsamı | topicId (alt ağaç dahil havuz) VEYA **sectionId** (ders denemesi bölümden) |
| Günün quizi (`DAILY_COURSE_NAME='Genel Mevzuat'` hardcode) | ders adına bağlı | hedef derse güncellenir; uzun vadede app_settings'e taşınır |
| `GET /me/coach` | zayıf konu topic bazlı | değişmez (topicId korunur); `weakestTopic` ad gösterimi "Ders / Konu (/ Alt Konu)" |
| Admin catalog CRUD | course(moduleId), topic(courseId) | + section CRUD, section↔course bağlama, topic.parentId, sıralama uçları |
| Admin import (`moduleTopics`) | `course.moduleId` filtresi | `sections→courses` üzerinden; sınıflandırıcı YAPRAK konulara önerir |
| Onboarding `preferredModuleId` | modül seçimi | değişmez (ExamType aynı tablo) |
| Denemeler (`/exams`) | katalogdan bağımsız (sabitlenmiş sürümler) | **etkilenmez** |

Etkilenmeyenler: auth, billing, koç kuralları/rozetler (topic bazlı), streak,
denemeler motoru, kaynak etiketi/tekrar tespiti (contentHash içerik bazlı).

## 6. Etkilenecek mobil (iOS) ekranlar

| Ekran | Değişiklik |
|---|---|
| `modules_screen.dart` (Hedef Seç) | API şekli aynı kaldığı için görsel değişiklik yok; yalnız model alan adları |
| `courses_screen.dart` (Dersler) | Bölüm listesi: ad + %ağırlık rozeti; bölüm→tek ders ise doğrudan konulara, çok ders ise ders seçimi |
| `topics_screen.dart` (Konular) | Konu AĞACI: alt konusu olan satır genişler (ExpansionTile) ya da alt sayfaya iner; soru sayısı alt ağaç toplamı |
| `quiz` başlatma | topicId aynı; "dersten karışık" → sectionId parametresi |
| `home/koç` | değişmez (koç kartları sunucudan) |

## 7. Etkilenecek web ekranları

| Ekran | Değişiklik |
|---|---|
| `soru-oner` formu | konu seçici yeni ağaç ucundan beslenir (kozmetik) |
| Denemeler akışı (tamamı) | **etkilenmez** |

## 8. Admin panelinde değişecek alanlar

| Modül | Değişiklik |
|---|---|
| İçerik Ağacı | YENİDEN: Sınav Türü → Bölüm (%, sıra) → Ders (paylaşımlı; "PAEM+Misyon" rozetleri) → Konu → Alt Konu. Sürükle-bırak sıralama (@dnd-kit, sortOrder PATCH); ders havuzu ayrı sekme ("Dersler" — küresel, hangi sınavlarda kullanıldığı görünür) |
| İçe Aktarma | modül seçimi aynı; sınıflandırma dropdown'ları "Ders / Konu / Alt Konu" hiyerarşik; matchKeywords yaprak konularda |
| Soru formu | konu seçici hiyerarşik (Ders → Konu → Alt Konu) |
| Onay kuyruğu | konu kartları "Ders / Konu / Alt Konu" yolu ile |
| Dashboard sayıları | join güncellemesi |

---

## 9. Uygulama sırası (onay sonrası)

1. Faz A şema + Prisma rename (yarım gün)
2. Faz B veri migration script + DB penceresi + doğrulama raporu (1 gün)
3. API katalog/quiz/admin uçları + testler (1-1,5 gün)
4. Admin İçerik Ağacı + import + soru formu (1-1,5 gün)
5. iOS katalog ekranları (1 gün)
6. Web soru-öner dokunuşu + Faz D contract + uçtan uca doğrulama (yarım gün)

Her faz ayrı commit; her fazda jest + tsc + gerçek veri doğrulaması.

---

## 10. Uygulama durumu (16 Tem 2026)

✅ **Faz A** — şema (exam_sections, exam_section_courses, topics.parent_id,
   courses.module_id nullable) + Module→ExamType rename. (`1669dd5`)
✅ **Faz B** — veri migration: 12 küresel ders, PAEM/Misyon %100 bölümler,
   848→848 soru korunumu; konular topicId korunarak taşındı. (`cbc8174`)
✅ **Faz C** — API müfredat köprüsü (catalog get/tree, günün quizi, import
   kapsamı, publicCatalog). (`cbc8174`, `dc51028`)
✅ **Polis Mevzuatı kanonikleştirme** — 14 numarasız kanuna resmî no+keyword,
   4 mükerrer birleşti, 2 çöp arşiv; 40→34 konu. (`b7d8f23`)
✅ **Admin müfredat uçları** — curriculum + section CRUD + attach/detach +
   reorder + küresel ders + alt konu. (`0e4172d`)
✅ **Admin İçerik Ağacı UI** — 5 seviye, ağırlık, paylaşımlı ders, alt konu,
   sıralama. (`3299fbb`)
✅ **iOS** — Dersler (bölüm+ağırlık rozeti), Konular (alt konu ağacı). (`dc51028`)
✅ **Web** — publicCatalog müfredata bağlandı. (`dc51028`)

✅ **Faz D (contract)** — `courses.module_id` DROP; seed'in eski taksonomi/dev
   içerik blokları temizlendi; tükenmiş migration script'leri silindi. Dersler
   tamamen küresel; bağ yalnız müfredat bölümleri üzerinden. (`24ef398`)
✅ **Orphan temizliği** — faydasız 6 dev/göç dersi sorularıyla soft-delete;
   havuz 12, orphan yok, 813 aktif soru. (`6e916a3`)

**DOC 21 KAPANDI.** Sınav Türü → Bölüm → Ders → Konu → Alt Konu → Soru
mimarisi API/admin/iOS/web'de canlı. Yeni sınav türü = veri satırı (migration yok).
⏳ **Sürükle-bırak sıralama** — şu an ▲▼ butonları (bağımlılıksız); istenirse
   @dnd-kit ile yükseltilir.
⏳ **Havuzdaki bölümsüz dersler** — Memur/Adli Yazı İşleri/Türkçe(dev)/A.Ö.F/
   Deneme E2E panelde karar bekliyor (bölüme bağla ya da arşivle).
