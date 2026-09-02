# Onay Kuyruğu — Uygulanan İşlemler ve Yol Haritası

**Tarih:** 27 Ağustos 2026 · **Yazma penceresi:** backend kapalıydı, `connection_limit=1`

---

## ⚠ Önemli düzeltme — kuyruk 1422 değil 765

İlk raporum yanlış popülasyon üzerine kuruluydu. Sorgularım `question.deletedAt`
filtresini kullanmıyordu; admin kuyruğu ise
`{ status:'in_review', question:{ deletedAt:null } }` ile filtreliyor
(`admin-questions.service.ts:297`).

| | Ham `in_review` sürüm | Kuyrukta görünen |
|---|---:|---:|
| Başlangıç | 1459 | 782 |
| Şu an | — | **765** |

**Sonuç: A partisinin tamamı (677 soru) zaten silinmişti.** Yani ilk raporda
bildirdiğim şu kalemler kuyrukta **hiç yoktu**:

| İlk raporda | Gerçek |
|---|---|
| 289 mükerrer fazlalık | **0** — canlı kuyrukta tek mükerrer yok |
| 190 açıklaması boş soru | **0** |
| 130 `Unite: N` kalıntılı açıklama | **0** |
| 18 kesik kök | **1** (o da silindi) |

Senin 1., 6. ve 7. maddelerinin büyük kısmı bu yüzden **konusuz kaldı** — o iş
zaten yapılmış.

---

## Kuyruğun gerçek dağılımı (765)

| Ders › Konu | Adet | Etiket |
|---|---:|---|
| Ceza Hukuku › Türk Ceza Kanunu | 437 | B1 (etiketi silindi) |
| Anayasa Hukuku › T.C. Anayasası | 158 | B1 (etiketi silindi) |
| İdare Hukuku › İdare Hukuku | 89 | B2 sınav etiketi korundu |
| Anayasa Hukuku › T.C. Anayasası | 54 | B2 sınav etiketi korundu |
| İdare Hukuku › İYUK | 25 | B2 sınav etiketi korundu |
| Polis Mevzuatı › Bilgi Edinme K. | 2 | B2 sınav etiketi korundu |

---

## Uygulanan işlemler

Silme = **soft delete**: `question.deletedAt` damgalandı + `questionVersion.status='archived'`.
Kuyruk `deletedAt: null` ile filtrelediği için soru düşer; veri kaybı yok, geri alınabilir.

### 1. Silinen: 17 soru

| Neden | Adet |
|---|---:|
| Müfredat dışı — 6706 s. Uluslararası Adlî İş Birliği K. | 10 |
| Müfredat dışı — 2575 s. Danıştay K. | 6 |
| Kök ayrıştırma hatası (`89989180` — *"Âyanlarla 'Sened-i İ fak' adı verilen…"*) | 1 |

### 2. `articleNo` temizlenen: 60 soru — Madde Atlası hatası

Soru **konusunda kaldı** (senin "en yakın topic" kuralın), yalnız yanlış madde numarası silindi.

| Sorunun gerçek dayanağı | Adet |
|---|---:|
| TBMM İçtüzüğü | 19 |
| 298 s. Seçimlerin Temel Hükümleri K. | 13 |
| 2820 s. Siyasi Partiler K. | 11 |
| 2839 s. Milletvekili Seçimi K. | 9 |
| 6271 s. Cumhurbaşkanı Seçimi K. | 3 |
| Anayasa'da olmayan madde (`m.8/A`) | 3 |
| 6216 s. AYM K. | 2 |

**Mülga maddeye işaret eden soru artık 0.** Buradaki 5 soru aslında mülga konuyla
ilgili değildi — 298/İçtüzük/2820 soruları, hatalı numara yüzünden mülga Anayasa
maddelerine denk gelmişti. Bağlantı temizlenince sorun kendiliğinden kalktı, **soruları
silmeye gerek olmadı.** (Senin 3. maddendeki talebi bu şekilde karşıladım — soruların
kendisi sağlam, sadece bağlantıları bozuktu.)

İçerik olarak 2017 öncesi mülga düzene dayanan soru da ayrıca arandı: 9 eşleşmenin
tamamı meşru çıktı (anayasa tarihi karşılaştırması, 5393/5302'de hâlâ yürürlükte olan
meclis soruşturması vb.). **Silinecek içerik yok.**

### 3. Kaynak etiketi silinen: 601 soru

Yayınevi kitabı adı ("THEMIS 2025 … SORU KİTABI") etiket olmaktan çıkarıldı.
Gerçek sınav etiketleri (**164 soru** — "2023 KAYMAKAMLIK SINAVI" vb.) korundu.

### 4. `articleNo` atanan: 4 soru

`3f0cc899`→m.84 · `372728e3`→m.96 · `11e83a55`→m.153 · `20c143be`→m.84 — dördü de
madde metnine karşılaştırılarak tek tek doğrulandı.

**Otomatik bağlamada iki kez tehlikeli sonuç üretip düzelttim.** Açıklamadaki `m.5`
atıfını körlemesine almak, tam da yeni düzelttiğim hatayı yeniden üretiyordu:
*"İçtüzük m.5"* → Anayasa m.5, *"2576 s. K. m.3"* → İYUK m.3. İkinci turda kusur soru
kökünde çıktı: `b18b30e7` bir 2820 s. Kanun sorusu ama açıklaması yalnız *"Kanun m.57"*
dediği için Anayasa m.57'ye bağlanacaktı. Son hâlde bağlama yalnız şu iki koşulda
yapılıyor: (a) açıklama konunun kendi kanununu adıyla anıyor, (b) kökte ve açıklamada
başka hiçbir mevzuat geçmiyor. 187 adaydan yalnız 4'ü bu eşiği geçti — az ama doğru.

---

## Açık kalan konu — `articleNo` aralık ve çoklu yazım (51 soru)

`articleNo` şemada tek değer (`String?`); Madde Atlası `topic + articleNo` ile tek
madde çözüyor. Kuyrukta:

- **Aralık yazımı: 11** — `m.24-26`, `m.37-40`, `m.64-66`, `m.67-71`, `m.76-80`…
- **Çoklu yazım: 40** — `m.8, 9`, `m.22, 30, 89`, `m.24, 37, 106`…

Her ikisi de çözülemiyor; bağlantı ölü.

**Önerim: birincil maddeye indirmek (şema değişikliği yok).**

Gerekçe: bu soruların hemen hepsinde ölçülen tek bir kural var, diğer maddeler arka
plan. Örnek: `07f9d076` `m.22, 85` — soru taksirle öldürmeyi ölçüyor, m.85 birincil;
m.22 tanım maddesi. `d5418acc` `m.8, 9` — ölçülen kural m.9 (yabancı ülkede hüküm
verilmesi yeniden yargılamaya engel değil), m.8 arka plan.

Alternatif — `articleNos String[]` şemaya geçmek — daha doğru modelleme ama migration +
API + mobil + web olmak üzere dört yüzeyi birden değiştirir. 51 soru için orantısız
buluyorum. İleride "bir soru gerçekten iki maddeyi birlikte ölçüyor" ihtiyacı
yaygınlaşırsa o zaman yapılabilir.

51 sorunun her birinin kökünü okuyup birincil maddeyi kendim seçerim; körlemesine
"ilk sayıyı al" yapmam — yukarıdaki iki hatadan sonra buna güvenmiyorum.

**Kararını bekliyorum.**

---

## Yol haritası — kalan iş

| # | İş | Adet | Durum |
|---|---|---:|---|
| 1 | Mükerrer inceleme | 0 | ✅ konusuz (zaten temiz) |
| 2 | Madde Atlası yanlış bağlantı | 60 | ✅ bitti |
| 3 | Mülga madde bağlantısı | 5 | ✅ bitti (silmeye gerek kalmadı) |
| 4a | `articleNo` güvenli otomatik bağlama | 4 | ✅ bitti |
| 4b | Aralık + çoklu yazım | 51 | ⏸ **kararını bekliyor** |
| 4c | Bağlanamayan (İdare Hukuku mevzuatı DB'de yok) | 88 | ⏸ mevzuat eklenmeden çözülemez |
| 4d | Bağlanamayan (elle okunacak) | 34 | ⏳ |
| 5 | Müfredat dışı (6706, 2575) | 16 | ✅ bitti |
| 6 | Açıklama kalitesi + güncellik denetimi | 765 | ⏳ **asıl iş** |
| 7 | Yapısal ret | 1 | ✅ bitti |
| 8 | Kaynak etiketi temizliği | 601 | ✅ bitti |

**6. madde artık işin merkezi.** Kuyrukta açıklaması boş soru yok, `Unite:` kalıntısı
yok — yani "temizlik" işi bitmiş durumda. Kalan iş senin tarif ettiğin ince işçilik:
her sorunun **önce güncelliği** (mevzuat değişmiş mi, AYM iptal etmiş mi), **sonra
açıklamasının mevzuata uygunluğu** denetlenecek. 765 sorunun tamamı için, konu konu.

---

## Dosyalar

| Dosya | İçerik |
|---|---|
| `DURUM.md` | bu dosya — uygulanan işlemler |
| `RAPOR.md` | ilk rapor *(yanlış popülasyon üzerine kuruluydu, bu dosya düzeltir)* |
| `ilerleme.jsonl` | soru başına karar kaydı |
| `apps/api/scripts/kuyruk-temizlik.ts` | uygulanan temizlik (kuru çalışma destekli) |
| `apps/api/scripts/madde-bagla.ts` | güvenli madde bağlama |
| `apps/api/scripts/inceleme-dok.ts` | salt-okur inceleme aracı |

---

# İkinci tur — 4b ve 4c tamamlandı

## 4b — Aralık ve çoklu `articleNo`: 51 soru

51 sorunun **her birinin kökünü, doğru cevabını ve açıklamasını okuyup** birincil
maddeyi tek tek belirledim. "İlk sayıyı al" gibi otomatik bir kural kullanmadım —
bu turda iki kez otomatik bağlamanın yanlış sonuç ürettiğini gördükten sonra buna
güvenmiyorum.

- **50 soru** birincil maddeye indirildi
- **1 soru** silindi: `9d6e8b9c` — "yabancı kişilerin geri verilmesi" sorusu.
  `m.10, 15, 17` atanmıştı ama bu TCK maddelerinin geri vermeyle ilgisi yok; konu
  bütünüyle 6706 s. Kanun'a ait. Diğer 6706 sorularıyla aynı gerekçeyle çıkarıldı.

Birincil madde seçimindeki ölçüt: **sorunun ölçtüğü kural**, diğer maddeler arka plan.

| Örnek | Eski | Yeni | Gerekçe |
|---|---|---|---|
| `07f9d076` | `22, 85` | m.85 | taksirle öldürme ölçülüyor; m.22 tanım maddesi |
| `d5418acc` | `8, 9` | m.9 | yabancı ülkede hüküm yeniden yargılamaya engel değil |
| `37df4587` | `51-53` | m.53 | m.53/4 — kısa süreli hapis ertelenirse hak yoksunluğu uygulanmaz |
| `7a3d4de8` | `24-26` | m.26 | ilgilinin rızası m.26/2 |
| `00b15123` | `42, 142` | m.42 | bileşik suç; m.142 nitelikli hâl arka plan |

Şema değiştirilmedi (`articleNos String[]` yapılmadı) — migration + API + mobil + web,
dört yüzey için 51 soru orantısız olurdu.

## 4c — İdare Hukuku kaynakları

Saydığın kanunların **çoğu zaten DB'de ve İdare Hukuku dersi altında ayrı konu**:

| Kanun | Durum | Madde |
|---|---|---:|
| 2577 İYUK | ✅ İdare Hukuku › İYUK | 82 |
| 5393 Belediye K. | ✅ İdare Hukuku › 5393 | 101 |
| 5302 İl Özel İdaresi K. | ✅ İdare Hukuku › 5302 | 78 |
| 5442 İl İdaresi K. | ✅ İdare Hukuku › 5442 | 77 |
| 657 DMK | ✅ Polis Mevzuatı › 657 | 337 |
| 2576 Bölge İdare M. K. | ✅ var ama **soruları alınmayacak** | 48 |
| Anayasa | ✅ Anayasa Hukuku › T.C. Anayasası | 198 |
| 2942 Kamulaştırma · 2886 · 4734 · 5018 | ❌ DB'de yok | — |

"İdare Hukuku › İdare Hukuku" konusundaki 88 sorunun gerçek dayanağı:

| Dayanak | Adet |
|---|---:|
| Belirli kanun anılmıyor — genel doktrin | 28 |
| 657 DMK | 16 |
| Anayasa | 14 |
| 5393 Belediye K. | 14 |
| 5302 İl Özel İdaresi K. | 5 |
| 2942 Kamulaştırma K. | 4 |
| 4734 Kamu İhale K. | 4 |
| 5442 · 2577 · 5018 | 3 |

28 genel doktrin sorusunda madde bağlantısı zaten olmamalı — doğru durum bu.
Kalan 60 soru için **bir öneri var, kararını bekliyorum:** bu sorular ilgili alt
konuya (5393, 5302, 5442, 657) taşınırsa Madde Atlası bağlantıları çalışır. Aynı
ders altında kaldıkları için öğrenci yine İdare Hukuku'nda bulur. Müfredat
yerleşimini değiştirdiği için kendiliğimden yapmadım.

## 4c ek — 2575 / 2576 silindi

`23891d6f` (2576 s. K. — bölge idare mahkemesi kuruluşu) ve `675b7a50`
(Danıştay Vergi Dava Daireleri Kurulu) arşivlendi.

## Madde Atlası — son durum

| | Adet |
|---|---:|
| **Bağlantı çalışıyor** | **617** |
| Bağlantı yok (`articleNo` boş) | 181 |
| Çözülemeyen `articleNo` | **0** |
| Mülga maddeye işaret eden | **0** |

Tur başında çözülemeyen 51, mülga işaret eden 5, yanlış bağlanan 69 vardı.

> **Not:** Kuyruk bu tur içinde 765 → **798**'e çıktı. Sen çalışırken içe aktarım
> yapmış olabilirsin; yeni gelen sorular da bu incelemeye dâhil edilecek.

---

# Üçüncü tur — taşıma tamam, TCK denetimi başladı

## İdare Hukuku soruları taşındı: 35

| Hedef | Soru | articleNo da bağlandı |
|---|---:|---:|
| Polis Mevzuatı › 657 DMK | 16 | 5 |
| İdare Hukuku › 5393 Belediye K. | 13 | 5 |
| İdare Hukuku › 5302 İl Özel İdaresi K. | 5 | 1 |
| İdare Hukuku › 5442 İl İdaresi K. | 1 | 1 |

Scripte emniyet kemeri koydum: kök gerçekten o kanunu adlandırmıyorsa soru atlanıyor.

### Taşınmayanlar ve gerekçeleri (53 soru)

- **Anayasa maddesi anan 14 soru — taşınmadı.** İncelediğimde bunların İdare Hukuku
  doktrini soruları olduğu çıktı: `af6e36ea` baroların hukuki niteliği, `b4083f68`
  devletleştirme–kamulaştırma farkı, `f94f16cd` kolluk faaliyetlerinde ölçülülük,
  `05dc4d69` idarenin bütünlüğü. Açıklamada anayasal dayanak anılması bunları Anayasa
  sorusu yapmaz; taşımak yanlış olurdu.
- `b32e7045` — 5302 + 5393 + 5216'yı birlikte soruyor, tek kanuna bağlanamaz.
- `1834465c` — 6306 s. Afet Riski K. sorusu; o kanun DB'de yok.
- 28 genel doktrin sorusu — kanun anmıyor, zaten doğru yerde.
- 2942 Kamulaştırma (4), 4734 Kamu İhale (4), 5018 (1) — mevzuat DB'de yok.

---

## 6. madde — TCK denetimi (443 soru)

### Güncellik taraması

TCK madde metinleri **15 Ağustos 2026'da doğrulanmış** durumda. Kuyruktaki sorulardan
32'si son dönemde değişen maddelere bağlı:

| Madde | Soru | Değişiklik |
|---|---:|---|
| m.87 | 5 | 4/6/2025 (7550) |
| m.75 | 4 | 2/3/2024 (7499) · 7/11/2024 (7531) |
| m.170 | 4 | 24/12/2025 (7571) |
| m.89 · m.86 · m.39 · m.53 · m.220 | 3'er | 7571 / 7550 / 7499 |
| m.65 · m.108 | 2'şer | 7499 / 7550 |

**Kritik bulgu:** Bu değişikliklerin neredeyse tamamı **ceza miktarı** değişikliği.
Miktar sormayan soru etkilenmiyor. Bu yüzden riski daralttım: kökünde veya şıkkında
ceza miktarı geçen 39 sorudan yalnız **5'i** değişen maddeye bağlı. Beşini de madde
metninden tek tek doğruladım:

| Soru | Madde | Sonuç |
|---|---|---|
| `37df4587` | m.53/4 — "kısa süreli hapis ertelenmişse m.53/1 uygulanmaz" | ✅ güncel |
| `70abcbe5` | m.75/1 — ön ödeme üst sınırı **altı ay** | ✅ güncel |
| `fb03ea77` | m.75/1 — on gün içinde talep + **birer ay arayla üç eşit taksit** | ✅ güncel |
| `afceb9e3` | m.65/1-2 — genel af cezaları bütün neticeleriyle kaldırır | ✅ güncel |
| `e13fe3ca` | m.86/2 — basit tıbbi müdahale, şikâyete bağlı | ✅ güncel |

**TCK'da güncelliğini yitirmiş soru bulunmadı.**

### Açıklama yapısı taraması

| Ölçüt | Sonuç |
|---|---:|
| Açıklaması 60 karakterden kısa | **0** |
| Açıklamada TCK'da olmayan madde numarası | **0** |
| Atanan madde açıklamada anılmıyor | 2 → incelendi |
| `articleNo` boş | **0** |

İki uyumsuzluğun biri (`e3acc1a2`) yanlış alarmdı — soru taksiri (m.22) ölçüyor,
açıklama m.329/3'ü yalnız örnek veriyor; atama doğru. Diğeri (`d5462281`) m.167'den
**m.40**'a çevrildi: soru genel teori, açıklama m.40/1'e dayanıyor ve D şıkkı doğrudan
m.40/1'in kuralı.

### Sıradaki: içerik denetimi

Yapısal ve güncellik denetimi bitti; kalan iş 443 sorunun **hukuki içerik** incelemesi —
her sorunun doğru cevabı ve açıklaması, bağlı olduğu resmî madde metnine karşılaştırılarak.
Parti başına ~16 soru + ilgili madde metni. İlk 12 soru incelendi (m.86/87/89 yaralama
grubu + m.53/65/75), tamamı doğru çıktı.
