# Doc 48 / Faz 1 — Mobil "Bugün": Aday Yolculuğu ve Bilgi Mimarisi

> Durum: **taslak, onay bekliyor** (14 Eki 2026).
> Bağlam: Faz 0 keşfi (ekran haritası, veri envanteri) ve iki canlı düzeltme (premium
> sayaç, canlı seri) tamamlandı. Bu doküman ekranın *ne söyleyeceğini* kurar; *nasıl
> görüneceği* Faz 2 (Figma wireframe) ve Faz 3 (tasarım sistemi) işidir.
> Üst belgeler: Doc 24 (yolculuk), Doc 25 (bilgi mimarisi), Doc 26 (ton + token).
> Bu doküman onları **değiştirdiği yerde açıkça söyler** (§9).

---

## 0. Özet — beş cümlede

1. Bugün ekranı 14 bölümden **4 bloğa** iner: **Durum satırı · Bugünün görevi · Hazırlık · Mevzuat**.
2. Ekranda **tek birincil eylem** vardır ve onun etiketi ile davranışı **aynı kaynaktan**
   (sunucu, `todayTask`) gelir. "5 soru" yazan buton 5 soru açar.
3. Üç "devam et" bire, iki "Isınmaya başla" bire iner; yarım tur artık ayrı bir afiş
   değil, görev kartının kendisidir.
4. Her sayının tek bir tanımı vardır (§5 Sayı sözlüğü). İki farklı "hedef" ve iki
   farklı "istikrar" ölçüsü aynı ekranda yan yana durmaz.
5. Odak seçimi tek kontrol tipli bir listeye, ders → konu inişi aynı sheet içinde
   ilerleme çubuklarıyla akan bir yığına dönüşür. Sheet üstüne sheet açılmaz.

---

## 1. Faz 0'dan gelen ve tasarımı belirleyen veri gerçekleri

| Gerçek (14 Eki 2026 ölçümü) | Tasarım sonucu |
|---|---|
| Alıştırmada **2.209 yarım tur** var, **1.683 tamamlanmış** tur. Yarım turlardaki **4.353 cevap** (351 kullanıcı) ilerlemeye hiç yansımamış: istatistik, konu ilerlemesi, yanlış kaydı ve seri yalnız tur tamamlanınca yazılıyor (`progress.service.ts:49`). | Yarım tur istisna değil, **ana davranış**. Ekran devam etmeyi kolaylaştırmalı. Sistem de yarıda bırakılan emeği saymalı (D3, B8). |
| Mevcut ekranda yarım tur varken hero butonu **yeni** tur açıyor. | Biriken yarım turların bir kaynağı bu. Yarım tur varken yeni tur açan ikinci bir buton olmayacak. |
| Serisi görünen 412 kullanıcının **371'inde seri aslında kırıktı** (14 Eki'de düzeltildi). | Günlük seri, vardiyalı persona için kırılgan bir ölçü. Doc 24 §7.2 zaten "seri tek metrik olmaktan çıkarılır" diyor (D1). |
| "Son aktivite" yalnız tamamlanan tura göre hesaplanıyor. 2 Ekim'de soru çözen kullanıcı "25 gündür pasif" sayılıp "Hoş geldin" kartı görüyor. | Aktiflik cevap anında sayılmalı (D3). |
| Sayaç, seri ve hafta UTC'ye göre. 00:00–03:00 TR arası cevaplar önceki güne yazılıyor. | Gece nöbeti için gün sınırı bilinçli seçilmeli (D2). |
| Ders düzeyinde başarı verisi var ama gösterilmiyor. Zayıf konu eşiği iki ayrı yerde ve farklı. | Hazırlık bloğu mevcut veriden kurulur; eşik tek kaynağa iner. |

---

## 2. Aday senaryoları

Persona: Doc 24 §0. Vardiyalı, yorgun, tek elle, 10–20 dakikalık parçalı zaman.
"Dokunuş", uygulama açıldıktan sonra ilk soruyu görene kadar geçen dokunuş sayısıdır.

### S1 — Nöbet çıkışı, 10 dakika (06:40, serviste, tek el)
- **Ekranın cevaplaması gereken soru:** "Bugün ne yapmalıyım?" Tek ve net cevap.
- **Bugün ne oluyor:** Hero butonu "Isınmaya başla (5 soru)" diyor ama 20 soruluk tur
  açıyor. Halka "0/20", butonun altında "5 soru" yazıyor. Çelişki güveni kemiriyor.
- **Hedef akış:** Görev kartı "Bugünün turu · 10 soru · ~8 dk" ve tek satır gerekçe
  ("Ağırlık Anayasa'da — son iki haftada %48") gösterir. Dokun, tur başlasın.
- **Dokunuş:** bugün 1 (ama yanlış iş yapıyor) → **hedef 1** (doğru iş).

### S2 — Yarım kalan turu bitirmek (telsiz çağrısıyla kesilmiş tur)
- **Soru:** "Kaldığım yere nasıl dönerim?"
- **Bugün ne oluyor:** Afiş ve hero yan yana duruyor. Yanlış olana dokunan kullanıcı
  ikinci bir yarım tur yaratıyor. 12 günlük eski tur, bugünün halkasıyla yan yana
  "Yarım kalan turun var" diye görünüyor.
- **Hedef akış:** Taze yarım tur (son cevap < 24 saat) **görev kartının kendisi** olur:
  "Turun yarım kaldı · 7/20" ve buton "Devam et · 13 soru". Eski yarım tur görev
  kartını işgal etmez (§4 tazelik kuralı).
- **Dokunuş:** bugün 1 (ama yanlış butona basma riskiyle) → **hedef 1**, tek seçenek.

### S3 — Sınava 30 gün kala zayıf konuya yüklenmek
- **Soru:** "Ne kadar hazırım, nerede zayıfım?"
- **Bugün ne oluyor:** Zayıf konu kartı ancak koç kuralı seçerse görünüyor; "Hoş geldin"
  kartı onu bastırabiliyor. Elle yol 5 dokunuş: Odak → Ders/konu seç → Turu başlat →
  ders → konu. Hangi konunun zayıf olduğu ancak konu listesinde görülüyor.
- **Hedef akış:** Hazırlık bloğu ders ders başarıyı ve **en zayıf 3 konuyu** gösterir.
  Konu chip'ine dokunmak o konuda 10 soruluk tur açar.
- **Dokunuş:** bugün 5 → **hedef 1** (chip) / 5 (elle istenen herhangi bir konu, ama
  ilerleme her adımda görünür).

### S4 — İlk gün (onboarding'i yeni bitirmiş)
- **Soru:** "Nereden başlayacağım? Bu uygulama beni tanıyor mu?"
- **Bugün ne oluyor:** Hedef 20, cevap 0, `clamp(5,20)` sonucu ilk tur 20 soru açılıyor.
  Yeni kullanıcı için ağır bir başlangıç. Altında boş istatistikler, 0'lar ve liderlik
  tablosu var.
- **Hedef akış:** Görev kartı "Seni tanıyalım · 10 soruluk ilk tur" der (Doc 25 "İlk
  Devriye"). Hazırlık bloğu sıfırlar yerine dürüst bir boş durum gösterir: "İlk turdan
  sonra güçlü ve zayıf konuların burada." Sınav geri sayımı resmî tarihten gelir, ilk
  günden görünür.
- **Dokunuş:** bugün 1 (20 soru) → **hedef 1** (10 soru).

### S5 — Uzun aradan dönüş (10 gün yok)
- **Soru:** "Geri dönmeye değer mi, nereden başlarım?"
- **Bugün ne oluyor:** İki ayrı "Isınmaya başla (5 soru)" var. Biri 20 soruluk tur
  açıyor, diğeri kataloğa gidiyor ve tur açmıyor. Metin "1.282 soruluk birikimin seni
  bekliyor" diyor: borç dili. Kırık seri "🔥 2 gün" görünüyordu.
- **Hedef akış:** "Hoş geldin. Güçlü konundan 5 soruluk kısa tur — 3 dakika." Buton
  gerçekten 5 soru açar (Doc 24 §7.1: dönüşte zayıf değil güçlü konu). İstikrar
  göstergesi suçlamaz: "Bu hafta 0/5 gün" yerine "Toplam 47 aktif gün" çerçevesi
  (Doc 24 §7.2).
- **Dokunuş:** bugün 1 (yanlış iş) ya da 3+ (kataloktan) → **hedef 1**.

### İkincil yol — Mevzuat'a hızlı dönüş
"Okumaya devam: CMK md. 91 · Ceza Muhakemesi Kanunu". Bugün 1 dokunuş, hedef 1.
Ama blok bugün ekranın en baskın mor kartı. Hedef: tek satır ve sakin.

**Dokunuş özeti**

| Senaryo | Bugün | Hedef | Asıl kazanç |
|---|---|---|---|
| S1 nöbet sonrası | 1 (yanlış iş) | 1 | Etiket = davranış |
| S2 yarım tur | 1 (yanlış butona basma riski) | 1 | Tek devam yolu |
| S3 zayıf konu | 5 | 1 | Zayıflık ana ekranda |
| S4 ilk gün | 1 (20 soru) | 1 (10 soru) | Ölçülü ilk temas |
| S5 dönüş | 1–3 (yanlış iş) | 1 (gerçek 5 soru) | Sıcak, dürüst dönüş |

---

## 3. Bilgi hiyerarşisi (önerilen, gerekçeli)

Kullanıcının önerdiği dört katmanı **kabul ediyorum**. Altı noktada itiraz ya da
ekleme var (İ1–İ6).

```
┌─────────────────────────────────────────┐
│ ① DURUM SATIRI                          │  "İyi geceler, Ahmet"
│   PAEM 2027 · 142 gün · Bu hafta 3/5 gün│  (tek istikrar ölçüsü — D1)
├─────────────────────────────────────────┤
│ ② BUGÜNÜN GÖREVİ          (tek CTA)     │  başlık + tek satır gerekçe
│   Bugün 6/20 ━━━━━━━──────              │  günlük ilerleme (halka/çubuk)
│   Odak: Koç seçiyor            ›        │  ayar satırı (ikincil)
│   [ Başla · 10 soru ]                   │  birincil eylem
│   (en çok 1 ikincil öneri satırı)       │  ör. "4 çözülmemiş yanlış · 3 dk"
├─────────────────────────────────────────┤
│ ③ HAZIRLIK                              │  ders başına çubuk (doğru % + çözülen)
│   En zayıf 3 konu: [chip] [chip] [chip] │  tek dokunuşla o konuya tur
├─────────────────────────────────────────┤
│ ④ MEVZUAT                               │  "Okumaya devam: CMK md. 91"
│   kısa yollar (tam adıyla etiketli)     │
└─────────────────────────────────────────┘
  (free kullanıcıya en altta tek sakin premium satırı)
```

**İ1 — Uygulama adı başlığı kalkar.** Ortalanmış "Paemisyon" bir işe yaramıyor. Yerine
iOS büyük başlık kalıbında selam gelir. Ekranın üstünde yaklaşık 60pt kazanılır.

**İ2 — "Hedef" kelimesi iki anlam taşıyamaz.** Bugün "Hedef: PAEM" (sınav) ile
"Hedefe 20 soru kaldı" (günlük hedef) yan yana. Yeni hâli:
- Sınav: "PAEM 2027 · 142 gün"
- Günlük hedef: "Bugün 6/20"

**İ3 — Başparmak erişimi gerçek bir sorun.** Mevcut CTA büyük telefonda ekran
yüksekliğinin yaklaşık %42'sinde, rahat başparmak bölgesinin dışında. Bu yüzden Faz
2'de iki yerleşim karşılaştırılacak:
- **A — Klasik dikey:** CTA görev kartının içinde.
- **B — Başparmak önce:** CTA sekme çubuğunun hemen üstünde sabit; görev kartı yukarıda
  bağlamı anlatır.

Persona tek elle ve yorgun; ben B'ye eğilimliyim, ama karar wireframe'de verilmeli.

**İ4 — Koç kartları listesi küçülür (Doc 25'e değişiklik — D4).**
- Koçun en üst kartı görev kartının *içeriği* olur: başlık ve tek satır gerekçe.
  Bu, Doc 24 §9'daki "seans şeffaflığı" borcunu da kapatır.
- Görev kartının altında en çok 1 ikincil öneri satırı kalır (yanlış tekrarı, canlı deneme).
- Diğer kartlar bağlamına taşınır: deneme Denemeler'e, rozet Ben'e.
- Gerekçe: dört kartlık liste, tek eylem ilkesini ekranın kendi içinde çiğniyor.
  Doc 27 §2.3 web'deki koç rayına bile "en fazla 2 kart" sınırı koyuyor (Doc 26 dil
  kuralı 2: koç gevezeleşmez).

**İ5 — Katlamanın altındaki 10 bölüm taşınır, silinmez.**

| Bölüm | Yeni yeri |
|---|---|
| Rütbe, sıradaki rozet, istatistik şeridi | Ben / Performans |
| Liderlik önizlemesi | Performans |
| 14 günlük aktivite şeridi | ① Durum satırındaki haftalık göstergeye dönüşür |
| Haftalık fotoğraf | ③ Hazırlık'a "bu hafta ↑/↓" olarak eriyerek girer |
| Premium CTA | Yalnız free kullanıcıda, en altta tek sakin satır; asıl teklif limit anında, bağlamında |

**İ6 — Tek bir "hazır olma yüzdesi" uydurmuyoruz.** Bileşik bir "%73 hazırsın" skoru
cazip ama doğrulanmamış ve kara kutu (Doc 26 §1: rakam konuşur, ama dürüst rakam).
Hazırlık bloğu bileşik skor yerine ölçülebilir iki şeyi gösterir:
- ders başına doğru oranı ve çözülen soru;
- en zayıf konular.

Bileşik skor ileride, deneme sonuçlarıyla korelasyonu ölçülürse eklenebilir.

---

## 4. "Bugünün görevi": tek CTA'nın durum tablosu

Karar sunucuda verilir (`todayTask`, B3). İstemci yalnız çizer. Doc 24 §3 öncelik
kuralı korunur: güvenlik > aciliyet > alışkanlık > büyüme. **Bir anda yalnız bir satır
geçerlidir.**

| Öncelik | Durum (tetik) | Başlık | Gerekçe satırı (örnek) | Birincil eylem | Tur |
|---|---|---|---|---|---|
| 1 | Canlı deneme bugün (`exam_day`) | "Deneme bugün 10.00'da" | "Sabah ağır konu yok — kısa ısınma istersen aşağıda." | Denemeye git | — |
| 2 | **Taze yarım tur** (son cevap < 24 sa) | "Turun yarım kaldı" | "Koç turu · 7/20 · bugün 02.14" | Devam et · 13 soru | devam |
| 3 | İlk gün (< 3 tamamlanmış tur) | "Seni tanıyalım" | "10 soruluk ilk tur — koç seviyeni görsün." | Başla · 10 soru | 10 |
| 4 | Dönüş (≥ 5 gün aktivite yok — Doc 24 §3) | "Hoş geldin" | "Güçlü konundan kısa tur — 3 dakika." | Başla · 5 soru | 5 |
| 5 | İstikrar riski (akşam, bugün 0 cevap) | "Bu haftanın 3. günü için" | "5 soru yeter — haftalık hedefin yolunda kalır." | Başla · 5 soru | 5 |
| 6 | Normal, hedef sürüyor | "Bugünün turu" | "Ağırlık Anayasa'da — son iki haftada %48." | Başla · 10 soru | min(kalan, 10), en az 5 |
| 7 | Hedef tamam | "Bugünkü hedef tamam" | "20/20. Yarın görüşürüz." | (ikincil stil) Ekstra tur · 10 soru | 10 |
| — | Çevrimdışı | Son bilinen durum | "Çevrimdışısın — yeni tur için bağlantı gerekiyor." | Devre dışı + neden | — |

**Tazelik kuralı (yarım tur).** Son cevabın zamanına göre üç durum:
- **24 saatten yeni:** görev kartının kendisi olur.
- **24 saat ile 7 gün arası:** görev kartını işgal etmez. Kartın altında ikincil satır:
  "2 Eki'de yarım kalan tur (1/20) · Devam et".
- **7 günden eski:** sunucu turu **kısmi olarak tamamlar**, yani çözülen cevaplar
  ilerlemeye yazılır (B8). Silinmez, sessizce terk de edilmez.

**Tur boyu.** Persona 10–20 dakikalık oturumla çalışıyor; varsayılan tur 10 soru
(yaklaşık 8 dk). Günlük hedef 20 ise "iki tur = hedef" basit bir ritim kurar. Halka
günün toplamını, buton bu turu söyler: "Bugün 6/20 · Başla · 10 soru". İki sayı farklı
şeyleri ölçer ve bunu etiketleri açıkça söyler.

---

## 5. Sayı sözlüğü — ekrandaki her sayının tek tanımı

| Ekranda | Tanım | Kaynak | Not |
|---|---|---|---|
| "142 gün" | Sınava kalan TR takvim günü | `exam.daysLeft`: kişisel tarih varsa o, yoksa resmî tarih (B5) | Tarih yoksa sakin bir "Sınav tarihini ekle" satırı |
| "Bu hafta 3/5 gün" | Bu hafta en az 1 soru cevaplanan gün sayısı / haftalık hedef | `daily_usage` (B1 sonrası herkes için doğru) | D1'e bağlı; gün sınırı D2'ye bağlı |
| "Bugün 6/20" | Bugün cevaplanan yeni soru / günlük hedef | `today.answered` / `users.daily_goal` | Öneri: deneme cevapları da sayılsın (kotaya değil, halkaya; B9) |
| "10 soru" | Bu turun uzunluğu | `todayTask.count` | Etiket ve davranış aynı alan |
| "7/20" | Yarım turun ilerlemesi | `todayTask.session.{answered,total}` | Yalnız taze turda görev kartında |
| Ders çubuğu "%62 · 128 soru" | O derste doğru oranı · çözülen soru | `readiness.courses[]` (B4) | Bileşik skor yok (İ6) |
| Zayıf konu chip'i | ≥ 10 çözülmüş ve doğru oranı < %50 olan en zayıf 3 konu | `readiness.weakest[]` | Bugün iki eşik var; tek eşik koç kartınınki (B4) |
| "4 çözülmemiş yanlış" | Henüz doğru cevaplanmamış yanlış sayısı | `readiness.unresolvedWrongCount` | "Tekrar zamanı gelen" denmez (Faz 0 kararı 3) |

Kural: aynı kavram ekranda iki kez, iki farklı biçimde görünmez. Örneğin seri ve
haftalık gün, ya da "hedef: PAEM" ve "hedefe 20 kaldı" yan yana durmaz.

---

## 6. Kaldırılan, birleştirilen, taşınan

| Bugün | Yeni | Tür |
|---|---|---|
| Yarım tur afişi + hero CTA + "Bugün senin için"deki dönüş kartı (3 "devam" yolu) | Görev kartı (durum 2 ya da 4) | Birleşir → 1 |
| Hero "Isınmaya başla (5 soru)" + kart "Isınmaya başla (5 soru)" | Görev kartının CTA'sı | Birleşir → 1 |
| Mevzuat "Kaldığın yerden devam et" | "Okumaya devam: CMK md. 91" — farklı fiil, tur eylemiyle karışmaz | Yeniden adlandırılır |
| AppBar "Paemisyon" | Büyük başlık selam | Kalkar |
| 🔥 seri + "0/5 aktif gün" noktaları | Tek istikrar göstergesi (D1) | Birleşir → 1 |
| "Hedef: PAEM" + "Hedefe N soru kaldı" | "PAEM 2027 · 142 gün" + "Bugün 6/20" | Ayrışır |
| 4 kartlık koç listesi | Görev kartının gerekçesi + en çok 1 ikincil satır | Küçülür (D4) |
| Rütbe, rozet, istatistik, liderlik | Ben / Performans | Taşınır |
| Aktivite şeridi, haftalık fotoğraf | Durum satırı ve Hazırlık bloğu içine | Erir |
| Mor Mevzuat kartı + 4 etiketsiz chip | Tek satır + en çok 3 kısa yol (kısaltma + tam ad) | Sadeleşir |
| "1.282 soruluk birikimin seni bekliyor" | Durum tablosundaki kopya (§4) | Kalkar |

Sonuç: ekran 14 bölümden 4 bloğa iner. Birincil eylem 2'den 1'e, "devam" yolu 3'ten
1'e iner.

---

## 7. Odak akışı ve ders → konu inişi

**Sorunlar (Faz 0):**
- Tek listede üç kontrol tipi var (tik, chevron, radyo).
- "Ders / konu seç" bir seçenek değil, navigasyon.
- "Turu başlat" kaç soru olduğunu söylemiyor.
- Chip'in ayar mı yoksa başlatıcı mı olduğu belirsiz.
- Seçim hiçbir yerde saklanmıyor.
- Sheet üstüne sheet açılıyor.
- Ders satırlarında alt başlık başlığın tekrarı; ilerleme yok.

**Yeni kurgu:**

1. **Odak bir ayardır, başlatıcı değil.** Görev kartında etiketli bir ayar satırı olarak
   durur: "Odak · Koç seçiyor ›". Değişince CTA canlı güncellenir: "Başla · 10 soru ·
   Anayasa".
2. **Tek kontrol tipi.** Sheet'teki her satır aynı anatomiyi taşır: ikon + başlık + alt
   satır + sağda seçim göstergesi. Hepsi radyo anlamında seçilir.

   | Seçenek | Satır |
   |---|---|
   | Koç seçsin | "Önerilen", alt satır: neyi karıştırdığı |
   | Ders seç | Alt satır: seçiliyse "Anayasa Hukuku" |
   | Konu seç | Alt satır: seçiliyse "Temel Haklar" |
   | Kanun / madde | Doc 25 §5; web'deki "seçili mevzuat" mobil'e gelince |
   | Yanlışlarım | Alt satır: "4 çözülmemiş yanlış" (sayı yoksa satır pasif ve nedenini söyler) |

3. **İniş aynı sheet içinde yığın olarak ilerler.** "Ders seç"e dokununca sheet içinde
   ders listesi açılır; başlıkta geri oku ve "Ders seç" yazar.
   - Ders satırı: ad + doğru oranı çubuğu + "128 soru · 14 konu". Başlığı tekrarlayan
     alt başlık kalkar.
   - Derse dokunmak konu listesini açar. İlk satır "Dersin tamamı", ardından konular
     gelir: doğru oranı çubuğu ve gerekiyorsa "zayıf" rozeti.
   - Seçim yapılınca sheet kök listeye döner; seçilen satır işaretli ve değeri dolu olur.
4. **Sheet'in sabit alt düğmesi seçimi söyler:** "Başlat · 10 soru · Temel Haklar".
   Başlatmadan kapatırsan odak gün boyu kalır (Doc 25 §5: geçici odak).
5. **Odak bugün için saklanır.** Bugün hiç saklanmıyor. Öneri sunucuda, gün bazlı (B10):
   web aynı odağı görür ve koç "3 gündür Anayasa seçiyorsun" diyebilir (Doc 25 §5).

**Dokunuşlar:**
- Ana ekrandaki zayıf konu chip'iyle: **1**.
- Elle herhangi bir konu: Odak → Konu/Ders seç → ders → konu → Başlat = **5**. Aynı
  sayı, ama her adımda ilerleme görünür ve geri dönüş belli. Sonraki turlar o gün
  **1** dokunuş (odak hatırlanır).

---

## 8. Tasarlanacak durumlar (Faz 2 girdisi)

| Durum | Görev kartı | Durum satırı | Hazırlık | Mevzuat |
|---|---|---|---|---|
| İlk gün | "Seni tanıyalım · 10 soru" | Geri sayım (resmî tarih), istikrar boş ve nötr | Dürüst boş durum, sıfır yok | Arama + en çok sorulan 3 kanun (tam adla) |
| Normal | "Bugünün turu" + gerekçe | Gün + hafta | Ders çubukları + 3 zayıf konu | Okumaya devam |
| Yarım tur (taze) | "Turun yarım kaldı · 7/20" | — | — | — |
| Yarım tur (eski) | Normal kart + ikincil satır "2 Eki'de yarım kalan tur" | — | — | — |
| Hedef tamam | "Bugünkü hedef tamam" + ikincil ekstra tur | Bugün dolu | Bu hafta değişimi | — |
| İstikrar bozuldu / dönüş | "Hoş geldin · 5 soru" | Nötr çerçeve ("Toplam 47 aktif gün") | Değişmez | — |
| Çevrimdışı | Son bilinen durum (B7) + devre dışı CTA ve nedeni | Önbellekten | Önbellekten | Okuma önbelleği varsa açık |
| Sınav modu (≤ 30 gün) / taper (≤ 3 gün) | Durum tablosuna göre (Doc 24 §3) | Geri sayım vurgulu | "Yeni konu yok — pekiştirme" | — |

Hepsi koyu ve açık temada, en büyük Dynamic Type'ta ve iPhone SE genişliğinde
tasarlanacak. Bu Faz 2 ve Faz 5'in kabul ölçütüdür.

---

## 9. Üst belgelere değişiklikler (onaylanırsa işlenecek)

| Belge | Değişiklik |
|---|---|
| Doc 25 §2 Bölge 1 | Bugün = görev kartı + en çok 1 ikincil öneri. Destek kartları listesi kalkar (D4). |
| Doc 25 §5 | Odak gün bazlı saklanır (bugün saklanmıyor). Odak ayardır, CTA'yı değiştirir. |
| Doc 24 §3 | Dönüş eşiği kodda ≥ 3 gün, belgede 5+ gün. Bu dokümanla 5'e hizalanır. Dönüş CTA'sı gerçek 5 soruluk güçlü konu turu açar (bugün kataloğa gidiyor). |
| Doc 24 §7.2 | Seri tek metrik değil. Ana ekranda tek istikrar ölçüsü kalır (D1). |
| Doc 26 §1 | Örnek kopyalar §4 tablosundaki metinlerle güncellenir; "seni bekliyor" kalıbı yasak listesine girer. |

---

## 10. Backend etkisi (Faz 4'te küçük ve ayrı adımlar)

| Adım | Ne | Bağlı karar |
|---|---|---|
| ~~B1~~ | ~~Premium günlük sayaç~~ | **canlıda (14 Eki)** |
| ~~B2~~ | ~~Canlı seri~~ | **canlıda (14 Eki)** |
| B3 | `/me/coach.todayTask`: §4 durum tablosu, tazelik kuralı, tur boyu; etiket ve sayı tek alanda | D4 |
| B4 | `/me/coach.readiness`: ders başına doğru oranı ve çözülen, tek eşikli en zayıf 3 konu, çözülmemiş yanlış sayısı | — |
| B5 | Resmî sınav tarihi (`ExamType`) + kişisel ezme; admin panelinde alan | Faz 0 kararı 1 |
| B6 | İstemciye açık özellik bayrakları (`home_v2`) | — |
| B7 | Son brief'in yerel önbelleği (çevrimdışı durum) | — |
| B8 | Yarıda bırakılan emek sayılır: aktiflik cevap anında; 7 günden eski yarım tur kısmi tamamlanır, ilerleme yazılır | D3 |
| B9 | Deneme cevapları günlük halkaya sayılır (kotaya değil) | — |
| B10 | Günün odağı sunucuda, gün bazlı | — |
| B11 | Gün sınırı | D2 |

---

## 11. Karar bekleyenler

- **D1 — Tek istikrar ölçüsü.** Öneri: **haftalık aktif gün** ("Bu hafta 3/5 gün").
  Günlük seri hesaplanmaya devam eder ama ana ekrandan Performans/Ben'e iner.
  - Gerekçe: vardiyalı persona, 412 serinin 371'inin kırık olması ve Doc 24 §7.2.
  - Bedel: akşamki `streak_risk` bildirimi "haftalık hedef" diline geçer.
- **D2 — Gün sınırı.** Öneri: **TR saatiyle 04.00.**
  - Gece nöbetinde 01.00'de çözülen soru "bugünün" sayılır; yorgun adayın seri ve
    halkası gece yarısı sıfırlanmaz (Anki'nin bilinen tercihi).
  - Bugün sınır UTC, yani TR 03.00.
- **D3 — Aktiflik ve ilerleme ne zaman sayılır?** Öneri: **cevap anında.**
  - Yarıda bırakılan tur da emek olarak sayılır.
  - 4.353 cevaplık kayıp bir daha birikmez.
- **D4 — Koç kartları.** Öneri: **görev kartı + en çok 1 ikincil satır.** Kalan kartlar
  bağlamlarına taşınır.
