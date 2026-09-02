# Onay Kuyruğu İnceleme Raporu

**Durum:** ARA RAPOR — sistematik taramalar tamamlandı, soru bazlı inceleme sürüyor
**Erişim / kontrol tarihi:** 27 Ağustos 2026
**Kuyruk büyüklüğü:** 1422 soru (`question_versions.status = in_review`)
**Veritabanına yazma yapılmadı.** Hiçbir soru onaylanmadı, reddedilmedi, değiştirilmedi.

---

## 1. Genel Özet

| Ölçüt | Sayı | Not |
|---|---:|---|
| İncelenen toplam soru | **1422** | tamamı yapısal + mevzuat-bağlantısı taramasından geçti |
| Karara bağlanan | **329** | %23 |
| Soru bazlı incelemesi tamamlanan | 19 | CMK 7, TCK 12 |
| **Mükerrer (fazlalık kopya)** | **289** | 110 grup; her gruptan 1 kopya korunuyor |
| **Reddedilmeli (yapısal)** | **21** | kaynak PDF ayrıştırma hatası |
| Doğru ve yayımlanabilir | 12 | soru bazlı incelenenlerden |
| Düzeltilerek yayımlanabilir | 6 | |
| Hukuken tartışmalı / belirsiz | 1 | |
| Güncelliğini yitirmiş | 0 | *(bkz. §4 — mülga madde bağlantıları içerik değil bağlantı sorunu çıktı)* |
| Alan dışı | 0 kesinleşmiş | ~12 aday (§5) |
| **Açıklaması hatalı veya yetersiz** | **320** | §6 |
| Elle incelenmeyi bekleyen | **1093** | |

> Bu rapordaki her "doğru" hükmü, veritabanındaki resmî madde metnine (kaynağı
> `mevzuat.gov.tr`, her maddede `sourceUrl` ile bağlı) karşılaştırılarak verilmiştir.
> Karşılaştırılamayan hiçbir soru "doğru" sayılmamıştır.

---

## 2. Kuyruğun yapısı — üç ayrı popülasyon

İnceleme yöntemi bu ayrıma göre kuruldu; risk profilleri çok farklı.

| Parti | Adet | Kaynak etiketi | Eklenme | Risk |
|---|---:|---|---|---|
| **A** — eski toplu import | 654 | **YOK** | 12–13 ve 24 Ağu | **Yüksek.** Mükerrerlerin ve yapısal hataların tamamı burada. 261 açıklamada AÖF ders kitabı kalıntısı (`Unite: 7`), 130'unda açıklama bundan ibaret, 190'ında hiç açıklama yok. |
| **B1** — THEMIS soru kitabı | 587 | "THEMIS 2025 … SORU KİTABI" — hangi sınavdan geldiği belirsiz | 26–27 Ağu | **Orta.** Açıklamalar nitelikli ve madde atıflı. Ancak Madde Atlası bağlantılarında sistematik hata var (§4). TCK 429 + Anayasa 158. |
| **B2** — gerçek sınav etiketli | 193 | "2023 KAYMAKAMLIK SINAVI" vb. 26 farklı sınav | 25 Ağu | **Düşük.** Çıkarım sırasında her biri madde metniyle karşılaştırılmıştı. |

---

## 3. Mükerrer sorular — 289 fazlalık kopya

110 mükerrer grup, toplam 399 soru. **Tamamı A partisinde**; B1 ve B2'de tek mükerrer yok.

| Grup büyüklüğü | Grup sayısı |
|---|---:|
| 2 kopya | 36 |
| 3 kopya | 29 |
| 4 kopya | 16 |
| 5 kopya | 15 |
| 6 kopya | 4 |
| 7 kopya | 3 |
| **8 kopya** | **7** |

Tespit yöntemi: `content_hash` = sha256(normalize(kök) + sıralı şık metinleri) — yani
kök *ve* şıkları birebir aynı olan sorular. Yorum payı yok.

**Karar:** Her gruptan açıklaması olan bir kopya korunur, kalanlar reddedilir.
Tam döküm: `mukerrer-dokum.txt` (110 grubun kökleri, şıkları ve kopya ID'leri).

---

## 4. ⚠ En kritik bulgu — Madde Atlası yanlış bağlanmış: 69 soru

**84 soru, bağlandığı konunun kanunundan başka bir mevzuata dayanıyor; bunların 69'unda
`articleNo` o başka kanunun madde numarası, konunun kanununa ait madde numarası
sanılarak yazılmış.**

Uygulamada sonuç: kullanıcı sorunun "ilgili madde"sine dokunduğunda **tamamen alakasız,
bazen yürürlükten kalkmış** bir madde metni görüyor.

| Konu | Sorunun gerçek dayanağı | Soru | articleNo yanlış |
|---|---|---:|---:|
| T.C. Anayasası | TBMM İçtüzüğü | 25 | 19 |
| T.C. Anayasası | 298 s. Seçimlerin Temel Hükümleri K. | 13 | 13 |
| T.C. Anayasası | 2820 s. Siyasi Partiler K. | 11 | 11 |
| T.C. Anayasası | 2839 s. Milletvekili Seçimi K. | 10 | 9 |
| Türk Ceza Kanunu | 6706 s. Uluslararası Adlî İş Birliği K. | 10 | 10 |
| İYUK | 2575 s. Danıştay K. | 5 | 0 |
| T.C. Anayasası | 6271 s. Cumhurbaşkanı Seçimi K. | 3 | 3 |
| T.C. Anayasası | 6216 s. AYM K. | 2 | 2 |
| İYUK | 2576 s. Bölge İdare M. K. | 2 | 0 |
| BEK / İYUK | 3071, 6087, 2886 | 3 | 2 |
| | **TOPLAM** | **84** | **69** |

### 4.1 Bunların 5'i doğrudan MÜLGA maddeye işaret ediyor

| Soru ID | Sorunun gerçek konusu | Atanan madde | Atanan maddenin durumu |
|---|---|---|---|
| `725859ae` | 298 s. K. — seçim kurulu kararlarına itiraz | Anayasa **m.110** | *(Mülga: 21/1/2017-6771/16 md.)* — Başbakanın atanması |
| `163467e1` | 298 s. K. — şikâyetin reddine itiraz süresi | Anayasa **m.112** | *(Mülga: 21/1/2017-6771/16 md.)* — Bakanlar Kurulunun görevi |
| `fe9f37a6` | 2820 s. Siyasi Partiler K. | Anayasa **m.109** | *(Mülga: 21/1/2017-6771/16 md.)* — Bakanlar Kurulunun kuruluşu |
| `95ee315e` | TBMM İçtüzüğü m.156 — disiplin cezaları | Anayasa **m.156** | *(Mülga: 21/1/2017-6771/16 md.)* — Askerî Yargıtay |
| `4b064309` | 6706 s. K. m.18 — geri verme yargılaması | TCK **m.18** | *(Mülga: 23/4/2016-6706/36 md.)* |

Hata mekanizması net: içe aktarım, açıklamadaki *"İçtüzük m.156"*, *"6706 s. K. m.18"*
gibi atıflardan **yalnızca madde numarasını** alıp konunun kanununa yazmış.
Bu yüzden 2017 anayasa değişikliğiyle mülga olan madde numaralarına denk gelmiş.

**Karar:** 69 sorunun tamamında `articleNo` temizlenmeli. Sonrasında iki yol var —
(a) ilgili mevzuat (2820, 2839, 298, 6271, 6216, 6706, 2575) veritabanına eklenip sorular
doğru konuya taşınır, ya da (b) müfredat dışı sayılıp ayrılır (§5).

### 4.2 Ek olarak 19 soruda `articleNo` veritabanında hiç bulunmuyor

- **Var olmayan madde numarası:** Anayasa `m.8/A` (3 soru), `m.12/A`, `m.94/C`, `m.180`
  — T.C. Anayasası'nda bu maddeler yoktur (Anayasa 177 maddedir).
- **Aralık yazımı:** TCK `m.24-26`, `m.37-40`, `m.64-66`, `m.31-33`, `m.51-53`, `m.58-59`,
  `m.67-71`, `m.76-80` — Madde Atlası aralık çözemez, bağlantı ölü.
- **Çoklu yazım:** 40 soruda `articleNo` `"8, 9"` gibi virgüllü — aynı sorun.

---

## 5. Alan dışı adayları

Kesinleşmiş karar yok; aşağıdakiler PAEM/polis sınav müfredatı bakımından **kullanıcı
onayı gerektiren** başlıklar:

- **6706 s. Cezaî Konularda Uluslararası Adlî İş Birliği Kanunu — 10 soru.** Geri verme
  yargılaması, siyasi suç, iade talebinin kabul edilebilirliği. Hâkimlik/avukatlık düzeyi
  konular; polis sınavı müfredatında yer almıyor.
- **2575 s. Danıştay Kanunu — 5 soru.** Danıştay üyelerinin özlük/disiplin işleri.

---

## 6. Açıklama kalitesi — 320 soru yayına uygun değil

Tamamı A partisinde:

| Sorun | Adet |
|---|---:|
| Açıklama hiç yok | **190** |
| Açıklama yalnızca `Unite: 7` biçiminde ders kitabı kalıntısı — bilgi değeri sıfır | **130** |
| Açıklaması `Unite:` kalıntısıyla başlıyor (metin de var) | 131 |

`Unite:` kalıntısının dağılımı: CMK 237, İnkılap Tarihi 24.

Bu kalıntı kullanıcıya olduğu gibi gösterilir. Yayın öncesi mutlaka temizlenmeli.

---

## 7. Yapısal ret — 21 soru

Kaynak PDF'ten hatalı ayrıştırma. Kurtarılamaz, orijinal metin yok.

| Sorun | Adet | Örnek |
|---|---:|---|
| Soru kökü cümle ortasında kesilmiş | 18 | `5fe2e00e` → *"Aşağıdakilerden hangisi Atatürk'ün"* (kök burada bitiyor) |
| Şık sayısı 5 değil | 2 | `b18b30e7` → 4 şık |
| Cevap anahtarı metni şıkka sızmış | 1 | `ad5bf80d` → şık metni: *"II ve III ANAHTARI"* |

Konu dağılımı: İnkılap Tarihi 14, Genel Kültür 3, Anayasa 3, Atatürk İlkeleri 1.

Tam liste ve şık dökümü: `ilerleme.jsonl` (`sinif = reddedilmeli`).

---

## 8. Ürün ilkesiyle çatışan durum — kaynak etiketi

`CLAUDE.md`: *"Soru bankasının varlık nedeni 'gerçek, kaynaklı çıkmış soru' güvenidir:
kaynak etiketi her zaman görünür."*

- **A partisinin 654 sorusunun hiçbirinde `source_label` yok.** Yayımlanırlarsa kaynaksız
  görünürler.
- **B1'in 587 sorusunda etiket bir yayınevi kitabının adı** ("THEMIS 2025 … SORU KİTABI"),
  sorunun hangi sınavdan çıktığını göstermiyor.
- Yalnız B2'nin 193 sorusunda etiket gerçek sınavı adlandırıyor.

Google Play'de 26 Ağustos'ta kapatılan "Resmî Bilgilerle İlgili Kaynak Bağlantısı Eksik"
ihlaliyle aynı eksen olduğu için ayrıca not edilmiştir.

---

## 9. Yapısal olarak temiz çıkanlar

Bu kontrollerde **hiç** sorun bulunmadı — kuyruğun bu yönleri sağlam:

- Doğru cevabı işaretlenmemiş soru: **0**
- Birden fazla doğru işaretlenmiş soru: **0**
- İki şıkkı birebir aynı metinde olan soru: **0**
- `content_hash` yazılmamış soru: **0**

---

## 10. Soru bazlı inceleme — tamamlananlar

### 10.1 CMK (5271) — A partisi

| ID | Sınıf | Bulgu | Karar |
|---|---|---|---|
| `013dbcc8` | ✅ yayımlanabilir | CMK m.176/4 ile birebir ("en az bir hafta") | yayımlanabilir |
| `031a1056` | ✅ yayımlanabilir | CMK m.2/1-e tanımıyla birebir | yayımlanabilir |
| `009518e7` | ✏ düzeltilerek | Cevap doğru (CMK'da savcının reddi kurumu yok). Açıklama yalnızca `Unite: 3` | düzelt |
| `01544550` | ✏ düzeltilerek | Cevap doğru (m.91/1 → 24 saat, 48 değil). `Unite: 7` kalıntısı; C şıkkı ölçme açısından gevşek | düzelt |
| `01add870` | ✏ düzeltilerek | Cevap doğru (m.75/3). Tek doğru cevap teyit edildi: C şıkkı "derhâl" diyor, m.75/1 "24 saat içinde" — çakışma yok. Açıklama yok | düzelt |
| `032a5ac9` | ✏ düzeltilerek | Cevap doğru (Any. m.22). `Unite: 9` kalıntısı | düzelt |
| `050a1e66` | ⚠ tartışmalı | Soru CMK metnine değil ders kitabı tasnifine dayanıyor. CMK m.158 yalnız ihbar ve şikâyeti düzenler; "izin" ve "talep" kanunda öğrenme şekli değil **muhakeme şartı**dır. Hem B hem C savunulabilir. Ayrıca "Müracat" yazım hatası | reddet / manuel hukuk incelemesi |

### 10.2 TCK (5237) — B1 + B2

| ID | Sınıf | Dayanak | Karar |
|---|---|---|---|
| `51b8435b` | ✅ | m.102/1, m.102/3-e, m.25/1 | yayımlanabilir |
| `2ce3809a` | ✅ | m.7/3 | yayımlanabilir |
| `3b572339` | ✅ | m.8/1-2 | yayımlanabilir |
| `468526aa` | ✅ | m.8/1-2 | yayımlanabilir |
| `4e956b08` | ✅ | m.7/2-4 | yayımlanabilir |
| `5707ff8e` | ✅ | m.12/1 ve m.12/5 *(Ek: 18/6/2014-6545/56 md. — madde metninden birebir teyit)* | yayımlanabilir |
| `84aa35f1` | ✅ | m.11/1-2 | yayımlanabilir |
| `9c47362c` | ✅ | m.2/1, m.2/3 | yayımlanabilir |
| `be843603` | ✅ | m.11 (faile göre kişisellik) | yayımlanabilir |
| `d5418acc` | ✅ | m.8/1, m.9 — *articleNo `"8, 9"` çoklu, tek maddeye indirilmeli* | yayımlanabilir |
| `0d3f8417` | ✏ | 6706 s. K. m.17 — TCK m.15'e yanlış bağlanmış | düzelt / alan dışı |
| `4b064309` | ⚠ | 6706 s. K. m.18 — MÜLGA TCK m.18'e bağlanmış; **6706 metni DB'de olmadığı için içerik resmî kaynaktan doğrulanamadı** | manuel hukuk incelemesi |

---

## 11. Kalan iş

| Parti | Konu | Kalan |
|---|---|---:|
| B1 | Türk Ceza Kanunu | 417 |
| B1 | T.C. Anayasası | 158 |
| A | CMK | 156 |
| A | İnkılap Tarihi | 126 |
| B2 | İdare Hukuku | 91 |
| A | Genel Kültür | 53 |
| B2 | İYUK | 22 |
| B2 | Bilgi Edinme Hakkı K. | 20 |
| | **TOPLAM** | **1093** |

**İnkılap Tarihi + Genel Kültür (179 soru) için not:** bu konuların mevzuat dayanağı yok,
veritabanında karşılaştırılacak resmî metin bulunmuyor. Bunlar tarih/genel kültür
ölçütleriyle incelenecek ve kaynak gösterilerek doğrulanamayan her soru
**"manuel inceleme gerekli"** olarak işaretlenecek — tahminle "doğru" sayılmayacak.

---

## 12. Dosyalar

| Dosya | İçerik |
|---|---|
| `RAPOR.md` | bu rapor |
| `ilerleme.jsonl` | soru başına bir satır karar kaydı — kesinti hâlinde buradan devam edilir |
| `mukerrer-dokum.txt` | 110 mükerrer grubun tam dökümü |
| `apps/api/scripts/inceleme-dok.ts` | salt-okur inceleme aracı |

**Devam komutu:**
```
cd apps/api && npx tsx scripts/inceleme-dok.ts --konu <topicId> --adet 16
```
`ilerleme.jsonl`'de kaydı olan sorular otomatik atlanır.
