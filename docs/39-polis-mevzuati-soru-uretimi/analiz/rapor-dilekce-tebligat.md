# Dilekçe hakkı ve tebligat: sınav ve kaynak analizi (3071 · 7201)

Doc 39, 22 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/3071.txt` (12 madde), `mevzuat/7201.txt` (71 madde);
- `<no>-mevcut-sorular.txt` (3071: 5, 7201: 10), `<no>-diger-konu-sorulari.txt` (8, 5), `<no>-cakisma-sorulari.txt` (214, 69);
- komşu taban: `4982.txt` ve `4982-mevcut-sorular.txt` (87), `4483.txt` (md 4), `6458.txt` (md 53, md 100).

Resmî metinler mevzuat.gov.tr'den 21 Kas 2026'da indirildi (scratchpad `kanun-tarama/indirilen/3071.html`, `7201.html`). Banka metniyle betikle sözcük sözcük karşılaştırıldı. 7587 sayılı Kanunun metni Resmî Gazete'den okundu (1/7/2026, sayı 33297). Kök, şık, dil ve yapay zekâ izi ölçüleri `rapor-polis-mevzuati.md` §2–§9'dadır; burada tekrarlanmaz, bu iki kanuna uygulanır.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı hukuk bilgisi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** kolluğu doğrudan ilgilendirir. **sınır**: çakışma dosyasında başka bir kuralı ölçen, ama yeni soruya çeldirici ya da yasak sınırı veren soru. İki kanunda da AYM iptali yoktur.

## 0. İki kanunun ortak tablosu

| Kanun | Resmî doğrudan soru | PAEM / Misyon | Bankada (konu) | Diğer konu: ilgili / metin dışı / ilgisiz | Çakışma: ilgili / sınır / ilgisiz | Asıl çakışma tabanı |
|---|---|---|---|---|---|---|
| 3071 | 5: [42] Adalet GYS 2023; [43]–[45] İçişleri GYS; İdare [273] KPSS 2021 Alan | — | 5: [42]–[45] ve md 8 İçtüzük | 6 / 2 (TCK 121) / 0 | ≈40 / ≈20 / ≈150 | 4982 md 2, 4, 6, 7/3, 11–13; Anayasa md 74; 4483 md 4/3–4 |
| 7201 | 10: [305]–[311] Adalet GYS 2023; [312]–[314] İçişleri GYS. [305] ve [309] yönetmelik sorusu | — | 10: resmî on sorunun kendisi | 4 / 0 / 1 (5326) | 4 / 13 / 52 | 5326 (e-tebliğde beşinci gün); CMK süre hesabı ve mağdur adresi; İYUK [59], [90]; Arama Yön. hazır bulunacaklar |

- **Resmî soruların hepsi GYS'nin ve bilgi düzeyinde.** Muhakeme ölçen soru yok.
  - 7201'in on sorusundan üçü yasak kalıptır: yönetmelik mercii ([306], [313]) ve işlem türü ([307]).
  - İkisi yönetmeliğe dayanır ([305], [309]). Yönetmelikler türetim istisnasında değildir.
- **PAEM ve Misyon iki kanunu adıyla hiç sormadı.** İki korpus tarandı.
  - PAEM 10. dönemin tek teması idare hukukundadır: [366] "tebligattan önce hüküm doğurma" geriye yürümezliğin istisnası değildir. Bu bir 7201 sorusu değildir.
  - CMK ve İYUK'ta tebliğe değen resmî sorular süre hesabı ve dava usulüdür (İYUK [57] TC kimlik no, [59] adres, [70] görevli merciye tevdi, [72] posta ücreti, [90] tebligat ve cevap). 7201'in kuralını ölçen yok.
- **3071 tükendi.** md 3/2, 4, 5↔6, 6, 7 ve 8/1 bankada; bazıları üç kez. Kestirmesiz tek açı kaldı: yabancının dilekçe hakkının konu kapsamı, 4982 ile ayırt etme (§7).
- **7201 bir kapsam işi.** Banka resmî korpustan ibaret, türetim yok. Tebliğ işleminin karar kuralları hiç ölçülmemiş:
  - zabıta eliyle tebligat (md 2);
  - adres kayıt sistemi adresi (10/2, 21/2);
  - muhatabın geçici olarak başka yerde olması (md 20) ve adreste kimsenin bulunmaması (21/1);
  - yaş şartı (md 22), adresi meçhul (md 28), adres değişikliği (md 35);
  - talep üzerine elektronik tebligat (7/A/2).
- **Metin.** 7201 banka metninde bir dipnot artığı var (md 7). Öteki on tarama uyarısı yanlış alarmdır. 7587 (2026) 7201'e dokunmaz; bankadaki bir güncel soru aksini düşündürebilir.
- **Ters ayırt etme riski** (§8 kural 4). Bilmeyen aday şu sezgilerle doğruyu bulur:
  - "yetkisiz makam yetkili makama gönderir" (3071 md 5);
  - "idare sonucu ayrıca bildirir" (3071 md 7 son cümle);
  - "adresi bilinmeyene ilan yapılır" (7201 28/1);
  - "hasma evrak bırakılmaz" (md 39);
  - "kabul ederse her yerde tebliğ olur" (10/3);
  - "hastanede yönetim, iş yerinde çalışan alır" (md 18, 13, 17);
  - "reşit olan alır" (md 22'nin yaşı);
  - "acil işte polis tebliğ eder" (md 2'nin koşulu).

  Soru bu sezgileri kıran olguyla kurulur; kıramıyorsa yazılmaz.

**◆ Kolluğa doğrudan değen hükümler**

| Kanun | Hüküm | Kolluk bağı | Kullanım |
|---|---|---|---|
| 7201 | 2/1 | Üç hâlde tebligat, tebliği çıkaranın kendi memurlarıyla ya da mahallî mülki idare amirinin emriyle zabıta vasıtasıyla yaptırılır: başka kanunda özel hüküm; ertelenmesinde zarar umulan iş; aynı yerdeki md 1 daireleri arası tebligat | 7201-p1 #3 |
| 7201 | 2/2 | Zor kullanmayı gerektiren ve hazırlık tahkikatına (soruşturma) ilişkin görevlerin zabıtaca yapılacağına dair hükümler saklı | bağlam; sorulmaz |
| 7201 | 21/1, 21/2 | Kimse yoksa, almaktan kaçınılırsa ya da adres kayıt sistemi adresinde muhatap hiç oturmamışsa evrak muhtar, ihtiyar heyeti azası ya da zabıta amir veya memuruna imzayla teslim edilir | 7201-p1 #1; #2 bağlam |
| 7201 | 21/3 | Muhtar, ihtiyar heyeti azaları, zabıta amir ve memurları evrakı kabule mecbur | doğru önerme ya da açıklama; tek başına soru olmaz (sezgi) |
| 7201 | 24/5 | Okur yazar komşu yoksa imza edemeyen muhatabın tebliğinde muhtar, ihtiyar heyeti azası ya da bir zabıta memuru hazır bulunur | yedek |
| 7201 | 28/3 | Merci, adresi meçhul muhatabın adresini zabıta vasıtasıyla tahkik ve tespit ettirir | 7201-p1 #5 (doğru önerme) |
| 7201 | 27/2 | Yurt dışındaki askeri şahıslara kuvvet komutanlıkları ve Jandarma Genel Komutanlığı vasıtasıyla | dışarıda |
| 7201 | md 52 | Uygulamada görevli memur ve hizmetliler ile muhtar ve ihtiyar heyeti: işledikleri ve onlara karşı işlenen suçlarda TCK'nın kamu görevlisi hükümleri; disiplin cezasına engel değil | dışarıda (54/2 ile ilişkisi iki okumalı) |
| 7201 | md 53–56 | Yanlış isim ya da adres; evrakı muhataba vermeme; almama ya da kabul etmeme; yalan beyan; ihbarnameyi koparma | 53 ve 56 bankada; 54–55 iki okumalı; 56'nın yaptırım türü yedek |
| 3071 | — | Doğrudan bağ yok. Kolluk birimi de idari makamdır. Ama karakola verilen suç duyurusu CMK'nın, memur hakkında ihbar 4483 md 4'ün rejimidir ⚑ | — |

---

## 3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun (12 madde)

### Metnin durumu (BAĞLAYICI)

| Hüküm | Resmî şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| md 1–4, 7, 8/1 | 4778 (2/1/2003; yürürlük 11/1/2003) ile değişik ya da ek | Türkiye'de ikamet eden yabancılar kapsama girdi; 3/2'de karşılıklılık ve Türkçe şartı | 2003 öncesi "yalnız Türk vatandaşları" bilgisi yalnız çeldirici olur |
| 8/2 | 6253 (1/12/2011; yürürlük 18/12/2011) ek fıkra | Dilekçe Komisyonunun yetkileri ve kamu kurumlarının yükümlülüğü | Yükümlülük cümlesinin kapsamı iki okumalı (§6) |
| md 9, Geçici 1 | 140 sayılı Kanun (1962) kaldırıldı; İçtüzük değişinceye kadar onun Komisyon usulü uygulanır | Resmî metinde Geçici 1, md 9 ile md 10 arasında; bankada sonda | sorulmaz |
| md 11 | "TBMM Başkanı ile Bakanlar Kurulu yürütür" | Bakanlar Kurulu 2018'den beri yok | sorulmaz |
| Banka ↔ resmî | Sözcük sözcük aynı. Bankada madde başlıkları yok: Amaç; Kapsam; Dilekçe hakkı; Dilekçede bulunması zorunlu şartlar; Gönderilen makamda hata; İncelenemeyecek dilekçeler; Dilekçenin incelenmesi ve sonucunun bildirilmesi; Türkiye Büyük Millet Meclisine yapılan başvuruların incelenmesi | | Tırnaklı başlık resmî başlıktan alınabilir. md 4 ve md 6 başlıkları bankada ölçülmüş içeriği çağırır |

`tara-3071.json` temizdir (kaynak 12 = banka 12). Gövdeye karışmış dipnot yok.

### §1 Resmî sorular

| No | Sınav | Hüküm | Açı | Kök | Çeldirici türü | Gerçek değer | Zorluk |
|---|---|---|---|---|---|---|---|
| 42 | Adalet GYS 2023 (5 şık) | 8/1: Komisyonun ve kurumun süresi | S | boşluk, iki değerli; hüküm aynen; ≈330 krkt; tam ad | sayı dizisi, azalan (kırk beş–on beş, otuz–on beş, on beş–yedi, on–yedi) | "otuz" gerçek ama yanlış konumda; öbürleri metinde yok | kolay |
| 43 | İçişleri GYS (4 şık) | 3/2, md 4, 6/a | Ş | "yanlıştır"; ≈95 krkt | olumsuzlama: "karşılıklılık esası gözetilmeksizin" | — | kolay |
| 44 | İçişleri GYS (4 şık) | md 7 | S | doğrudan; hüküm aynen; ≈300 krkt | uydurma dizi (on, on beş, yirmi) | 0/3 | kolay |
| 45 | İçişleri GYS (4 şık) | 6/b; 8/1; 3/1 | Ş | "yanlıştır"; ≈95 krkt | olumsuzlama: "incelenirler" | — | kolay |
| İdare 273 | KPSS 2021 Alan (5 şık) | md 6 ↔ md 5 | A | "yer almaz"; ≈120 krkt | md 4 ve md 6 öğeleri; cevap md 5 | — | orta |

**Çıkarım.**
- Beş sorunun beşi bankada; [273] İdare Hukuku başlığında.
- Ölçülen: yabancının iki şartı, dilekçe unsurları, incelenemeyecek dilekçeler, md 5 ↔ 6 ayrımı, iki süre ve İçtüzük.
- Sorulmayan: kapsam (md 1–2), md 5'in sonucu, md 7 son cümle, 8/2.
- Kanunun karar kuralları tükenmiş. Kalan tek değerli açı 4982 ile ayırt etmedir.

### §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Açı | Nerede | Sızıntı ve karar |
|---|---|---|---|
| 3/2: karşılıklılık, Türkçe | Ş | [43] A (yanlış önerme), B; banka md 3 (aynı soru) | Sorulmaz. Karşılıklılık [43]'ün cevabıdır: yeni sorunun şıkkında ve açıklamasında yer almaz. Türkçe [43]'te doğru önermeydi; aranan şart olarak çeldiricide durabilir. |
| 3/1: TBMM ve yetkili makamlara yazı ile | K | [45] D | sorulmaz |
| md 4: ad-soyad, imza, iş veya ikametgâh adresi | Ş | [43] C; diğer konu (zorunlu olan adres; çeldirici TC kimlik no, telefon, tarih); [273] A, C | sorulmaz; tek öğe, aranan şart olarak çeldirici olabilir |
| md 6 a–c | Ş, Sn | [43] D; [45] B; [273] B, E; diğer konu (incelenebilir olan) | sorulmaz |
| md 5 ↔ md 6 | A | [273]; diğer konu | Sorulmaz. md 5'in kuralı (gönderilir, bilgi verilir) 4982 md 7/3 adıyla iki kez bankada: 4982 md 7 sorusu (C) ve İdare Hukuku "görev alanı dışındaki başvuru ilgili kuruma gönderilir". |
| md 7: en geç otuz gün, gerekçeli | S | [44]; diğer konu | sorulmaz |
| 8/1: altmış ve otuz gün; İçtüzük | S, işlem türü | [42]; [45] A, C; banka md 8 İçtüzük; diğer konu İçtüzük | sorulmaz (İçtüzük yasak kalıp) |
| 4982 md 2/2: 3071 saklı | K | 4982 bankası (öncüllü III) | 3071 sorusu 4982'nin 3071'i kaldırıp kaldırmadığını sormaz |
| 4982 md 4/2: yabancıda bilginin kendisiyle ya da faaliyet alanıyla ilgili olması ve karşılıklılık | Ş | dört soru: 4982 bankasında üç (birinin yanlış şıkkı "Türkçe başvuru"), İdare Hukukunda bir | 3071-p1 #1'in malzemesidir. Açıklama bu şartı içerikle yazmaz; yazarsa dört sorunun cevabını verir. |
| Anayasa md 74: dilekçe hakkının tanımı; yabancılara da tanınması | K | Anayasa bankası: tanım sorusu; "yalnız vatandaşlara tanınmamıştır" iki soru | 3071 sorusu tanımı ve "yabancıya tanınır mı"yı sormaz |
| TCK 121 (dilekçe hakkının engellenmesi) | — | TCK bankası (2) | ⚑ |

**Ölçülmemiş:** md 1–2 (amaç, kapsam); hakkın konu kapsamı (md 1, 3/1, 7: "kendileriyle veya kamu ile ilgili"); md 5'in sonucu; md 7 son cümle; 8/2.

### §3 Öncelikli hükümler

| md | Değer | Açı | Neden önemli |
|---|---|---|---|
| 3/2 + md 1, 7 ↔ 4982 md 4/2 | Y | K, A [K→K] | Yabancı, kendisiyle ya da kamu ile ilgili dilek ve şikâyeti için başvurur; konu sınırı yoktur. 4982'de yabancı için bilginin kendisiyle ya da faaliyet alanıyla ilgili olması aranır, Türkçe aranmaz. Anayasa md 74 Türkçe şartı koymaz, 3071 koyar. Eksik aday iki kanunu çaprazlar. Bankanın ölçmediği tek değerli açı. |
| 8/2 | O | M, K | Komisyon kamu kurumları, kamu kurumu niteliğindeki meslek kuruluşları ve özel kuruluşlardan bilgi ve belge alır; ilgilileri çağırır; idari denetimin yapılmasını ister; bilirkişi görevlendirir; yerinde inceler. 4982 md 2'nin kapsamıyla (yalnız kamu) ayırt edilir. Yükümlülük cümlesi yalnız kamuyu sayar (iki okumalı). PAEM değeri düşük. |
| 7 son cümle | D/O | Sn | Safahat bildirilmişse sonuç ayrıca bildirilir. Bilgilendirme sezgisiyle bulunur; İYUK'u ve 4982'yi bilen eksik aday yanılır (ters). |
| md 5 | D | M, Sn | Yetkisiz idari makam dilekçeyi yetkili idari makama gönderir, sahibine bilgi verir. Sağduyudur; aynı kural 4982 md 7/3 adıyla bankada. |
| md 1–2 | D | K | TBMM ve idari makamlar. Yargı mercileri md 6/b'de (bankada). |

### §4 Değer tabloları

**Süreler**

| Değer | Yer | Bankada |
|---|---|---|
| otuz gün ✱ | md 7 yetkili makamın dilekçe sahibine gerekçeli cevabı (en geç) · 8/1 ilgili kurumun Dilekçe Komisyonuna cevabı | ikisi de ([44]; [42], [45] C) |
| altmış gün | 8/1 Komisyonda inceleme ve karara bağlama | [42] |

Komşu süreler. Yalnız çeldirici olurlar; hiçbiri 3071'in doğru şıkkı olmaz:

| Değer | Yer |
|---|---|
| on beş iş günü | 4982 md 11 erişim; md 13 Kurulun istediği belge |
| otuz iş günü | 4982 md 11 uzatma; md 13 Kurulun kararı |
| on beş gün | 4982 md 13 Kurula itiraz (resmî PAEM 10 [131]) |
| altmış gün | İYUK md 10 zımni ret ⚑ (metni bu dosyalarda yok) |

- Süre sorusu kurulmaz: 3071'in üç süresi de bankada.
- "iş günü" 3071'de geçmez. 3071 sorusunda "iş günü" yalnız 4982 aktarımı olarak çeldiricide durabilir.

**Merciler ve aktörler**

| Aktör | Yer · iş |
|---|---|
| TBMM · Dilekçe Komisyonu | md 1–4, 6, 8: başvuru yeri; 8/1 altmış günde sonuçlandırma (bankada); 8/2 yetkiler |
| yetkili makam · idari makam | md 1–7 başvuru yeri; md 5 yetkisiz idari makam gönderir ve bilgi verir; md 7 cevap verir |
| yargı mercileri | 6/b görevine giren konudaki dilekçe incelenemez (bankada) |
| TBMM İçtüzüğü | 8/1 esas ve usuller (bankada) |
| kamu kurum ve kuruluşları · kamu personeli | 8/1 otuz günde cevap (bankada); 8/2 bilgi ve belge verme, idari denetim yapma, yerinde inceleme tedbiri |
| kamu kurumu niteliğindeki meslek kuruluşları · özel kuruluşlar | 8/2 Komisyon bunlardan da bilgi ve belge alabilir; yükümlülük cümlesinde sayılmazlar ⚑ |
| TBMM Başkanı · Bakanlar Kurulu | md 11 yürütme (eski organ) |

- **Varsayılan:** "otuz gün", "İçtüzük", "yetkili makama gönderilir", "Dilekçe Komisyonu".

**Kapalı listeler**

| Liste | Öğeler | Bankada |
|---|---|---|
| yabancı (3/2) | Türkiye'de ikamet; karşılıklılık esası; Türkçe | iki şart [43]'te |
| dilekçe unsurları (md 4) | ad-soyad; imza; iş veya ikametgâh adresi | [43] C; diğer konu; [273] |
| incelenemez (md 6) | belli bir konu yok; yargı mercilerinin görevine giren; md 4 şartı eksik | [43] D; [45] B; [273]; diğer konu |
| hakkın konusu (md 1, 3/1, 7) | kendileriyle veya kamu ile ilgili dilek ve şikâyet; yazı ile | yazı ile [45] D; konu kapsamı ölçülmemiş |

### §5 Ayırt etme malzemesi

- **3071 ↔ 4982: yabancı** [K→K]
  - 3071: Türkiye'de ikamet eden yabancı, karşılıklılık esası gözetilmek ve dilekçesi Türkçe yazılmak kaydıyla başvurur. Başvuru kendisiyle ya da kamu ile ilgili dilek ve şikâyet için olabilir. Konu sınırı yok (md 1, 3, 7).
  - 4982 md 4/2: yabancı gerçek ve tüzel kişi, bilgi kendileriyle ya da faaliyet alanlarıyla ilgili olmak kaydıyla ve karşılıklılık ilkesi çerçevesinde yararlanır. Türkçe şartı yok.
  - Bankada 4982 sorusu bu şartı dört kez soruyor; birinin yanlış şıkkı "Türkçe başvuru". Eksik aday iki kanunun şartlarını çaprazlar. 3071-p1 #1'in malzemesi budur.
- **3071 ↔ Anayasa md 74**
  - Bankadaki Anayasa tanım sorusuna göre: vatandaşlar ve karşılıklılık esası gözetilmek kaydıyla Türkiye'de ikamet eden yabancılar; kendileriyle veya kamu ile ilgili dilek ve şikâyetler; yetkili makamlar ve TBMM; yazı ile. Türkçe şartı yok.
  - Anayasa md 74 ayrıca bilgi edinme ve kamu denetçisine başvurmayı düzenler. İkisi de 3071'de yok ⚑.
  - Anayasa'yı bilen eksik aday "Türkçe aranmaz" der.
- **3071 ↔ 4982: usul**
  - Başka yere verilen başvuru: 3071 md 5 (yetkili idari makama gönderilir, sahibine bilgi verilir) = 4982 md 7/3 (bilginin bulunduğu kuruma gönderilir, ilgiliye yazılı bildirilir). Aynı kural bankada 4982 adıyla iki kez ölçülmüş.
  - Unsurlar: 3071 md 4 ↔ 4982 md 6 (aynı üçlü; tüzel kişide unvan, adres, yetkili kişinin imzası ve yetki belgesi; elektronik başvuru). 3071'de elektronik başvuru ⚑.
  - Süre ve itiraz: 3071 md 7 (otuz gün, gerekçeli; itiraz yolu yok ⚑) ↔ 4982 md 11–13 (on beş iş günü; otuz iş günü; ret gerekçesi ve başvuru yolları; on beş gün itiraz; Kurul otuz iş günü; itiraz dava süresini durdurur).
  - Kapsam: 4982 md 2/2 3071'i saklı tutar (bankada).
- **3071 ↔ 4483 md 4/3–4** (memur hakkında ihbar ve şikâyet)
  - 4483 aynı unsurları ister: doğru ad, soyad, imza; iş veya ikametgâh adresi. Ayrıca: soyut ve genel olmama, kişi ya da olay belirtme, ciddi bulgu ve belge.
  - Şartsız ihbar işleme konulmaz, durum ihbarcıya bildirilir. İddia sıhhati şüpheye yer vermeyen belgelerle ortaya konmuşsa ad ve adres doğruluğu aranmaz; kimlik gizli tutulur.
  - 3071 md 6/c'de istisna yok. "Belgeyle desteklenen imzasız dilekçe incelenir" 3071 sorusunda doğru olamaz.
- **md 5 ↔ md 6** (bankada iki kez): yetkisiz makama verilen dilekçe incelenemeyecekler arasında değildir.
- **md 7 ↔ 8/1** ✱ otuz gün (bankada).
- **Karakola verilen dilekçe** ⚑: kolluk birimi idari makamdır. Ama suç duyurusu CMK'nın, memur hakkında ihbar 4483'ün rejimidir. 3071 vakası suç duyurusuyla kurulmaz.

### §6 Kaçınılacaklar (BAĞLAYICI)

- **Bankada ölçülmüş:** §2'deki her şey. Özellikle:
  - otuz ve altmış gün; İçtüzük;
  - karşılıklılık şartı ([43]'ün cevabı; hiçbir şıkta ve açıklamada yer almaz);
  - Türkçe şartı (doğru şık olmaz; "aranmaz" sorusunda aranan şart olarak çeldiricide durabilir);
  - md 4 unsurları, md 6 bentleri, md 5 ↔ 6.
- **Varsayılan ve sağduyu:**
  - md 5'in kuralı tek başına ("yetkili makama gönderilir");
  - md 7 son cümle ("sonuç ayrıca bildirilir"). Bilgilendirme sezgisiyle bulunur; İYUK'u ve 4982'yi bilen eksik aday yanılır (ters);
  - md 1–2; "yazı ile"; md 9–11; Geçici 1.
- **Metin dışı (⚑):**
  - CİMER, e-Devlet, e-posta dilekçe; isimsiz ihbar;
  - 4483 md 4/4 istisnası; CMK suç duyurusu;
  - bilgi edinme ve kamu denetçisi (Anayasa md 74, 6328);
  - İYUK md 10 (altmış gün, zımni ret) ve dava süresi;
  - cevap verilmemesinin yaptırımı (TCK 121, disiplin);
  - otuz günün başlangıç anı (başvuru mu, yetkili makama ulaşma mı; md 5 sonrası);
  - incelenemeyecek dilekçeye cevap verilip verilmeyeceği;
  - 3071'deki cevabın 7201'e göre tebliğ edilip edilmeyeceği.
- **İki okumalı:**
  - 8/2 yükümlülük cümlesinin meslek kuruluşlarını ve özel kuruluşları kapsayıp kapsamadığı;
  - md 5'in TBMM'ye verilen dilekçeye uygulanması (md 5 "idari makam" der);
  - aynı dilekçede bilgi edinme ve şikâyetin birlikte bulunması.
- **Eski metin:** 2003 öncesi yabancıların kapsam dışı olması; 140 sayılı Kanun; md 11'deki Bakanlar Kurulu.

### §7 Parti önerisi: `3071-p1` (en çok 3; önerilen 1)

| # | Hüküm | Açı / kök | Zorluk | Doğal çeldirici kaynağı |
|---|---|---|---|---|
| 1 | 3/2 + md 1, 7 ("kendileriyle veya kamu ile ilgili") ↔ 4982 md 4/2 ↔ Anayasa md 74 | Bir yabancının dilekçe hakkından yararlanmasında hangisi ARANMAZ [K→K] K; olumsuz kök. Doğru şık: dilekçe konusunun kendisiyle ilgili olması (4982'nin şartı). Kökte "Türkiye'de ikamet eden" yazılmaz; ikamet şıkta aranan şart olarak durur. | orta | Aranan şartlar, her biri ayrı temada: Türkiye'de ikamet ("dilekçe herkesin hakkı" sezgisi bunu seçtirir); Türkçe yazılma (Anayasa'yı bilen ve "yabancıya ağır gelir" sezgisi bunu seçtirir); yazılı başvuru (md 3/1); md 4'ten tek öğe (adres). |

- **Şık takımı sınırları:**
  - Karşılıklılık şıkta yer almaz ([43]'ün cevabı).
  - md 4'ten iki öğe birlikte şık olmaz (aynı hükmün iki yarısı birlikte düşer).
  - "Belli bir konu içermesi" şıkkı olmaz: doğru şıkla "konu" ikizi kurar ve cevabı gösterir.
  - Doğru şık dışında 3071'de aranmayan hiçbir unsur şıkta yer almaz: TC kimlik numarası, noter onayı, "yetkili makama verilmesi" (md 5 nedeniyle şart değildir). Yoksa iki doğru doğar.
- **Olumsuz kök oranı:** 3071-p1 tek sorudur; olumsuz kök orada kaçınılmazdır. İki parti birlikte sayılırsa 2/6 olur, sınırın biraz üstü. Orkestratör kabul etmezse aynı içerik "doğrudur" biçiminde kurulur. Şıklar: kendi dilinde de yazabilir (Anayasa, sezgi); Türkiye'de ikamet etmeyen de yararlanır (sezgi); başvurusuna on beş iş günü içinde cevap verilir (4982 aktarımı); dilekçesini Dışişleri Bakanlığı aracılığıyla verir ("yabancı → Dışişleri"; partideki tek uydurma); doğru: kamu ile ilgili şikâyeti hakkında da başvurabilir. Bu biçimde "kendisiyle ilgili olmayan konuda başvuramaz" şıkkı yazılmaz: doğru şıkla ters çift olur.
- **Risk:** Anayasa tanım sorusu (bankada) "kendileriyle veya kamu ile ilgili" ifadesini taşır; gözcü mükerrer sayabilir. Savunma: o soru tanımı başka hakların tanımlarından ayırt ettirir, konu kapsamını ölçmez.
- **Açıklama:** 4982'nin yabancı şartını içerikle yazmaz ("bilgi edinme başvurusundaki yabancı şartıyla karıştırılır" der). 3/2'den alıntı gerekiyorsa karşılıklılık kısmı "…" ile kısaltılır.
- **Yedek (zayıf):** 8/2 Dilekçe Komisyonunun yetkileri. Yalnız tek cevaplı kurulabilirse. Yanlış önerme "idari denetimin yapılmasını istemek" yerine "idari denetimi yapmak" olur. Doğru önermelerden biri özel kuruluşlardan bilgi ve belge almadır (4982 md 2'yi bilen eksik adayı yanıltır). Yükümlülük cümlesi önerme olmaz. YANLIŞTIR biçimi ikinci olumsuz kök demektir; bu yüzden zayıf yedek.
- **Dışarıda:** md 1, 2, 4, 5, 6, 7, 8/1, 9, 10, 11, Geçici 1.
- **Kestirmesiz ve değerli ikinci bir 3071 sorusu kalmadı.** #1 de yazılmazsa 3071-p1 boş kalır. Kanun zaten sorusuz değil: bankada 5, diğer konularda 6 soru var.

---

## 7201 sayılı Tebligat Kanunu (71 madde)

### Metnin durumu (BAĞLAYICI)

| Hüküm | Resmî şerh ya da dipnot | Bugünkü metin | Kullanım |
|---|---|---|---|
| **md 7 (banka metni)** | Gövdede dipnot artığı satır: "4 19/3/2003 tarihli ve 4829 sayılı Kanunla bu fıkrada yer alan “memurlarının kusur veya ihmali yüzünden veya” ibaresi madde metninden çıkarılmıştır." Resmî metinde bu cümle md 6'daki "(...)"nın dipnotudur [4]. | md 7 iki cümledir: tebligat uçak, seri veya hususi vasıta ya da telgrafla da yapılabilir; vasıtayı merci tensip eder, ücret ayrıca alınır. | Satır kanun metni değildir. Soru, şık ve açıklamada kullanılmaz. md 6 ve md 7 zaten dışarıda. |
| md 6 "(...)" | [4]: 4829 (2003) "memurlarının kusur veya ihmali yüzünden veya" ibaresini çıkardı | PTT, mücbir haller dışında herhangi bir sebeple kaybolan evrakın masrafını öder | sorulmaz |
| md 16, 17 | [5]: 4829 "birlikte oturan ailesi efradından" → "aynı konutta oturan kişilere" | aile bağı aranmaz | "aile bireyi" şartı yalnız çeldirici olur; doğru şıkta "aynı konutta oturan" korunur |
| md 22 | [8]: 4829 "onbeş" → "onsekiz" | görünüşüne göre on sekiz yaşından küçük olmama; açıkça ehliyetsiz olmama | "on beş" yalnız çeldirici olur; yaş tek başına sorulmaz |
| md 21 | [8]: "zabıta amir ve memuruna" → "zabıta amir veya memurlarına"; [7]: 21/3'te "fıkra" → "fıkralar" (2011) | 21/3'teki kabule mecburiyet 21/1 ve 21/2'nin ikisine de uygulanır | — |
| md 21/1 sonu "(1)" | Resmî metinde de üst simge "(1)" var; karşılık dipnot yok | metin değildir | alıntıya taşınmaz |
| md 20 | [6]: "hüviyeti" → "adı ve soyadı" | | — |
| md 23 | [9]: 6099 bent 7'ye "adreste bulunmama" ekledi; bent 8 (adres kayıt sistemi kaydı) eklendi | dokuz bent | liste sorulmaz |
| md 29/1 | [10]: 6099 (2011) "ayrıca" sözcüğünü çıkardı (metindeki "(…)"). [11]: 7418 (13/10/2022; yürürlük 1/4/2023) "birer gazetede ve ayrıca elektronik ortamda" → "bir gazete ve bir internet haber sitesi ve ayrıca Basın İlân Kurumu İlan Portalında" | güncel | Doğru şıkta güncel üçlü. "birer gazete" ve "elektronik ortamda ilan" eski metindir, yalnız çeldirici olur. Gazete sayısı iki okumalı, sorulmaz. |
| md 34, 41, 44 | [12], [14]: KHK 703 "adli, idari ve askeri" → "adli ve idari"; md 44 (askeri kaza) mülga | | askeri yargı çeldirici bile olmaz |
| md 7/A | 6099 (2011) ekledi; 7101 (2018; yürürlük 1/1/2019) bütünüyle değiştirdi | zorunlu liste (on bir bent); talep → zorunlu; zorunlu sebep → diğer usuller; beşinci günün sonu; UETS (PTT A.Ş.); yönetmelik | 2011 metni ⚑; yalnız güncel metin |
| md 26/A | 7517 (12/6/2024; yürürlük 28/6/2024) | KKTC'deki askeri birliklerden tebligat, PTT A.Ş. personeli ya da memur vasıtasıyla | dışarıda |
| **7587 (24/6/2026; RG 1/7/2026)** | 3201 ve 2918'i değiştirdi. RG metninde 7201'e dokunan madde yok. Elektronik tebligat genişlemesi VUK md 107/A'dadır (7587 md 9). İnternet haber sitesi nitelikleri 195 sayılı Kanun md 35/A'dadır (7587 md 7). | 7201 değişmedi; resmî değişiklik tablosunun son satırı 7517 | Bankadaki güncel soru 7587'yi "elektronik tebligat kapsamını genişleten" diye anıyor. Bu, 7/A'nın değiştiği anlamına gelmez. VUK e-tebligatı ⚑. |
| md 25 | 4829/18 ikinci fıkrayı kaldırdı. Metinde "(Mülga: 19/3/2003-4829/18 md.)" satırı kendi paragrafıdır. Altındaki fıkra ("Yabancı memleketlerde bulunan kimselere … Dışişleri Bakanlığıne …") yürürlüktedir. Resmî metinde yazım hataları var: "Bakanlığıne", "damemuriyet". | | dışarıda; mülga satırı alttaki fıkraya ait sanılmaz |
| md 42, 44, 46, 57 | mülga | | sorulmaz |
| eski adlar | md 1, 3, Geçici 1 "PTT Genel Müdürlüğü" (7/A, 26/A ve Ek 2 "A.Ş." der); md 4 "il idare heyetleri"; md 11 "Ceza Muhakemeleri Usulü Kanunu"; md 34 "HUMK md 409"; md 25–26 "vekalet"; md 50 "Divanı Muhasebat"; md 60 "Maliye ve Ulaştırma bakanlıkları"; md 64 "İcra Vekilleri Heyeti"; Geçici 2 "Gümrük ve Ticaret Bakanlığı" | | ölçülen unsur olmaz |
| bab ve fasıl | Banka metninde yok: md 1–33 Umumi Hükümler; md 34–44 Kazai tebligat; md 45–49 İdari tebligat; md 50–51 Mali tebligat; md 52–57 Cezai Hükümler; md 58 vd. Müteferrik | md 35, 36, 37, 38, 39, 41 ve 43 kazai faslındadır | md 35 ve md 39 vakası yargı (dava) bağlamında kurulur. İdari tebligat ya da soruşturma vakası ⚑ |
| madde başlıkları | Banka metninde yok | ör. md 20 "Muhatabın muvakkaten başka yere gitmesi"; md 21 "Tebliğ imkansızlığı ve tebellüğden imtina"; md 28 "İlanen tebligat"; md 35 "Adres değiştirmenin bildirilmesi mecburiyeti" | tırnaklı başlık resmî başlıktan ya da konu adından alınır |

Banka metni resmî metinle betikle karşılaştırıldı. md 7'deki artık satır dışında içerik farkı yok. Kesik ya da kaymış madde yok. Yalnız madde başlıkları, bab ve fasıl adları ve dipnot işaretleri eksik. Resmî tabloda AYM satırı yok.

**Tarama uyarıları (`tara-7201.json`, 10 "eski"): hepsi yanlış alarm.**

| Uyarı (md) | Sebep | Banka |
|---|---|---|
| 6 | [4] metinde "(...)" olarak işlenmiş | güncel |
| 7 | kaynak, 7/a'nın şerhlerini md 7 bloğuna katmış | güncel (7/A ayrı) |
| 17 | [5] işlenmiş ("aynı konutta oturan kişilere") | güncel |
| 22 | [8] işlenmiş ("onsekiz"); [9] md 23'ün başlığından yapışmış | güncel |
| 25 | kaynak, 25/a'nın 2011 ek fıkrasını md 25'e katmış | güncel (25/A ayrı) |
| 28 | [10] md 29'un başlığından ("İlan şekli: [10]") yapışmış | güncel |
| 29 | [11] (7418) işlenmiş | güncel |
| 34 | [12] işlenmiş ("adli ve idari") | güncel |
| 40 | [14] md 41'in başlığından yapışmış | güncel (md 41 "Adli ve idari") |
| Geçici 2 | [16] işlenmiş ("Çevre ve Şehircilik") | güncel |

Kaynak 69 madde, banka 71 madde: kaynak 7/a ile 25/a'yı ayrı saymıyor.

### §1 Resmî sorular

| No | Sınav | Hüküm | Açı | Kök | Çeldirici türü | Gerçek değer | Zorluk |
|---|---|---|---|---|---|---|---|
| 305 | Adalet GYS 2023 (5 şık) | Elektronik Tebligat Yönetmeliği: UETS tanımı | K | doğrudan; tırnaklı tanım; ≈230 krkt | kurum sistemlerinin kısaltmaları (UYAP, MERSİS, DETSİS, SEGBİS) | — | kolay; yönetmelik |
| 306 | Adalet GYS 2023 (5) | md 60: Adalet Bakanlığı | M | doğrudan; ≈140 krkt | benzer makam | 3/4 (İçişleri, Maliye, Ulaştırma md 60'ta görüşü alınanlar) | kolay; yasak kalıp |
| 307 | Adalet GYS 2023 (5) | 7/A son fıkra | işlem türü | doğrudan | norm türü merdiveni | — | kolay; yasak kalıp |
| 308 | Adalet GYS 2023 (5) | 27/1: Dışişleri | M | doğrudan; ≈140 krkt | benzer makam | — | kolay ("yabancı → Dışişleri" sezgisi) |
| 309 | Adalet GYS 2023 (5) | Uygulama Yönetmeliği: usulsüz tebliğ ve tatil | Sn, İ | "yanlıştır"; tırnaklı başlık | olumsuzlama: "tatil günlerinde yapılamaz" (md 33 "caizdir") | — | kolay/orta; yönetmelik |
| 310 | Adalet GYS 2023 (5) | md 56: adlî para cezası | S | boşluk, iki değerli; hüküm aynen; ≈300 krkt | sayı dizisi | 7201'de başka adlî para cezası yok | kolay/orta |
| 311 | Adalet GYS 2023 (5) | md 8, 11, 12, 19 | Ş, M | "yanlıştır"; tırnaklı başlık “tebligat esasları” | kapsam genişletme: "vekil birden çoksa her birine … mecburidir" | — | orta |
| 312 | İçişleri GYS (4) | 31/1: yedi gün | S | doğrudan; ≈100 krkt | rakamla, eşit aralıklı dizi (1, 3, 5, 7) | beş (7/A/4) | kolay |
| 313 | İçişleri GYS (4) | md 60 (= [306]) | M | doğrudan | benzer makam | — | kolay; yasak kalıp |
| 314 | İçişleri GYS (4) | 24/1: sol el baş parmağı | K | doğrudan; "(istisnai durumlar hariç)" | el × parmak, 2×2 ızgara | sağ el baş parmağı (24/2) | kolay |

**Çıkarım.**
- On sorunun onu bankada; 7201 bankası resmî korpusun kendisidir.
- Ağırlık Adalet GYS'de (7/10). Hepsi tek adımlı bilgi.
- Ölçülen: e-tebligat mercii ve sistemi, vekil ve tüzel kişi, tutuklu, parmak, Dışişleri, ilan süresi, adlî para cezası. Usulsüz tebliğ ve tatil yönetmelik üzerinden.
- Ölçülmeyen çekirdek: tebliğin kime, nasıl, hangi tarihte yapıldığı. Yani md 2, 10, 20, 21, 22, 28, 35 ve 7/A/2.

### §2 Bankada ölçülenler (yeniden sorulmaz)

| Hüküm | Açı | Nerede | Sızıntı ve karar |
|---|---|---|---|
| 7/A son fıkra (yönetmelik) | işlem türü | [307] | sorulmaz (yasak kalıp) |
| 7/A/5 (UETS) | K | [305] (Elektronik Tebligat Yönetmeliği) | sorulmaz |
| 7/A/4 (beşinci günün sonu) | S | 5326 bankası ("idarî yaptırım kararlarının elektronik ortamda tebliği") | 7201 adıyla sorulmaz. Açıklama bu değeri yazmaz. |
| 8/1 (nüsha) | K | [311] A | sorulmaz |
| 11/1 ilk iki cümle, 11/2 | Ş | [311] B, C; diğer konu E | Sorulmaz. 11/1'in "ilkine yapılan tebliğ tarihi" cümlesi ölçülmemiş (yedek). |
| 12/1 (yetkili temsilcilerden birine) | M | [311] D; diğer konu A | sorulmaz |
| 14/1 (erata en yakın üst) | M | diğer konu B | sorulmaz |
| md 16 (aynı konutta oturan kişi ya da hizmetçi) | M | diğer konu D | Sorulmaz. Vakada bağlam olarak geçer. |
| md 19 (tutuklu ve hükümlü: müessese müdür ya da memuru) | M | [311] E; diğer konu C | sorulmaz |
| 24/1 (sol el baş parmağı) | K | [314] | Sorulmaz. 24/2 ve 24/5 ölçülmemiş. |
| 27/1 (resmî görevle yurt dışındaki memur: Dışişleri) | M | [308] | sorulmaz |
| md 30 (ilanın içeriği) | K | diğer konu ("sayılmamıştır": imza) | sorulmaz |
| 31/1 (son ilandan yedi gün sonra) | S | [312] | Sorulmaz. 31/2 (en çok 15 gün) ölçülmemiş. Açıklama yedi günü yazmaz. |
| md 32 (usulsüz ama öğrenilmişse geçerli; beyan edilen tarih) | Sn | [309] A, C, D (yönetmelik) | sorulmaz |
| md 33 (tatil günü tebligat caiz) | İ | [309] E (yönetmelik) | sorulmaz |
| md 53 (altı aydan iki yıla kadar hapis) | F, S | diğer konu | sorulmaz |
| md 56 (25–150 gün adlî para cezası) | S | [310] | Sorulmaz. Hapsin birlikte uygulanması ölçülmemiş (yedek). |
| md 60 (Adalet Bakanlığı; İçişleri, Maliye, Ulaştırma görüşü) | M | [306], [313] | sorulmaz (yasak kalıp). Açıklama Adalet Bakanlığını yönetmelik mercii olarak yazmaz. |
| md 23 (mazbata) | K | diğer konu (yönetmelik) | Kanun md 23 listesi sorulmaz |
| CMK süre hesabı (tebliğin ertesi günü; hafta ve ay) | S | CMK bankası (6) | 7201'de süre hesabı yok. "Tebliğ tarihi" ile "sürenin başlangıcı" karıştırılmaz. |
| CMK'da mağdurun adresinin araştırılması; tebligata rağmen gelmeyen mağdur ve sanık | K | CMK bankası (3) | 28/3 sorusunda CMK kuralı çeldirici ya da açıklama olmaz |
| İYUK [59] (adrese tebligat yapılamaması; işlemden kaldırma; bir yıl), [90] (tebligat ve cevap) | S | idare korpusu | ⚑ |
| Arama Yön.: hazır bulunacak kişiler (muhtar, ihtiyar heyeti) | K | Arama bankası | 24/5 sorusunda çeldirici kaynağı olur; açıklama Arama kuralını içerikle yazmaz |

**Ölçülmemiş:** md 1, 2, 3–7, 7/A/1–3, 9, 10, 11/1 son cümle, 13, 15, 17, 18, 20, 21, 22, 23 (Kanun), 24/2–5, 25, 25/A, 26, 26/A, 27/2, 28, 29, 31/2, 34–41, 43, 45–52, 54, 55, 56 (hapis), 58, 59, 61, Ek 1, Ek 2.

### §3 Öncelikli hükümler

| md | Değer | Açı | Neden önemli |
|---|---|---|---|
| ◆ 21/2 (+10/2) | Y | Ş, A [K→K] | Bilinen son adres elverişsizse ya da tebligat yapılamazsa adres kayıt sistemindeki yerleşim yeri adresi bilinen son adres sayılır (10/2). Bu adreste muhatap hiç oturmamış ya da sürekli ayrılmış olsa bile evrak muhtar, ihtiyar heyeti azası ya da zabıtaya teslim edilir; ihbarname kapıya yapıştırılır; yapıştırma tarihi tebliğ tarihidir. Adres meçhul sayılmaz, ilan yoluna gidilmez. "Oturmuyorsa tebliğ olmaz" sezgisini kırar. |
| md 20 ↔ 21/1 | Y | Sn, A [K→K] | md 13, 14, 16, 17 ya da 18'deki kişi muhatabın geçici olarak başka yere gittiğini bildirirse beyan mazbataya yazılır ve imzalatılır; evrak ona verilir, kabule mecburdur; tebliğ verildiği tarihte yapılmış sayılır. Beyan imzalanmaz ya da evrak alınmazsa 21'e göre işlem yapılır; tebliğ ihbarnamenin yapıştırılmasından itibaren on beş gün sonra yapılmış sayılır. 21/1'de ise yapıştırma tarihi tebliğ tarihidir. |
| ◆ 2/1 | Y | M, Ş [K→K] | Kural PTT ya da memurdur (md 1). Üç hâlde tebligat, tebliği çıkaranın kendi memurlarıyla ya da mahallî mülki idare amirinin emriyle zabıta vasıtasıyla yaptırılır: başka kanunda özel hüküm; ertelenmesinde zarar umulan iş; aynı yerdeki md 1 daireleri arası ya da bu dairelerdeki kişilere tebligat. Polisin tebligat yapmasının dayanağıdır. |
| 7/A/2–3 | O | Ş, Sn [K→K] | Zorunluluk listesi dışındaki gerçek ve tüzel kişilere talep üzerine elektronik adres verilir. Bundan sonra elektronik tebligat bu kişiler için de zorunludur. Zorunlu bir sebeple yapılamazsa diğer usuller uygulanır. "İsteyene isteğe bağlıdır" sezgisini kırar. GYS e-tebligatı soruyor ([305], [307]). |
| ◆ 28/3 (+28/2, 29, 31/2) | O | M, K | Adresi meçhul: yukarıdaki maddelere göre tebligat yapılamayan ve ikametgâhı, meskeni ya da iş yeri bulunamayan kişi. Tebliğ memuru durumu muhtara şerh verdirir. Merci adresi gerekli gördüğü resmî ya da özel kurumlara sorar, zabıtaya tahkik ve tespit ettirir. İlanı merci gerekçeli kararla verir (29). İlan gazete, internet haber sitesi ve Basın İlân Kurumu İlan Portalında yapılır (7418). Merci yedi günden uzun süre belirleyebilir, en çok 15 gün (31/2). |
| md 35 | Y | Ş, Sn, A [K→K] | Adresine usulüne uygun tebliğ yapılmış kişi adres değiştirirse yargı merciine bildirmeye mecburdur. Bildirmez ve adres kayıt sisteminde de adresi yoksa evrakın bir nüshası eski adresin kapısına asılır; asılma tarihi tebliğ tarihidir; sonraki tebliğler eski adrese yapılmış sayılır. Tüzel kişide önceden tebliğ şartı aranmaz, resmî kayıtlardaki adres esastır (35/4). 21/2 ile aynadır (§7). |
| md 22 | O | Ş | Muhatap yerine alacak kişi görünüşüne göre on sekiz yaşından küçük olmamalı ve açıkça ehliyetsiz olmamalı. 2003 öncesi on beş. Yaş tek başına sezgiyle bulunur (ters); vaka içinde kullanılır. |
| md 56 | O | F | Talike karşı koyma, koparma, imha ya da okunamaz hâle getirme: üç aydan bir yıla kadar hapis VE 25–150 gün adlî para cezası. [310]'un kökü hapsi göstermez; o kökü bilen aday "adlî para cezası" sanar. |
| md 18 | O | M, Sn | Otel, hastane, fabrika, okul, yurt "gibi" yerlerde tebliği yeri idare eden ya da kısım amiri temin eder; olmazsa onlara yapılır. Sezgiyle bulunur. |
| md 11/1 son cümle | O | Sn | Birden fazla vekile tebligat yapılmışsa ilkine yapılan tebliğ tarihi esastır. |
| Ek 1 | O | Sn [K→K] | Kat mülkiyetinde adres bildirmeyen bağımsız bölüm sahibine yapılacak tebligat bölümde fiilen oturana yapılır, örneği ilan tahtasına asılır, sahibine yapılmış sayılır. Oturan yoksa ilan tahtasındaki örnek yeterlidir. Kolluk bağı yok. |
| ◆ 24/5 | D/O | M | Okur yazar komşu bulunmaz ya da komşu imzadan kaçınırsa muhtar, ihtiyar heyeti azası ya da bir zabıta memuru davet edilir. 24/1 bankada. |
| md 10/3 | D/O | İ | Muhatabın başvurusu ya da kabulüyle her yerde tebligat yapılabilir. Sezgiyle bulunur (ters). |
| md 39 | D/O | İ | Davada hasım olan kişiye muhatap adına tebliğ yapılamaz. Hakkaniyet sezgisiyle bulunur (ters). |
| md 36 | D/O | K | Kalemde ya da duruşmada imza karşılığı tevdi tebliğ hükmündedir; mazbata düzenlenmez, masraf alınmaz. |
| md 43 | D | M | Cumhuriyet Başsavcılığına tebligat varaka aslının gösterilmesiyle yapılır; süre başlatacaksa savcı gösterildiği günü aslına işaret ve imza eder. PAEM değeri düşük. |

### §4 Değer tabloları

**Tebliğ tarihi**

| Hâl | Tebliğ tarihi | Hüküm | Bankada |
|---|---|---|---|
| Elektronik tebligat | elektronik adrese ulaştığı tarihi izleyen beşinci günün sonu | 7/A/4 | evet (5326 adıyla) |
| Muhatap ve yerine alacak kimse yok, ya da almaktan kaçınılıyor | ihbarnamenin kapıya yapıştırıldığı tarih | 21/1 | hayır |
| Adres kayıt sistemindeki adres; muhatap hiç oturmamış ya da sürekli ayrılmış | ihbarnamenin kapıya yapıştırıldığı tarih | 21/2 | hayır |
| Muhatap geçici olarak başka yerde; evrak md 13, 14, 16, 17, 18'deki kişiye verildi | verildiği tarih | 20 son cümle | hayır |
| Aynı hâlde beyan imzalanmadı ya da evrak alınmadı; ihbarname yapıştırıldı | yapıştırmadan itibaren on beş gün sonra ✱ | 20 son cümle | hayır |
| İlanen tebligat | son ilandan itibaren yedi gün sonra; merci daha uzun süre belirleyebilir, en çok 15 gün ✱ | 31 | yedi gün evet; 15 gün hayır |
| Usulsüz tebliğ, muhatap öğrenmiş | muhatabın beyan ettiği tarih | 32 | evet ([309], yönetmelik) |
| Adres değişikliği bildirilmemiş, adres kayıt sisteminde de adres yok | evrak nüshasının eski adresin kapısına asıldığı tarih | 35/2 | hayır |
| Yurt dışındaki Türk vatandaşına elçilik ya da konsolosluk bildirimi | otuz gün içinde başvurmazsa otuzuncu günün bitimi ✱; başvurup almaktan kaçınırsa tutanak tarihi | 25/A | hayır |
| Yurt dışı adresini değiştirip bildirmeyen Türk vatandaşı | bildirimin adrese ulaştığının belgelendiği tarihten otuz gün sonra ✱ | 35/5 | hayır |
| Birden fazla vekile tebligat | ilkine yapılan tebliğ tarihi | 11/1 | hayır |
| Kalemde ya da duruşmada imza karşılığı tevdi | tevdi (tebliğ hükmünde) | md 36 | hayır |
| Kat mülkiyeti: fiilen oturana yapılan ya da ilan tahtasına asılan tebligat | sahibine yapılmış sayılır | Ek 1 | hayır |

**Öteki süreler**

| Değer | Yer |
|---|---|
| bir hafta | 29/3 iki ilan arası (en az). "Yedi gün" ile eşdeğerdir; aynı şık takımına girmez. |
| bir ay ✱ | Ek 2/3 bildirim ve işlem. "Otuz gün" ile eşdeğerdir. |
| bir yıl, altı ay, üç ay, bir ay | Geçici 1–2 (sorulmaz) |
| altı ay | md 63 yürürlük (sorulmaz) |

- **Gün havuzu:** beş (7/A/4; bankada 5326 adıyla), yedi (31/1; bankada), on beş ✱ (md 20; 31/2), otuz ✱ (25/A; 35/5). Dört gerçek değer.
- Süre sorusu yalnız ✱ kilitle kurulur. Kök olayı açık yazar: geçici başka yer + almaktan kaçınma (md 20); ilan süresinin uzatılması (31/2).
- **Yaş:** tek gerçek değer on sekizdir (md 22); eski on beş. Yaş sorusu kurulmaz.

**Cezalar** (değer sorusu kurulmaz)

| Fiil | Ceza | Hüküm |
|---|---|---|
| kendisine ya da başkasına ait isim veya adresi yanlış bildirme | altı aydan iki yıla kadar hapis | md 53 (bankada) |
| muhatap adına alan, evrakı en kısa zamanda vermez ve gecikme ya da zarar doğar | bir yıla kadar hapis ✱ | 54/1 |
| tebligatı almayan muhatap; kabule mecbur olup kabul etmeyen | 54/1'deki ceza ("yukarıda belirtilen cezalar") | 54/2 (iki okumalı) |
| yalan beyan: (a) muhatap kendisi hakkında; (b) muhatap adına alabilecek kişi muhatap hakkında; (c) yetkisi olmadığı hâlde kimlik ve sıfatı hakkında yalan beyanla evrakı alan | her biri bir yıla kadar hapis ✱; gecikme ya da zarar doğarsa ayrıca (a), (b) üç aydan bir yıla ✱, (c) bir yıldan beş yıla | md 55 ("daha ağır bir cezayı gerektirmediği takdirde"; iki okumalı) |
| evrakın ya da ihbarnamenin talikine karşı koyma; koparma, imha, okunamaz hâle getirme | üç aydan bir yıla kadar hapis ✱ ve 25–150 gün adlî para cezası | md 56 (adlî para cezası bankada) |
| uygulamada görevli memur ve muhtar | TCK'nın kamu görevlisi hükümleri; disiplin cezasına engel değil | md 52 |

**Merciler ve aktörler**

| Aktör | Yer · iş |
|---|---|
| PTT (Genel Müdürlük ya da A.Ş.) | md 1 tebligatı yapan (memurla seçimlik) · md 3, 7 tarife · 7/A UETS'yi kurar ve işletir · 26/A · md 58 şikâyet · Ek 2 elektronik adres |
| memur | md 1 · 2/1 "kendi memurları" · md 41 yargı mercilerinin kendi memurları · md 48 gümrük |
| mahallî mülki idare amiri | 2/1 zabıtaya emir · md 50 Sayıştay tebligatı |
| zabıta amir ve memurları ✱ | 2/1 tebligat · 21/1–3 evrakı teslim alır, kabule mecbur · 24/5 hazır bulunur · 28/3 adres tahkiki |
| muhtar · ihtiyar heyeti azası ✱ | 21 evrakı teslim alır, kabule mecbur · 24/5 hazır bulunur · 28/3 meçhul adresi şerh eder (yalnız muhtar) · md 52 TCK kamu görevlisi |
| en yakın komşu · yönetici · kapıcı | 21/1 yalnız haber verilir (adreste bulunmama hâlinde, mümkün oldukça) |
| komşu | 24/1 parmak bastırmada hazır bulunur ve imzalar |
| aynı konutta oturan kişi · hizmetçi | md 16 (bankada) · md 17 · md 20 |
| daimi memur ya da müstahdem | md 17 meslek yerinde · md 13 tüzel kişide |
| yeri idare eden · kısım amiri | md 18 temin eder; olmazsa ona yapılır |
| müessese müdür ya da memuru | md 19 temin eder (bankada) |
| tebliğ memuru | md 20 beyanı yazar, imzadan kaçınmayı şerh eder · md 21 teslim ve yapıştırma · 28/3 muhtara şerh verdirir |
| tebliği çıkaran merci ✱ | md 5 masraf süresi · md 7 vasıtayı tensip (mahkeme başkanı, hâkim, diğer merciler) · 28/3 kurumlara sorar, zabıtaya tahkik ettirir · 28/4 yurt dışına iadeli taahhütlü mektup · md 29 ilan kararı, ikinci ilan · 31/2 süreyi uzatır |
| yargı (kaza) mercii | 35/1 adres değişikliği buraya bildirilir · md 36, 37, 41 |
| Cumhuriyet Başsavcılığı | md 43 |
| Dışişleri · Büyükelçilik ve Konsolosluk | 25/3, md 26, 27/1 (bankada) · 25/A bildirim; yargı mercileri evrakı doğrudan gönderebilir · 35/5 |
| kuvvet komutanlıkları · Jandarma Genel Komutanlığı | md 15 · 27/2 |
| Adalet Bakanlığı | md 60 yönetmelik (bankada) |
| Basın İlân Kurumu İlan Portalı | 29/1 |
| tapu idaresi · apartman yöneticisi | md 49 · Ek 1 |

- **Varsayılan:** "muhtar", "tebliği çıkaran merci", "PTT", "Adalet Bakanlığı", "Dışişleri".
- **Çiftler:** muhtar (21 teslim) ↔ muhtar (28/3 şerh) ↔ komşu ya da kapıcı (21/1 haber); mülki idare amiri ↔ tebliği çıkaran merci ↔ kolluk amiri (md 2); tebliğ memuru ↔ merci (28/3).
- **Seçimlik ve iç içe merciler aynı şık takımına girmez:** "muhtar", "ihtiyar heyeti azası" ve "zabıta" (21, 24/5 seçimliktir, iki doğru doğar); "mülki idare amiri" ile "vali" ya da "kaymakam"; "tebliği çıkaran merci" ile "mahkeme başkanı" ya da "hâkim" (md 7).

### §5 Ayırt etme malzemesi

- **Muhatap adreste yoksa: kime ve nasıl** [K→K] ◆
  - md 16: aynı konutta oturan kişi ya da hizmetçi (bankada).
  - md 17: meslek ya da sanat yerinde daimi memur veya müstahdem; evinde icra edende bunlar yoksa aynı konutta oturan.
  - md 13: tüzel kişinin temsilcisi iş yerinde yoksa orada hazır bulunan memur ya da müstahdem.
  - md 18: otel, hastane, fabrika, okul, yurt "gibi" yerlerde yeri idare eden ya da kısım amiri temin eder; olmazsa ona yapılır.
  - md 19: tutuklu ve hükümlüde müessese müdür ya da memuru temin eder (bankada). "Ona yapılır" kaydı md 19'da yok ⚑.
  - md 22: muhatap yerine alacak kişi görünüşüne göre on sekiz yaşından küçük ve açıkça ehliyetsiz olmamalı.
  - md 20: bu kişiler muhatabın geçici olarak başka yere gittiğini bildirirse beyan mazbataya yazılır, evrak onlara verilir, kabule mecburdurlar.
  - 21/1: kimse yoksa ya da almaktan kaçınılırsa evrak muhtar, ihtiyar heyeti azası ya da zabıtaya imzayla teslim edilir; ihbarname kapıya yapıştırılır; adreste bulunmama hâlinde en yakın komşu, yönetici ya da kapıcıya "mümkün oldukça" haber verilir.
  - **Güçlü çeldiriciler:** evrakın komşuya ya da kapıcıya bırakılması; on beş yaşındaki kişiye tebliğ (eski metin); "aile bireyi olması" şartı (eski metin); tutuklu yerine müdüre tebliğ (⚑).
- **Tebliğ tarihi** [K→K]: §4 tablosu. En güçlü ayrım 21/1 ↔ 20.
  - Vaka "muhatabın geçici olarak başka bir yere gittiğini bildiren" beyanı açık yazar; yazmazsa 21/1 uygulanır ve iki cevap doğar.
  - Muhatap yerine alacak kişinin yetişkin olduğu yazılır (md 22).
- **Adres zinciri** [K→K] ◆: 10/1 → 10/2 → 21/2; md 28; md 35; 10/3.
  - Kilit: adres kayıt sistemindeki adreste muhatap hiç oturmamış olsa bile adres meçhul sayılmaz; ilana gidilmez. 28/2 meçhulü "yukarıdaki maddelere göre tebligat yapılamayan" kişi diye tanımlar.
  - md 35'in şartları: önce usulüne uygun tebliğ yapılmış olmalı (tüzel kişide aranmaz, 35/4); yeni adres bildirilmemiş; adres kayıt sisteminde yerleşim yeri adresi de yok.
  - 28/3'te iki aktör var: tebliğ memuru meçhul olduğunu muhtara şerh verdirir; merci adresi kurumlara sorar ve zabıtaya tahkik ettirir. İlan kararını merci gerekçeyle verir (29).
  - **Güçlü çeldiriciler:** 21/2 vakasında "ilan" ve "geri gönderme"; md 35 vakasında "ilan" ve "muhtara teslim"; md 28 vakasında "doğrudan ilan".
- **Memur ve zabıta eliyle tebligat** ◆
  - md 1 (PTT ya da memur) ↔ 2/1 (üç hâl: kendi memurları ya da mülki idare amirinin emriyle zabıta) ↔ md 41 (yargı mercilerinin kendi memurları) ↔ 28/3 (zabıta adres tahkiki; tebligat değil) ↔ 2/2 (zor kullanma ve soruşturma hükümleri saklı).
  - Çiftler: mülki idare amiri ↔ tebliği çıkaran merci (28/3 aktarımı) ↔ il emniyet müdürü (kolluk amiri sezgisi).
  - Çeldirici olmaz: Cumhuriyet başsavcısı (2/2 nedeniyle iki okumalı); vali ya da kaymakam tek başına (mülki idare amiri onları kapsar, iki doğru); "kendi memurları" (2/1'in öbür yolu, doğrudur).
- **Muhtarın üç rolü** ◆: md 21 (evrakı teslim alır, kabule mecbur) ↔ 24/5 (okur yazar komşu yoksa imza edemeyen muhatabın tebliğinde hazır bulunur) ↔ 28/3 (meçhul adresi şerh eder). Zabıta 21 ve 24/5'te muhtarın seçimlik eşidir; 28/3'te şerh yalnız muhtara verdirilir.
- **E-tebligat** [K→K]: 7/A/1 zorunlu liste ↔ 7/A/2 talep → zorunlu ↔ 7/A/3 zorunlu sebep → diğer usuller ↔ 7/A/4 beşinci gün (bankada) ↔ Ek 2 adres (kimlik numarasına göre tek adres; ikinci fıkradakilere doğrudan teslim). VUK 107/A (vergi e-tebligatı) ⚑.
- **Cezai** ◆: md 53 (bankada) ↔ 54/1 (gecikme ya da zarar şartı) ↔ 54/2 (almayan muhatap; kabule mecbur olup kabul etmeyen) ↔ md 55 (a, b, c) ↔ md 56 (hapis VE adlî para cezası). Değer sorusu yok; 54 ve 55 iki okumalı (§6).
- **6458 sınırı:** 6458 md 100 tebligatı 7201'e bağlar. md 53/2 sınır dışı kararını yabancıya, yasal temsilcisine ya da avukatına tebliğ ettirir; 53/3 yedi gün. 7201 sorusu yabancı ya da sınır dışı vakası kurmaz.

### §6 Kaçınılacaklar (BAĞLAYICI)

- **Metin ve eski metin**
  - md 7'deki dipnot artığı satır (kanun metni değildir).
  - Eski değerler: on beş yaş (md 22); "birlikte oturan aile efradı" (16, 17); "birer gazete" ve "elektronik ortamda ilan" (29/1); askeri yargı (34, 41, 44). Yalnız çeldirici olurlar; yanlışlıkları güncel metinle kanıtlanır.
  - Eski adlar ölçülen unsur olmaz (Metnin durumu tablosu).
  - md 25'teki mülga satır; 7/A'nın 2011 metni; 7587'nin 7201'i değiştirdiği yanılgısı.
- **Bankada ölçülmüş:** §2'deki her şey. Değerleri açıklamada da içerikle yazılmaz: yedi gün ([312]), beşinci gün (5326), Adalet Bakanlığı ([306], [313]), sol el baş parmağı ([314]).
- **Varsayılan cevaplı ya da tek başına sezgiyle bulunan sorular**
  - md 60 ve 7/A son fıkra (yönetmelik); md 1 (PTT); 25/3 ve 27/1 (Dışişleri); md 19; 14/1.
  - md 18, 13 ve 17 tek başına; 28/1 tek başına (meçhul → ilan); 21/3 tek başına; 10/3; md 39; md 36 tek başına.
- **Sayı:** ceza süreleri ve adlî para cezası (53–56); yaş tek başına; parmaklar (md 24); 7/A/1'in sıra numaraları; Ek 2 ve Geçici süreleri; 29/1'deki gazete sayısı.
- **İki okumalı**
  - 29/1: 7418'den sonra ilanın kaç gazetede yapılacağı ("bir gazete").
  - 54/2: "yukarıda belirtilen cezalar" atfı 54/1'deki gecikme ya da zarar şartını taşıyor mu; muhtar ve zabıta için md 52 ile ilişkisi.
  - md 55: "daha ağır bir cezayı gerektirmediği takdirde" kaydının TCK (ör. resmî belgeye yalan beyan) ile ilişkisi.
  - "Zabıta"nın belediye zabıtasını kapsayıp kapsamadığı.
  - 21/2'de komşuya haber verilip verilmeyeceği (21/1'deki kayıt 21/2'de yok).
  - md 35 ve 39'un idari tebligatta ve soruşturmada uygulanması (ikisi de kazai faslında).
  - md 19'da müessese müdürüne tebliğ yapılıp yapılamayacağı (md 20 md 19'u saymaz).
  - md 18'deki "gibi" listesinin kapsamı.
  - 2/2 nedeniyle Cumhuriyet başsavcısının zabıtaya tebligat yaptırması.
  - 7/A/1'deki "tüm özel hukuk tüzel kişileri" ile gerçek kişi tacir; VUK 107/A.
  - md 22'deki "açıkça ehliyetsiz" ölçütü (vaka kurulmaz).
  - Usulsüz tebliğde öğrenmenin ve tarihinin ispatı ([309] B; Kanun susar, yönetmelik metni bu turda okunmadı).
- **Metin dışı (⚑):**
  - Tebligat Uygulama Yönetmeliği ve Elektronik Tebligat Yönetmeliği. Türetim istisnasında değildir; hiçbir doğru şık, çeldirici ya da açıklama onlara dayanmaz.
  - gece tebligatı; tebliğ memurunun kimlik kontrolü; ihbarnamenin içeriği (yalnız "tesellüm edenin adresini" içerdiği yazılı);
  - "MERNİS" adı (Kanun "adres kayıt sistemi" der); KEP; e-Devlet; UYAP; VUK 107/A;
  - nezarethane ve gözaltı (md 19 "mevkuf" der); tebligat sırasında zor kullanma (2/2 yalnız saklı tutar);
  - CMK md 35–37 ve süre hesabı; İYUK'un davacı adresi kuralları; 6458'in yabancıya özgü tebliği.
- **Düşük değerli:** md 3–9, 14, 15, 23, 25, 26, 26/A, 27, 34, 37, 38, 40, 42–51, 57–64; Ek 2; Geçici 1–2.

### §7 Parti önerisi: `7201-p1` (en çok 6; önerilen 5)

| # | Hüküm | Açı / kök | Zorluk | Doğal çeldirici kaynağı |
|---|---|---|---|---|
| 1 | ◆ 21/2 (+10/2) ↔ md 28 ↔ 35/2 | Tebligat muhatabın adres kayıt sistemindeki adresine çıkarılmış; muhatabın orada hiç oturmadığı (ya da sürekli ayrıldığı) anlaşılmış. Tebliğ memuru ne yapar [K→K]. Doğrudan kök; fiziki tebligat açıkça kurulur. Doğru şık kısa: "evrakı muhtara teslim eder, ihbarnameyi kapıya yapıştırır". Varsayılan "muhtar" iki şıkka bölünür. | orta/zor | md 28 ("adresin meçhul olduğunu muhtara şerh verdirir; ilanen tebliğ edilir"); geri gönderme (uygulamadaki "adreste tanınmıyor" iadesi; adres zabıtaya araştırtılır, 28/3); 35/2 ("evrakın bir nüshasını kapıya asar"); 21/1'in haber kaydı ("evrakı en yakın komşuya ya da kapıcıya bırakır") |
| 2 | md 20 son cümle ↔ 21/1 (↔ 31/1, 25/A) | Vaka (partide tek): muhatabın geçici olarak başka bir yere gittiğini bildiren, onunla aynı konutta oturan yetişkin kişi evrakı almaktan kaçınmış; ihbarname kapıya yapıştırılmış. Tebliğ hangi tarihte yapılmış sayılır [K→K]. Kök evrakın kime teslim edildiğini yazmaz. | zor | yapıştırma tarihi (21/1; en güçlü); yapıştırmadan yedi gün sonra (31/1 ✱, bankada); otuz gün sonra (25/A, 35/5 ✱); "muhatabın adrese döndüğü tarih" (sezgi; sağduyuyla elenen tek şık). Şıklar artan sıradadır: yapıştırma günü, yedi, on beş, otuz, dönüş. |
| 3 | ◆ 2/1 | Ertelenmesinde zarar umulan işte zabıta vasıtasıyla tebligat kimin emriyle yaptırılır [K→K] M; doğrudan kök. Doğru: mahallî mülki idare amiri. | orta | tebliği çıkaran merci (28/3'teki zabıta tahkikinden aktarım); il emniyet müdürü (kolluk amiri sezgisi); Adalet Bakanlığı (md 60 varsayılanı; bankada); muhtar (zayıf; sağduyuyla elenen tek şık). "Kendi memurları", Cumhuriyet başsavcısı, vali ve kaymakam şık olmaz (§5). |
| 4 | 7/A/2 (↔ 7/A/3, 10/2) | Elektronik tebligat zorunluluğu bulunmayan bir gerçek kişiye talebi üzerine elektronik adres verilmiş; bu kişiye tebligat nasıl yapılır [K→K]. Doğrudan kök. Doğru şık kanunun ifadesidir: "elektronik yolla yapılması zorunludur". | kolay/orta | "kişinin tercihine göre elektronik yolla ya da adresine"; "önce bilinen en son adresine, yapılamazsa elektronik adresine" (10/2 sırası); "elektronik yol yargı mercilerinin tebligatıyla sınırlıdır". 7/A/3 (zorunlu sebep → diğer usuller) ve Ek 2 (kimlik numarasına göre tek adres, doğrudan teslim) şık olmaz: doğrudurlar. "Ulaştığı gün yapılmış sayılır" şıkkı kullanılmaz: açıklaması bankadaki beşinci günü yazdırır. |
| 5 | ◆ 28/3–4, md 29, 31/2 | “ilanen tebligat” (tırnaklı başlık); YANLIŞTIR. Yanlış önerme 31/2'den: "merci daha uzun süre belirleyebilir; bu süre otuz günü geçemez" (gerçek değer ✱). | orta | Doğru önermeler, sıra oluşturmayanlardan: merci adresi zabıta vasıtasıyla tahkik ve tespit ettirir (◆); yurt dışında oturana evrak ve ilan suretleri iadeli taahhütlü mektupla da gönderilir; ilan Basın İlân Kurumu İlan Portalında da yapılır; merci ikinci ilan kararı verebilir, ikinci ilan yabancı ülke gazetesiyle de yaptırılabilir (ya da: evrak ve ilan sureti merciin herkesin görebileceği yerine de asılır). Yanlış önerme yedekleri: adres tahkikini tebliğ memurunun yaptırması (rol değişimi); iki ilan arası on beş günden az olamaz (29/3; ✱). |

- **Yedek** (değer sırasıyla):
  - md 35. Tüzel kişi biçimi (35/4) tercih edilir: daha önce hiç tebligat yapılmamış tüzel kişi resmî kayıtlardaki adresinden ayrılmış, yeni adresini bildirmemiş. Vaka "elektronik yolla tebligat zorunlu bir sebeple yapılamadı" der; yoksa 7/A/1 soruyu bozar. Çeldiriciler: ilan (md 28); temsilcinin adres kayıt sistemindeki adresine (12 + 10/2); zabıtaya adres araştırması (28/3); "önce usulüne uygun bir tebliğ yapılmış olmalı" (35/1'in şartını tüzel kişiye taşıma). #1 ile aynadır: birlikte yazılırsa #1'de "kapıya asma", 35'te "muhtara teslim" şıkkı olmaz.
  - md 22 + 21/1: muhatap yokken adreste yalnız görünüşüne göre on sekiz yaşından küçük bir kişi var. Çeldiriciler: ona tebliğ (eski on beş yaş), komşuya bırakma, ilan, geri gönderme. #1 ile aynı doğru şıkkı taşır; yalnız #1 düşerse yazılır.
  - md 56: talikle ilgili fiile hapis VE adlî para cezası. [310] ile aynı madde; gözcü mükerrer sayabilir.
  - Ek 1 (kat mülkiyeti; sezgiye aykırı sonuç; kolluk bağı yok).
  - 11/1 son cümle (ilk vekile yapılan tebliğ tarihi; [311] B'ye komşu).
  - ◆ 24/5 (muhtar, ihtiyar heyeti azası ya da bir zabıta memuru huzurunda; [314] ile aynı madde; Arama Yön.'deki "iki kişi" çeldiricisi).
- **Dışarıda:**
  - md 1, 3–7; 7/A/1 listesi (ezber; sezgiyle bulunur); 7/A/4–6 (bankada);
  - md 8, 9, 11/1 ilk iki cümle, 11/2–3, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24/1–4;
  - md 25, 25/A, 26, 26/A, 27; 28/1 tek başına; md 30, 31/1, 32, 33;
  - md 34, 36–41, 43, 45–55, 57–64; Ek 2; Geçici 1–2.
- **Kök tipi (5 soru):**
  - Doğrudan 3 (1, 3, 4; üçü de koşul→kural), vaka 1 (2), olumsuz 1 (5).
  - "Doğrudur", öncüllü ve boşluk yok.
  - Koşul→kural 4/5, ayırt etme 2/5 (1, 2).
- **Zorluk:** kolay 1 (4), orta 2–3 (3, 5; 1 orta da olabilir), zor 1–2 (2; 1). Sınav değeri taşımayan yuva boş kalır.
- **Parti içi sızıntı:**
  - 1 ↔ 2: 2'nin kökü ve şıklarında muhtar geçmez; yalnız "ihbarname kapıya yapıştırıldı" denir. Yoksa 1'in cevabını verir. İkisi aynı kısa denemeye konmaz.
  - 1 ↔ 5: 5'in doğru önermeleri 28/2'yi (meçhulün tanımı) içermez; içerirse 1'deki "ilan" çeldiricisini düşürür. 5'te "muhtara şerh" önermesi 1'deki şıkla aynı kalıpta yazılmaz.
  - 3 ↔ 5: 5'teki zabıta tahkiki önermesi 3'ün "tebliği çıkaran merci" çeldiricisini besler; cevabı vermez. Aynı kısa denemeye konmaz.
  - 2 ↔ 5: 5'teki "otuz" ile 2'deki "otuz gün sonra" farklı olayların değeridir. 5'in açıklaması on beş günü yazarken md 20'ye, 2'nin açıklaması 31/2'ye değinmez.
  - 4: öbürleriyle temas yok.

---

## §8 İki kanuna özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız güncel madde gövdesinden kurulur. "Metnin durumu" tabloları bağlayıcıdır.
   - 3071: AYM yok. Yabancılar 2003'te (4778) girdi; 8/2 2011'de (6253) eklendi. md 11'deki Bakanlar Kurulu ölçülmez.
   - 7201: AYM yok; son değişiklik 7517 (2024). 7587 (2026) 7201'e dokunmaz; vergi e-tebligatı (VUK 107/A) ⚑.
   - 7201 md 7'deki dipnot artığı kanun metni değildir.
   - Eski metin yalnız çeldirici olur ve yanlışlığı güncel metinle kanıtlanır: on beş yaş; "birlikte oturan aile efradı"; "birer gazete" ve "elektronik ortamda ilan"; askeri yargı.
   - Eski adlar ölçülen unsur olmaz: PTT Genel Müdürlüğü, il idare heyeti, HUMK, CMUK, vekalet, Divanı Muhasebat, İcra Vekilleri Heyeti, Maliye ve Ulaştırma bakanlıkları, Bakanlar Kurulu.
   - Yokluktan yargı kurulmaz.
2. **Sayı ve süre.**
   - 3071: üç süre de bankada; süre sorusu yok. "iş günü" 3071'de geçmez.
   - 7201: gün havuzu beş, yedi, on beş ✱, otuz ✱ (§4). Süre sorusu yalnız ✱ kilitle kurulur.
   - Eşdeğer şık yasak: "bir hafta" ile "yedi gün", "bir ay" ile "otuz gün" aynı takıma girmez.
   - Sorulmaz: ceza süreleri ve adlî para cezası; yaş tek başına (tek gerçek değer); parmaklar; 7/A/1 sıra numaraları; Ek 2 ve Geçici süreleri; 29/1'deki gazete sayısı.
   - Sayı şıkları tek birimli ve artan sıralıdır; en az iki, mümkünse üç gerçek çeldirici taşır. Uydurma değer partide en çok bir.
3. **Varsayılan.**
   - Varsayılan cevaplar:
     - 3071: "otuz gün", "İçtüzük", "yetkili makama gönderilir", "Dilekçe Komisyonu";
     - 7201: "muhtar", "tebliği çıkaran merci", "PTT", "Adalet Bakanlığı", "Dışişleri", "yedi gün".
   - Doğru şık varsayılanla örtüşüyorsa varsayılan bir çeldiriciye bölünür. Çiftler:
     - muhtara teslim ve ihbarname (21) ↔ muhtara şerh ve ilan (28/3) ↔ komşuya ya da kapıcıya bırakma (21/1);
     - mülki idare amirinin emriyle zabıta (2/1) ↔ tebliği çıkaran merci (28/3 aktarımı) ↔ kolluk amiri;
     - yapıştırma tarihi (21/1) ↔ yapıştırmadan on beş gün sonra (md 20) ↔ yedi gün sonra (31/1) ↔ otuz gün sonra (25/A);
     - elektronik tebligat zorunlu (7/A/2) ↔ tercihe bağlı ↔ önce fiziki adres (10/2);
     - 3071'de konunun kendisiyle ilgili olması (4982) ↔ Türkçe (Anayasa) ↔ ikamet (sezgi).
   - Böyle bir çift kurulamıyorsa soru yazılmaz.
4. **Ters ayırt etme yasağı.** Bilmeyen adayın sezgiyle bulduğu, eksik bilenin yanıldığı soru yazılmaz. Sezgiyi yanlışa götüren hüküm soru lehinedir.

   | Sezgi | Doğruya götürdüğü yer → karar | Yanlışa götürdüğü yer (lehte) |
   |---|---|---|
   | "Yetkisiz makam yetkili makama gönderir" | 3071 md 5 → yazılmaz | — |
   | "İdare vatandaşı bilgilendirir" | 3071 md 7 son cümle → yazılmaz | — |
   | "Yabancı ancak kendi işi için başvurur" (4982 aktarımı) | — | 3071-p1 #1 |
   | "Türkçe şartı yabancıya ağır gelir" | [43] (bankada) | 3071-p1 #1 |
   | "Dilekçe hakkı herkesindir" (ikamet aranmaz) | — | 3071-p1 #1 |
   | "Adresi bilinmeyene ilan" | 7201 28/1 → tek başına yazılmaz | 21/2 (#1), md 35 |
   | "Orada oturmuyorsa tebliğ olmaz, geri gönderilir" | — | 21/2 (#1) |
   | "Evrak komşuya bırakılır" | — | 21/1 (#1 çeldiricisi) |
   | "Muhatap öğrenince tebliğ olur", "en lehe tarih" | — | md 20 (#2) |
   | "Acil işte polis tebliğ eder" | md 2'nin koşulu → koşul biçimi yazılmaz | — |
   | "Polis mülki amire bağlıdır" | md 2'nin mercii → kolluk amiri ve merci çeldiricisi şart (#3) | — |
   | "Reşit olan alır" | md 22'nin yaşı → yaş tek başına yazılmaz | eski on beş yaş (yedek) |
   | "Kabul ederse her yerde tebliğ olur" | 10/3 → yazılmaz | — |
   | "Hasma evrak bırakılmaz" | md 39 → yazılmaz | — |
   | "Hastanede yönetim, iş yerinde çalışan alır" | md 18, 13, 17 → yazılmaz | — |
   | "Resmî görevli evrakı reddedemez" | 21/3 → tek başına yazılmaz | — |
   | "İmzayla alınan evrak tebliğ sayılır" | md 36 → tek başına yazılmaz | — |
   | "Yabancı ülke → Dışişleri" | 25/3, 27/1 (bankada) → yazılmaz | — |
   | "Tebligatı PTT yapar" | md 1 → yazılmaz | 2/1 (#3) |
   | "E-tebligat isteğe bağlıdır" | — | 7/A/2 (#4) |
   | "Küçük fiile idari para cezası" | — | md 56 (yedek) |
   | "Usulsüz tebliğ geçersizdir", "tatilde tebliğ olmaz" | — | md 32, 33 (bankada) |
5. **Koşul → kural ekseni** (partinin en az 1/4'ü). Kök tek bir koşulu sabitler; şıklar aynı karar uzayından gelir.
   - 3071: başvuranın sıfatı (yabancı) → aranan ve aranmayan şart.
   - 7201: muhatabın durumu → işlem ve tebliğ tarihi (yok; geçici başka yerde; kaçınıyor; hiç oturmamış; adres değiştirmiş; meçhul).
   - 7201: işin türü (ertelenmesinde zarar) → yapan ve emir veren.
   - 7201: talep → elektronik tebligat rejimi.
6. **Çakışma ve mükerrer.** Başka kanunun ölçtüğü içerik yalnız ad değiştirilerek sorulmaz.
   - 3071 sorusu şunları sormaz: 4982 md 2, 4, 6, 7/3, 11–13; Anayasa md 74'ün tanımı ve yabancıya tanınması; 4483 md 4; TCK 121; [42]–[45], [273].
   - 7201 sorusu şunları sormaz: 5326 bankasındaki e-tebliğde beşinci gün; CMK süre hesabı ve mağdurun adresinin araştırılması; İYUK [59] ve [90]; Arama Yön.'deki hazır bulunacaklar; iki tebligat yönetmeliği; [305]–[314].
   - "Tebliğ tarihi" ile "sürenin başlangıcı" aynı şık takımında karıştırılmaz.
7. **İki okumalı hükümler** doğru şıkta, çeldiricide ve açıklamada kullanılmaz. Liste her kanunun §6'sındadır. En önemlileri:
   - 3071: 8/2'deki yükümlülüğün kapsamı; md 5'in TBMM'ye verilen dilekçeye uygulanması.
   - 7201: 29/1'deki gazete sayısı; 54/2'nin şartı ve md 52 ile ilişkisi; md 55'teki "daha ağır ceza"; "zabıta"nın belediye zabıtasını kapsaması; md 35 ve 39'un idari tebligatta ve soruşturmada uygulanması; md 19'da müdüre tebliğ; 2/2 nedeniyle savcının emri.
8. **Vaka.** 1–2 cümle, en çok 250 karakter; partide en çok bir. Unvanlı ya da sıfatlı yazılır; ad ve hikâye yok.
   - 7201 vakası muhatabın durumunu ve kimin ne beyan ettiğini açık yazar: "geçici olarak başka bir yere gittiğini bildirdi", "almaktan kaçındı", "adres kayıt sistemindeki adres", "hiç oturmamış".
   - Muhatap yerine alacak kişinin yetişkin olduğu yazılır (md 22).
   - Fiziki tebligat açıkça kurulur. Elektronik tebligat şıkkı yer almaz. Tüzel kişi muhatapta 7/A/3 kaydı yazılır.
   - "Polis memuru" ya da "karakol" yazılabilir (polis zabıtadır); "belediye zabıtası" yazılmaz.
   - Yabancı uyruklu muhatap ve sınır dışı vakası kurulmaz (6458).
   - md 35 ve md 39 vakası dava bağlamında kurulur.
9. **Liste soruları.** "Sayılmamıştır" ya da "aranmaz" yalnız kapalı listede kurulur; çeldirici komşu listeden gelir.
   - Kapalı listeler: 3071 3/2 (ikamet, karşılıklılık, Türkçe) ve md 4 (üç öğe); 7201 2/1 (üç hâl), 7/A/1 (on bir bent), md 9, md 23, md 30 (bankada).
   - Açık uçlu kayıtlar: 7201 md 18 ("gibi"), 28/3 ("gerekli gördüklerine"). Bunlarda kök "kanun metninde AÇIKÇA SAYILAN" der.
   - 3071-p1 #1'de doğru şık dışında 3071'de aranmayan hiçbir unsur şıkta yer almaz (§7).
10. **Biçim ve sızıntı.**
    - Kök "3071 sayılı Kanun'a göre," ya da "7201 sayılı Kanun'a göre," ile açılır. Madde, fıkra ve bent numarası yazılmaz. [42], [44] ve [310]'un hükmü aynen taşıyan uzun kökü örnek alınmaz.
    - Kanunun kendi mutlak ifadesi doğru şıkta durabilir: "elektronik yolla yapılması zorunludur" (7/A/2), "kabule mecburdurlar" (md 20, 21/3), "15 günü geçemez" (31/2), "tebliğ yapılamaz" (md 39), "bir haftadan aşağı olamaz" (29/3).
    - md 21 işlemi uzundur; doğru şık kısaltılır. "İmza karşılığında" ve "tesellüm edenin adresi" ayrıntısı şıkka girmez.
    - Açıklama bankadaki cevapları içerikle yazmaz: [312] (yedi gün), 5326 sorusu (beşinci gün), [306] ve [313] (Adalet Bakanlığı), [43] (karşılıklılık), 4982 md 4 (yabancıda bilginin kendisiyle ya da faaliyet alanıyla ilgili olması). Gerekirse alıntı "…" ile kısaltılır; ayrımın varlığı anılır, değeri yazılmaz.
    - Parti içi sızıntı haritaları §7'lerdedir.
11. **Dil.** 7201 eski bir dille yazılmıştır. Terimler aşağıdaki gibi kullanılır; anlam değiştiren sadeleştirme yasaktır.

    | Metindeki ifade | Kök ve şıkta | Kural |
    |---|---|---|
    | tebliğ, tebligat, muhatap, tebliğ memuru, tebliğ mazbatası, ihbarname, ilanen tebligat, tebliği çıkaran merci, adres kayıt sistemi, muhtar, ihtiyar heyeti, zabıta, hizmetçi, ikametgâh, mesken, iş yeri | korunur | terimdir |
    | tebellüğ; tebellüğden imtina | "tebliğ evrakını almak"; "almaktan kaçınmak" | Kanun md 20'de "kabulden çekinme" der |
    | tesellüm | "teslim almak" | |
    | talik (md 56) | "asma" | md 21'deki "yapıştırma" ile karıştırılmaz |
    | salahiyetli, kanuni, ticari mümessil | "yetkili, kanuni, ticari temsilci" | |
    | hükmi şahıs | "tüzel kişi" | Kanun 7/A ve 35/4'te "tüzel kişi" der |
    | müstahdem | "çalışan" | md 16'daki "hizmetçi" ile karıştırılmaz |
    | mevkuf, mahkûm | "tutuklu", "hükümlü" | "gözaltındaki" yazılmaz |
    | muvakkaten; imtina; muttali olmak; muteber | "geçici olarak"; "kaçınma"; "öğrenmek"; "geçerli" | |
    | mahalli mülkiye amiri | "mahallî mülki idare amiri" | "vali" ya da "kaymakam" tek başına yazılmaz |
    | tehirinde zarar umulan | "ertelenmesinde zarar umulan" | "gecikmesinde sakınca bulunan" yazılmaz (CMK terimi) |
    | hazırlık tahkikatı · mucip sebep beyanı · kaza mercii · celse · yabancı memleket | "soruşturma" · "gerekçe göstererek" · "yargı mercii" · "duruşma" · "yabancı ülke" | |
    | görünüşüne nazaran on sekiz yaşından aşağı olmaması | "görünüşüne göre on sekiz yaşından küçük olmaması" | "on sekiz yaşını doldurmuş olması" YASAK: görünüş ölçütü gerçek yaşa döner |
    | bariz bir surette ehliyetsiz | "açıkça ehliyetsiz" | "kısıtlı" YASAK: başka hukuki kavram |
    | aynı konutta oturan kişiler | korunur | "aile bireyleri", "yakınları" YASAK (2003 öncesi metin) |
    | ihbarname ↔ tebliğ evrakı | ayrı tutulur | md 21'de evrak muhtara ya da zabıtaya, ihbarname kapıya; 35/2'de evrakın nüshası kapıya |
    | yapıştırma (md 21) ↔ asma (35/2, 29/2, Ek 1) | metindeki fiil korunur | birbirinin yerine yazılmaz |
    | komşuya "bildirilir" (21/1) | korunur | "teslim edilir" YASAK |
    | muhtar veya ihtiyar heyeti azası veyahut zabıta | seçimlik "veya" korunur | "muhtar ve zabıta" YASAK |
    | "… yapılmış sayılır" | korunur (karine) | "tebliğ edilir", "tebliğ tamamlanır" yazılmaz |
    | caizdir (10/3, md 33) | "yapılabilir" | "zorunludur" YASAK |
    | kabule mecburdurlar; zorunludur (7/A) | "kabul etmek zorundadır"; korunur | |
    | Posta ve Telgraf Teşkilatı (Genel Müdürlüğü ya da A.Ş.) | "PTT" | ad farkı ölçülmez |

    3071'de: "yetkili makam", "idari makam", "dilek ve şikâyet", "karşılıklılık esası", "gerekçeli olarak cevap" korunur. "işlemin safahatı" → "işlemin hangi aşamada olduğu".
12. **Parti arası temas.** Her parti doğru cevabı yalnız kendi kanunundan kurar. Öbür kanunun hükmü yalnız çeldirici olur ve o partinin cevabını vermez.
    - **3071 ↔ 7201:** 3071'deki "dilekçe sahibine bilgi verilir" (md 5) ve "cevap verilir, sonuç ayrıca bildirilir" (md 7) bildiriminin 7201'e göre tebliğ olup olmadığı ⚑. İki parti birbirine atıf kurmaz.
    - **7201 ↔ 6458:** 6458 md 100 tebligatı 7201'e bağlar; 53/2 sınır dışı kararını yabancıya, yasal temsilcisine ya da avukatına tebliğ ettirir; 53/3 yedi gün. 7201 sorusu yabancıya ya da sınır dışı kararına özgü tebliği sormaz. 6458 sorusu 7201'in usul kuralını (md 21, 28, 35, 7/A) doğru şık ya da açıklama dayanağı yapmaz. "Yedi gün" iki kanunda farklı olayların süresidir.
    - **3071 ↔ 4982:** açıklama sızıntısı (kural 10).
    - Partiler arası açıklama sızıntısını dil gözcüsü tarar; betik açıklamaları taramaz.

### Gözcü kontrol listesi

1. **Kör çözüm.**
   - Doğru şık bir varsayılanla mı bulunuyor: muhtar, tebliği çıkaran merci, PTT, Adalet Bakanlığı, Dışişleri, yedi gün, otuz gün, İçtüzük, yetkili makam?
   - §8 kural 4'teki sezgilerden biriyle mi bulunuyor?
   - Kök cevabı çağırıyor mu: "zabıta vasıtasıyla" → "mülki amir"; "adres kayıt sistemi" → "adres kayıt sistemindeki adrese"; "yapıştırıldı" → "yapıştırıldığı tarih"; "talebi üzerine" → "talep"; "adresi bilinmeyen" → "ilan"; "yabancı" → "Dışişleri"?
2. **Ters ayırt etme.** 4982'yi, Anayasa md 74'ü, 7201 md 16'yı, 21/1'i ya da 28/1'i bilen eksik aday yanılıyor, hiç bilmeyen aday buluyor mu? Taze kör çözücü madde bilgisi olmadan buluyorsa RED. Kestirmeleri yanlış şıkka gidiyorsa bu, soru lehine kanıttır.
3. **Mükerrer ve çakışma.** §2 haritaları ve `-benzer.txt` taranır. Ayrıca şu banka soruları:
   - [42]–[45], [273]; 4982 md 2, 4, 6, 7/3, 11–13; Anayasa tanım sorusu ve "yalnız vatandaşa tanınmamış" soruları; 4483 md 4;
   - [305]–[314]; 5326 e-tebliğ sorusu; CMK süre hesabı ve mağdur adresi; İYUK [59], [90]; Arama Yön. hazır bulunacaklar.

   Yeni soru bunlardan birini ad değiştirerek mi soruyor, ya da onların cevabıyla mı çözülüyor?
4. **Güncellik.** Doğru şık, çeldirici ya da açıklama şunlardan birine dayanıyor mu: md 7'deki artık satır; on beş yaş; aile efradı; "birer gazete" ya da elektronik ortamda ilan; askeri yargı; PTT Genel Müdürlüğü; 7587'nin 7201'i değiştirdiği yanılgısı; 2003 öncesi yabancı?
5. **İki okumalı.** §8 kural 7'deki ya da her kanunun §6'sındaki bir unsur doğru şıkta, çeldiricide ya da açıklamada mı?
6. **Sayılar.**
   - Eşdeğer şık var mı ("bir hafta" ↔ "yedi gün"; "bir ay" ↔ "otuz gün")?
   - Süre sorusunda ✱ kilidi, tek birim ve artan sıra var mı?
   - Ceza süresi, adlî para cezası, yaş tek başına, parmak ya da gazete sayısı soruluyor mu? Bunlar RED'dir.
7. **Şık takımı.**
   - "muhtar", "ihtiyar heyeti azası" ve "zabıta" ayrı şıklarda mı? İki doğru doğar; RED.
   - "mülki idare amiri" ile "vali" ya da "kaymakam", "tebliği çıkaran merci" ile "hâkim" aynı takımda mı?
   - md 2 sorusunda "kendi memurları" ya da "Cumhuriyet başsavcısı" şıkta mı? RED.
   - "aranmaz" sorusunda ikinci bir aranmayan unsur var mı (TC kimlik no, noter onayı, yetkili makama verilme)?
   - YANLIŞTIR'da doğru önermeler sıra oluşturuyor mu (şerh → tahkik → ilan kararı)?
   - İki şık birbirinin tersi mi? İki yanlış şık aynı temayı mı taşıyor? Bileşik şıkta ızgara kuralı uygulanmış mı?
8. **Sağduyu ve yankı.** Sağduyuyla birden çok şık eleniyor mu ("muhatabın döndüğü tarih", "muhtarın emriyle zabıta")? Doğru şık kategori sözcüğünü yankılıyor ya da açık uçlu bir kayda mı dayanıyor?
9. **Sınav değeri.**
   - `sinavDegeri` en çok 2: yönetmelik, yürütme ve yürürlük; masraf ve ücret (3–6); vasıta (md 7); davetiye ve mazbata listeleri; askeri tebligat (14, 15, 27/2); yabancı ülkede tebligat (25–27, 26/A); Sayıştay, gümrük ve tapu (48–50); Ek 2; Geçici maddeler; 3071 md 9–11 ve Geçici 1.
   - RED: 3071 md 5 ve md 7 son cümle tek başına; 7201 28/1, 10/3, md 39 ve md 18 tek başına; 7/A/4'ün süresi; md 60.
10. **Parti oranları.**
    - koşul→kural en az 1/4, ayırt etme en az 1/10;
    - olumsuz kök en çok 1/4 (3071-p1 tek soru: oran iki parti birlikte değerlendirilir, §7), öncüllü en çok 1/5; "doğrudur", boşluk ve vaka en çok birer tane;
    - doğru harfler dengeli; uydurma değer partide en çok bir;
    - zorluk yaklaşık 1/4 kolay, 1/2 orta, 1/4 zor;
    - üst sınırlar: 3071 en çok 3 (önerilen 1), 7201 en çok 6 (önerilen 5).

---

## Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

1. **7201 md 7 (banka metni):** md 6'nın dipnotu [4] madde gövdesine girmiş ("4 19/3/2003 tarihli ve 4829 sayılı Kanunla bu fıkrada yer alan … çıkarılmıştır."). Banka metninden çıkarılmalı. Bankada başka dipnot artığı, kesik ya da kaymış madde yok.
2. **7201 md 21/1:** cümle sonundaki "(1)" üst simgesi resmî metinde de var; karşılık dipnot yok.
3. **7201 md 25:** resmî metinde yazım hataları var ("Dışişleri Bakanlığıne", "oradan damemuriyet havzası"; doğrusu "Bakanlığına, oradan da memuriyet"); bankaya aynen geçmiş. "(Mülga: 19/3/2003-4829/18 md.)" satırı düz metinde altındaki yürürlükteki fıkraya aitmiş gibi okunuyor.
4. **7201 md 1, 3, Geçici 1:** "Posta ve Telgraf Teşkilatı Genel Müdürlüğü" duruyor; aynı kanunun 7/A, 26/A ve Ek 2'si "Anonim Şirketi" diyor. md 3'te "Genel Müdürlüğünin" yazım hatası.
5. **7201 md 29/1:** 7418 (2022) "birer gazetede" yerine "bir gazete" dedi. İlanın kaç gazetede yapılacağı belirsizleşti.
6. **7201 md 54/2:** "yukarıda belirtilen cezalar" atfı 54/1'deki "gecikme veya zarar" şartını taşıyor mu belirsiz. Muhtar ve zabıta için md 52 ile ilişkisi de belirsiz.
7. **7201 md 34/2 ve md 11/1:** mülga HUMK (md 409) ve CMUK'a atıf. md 4 "il idare heyetleri", md 64 "İcra Vekilleri Heyeti" eski adlar.
8. **7201 md 50 ve md 31:** noktalama eksikleri resmî metinde de var ("yaptırılır" sonrası nokta yok; "sayılır.İlanen" boşluksuz). Önemsiz.
9. **3071 md 8/2:** yetki cümlesi meslek kuruluşlarını ve özel kuruluşları sayıyor; yükümlülük cümlesi yalnız kamu kurum ve kuruluşları ile kamu personelini.
10. **3071 md 11 ve Geçici 1:** Bakanlar Kurulu 2018'den beri yok. Geçici 1'in bugün bir işlevi kalıp kalmadığı metinden anlaşılmıyor. Resmî değişiklik listesi 4778'in değiştirdiği maddeleri yalnız "1" diye gösteriyor; şerhlere göre md 1, 2, 3/2, 4, 7 ve 8 değişti.
11. **Banka, güncel soru (7201 çakışma dosyası):** 7587'yi "elektronik tebligat kapsamını genişleten" diye tanıtıyor. RG metnine göre bu genişleme VUK 107/A'dadır; 7201 değişmedi. Soru yanlış değil, ama 7201 üreticisini yanıltabilir.
12. **Banka [309] (yönetmelik):** B önermesi usulsüz tebliğde öğrenmenin ve tarihinin ispatını konu alır. Kanun md 32 bu konuda susar. Yönetmelik metni bu turda okunmadı; B ile E'nin yönetmelikteki karşılığı ayrıca doğrulanmalı.
