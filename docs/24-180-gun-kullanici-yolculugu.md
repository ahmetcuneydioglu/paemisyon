# Doc 24 — 180 Günlük Kullanıcı Yolculuğu ve Ürün Davranış Tasarımı

> Statü: TASLAK — onay bekliyor
> Girdi: Doc 19 (koç motoru), Doc 21 (içerik mimarisi), Doc 23 (web vizyonu, Konsept C)
> Kural: Bu doküman ekran tasarlamaz. Kullanıcıyı tasarlar; ekranlar bundan türeyecek.

---

## 0. Önce kullanıcıyı tanıyalım (persona — varsayım değil, meslek gerçeği)

PAEM ve Misyon adayı bir **üniversite öğrencisi değildir**. Bu, tüm tasarımı değiştiren
tek gerçektir:

- **Çalışan bir polis memurudur.** Vardiyalıdır: gece nöbeti, ek görev, tayin stresi.
  "Her gün 4 saat çalışırım" diyemez; **parçalı zamanı** vardır — nöbet arası 20 dakika,
  servis yolunda 15 dakika, izin gününde 2 saat.
- **Yetişkin ve hedef odaklıdır.** Rütbe, maaş, statü ve görev yeri değişikliği için
  yarışır. Motivasyonu "eğlence" değil **ilerleme kanıtı**dır.
- **Yalnız çalışır.** Dershane pahalı ve vardiyayla uyumsuz. Meslektaşları hem rakip
  hem yoldaştır — "kim çalışıyor, ne çözüyor" merakı gerçektir.
- **Kaybetme maliyeti yüksektir.** Sınav yılda bir; kaçırmak 1 yıl demek. Bu hem en
  güçlü motivasyon hem en büyük kaygı kaynağıdır.
- **Telefonu her yerde, bilgisayarı evde.** Mobil = antrenman; web = masa başı derin
  çalışma. (Bkz. §10.)

**Duygusal eğri:** Umut (kayıt) → hevesli koşu (hafta 1–4) → platoya çarpma ve şüphe
(ay 2–3) → dip (gün ~90) → panik ve sprint (son 30 gün) → sınav → boşluk.
Ürünün işi bu eğrinin **dibini sığlaştırmak, tepelerini kalıcılaştırmak**tır.

> **Düzeltme (beni durdur dedin):** "180 gün" mutlak bir takvim olamaz — kullanıcılar
> sınava 300 gün kala da 45 gün kala da gelir. Yolculuğu **mutlak günle değil, iki
> eksenle** tasarlıyorum: (a) üyelik yaşı (alışkanlık ekseni), (b) **sınava kalan gün**
> (mod ekseni). Koç her kararında ikisini birden okur. 180 gün senaryosu bu modelin
> örnek bir kesitidir.

---

## 1. 180 günlük yolculuk (örnek kesit)

### Gün 0 — İlk temas: "Bu iş ciddiye binmiş"

**Nereden geliyor?** Üç kapı: (1) Google — "PAEM çıkmış sorular", "2559 PVSK soruları"
→ kanun sayfalarımız; (2) meslektaş tavsiyesi → doğrudan App Store; (3) günün sorusu
linkinin WhatsApp grubunda paylaşılması.

**İlk 5 dakika (kayıttan önce değer):**
1. Ana sayfada **günün sorusunu çözer** — gerçek, kaynaklı bir çıkmış soru. Cevap +
   açıklama anında. *"Bunlar gerçek sorular"* güveni ilk 60 saniyede kurulur.
2. Kayıt tek nedenle istenir: *"Serini başlat, ilerlemen kaydedilsin."*
3. Kayıt sonrası 3 soruluk kurulum: **Hangi sınav?** (PAEM/Misyon) → **Sınav tarihi**
   (biliyorsa; bilmiyorsa tahmini dönem) → **Günde kaç dakika ayırabilirsin?**
   (15/30/60+ → günlük soru hedefine çevrilir). Başka hiçbir şey sorulmaz.
4. **Seviye tespit seansı — 10 soru.** Adı "test" değil "İlk Devriye". Bitince ilk
   rozet + ilk veri: *"Mevzuatta güçlüsün, Ceza Muhakemesi'nde açığın var. Yarın
   oradan başlıyoruz."*

**İlk başarı hissi:** rozet değil, **teşhis**. Yetişkin kullanıcıya "aferin" değil
"seni gördüm, planın hazır" iyi gelir. Rozet bunun üstüne vitrin süsüdür.

### Gün 1–7 — Alışkanlık tohumları

**Neden geri gelir?** İlk hafta tek hedef: **dönüş döngüsünü kurmak**. İçerik değil
ritüel satıyoruz.

- Günlük hedef bilinçli olarak **küçük** (kurulumdaki dakikaya göre 10–20 soru).
  İlk hafta hedefi büyütmek churn üretir; küçük hedef "tamamladım" hissi üretir.
- **Bildirim ritmi:** günde en fazla 1, kullanıcının ilk 3 gün giriş yaptığı saate
  sabitlenir (davranıştan öğrenilen saat — vardiyaya kendiliğinden uyar).
  İçerik: günün sorusu veya "serin 19.00'da bozuluyor" — asla jenerik "bizi özledin mi?".
- 3. gün: **seri bilinci** doğar — koç kartı: "3 gün üst üste geldin. En uzun serin
  bu." 7. gün: ilk haftalık rapor: *"Bu hafta 94 soru, %61 doğruluk. Geçen haftan
  yoktu — artık kıyaslayacağın bir 'sen' var."*
- İlk **yanlış tekrarı** bu hafta tanıtılır: "Salı günkü 5 yanlışından mini tekrar
  hazırladım (3 dk)." Kullanıcı, sistemin yanlışlarını **unutmadığını** ilk kez görür.
  Bu, ürünün hafızası olduğunun kanıtıdır ve silme kararının en büyük panzehiridir.

### Gün 8–30 — Alışkanlıktan kimliğe

Kullanıcı artık "uygulamaya giren biri" değil, **"sınava hazırlanan biri"** olmalı.

- **Haftalık mastery fotoğrafı** (mevcut altyapı) görünür değere dönüşür: konu bazlı
  ilerleme haritası. "Anayasa %12 ↑, CMK %4 ↓" kartları haftalık ritüeldir.
- ~300 çözülmüş sorudan sonra **zayıflık haritası** anlamlı hale gelir; koç artık
  genel değil isimli konuşur: "2911 Toplantı-Gösteri'de 3 haftadır %40'ın altındasın."
- **Rütbe sistemi** (bkz. §5) ilk terfisini bu dönemde verir — ilerlemenin meslek
  diliyle tescili.
- Ay sonunda ilk **canlı deneme** deneyimi: Türkiye geneli eşzamanlı, sıralamalı.
  Sıralama ilk kez "rakiplerim ne durumda" sorusunu cevaplar — yalnız çalışan
  kullanıcı için en güçlü gerçeklik testi.

### Gün 60–90 — Plato ve dip

**Ne olur?** Doğruluk oranı yataylaşır, aynı konular döner, iş yorgunluğu birikir.
Belirti zinciri ölçülebilir: seans süresi kısalır → gün aşırı girişe düşer → seri
kopar → 5+ gün sessizlik.

**Sistem nasıl anlar?** Koç motoruna **eğilim sinyalleri** eklenir (kural, AI değil):
- 7 günlük hareketli ortalama: seans sayısı ve soru adedi düşüşü
- Seri kopması + dönüşsüz 72 saat
- Doğruluk platosu (4 hafta ±%2 bant)
- Deneme sonucu şoku (beklentinin belirgin altında bir canlı deneme)

**Nasıl geri getirir?** (bkz. §7 — mekanizma kataloğu). Özet ilke: **suçluluk değil,
düşük eşikli dönüş.** "Neredesin!" değil; "5 soruluk bir dönüş seansı hazırladım,
3 dakika. Serin değil emeğin önemli: 2.847 sorun ve haritan seni bekliyor."

### Gün 150–180 — Sınav modu

Sınava ≤30 gün kala **ürün modu değiştirir** — kullanıcı ayar yapmaz, koç geçirir:

- **Karışım tersine döner:** yeni konu öğretimi durur; ağırlık %60 deneme +
  %30 yanlış/akıllı tekrar + %10 zayıf konu kapatma.
- **Sınav provaları:** gerçek sınav gün ve saatinde tam süreli simülasyon
  ("Pazar 10.00 — gerçek prova"). Süre yönetimi geri bildirimi: hangi bölümde
  yavaşsın, hangi soru tipinde takılıyorsun.
- **Taper (son 3 gün):** yoğunluk bilinçli düşürülür — sadece güçlü konulardan
  kısa, moral veren seanslar + en kritik yanlışların son turu. Son gece koç tek
  kart gösterir: "Hazırsın. 11.400 soru çözdün. Yarın sabah görüşürüz."
- **Sınav sabahı:** tek bildirim, soru yok: "Kolay gelsin Komiserim." (Ürün sussa
  da varlığını hissettirir.)

### Sınav sonrası — Bırakmıyoruz, devrediyoruz

- **Sonuç bekleme modu (1–4 hafta):** günlük hedef kapanır, baskı sıfır. Hafif
  içerik: günün sorusu, mesleki mevzuat güncellemeleri. "Cevap anahtarına göre
  tahmini netini gir, birlikte bakalım" — kullanıcı bu dönemde EN çok konuşacak
  birini arar; forum/yorum ihtiyacının zirvesidir.
- **Kazandıysa:** tebrik ritüeli + **Alumni rozeti**. İki yönlendirme: (1) sıradaki
  hedef (Misyon, sonraki dönem PAEM, kurum içi diğer sınavlar), (2) **tavsiye
  döngüsü**: "Senin gibi hazırlanan arkadaşına davet gönder" — kazanan kullanıcı,
  en inandırıcı pazarlama kanalıdır; hikayesi (izinle) vitrine girer.
- **Kazanamadıysa (kritik ve çoğunluk):** asla "tekrar dene" klişesi değil. Empatik
  devir: "Emeğin sıfırlanmadı — 11.400 sorun, yanlış haritan ve güçlü konuların
  gelecek döneme aktarıldı. İstediğinde kaldığımız yerden." 2 hafta tam sessizlik,
  sonra yumuşak yeniden başlama teklifi. **Gelecek yılın çekirdek kullanıcısı,
  bu yılın kaybedenidir** — bu geçiş ürünün en değerli retention yatırımıdır.

---

## 2. Motivasyon haritası

Faza göre baskın motivasyon değişir; koçun ton ve kart seçimi buna uyar:

| Faz | Baskın motivasyon | Ürünün kaldıracı | Ton |
|---|---|---|---|
| Gün 0–7 | Merak + umut | Anında değer, teşhis, küçük zafer | Karşılayıcı |
| Gün 8–30 | Yetkinlik hissi | Görünür ilerleme, ilk terfi, haftalık rapor | Antrenör |
| Gün 30–90 | Kimlik + kıyas | Mastery haritası, canlı deneme sıralaması | Dürüst ayna |
| Gün 90 dip | (kayıp) | Emek hatırlatma, düşük eşik, yeniden çerçeve | Yoldaş |
| Son 30 gün | Aciliyet + kaygı | Prova, süre yönetimi, güven inşası | Sakin komutan |
| Sınav sonrası | Aidiyet | Topluluk, sıradaki hedef, devir | İnsan |

İki evrensel ilke:
1. **Kayıptan kaçınma > kazanç:** "Serin bozulacak" > "seri kazan". Ama dozunda —
   sürekli kayıp diliyle konuşan ürün kaygı üretir ve silinir. Kural: kayıp dili
   yalnız seri ve süre için; ilerleme dili her yerde.
2. **İlerleme kanıtı bileşik faizdir:** her hafta kullanıcıya "geçen haftaki senden
   iyisin" diyecek EN AZ bir gerçek veri bulunmalı. Bulunamıyorsa (plato) çerçeve
   değiştirilir: doğruluk değil hacim, hacim değil süreklilik, süreklilik değil
   kapsam ("3 yeni konuya girdin").

---

## 3. Her aşamada sistem davranışı (koç durum makinesi)

Ana ekran = koç. Koç bir **durum makinesi**dir; her girişte kullanıcıyı bir duruma
oturtur ve o durumun kartlarını üretir. (Mevcut 13 kural bu makinenin çekirdeği;
eksik durumlar eklenecek.)

| Durum | Tetik | Hero kart | Destek kartları |
|---|---|---|---|
| `onboarding` | <3 seans | İlk Devriye / kurulum eksiği | Günün sorusu |
| `normal` | aktif, hedef sürüyor | "Bugün çalış" (kalan X soru) | Yanlış tekrarı, zayıf konu, rozet ilerleme |
| `streak_risk` | bugün 0 soru + akşam | "Serin 3 saat içinde bozuluyor — 5 soru yeter" | Mini seans |
| `exam_day` | canlı deneme günü | Geri sayım + katıl | Hafif ısınma seansı |
| `post_exam` | deneme sonucu açıklandı | Sonuç + analiz | Yanlışlardan tekrar seansı |
| `slump_watch` | eğilim sinyalleri (bkz. §1/90. gün) | Düşürülmüş hedef + kolay dönüş | Emek özeti |
| `comeback` | 5+ gün sonra dönüş | "Hoş geldin — 3 dk'lık dönüş seansı" | Neler değişti özeti |
| `exam_mode` | sınava ≤30 gün | Prova / deneme odaklı plan | Süre analizi, son yanlışlar |
| `taper` | sınava ≤3 gün | Güven kartı | Kısa moral seansları |
| `aftermath` | sınav geçti | Sonuç bekleme / devir | Alumni veya yeniden başlama |

Kural önceliği çatışırsa: güvenlik > aciliyet > alışkanlık > büyüme
(örn. `exam_day` her şeyi ezer; `streak_risk` `normal`i ezer).

---

## 4. AI nerede devreye girer (ve nerede GİRMEZ)

İlke: **Deterministik kural yetiyorsa AI kullanma.** AI, kuralın üretemeyeceği iki
şeyde devreye girer: *dil* ve *açıklama*.

**Faz 1 (şimdi — kural motoru, AI yok):** durum makinesi, karışım algoritması,
eğilim sinyalleri, spaced repetition. Bunların hiçbiri LLM istemez; hepsi ucuz,
öngörülebilir, test edilebilir.

**Faz 2 (ilk LLM değeri — tek tek, ölçerek):**
1. **Yanlış açıklaması:** "Neden B değil D?" — sorunun kaynağı, ilgili kanun maddesi
   ve çeldiricinin neden çekici olduğu. En yüksek algılanan değer / en düşük risk.
   (Önbelleklenir: aynı soru+şık için bir kez üretilir, herkese servis edilir —
   maliyet soru başına tek seferdir.)
2. **Madde sadeleştirme:** kanun maddesini "polis diliyle" + saha senaryosuyla anlat
   (bkz. §9 Madde Atlası). O da önbelleklenir.
3. **Haftalık koç raporu (doğal dil):** rakamları insan diline çeviren tek paragraf.
   Girdi zaten elimizde (mastery fotoğrafı); LLM sadece yazıya döker.

**Faz 3 (veri olgunlaşınca):** AI çalışma planı (haftalık, vardiyaya duyarlı),
soru-tipi bazlı zaaf analizi ("olay örgüsü sorularında takılıyorsun").

**Bilinçli olarak YAPILMAYACAKLAR:**
- **Başarı tahmini / "kazanma ihtimalin %X"** — veri tabanı istatistiksel olarak
  yeterli olana kadar YOK (önceki kararımız: güven intiharı). Yanlış bir tahmin,
  tek kullanıcının hayat kararını etkiler.
- **AI soru üretimi** — bankamızın tek varlık nedeni "gerçek, kaynaklı çıkmış soru"
  güveni. AI sorusu bu güveni sulandırır. AI en fazla *çeldirici açıklar*, soru yazmaz.

---

## 5. Gamification: rütbe metaforu

Bu kitleye şeker-pembe rozet olmaz; **meslek dili** olur. Kullanıcının gerçek hedefi
zaten bir terfi sınavı — oyunlaştırma bunu aynalamalı:

- **Rütbe sistemi:** ilerleme puanı (çözülen soru, süreklilik, mastery artışı)
  kullanıcıyı sembolik rütbelerde yükseltir. İsimlendirme gerçek rütbe silsilesini
  *çağrıştırır ama birebir kopyalamaz* (kurumsal hassasiyet): "Aday → Devriye →
  Kıdemli → Ekip Amiri → ..." son rütbe hedef sınavın kapısı. Profilde ve lider
  tablosunda görünür.
- **Seri (mevcut):** + haftada 1 **seri sigortası** (kaçırılan 1 günü affeder;
  premium'da 3). Seri sigortasız seri sistemi, vardiyalı çalışan için cezalandırıcıdır
  — bir gece nöbeti tüm seriyi yakmamalı.
- **Rozetler (mevcut katalog):** anlamlı anlara bağlı kalır (ilk deneme, 1.000 soru,
  dip dönüşü "Geri Döndü" rozeti, alumni). Enflasyon yasak: yılda ~20 rozet tavanı.
- **Canlı deneme sıralaması (mevcut):** haftanın sosyal zirvesi.
- **ERTELENEN sosyal özellikler:** lig, duello, arkadaş listesi — DAU bunları boş
  odaya çevirmeyecek seviyeye gelene kadar YOK. Boş lig, ölü ürün algısı yaratır.
  (Eşik önerisi: günlük aktif ≥500 olduğunda duello prototipi.)

Gamification'ın amacı puan değil: **her mekanik bir davranışa bağlanır** —
seri→süreklilik, rütbe→hacim+derinlik, rozet→dönüm noktası, sıralama→gerçeklik testi.
Davranışa bağlanamayan mekanik eklenmez.

---

## 6. Bırakma noktaları (churn haritası)

| # | Nokta | Neden | Sinyal |
|---|---|---|---|
| 1 | Gün 0–1 | Değeri görmeden kayıt duvarı / sıkıcı onboarding | Kayıt var, 2. seans yok |
| 2 | Gün 3–7 | Yenilik bitti, ritüel kurulmadı | Seri hiç 3'ü geçmedi |
| 3 | İlk seri kopması | "Bozuldu, anlamı kalmadı" (hep-ya-hiç psikolojisi) | Kopma + 72 saat sessizlik |
| 4 | Gün 30–60 | Ücretsiz limit duvarına öfke (yanlış anda) | Limit gününde son seans |
| 5 | Gün 60–90 | Plato: "gelişmiyorum" | Doğruluk bandı yatay + hacim düşüşü |
| 6 | Kötü deneme sonucu | Beklenti şoku, "ben yapamıyorum" | Deneme sonrası 0 aktivite |
| 7 | Dış şok | Sınav ertelendi / tayin / kişisel | Ani, sinyalsiz kopuş |
| 8 | Sınav sonrası | Doğal bitiş | — (tasarımla devir, §1) |

---

## 7. Geri getirme mekanizmaları

Eşleşme: her churn noktasına en az bir mekanizma.

1. **Kolay dönüş seansı** (#2,3,5): tek dokunuş, 5 soru, 3 dakika, zayıf değil
   *güçlü* konudan (dönüşte özgüven, teşhis değil). Dönüş bildiriminin tek CTA'sı bu.
2. **Seri sigortası + seri yeniden çerçeveleme** (#3): kopan seride "sıfırdan" değil
   "toplam aktif günün: 47" vurgusu. Seri tek metrik olmaktan çıkarılır.
3. **Emek hatırlatma** (#3,5,7): "2.847 soruluk haritan duruyor." Kayıp verinin
   değil birikmiş varlığın dili. (Sunk cost'u etik kullanmak: suçlamadan hatırlatma.)
4. **Hedef küçültme** (#5): `slump_watch` durumunda koç hedefi kendiliğinden düşürür
   ve BUNU SÖYLER: "Bu hafta yoğunsun galiba — hedefi 10 soruya çektim, sen iste
   yine artıralım." Ürünün esnediğini görmek, silme kararını erteletir.
5. **Deneme sonrası tampon** (#6): kötü sonuçta ilk kart asla sıralama değil;
   "en çok kaybettiren 3 konu + her biri için 10 soruluk kapatma planı". Kontrol
   edilebilirlik duygusu geri verilir.
6. **Bildirim disiplini** (tümü): günde ≤1, kullanıcının kendi saati, 7 gün
   cevapsızsa frekans otomatik düşer (haftada 2'ye), 30 gün sonra sadece haftalık
   e-posta raporu. Susmayı bilen ürün, geri dönülen üründür.
7. **Haftalık e-posta raporu** (#5,7): push'tan bağımsız kanal; uygulama silinse
   bile köprü kalır. İçerik: kişisel mastery değişimi + haftanın çıkmış sorusu.
8. **"Geri Döndü" rozeti** (#3,5): dönüşün kendisi ödüllendirilir — utanç değil.

---

## 8. Ana ekranın günlük değişimi (koç senaryoları)

§3'teki durum makinesi + o günün verisi = her sabah farklı ekran. Örnek bir hafta:

- **Pzt:** "Günaydın. Hedefin 20 soru. Dünkü 4 yanlışından 5 dakikalık tekrar
  hazır." → [Bugün çalış] [Tekrarı çöz]
- **Sal:** "2911'de 3 haftadır %40'tasın. Bugünkü seansın ağırlığı orada — hazır mısın?"
- **Çar (akşam, 0 soru):** "Serin 3 saat sonra bozuluyor. 5 soru yeter, 3 dakika."
- **Per:** "🏆 Pazar canlı deneme var. Kayıt oldun mu? Bu hafta 2 konu tekrarıyla
  gidersen sıralaman geçen ayı geçer."
- **Cum:** "Haftalık fotoğrafın çıktı: Anayasa %12 ↑. CMK %4 ↓ — hafta sonu için
  CMK planı hazırladım."
- **Pzr:** "Deneme günü. 10.00'da başlıyor. Sabah ağır konu yok — 10 soruluk ısınma?"
- **(10 gün sonra dönen kullanıcı):** "Hoş geldin. Ortalık sakin — 3 dakikalık bir
  dönüş seansı hazırladım, güçlü konundan. Haritan seni bekliyor."

Teknik ilke (mevcut mimariyle uyumlu): kartlar **sunucuda** üretilir (`/me/coach`);
istemci hiçbir kural bilmez. Web ve mobil aynı beyni gösterir.

---

## 9. Çalışma akışı: "Bugün çalış" — evet, ama hibrit

Soru: Kategori→Ders→Soru mu, tek tuş "Bugün çalış" mı?

**"Bugün çalış" lehine (güçlü):**
- **Karar yorgunluğunu siler.** Nöbet çıkışı yorgun kullanıcının 4 ekranlık seçim
  yapması churn'dür; tek tuş ritüeldir. Alışkanlık = düşük eşik.
- **Sistem daha iyi seçer.** Spaced repetition, zayıflık haritası, müfredat ağırlığı
  ve sınav takvimini aynı anda gözeten karışımı insan elle kuramaz.
- **Veri çarkı döner:** koç seçtikçe zaafları daha iyi öğrenir → seçimi iyileşir.
- **Premium'un bel kemiği:** "senin için seçiyorum" değer önerisinin ta kendisi.

**Aleyhine (gerçek riskler):**
- **Kontrol kaybı hissi.** Yetişkin öğrenen planına güvenir; "yarın amirim Anayasa
  soracak, BUGÜN Anayasa çalışmam lazım" diyen kullanıcıya "hayır, CMK" diyemezsin.
- **İlk günlerde güven açığı:** sistem seni tanımadan "bana bırak" derse inandırıcı
  değil (soğuk başlangıç).
- **Şeffaflık borcu:** kara kutu seçim, kötü bir seanstan sonra "saçma sorular
  getiriyor" algısına döner.

**Karar (öneriyorum): tek tuş BİRİNCİL, seçim İKİNCİL — ikisi de kalır.**
1. Ana ekranın hero aksiyonu **[Bugün çalış]**: koç karışımı ≈ %40 zayıf konu +
   %25 yeni ilerleme + %25 akıllı tekrar/yanlış + %10 müfredat ağırlığı (sınav
   moduna girince §1'deki gibi tersine döner).
2. Seans başında **tek satır şeffaflık**: "Bugün: CMK ağırlıklı — çünkü 3 haftadır
   düşüştesin + Salı'nın 4 yanlışı." Kara kutu olmaz.
3. **"Kendim seçeyim"** ikincil yol olarak yaşar (mevcut katalog akışı) — kaldırmak
   değil, geriye itmek. Kullanım oranını ölçeriz; %10'un altına düşerse daha da
   sadeleştiririz.
4. Soğuk başlangıç çözümü: ilk 3 gün koç karışımı seviye tespit + müfredat
   ağırlığıyla çalışır ve bunu söyler ("seni tanıdıkça isabetim artacak").

Beni ikna etmeye çalış demiştin — asıl seni bir adım öteye davet ediyorum:
**"Bugün çalış" düğmesi aslında ürünün kendisidir.** Soru bankası olan onlarca
uygulama var; "senin yerine düşünen antrenör" olan yok. Konumlandırmayı buna
yaslayalım.

---

## 10. Web + mobil: aynı beyin, iki farklı oda

Tek cümlelik iş bölümü: **Mobil = antrenman salonu. Web = çalışma odası.**
İkisi aynı koçu (`/me/coach`), aynı ilerlemeyi, aynı seriyi gösterir; kopya değil
tamamlayıcıdır.

| İhtiyaç | Mobil | Web |
|---|---|---|
| Günlük seans, seri, bildirim | ✅ birincil | var |
| Uzun deneme çözümü | mümkün | ✅ birincil (büyük ekran, süre paneli) |
| Kanun okuma + madde çalışması | özet | ✅ birincil (okuma deneyimi) |
| Derin analiz / raporlar | özet kart | ✅ birincil (haritalar, grafikler) |
| SEO / keşif / kayıt | — | ✅ tek kapı |

**El sıkışma anları:** koç kartı yönlendirir — mobilde "CMK'da düşüş var" kartının
altında "Web'de CMK öğrenme merkezinde derin çalış"; web'de deneme bitince "yarınki
tekrarını telefonuna kurdum". Kullanıcı cihaz değiştirdiğini değil, oda değiştirdiğini
hisseder.

**Ders sayfası = öğrenme merkezi (web):** her ders/kanun sayfası tek yaşayan mekân:
konu görünümü + (giriş yaptıysa) kendi başarı durumu, yanlışları, tekrar önerisi,
mini quiz, çıkmış sorular, AI açıklamaları. Girişsiz ziyaretçiye aynı sayfa SEO
vitrinidir (bugünkü kanun sayfaları bunun v1'i) — giriş yapınca kişiselleşir.
**Aynı URL, iki derinlik.** Ayrı "SEO sayfası" ve "uygulama sayfası" tutmayacağız.

### Mevzuat için özel fikir: **Madde Atlası**

En güçlü alanımız; zincir şöyle derinleşir:

1. **Madde etiketleme:** her soruya `kanun + madde no` etiketi. Soru kökleri zaten
   "PVSK m.16..." kalıbında — mevcut keyword altyapısının doğal uzantısı; admin
   import akışına "madde tespiti" eklenir (regex + öneri, elle onay).
2. **Isı haritası:** her kanun sayfasında "en çok soru çıkan maddeler" sıralaması.
   *"PVSK'nın 74 maddesi var ama soruların yarısı 5 maddeden çıkıyor"* — adayın
   sezgisel bildiği ama hiçbir yerde göremediği bilgi. Türkiye'de eşi yok.
3. **Madde çalışma döngüsü:** maddeyi oku (resmî metin — kanun metinleri kamu malı,
   telif engeli yok) → AI sadeleştirmesi ("polis diliyle" + saha senaryosu, tek
   sefer üretilir, önbellek) → o maddeden çıkmış soruları çöz → yanlışta ilgili
   maddeye geri dön. **Soru↔madde çift yönlü bağ**, ezber yerine kavrayış üretir.
4. **Madde bazlı tekrar:** akıllı tekrar motoru konu değil madde hassasiyetinde
   çalışabilir: "6136 m.13'ü 3 kez yanlış yaptın — madde + 4 soru, 5 dakika."

Bu, "soru bankası"nı "mevzuat öğrenme makinesi"ne çevirir ve içerik yazarlığı
gerektirmez: metin resmî kaynaktan, açıklama AI'dan (onaylı), sorular bankadan.

---

## 11. Premium: kişisel gelişim asistanı

İlke: **ücretsiz katman gerçek antrenman verir, premium antrenörün beynini açar.**
Ücretsizi işe yaramaz yapan modeller güven ve SEO'yu öldürür; bizim ücretsiz
katmanımız tavsiye edilebilir kalmalı.

| | Ücretsiz | Premium |
|---|---|---|
| Günlük soru | 15 | Sınırsız |
| Koç | Temel kartlar (seri, hedef, deneme) | Tam koç: zayıf konu planı, madde bazlı tekrar |
| Yanlış tekrarı | Son 7 günün yanlışları | Tam spaced-repetition motoru (süresiz hafıza) |
| AI açıklaması | Günde 3 | Sınırsız + madde sadeleştirme |
| Haftalık rapor | Özet kart | Doğal dilli koç raporu + gelişim arşivi |
| Deneme | Canlı denemeler | + Geçmiş deneme arşivi + sınırsız prova |
| Seri sigortası | Haftada 1 | Haftada 3 (vardiya dostu) |
| Rütbe/rozet | ✅ herkese | ✅ herkese (satılmaz — güven) |

**Premium'a geçiş anları (satış değil, ihtiyaç anı):**
1. Akış halindeyken limite çarpma → "bugünlük bitti" değil, "koç seni durdurmak
   istemiyor" çerçevesi.
2. Deneme analizinde derin katmanın kilidi ("hangi maddelerde kaybettin").
3. `slump_watch` döneminde plan ihtiyacı ("sana haftalık plan çıkarayım mı?").
4. Sınav moduna giriş (prova arşivi + sınırsız tekrar).

Fiyat çapası: "bir dershanenin günlük çayı parasına, seni tanıyan antrenör."

---

## 12. Beş soruya beş cevap

- **Neden her gün gelsin?** Koç her sabah *o güne özel* bir şey hazırlamış olduğu
  için (tekrar, hedef, deneme) — genel bir uygulamaya değil, kendisini bekleyen
  bir masaya geliyor.
- **Neden silmesin?** Birikimi burada: yanlış haritası, madde hafızası, rütbesi,
  serisi. Silmek uygulamadan değil, kendi emeğinin aynasından vazgeçmek olur.
- **Neden premium alsın?** Daha çok soru için değil; kendisini tanıyan antrenörün
  tam beyni için — plan, süresiz tekrar hafızası, sınırsız açıklama.
- **Neden tavsiye etsin?** Somut ve anlatılabilir bir an yaşadığı için: "hangi
  maddeden soru çıkacağını gösteriyor", "yanlışlarımı unutmuyor", "sınav sabahı
  mesaj attı". İnsanlar özellik değil an anlatır.
- **Neden Google yerine bizi açsın?** Google'da mevzuat var ama *onun* mevzuatı
  yok: hangi maddede zayıf, neyi ne zaman tekrar etmeli. Kişisel katman kopyalanamaz.

---

## 13. Ben olsam bu ürünü böyle tasarlardım

Teknik sınır yok dedin; işte kuzey yıldızım:

**Bu ürün bir soru bankası değil; sınava birlikte hazırlanılan kıdemli bir meslektaş.**
"Komiserim" diye takılan, nöbetini bilen, dün yanlış yaptığını unutmayan, kötü
geçen denemede moral veren, sınav sabahı "kolay gelsin" diyen biri.

- **Vardiyaya duyarlı koç (bence en özgün fikrimiz):** kullanıcı vardiya düzenini
  girer (12/24, 12/36, gece haftası). Koç planı, bildirimi ve hedefi buna göre
  kurar: gece nöbeti sabahında ağır konu koymaz; izin gününe uzun deneme yerleştirir.
  Hiçbir genel eğitim uygulaması bunu yapamaz — çünkü kullanıcısını tanımıyor.
  Biz tek meslek için varız; mesleğin ritmini ürünün ritmi yapabiliriz.
- **Sınav yılı takvimiyle yaşayan ürün:** başvuru açıldığında, sınav yaklaştığında,
  sonuç gününde ürün mod ve dil değiştirir. Kullanıcı "uygulamaya giriyorum" değil
  "hazırlığımın merkezine dönüyorum" hisseder.
- **Kazananlar duvarı:** her dönem, kazanan kullanıcıların (izinli) hikayeleri:
  kaç soru çözdü, hangi konudan geldi, dip dönemini nasıl aştı. Yeni gelen aday
  kendi 180 gününün sonunu orada görür. En güçlü pazarlama + en güçlü motivasyon
  aynı duvar.
- **Madde Atlası'nın nihai hali:** Türkiye'de polis mevzuatının "hangi madde,
  hangi sınavda, kaç kez, hangi kalıpla soruldu" bilgisinin TEK adresi. Bu veri
  seti büyüdükçe kopyalanamaz bir hendek olur — sorular herkeste var, *harita*
  sadece bizde.
- **Ve disiplin:** her yeni özellik şu üç sorudan geçer — Adayın net'ini artırıyor
  mu? Her gün dönmesini sağlıyor mu? Güvenini büyütüyor mu? Üçüne de hayırsa,
  ne kadar parlaksa parlasın, yapmayız.

Amaç cümlesi duvara asılacak netlikte: **"Türkiye'de bir polis adayı sınavı
kazandığında, 'Paemisyon'suz olmazdı' desin."**

---

## 14. Uygulama sırası önerisi (onay sonrası, ayrı planlanır)

1. **Koç durum makinesi genişletme** (slump_watch, comeback, exam_mode, taper) —
   mevcut kural motorunun devamı, hızlı kazanım.
2. **"Bugün çalış" karışım motoru** (mobil + web) — ürünün kalbi.
3. **Onboarding: İlk Devriye** (seviye tespiti + hedef kurulumu).
4. **Seri sigortası + bildirim disiplini.**
5. **Madde etiketleme altyapısı** (admin import'a madde tespiti) → **Madde Atlası v1**
   (ısı haritası, web).
6. **Rütbe sistemi** (rozet altyapısının üstüne).
7. **AI Faz 2** (yanlış açıklaması, önbellekli) + premium paketleme.

Her adım kendi planı ve onayıyla gelir; bu doküman yol haritasıdır, sözleşme değil.

---

## 15. Uygulama durumu (17 Tem 2026 — gece koşusu sonrası)

| # | Adım (§14) | Durum | Not |
|---|---|---|---|
| 1 | Koç durum makinesi genişletme | ✅ | exam_mode/taper/slump_watch/comeback + mode alanı; 3 yeni kural testli |
| 2 | "Bugün Çalış" karışım motoru | ✅ | session-mix.logic (saf+testli): %40 zayıf+%25 yanlış+%35 yeni; sınav modunda tersine; hero doğrudan koç seansı açar |
| 3 | Onboarding: İlk Devriye | ✅ | 3 soru (sınav/tarih/süre) + 10 soruluk karışık teşhis + konu karnesi |
| 4 | Seri sigortası | ✅ | haftada 1 (premium 3), yalnız TAM 1 gün boşluk; streak.logic saf+11 test |
| 4b | Bildirim disiplini | ⏳ | cihaz doğrulaması gerektirir — hazır görev çipi açıldı (yerel v1); sunucu push ayrı iş |
| 5 | Madde Atlası v1 | ✅ | etiketleme+tespit+backfill+ısı haritası+madde sayfası; fetih haritası mobil UI sonraki |
| 6 | Rütbe sistemi | ✅ | 8 rütbe, puan=çözülen+15×aktif gün; RankInsignia Bugün'de |
| 7 | AI Faz 2: yanlış açıklaması | ✅ | önbellek-önce, free günde 3; ANTHROPIC_API_KEY Railway'e girilince canlı |
| 7b | Premium paketleme | ⏳ | AI limiti + sigorta farkı kodda; paywall ekran metinleri Doc 24 §11 tablosuna göre ayrı iş |
