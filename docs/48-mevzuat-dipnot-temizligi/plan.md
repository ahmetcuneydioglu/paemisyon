# Doc 48 — Madde metinlerine karışmış dipnotların temizliği (plan)

Durum: **onay bekliyor** · 4 Ekim 2026 · tetikleyen: TCK md. 65 özel af bildirimi incelemesi

## 1. Sorun

Madde metinlerinin bir kısmı resmî PDF'ten aktarılmış. Aktarımda sayfa altındaki
dipnotlar (değişiklik notları), sayfa kesimindeki bir sonraki maddenin başlığı ve
satır sonundaki dipnot numaraları madde gövdesine karışmış. Örnek, TCK md. 51 (canlıda
yayında): birinci fıkrada "kişinin;" ile a) bendi arasında 5739 ve 7242 sayılı
kanunların değişiklik notları var; sekizinci fıkra iki dipnotla ikiye bölünmüş,
"ceza infaz edilmiş sayılır." en sona düşmüş; "salıverilir.9" gibi cümle sonlarında
dipnot numarası kalmış.

Aday bunları kanun metni sanarak okuyor. Daha kötüsü, dipnotlar madde metninde
**eski hükmü** de taşıyor (ör. TCK md. 135: "iki aydan altı aya kadar hapis" ibaresi
… değiştirilmiştir). Kanunda hiç yazmayan cezalar okuyucuda görünüyor.

## 2. Ölçüm (4 Ekim 2026, canlı, salt okuma)

| | Madde |
|---|---|
| Bankadaki madde | 4.892 |
| Kusuru saptanan (hepsi yayında) | **1.116** |
| … dipnot satırı taşıyan | 692 |
| … yalnız satır sonu dipnot numarası | 424 |
| … dipnotu gövdenin ortasında (madde sonunda değil) | ≥ 535 |
| Kullanıcı vurgusu olan | 8 (PVSK md. 4/A, 12, 16, 20, Ek 1, Ek 9; CMK md. 91; Anayasa md. 10) |
| Notu / yer imi olan | 1 / 5 (madde kimliğine bağlı, metinden etkilenmez) |

En çok etkilenenler: 657 DMK 102, CMK 94, TCK 90, KTK 78, TBMM İçtüzüğü 73, 298 s.K. 72,
5018 s.K. 70, Anayasa 54, Belediye Kanunu 37. Toplam 51 mevzuat. Hepsinin kaynağı
mevzuat.gov.tr.

Saptama, dipnotun ilk satırına ("N gg/aa/yyyy tarihli …") ve satır sonu numarasına
bakıyor. Dipnotun devam satırları ve dipnotsuz biçimde karışmış "sonraki madde
başlığı" bu sayıya girmiyor. Gerçek sayı daha büyük olabilir.

## 3. Neden kalıpla (regex) silme değil

TCK'daki 90 kusurlu madde üzerinde pilot yaptım: banka metnini "dipnot satırlarını sil"
kuralıyla temizleyip resmî metinle karşılaştırdım. 34 maddede temizlenmiş metin hâlâ
farklıydı. Bu farkların hemen hepsi kuralın yakalayamadığı dipnot devam satırları:
`alan "üç yıldan," ibaresi "dört yıldan," … değiştirilmiştir.` gibi satırlar sayıyla
başlamıyor, fıkra ortasında duruyor ve gövdeden biçimce ayırt edilemiyor. Kalıpla
silmek ya dipnot artığı bırakır ya da gövdeden metin keser. İkisi de hukuki metin için
kabul edilemez.

## 4. Yaklaşım: resmî kaynaktan yeniden yazma + "yalnız silme" kapısı

Altyapı hazır: `scripts/lib/mevzuat-kaynak.ts` (`kaynakGetir`, `bol`, `temizle`)
mevzuat.gov.tr'nin HTML konsolide metnini çekiyor. Bu metinde dipnotlar `[N]`
işaretiyle ayrı duruyor ve gövdeden ayıklanabiliyor. `mevzuat-madde-tazele.ts` 23 Eylül
2026'da bu yolla 29 maddeyi güncelledi, 7 madde ekledi. Pilotta TCK md. 51'in kaynaktan gelen gövdesi
temizdi.

Her madde için:

1. Kaynaktan gövdeyi al (`temizle`).
2. **Yalnız silme kapısı:** normalize edilmiş kaynak gövdesinin kelime dizisi, banka
   metninin kelime dizisinin **alt dizisi** olmalı. Yani yeni metin eskiden yalnız bir
   şey ÇIKARIYOR, hiçbir şey EKLEMİYOR olmalı. Çıkarılan parçalar raporda gösterilir
   ve dipnot görünümünde olmalıdır (tarih, "sayılı", "ibaresi",
   "değiştirilmiştir/eklenmiştir/iptal edilmiştir", madde başlığı).
3. Sınıflandır:
   - **A — otomatik:** kapıdan geçer, çıkarılanlar dipnot görünümünde. Uygulanır.
   - **B — inceleme:** kaynak bir şey ekliyor ya da çıkarılan parça dipnot gibi
     görünmüyor. Bu ya kaçmış bir mevzuat değişikliği ya da bölme hatasıdır. Elle
     bakılır; asla otomatik uygulanmaz.
   - **C — kaynakta yok:** madde kaynak bölmesinde bulunamadı (pilotta TCK md. 61).
     Elle.
   - Kaynak ile banka aynıysa (temiz madde) hiçbir şey yazılmaz.

Bu kapı yalnız saptanan 1.116 maddeye değil, **etkilenen 51 mevzuatın bütün
maddelerine** uygulanır. Böylece saptamanın kaçırdıkları da yakalanır, temiz maddelere
de dokunulmaz.

## 5. Önce yapılacak düzeltmeler (`mevzuat-kaynak.ts`)

Pilot, kaynak temizleyicinin de iki açığını gösterdi:

- **Köşeli parantezsiz dipnot numarası:** HTML bazı numaraları `[N]` yerine düz üst
  simge olarak veriyor. Sonuç: "verir. 11", "(…) 15,", "cezalandırılır. 86". Çözüm,
  `htmlToMetin`'de `<sup>` içindeki sayıyı metne geçirmeden düşürmek. Bunu metinden
  sonra kalıpla silmeye çalışmıyoruz: "11" gibi bir sayı gövdede de geçebilir.
- **Parantez içi boşluk:** "( ek: 18/6/2014…", "( 5)". Açılış parantezinden sonraki
  boşluk silinir.

Bu düzeltme `mevzuat-degisiklik-tara.ts` ve `mevzuat-madde-tazele.ts`'i de iyileştirir.
İkisi de aynı kütüphaneyi kullanıyor.

## 6. Biçim kararı (onay gerekiyor)

Kaynaktan gelen metin **paragraf başına bir satır**. PDF'ten gelen banka metni ise
~90 karakterde **sarılmış satırlar**. Okuyucu `\n`'i satır sonu olarak çizdiği için PDF
metni telefonda zaten pürüzlü görünüyor. Seçenekler:

- **(a) Önerilen:** düzeltilen madde kaynak biçimine geçer. Aynı kanunda bir süre iki
  biçim yan yana bulunur; 23 Eylül tazelemesinden beri durum zaten böyle.
- **(b)** Yalnız silme yapılır, PDF satır sarması korunur. Kapı aynı kalır ama yeni
  metin eski satırlardan kurulur. Daha karmaşık, okuma deneyimini iyileştirmez.

## 7. Yan etkiler

- **Vurgular (8 madde):** başlangıç/bitiş ofsetine bağlı. Yeni metinde saklı `snippet`
  aranıp ofsetler yeniden hesaplanır. Bulunamazsa vurgu silinmez, raporlanır.
- **Notlar, yer imleri, soru bağları:** madde kimliğine ve `(konu, madde no)`
  anahtarına bağlı. Değişmez.
- **Arama:** `search` sütunu metinden türetiliyor (GENERATED). Kendiliğinden düzelir.
  Dipnotlardaki eski ibareler artık aramada çıkmaz.
- **Mobil:** madde metni için çevrimdışı paket yok. Sonraki açılışta yeni metin gelir.
- `lastVerifiedAt` güncellenir; `sourceName`, `effectiveInfo` ve durum korunur.

## 8. Uygulama sırası

1. `mevzuat-kaynak.ts` düzeltmesi (§5), ardından 23 Eylül'de tazelenmiş 36 maddeyle
   gerileme denetimi (aynı çıktıyı vermeli).
2. Yeni betik `scripts/mevzuat-dipnot-temizle.ts <mevzuat>`. Varsayılan kuru
   çalıştırma: A/B/C sınıfları, her madde için çıkarılan parçalar, vurgu eşlemesi.
   `--yaz` yalnız A sınıfını yazar. Yazmadan önce yedek
   (`docs/32-yayin-denetimi/dipnot-yedek-<tarih>.json`), her yazım
   `mevzuat-tazeleme.jsonl` defterine.
3. **Pilot: TCK.** Kuru rapor sana gelir; onaylarsan yazılır; okuyucuda md. 51, 135,
   188 açılıp bakılır.
4. Kalan 50 mevzuat 5–10'arlı partilerle, büyükten küçüğe. Her partide kuru rapor →
   onay → yazım. Yazım pencerelerinde CLAUDE.md kuralı geçerli (`connection_limit=1`).
5. B ve C sınıfı tek listede toplanır. Kaçmış mevzuat değişikliği çıkarsa
   `mevzuat-degisiklik-tara` / `mevzuat-madde-tazele` akışına girer.
6. Kapanış: 1.116'lık saptama yeniden çalıştırılır, hedef 0 (B/C'de kalanlar hariç).

Geri alma: yedek dosyasından madde metni ve vurgu ofsetleri tek betikle geri yazılır.

## 9. Onay istenenler

1. Yaklaşım (§4): kaynaktan yeniden yazma + yalnız silme kapısı.
2. Biçim (§6): (a) paragraf satırı mı, (b) PDF sarması mı?
3. Pilotun TCK olması ve partili ilerleme.

## 10. Uygulama günlüğü

**4 Ekim 2026 — TCK pilotu yazıldı.** 98 madde (A); B/C yok; 251 madde dokunulmadı. Yedek
`docs/32-yayin-denetimi/dipnot-yedek-2026-10-03-5237.json` (dosya adı UTC tarihli).

**4 Ekim 2026 — ikinci parti kuru raporları** (657, 5271, 2918, 584, 298): A 872 · B 43 · C 0.
Raporlar bu klasörde `<kanun-no>-kuru-rapor.md`.

Pilot ve ikinci partide `lib/mevzuat-kaynak.ts`'te kapatılan açıklar (her biri 23 Eylül
tazelemesiyle gerileme denetiminden ve TCK yeniden çalıştırmasından geçti):

| Açık | Örnek | Çözüm |
|---|---|---|
| Köşeli parantezsiz dipnot numarası, 3 işaretleme biçimi | "verir. 11", "hâkimini, 3", "sayılır.105" | `MsoFootnoteReference` (düz ve iç içe) ve dipnot bağlantısına bitişik `<sup>` etiket aşamasında düşer |
| "MADDE 61. -" | TCK 60 ve 327 sonraki maddeyi yuttu | başlık kalıbında numaradan sonra isteğe bağlı nokta |
| Yumuşak tire | "propa ganda" (298) | U+00AD silinir |
| Satır içi etiket kelimeyi böler | "sorumlulu ğuna" (2918) | satır içi etiketler boşluğa değil hiçliğe çevrilir |
| Başlık noktalamayla tanınmıyor | "…sorumlulukları:" (657), "Seçimlerde usul:" (584) | Word başlık sınıfları (`MaddeBasl`, `ksmblm`, `ksmblmalt`) işaretlenir; bölümün son satırı iki noktayla bitiyorsa başlıktır |
| Gövde paragrafı başlık sınıfında | 584 md 8 "…Katip Üyelik yaparlar." | nokta/noktalı virgülle biten satır başlık sayılmaz (iki katman: kütüphane ve betik) |

Betik tarafında: başlık parçası yalnız metnin sonundaysa ve **aynı maddenin** kaynak bölümünün
sonundaki başlıklarla ya da bankanın başlık/bölüm kaydıyla eşleşiyorsa kabul edilir; yapışık dipnot
numaraları ("2930", "277278279") ve "Kısım III / Bölüm 2" başlıkları tanınır.

**4 Ekim 2026 — ikinci parti yazıldı** (`--beklenen` korumasıyla, kuru sayılar birebir tuttu):
CMK 109, 657 260, KTK 147, İçtüzük 170, 298 186 = 872 madde. CMK md 91'deki vurgu yeniden eşlendi ve
doğru metni gösteriyor. Ardından beşinci numara biçimi (noktalamadan hemen sonra sınıfsız `<sup>`)
kapatıldı; İçtüzük md 42, 57, 102'den yalnız dipnot numarası silindi (3 madde). Toplam yazılan:
**973 madde**, 6 kanun. Yedek adı artık saat taşıyor (aynı gün ikinci yazım ilk yedeği ezmesin).

Elle bakılacaklar (B, yazılmadı): 657'de 36 (27'si şerhi bankada kısalmış mülga Ek/Geçici madde,
4'ü cetvel), CMK md 250, KTK md 10/18/65/A, İçtüzük md 8/186, 298 md 94/E.

**4 Ekim 2026 — üçüncü parti kuru raporları** (5018, Anayasa, 5393, 2577, 2820): A 411 · B 6 · C 0.
Anayasa'da başlık sınıfı yok; numaralı başlıklar ("1. Milletin temsili", "B. Yürütme") bölüm sonundaysa ve
noktalamasızsa başlık sayılır (önekteki nokta cümle sonu sayılmaz). Denenip geri alınan: Word'ün "sonrakiyle
birlikte tut" ayarını başlık işareti saymak — Anayasa gövde paragraflarında da var; md 103'teki and metni
(".”" ile bitiyor) başlık sanıldı, son denetimde yakalandı, yazılmadı. Cümle sonu kontrolü artık kapanış
tırnağı ve parantezine bakmıyor. 657 md 213 bu yüzden B'ye geçti: bölüm sonundaki yayın notu ("…152 nci
madde olarak işlenmiştir.)") artık başlık sayılmıyor; yazılan metinde not yok, düzeltilecek bir şey yok.

**4 Ekim 2026 — üçüncü parti yazıldı** (`--beklenen` korumasıyla): 5018 82, Anayasa 92, 5393 41, İYUK 68,
2820 128 = 411 madde. Anayasa md 10'daki vurgu yeniden eşlendi. Dipnot deseni yalnız B maddelerinde kaldı
(Anayasa md 148, İYUK md 46, 2820 md 96). Toplam yazılan: **1.384 madde**, 11 mevzuat; kalan 40 mevzuat.

**4 Ekim 2026 — dördüncü parti yazıldı** (kullanıcı kuru rapor sunumundan vazgeçti; kuru çalıştırma,
parça denetimi ve `--beklenen` korunarak): 6216 29, 3201 22, 5302 25, 2575 29, 5442 21, 7201 67, 2839 49,
3713 18, 2576 28, 5607 16 = 304 madde. Betiğe `--haric` eklendi (denetimde şüpheli madde yazımdan çıkarılır;
bu partide gerekmedi). Toplam yazılan: **1.688 madde**, 21 mevzuat. Genel tarama: dipnot deseni taşıyan madde
1.116 → 223 (kalan 30 mevzuat + işlenmiş kanunların B maddeleri).

**Yan bulgu — 5442'de eksik metin:** md 21, 22, 23, 27, 38, 39, 60'ta bankadaki cümleler yarım; kaynakta
"…her türlü malümatı vermekle ödevlidirler." gibi devam ediyor. Dipnot değil, aktarımda düşmüş gövde; kapı
"kaynak ekliyor" diye durdurdu. Elle tamamlanmalı (`mevzuat-madde-tazele` ile).

**4 Ekim 2026 — son parti yazıldı (31 mevzuat, 354 madde):** 7068 13, 6222 15, 2559 16, 5326 12, 6136 11,
2911 17, 6085 37, 5253 12, 5233 14, 5682 31, 1774 11, 3628 9, 5901 10, 5395 11, 5188 9, 4483 7, 6698 8,
2860 31, 6701 5, 1481 4, 3686 3, 4982 4, 5726 7, Adli ve Önleme Aramaları Yön. 3, 6328 2, 6271 3, 3376 4,
5275 1, 6284 1, Yakalama… Yön. 5, 6706 38.

**Kapanış (4 Ekim 2026):** toplam **2.042 madde**, 52 mevzuat yazıldı; bütün maddeler yayında. Dipnot
deseni taşıyan madde 1.116 → 33; kalanların hepsi B listesinde ya da kaynağın kendisi numarayı taşıyor
(6085 md 84, 3713 Ek 3).

Vurgular: yazılan maddelerdeki 11 kullanıcı vurgusu eski metindeki kısmın aynısını gösteriyor. PVSK md 20'de
`snippet` 500 karakterde kesik olduğu için ilk eşleme vurguyu 555 → 500'e kısaltmıştı; eski metnin vurgulu kısmıyla
(dipnot numarası düşülerek) yeniden eşlendi (553), betik artık önce bu yolu dener. **Önceden var olan kayma
(bu iş dışında):** PVSK md 5, 6, 13/A, Ek 7 (3 vurgu) ve 5326 md 7'de vurgu metni tutmuyor; bu maddeler bu
temizlikte yazılmadı — daha önceki tazelemeler vurguları yeniden eşlememiş olmalı (`mevzuat-madde-tazele`).

**Elle bakılacaklar (B, yazılmadı), özet:**
- Bankada eksik gövde (kaynak tamamlıyor): 5442 md 21, 22, 23, 27, 38, 39, 60; 6136 md 1, 8, Ek 12, Geçici 9;
  5326 Geçici 1.
- Mülga madde şerhi bankada kısalmış: 657 Ek/Geçici 27 madde; 6136 md 2, 10; 5442 md 10, 33; 5682 md 34, Ek 1.
- AYM/Danıştay kararı atfı bankada yok: 5018 Geçici 23, 5393 Geçici 8, İYUK Ek 3, 3713 Geçici 9 ve 16,
  5682 Ek 7, Adli ve Önleme Aramaları Yön. md 36, Yakalama Yön. md 34.
- Cetvel/tablo: 657 md 36, 59, 152, 239; 3201 md 13, 55, Ek 29, Geçici 26; 2576 md 3; 3376 md 5.
- Kaynakta bölünmemiş madde (bankada eksik olabilir): CMK 38/A, Danıştay 95/A, 7201 md 7/A ve 25/A,
  2839 md 43 (44–61 notu).
- Gövde farkı / şüpheli silme: 657 md 45, 56, 100, Ek 24, Ek 36, Geçici 38, 39, 213 (yayın notu); CMK md 250;
  KTK md 10, 18, 65/A; İçtüzük md 8, 186; 298 md 94/E; İYUK md 46; 2820 md 96; 2559 md 12; 5233 md 6;
  6328 md 13 (yemin metni); 7068 md 8; 3713 Ek 1; Anayasa md 148; 3201 md 28, 44, 48, Ek 34, Ek 36.
- Vurgu eşlenemedi: 2559 md 16.
- **5275 (131 madde):** bankada her madde "Madde N –" etiketiyle başlıyor (öteki kanunlarda yok). Etiketi
  kaldırmak dipnot temizliği değil biçim kararı; ayrıca karar verilmeli.

**Yan bulgu (ayrı iş):** PDF aktarımında madde başlığı önceki maddenin sonuna yapıştığı için `title`
alanı çoğu kanunda boş ya da yarım: 657'de 337 maddenin 37'si, 2918'de 1'i, 298'de 31'i, 584'te 33'ü
başlıklı; CMK'da 334 başlıklı ama iki satırlık başlıkların ilk satırı eksik ("askıya alınması ve
elkoyma"). Kaynakta başlıklar sınıfla işaretli olduğu için bunlar ayrıca doldurulabilir.
