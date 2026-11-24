# 3713 ve 6222: ikinci dalga yuva analizi

Doc 39, 23 Kas 2026. Soru yazılmadı; yalnız analiz. Kaynaklar:
- `mevzuat/3713.txt` (52 başlık), `3713-mevcut-sorular.txt` (29), `3713-diger-konu-sorulari.txt` (10);
- `mevzuat/6222.txt` (29 başlık), `6222-mevcut-sorular.txt` (15), `6222-diger-konu-sorulari.txt` (2);
- `aday/3713-p1.json`, `3713-p2.json`, `6222-p1.json` ve `denetim/` karar dosyaları; `rapor/durum.md` 443–497;
- `analiz/resmi-polis-mevzuati.txt` (358 soru), `resmi-idare-personel.txt` (408 soru);
- komşu taban: `arama-`, `2911-`, `2559-`, `1481-` (mevcut ve çakışma), `3628-`, `5188-diger-konu-`, `6136-` (mevcut ve diğer konu), `5233-` (mevcut ve çakışma), `5326-`, `adli-kolluk-` soru dosyaları; `2911.txt`, `2559.txt`, `1481.txt`, `5233.txt`.

Resmî konsolide metinler mevzuat.gov.tr'den 23 Kas 2026'da indirildi (ikisi de `MevzuatTur=1`, `MevzuatTertip=5`; `=4` boş kabuk sayfa döndürür). Dosyalar:
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/indirilen/iframe-3713-5.html`,
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/indirilen/iframe-6222-5.html` (ham);
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/cikti/resmi-3713.txt`,
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/cikti/resmi-6222.txt` (düz metin);
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/cikti/karsilastirma-3713.txt`,
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/cikti/karsilastirma-6222.txt` (betik çıktısı);
betik: `/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/3713-6222/betik/karsilastir.py`.
Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural. **◆** kolluğu doğrudan ilgilendirir. **Vars.**: bilmeyen adayın sezgisi doğruya (D), yanlışa (Y), iki yöne (—) götürür.

## 0. Özet ve dürüst değerlendirme

| Kanun | Resmî soru | PAEM / Misyon | Bankada | İlk tur (aday → KABUL) | Asıl yuva | Yedek | Önerilen tavan | Gerçekçi beklenti |
|---|---|---|---|---|---|---|---|---|
| 3713 | 8 doğrudan ([82]–[89]) | PAEM 1 ([83]) / Misyon 7 | 29: 8 resmî 3713 + 1 kaynağı korpusta bulunamayan md 3 sorusu + 1 resmî 5442 + 3 resmî 5233 + 16 türetim | 20 → 16 | **1 (çekinceli)** | 3 | 2 | 0–1 |
| 6222 | 1 doğrudan ([181]) | PAEM 1 / Misyon 0 | 15: 1 resmî + 1 kaynağı belirsiz + 13 türetim | 14 → 13 | **3 (biri çekinceli)** | 5 | 4 | 2–3 |

- **3713 fiilen tükendi.** Yürürlükteki 21 ana ve ek maddenin 17'sinde en az bir banka sorusu var (sorusu olmayanlar: 8/A, 8/B, Ek 3, Ek 4; ikisi RED ya da iptal, biri mali, biri varsayılan oran); ölçülmemiş kalan yönlerin çoğu mali ayrıntı (md 21, Ek 1, Ek 3), işlemeyen atıf (md 4/ç–d, md 20, md 22), iptal (md 7 son, Ek 4) ya da sağduyudur. Kestirmesiz kurulabilecek tek yuva md 7/4'tür; o da ilk turda liste biçimiyle RED almış bir hükümdür ve bu raporda yalnız **ters yönde** (yer → oran) önerilir. Üretici bu yuvayı kuramazsa 3713 partisi **boş kalır; bu beklenen sonuçtur.**
- **6222'de üç gerçek boşluk var; üçü de md 18'in ölçülmemiş fıkralarıdır** (18/6, 18/7, 18/3'ün kaldırma mercii). md 18 kolluğun bu Kanunda en çok işlem yaptığı maddedir; bankada dört sorusu var ama ölçülenler 18/1 (tekrar süresi), 18/3 (başlama anı), 18/8 (başvuru) ile sınırlı.
- **Önceki turun "sonraki parti" notlarının çoğu düşer.** On başlangıç adayından ikisi asıl (3713 md 7/4 vaka; 6222 md 18/7), üçü yedek (6222 md 20, 12/1 son cümle, 18/9), beşi dışarıda (3713 Ek 4; 6222 md 6/3, 23/1, 12/5, 17/A). Gerekçeler §A.7 ve §B.7'de.
- **Metinler temiz.** 6222: 29 maddenin 29'u resmî metinle sözcük sözcük aynı. 3713: 52 maddenin 51'i aynı; tek fark Ek 1'in gövdesine karışmış dipnot metinleridir. 2019 (7182) ve 2022 (7405) değişiklikleri 6222'de, 2024 (7499) ve 2026 (7594) değişiklikleri 3713'te işlenmiş. Görev tanımında "7196" diye anılan 2019 değişikliği resmî tabloda **7182** sayılı Kanundur.
- **Ters ayırt etme riski.** Bilmeyen aday şu sezgilerle doğruyu bulur; soru bu sezgiyi kıran olguyla kurulur, kıramıyorsa yazılmaz:
  - "artırım oranı yarıdır" (3713 md 5/1, 7/2, 8/A; 6222 md 11/4, 14/3, 15/2, 17/1, 17/A) — 3713'te üç, 6222'de beş hükmün artırım oranı;
  - "bu Kanunda kararı il veya ilçe spor güvenlik kurulu verir" (6222 md 5/3-b, 5/5, 7/4, 10);
  - "6222'de idari iş savcınındır" (23/3; bankada);
  - "süre kırk sekiz saattir" (6222 md 6/3; 2911 alışkanlığı);
  - "suç ortağına ödül verilmez" (3713 md 19);
  - "düzenleyen yöneticidir" (3713 md 7/1);
  - "sarhoş seyirci dışarı atılır", "yanlış yere oturan kaldırılır" (6222 md 18/7 ilk yarısı, 21/4);
  - "güvenlik amirini mülki amir görevlendirir" (6222 md 3-e).

---

# A. 3713 sayılı Terörle Mücadele Kanunu

## A. Metnin durumu (BAĞLAYICI)

### Resmî metne erişim ve karşılaştırma

- Erişildi. Konsolide metin, 39 dipnot, "işlenemeyen hükümler" kalemi ve değişiklik tablosu indirildi.
- Resmî metin 52 madde başlığı, banka metni 52; adlar birebir eşleşir: md 1–25, 8/A, 8/B, 20/A, Ek 1–4, Geçici 1–20.
- Betik sözcük dizilerini karşılaştırdı (madde başlıkları, dipnot numaraları, noktalama ve satır kırıkları süzülerek): **51 madde aynı, 1 madde farklı.**
  - Fark **Ek 1**: banka gövdesinde resmî metnin 22–32 numaralı dipnot metinleri ve "2425", "(…)2 5", "(…)3 1" gibi dipnot imi artıkları duruyor (11 ekleme). Kanun cümleleri aynıdır.
  - Ek 4'teki iki betik farkı yalnız dipnot imidir ("[34]"); sözcük farkı yok.
- 24 maddedeki "SON" farkı tek tek bakıldı: hepsi bir sonraki maddenin başlığı ya da bölüm adıdır. Kesik madde yok.
- Resmî sayfadaki "işlenemeyen hüküm" (4126 sayılı Kanunun geçici maddesi) bankada yok; olması da gerekmez.

### AYM kayıtları, mülga ve işlemeyen hükümler

| Hüküm | Resmî şerh ya da dipnot | Bankadaki görünüm | Kullanım |
|---|---|---|---|
| md 1/2–3 | Mülga (5532, 2006) | şerh var | — |
| md 2/2 sonu | Dipnot [1]: "ve örgüt mensupları gibi cezalandırılırlar" ibaresi 6352 (2012) ile çıkarıldı | "(…)" | Örgüt adına suç işleyenin CEZASI bu fıkradan sorulmaz; "terör suçlusu sayılır" bankada |
| md 4/ç | 4926 sayılı Kaçakçılıkla Mücadele Kanununa atıf. 4926'nın yürürlükte olmadığı (5607 ile kaldırıldığı) genel bilgidir; resmî 3713 metninde şerh yok | aynen | **Kullanılmaz** (ölü atıf; kaçakçılık suçunun terör suçu sayılması sorulmaz, çeldirici de olmaz) |
| md 4/d | "Anayasanın 120 nci maddesi gereğince olağanüstü hal". 120 nci maddenin 2017 değişikliğiyle kalktığı genel bilgidir; şerh yok | aynen | **Kullanılmaz.** Bankadaki 3713-p1-03'ün D çeldiricisi bu bende dayanır (Şüpheli nokta 6) |
| md 6/4 | Dipnot [4]: "sahipleri ve" ibaresi AYM 18/6/2009, E. 2006/121, K. 2009/90 ile iptal. Son cümle 6459 ile mülga | "(…)" | Yayın sorumlusu kuralı bankada (3713-p1-07). "Yayın organının sahibi" hiçbir yerde yazılmaz |
| **md 7 son fıkra** | Dipnot [6]: 7499 (2/3/2024) "220 nci maddesinin altıncı" → "314 üncü maddesinin üçüncü". TCK 314/3'ün AYM 5/11/2024, E. 2024/81, K. 2024/189 ile iptali 3713'ün resmî metninde **görünmez** (TCK'nın dipnotudur; kaynak 08 eki ve 3713-p1-10 RED kaydı; bu turda TCK resmî metni yeniden indirilmedi) | aynen duruyor | **Hiçbir yerde kullanılmaz** (doğru şık, çeldirici, açıklama) |
| md 8 | Mülga (6415, 2013) | şerh | Terörün finansmanı 3713'ten sorulmaz |
| md 9–13, 16, 18 | Mülga (6352, 6526, 3842, 5532). md 10/5 için AYM 4/7/2013, E. 2012/100, K. 2013/84 | şerh | Özel yetkili mahkeme, gözaltı ve erteleme yasağı düzeni yoktur; **çeldirici de olmaz** |
| md 17/1 | 5275 md 107/4 ve md 108'e atıf; "dörtte üç" 7242 (2020) | aynen | Atfın bugünkü içeriği ⚑, **doğrulanamadı**. md 17 bankada (resmî [88]); yeni soru açılmaz |
| md 17/4 | "müebbet ağır hapis", "ağırlaştırılmış müebbet ağır hapis" (eski ceza adları) | aynen | Sorulmaz |
| md 20/1–2 | "Devlet Güvenlik Mahkemeleri", "Ceza Muhakemesi Kanununun 250 nci maddesiyle yetkili kılınmış ağır ceza mahkemeleri", "Hâkimler ve Savcılar Yüksek Kurulu", "Ceza ve Tevkifevleri Genel Müdürü" | aynen | **Korunanlar listesi sorulmaz** (işlemeyen ve eski adlı kalemler). md 20 zaten üç soruyla dolu |
| md 20/3, 20/5 | Dipnot [12]: KHK 700 ile "Cumhurbaşkanlığınca", "Cumhurbaşkanınca" | güncel; "belirlenir.(11)" dipnot imi artığı | bankada |
| md 20/A | KHK 671, 691; 6757, 7069. "bir yıl" → "iki yıl" (dipnot [13]) | güncel | bankada (3713-p2-04) |
| md 21 | (c), (d) bentleri mülga (6495); (h), (i), (j) bentleri hâlâ "(c), (d) ve (g) bentlerindeki haklar"a atıf yapar. 7594 (9/8/2026) (h)'nin son cümlesini kaldırdı, yeni fıkra ekledi | işlenmiş | **Bent atıfları sorulmaz.** Oran, gösterge, derece, süre (on yıl, bir yıl, otuz yıl) sorulmaz (08 eki) |
| md 21/b, md 22, Ek 1 | "Aile ve Sosyal Politikalar Bakanlığı", "Maliye Bakanlığı", "Sosyal Yardımlaşma ve Dayanışmayı Teşvik Fonu", "Fon Kurulu", "Devlet Personel Başkanlığı", "Türkiye Cumhuriyeti Emekli Sandığı" | aynen (resmî metinde de) | Kurum adları **hiç yazılmaz** |
| Ek 2 | İlk hâli AYM 6/1/1999, E. 1996/68, K. 1999/1 ile iptal; 5532 (2006) ile yeniden düzenlendi | güncel metin | Yürürlükte; bankada (3713-p2-08) |
| **Ek 4** | Dipnot [34]: AYM 30/6/2022, E. 2018/137, K. 2022/86 (yürürlük 12/1/2023): "Milli Güvenlik Kurulunca", "üyeliği, mensubiyeti ve" ibareleri ile "bu silahların mülkiyetinin kamuya geçirilmesine karar verilir ve … 6136 ek 8'e göre … işlem tesis edilir" cümlesi iptal | üç "(…)"; şerh yok | **Kullanılmaz.** Birinci fıkra kırpık okunuyor; ikinci fıkra ("mülkiyeti kamuya geçirilen silahlar … iade edilir") iptal edilen mekanizmaya dayanıyor |
| Geçici 1–20 | Geçici 1, 4, 9 ve 16'da AYM kayıtları (1992, 2019); Geçici 19'da AYM 2022 ve 7333 | Geçici 10 ve Geçici 17'nin başlığına önceki maddenin iptal şerhinin kuyruğu yapışmış | Kapsam dışı (08 eki) |
| md 23–25 | "Bakanlar Kurulu yürütür" | aynen | Kapsam dışı |

- **Son değişiklikler:** 7445 (2023; Ek 1), 7499 (2024; md 7), 7594 (2026; md 21, Ek 3, Geçici 20). Tablonun son satırı 7594'tür. Resmî Gazete ayrıca taranmadı; mevzuat.gov.tr'nin işlemediği bir değişiklik olup olmadığı **doğrulanamadı**.
- **Kullanılabilir çekirdek:** md 1, 2/1, 3, 4 (a, b, c, e), 5/1 ve 5/3, 6/1–3, 7/1–4, 8/A, 14, 15, 19, 20/3–6, 20/A, 21 (yalnız kapsam ve dayanak kanun), 22/1, Ek 2.

### Ad ve atıf kuralı (BAĞLAYICI)

| İbare | Kural |
|---|---|
| TCK madde numaraları (md 3, 4) | Köke ya da şıkka numara yazılmaz; suç adıyla yazılır. Numaradan suç adına çeviri ⚑ (TCK başlığı) — yalnız resmî [md 3] sorusunun kullandığı adlar güvenlidir |
| "314 üncü maddesinin üçüncü fıkrası", "220 nci maddesinin altıncı fıkrası", "örgüt adına suç işleme" cezası | Hiç yazılmaz |
| Devlet Güvenlik Mahkemesi, özel yetkili mahkeme, CMK 250, gözetim süresi | Hiç yazılmaz |
| 2330 sayılı Kanun | "Nakdi Tazminat ve Aylık Bağlanması Hakkında Kanun" adıyla yazılır (yedek Y1); içeriği ⚑ |
| 5233 sayılı Kanun | Yalnız çeldirici; içeriği 5233 bankasındadır |
| "yayın sorumlusu" | Korunur; "sorumlu müdür", "yayın organının sahibi" yazılmaz |
| "hüviyet" | "kimlik" (bankadaki kullanım) |
| "cezanın iki katı hükmolunur" (7/4) | Korunur; "iki kat artırılır" YASAK (anlamı değiştirir: üç katı) |

## A.§1 Resmî sorular

| No | Sınav | Hüküm | Açı | Biçim |
|---|---|---|---|---|
| 82 | EGM Misyon 2023 (4 şık) | md 15: en fazla üç avukat | S | doğrudan |
| 83 | PAEM 8 (2024) | md 20: korumaya alınmış emekli personelin konutu | M; "yanlıştır" | dört doğru cümle metinden, yanlışta kurum değişmiş |
| 84 | Misyon 2020 (4 şık) | md 19: ödül yönetmeliği | M | doğrudan |
| 85 | Misyon 2020 (4 şık) | md 20: aynı cümle | M; "yanlıştır" | [83]'ün ikizi |
| 86 | Misyon 2020 (4 şık) | md 7/3: alt sınır dört yıl | S | doğrudan; 300+ karakterlik kök |
| 87 | Misyon 2020 (4 şık) | md 21/b: kira yardımı yönetmeliğinde görüşü alınanlar | M; "değildir" | liste |
| 88 | JGK Dış Misyon 2023 (4 şık) | md 17: koşullu salıverilme | Ş; "yanlıştır" | dört fıkra, biri ters çevrilmiş |
| 89 | JGK Dış Misyon 2023 (4 şık) | md 6/1: bir yıldan üç yıla | S | boşluk |
| — | bankada ayrıca | md 3 (I–V öncüllü, "terör suçudur") | K | kaynağı resmî korpusta bulunamadı (Şüpheli nokta 9) |
| 81 | MEB Müfettiş Yrd. 2023 | 5442 (TSK'nin görevlendirilmesi) | M | 3713 değil; yanlış konu etiketi |
| 90–92 | İçişleri GYS | 5233 | S, M | 3713 değil; yanlış konu etiketi |

**Çıkarım.**
- Resmî sınavlar 3713'ü neredeyse yalnız **cümle ezberi** olarak sordu: süre, sayı, kurum adı, "yanlıştır". Sekiz sorunun altısı md 15–21'dendir (koruma, avukat, ödül, yardım); suç tanımlarından yalnız iki ceza miktarı soruldu (md 6, md 7/3).
- Vaka, ayırt etme ya da koşul→kural sorusu **hiç yok**. Bu yüzden "PAEM 3713'ten muhakeme sorusu sorar" varsayımı resmî korpusla desteklenmez; ikinci dalganın her yuvası "komisyon bunu sorar mı" testinde ancak resmî sorunun sorduğu türden bir **değer** (ceza oranı, dayanak kanun) ölçüyorsa geçer.
- PAEM'in tek sorusu md 20'dir ve md 20 bankada üç soruyla doludur.

## A.§2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Ölçülen yön | Soru | Kalan boşluk ve karar |
|---|---|---|---|
| md 1 | amaç ↔ yöntem ayrımı ("YER ALMAZ") | 3713-p1-01 | "örgüte mensup kişi veya kişiler", "cebir ve şiddet kullanarak": md 2/2 ile gerilimli (§A.6); açılmaz |
| md 2 | dört hâl (mensup ve suç işleyen; mensup ve suç işlememiş; mensup olmayıp örgüt adına suç işleyen; bildiri yayımlayan) | 3713-p1-02 | Dolu |
| md 3 | doğrudan terör suçları (suç adlarıyla) | resmî öncüllü soru | md 3 ↔ md 4 ayrımı: iki soru birlikte ölçüyor |
| md 4 | "terör örgütünün faaliyeti çerçevesinde" şartı (6136 suçu üzerinden) | 3713-p1-03 | (ç), (d) ölü atıf; (c), (e) liste ezberi. Dolu |
| md 5/1, 5/3 | yarı oran; adlî para cezası; müebbet → ağırlaştırılmış müebbet; yukarı sınır aşılabilir; md 4 suçlarına da; çocuklar | 3713-p1-04, -06 | Dolu (iki soru aynı fıkra) |
| md 5/2 | — | 3713-p1-05 **RED** (iki okumalı) | Kapalı |
| md 6/1 | ceza: bir yıldan üç yıla | resmî [89] | — |
| md 6/2, 6/3 | 7/2 ile ceza farkı (şık olarak) | 3713-p1-12 | Bildirinin içerik şartı 3713-p1-02 (IV) ve p1-12'de (B) basılı |
| md 6/4 | yayın sorumlusu: bin günden beş bin güne adlî para | 3713-p1-07 | Dolu |
| md 7/2 | propagandanın cezası; amblem fiilinin şartı; "toplantı sırasında gerçekleşmese dahi" | 3713-p1-12, -08 | Basın yoluyla yarı artırım; "haber verme sınırları": ölçülmemiş (sağduyu, varsayılan oran) |
| md 7/3 | alt sınır dört yıl; (üç yıldan beş yıla şık olarak) | resmî [86]; p1-12 D | Dolu |
| md 7/4 | sayılan yerler | 3713-p1-09 **RED** (liste biçimi; kamu binası bloğu) | **Oran yönü ölçülmemiş → A1.** "İki kat yalnız 7/4'te" bilgisi 3713-p1-04'ün açıklamasında bir cümleyle geçer |
| md 7/1 | — | yok | "faaliyetini düzenleyenler yönetici olarak" → yedek Y3 |
| md 7 son | — | 3713-p1-10 **RED** (iptal) | Kapalı |
| md 8/A | (çeldirici olarak) | 3713-p1-03 E | Varsayılan oran; açılmaz |
| md 8/B | — | 3713-p1-11 **RED** (TCK 20/2 ve 60 mükerreri) | Kapalı |
| md 14 | rıza dışındaki tek istisna | 3713-p2-01 | Dolu. 3628 md 18 ve PVSK Ek 9'un "rıza" kuralı da bankada |
| md 15 | üç avukat; katılan → bir avukat, ilgili kuruluş bütçesi; davacı → Bakan onayı; tarifeye bağlı değil | resmî [82]; 3713-p2-02 | Dolu ("Bakan onayı kimde aranır" p2-02'nin tersidir) |
| md 17 | dört fıkra | resmî [88] | Dolu; infaz, kolluk dışı |
| md 19 | yönetmeliği İçişleri Bakanlığı çıkarır | resmî [84] | "işlenişine iştirak etmemiş olmak" → yedek Y2 |
| md 20 | konut; araç gereç; yönetmelik; gizlilik; silah kullanma (ayrılmış olsalar dahi; eş ve çocuk) | resmî [83], [85]; 3713-p2-03 | Dolu (üç soru; ikisi ikiz) |
| md 20/A | iki yıl; hukuk mahkemesi | 3713-p2-04 | Karar mercii varsayılan (sulh ceza hâkimi); açılmaz |
| md 21 | kapsam (yurt dışı; sıfat kalkmış; görev kazası); kira yardımında görüş | 3713-p2-05; resmî [87] | Dayanak kanun (2330) yalnız p2-05 ve p2-07 açıklamasında → yedek Y1 |
| md 22 | tedavi; Fon; ilk ve orta öğrenim | 3713-p2-06 | Dolu |
| Ek 1 | iki kişi – bir kişi | 3713-p2-07 | Dolu; kalan liste ve kurum adları |
| Ek 2 | "teslim ol" emrine itaatsizlik → doğrudan ve duraksamadan | 3713-p2-08 | Dolu (PVSK md 16 ile ayrım bu soruda kurulu) |
| Ek 3, Ek 4, Geçici | — | yok | Mali ayrıntı; iptal; kapsam dışı |

**Komşu tabanlar.**
- 2911 md 33 (yüzünü örterek ve demir çubukla katılma), md 34/A (çocuklar hakkında 3713 md 2/2 uygulanmaz), md 32: bankada. 3713 md 7/3 ile 2911 md 33 arasındaki ayrım tek kanun sorusuyla ölçülemez.
- 1481 Ek 1 (resmî soru: ödül miktarını İçişleri Bakanlığı belirler) ve PVSK Ek 9 (ödül; kimliğin rızasız açıklanamaması; avukat ücreti): bankada. md 19 için çakışma tabanı bunlardır.
- 6136: "3713 kapsamındaki suçtan mahkûm olana af olsa da hiçbir zaman izin verilemez" (3713 diğer konu [9]). Ek 4'ün komşusudur; Ek 4'ü ayrıca gereksiz kılar.
- CMK: terör suçlarında tutukluluk süreleri ve müdafi yasağı (diğer konu [1]–[3], [8]); 3713 metninde karşılığı yok.
- 5233: bankada yalnız üç resmî soru (3713 başlığı altında); 21–23 Kas turlarının 5233 adayları `aday/5233-p1.json`'dadır, bu turda tek tek açılmadı.

## A.§3 Madde madde değer tablosu (ölçülmemiş yönler)

| md | Açı | Değer | ◆ | [K→K] | Vars. | Not |
|---|---|---|---|---|---|---|
| 7/4 | F, A: propaganda suçunun dernek, vakıf, siyasî parti, işçi ve meslek kuruluşlarına ait yerlerde, öğretim kurumlarında ya da öğrenci yurtlarında işlenmesi → cezanın **iki katı** | **O/Y** | ◆ | evet (yer → oran) | **Y**: Kanunun öbür üç artırım hükmünde oran "yarı"dır | **A1.** Resmî [86] aynı maddeden ceza değeri sordu |
| 21/1 | M, A: terör eylemine muhatap olan kamu görevlisi hakkında Nakdi Tazminat ve Aylık Bağlanması Hakkında Kanun hükümleri uygulanır | O | ◆ | evet (zarar görenin sıfatı → rejim) | Y: adında "terör … zarar" geçen 5233; ya da md 22'nin Fonu | Y1. Atıf ezberi sınırında |
| 19/1 | Ş: ödül "işlenişine iştirak etmemiş olmak koşuluyla" | O | ◆ | — | **D**: suç ortağına ödül verilmez | Y2 çekinceli |
| 7/1 son cümle | K: örgütün faaliyetini düzenleyenler de yönetici olarak cezalandırılır | O− | — | — | D: düzenleyen yöneticidir | Y3 zayıf |
| 7/2 | F: basın ve yayın yoluyla → yarı artırım; haber verme ve eleştiri sınırı | D | — | — | D | Varsayılan oran; yazılmaz. A1'de çeldirici kaynağı |
| 8/A | F: kamu görevinin sağladığı nüfuz → yarı | D | ◆ | — | D | Varsayılan oran; yazılmaz |
| 6/1 | K: "isim ve kimlik belirterek veya belirtmeyerek"; üç seçimlik fiil | D/O | ◆ | — | D | Ceza bankada; kalan unsur sağduyu |
| 1 | K: "bir örgüte mensup kişi veya kişiler" | D | — | — | — | md 2/2 ile gerilim; yazılmaz |
| 3 ↔ 4 | A: doğrudan terör suçu ↔ örgüt faaliyeti çerçevesinde işlenirse | O | — | — | D: "Devlete karşı suç" adı taşıyan şık | İki banka sorusu birlikte ölçüyor; md 3 suç adları sezgiyle ayrılır; numara ⚑ |
| 15/1 | K: yararlananlar (TSK personeli, mülki idare amirleri, istihbarat ve kolluk görevlileri, görevlendirilen diğer personel) | D | ◆ | — | D | Liste; "sayılmamıştır" için kapalı liste değil ("diğer personel") |
| 15/2 | M: yönetmelik Millî Savunma ve İçişleri bakanlıklarınca müştereken | D | — | — | — | Yönetmelik çıkarma yetkisi (03 brifi: yazılmaz) |
| 20/3 | K: tedbir türleri (estetik cerrahi dâhil; talep hâlinde) | D | — | — | — | Ayrıntı; 5726 bankasında tedbir listesi var |
| 20/A/1 | M, K: karar mercii; şerh konulabilecek mallar | O− | — | — | D (sulh ceza hâkimi) | Varsayılan merci; mal listesi CMK 128 ⚑ ile karışır |
| 20/A/2–3 | usul: ilan, maktu vekâlet ücreti | D | — | — | — | Hukuk yargılaması |
| 21 bentler, Ek 1, Ek 3 | oran, süre, gösterge, hak sahipleri | — | — | — | — | Yasak (08 eki); ölü bent atıfları |
| 22 | Fon Kurulu | — | — | — | — | Eski kurum |
| Ek 4 | silah ruhsatının iptali | — | ◆ | — | — | AYM; kullanılmaz |

## A.§5 Ayırt etme malzemesi

- **Artırım ızgarası** ◆: md 5/1 yarı (bankada, iki soru) · md 5/2 "üçte ikisinden az olamaz" (iki okumalı; yalnız çeldirici olabilir, o da değerin kendisiyle, bağlamı anılmadan) · md 7/2 basın ve yayın yoluyla yarı · md 7/3 alt sınır dört yıl (bankada) · **md 7/4 iki katı** · md 8/A yarı. "Yarı" üç hükmün oranıdır (5/1, 7/2, 8/A); 7/4 tek ayrıksı değerdir.
- **Zarar gören kim, hangi rejim** ◆: kamu görevlisi → md 21 → Nakdi Tazminat ve Aylık Bağlanması Hakkında Kanun · yaralanan ve zarar gören diğer kişiler → md 22 (tedavi Devletçe; Fondan öncelikli yardım; bankada) · gerçek kişilerin ve özel hukuk tüzel kişilerinin maddî zararı → 5233 (sulh; 5233 bankası) · suçtan doğan zararın failden tazmini için tedbir → md 20/A (bankada).
- **Üç ödül hükmü** ◆: 3713 md 19 (iştirak etmemiş olmak; ortaya çıkarma, delil, yakalama, yer ve kimlik bildirme; yönetmelik İçişleri) · 1481 Ek 1 (İçişleri Bakanlığınca belirlenecek kişiler; ödül verilene koruyucu tedbir) · PVSK Ek 9 (ilan edilmek suretiyle arananlar; kimlik rızasız açıklanamaz). Üçünde de merci İçişleri Bakanlığıdır ve üçü de bankadadır; ayırt edici tek unsur 3713'ün "iştirak etmemiş olmak" koşuludur.
- **Kimliğin korunması**: md 14 (muhbir; iki istisna; bankada) · md 6/1 (terörle mücadelede görev almış kamu görevlisi; açıklamak suç) · md 6/3 (muhbirin kimliğini açıklamak suç) · md 20/4 (koruma tedbirinde gizlilik). Hepsi bankada önerme ya da şık olarak geçti; yeni yuva yok.

## A.§6 Kaçınılacaklar (BAĞLAYICI)

- **İptal ve ölü hükümler:** md 7 son fıkra; Ek 4; md 4/ç ve 4/d; md 9–13, 16, 18; md 20'nin korunanlar listesi; md 6/4'te "sahipleri"; Geçici maddeler.
- **RED almış hükümler (yeniden önerilmez):** md 5/2; md 8/B; md 7 son fıkra; md 7/4'ün **"hangi yerde" (liste) biçimi**. A1 aynı fıkranın ters yönüdür ve bu yüzden çekincelidir; orkestratör "RED alan hüküm" kuralını fıkra düzeyinde uygularsa A1 de düşer ve 3713 partisi boş kalır.
- **İki okumalı:**
  - md 5/2 "sadece bu madde hükmüne göre".
  - md 1 ("bir örgüte mensup kişi veya kişiler tarafından") ↔ md 2/2 ("örgüte mensup olmasa dahi").
  - md 14 "ihbarın mahiyeti haklarında suç teşkil etmedikçe" (3713-p2-01'de iki okuma lafzın korunmasıyla kapatıldı; ikinci bir soru açmaz).
  - md 7/4 "ikinci fıkrada belirtilen suçların": 7/2-b'deki amblem ve slogan fiilleri dâhil mi (lafzen evet), yayın sorumlusunun adlî para cezası dâhil mi (belirsiz). Vaka yalnız propaganda fiiliyle kurulur.
  - md 7/4 "bu fıkradaki cezanın iki katı": basın yoluyla artırılmış ceza mı, temel ceza mı. Vaka basın ve yayın yoluyla işlenen fiille kurulmaz.
  - md 7/4 yerin "ait" olması: kiralanmış yer, vakıf üniversitesi yurdu. Vaka sahipliği açık bir yerle (öğrenci yurdu, bir derneğe ait lokal) kurulur; "üniversite" yazılmaz ("öğretim kurumu" kapsamı ⚑).
  - md 21/1 ↔ 5233: kamu görevlisinin 5233'e de başvurup başvuramayacağı metinde açık değil (5233 md 2/2-a yalnız "Devletçe başka bir şekilde karşılanan zararlar"ı dışlar). Y1'de kök "3713 sayılı Kanun'a göre … hakkında hangi Kanun hükümleri uygulanır" diye kilitlenir; "5233 uygulanmaz" yargısı açıklamada kurulmaz.
- **Metin dışı (⚑):** TCK madde içerikleri; 2330'un tazminat ve aylık kuralları; 5275 md 107, 108; ödül ve avukat ücreti yönetmelikleri (kamu görevlisinin ödül alıp alamayacağı yönetmelik konusudur: Y2'de "kamu görevlisi olmamak" şıkkı ikinci doğru riski taşır, **doğrulanamadı**); CMK 128; Yargıtay'ın propaganda içtihadı.
- **Sayı ve kurum:** md 21, Ek 1, Ek 3'ün bütün oran, süre ve göstergeleri; eski kurum adları.
- **Varsayılan cevaplı:** artırım "yarı" (7/2, 8/A); yönetmelik "İçişleri Bakanlığı" (19, bankada); tedbir mercii "sulh ceza hâkimi" (20/A).

## A.§7 Yuva listesi: `3713-p3` (tavan 2; gerçekçi 0–1)

| # | Hüküm | Ölçülecek ayrım | Önerilen biçim | Yanlışa çeken alışkanlık / komşu hüküm | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| **A1** (çekinceli) | ◆ md 7/4 (↔ 7/2, 5/1, 8/A, 7/3) | Yer → ceza oranı: propaganda suçunun sayılan yerlerden birinde işlenmesi hâlinde 7/2'deki cezanın iki katına hükmolunur | Kısa vaka (partide tek): sahipliği tartışmasız bir yerde (öğrenci yurdu ya da bir derneğe ait lokal) propaganda; "ceza bakımından hangisi doğrudur". Doğrudan kök de olur. Zorluk orta/zor | "Yarı oranında artırılır" (5/1, 7/2, 8/A'nın gerçek değeri; en güçlü) · "alt sınır dört yıldan az olamaz" (7/3'ün gerçek kuralı) · "üçte ikisinden az olmamak üzere artırılır" (5/2'nin değeri) · "artırım yapılmaz; bin günden beş bin güne adlî para cezası ayrıca verilir" türü yayın sorumlusu karışımı (zayıf; yerine "üçte bir" uydurması konabilir, partide en çok bir) | (1) Aynı fıkra ilk turda RED aldı; gerekçe şık bloğuydu, yön değişti; karar orkestratörün. (2) 3713-p1-04'ün açıklaması "iki kat yalnız 7/4'te" der: banka açıklaması sızıntısı; kök sızıntısı değil. (3) "İki katı" şıklarda tek "kat" değeriyse üslupla sırıtır; ama "yarı" üç kanun hükmünün gerçek değeri olduğu için eksik bilen oraya gider — kör çözücü belirler. (4) Ceza oranı ezberi: resmî [86] emsali dışında sınav değeri 3'te kalabilir. (5) §A.6'daki üç iki okuma vakada kapatılmalı | 3713-p1-12 (1–5 yıl), resmî [86] (alt sınır dört yıl), 3713-p1-04 (yarı) |

**Yedek (değer sırasıyla).**
- **Y1 — md 21/1 (↔ md 22, 5233):** terör eylemine muhatap olarak yaralanan kamu görevlisi hakkında hangi Kanun hükümleri uygulanır. Doğrudan kök; şıklar kanun ADIYLA. Çeldirici: Terör ve Terörle Mücadeleden Doğan Zararların Karşılanması Hakkında Kanun (ad benzerliği; en güçlü), Sosyal Yardımlaşma ve Dayanışmayı Teşvik Kanunu (md 22'nin Fonu), Emniyet Teşkilat Kanunu, Devlet Memurları Kanunu. Riskler: atıf ezberi (03 brifi "tarihî atıf" değil ama sınırda); cevap p2-05 ve p2-07'nin açıklamasında basılı; 5233'ün kamu görevlisine uygulanıp uygulanmadığı tartışması (§A.6). Sınav değeri 3–4: resmî [87] aynı maddeden daha ince bir ayrıntı sordu.
- **Y2 — md 19/1 (↔ 1481 Ek 1, PVSK Ek 9), çekinceli:** para ödülü verilebilmesi için aranan koşul. Çeldirici kaynağı komşu iki ödül hükmü ("ilan edilmek suretiyle aranma", "İçişleri Bakanlığınca belirlenmiş olma") ve md 14 ("kimliğin açıklanmasına rıza"). Risk: **ters ayırt etme** — hiç bilmeyen "suç ortağına ödül olmaz" der ve bulur; PVSK Ek 9'u bilen yanılır. Kör çözücü salt sağduyuyla buluyorsa RED. "Kamu görevlisi olmamak" şıkkı yazılmaz.
- **Y3 — md 7/1 son cümle, zayıf:** örgütün faaliyetini düzenleyen kişi hangi sıfatla cezalandırılır. Risk: sağduyu doğruya götürür; kolluk bağı yok; sınav değeri en çok 3. TCK bankasında aynı cümleyi ölçen soru aranmadı (`faaliyetini düzenleyen` ibaresi `mevzuat/*sorular*.txt` ve `aday/` altında geçmiyor; TCK'nın bütün bankası bu dizinde değil → **doğrulanamadı**).

**Başlangıç adaylarının akıbeti.** md 7/4 vaka → A1 (yön değiştirilerek, çekinceli). **Ek 4 → dışarıda** (AYM kısmi iptali; ikinci fıkra askıda; 6136 komşu sorusu).

**Dışarıda.** md 1, 2, 3, 4, 5, 6, 7/2–3, 7 son, 8/A, 8/B, 14, 15, 17, 20, 20/A, 22, Ek 1–4, bütün geçici maddeler, md 23–25.

**Parti kuralları.** Tek ya da iki soruluk parti: öncüllü yok, olumsuz kök yok, en çok bir vaka. A1 ile Y1 birlikte yazılabilir (temas yok). 09 brifi 22 Kas kural 6: tek soruluk partide üretici önce bankaya bakar; A1'in cevabı 3713-p1-04'ün açıklamasında geçtiği için orkestratör yuvayı bu aşamada da düşürebilir.

## A.§8 Üretici kuralları ve gözcü kontrol listesi (3713)

1. Dayanak yalnız §A "Metnin durumu"ndaki kullanılabilir çekirdektir. md 7 son fıkra, Ek 4, md 4/ç–d, md 20'nin listesi ve mülga maddeler şık, öncül ya da açıklama olmaz.
2. Kök "3713 sayılı Kanun'a göre," ile açılır; madde, fıkra, TCK numarası yazılmaz.
3. A1'de doğru şık metnin fiiliyle kurulur ("cezanın iki katına hükmolunur"). Çeldiricilerin en az üçü Kanunun gerçek değeridir. Açıklama, sayılan yerlerin tamamını bir kez yazar; 3713-p1-09'un RED gerekçesindeki "kamu binası" tartışmasına girmez.
4. Y1'de açıklama 2330'un içeriğini (tutar, oran) yazmaz; 5233'ün kapsamı hakkında yargı kurmaz.
5. Gözcü: (a) kör çözümde "yarı" mı "iki katı" mı seçiliyor — salt şıkla "tek ayrıksı değer" kestirmesi çalışıyor mu; (b) vaka §A.6'daki üç iki okumayı kapatıyor mu; (c) `-benzer.txt` taramasına 3713-p1-04 açıklaması, 2911 md 33 sorusu ve resmî [86] dâhil mi; (d) sınav değeri: ceza oranı ezberi 3'ün altındaysa RED; (e) Y2 yazılmışsa hiç bilmeyen aday buluyor mu.

---

# B. 6222 sayılı Sporda Şiddet ve Düzensizliğin Önlenmesine Dair Kanun

## B. Metnin durumu (BAĞLAYICI)

### Resmî metne erişim ve karşılaştırma

- Erişildi. Konsolide metin, 26 dipnot ve değişiklik tablosu indirildi.
- Resmî metin 29 madde başlığı (md 1–27, 17/A, Geçici 1), banka 29; adlar eşleşir. **Ek madde yok.**
- Betik karşılaştırması: **29 maddenin 29'u sözcük sözcük aynı.** Betiğin işaretlediği 28 "SON" farkının tamamı bir sonraki maddenin başlığı ya da bölüm adıdır.

### Değişiklik ve AYM kayıtları

| Değişiklik | Kapsam | Bankada |
|---|---|---|
| 6259 (10/12/2011) | md 11 (şike cezası beş–on iki yıldan bir–üç yıla; 11/9–11 eklendi), 13, 14, 15, 16, 23 | işlenmiş; md 13–16'nın bugünkü değerleri 7182'dendir |
| 6290 (2012) | Geçici 1 | işlenmiş ("(…)") |
| AYM 12/11/2015, E. 2014/196, K. 2015/103 (yürürlük 16/12/2015) | md 5/11-c'de bir cümle iptal | gövdede "(İptal cümle: …)" şerhi var; iptal edilen cümlenin içeriği metinde yok → **5/11-c'nin veri paylaşımı kuralı kullanılmaz** (iptalin kapsamı metinden okunamıyor, **doğrulanamadı**) |
| KHK 698 (2018) | md 24 | 7182 ile yeniden yazıldı |
| **7182 (4/7/2019; yürürlük 12/7/2019)** | md 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 17/A, 18, 19, 20, 21, 22, 23, 24 | **tamamı işlenmiş** (26 dipnotun 20'si bu Kanundan; ibare değişiklikleri banka metninde betik karşılaştırmasıyla doğrulandı) |
| **7405 (22/4/2022; yürürlük 26/4/2022)** | md 3-h "spor kulübü" tanımı | işlenmiş |

- Tablonun son satırı 7405'tir. 2023–2026 için resmî tabloda kayıt yok; Resmî Gazete ayrıca taranmadı (**doğrulanamadı**).
- **Güncel lafız doğrulamaları (resmî metinle aynı):**
  - Elektronik bilet (5/4): futbolda en üst lig ile bir altındaki lig; kartta ad, soyad, T.C. kimlik numarası ve fotoğraf; usul ve esaslar Hazine ve Maliye Bakanlığınca; giriş kontrolü ev sahibi kulüpte, millî müsabakada federasyonda. Tanım (3-o): bilet = elektronik bilet veya giriş hakkı veren belge.
  - Seyirden yasaklanma (18/1): infaz tamamlandıktan itibaren bir yıl; ikinci kez üç, üçüncü kez beş yıl (2019). 18/3: soruşturma başlatılınca derhal. 18/5 son cümle (2019): kararlar işlemi yapan kolluk birimine derhâl bildirilir, kollukça bilgi bankasına işlenir. 18/7: "müsabaka, antrenman ve seyir alanlarına alınmaz" (2019).
  - Karakola başvuru (18/8): müsabakanın başlangıç saatinde ve bundan bir saat sonra, bulunduğu yere en yakın genel kolluk birimi; biyometrik yöntem (2019). 18/9: "her bir müsabaka için" (2019) yirmi beş günden az olmamak üzere adlî para cezası.
  - md 22/3: idari tedbir olarak yasak "bir yıl" (2019; önce üç ay). md 23/1: "Hakimler ve Savcılar Kurulunun … asliye ceza mahkemeleri" (2019).
- **Eski değerler yalnız çeldirici olur, o da dikkatle:** şike beş–on iki yıl; tezahürat on beş gün; 22/3 üç ay; 23/1 "sulh", "ağır ceza"; md 12/3'ün "çevresinde ve güzergâhında" ibaresi (2019'da "alanında" oldu, tanım genişledi).
- **TL tutarları (md 11/7, 21, 22) hiçbir yerde kullanılmaz** (yeniden değerleme ⚑). md 27 "Bakanlar Kurulu".

### Ad ve atıf kuralı (BAĞLAYICI)

| İbare | Kural |
|---|---|
| spor alanı (3-g; geniş: güzergâh, taraftarların toplandığı yerler, toplu seyahat araçları, kamp yerleri) ↔ müsabaka alanı (3-f) ↔ seyir alanı (3-l) ↔ özel seyir alanı (3-m) ↔ antrenman alanı (3-n) | Beş terim ayrı tutulur; hükmün kullandığı terim korunur. "Stat", "tribün" vakada kullanılabilir; şıkta terim yazılır |
| genel kolluk görevlileri · özel güvenlik görevlileri · belediye zabıtası (yalnız 12/5) · müsabaka güvenlik amiri ve yardımcısı · spor güvenlik birimi · merkezi spor güvenlik birimi | Korunur. "Polis" vakada yazılabilir; şıkta "genel kolluk" |
| güvenlik tedbiri (18/1) ↔ koruma tedbiri (18/3) ↔ idari tedbir (22/3) | Üçü ayrı tutulur; "tedbir" tek başına YASAK. 18/7'deki yasağın türü metinde yazmaz (§B.6) |
| "seyirden yasaklanma" / "spor müsabakalarını seyirden yasaklama" | Korunur; "stada giriş yasağı" yazılmaz |
| Bakanlık | Gençlik ve Spor Bakanlığı (3-b). "Genel Müdürlük" hiç yazılmaz |

## B.§1 Resmî sorular

| No | Sınav | Hüküm | Açı |
|---|---|---|---|
| 181 | PAEM 8 (2024) | md 4/1: il spor güvenlik kuruluna kim başkanlık eder | M; doğrudan; cevap vali (varsayılan) |
| — | Arama Yönetmeliği md 23 (resmî; `arama-mevcut-sorular.txt`) | stadyum ve turnike girişinde üst araması: mülki amirin yazılı izni | M; 6222 md 12/2'nin aynası |
| — | bankada "güvenlik görevlileri sayısını kim belirler" | md 7/4 | M; resmî korpusta yok, kaynağı **doğrulanamadı** |

**Çıkarım.** PAEM 6222'yi bir kez, en basit merci sorusuyla sordu. Resmî üslup "kim" sorusudur; ama bu Kanunda "kim" sorularının varsayılan cevapları (vali, il veya ilçe spor güvenlik kurulu, mülki amir, Cumhuriyet savcısı) bankada tükenmiştir. Kalan değer, kolluğun sahada verdiği kararı değiştiren **koşul → sonuç** hükümlerindedir (md 18).

## B.§2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Ölçülen yön | Soru | Kalan boşluk |
|---|---|---|---|
| md 4/1 | başkan; üyeler ("SAYILMAMIŞTIR": taraftardan sorumlu kulüp temsilcisi) | resmî [181]; 6222-p1-01 | 4/2 ilçe kurulu: varsayılan (kaymakam) |
| md 6/3, 6/4, 7/2, 7/3, 7/4 | güvenlik amiri sayıyı her zaman artırır (doğru şık); ateşli silah yasağı, gözlemcinin deplasman görevi, görevde olmayan kolluğu görevlendiren merci, emir ve denetim (çeldirici) | 6222-p1-02; "sayıyı kim belirler" sorusu | 6/3'ün süre, ödeme ve oran ayrıntısı |
| md 11 | teşvik primi indirimi; anlaşma = tamamlanmış; seçenek yaptırım ve erteleme yok; CMK 135 | 6222-p1-03, -04 | 11/4, 11/6, 11/7, 11/8, 11/10, 11/11 |
| md 12/2 | — | 6222-p1-05 **RED** (Arama Yön. md 23 mükerreri) | Kapalı. 12/3 (güzergâhta önleme araması) `6222-diger-konu` [2]'de |
| md 12/1-a | spor karşılaşması yerinde ruhsatlı silah | 6136 Ek 1 bankası (dört soru) | Kapalı |
| md 13 | 13/4 (vaka); 13/2, 13/3, 13/5 şık olarak | 6222-p1-06 | 13/6 (alkol, uyuşturucu: otuz gün) |
| md 14/1 | hedef aranmaz; şikâyet aranmaz; adlî para | 6222-p1-07 | 14/2 açıklamada basılı |
| md 15/1 | yasaklı kişi: iki yüz gün | 6222-p1-08 | 15/2, 15/4, 15/5, 15/6 |
| md 16 | 16/1 (vaka); 16/2 şık olarak | 6222-p1-09 | Dolu |
| md 17 | kamu malı hükmü; müteselsil sorumluluk; rücu; şikâyet | 6222-p1-10 | Dolu |
| md 18/1 | ikinci kez üç yıl | 6222-p1-11 | "ceza verilmesine yer olmadığı kararı" kolu |
| md 18/3 | derhal uygulanır (doğru şık); 18/2, 18/4, 18/5-b çeldirici | 6222-p1-12 | **kaldırma mercii** (kök ve şıkta yok; açıklamada "kaldırılmasına karar verilmedikçe") |
| md 18/8 | saatler; en yakın genel kolluk birimi | 6222-p1-14 | 18/9 açıklamada basılı |
| md 20 | (TCK sorusunda yanlış önerme: "hakem ve gözlemciler bütün görevleri bakımından kamu görevlisidir") | `5188-diger-konu` [22] | Yön ayrımı doğrudan sorulmamış |
| md 23/2, 23/3 | CMK 135; idari yaptırımda Cumhuriyet savcısı | 6222-p1-04, -13 | 23/1 görevli mahkeme |
| **Hiç ölçülmemiş** | md 5, 8, 9, 10, 17/A, **18/6, 18/7**, 18/10, 19, 21, 22 | — | §B.3 |

## B.§3 Madde madde değer tablosu (ölçülmemiş yönler)

**Seyirden yasaklanma (md 18, 22)**

| md | Açı | Değer | ◆ | [K→K] | Vars. | Not |
|---|---|---|---|---|---|---|
| **18/6** | Sn, A: kamu davasının açılmasının ertelenmesi, hükmün açıklanmasının geri bırakılması, seçenek yaptırım ya da erteleme → kararın kesinleştiği tarihten itibaren **bir yıl süreyle tedbire devam**; önödemede ödeme tarihinden | **Y** | ◆ | evet (kararın türü → tedbirin akıbeti) | **Y**: "ceza yoksa tedbir kalkar" (CMK 231 alışkanlığı); "denetim süresince sürer" | **B1.** 18/5 (KYOK, beraat, düşme → derhal kalkar) ile gerçek ayrım; dört çeldirici gerçek komşu değer |
| **18/7** | F, Sn, A: alkol ya da uyuşturucu etkisinde olduğu açıkça anlaşılan kişi alınmaz; girer ve çıkmamakta ısrar ederse zor kullanılarak çıkarılır **ve bir yıl süreyle seyirden yasaklanır** | **Y** | ◆ | evet (hâl → sonuç) | — : ilk yarı D (dışarı atılır), ikinci yarı Y | **B2.** Komşular: 21/4 (yalnız çıkarılır), 13/6 (alkol sokan: adlî para), 5/7 (bekletme odası) |
| 18/3 son cümle, 18/5-a | M: koruma tedbirini soruşturma evresinde Cumhuriyet savcısı, kovuşturma evresinde mahkeme kaldırır | O/Y | ◆ | evet (evre → merci) | — : CMK alışkanlığı "sulh ceza hâkimi" (Y); "6222'de savcı" sezgisi (D) | **B3 çekinceli** |
| 18/9 | F: başvuru yükümlülüğüne aykırılık → her bir müsabaka için adlî para cezası | O | ◆ | evet | Y: "imzaya gelmeyen tutuklanır" (CMK 109), "yasak uzar" | Yedek. Cevap 6222-p1-14'ün açıklamasında basılı |
| 22/3 | K, A: şiddeti teşvik eden açıklama → idari para cezası + **idari tedbir** olarak bir yıl yasak; süre kararın verildiği tarihten | O | — | evet | — | Yedek (B1 düşerse). Kolluk bağı zayıf |
| 18/1 | S: "ceza verilmesine yer olmadığı kararı" → hükmün kesinleşmesinden bir yıl | O− | — | — | — | B1'in çeldirici kaynağı; ayrı yuva değil |
| 18/2 | K: alan dışında taraftar gruplarınca işlenen üç suç | O | ◆ | — | — | 6222-p1-12 C'de basılı; liste |
| 18/4 | M: bilgi bankası EGM'de; kulüp ve federasyon erişir | O | ◆ | — | — | 6222-p1-12 E'de ters yüzüyle basılı |
| 18/10 | Sn: yasaklı kişi yönetici, hakem, temsilci, gözlemci olamaz | D | — | — | D | Kolluk dışı |

**Kolluğun sahadaki işlemleri (md 3, 5–7, 9, 12, 20, 21)**

| md | Açı | Değer | ◆ | Vars. | Not |
|---|---|---|---|---|---|
| 20 | K, A: hakem, gözlemci, saha komiseri ve temsilci, görevleriyle bağlantılı olarak **kendilerine karşı işlenen suçlar** bakımından kamu görevlisi sayılır | O/Y | ◆ | Y: 5188 md 23'ü bilen "işledikleri suçlar bakımından da" der | Yedek Y1. İki uç + kapsayıcı şık yapısı riski |
| 12/1 son cümle | M: alkollü içeceğin sokulması, kullanılması ve satılmasına ilişkin usul ve esasları **ilgili federasyonlar** belirler | O | ◆ | Y: "alkol kanunen yasaktır"; "il veya ilçe spor güvenlik kurulu" | Yedek Y2 |
| 3-g + 14/1 | K: gidiş ve geliş güzergâhı, toplu seyahat aracı, taraftarların toplandığı yer "spor alanı"dır; tezahürat hükmü orada da işler | O | ◆ | Y: "stat dışında 6222 uygulanmaz" | Yedek Y4. 18/2 ile ilişki iki okumalı |
| 12/5 | F: genel kolluk ve belediye zabıtası, (b) ve (c) bentlerindeki maddeleri seyyar satanı alandan uzaklaştırır | O− | ◆ | D | 13/3 (seyircilere temin eden: iki–beş yıl hapis) ile **iki okumalı**; dışarıda |
| 6/3 kırk sekiz saat | S | D | ◆ | **D**: polis mevzuatının en sık süresi (2911 bildirimi) | Dışarıda |
| 6/3 görevde olmayan kolluk | S, M: üç kat harcırah; federasyon yatırır, kulübün alacağından mahsup eder; sayının yarısı, yüksek riskli müsabakada üçte ikisi | O− | ◆ | — | "Ödeme usulü ezberi"; "kim öder" iki okumalı (yatıran federasyon, yük kulüpte). Dışarıda |
| 3-e | M: müsabaka güvenlik amirini mülki idare amiri görevlendirir | D | ◆ | D | 09 brifi 22 Kas kural 5; dışarıda |
| 3-d ↔ 3-ğ, 7/2 | K, M: merkezi spor güvenlik birimi (EGM) ↔ spor güvenlik birimi (il ve ilçe emniyet müdürlükleri veya jandarma komutanlıkları); gözlemciyi spor güvenlik birimi amiri görevlendirir | O− | ◆ | — | Tanım eşleştirme; gözlemci kuralı 6222-p1-02 açıklamasında basılı. Dışarıda |
| 5/4 | M: izleyicilerin (kart) kontrolü ev sahibi kulüpte | O− | — | Y | "Kontrol" 12/2'deki üst kontrolüyle karışır: iki okumalı. Dışarıda |
| 5/3-b, 5/5, 7/4, 10 | M: il veya ilçe spor güvenlik kurulu | D | — | D | Varsayılan |
| 5/7 | S: bekletme odası (azami yirmi kişi, en az iki); görüntülerin bir örneği spor güvenlik birimine, federasyona ve iki kulüp temsilcisine | D | ◆ | — | Sayı ezberi |
| 5/11-a | M: kart veri tabanı federasyonda; Hazine ve Maliye ile İçişleri erişir | O− | — | — | 18/4 ile takası bankada çeldirici |
| 9 | Sn: temsilci bildirilmezse yükümlülük başkan ve bütün yönetim kurulunda | D | — | D | Kolluk dışı |
| 21/4 | F: başka yere oturmakta ısrar eden zor kullanılarak çıkarılır | D | ◆ | D | Tek başına yazılmaz; B2'nin karşı ucu |

**Suçlar ve usul (md 11, 13–17/A, 23)**

| md | Açı | Değer | Vars. | Not |
|---|---|---|---|---|
| 14/2 | F, A: din, dil, ırk, etnik köken, cinsiyet veya mezhep farkı gözeterek hakaret → bir yıldan üç yıla hapis (14/1 adlî para) | O | Y | Yedek Y5. Cevap 6222-p1-07'nin açıklamasında basılı; bankada üç ceza miktarı sorusu var |
| 11/8 | İ: müsabaka yapılmadan önce suçun ortaya çıkmasını sağlayana ceza verilmez | O | Y: TCK'nın "soruşturma başlamadan önce" kalıbı | Zayıf yedek; kolluk bağı yok; md 11 bankada iki soru |
| 15/6 | F: yetkisiz yerde ya da değerinin üstünde bilet satışı → hapis ve adlî para (suç) | O | Y: "seyyar satış kabahattir" | Zayıf yedek; ceza türü yuvası (09 brifi 26 Kas kural 2) ve iki kademeli ceza |
| 15/2, 15/4, 15/5 | F | O− | — | 15/4 ("kullandıran") ↔ 15/5 ("devreden") iki okumalı; dışarıda |
| 13/6 | F: otuz gün adlî para | D | — | Ceza ızgarası 6222-p1-06'da kurulu; B2'de çeldirici |
| 13/1 ↔ 12/1-a | — | — | — | Ruhsatlı silah yasak (12/1-a) ama 13/1 yalnız "bulundurulması esasen suç oluşturan" silahı 6136 Ek 1'e yollar: **iki okumalı**; dışarıda |
| 17/A/1 | F: yüzünü kapatarak işleme → yarı artırım | D | D | Varsayılan oran; dışarıda |
| 17/A/2 | Sn: bir yıl ve üzeri hapis → yönetim ve denetim organı yasağı; en çok beş yıl | D | — | Kolluk dışı |
| 23/1 | M: ihtisas mahkemesi olarak görevlendirilen asliye ceza mahkemeleri | D | D | Kolluğa dokunmaz (09 brifi 23 Kas kural 7) |
| 11/4, 11/6, 11/7, 11/10, 11/11 | F, İ | O− | — | Şike ayrıntısı; md 11 dolu; kolluk dışı |

## B.§5 Ayırt etme malzemesi

- **Yasağın üç türü ve bir belirsiz hâl** ◆

  | Tür | Ne zaman | Kim | Süre ve bitiş | Hüküm |
  |---|---|---|---|---|
  | güvenlik tedbiri | mahkûmiyet hükmünde | mahkeme | infaz tamamlandıktan itibaren bir yıl (ikinci kez üç, üçüncü kez beş); ceza verilmesine yer olmadığı kararında hükmün kesinleşmesinden bir yıl | 18/1 (bankada) |
  | koruma tedbiri | soruşturma başlatılınca derhal | kaldıran: soruşturmada Cumhuriyet savcısı, kovuşturmada mahkeme | kaldırma kararı, KYOK, beraat ya da düşme ile **derhal** | 18/3 (bankada), 18/5 |
  | (devam eden tedbir) | KDAE, HAGB, seçenek yaptırım, erteleme; önödeme | — | kararın kesinleştiği / önödemenin yapıldığı tarihten **bir yıl** | **18/6** |
  | idari tedbir | şiddeti teşvik eden basın açıklaması (fiil suç değilse) | Cumhuriyet savcısı (23/3; bankada) | kararın verildiği tarihten bir yıl | 22/3 |
  | (türü yazmıyor) | alkol ya da madde etkisinde olup çıkmamakta ısrar | metinde yok | bir yıl | **18/7** |

- **Seyirci dışarı çıkarılır; sonra ne olur** ◆: 21/4 (başka yere oturmakta ısrar: yalnız çıkarılır) ↔ 18/7 (alkol ya da madde etkisinde ve çıkmamakta ısrar: çıkarılır ve bir yıl yasaklanır) ↔ 13/6 (alkollü içecek ya da uyuşturucu SOKAN: otuz gün adlî para) ↔ 16/1 (yasak alana giren: hapis veya adlî para; bankada).
- **Kamu görevlisi sayılma yönü** ◆: 6222 md 20 (yalnız kendilerine karşı işlenen suçlar) ↔ 5188 md 23 (işledikleri suçlarda kamu görevlisi gibi cezalandırılır; karşı işlenen suçlarda da; 5188 bankasında) ↔ TCK'nın genel tanımı ⚑.
- **İki veri tabanı**: elektronik kart verisi federasyonda (5/11-a) ↔ yasaklılar bilgi bankası EGM'de (18/4). Bankada çeldirici olarak kullanıldı; yeni yuva değil.
- **Alan terimleri** ◆: spor alanı (en geniş) ⊃ müsabaka, seyir, antrenman alanı; özel seyir alanı ayrıdır. Arama (12/3), tezahürat (14), yaralama ve mala zarar (17) "spor alanı"na; yasak madde (12/1), usulsüz giriş (15), alkollü kişi (18/7) dar alanlara bağlıdır.

## B.§6 Kaçınılacaklar (BAĞLAYICI)

- **RED almış hüküm:** md 12/2 (yazılı emir; Arama Yön. md 23 mükerreri). 12/3 ve 12/4 de arama bankasındadır.
- **Bankada ölçülmüş:** §B.2'nin tamamı. Değerleri yeni sorunun açıklamasına da içerikle yazılmaz: ikinci kez üç yıl; başvuru saatleri; iki yüz gün; 23/3 Cumhuriyet savcısı; 13/4'ün cezası.
- **İki okumalı:**
  - **18/7'deki yasağın türü ve kararı veren merci** metinde yazmaz ("bu madde hükümlerine göre"). B2 yalnız SONUCU sorar; "kim karar verir", "hangi tedbir türü" sorulmaz; hiçbir soruda 18/7 "idari tedbir" ya da "koruma tedbiri" diye adlandırılmaz.
  - 18/7 "açıkça anlaşılan": alkol ölçümü ⚑; vaka "alkol etkisinde olduğu açıkça anlaşılan" ibaresini aynen kullanır.
  - 18/6 şike suçunda işlemez: 11/9 şike için HAGB, seçenek yaptırım ve ertelemeyi yasaklar. **B1'in vakası şike ile kurulmaz.**
  - 18/6 ↔ 18/1 son cümle: "bu fıkradaki bir yıllık süreler" yalnız birinci fıkrayı kademelendirir; 18/6'nın bir yılı tekrar hâlinde artar mı, metinde yok. B1 "ikinci kez" kurgusu taşımaz.
  - 18/5-a ↔ 18/3: kaldırma kararına itiraz mercii ⚑.
  - 12/5 ↔ 13/3; 15/4 ↔ 15/5; 12/1-a ↔ 13/1 (yukarıda).
  - 3-g "taraftarların sürekli veya geçici olarak gruplar hâlinde toplandıkları yerler": dernek lokali, kahvehane girer mi. "Spor alanı sayılmaz" yargısı hiçbir şıkta kurulmaz.
  - 18/2 "spor alanlarının dışında": 2019'da tanım genişledikten sonra neresi "dış"tır.
  - 14/2 "bir yıldan üç yıla hapis" (metinde "kadar" yok); TCK 216 ile ilişki ⚑.
  - 6/3 ödemeyi kim yapar (federasyon yatırır, kulübün alacağından mahsup eder).
  - 5/11-c: iptal edilen cümlenin kapsamı.
- **Varsayılan cevaplı:** vali, kaymakam (4); il veya ilçe spor güvenlik kurulu (5/3-b, 5/5, 7/4, 10); mülki amir (3-e, 12/2); kırk sekiz saat (6/3); "yarı oranında" (11/4, 14/3, 17/1, 17/A/1); Cumhuriyet savcısı (23/3; B3 için ayrıca aşağıda).
- **Sayı:** TL tutarları; bekletme odası kapasitesi; harcırah katı; ceza aralığı ızgarasının dördüncü sorusu (bankada 13, 15, 16 var).
- **Metin dışı (⚑):** Sporda Şiddet Yönetmeliği; federasyon talimatları (alkol satışı fiilen serbest mi); Passolig uygulaması; CMK 109, 231, TCK 75'in içeriği (yalnız çeldirici sezgisi olarak, madde numarası verilmeden); 5188 md 23'ün metni (yalnız çeldirici).
- **Düşük değerli:** md 1, 2, 8, 9, 10, 19, 24–27, Geçici 1; md 3'ün tanım eşleştirmeleri; 17/A/2; 18/10; 23/1.

## B.§7 Yuva listesi: `6222-p2` (tavan 4; gerçekçi 2–3)

| # | Hüküm | Ölçülecek ayrım | Önerilen biçim | Yanlışa çeken alışkanlık / komşu hüküm | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| **B1** | ◆ md 18/6 (↔ 18/5, 18/1, 22/3) | Kararın türü → tedbirin akıbeti: HAGB (ya da erteleme) kararında seyirden yasaklama, kararın kesinleştiği tarihten itibaren bir yıl sürer [K→K] Sn, A | Kısa vaka: bu Kanun kapsamındaki bir suçtan (şike DIŞI; ör. md 13/2 ya da 16) yargılanan ve hakkında koruma tedbiri uygulanan sanık için HAGB kararı verilmiştir; "tedbir bakımından hangisi doğrudur". Zorluk zor | "Derhal kaldırılır" (18/5'in gerçek sonucu; CMK 231 alışkanlığı; en güçlü) · "denetim süresi boyunca sürer" (HAGB alışkanlığı) · "kararın verildiği tarihten itibaren bir yıl" (22/3'ün gerçek başlangıcı) · "cezanın infazı tamamlandıktan itibaren bir yıl" (18/1'in gerçek başlangıcı) | (1) Üç "bir yıl" şıkkı aynı değeri üç başlangıçla taşır: "bir yıl" sayı olarak ele verir, ayrım başlangıca iner; iki "bir yıl" şıkkı yeter, üçüncü yerine "ikinci müsabaka gününe kadar" gibi uydurma konmaz — kalan yer 18/5 ve HAGB alışkanlığına bırakılır. (2) 6222-p1-12'nin açıklaması "bir yıl daha sürdüğü hâller altıncı fıkrada sayılmıştır" der ama hâlleri saymaz: sızıntı yok. (3) Vaka şike ile kurulmaz. (4) "HAGB'de infaz olmaz" sağduyusu 18/1 şıkkını eler; kabul edilebilir | 6222-p1-12 (D çeldiricisi: KYOK kolu), 6222-p1-11 (18/1 süresi) |
| **B2** | ◆ md 18/7 (↔ 21/4, 13/6, 5/7) | Hâl → sonuç: alkol ya da madde etkisinde olduğu açıkça anlaşılan, alana girmiş ve çıkmamakta ısrar eden kişi zor kullanılarak çıkarılır **ve** bir yıl süreyle seyirden yasaklanır [K→K] F, Sn | Kısa vaka (seyir alanında, alkol etkisinde olduğu açıkça anlaşılan, uyarıya rağmen çıkmayan seyirci); "bu kişi hakkında hangisi uygulanır". Zorluk orta | "Zor kullanılarak dışarı çıkarılır; başka yaptırım uygulanmaz" (21/4'ün gerçek kuralı; en güçlü) · "otuz gün adlî para cezası" (13/6: alkollü içecek sokan) · "müsabaka sonuna kadar bekletme odasında tutulur" (5/7'nin odası; kural uydurma, partide en çok bir) · "idari para cezası verilir" (kabahat sezgisi) | (1) **En kapsamlı şık kestirmesi**: doğru şık iki sonucu birleştiren tek şıksa salt şıkla bulunur. Çözüm: en az bir çeldirici de bileşik yazılır ("dışarı çıkarılır ve otuz gün adlî para cezası"), ya da kök çıkarılmayı verir ve yalnız "ayrıca" ne olacağını sorar. (2) Yasağın türü ve mercii sorulmaz (§B.6). (3) Kök "alınmaz" kuralını değil, girmiş ve ısrar eden kişiyi kurar. (4) "Bir yıl" değeri 6222-p1-11'in A şıkkıyla aynı; temas yok | yok (18/7 bankada hiçbir kök, şık ya da açıklamada geçmiyor) |
| **B3** (çekinceli) | ◆ md 18/3 son cümle, 18/5-a | Evre → merci: soruşturma evresinde koruma tedbiri olarak uygulanan yasağın kaldırılmasına Cumhuriyet savcısı karar verir [K→K] M | Doğrudan kök; "soruşturma evresinde" kaydı kökte. Zorluk orta | "Sulh ceza hâkimi" (koruma tedbirinin CMK'daki varsayılan mercii; PAEM adayının en güçlü alışkanlığı) · "tedbiri uygulayan kolluk biriminin amiri" · "mülki amir" · "il veya ilçe spor güvenlik kurulu" | (1) **Doğru şık bankadaki 6222-p1-13'ün doğru şıkkıyla aynı merci** (23/3): "6222'de savcı" sezgisi doğruya götürür; 6222-p1-13'ün "sulh ceza hâkimi" çeldiricisi de aynı. Kör çözücü bu sezgiyle buluyorsa RED. (2) Evre çifti (savcı ↔ mahkeme) iki seçenekli hükme yakın; kök evreyi sabitler, "mahkeme" şık olmaz. (3) B1 ile birlikte yazılırsa 18/5-a iki açıklamada geçer; sızıntı haritası aşağıda. (4) "Kim uygular" sorulmaz: tedbiri kimin uygulamaya koyduğu metinde yazmaz | 6222-p1-12 (başlama anı), 6222-p1-13 (23/3) |

**Yedek (değer sırasıyla).**
- **Y1 — md 20 (↔ 5188 md 23):** hakem, gözlemci, saha komiseri ve temsilciler hangi bakımdan kamu görevlisi sayılır. Doğru: görevleriyle bağlantılı olarak kendilerine karşı işlenen suçlar. Çeldirici: görevleriyle bağlantılı olarak işledikleri suçlar (5188 alışkanlığı), her ikisi, tazminat sorumluluğu, disiplin. Riskler: iki uç + kapsayıcı şık yapısı (09 brifi 22 Kas kural 1–2); `5188-diger-konu` [22]'nin B şıkkı "bütün görevleri bakımından … kamu görevlisidir" önermesini yanlış sayarak sınırı kısmen basıyor; "saha komiseri" 2019 eki. Vaka biçimi (hakeme saldıran seyirci ↔ menfaat alan hakem) ikinci kolda şikeye (md 11) kayar: yazılmaz.
- **Y2 — md 12/1 son cümle:** alkollü içeceğin sokulması, kullanılması ve satılmasına ilişkin usul ve esasları kim belirler. Doğru: ilgili federasyonlar. Çeldirici: il veya ilçe spor güvenlik kurulu (Kanunun varsayılan mercii), Gençlik ve Spor Bakanlığı (md 24), mülki amir, ev sahibi kulüp. Lehte: iki varsayılan da yanlışa götürür. Riskler: sınav değeri 3 (kurum içi düzenleme yetkisi; 03 brifi "yönetmelik çıkarma yetkisi" ölçütüne yakın); kolluğun işlemi dolaylı (13/6).
- **Y3 — md 18/9 (↔ CMK adlî kontrol alışkanlığı):** başvuru yükümlülüğüne aykırılığın yaptırımı (tür). Doğru: her bir müsabaka için adlî para cezası. Çeldirici: yasak süresinin uzaması, idari para cezası, tutuklama kararı verilebilmesi, kolluğun zorla getirmesi. Riskler: cevap 6222-p1-14'ün açıklamasında basılı; ceza türü yuvası (298'de aynı tip RED aldı); aynı denemede p1-14 ile yan yana gelmemeli.
- **Y4 — md 3-g + 14/1:** müsabakaya gidiş güzergâhında ya da taraftarların toplu seyahat ettiği araçta hakaret içeren tezahürat. Ölçülen: yerin "spor alanı" sayılması. Riskler: sonucu (şikâyet aranmaz, adlî para) 6222-p1-07 ölçtü — yeni soru yalnız yer unsurunu ölçmeli, şıklar yer ekseninde kurulmalı; 3-g ve 18/2 iki okumaları (§B.6); `6222-diger-konu` [2]'nin doğru şıkkı güzergâhı arama bakımından basıyor.
- **Y5 — md 14/2:** ayrımcı hakaret içeren tezahüratın cezası. Riskler: cevap 6222-p1-07 açıklamasında; bankada dördüncü ceza miktarı sorusu olur; metindeki "kadar" eksikliği.
- **Zayıf yedekler (yalnız parti iki sorunun altına düşerse):** md 22/3 (idari tedbir; B1 yazılmamışsa; B1 ile aynı süre ızgarası) · md 11/8 (müsabaka yapılmadan önce ortaya çıkarma; kolluk dışı) · md 15/6 (yetkisiz bilet satışı; ceza türü).

**Başlangıç adaylarının akıbeti (`durum.md` 491–496).**

| Aday | Karar | Gerekçe |
|---|---|---|
| md 18/7 | **B2** | Komşu iki gerçek kural; bankada hiç geçmiyor |
| md 20 | Yedek Y1 | TCK sorusunda kısmen basılı; iki uç + kapsayıcı yapı |
| md 12/1 son cümle | Yedek Y2 | Sınav değeri 3 |
| md 18/9 | Yedek Y3 | Açıklama sızıntısı; ceza türü yuvası |
| md 6/3 kırk sekiz saat | **Dışarıda** | En sık süre; bilmeyen de bulur |
| md 23/1 ihtisas mahkemesi | **Dışarıda** | Kolluğa dokunmaz; varsayılan (asliye ceza) |
| md 12/5 | **Dışarıda** | 13/3 ile iki okumalı; sağduyu |
| md 17/A | **Dışarıda** | 17/A/1 varsayılan oran; 17/A/2 kolluk dışı |

**Parti kuralları.**
- Kök tipi (B1, B2, B3): vaka 2, doğrudan 1. Öncüllü yok (4 soruluk partide 1/5 kuralı sıfır verir). Olumsuz kök yok. "Kısa doğrudan kolay soru" notu karşılanamıyor: bu Kanunda kalan kolay sorular varsayılan cevaplıdır.
- **md 18 yoğunluğu:** bankada dört md 18 sorusu var; üç asıl yuva yazılırsa yedi olur (18 sorunun yedisi). Kabul edilebilir: md 18 kolluğun bu Kanundaki asıl işidir; ama aynı kısa denemeye ikiden fazla md 18 sorusu düşmemeli (etiket notu).
- **Parti içi sızıntı:** B1 ↔ B3: ikisi de 18/5'e dokunur. B1'in şıklarında merci, B3'ün şıklarında süre geçmez; B1'in açıklaması "kimin kaldırdığını", B3'ün açıklaması 18/6'nın hâllerini içerikle yazmaz. B1 ↔ B2: ikisinde de "bir yıl" var; B2'nin açıklaması 18/6'yı, B1'in açıklaması 18/7'yi anmaz. B2 ↔ Y2: ikisi de alkol; birlikte yazılırsa Y2'nin açıklaması 18/7'nin sonucunu yazmaz.
- **Bankayla:** hiçbir açıklama "ikinci kez üç yıl"ı, başvuru saatlerini, 23/3'ü (B3'ün açıklaması dâhil: "idari yaptırımlara da savcı karar verir" cümlesi yazılmaz) içerikle tekrar etmez.

## B.§8 Üretici kuralları ve gözcü kontrol listesi (6222)

1. **Dayanak.** Yalnız güncel madde gövdesi. 2019 öncesi değerler (§B "Metnin durumu") doğru şık olmaz. TL tutarı hiçbir yerde yazılmaz.
2. **Terim.** Tedbir türleri ve alan terimleri §B ad kuralına göre. 18/7 hiçbir tedbir türüyle adlandırılmaz.
3. **Koşul → kural ekseni.** B1: kararın türü → tedbirin akıbeti. B2: seyircinin hâli → kolluğun işlemi ve sonucu. B3: evre → kaldırma mercii. Şıklar aynı karar uzayından gelir.
4. **Ters ayırt etme.** "6222'de savcı" (B3), "en ağır ve en kapsamlı sonuç" (B2), "bir yıl" (B1) kestirmeleri kör çözücüyle sınanır. Kör çözücünün kestirmesi yanlış şıkka gidiyorsa lehte kanıttır (09 brifi 20 Kas).
5. **Komşu kanun alışkanlığı** (09 brifi 26 Kas kural 2): B1'de CMK'nın HAGB sonucu, B3'te CMK'nın koruma tedbiri mercii, Y1'de 5188 md 23, Y3'te adlî kontrol. Alışkanlık çeldiricide yer alır; madde numarası ve kanun adı şıkka yazılmaz.
6. **Vaka.** En çok 250 karakter; unvanlı; kulüp, il ve kişi adı yok ("(K) Spor Kulübü" kalıbı bankadaki kullanımdır). B1'de suç şike olmaz. B2'de kişi alana GİRMİŞTİR ve çıkmamakta ısrar etmektedir.
7. **Gözcü.**
   - Kör çözüm: B2 salt şıkla "en kapsamlı şık" olarak, B3 "bu Kanunda savcı" sezgisiyle, B1 "bir yıl çoğunlukta" sayımıyla bulunuyor mu?
   - Mükerrer: `-benzer.txt` taramasına 6222 bankasının 15 sorusu, `arama-mevcut-sorular.txt` (md 23), `5188-diger-konu` [22], 6136 Ek 1 soruları ve `6222-diger-konu` [2] girer; **6222-p1'in açıklamaları da** taranır (18/9, 14/2, gözlemci, 18/5 orada basılı).
   - İki okuma: §B.6 listesi; özellikle 18/7'nin türü, 18/6'nın şikede işlememesi, 3-g.
   - Güncellik: 2019 öncesi değer doğru şıkta mı; "Genel Müdürlük", "sulh ceza mahkemesi" geçiyor mu.
   - Sınav değeri: 23/1, 17/A/2, 18/10, md 9, tanım eşleştirme ve TL tutarı en çok 2. md 18 yuvaları 4.
   - Şık takımı: B1'de aynı eksenin iki ucu + orta (09 brifi 22 Kas kural 1) doğuyor mu ("derhal kalkar" ↔ "denetim süresince sürer" ↔ "bir yıl sürer" tam bu yapıdır: orta yol doğru şık olur — orkestratör takımı gözcüye vermeden sayar; gerekirse "denetim süresince" şıkkı çıkarılır).

---

## Şüpheli noktalar (soru konusu olmaz; kullanıcıya bildirilir; hiçbir şey düzeltilmedi)

**Banka metni — 3713**
1. **Ek 1 gövdesinde dipnot metinleri.** Resmî metnin 22–32 numaralı dipnotları (6495, 6462, 6518, 7103, 7445, 7061, 6704, KHK 674, KHK 668, KHK 700 açıklamaları) ve "2425", "(…)2 5", "(…)3 1", "32" gibi dipnot imi artıkları madde gövdesine karışmış. Okuyan kullanıcı ve özet/kart üreticisi bunları kanun cümlesi sanabilir.
2. **md 20 beşinci fıkra:** "belirlenir.(11)" dipnot imi artığı.
3. **Geçici 10 ve Geçici 17'nin başlıkları** önceki maddenin iptal şerhinin kuyruğudur ("K.: 1992/20 sayılı Kararı ile.)", "E.:2018/73; K.:2019/65 sayılı Kararı ile)"). **md 13'ün başlığı** kırpık ("çevirme ve erteleme yasağı"; resmî başlık "Hükmün açıklanmasının geri bırakılması kararı verilmemesi, seçenek yaptırımlara çevirme ve erteleme yasağı").
4. **Görünmeyen iptaller:** md 7 son fıkra (TCK 314/3; AYM 2024) ve Ek 4 (AYM 2022; üç "(…)") gövdede yürürlükteymiş gibi duruyor. Ek 4'ün ikinci fıkrası iptal edilen "mülkiyetin kamuya geçirilmesi" mekanizmasına atıf yapıyor.
5. **Ölü atıflar (resmî metinde de aynı):** md 4/ç (4926 sayılı Kanun), md 4/d (Anayasa md 120), md 20 (Devlet Güvenlik Mahkemeleri, CMK md 250, HSYK, Ceza ve Tevkifevleri Genel Müdürü), md 21 (h), (i), (j) bentlerinde mülga (c) ve (d) bentlerine atıf, md 22 (Fon, Fon Kurulu), Ek 1 (Devlet Personel Başkanlığı, Aile ve Sosyal Politikalar Bakanlığı), md 25 (Bakanlar Kurulu).

**Bankadaki sorular — 3713**
6. **3713-p1-03 (md 4; 6136 suçu ne zaman terör suçu sayılır):** D çeldiricisi "Olağanüstü hâl ilan edilen bir bölgede işlendiğinde" md 4/d'ye dayanır. md 4/d, olağanüstü hâlin ilanına neden olan olaylara ilişkin suçları sayar; bölgede işlenen 6136 suçu bu bende girmez, anahtar (A) doğrudur. Ancak bent Anayasa md 120'ye atıf yapar; çeldirici ölü bir hükme yaslanıyor. Çekme gerektirmez; açıklama md 4/d'yi yürürlükte bir kural gibi anlatıyorsa gözden geçirilmeli (açıklama metni bu turda bu gözle okunmadı).
7. **Dört şıklı sorular: 10** (29 sorunun). md 6, md 7, md 15, md 17, md 19, md 20 (Misyon 2020 olanı), md 21 ve üç 5233 sorusu. Hepsi dört şıklı resmî sınavlardan (Misyon Koruma, JGK, İçişleri GYS).
8. **Mükerrer küme, md 20:** resmî [83] (PAEM 8) ve [85] (Misyon 2020) aynı cümleyi ("korumaya alınmış emekli personel … Cumhurbaşkanlığınca belirlenecek konutlar") aynı kökle ("yanlıştır") ve üç ortak önermeyle ölçüyor; 3713-p2-03 aynı maddeden üçüncü soru. Aynı denemeye düşmemeli. 3713-p1-04 ile -06 da aynı fıkrayı (5/1) ölçer (önceki turun notu).
9. **Yanlış konu etiketi: 4 soru.** 5442 sayılı Kanun sorusu (resmî [81]) ve üç 5233 sorusu (resmî [90]–[92]) "3713 Sayılı Terörle Mücadele Kanunu" konusunda duruyor; hiçbirinin 3713'te karşılığı yok. Ayrıca md 3'ü ölçen öncüllü soru ("I. Hükûmete karşı suç işlemek …") resmî korpusta bulunamadı ve madde bağı boş; anahtarı (E) md 3 listesiyle tutarlı görünüyor, ancak öncül adlarının TCK madde başlıklarıyla eşleşmesi bu turda metinden **doğrulanamadı** (TCK metni açılmadı).
10. **Resmî [87] (md 21/b, kira yardımı):** A şıkkı "Aile ve Sosyal Hizmetler Bakanlığı", kanun metni "Aile ve Sosyal Politikalar Bakanlığı" der; yönetmeliği çıkaran "Maliye Bakanlığı" da eski addır. Anahtar (Adalet Bakanlığı) etkilenmez; ad güncellemesi soruyla metin arasında uyumsuzluk bırakıyor.
11. **Resmî [88] (md 17):** doğru sayılan A önermesi "koşullu salıverilme oranı dörtte üç" 7242 (2020) metnidir ve bugünkü metinle uyumlu. md 17/1'in atıf yaptığı 5275 md 107/4 ve 108'in bugünkü içeriği bu turda denetlenmedi (**doğrulanamadı**).

**Banka metni — 6222**
12. Metin temiz. Küçük notlar: md 20 başlığında ve gövdesinde "gözlemci , saha" (virgülden önce boşluk; resmî metinde de); md 14/2 "bir yıldan üç yıla hapis" ("kadar" yok; resmî metinde de); md 5/11-c'de iptal şerhi gövdede (doğru yerde), iptal edilen cümle yok; md 27 "Bakanlar Kurulu"; md 21 ve 22'de 2011 ve 2019 TL tutarları.
13. **md 12/1-a ↔ md 13/1:** ruhsatlı ateşli silahın alana sokulması yasak; md 13/1 ise yalnız "bulundurulması esasen suç oluşturan silahlar" için 6136 Ek 1'e yollama yapıyor. Ruhsatlı silah için yaptırımın dayanağı doğrudan 6136 Ek 1 olmalı (bankadaki 6136 sorusu böyle kurulu). 6222 adıyla "ruhsatlı silah sokanın cezası" sorulmamalı.

**Bankadaki sorular — 6222**
14. **"Müsabakada görevlendirilecek güvenlik görevlileri Sayısı …" sorusu:** madde bağı boş; "Sayısı" büyük harfle; kök "özel güvenlik" demiyor. md 7/4 ÖZEL güvenlik görevlilerinin sayısını kurula verir; md 7/3 ise GENEL kolluk görevlilerinin sayısını artırma yetkisini müsabaka güvenlik amirine verir (bu, 6222-p1-02'nin doğru şıkkıdır). Kök "güvenlik görevlileri" dediği için E şıkkı ("Müsabaka Güvenlik Amiri") genel kolluk okumasında savunulabilir: **ikinci doğru şüphesi.** Soru resmî korpusta yok; kaynağı **doğrulanamadı**.
15. **6222-p1-02 ile 14. maddedeki soru aynı denemede:** biri "sayıyı kurul belirler", öbürü "güvenlik amiri sayıyı her zaman artırır" der; yan yana geldiklerinde birbirinin ayrımını ele verir.
16. **`5188-diger-konu` [22] (TCK başlığı; "kamu görevlisi kavramı"):** B önermesi 6222 md 20'yi "hakem ve gözlemciler bütün görevleri bakımından kamu görevlisidir" diye yanlış önerme yapıyor; md 20 ile uyumlu. D önermesi ("Özel güvenlik görevlileri … bütün suçlarda kamu görevlisi sayılmaz") çift olumsuzlu ve 5188 md 23 karşısında okunması güç; anahtar (C) bu turda denetlenmedi (**doğrulanamadı**).
17. **Açıklama yoğunluğu:** 6222-p1-07, -12, -13 ve -14'ün açıklamaları komşu fıkraların kurallarını (14/2, 14/3, 18/4, 18/5, 18/9, 19, 22/1) içerikle basıyor. Bu, ikinci dalgada Y3 ve Y5'i zayıflatan asıl etkendir; kusur değil, ama aynı maddeden yeni soru açarken hesaba katılmalı.

**Doğrulanamayanlar (toplu)**
- TCK 314/3'ün iptali bu turda resmî TCK metninden yeniden okunmadı; 08 ekindeki kayda dayanıldı.
- 4926 sayılı Kanunun ve Anayasa md 120'nin durumu resmî metinlerinden bu turda okunmadı (genel bilgi).
- 2024–2026 arasında mevzuat.gov.tr tablosuna işlenmemiş bir değişiklik olup olmadığı (iki kanun için de).
- Ödül yönetmeliğinin kamu görevlilerini kapsayıp kapsamadığı; 5233'ün kamu görevlisine uygulanması.
- TCK bankasının tamamı ve `aday/5233-p1.json` bu turda taranmadı; md 7/1 ve md 21 yedekleri için mükerrer denetimi eksiktir.
- Banka sorularının veritabanındaki AÇIKLAMALARI yalnız Doc 39 aday dosyalarından okundu; resmî soruların açıklamaları görülmedi.
