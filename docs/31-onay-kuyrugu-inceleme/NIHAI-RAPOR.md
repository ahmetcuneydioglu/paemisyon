# Onay Kuyruğu İçerik Denetimi — Nihai Rapor

**Tarih:** 29 Ağustos 2026
**Kapsam:** Admin panelindeki onay kuyruğunda (`status = in_review`) bekleyen soruların tamamı
**Yöntem:** Her soru, dayandığı mevzuatın `mevzuat.gov.tr` resmî metnine karşılaştırıldı
**Sonuç:** İncelenmemiş soru kalmadı (758/758)

---

## 1. Sayısal özet

| Sınıf | Adet |
|---|---:|
| Doğru ve yayımlanabilir | **725** |
| Mükerrer | **291** |
| Düzeltilerek yayımlanabilir | **38** |
| Reddedilmeli | **21** |
| Hukuken tartışmalı veya belirsiz | **10** |
| Alan dışı | **3** |
| Güncelliğini yitirmiş | **2** |
| Manuel hukuk incelemesi gerekli | **0** |
| **Toplam benzersiz soru kaydı** | **1090** |

Bu 1090 kaydın **758'i şu an kuyrukta canlı**, kalanı inceleme sırasında veya öncesinde
arşivlenmiş (soft delete) durumdadır.

### Kuyrukta kalan 758 sorunun dersler bazında dağılımı

| Ders / Mevzuat | Adet |
|---|---:|
| Ceza Hukuku › Türk Ceza Kanunu | 418 |
| Anayasa Hukuku › T.C. Anayasası | 209 |
| İdare Hukuku › İdare Hukuku (doktrin) | 52 |
| Ceza Muhakemesi › 5271 CMK | 24 |
| İdare Hukuku › 2577 İYUK | 18 |
| Polis Mevzuatı › 657 DMK | 16 |
| İdare Hukuku › 5393 Belediye K. | 13 |
| İdare Hukuku › 5302 İl Özel İdaresi K. | 5 |
| Polis Mevzuatı › 4982 Bilgi Edinme K. | 2 |
| İdare Hukuku › 5442 İl İdaresi K. | 1 |

---

## 2. Yöntem

Her soru için sırasıyla şunlar kontrol edildi:

1. **İşaretli cevap** — dayandığı maddenin resmî metniyle birebir karşılaştırıldı.
2. **Diğer şıklar** — hepsinin gerçekten yanlış olduğu doğrulandı. *(En sık yakalanan kusur
   türü buydu: işaretli cevap doğru ama ikinci bir şık da yanlış/doğru çıkıyor.)*
3. **Açıklama** — cevabı destekleyip desteklemediği, madde numarasının doğruluğu.
4. **Sayısal veriler** — süre, oran, sayı, yetkili merci, ceza miktarı birebir karşılaştırıldı.
5. **Dipnotlar** — mevzuat metnindeki değişiklik dipnotları okundu. *(Güncelliğini yitirmiş
   soruların tamamı bu adımda yakalandı.)*

**Kaynak ilkesi:** Kaynak gösterilmeden hiçbir soru doğru kabul edilmedi. Her kayıtta madde
numarası ve resmî metinden alıntı bulunur. Kesin sonuca ulaşılamayan sorular tahmin edilmek
yerine `tartismali` olarak işaretlendi.

**Mevzuat kaynağı:** `mevzuat.gov.tr` resmî metinleri. İnceleme sırasında sistemde bulunmayan
altı mevzuat (TBMM İçtüzüğü, 298, 2820, 2839, 6271, 6216 — toplam 742 madde) içe aktarıldı;
bu ekleme tek başına **4 gizli hata** ortaya çıkardı.

**Çekişmeli doğrulama:** "İşaretli cevap kesin yanlış" dediğim iddialar bağımsız denetime
verildi. İki iddia bu aşamada elendi (`5613acc6` — TCK m.30/2 atlanmıştı; `6089f30c` —
m.43/2'nin "tek fiil" lafzı). Her ikisi de kayda düzeltilmiş hâliyle işlendi.

---

## 3. Bulgular — mevzuata göre

Aşağıda yalnızca **kusurlu** çıkan sorular listelenmiştir. Her kalem için: mevcut durum,
tespit, güncel mevzuata göre doğrusu, önerilen düzeltme, dayanak madde ve karar.

### 3.1 · 657 sayılı Devlet Memurları Kanunu — 4 soru

> **Kök neden:** 23/1/2026 tarihli ve **7573 sayılı Kanun**. Bu Kanunla **m.57 mülga**
> edilmiş, **m.56 yeniden yazılmıştır**. Yeni m.56 ilişik kesme sebeplerini
> "eğitim/staj başarısızlığı, **birden fazla uyarma ve/veya kınama**, aylıktan kesme ya da
> kademe ilerlemesinin durdurulması" olarak sayar; eski metindeki **"göreve devamsızlık"**
> ibaresi çıkarılmıştır. Üç yıllık memurluk yasağı artık tamamen m.56/2'dedir.

| Soru | Tespit | Düzeltme | Karar |
|---|---|---|---|
| `3e46cdd5` | **Çift yanlış şık.** İşaretli C doğru biçimde yanlış (m.55: önce temel, sonra hazırlayıcı eğitim). Ancak E de artık yanlış: "göreve devamsızlıkları tespit edilenlerin ilişikleri kesilir" ibaresi m.56'dan çıkarıldı. | E → *"Adaylık süresi içinde birden fazla uyarma veya kınama cezası alanların, disiplin amirlerinin teklifi ve atamaya yetkili amirin onayıyla ilişikleri kesilir."* | ✅ Uygulandı |
| `c8fd6187` | Cevap (3 yıl) doğru ama **kök mülga ibareyi alıntılıyor** ("hâl ve hareketlerinde memuriyetle bağdaşmayacak durumları veya göreve devamsızlıkları"), **açıklama mülga m.57'ye** dayanıyor. | Kök yeni m.56 sayımına uyarlandı; açıklamada dayanak m.56/2 gösterildi. | ✅ Uygulandı |
| `4eb652dc` | **Açıklama güncel metinle doğrudan çelişiyor:** *"uyarma ve kınama cezaları ilişik kesme sonucu doğurmaz"* diyor, oysa yeni m.56 **birden fazla** uyarma/kınamayı açıkça sebep sayıyor. Kök ceza sayısını belirtmediği için belirsiz. | Öncüller "bir kez uyarma" / "bir kez kınama" olarak netleştirildi; açıklama yeni m.56'ya göre yazıldı. | ✅ Uygulandı |
| `f2086982` | Açıklamada **mülga kurum adı**: *"Devlet Personel Başkanlığına bildirilir"*. DPB 2018'de kapatıldı; güncel m.56 *"Kamu Personel Bilgi Sisteminin bulunduğu kuruma"* diyor. | Açıklama kanun lafzına uyarlandı. | ✅ Uygulandı |

**Dayanak:** 657 m.54/2, m.55, m.56 (7573/1 md.), m.57 (Mülga: 7573/2 md.), m.58
**Kaynak:** `mevzuat.gov.tr/mevzuat?MevzuatNo=657&MevzuatTur=1&MevzuatTertip=5` · Erişim: 29.08.2026

---

### 3.2 · Seçim mevzuatı (298 · 2820 · 2839 · 6271 · TBMM İçtüzüğü) — 11 soru

Bu mevzuatlar inceleme başında sistemde yoktu; içe aktarıldıktan sonra denetlendi.

#### Cevap anahtarı yanlış olanlar

**`bbfea2df` — 2820 m.8 · Siyasi parti kuruluş belgelerinin gönderilme süresi**
- **Mevcut cevap:** E (30 gün)
- **Tespit:** Resmî metinle doğrudan çelişiyor.
- **Doğrusu:** m.8 — *"İçişleri Bakanlığı, kuruluş bildirisi ve alındı belgesinin onaylı birer örneği ile bildiri eklerinin birer takımını **üç gün** içinde Cumhuriyet Başsavcılığı ile Anayasa Mahkemesine gönderir."*
- **Düzeltme:** Doğru şık **B (3 gün)**; açıklama madde lafzıyla yeniden yazıldı. ✅ Uygulandı

**`9e9890b9` — 2839 m.39 · Yenileme seçiminin günü · GÜNCELLİĞİNİ YİTİRMİŞ**
- **Mevcut cevap:** D (60. gün)
- **Tespit:** İşaretli cevap **2003 öncesi metne** dayanıyor.
- **Doğrusu:** m.39 — *"Bu ilandan sonra gelen **doksanıncı** günü takip eden ilk Pazar günü oy verme günüdür."* 21 no.lu dipnot: *"'altmışıncı günü' ibaresi, 2/1/2003 tarihli ve 4778 sayılı Kanunun 16 ncı maddesiyle 'doksanıncı günü' olarak değiştirilmiştir."* Açıklama ayrıca yanlış maddeye (m.8) atıf yapıyordu.
- **Düzeltme:** Doğru şık **E (90. gün)**; açıklama m.39'a dayandırıldı. ✅ Uygulandı

**`de6c3dcf` — 2839 m.12/A · İttifaktan vazgeçme süresi**
- **Mevcut cevap:** C (7 gün)
- **Tespit:** "Yedi gün" aynı maddedeki **başka** bir süre (ittifak protokolünün YSK'ye teslimi).
- **Doğrusu:** m.12/A — *"Siyasi partiler, aday listelerinin teslim edilmesi için belirlenen tarihten **üç gün** öncesine kadar, Yüksek Seçim Kuruluna bildirimde bulunmak suretiyle ittifaktan vazgeçebilir."*
- **Düzeltme:** Doğru şık **A (3 gün)**; açıklama maddedeki üç süreyi (7 gün protokol teslimi / 2 gün protokol değişikliği / 3 gün vazgeçme) ayrıştıracak biçimde yazıldı. ✅ Uygulandı

#### Doğru cevabı hiç bulunmayan soru

**`b636d03a` — 298 m.7 · Kimler oy kullanabilir** ⚠️ *Bu soru kuyrukta değil, **yayındaydı***
- **Mevcut cevap:** E (izinli bulunan er veya onbaşı)
- **Tespit:** m.7/1 tam tersini söylüyor: *"Silah altında bulunan erler, onbaşılar ve kıta çavuşları **(Her ne sebeple olursa olsun, izinli bulunanlar da bu hükme tabidir)**"*. Beş şıkkın **hiçbiri** doğru değildi; açıklama da parantez içi hükmün tersini iddia ediyordu.
- **Doğrusu:** m.86 "tutuklu sandık seçmen listesi" ve m.87 ek fıkrası uyarınca **tutuklular oy kullanabilir**.
- **Düzeltme:** E → *"Tutuklu olarak ceza infaz kurumunda bulunan seçmen"*; açıklama m.7 parantez hükmü aynen alıntılanarak yeniden yazıldı. ✅ Uygulandı (yayındaki sürüm üzerinde)

#### Çift yanlış / çift doğru şık taşıyanlar

| Soru | Tespit | Düzeltme |
|---|---|---|
| `725859ae` · 298 m.112 | İşaretli E doğru biçimde yanlış; ancak **D de yanlış**: m.112 *"nöbetçi **savcıya**"* diyor, şık "nöbetçi hâkime" diyordu. | D → *"İtiraz, seçim kurulu başkanına; bulunamazsa nöbetçi savcıya yapılabilir."* ✅ |
| `cc031684` · 298 m.80 | Cevap esasen doğru ama şıkkın lafzı sakat: *"23.00'e kadar yayın"* ifadesi m.80'in yasak dilimini (18.00 öncesi) de kapsıyordu. | D → *"…saat 21.00'den sonra…"*; açıklama m.80'in üç zaman dilimiyle yazıldı. ✅ |
| `27d9aab1` · 2839 m.22 | İşaretli B doğru biçimde yanlış; ancak **C de yanlış**: m.22 il seçim kurulu için *"en geç **iki gün**"* diyor, şık "üç gün" diyordu. | C → *"…en geç iki gün içinde karara bağlar."* ✅ |
| `cddb17fd` · 2839 m.19 | İşaretli C doğru; ancak **D de yanlış**: m.19 *"…reddedilenler, aday listesine giremezler **ve adaylıklarını koyamazlar**"* diyor. | D → *"Ayrılma hakkını kazanmış subay ve astsubayların ayrılma istekleri reddedilemez."* ✅ |
| `dc39e84c` · İçtüzük m.139 | İşaretli B doğru; ancak **E de yanlış**: elektronik oylama m.139'da **açık oylama** usulüdür, işaretle oylama değil. | E → *"Açık oylama, elektronik oylama mekanizmasının çalıştırılması suretiyle de yapılabilir."* ✅ |
| `5e1ada72` · İçtüzük m.16/17 | **Kök hatalı, iki doğru cevap doğuruyordu.** A-D m.16'daki Kâtip Üye görevleri, E ise m.17/4'teki İdare Amiri görevi. Ama İdare Amirleri de AY m.94 uyarınca Başkanlık Divanı üyesi. | Kök → *"…TBMM **Kâtip Üyelerinin** görevlerinden biri değildir?"* ✅ |
| `18e36e91` · 2820 m.14 | Açıklamadaki toplantı yeter sayısı oranı resmî metinden doğrulanamıyordu; ayrıca **işaretli E şıkkı m.14 son fıkrasının lafzıyla birebir doğru** çıktı (ikinci çağrıda yeter sayı aranmaz). | E → *"Karar yeter sayısı, büyük kongre üye tamsayısının salt çoğunluğudur."* (m.14: karar yeter sayısı **hazır bulunan** üyelerin salt çoğunluğu) ✅ |

**`eae955d1` — 6271 m.21 · Cumhurbaşkanının andiçmesi · GÜNCELLİĞİNİ YİTİRMİŞ**
- **Tespit:** Hem kök hem cevap güncel mevzuatta karşılıksız. m.21/1 (699 s. KHK ile değişik):
  *"…tutanak, TBMM Genel Kurulunda … verilir ve **aynı birleşimde** andiçme töreni yapılır."*
  Kökteki "izleyen gün andiçme" kalıbı m.21/3'teki **Cumhurbaşkanı yardımcıları ve Bakanlar**
  kuralıdır. Ayrıca ne 6271'de ne Anayasa'da andiçmemeye "makam boşalmış sayılır" sonucu bağlanmıştır.
- **Karar:** **Arşivlendi.** 2017/2018 öncesi kurguya dayanıyor.

**Kaynaklar:** 298 (`MevzuatTur=1&MevzuatTertip=4`), 2820, 2839, 6271, İçtüzük
(`MevzuatNo=584&MevzuatTur=17`) — hepsi `mevzuat.gov.tr` · Erişim: 28–29.08.2026

---

### 3.3 · Türk Ceza Kanunu — 17 soru

#### Cevap anahtarı / kök mevzuata aykırı olanlar

**`07e0cba0` — m.117 · İş ve çalışma hürriyetinin ihlali**
- **Tespit:** Açıklama hatayı **itiraf ediyordu**: *"Tehdit bu suçun unsuru olmakla birlikte **kaynak sorudaki kabul uyarınca** ayrıca tehdit suçu da değerlendirilir."* Yani hukuki gerekçeye değil kaynak kitabın kabulüne dayanıyordu.
- **Doğrusu:** m.117/1 tehdidi suçun hareket unsuru sayar; m.42 — *"Biri diğerinin unsurunu … oluşturması dolayısıyla tek fiil sayılan suça bileşik suç denir. Bu tür suçlarda içtima hükümleri uygulanmaz."*
- **Düzeltme:** Doğru şık **B (yalnız iş ve çalışma hürriyetinin ihlali)**. ✅ Uygulandı

**`f0c49ea6` — m.120 · Haksız arama**
- **Tespit:** Kök işaretli cevabı **iki ayrı nedenle** çürütüyordu: (1) "hakkında arama kararı **bulunan**" → arama hukuka uygun, m.120'nin unsuru gerçekleşmiyor; (2) "arama yapmadan **vazgeçerek**" → m.36 gönüllü vazgeçme, teşebbüsten sorumluluk doğmaz.
- **Düzeltme:** Kök → *"…arama kararı **bulunmayan** B'yi … üçüncü kişilerin araya girmesi üzerine aramayı tamamlayamamıştır."* ✅ Uygulandı

**`e9a2ab5e` — m.271 · Suç uydurma**
- **Tespit:** Anahtar III'ü doğru sayıyordu, oysa III de yanlıştı: *"…fail gösterilmelidir."* m.271 fail gösterilmesini aramaz.
- **Düzeltme:** III → *"İhbar yetkili makamlara yapılmalıdır; belirli bir failin gösterilmesi gerekmez."* ✅ Uygulandı

**`e67b225c` — m.170 · Genel güvenliğin tehlikeye sokulması**
- **Tespit:** Kök m.170/3'ü (somut tehlike) soruyor ama III. öncül *"Çığ düşmesine neden olma"* yazılmış; bu m.170/1-b'nin hareketi.
- **Düzeltme:** III → *"Çığ düşmesi **tehlikesine** neden olma"*. ✅ Uygulandı

#### Çift doğru / çift yanlış şık taşıyanlar

| Soru | Tespit | Düzeltme |
|---|---|---|
| `882dac45` · m.102 | A şıkkı ("taciz düzeyinde kalma") da nitelikli hâl değildi → çift doğru cevap. | A → *"Beden veya ruh bakımından kendisini savunamayacak durumda bulunan kişiye karşı işlenmesi"* (m.102/3-a) ✅ |
| `be3835dc` · m.250 | B ("kullanma zimmeti özel amaç gerektiren bir suçtur") m.247/3'ün "iade edilmek üzere" lafzı nedeniyle savunulabilir biçimde doğruydu. | B → *"Kullanma zimmeti, zimmet suçundan bağımsız ayrı bir suç tipidir."* (m.247/3 cezayı azaltan hâldir) ✅ |
| `dbc99c03` · m.309 | D ("failin **amaç** veya saiki önem taşımaz") yanlış: m.309/1 fiilin belirtilen amaca yönelmesini kurucu unsur sayar. | D → *"Failin **siyasi veya ideolojik saikinin türü** … önem taşımaz"* ✅ |
| `eb7725f4` · m.142 | Cevap doğru; B şıkkının lafzı belirsizdi ("temel şekildir"). | B → *"…hayvanın bulunduğu yere bakılmaksızın nitelikli hâl oluşturur"* (6545/62 md. ile ibare çıkarılmıştır) ✅ |

#### Anlatım / madde bağlantısı düzeltmeleri

| Soru | Tespit | Düzeltme |
|---|---|---|
| `5613acc6` · m.82 | Açıklama m.30/2'yi atlıyordu; kökteki "gizlice" konut nitelikli hâlini kurmuyordu. | Kök → "gece vakti gizlice"; açıklama m.30/2'ye dayandırıldı ✅ |
| `5f42d50d` · m.82 | I. öncül bozuk: *"Suçun hırsızlıkla karşı işlenmiş olması"* — anlamsız. | I → *"Suçun gece vakti işlenmiş olması"* (m.82'de yok, m.143 hırsızlıkta var) ✅ |
| `50845207` · m.43 | Kök "sahibi bulunmayan ambar" diyerek sahipsiz malı çağrıştırıyordu. | Kök → "sahibi **başında** bulunmayan" ✅ |
| `7b420296` · m.124 | Kökte yazım bozukluğu; ayrıca soru m.132'ye bağlanmıştı, doğru cevabın dayanağı m.124. | Kök düzeltildi, `articleNo` → 124 ✅ |
| `ef6d8af6` · m.220 | Soru m.109'a bağlanmıştı; m.109 yalnız bir örnek, cevabın dayanağı m.220. | `articleNo` → 220 ✅ |
| `733ebedd` | Zorlayıcı neden TCK'da düzenlenmemiş doktrinel kavram; m.35'e (teşebbüs) bağlanmıştı. | `articleNo` boşaltıldı ✅ |
| `6089f30c` · m.43 | Açıklama m.43/2'nin "tek **fiille**" lafzına dayanmıyordu. | Açıklama m.43/1-2-3 ayrımıyla yeniden yazıldı ✅ |

#### Alan dışı — arşivlenenler

`82fcaaa6` · `b7483619` · `16cd97f0` — **Geri verme (iade)** konusu 2016'dan beri bütünüyle
**6706 sayılı Kanun**'da düzenlenir; TCK m.18 bu Kanunla mülga edilmiştir. Sorular TCK
m.10/m.19'a bağlanmıştı, oysa bu maddelerin geri vermeyle ilgisi yok. **Arşivlendi.**

`0d3f8417` · `4b064309` — Aynı gerekçe (6706 s.K. m.17 ve m.18). **Arşivlendi.**

**Kaynak:** `mevzuat.gov.tr/mevzuat?MevzuatNo=5237&MevzuatTur=1&MevzuatTertip=5` · Erişim: 27–29.08.2026

---

### 3.4 · Ceza Muhakemesi Kanunu — 5 soru

**`06e88b87` — m.15/4 · Yabancı bayraklı gemide çevreyi kirletme**
- **Tespit:** **Kök, işaretli cevabı destekleyen olguyu içermiyordu.** m.15/4 iki seçimlik ölçüt verir: *"suçun işlendiği yere **en yakın** veya geminin Türkiye'de **ilk uğradığı** limanın bulunduğu yer mahkemesi"*. Kök yalnız uğrak sırasını veriyordu ("sırasıyla Zonguldak ve Samsun") → ilk uğranan liman Zonguldak; Samsun'un yetkisi olgulardan çıkarılamıyordu.
- **Düzeltme:** Köke eksik olgu eklendi: *"…Samsun açıklarına en yakın noktada çevreyi kasten kirletmiş…"* ✅ Uygulandı

`009518e7` · `01544550` · `01add870` · `032a5ac9` — Açıklama alanlarında **AÖF ders kitabı
kalıntısı** (`Unite: 3`, `Unite: 7`, `Unite: 9`, `Unite: 10`). Bu sorular inceleme başlamadan
önce (14.08.2026) zaten arşivlenmişti; aksiyon gerekmedi.

**Kaynak:** `mevzuat.gov.tr/mevzuat?MevzuatNo=5271&MevzuatTur=1&MevzuatTertip=5` · Erişim: 29.08.2026

---

### 3.5 · İdari Yargılama Usulü Kanunu — 2 soru

Her ikisinde de **cevap doğru, açıklama güncelliğini yitirmiş**:

**`3f21a759` — m.10 · Zımnî ret süresi**
- Cevap C (30 gün) güncel ✓ (8 no.lu dipnot: 7331 s.K. ile "Altmış" → "Otuz")
- Açıklama **2021 öncesi metni** aktarıyordu: *"altmış günlük süre"* ve *"bekleme süresi… **altı ayı** geçemez"*. Güncel metin: **otuz gün** ve **dört ay**.
- **Düzeltme:** Açıklama güncel m.10/2'ye göre yeniden yazıldı. ✅ Uygulandı

**`44a87844` — m.9 · Görevli olmayan yerlere başvurma**
- Cevap D (30 gün) doğru ✓
- Açıklama **mülga ibareyi** alıntılıyordu: *"adli **veya askeri** yargı yerlerine"*. "ve askeri" ibaresi 703 s. KHK m.185 ile 2018'de metinden çıkarılmıştır.
- **Düzeltme:** Alıntıdan ibare çıkarıldı. ✅ Uygulandı

**Kaynak:** `mevzuat.gov.tr/mevzuat?MevzuatNo=2577&MevzuatTur=1&MevzuatTertip=5` · Erişim: 29.08.2026

---

### 3.6 · Anayasa tarihi — 2 soru

**`a2f816e7` — 1982 dönemi anayasa değişikliği halkoylamaları**
- **Mevcut cevap:** A (4)
- **Tespit:** Açıklama *"1988 halkoylaması anayasa değişikliğiyle ilgili değildir"* diyordu; bu **maddi olarak yanlış**. 25 Eylül 1988 halkoylaması, **3467 sayılı Kanunla Anayasa m.127'de** yapılan değişikliğin halkoyuna sunulmasıdır ve Cumhuriyet tarihinde **"hayır" çıkan tek** halkoylamasıdır (%65).
- **Doğrusu:** **Beş** halkoylaması — 1987 (3361), 1988 (3467), 2007 (5678), 2010 (5982), 2017 (6771).
- **Düzeltme:** Doğru şık **B (5)**; açıklama yıl ve kanun numarasıyla yeniden yazıldı. ✅ Uygulandı

**`95db8eda` — 1876 Kânûn-ı Esâsî**
- **Tespit:** **İki doğru cevap.** İşaretli E doğru biçimde yanlış (Heyet-i Âyan padişahça, kayd-ı hayat şartıyla atanır — m.60, m.62). Ancak **C de KE'de yer almıyor**: m.46 yemini *"meclisin yevmi küşadında **sadrıazam** huzurunda"* yaptırır, padişah huzurunda değil.
- **Düzeltme:** C → *"Meclis-i Umumi üyelerinin sadrazamın huzurunda yemin etmesi"*. ✅ Uygulandı

**Kaynak:** `anayasa.gov.tr` önceki anayasalar · `tr.wikisource.org/wiki/Kânûn-ı_Esâsî` · Erişim: 28.08.2026

---

## 4. Uygulanan işlemler

| İşlem | Adet |
|---|---:|
| İçerik düzeltmesi (cevap / şık / kök / açıklama) | **35** |
| Arşivleme (soft delete) | **9** |
| Madde bağlantısı (`articleNo`) düzeltmesi | 3 |
| Kaynak etiketi kaldırma (yayınevi adı) | 601 |
| Konu taşıma (İdare Hukuku → 657/5393/5302/5442) | 35 |

Tüm düzeltmeler `in_review` sürümler üzerinde yapıldı; **`b636d03a` istisnadır** — o soru
yayındaydı ve düzeltme yayındaki sürüme uygulandı. Kök veya şık metni değişen sorularda
`contentHash` yeniden hesaplandı. Arşivlemeler **soft delete**'tir (`question.deletedAt` +
`version.status = archived`), geri alınabilir.

**İlgili script'ler:**
`scripts/duzeltme-uygula.ts` (26 düzeltme + 8 arşivleme) ·
`scripts/duzeltme-uygula-gece.ts` (9 düzeltme) ·
`scripts/ab6acf72-sil.ts` (1 arşivleme)

---

## 5. Mükerrer durumu

Canlı kuyruktaki **758 sorunun tamamı `contentHash` üzerinden tarandı: birebir mükerrer soru
kalmamıştır.**

Ölçüt: `contentHash = sha256(normalize(kök) + sıralı şık metinleri)`. Doğru cevap harfi hash'e
dâhil değildir ve şık sırası normalize edilir — yani A/B kitapçığı gibi şıkları karıştırılmış
aynı soru da yakalanır. Böyle bir çift yoktur.

Defterdeki 291 mükerrer kaydının **289'u bu inceleme başlamadan önce (14.08.2026)**
arşivlenmiştir. Kalan ikisi (`f3169da2`, `3f43eb9b`) teknik mükerrer **değildir** — kökleri ve
şıkları farklıdır, yalnızca aynı hukuki noktayı ölçen benzer senaryolardır.

---

## 6. Yığılma uyarıları (içerik hatası değil)

Aynı maddeyi veya aynı hukuki noktayı ölçen soru kümeleri. Silinmeleri gerekmez; ölçme
çeşitliliği açısından seyreltilebilir.

| Küme | Adet |
|---|---:|
| TCK m.141 (zilyetlik) | 6 |
| Anayasa m.159 (HSK) | 7 |
| TCK m.84/4 | 5 |
| TCK m.104/2 · m.133 | 3 + 3 |
| TCK m.90 · m.130 · m.103 | 2 + 2 + 2 |
| Zimmet + kumar senaryosu (`814fdd27` ~ `bd958151`) | 2 |
| İçtüzük m.5 tatil (`1b35df63` ~ `3f43eb9b`) | 2 |
| Rüşvet — uygun işin yapılması (`aeed2685` ~ `c073e745`) | 2 |

---

## 7. Kapsam sınırları — dikkat edilmesi gerekenler

**1 · Yayındaki 3907 soru bu incelemenin kapsamında değildi.**
İnceleme yalnız onay kuyruğunu (`in_review`) kapsadı. `b636d03a` örneği bunun neden önemli
olduğunu gösteriyor: **doğru cevabı hiç bulunmayan bir soru yayındaydı** ve ancak kuyruk
denetimi sırasında yakalandı. 7573/2026 (657) gibi güncellik değişikliklerinin yayındaki
soruları da etkilemiş olması kuvvetle muhtemeldir. **Yayın havuzu için ayrı bir denetim turu
önerilir.**

**2 · Sistemde bulunmayan mevzuata dayanan sorular.**
Şu kanunlar veritabanında yok ve bu sorular resmî kaynaktan tek tek doğrulandı: 6306, 6328,
4734, 5216, 2942, 2972, 2802, 5018, 5355, 442, 6360. Bunların içe aktarılması, gelecekteki
denetimleri sistem içinde yapılabilir kılar.

**3 · Sayıya bağlı sorular.**
`a20d0c53` (51 il özel idaresi) cevabı mevzuat lafzından değil, 6360'ın kuralının güncel
büyükşehir sayısına (30) uygulanmasından çıkıyor. **Büyükşehir sayısı değişirse soru
güncelliğini yitirir.**

**4 · Doktrin soruları.**
İdare Hukuku'ndaki 52 sorunun bir kısmı ders kitabı tasnifine dayanıyor ve mevzuat metniyle
doğrulanamaz. Bunlar kayıtlarda açıkça "doktrin sorusu" olarak işaretlendi.

---

## 8. Açık kalan tek karar

Yok. Tartışmalı/manuel inceleme kuyruğu kapatıldı:

- 8 soru zaten arşivlenmişti
- 2 soru düzeltilerek kapatıldı (`882dac45`, `6089f30c`)
- 1 soru kullanıcı kararıyla arşivlendi (`ab6acf72` — TCK m.244/4'ün tâli kaydı ile TCK
  m.163/1 karşılıksız yararlanma arasındaki ayrım Yargıtay içtihadına bağlıydı)
- 1 küme notu eskimişti (mevzuat sonradan içe aktarılıp 64 sorunun tamamı doğrulandı)

---

## 9. İzlenebilirlik

Her kararın tam gerekçesi, madde dayanağı, resmî metin alıntısı ve erişim tarihi
`ilerleme.jsonl` dosyasındadır — 1109 satır, her satır bir karar. Bir soruyu panelde açmak
için gereken `question.id` `KUSURLU-LISTE-*.md` dosyalarındadır.

Panelin arama kutusuna kimlik desteği eklendi
([`admin-questions.service.ts`](../../apps/api/src/modules/admin/questions/admin-questions.service.ts)):
artık hem `question.id` hem `questionVersion.id` ön ekiyle arama yapılabiliyor.
