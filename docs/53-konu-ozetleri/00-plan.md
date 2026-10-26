# Doc 53 — Konu Özetleri: maddeye çivilenmiş kart dizisi

Tarih: 26 Ekim 2026. Durum: **plan onaylı (kullanıcı, 26 Eki), pilot üretildi.**
Ürün anayasası: Doc 24 (yolculuk), Doc 25 (bilgi mimarisi, Kütüphane kapısı), Doc 29 (Mevzuat Merkezi,
"ayrı uygulama gibi durmaz" kuralı), CLAUDE.md güven ilkeleri. Pilot: `pilot/anayasa-yasama-1.json`.

## 0. Karar özeti

| # | Karar | Kaynak |
|---|---|---|
| 1 | **Özet bir kompozisyon değil, kart dizisidir.** Her kart (blok) en az bir resmî maddeye referans verir; referanssız iddia özete giremez. | Claude, kullanıcı onayı |
| 2 | **Güven kaynağa dayanır (Doc 39 mantığı).** Üretim modeldir, yayın kararı insanındır. Kayıt `in_review`'a düşer; yayını admin yapar. Kaynak etiketi "AI özeti — <kanun>, md <aralık>". | Claude, kullanıcı onayı |
| 3 | **Programlı doğrulama şarttır (Matematik istisnası ruhu).** Doğrulayıcı betik iki şeyi kontrol eder: her blok gerçek bir maddeye bağlı mı; bloktaki her sayı ve süre referans verdiği maddenin metninde geçiyor mu. Türetilmiş sayı (600'ün salt çoğunluğu 301) yalnız açık formülle girer, formül betikle hesaplanır. | Claude |
| 4 | **Bölümlendirme resmî kısım yapısını temel alır, sınav ağırlığına göre kesilir.** Ünite 10–15 dk okuma. Anayasa 12 ünite (§5). | Claude |
| 5 | **Üniteler ileride alt konu olur** (F5). Bugün "T.C. Anayasası" düz: 897 soru tek düğümde. Ünite = alt konu olunca ünite bazlı hâkimiyet, koç önerisi ve "zayıf ünitenin özetini oku" döngüsü açılır. 674 maddeli soru madde üstünden otomatik eşlenir, 223 maddesiz soru elle. | Claude, kullanıcı onayı |
| 6 | **Nerede yaşar:** Kütüphane › Ders › Konu sayfasının üç yüzü: **Özet · Mevzuat · Soru.** Ayrı sekme ya da ayrı "uygulama" yok (Doc 29 kuralı). | Claude |
| 7 | **Dil:** kavram ve tuzak kartlarında yeniden tasarımın sıcak dili (Doc 49), tablolarda kuru ve kısa. Hukuk terimi resmî metindeki hâliyle kalır. | Claude, kullanıcı onayı |
| 8 | **Premium:** her dersin ilk 2 ünitesi açık, kalanı premium. Mevcut `Topic.isPremium` alanı ünite alt konu olduğunda doğrudan kullanılır; F1'de ünite üstünde `isPremium` taşınır. | Claude |
| 9 | **Eskime:** blok, madde sürümüne (`LawArticleVersion`) bağlanır. Mevzuat değişiklik tarayıcısı maddeyi güncellediğinde bağlı bloklar `stale` olur ve admin kuyruğuna düşer. Anayasa'da nadir, polis mevzuatında hayati. | Claude |
| 10 | **Kaynak etiketi son kullanıcıya gösterilmez** (4 Eyl kuralı). Blokta görünen tek kaynak madde numarasıdır; "AI özeti" etiketi yalnız admin'de. | Anayasa |
| 11 | **"Sınav der ki" istatistiği veriden gelir**, model yazmaz. Çıkmış soru sayısı, sınav adı ve dönem bankadan okunur. Resmî sınav adı gösterilir (Doc 36 istisnası), kitap/deneme etiketi gösterilmez. | Anayasa |

## 1. Bugünkü durum (26 Eki 2026, veri üzerinden)

| Veri | Değer |
|---|---|
| Yayında Anayasa sorusu ("T.C. Anayasası" konusu) | 897 |
| Maddeyle eşlenmiş soru (`question_articles` + `articleNo`) | 674 |
| Resmî metin: `t-c-anayasasi` | 199 numaralı madde, 16 bölüm (kısım/bölüm ağacı dolu) |
| Hiç soru çıkmamış madde | 76 / 199 |
| Alt konu | yok (ağaç düz) |

Bölüm dağılımı (eşlenmiş soru): Yargı 152 · Yürütme 149 · Yasama 142 · Kişinin hakları 75 · Siyasi haklar 48 ·
Sosyal ve ekonomik haklar 32 · Genel esaslar 17 · Mali ve ekonomik 22 · Son hükümler 19 · Temel haklar genel 14.

En çok sorulan maddeler: 148 (30) · 159 (27) · 106 (25) · 146 (20) · 104 (17) · 84 (17) · 175 (16) · 101 (15) · 119 (14).

Yeniden kullanılacak altyapı (yeni yazılmayacak): `LawArticle` + `LegislationSection` ağacı; madde→soru köprüsü
(`POST /quiz/sessions {topicId, articleNo}`); soru→madde (`relatedArticle`); `ReadingProgress`; `ContentStatus`
akışı (draft → in_review → published); admin inceleme kuyruğu deseni (Doc 31); mevzuat değişiklik tarayıcısı
(`scripts/mevzuat-degisiklik-tara.ts`); web `(site)` ISR + app kabuğu; Expo tasarım sistemi.

## 2. İlke ve istisna

Şemadaki ilke korunur: **madde metni AI ile üretilmez ve özetlenmez.** Konu özeti madde metni değil, yeni bir
içerik türüdür ve madde metninin yerine geçmez; her kartın yanında "maddeyi oku" vardır.

CLAUDE.md'ye eklenen istisna (26 Eki 2026):

> Konu özeti (Doc 53) model tarafından üretilebilir. Şartı: özet kart dizisidir, her kart en az bir resmî
> maddeye referans verir; kartlardaki sayı ve süreler referans maddenin metninde geçtiği betikle gösterilir
> (türetilmiş sayı yalnız açık formülle); kayıt "AI özeti" ön ekli `sourceLabel` taşır ve `in_review`'a düşer.
> Yayın kararı insanındır. Madde metni özetlenmez, kart maddenin yerine geçmez.

## 3. İçerik modeli

**Ünite** (`SummaryUnit`): bir konuya ve bir mevzuata bağlı, sıralı, 10–15 dk okunan paket.
Alanlar: `topicId`, `legislationId`, `slug`, `title`, `subtitle`, `articleFrom/To` (bilgi amaçlı), `sortOrder`,
`isPremium`, `status`, `sourceLabel`, `readingMinutes`, `version`.

**Blok** (`SummaryBlock`): ünite içinde sıralı kart. Ortak alanlar: `type`, `title`, `body` (markdown-lite:
kalın, liste; başlık ve tablo yok), `articleRefs[]` (madde no), `derivedNumbers[]` (`{value, expr, refs}`),
`sortOrder`, `status`, `staleSince`.

| Tür | Ne taşır | Veri | Dil |
|---|---|---|---|
| `concept` | Tek fikir, bir paragraf | model | sıcak |
| `rule` | Kural + şart + istisna, madde imlâsına yakın | model | nötr |
| `numbers` | Sayı ve süre tablosu: `rows[{label, value, refs}]` | model, betik doğrular | kuru |
| `compare` | İki kurumun yan yana farkı: `rows[{aspect, left, right, refs}]` | model | kuru |
| `trap` | "Sık karıştırılan": yanlış şıklardan türetilen uyarı | model | sıcak |
| `exam_stats` | Bu maddelerden kaç soru çıktı, en çok hangisi | **betik** | kuru |
| `bridge` | Ünite sonu: "bu üniteden soru çöz" (topicId + articleNo listesi) | betik | — |

`rows` içeren türlerde `body` yoktur; `rows[].refs` zorunludur. `counterNumbers[]`: kartın "yanlış şık" diye andığı
sayılar; betik bunların referans metninde **geçmediğini** doğrular (pilotta eklendi). Tam JSON şeması pilot dosyasının `$schema` bölümünde.

## 4. Üretim hattı

1. **Girdi hazırlama** (`scripts/ozet-girdi.ts`, F1): ünitenin madde metinleri (`LawArticle.text`, sürüm no ile),
   o maddelere bağlı yayındaki soruların kökleri ve şıkları (doğru/yanlış işaretli), madde başına soru sayısı.
   Soru kökleri "ne soruluyor" sorusunu, yanlış şıklar "neyle karıştırılıyor" sorusunu cevaplar.
2. **Üretim**: model ünite başına yapılandırılmış JSON üretir (§3). İstem kuralları: referanssız cümle yok;
   tarihçe ve doktrin iddiası yok (metinde yoksa yazılmaz); sayı yalnız metinde geçerse ya da formülle;
   kaynak etiketi istemde yok (4 Eyl kuralı). Pilotta üretimi Claude doğrudan yaptı; F1'de API ile aynı istem.
3. **Doğrulama** (`apps/api/scripts/ozet-dogrula.ts`, pilotla yazıldı): referans var mı; sayılar metinde mi
   (rakam ve Türkçe sayı sözcüğü eşdeğer sayılır: 7 = yedi, 15 = onbeş/on beş); türetilmiş sayının formülü
   hesaplanıyor ve işlenenleri referans metinlerde mi; `exam_stats` ve `bridge` blokları betik üretimi, kontrol dışı.
   Doğrulamayı geçmeyen blok düşer, ünite raporla birlikte `in_review`'a girer.
4. **İnsan incelemesi** (admin, F1): ünite önizleme, blok bazında onay/düzenle/sil, "maddeyi yan yana aç".
   Anlam doğruluğu (ör. "avukatlık Anayasa'da bağdaşmaz iş olarak sayılmaz" gibi olumsuz iddialar) betikle
   yakalanamaz; bu yüzden insan okuması kaldırılamaz.
5. **Yayın**: ünite `published`; web ISR + mobil önbellek. Sürüm numarası artar.
6. **Eskime**: madde sürümü değişince bağlı bloklar `stale`; admin kuyruğunda "Özet: eskimiş blok" sırası.

## 5. Bölümlendirme — Anayasa 12 ünite

Resmî kısım yapısı temel; Yasama, Yürütme, Yargı ikiye bölünür; Mali hükümler ve Anayasa değişikliği Yargı II'ye eklenir.
Geçici hükümler (21 madde) ve hiç soru çıkmamış maddeler özet dışı (gerekirse tek satır).

| # | Ünite | Maddeler | Eşlenmiş soru (yaklaşık) |
|---|---|---|---|
| 1 | Genel esaslar: devletin nitelikleri, egemenlik, eşitlik, bağlayıcılık | 1–11 | 17 |
| 2 | Temel hakların rejimi: sınırlama, kötüye kullanma yasağı, durdurma, yabancılar | 12–16 | 14 |
| 3 | Kişi hakları I: dokunulmazlık, zorla çalıştırma yasağı, özel hayat, din ve vicdan | 17–26 | ~40 |
| 4 | Kişi hakları II: ifade, basın, dernek, toplantı, mülkiyet, hak arama, suç ve ceza | 27–40 | ~35 |
| 5 | Sosyal ve ekonomik haklar | 41–65 | 32 |
| 6 | Siyasi haklar: vatandaşlık, seçme ve seçilme, partiler, kamu hizmeti, dilekçe | 66–74 | 48 |
| 7 | **Yasama I: TBMM kuruluşu, seçim, üyelik, dokunulmazlık, düşme** (pilot) | 75–86 | 77 |
| 8 | Yasama II: görev ve yetkiler, kanun yapımı, çalışma düzeni, bilgi edinme ve denetim | 87–100 | ~65 |
| 9 | Yürütme I: Cumhurbaşkanı, yardımcılar ve bakanlar, CBK, olağanüstü hal | 101–122 | ~110 |
| 10 | Yürütme II: idarenin esasları, mahallî idareler, kamu görevlileri, YÖK, RTÜK, DDK | 123–137 | ~40 |
| 11 | Yargı I: genel ilkeler, hâkimlik teminatı, Anayasa Mahkemesi | 138–153 | ~95 |
| 12 | Yargı II: Yargıtay, Danıştay, Uyuşmazlık, HSK, Sayıştay; mali hükümler; Anayasa değişikliği | 154–177 | ~90 |

Diğer dersler aynı yöntemle: polis mevzuatı kanun bazında (PVSK tek ünite ya da iki), CMK/TCK bölüm bazında.
Mevzuata bağlı olmayan konular (İnkılap, Güncel) bu dokümanın kapsamı dışında; onlar için kaynak modeli ayrı tartışılır.

## 6. Ürün yüzeyi

- **Konu sayfası üç yüz**: Özet · Mevzuat · Soru. Özet yüzü ünite listesi (ilerleme halkası, süre, kilit).
- **Ünite okuyucu**: dikey kart akışı, kartlar arası sıcak geçiş; `numbers`/`compare` kartları tam genişlik tablo;
  her kartta "md 84" rozeti → dokununca madde bottom-sheet'te (mevcut `ArticleCard`); ünite sonunda `bridge` kartı
  "Bu üniteden 10 soru" (madde kapsamlı seans, mevcut uç). Okuma ilerlemesi `ReadingProgress` ile; kaldığın kart.
- **Koç köprüsü** (F5 sonrası): zayıf ünite → "önce özetini oku, sonra 10 soru" reçetesi (Doc 25 §G ile uyumlu).
- **Web**: `(site)` altında public SEO sayfası `/ozet/anayasa/yasama-1` (ilk 2 ünite tam, kalanı ilk 2 kart + kilit);
  girişliye app kabuğu. Mobil: Expo, aynı bileşenler.
- **Admin**: Özetler listesi (ders › konu › ünite, durum, eskimiş blok sayısı), ünite editörü, "yeniden üret" düğmesi.

## 7. Veri modeli (Prisma taslağı, F1'de kesinleşir)

```
model SummaryUnit {
  id, topicId, legislationId, slug @unique, title, subtitle?, sortOrder, isPremium,
  readingMinutes, status ContentStatus, sourceLabel, version Int, publishedAt?,
  createdBy?, createdAt, updatedAt, deletedAt?
  blocks SummaryBlock[]; progress SummaryProgress[]
}
model SummaryBlock {
  id, unitId, type SummaryBlockType, title?, body?, rows Json?, derivedNumbers Json?,
  sortOrder, status ContentStatus, staleSince?, 
  articleRefs SummaryBlockArticle[]   // (blockId, lawArticleId, lawArticleVersionNo)
}
model SummaryProgress { userId, unitId, lastBlockIndex, completedAt?, updatedAt }  // ReadingProgress'in ünite eşi
enum SummaryBlockType { concept rule numbers compare trap exam_stats bridge }
```

## 8. Fazlar

| Faz | İş | Çıktı |
|---|---|---|
| F0 | **Pilot (bu doküman ile birlikte, yapıldı):** Yasama I JSON + doğrulayıcı betik + okunur çıktı | `pilot/`, `scripts/ozet-dogrula.ts` |
| F1 | **Yazıldı (26 Eki, `01-f1-api-admin.md`), yerel E2E geçti, deploy bekliyor.** Şema + API + admin + betikler | Pilot ünite admin'den `in_review` → yayın |
| F2 | **Yazıldı (26 Eki, `02-f2-web.md`), misafir akışı doğrulandı.** Konu odasında özet bölümü, `/ozet/[slug]` okuyucu + SEO, premium kilidi, köprü | Yasama I canlı |
| F3 | Expo: aynı yüzeyler, `ReadingProgress` eşi, madde sheet, köprü | TestFlight |
| F4 | Anayasa 12 ünite üretim + inceleme; eskime kuyruğu | Anayasa tam |
| F5 | Üniteler alt konu olur; 674 soru madde üstünden otomatik, 223 soru elle eşlenir; koç reçetesi | Ünite bazlı hâkimiyet |

Her faz gerçek veriyle ve E2E doğrulanır; Figma F1 öncesi (admin editör, mobil okuyucu, web konu sayfası).

## 9. Açık noktalar

- Mevzuata bağlı olmayan dersler için (İnkılap Tarihi, Güncel) kaynak modeli: ders kitabı yok, resmî metin yok. Ayrı karar.
- `trap` kartlarının olumsuz iddiaları ("X Anayasa'da sayılmaz") betikle doğrulanamıyor; inceleme kılavuzunda ayrı madde.
- SEO sayfasında kilitli ünitelerin kaç kartı açık kalır (2 varsayıldı).
- Üretim modeli ve maliyet: F1'de API ile ünite başına tek çağrı; pilotta elle.

## 10. Pilot sonucu (26 Eki 2026)

Bkz. `pilot/anayasa-yasama-1.md` (okunur çıktı) ve `pilot/anayasa-yasama-1.json` (kaynak).

| Ölçüt | Sonuç |
|---|---|
| Blok | 22 (2 kavram, 8 kural, 2 sayı tablosu, 1 karşılaştırma, 7 tuzak, 1 istatistik, 1 köprü) |
| Bağlı yayındaki soru | 77 (md 84: 17, md 78: 13, md 85: 13; md 81 hiç sorulmamış) |
| Doğrulama | GEÇTİ: her blok referanslı, her sayı metinde ya da formülle (301 = salt çoğunluk, 30 = yüzde beş) |
| Negatif test | "7 gün → 10 gün", "7 asıl → 9 asıl", "+1 → +2" bozmalarının üçü de yakalandı |
| Üretim | Claude, elle istem; tarihçe ve doktrin iddiası bilinçli olarak dışarıda bırakıldı |
| Ünite dışı referans | md 101 ve 106 ("Cumhurbaşkanı seçilen / bakan atanan milletvekilinin üyeliği sona erer"): metinle doğrulandı |

Betiğin pilotta kapattığı boşluklar (F1 istem ve inceleme kılavuzuna girer):
- Madde başındaki değişiklik notu ("(Değişik: 23/7/1995-4121/10 md.)") sayı eşlemesini kirletiyordu → notlar eşlemeden önce atılır.
- Liste numarası ("1.", "2.") sayı sayılıyordu → satır başı numaralandırma atılır.
- Türkçe sayı sözcüğü eşlemesi: ek kabul edilir ("beşini"), önündeki onluk reddedilir ("on beş" içindeki "beş" 5 değildir),
  arkasındaki parça bütün sözcük olmalı ("beş birleşim"deki "bir" sayı değildir).
- Modelin örnek olarak yazdığı yanlış sayılar ("19 yaşındaki", "6 ya da 12 değil") ya metinden çıkarıldı ya `counterNumbers`'a alındı.

İnsan incelemesinde bakılacaklar (betik göremez): "avukatlık Anayasa'da sayılmaz", "YSK yüksek mahkeme değildir",
"parti kapatılması üyeliği düşürmez" gibi olumsuz iddialar; dilin tonu; kart sırası.

Betik:

```
cd apps/api && npx tsx scripts/ozet-dogrula.ts ../../docs/53-konu-ozetleri/pilot/anayasa-yasama-1.json --md
```
