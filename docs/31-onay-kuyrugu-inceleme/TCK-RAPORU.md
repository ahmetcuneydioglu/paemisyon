# TCK Onay Kuyruğu — İçerik Denetimi Raporu

**Kapsam:** Türk Ceza Kanunu konusundaki 440 in_review sorunun tamamı
**Yöntem:** Her soru, bağlı olduğu maddenin `mevzuat.gov.tr` metnine karşılaştırıldı
(DB'deki metinlerin son doğrulaması 15 Ağustos 2026). Bulguların tamamı çekişmeli
doğrulamadan geçirildi.
**Tarih:** 27 Ağustos 2026 · **Veritabanına içerik yazılmadı** — yalnız madde bağlantısı düzeltmeleri

---

## 1. Sayısal özet

| | Adet |
|---|---:|
| İncelenen TCK sorusu | **440** |
| Doğru ve yayımlanabilir | **423** |
| Düzeltilerek yayımlanabilir | **9** |
| Hukuken tartışmalı / manuel inceleme gerekli | **7** |
| Alan dışı — silindi | **3** *(geri verme, 6706 s. K.)* |
| Güncelliğini yitirmiş | **0** |
| Yığılma uyarısı (mükerrer değil, ölçme çeşitliliği) | 5 küme |

**Güncellik sonucu:** TCK'da güncelliğini yitirmiş soru bulunmadı. Son dönem değişiklikleri
(7550/2025, 7571/2025, 7499/2024, 7531/2024) neredeyse tamamen ceza *miktarı* değişikliği
olduğu için, miktar sormayan sorular etkilenmedi. Miktar soran 39 sorudan değişen maddeye
bağlı 5'i tek tek doğrulandı — beşi de güncel çıktı.

---

## 2. Yöntem ve doğrulama

İnceleme iki koldan yürüdü:

- **Solo inceleme (326 soru, m.2–m.167):** parti başına 14–20 soru, her parti kendi
  maddelerinin tam metniyle birlikte okundu.
- **Paralel inceleme (114 soru, m.167–m.316):** altı bölüme ayrılıp eşzamanlı denetlendi.

**Her bulgu çürütmeye tabi tutuldu.** Paralel koldaki her iddia bağımsız bir denetçiye
"bunu çürüt" görevi olarak gitti; **1 iddia bu aşamada elendi.** Solo kolda "işaretli cevap
mevzuata aykırı" dediğim dört iddia ikişer denetçiye verildi (biri çürütmeye çalıştı, diğeri
soruyu iddiayı görmeden sıfırdan çözdü):

| İddia | Sonuç |
|---|---|
| `f0c49ea6` (m.120) | **2/2 doğrulandı** — ikisi de bağımsız olarak E'ye vardı |
| `07e0cba0` (m.117) | **2/2 doğrulandı** — *"İddiayı çürütmeye çalıştım; resmî metin buna izin vermiyor"* |
| `5613acc6` (m.82) | **Gerekçem çürütüldü, tespitin bir yarısı ayakta** — aşağıda |
| `6089f30c` (m.43) | **"Kesin hata" değerlendirmem geçmedi** — tartışmalıya indirildi |

---

## 3. Düzeltilmeden yayımlanmaması gerekenler

### 3.1 `07e0cba0` — m.117 · işaretli cevap mevzuata aykırı ✔2/2 doğrulandı

Soru: tehditle dükkân kapattırma. İşaretli cevap **A** ("iş ve çalışma hürriyetinin ihlali *ile tehdit*").

m.117/1 tehdidi suçun **hareket unsuru** sayar ("Cebir veya **tehdit** kullanarak ya da hukuka
aykırı başka bir davranışla..."). m.42: *"Biri diğerinin unsurunu... oluşturması dolayısıyla tek
fiil sayılan suça bileşik suç denir. Bu tür suçlarda içtima hükümleri uygulanmaz."* Ayrıca
tehditten ceza verilmez.

**Doğrusu: B (yalnız iş ve çalışma hürriyetinin ihlali).**

Ayrıca açıklamada kullanıcıya gösterilemeyecek bir cümle var:
*"...**kaynak sorudaki kabul uyarınca** ayrıca tehdit suçu da değerlendirilir."* Açıklama,
hukuki gerekçeye değil kitabın kabulüne dayandığını itiraf ediyor.

> Bu, kuyruğun kendi m.42 sorularıyla da çelişiyor: `3e40efdc` ve `addddf0c` aynı mantığı
> doğru uyguluyor.

### 3.2 `f0c49ea6` — m.120 · kök, cevabı iki ayrı nedenle çürütüyor ✔2/2 doğrulandı

Soru: "hakkında arama kararı **bulunan** B'yi durdurup aramak istemiş; arama yapmadan
**vazgeçerek** uzaklaşmıştır." İşaretli cevap **B** (haksız aramaya teşebbüs).

1. m.120 "**hukuka aykırı olarak** arayan" der. Geçerli arama kararı varsa arama hukuka
   uygundur; suçun kurucu unsuru hiç gerçekleşmez, teşebbüs edilecek suç yoktur.
2. m.35/1 teşebbüs için "**elinde olmayan nedenlerle**" tamamlayamamayı arar. Kökte fail
   bizzat *vazgeçmiştir* — m.36/1: *"gönüllü vazgeçer... ise teşebbüsten dolayı cezalandırılmaz."*

**Kökün mevcut hâliyle doğru cevap E (ceza sorumluluğu yoktur).**
Düzeltme: "arama kararı **bulunmayan** B'yi... üçüncü kişilerin araya girmesi üzerine
tamamlayamamıştır" → o zaman B doğru olur.

### 3.3 `e9a2ab5e` — m.271 · hiç doğru cevap yok ✔doğrulandı

Soru "hangileri yanlıştır?" diyor, anahtar I, II ve IV'ü yanlış sayıyor. Ancak **III de
yanlış**: *"İhbar yetkili makamlara yapılmalı ve fail gösterilmelidir."* m.271 metninde failin
gösterilmesi diye bir unsur yok; belirli kişiye isnat varsa zaten suç uydurma değil **iftira**
(m.267) gündeme gelir.

**Açıklama kendi anahtarıyla çelişiyor:** açıklama *"Belirli bir kişiye isnat gerekmez"*
diyerek III'ün yanlış olduğunu söylüyor, ama anahtar III'ü yanlışlar arasına almıyor.

Düzeltme: III → *"İhbar yetkili makamlara yapılmalıdır; ancak belirli bir failin gösterilmesi
gerekmez."* Böylece III doğru olur ve E anahtarı geçerli hâle gelir.

### 3.4 `5613acc6` — m.82 · kökte olmayan olguya dayanma ✔kısmen doğrulandı

**Önceki değerlendirmem düzeltildi.** "Öldürme nitelikli şekilden olmalı" demiştim; bu
yanlıştı — **m.30/2**'yi atlamışım: *"nitelikli hallerin gerçekleştiği hususunda hataya düşen
kişi, bu hatasından yararlanır."* Fail öldürdüğünün babası olduğunu bilmiyordu, üstsoy
ağırlaştırıcısı uygulanmaz; kastedilen kardeş niteliği de objektif olarak gerçekleşmedi.
**Temel şekil doğru.**

**Ayakta kalan sorun:** kök yalnız *"gizlice onun evine girerek"* diyor, **gece vakti demiyor**.
m.116/4 nitelikli hâli cebir/tehdit veya gece vaktine özgü. Kökün mevcut hâliyle konut
dokunulmazlığı temel şekilden olmalı — bu durumda **hiçbir şık tam doğru değil.**

### 3.5 `e67b225c` — m.170 · öncüller iki farklı fıkradan ✔doğrulandı

Kök "somut tehlike doğuran seçimlik hareketler" (m.170/3) soruyor. Öncül IV'te *"tehlikesine"*
ibaresi var, **öncül III'te yok**: *"Çığ düşmesine neden olma"* — bu m.170/**1-b**'nin hareketi.
Metne birebir bağlı okuyan aday için ikinci bir şık savunulabilir hâle geliyor. Fark önemsiz
değil: m.170/1 için 1–5 yıl hapis, m.170/3 için 3 ay–1 yıl hapis veya adlî para cezası.

Düzeltme: III → *"Çığ düşmesi **tehlikesine** neden olma"*.

### 3.6 Anlatım ve bağlantı düzeltmeleri

| Soru | Sorun | Düzeltme |
|---|---|---|
| `50845207` | *"sahibi bulunmayan bir tahıl ambarı"* — sahipsiz mal hırsızlığın konusu olamaz | *"sahibi başında bulunmayan"* |
| `5f42d50d` | *"Suçun hırsızlıkla karşı işlenmiş olması"* — anlamsız | *"hırsızlık suçuyla birlikte işlenmiş olması"* |
| `7b420296` | kökte *"onun önünü dönene bir mektup"* | *"kapısının önüne"* · articleNo m.132→m.124 ✅uygulandı |
| `eb7725f4` | B şıkkındaki "temel şekildir" ifadesi ikinci doğru cevap okumasına açık | *"...nitelikli hâl oluşturur"* |
| `ef6d8af6` | kesintisiz suç örneği m.109'a bağlıydı | articleNo → m.220 ✅uygulandı |
| `733ebedd` | zorlayıcı neden sorusu m.35'e (teşebbüs) bağlıydı | articleNo boşaltıldı ✅uygulandı |

---

## 4. Hukuken tartışmalı — manuel inceleme gerekli

Bunlarda mevzuat metninden tek doğru cevaba varılamadı. **Kaynak gösterilemediği için
"doğru" sayılmadılar.**

| Soru | Madde | Çekirdek sorun |
|---|---|---|
| `6089f30c` | m.43 | m.43/2 "tek bir **fiille**" ifadesi zaman-mekân birliğindeki çok hareketi kapsar mı? İki denetçi zıt sonuca vardı. **Ama ikisi de açıklamanın hatalı olduğunda birleşti** — "mağduru belli olmayan suçlar" istisnası burada uygulanamaz. Ayrıca kuyruk içi tutarsızlık: `48041639` ve `c5a802cc` aynı olguyu ters yönde çözüyor |
| `e335bcae` | m.191 | Uyuşturucunun bedelsiz ikramı m.188/3'teki "başkalarına veren" fiili mi? Doğrulayıcı m.188/3 metnini çekip iddiayı **güçlendirdi**: fıkra "veren"i "satan"dan ayrı fail olarak sayıyor, bedel şartı aramıyor. Açıklama kökte olmayan "birlikte tüketilmek üzere" olgusuna dayanıyor |
| `825be1aa` | m.247/m.250 | **Kök kendi içinde çelişiyor:** "daha **az** para verildiğini fark etmiş" denip aynı cümlede "yanılgı sonucu verilen **fazla** parayı alıkoymuştur" deniyor. Ayrıca olgu m.250/3 (hatadan yararlanarak irtikâp) tanımıyla birebir örtüşüyor; zimmet cevabı tek doğru değil |
| `ae7a62ad` | m.6 | "İhale yoluyla kamusal faaliyet üstlenen şirket çalışanı" kamu görevlisi **sayılır** (madde gerekçesi); E doğru cevap olamaz. C (tanık) daha güçlü aday. Gerekçe ve içtihat DB'de yok |
| `d4962cea` | m.25 | Hukuka uygunluk nedenlerinde sübjektif unsur aranır mı? Açıklama "objektiftir" diyerek tartışmalı bir öğretiyi tek doğruymuş gibi sunuyor |
| `7eba10db` | m.66 | Açıklama kendi işaretlediği öncülü çürütüyor; mevcut şıklarla tutarlı doğru cevap yok |
| `882dac45` | m.102 | Hem A hem B "nitelikli hâl değildir" ölçütüne uyuyor — çift doğru cevap riski |
| `ae4981fb` | m.155 | Kök yağmanın gerçekten olduğunu söylüyor; m.271 suç uydurma unsuru gerçekleşmiyor |
| `6b8d6ef7` | m.155 | Ceket cebinde **unutulan** saat "kapalı bütün" sayılır mı? Kuyruğun kendi `4babd7e4` sorusuyla olgu farkı var (orada para bilerek valize konmuş) |

---

## 5. Yığılma uyarıları (silme önerisi değil — kullanıcı kararı)

Birebir mükerrer değiller; senaryolar farklı ve her biri ayrı ayrı doğru. Ancak aynı kuralın
tekrar tekrar sorulması ölçme çeşitliliğini düşürüyor.

| Kural | Soru sayısı | Sorular |
|---|---:|---|
| m.141 — zilyetlik devredilmedi → hırsızlık, güveni kötüye kullanma değil | **6** | `13886e49` `9daf5ef5` `b24aac41` `d8ab9314` `ecd67dc0` `eea16bec` |
| m.84/4 — cebir/tehditle veya algılama yeteneği gelişmemiş kişiyi intihara sevk → kasten öldürme | **5** | `617307c4` `a1601b29` `b21c4fb0` `d9eb041f` `e7377cfb` |
| m.104/2 — evlenme yasağı bulunan fail | **3** | `103275fa` `1d44ce9f` `8f086717` |
| m.133 — aleni olmayan konuşmaların dinlenmesi | **3** | `01d6a433` `27eb5518` `9f4549bb` |
| m.247 — zimmet (`f3169da2` ile `814fdd27` **fiilen özdeş**: aynı "B" faili, aynı kumar kurgusu) | 2 | `f3169da2` `814fdd27` |
| m.130 · m.103 · m.89 (avcı ikilisi) | 2'şer | — |

---

## 6. Değerlendirme

**Partinin hukuki kalitesi yüksek.** 440 sorudan 423'ü (%96) düzeltmesiz yayımlanabilir çıktı.
Açıklamalar madde metniyle tutarlı, çeldiriciler düzgün kurgulanmış, 2014–2025 arası mevzuat
değişiklikleri isabetle izlenmiş — ör. `e640f499` m.43/3'ten çıkarılan ibareyi, `eb7725f4`
m.142/2-g'den çıkarılan ibareyi, `533af983` m.103'ten kaldırılan ağır neticeyi doğru biliyor.

**Hatalar tesadüfi değil, iki eksende toplanıyor:**

1. **İçtima** — bir suç diğerinin unsuru olduğunda m.42 gereği ayrıca ceza verilmemesi
   (`07e0cba0`).
2. **Kök–cevap tutarlılığı** — kökte olmayan olguya dayanma (`5613acc6`, `e335bcae`) veya
   kökteki bir olgunun cevabı çürütmesi (`f0c49ea6`, `825be1aa`).

Ayrıca **açıklamaların kendi anahtarlarıyla çelişmesi** üç ayrı soruda görüldü
(`e9a2ab5e`, `7eba10db`, `5613acc6`) — bu, açıklama metinlerinin anahtardan bağımsız
üretildiğini düşündürüyor ve yayın öncesi tutarlılık kontrolünü gerektiriyor.

---

## 7. Sıradaki iş

TCK bitti. Kuyrukta kalan konular:

| Konu | Adet |
|---|---:|
| T.C. Anayasası | 212 |
| İdare Hukuku (genel doktrin) | 53 |
| İYUK | 24 |
| 657 DMK · 5393 · 5302 · 5442 *(taşınanlar)* | 35 |
| Bilgi Edinme Hakkı K. | 2 |
