# 657 sayılı Devlet Memurları Kanunu: sınav ve kaynak analizi

Doc 39, 23 Kas 2026. Kaynaklar:
- `analiz/resmi-polis-mevzuati.txt` (358 soru) ve `resmi-idare-personel.txt` (408 soru);
- `mevzuat/657.txt` (336 başlık: 240 asıl başlık [md 1–239 ve 61/A], 44 ek, 52 geçici);
- `657-mevcut-sorular.txt` (223), `657-diger-konu-sorulari.txt` (42), `657-cakisma-sorulari.txt` (352);
- komşu taban: `7068.txt` + `7068-mevcut-sorular.txt` (184), `3201.txt` + `3201-mevcut-sorular.txt`, `4483.txt`, `atama.txt`;
- önceki tur: `aday/657-h1..h3.json`, `denetim/657-h*-karar.json` (77 merkez sorusu: 48 KABUL, 29 RED), `06-gozcu-ek-657-merkez.md`.

Resmî metin 23 Kas 2026'da mevzuat.gov.tr'den indirildi (HTML 1,77 MB, ayrıca .doc ve .pdf):
`/private/tmp/claude-501/-Users-ahmetcnd--claude-spares-spare-8fGfJd/bd31e34f-69c4-439f-bbe4-8aedc149c12e/scratchpad/657/indirilen/657.html`.
Banka metniyle betikle madde madde, sözcük sözcük karşılaştırıldı (aynı klasörün `is/karsilastir.py`, `is/fark.py` betikleri; noktalama ve dipnot işaretleri karşılaştırma dışı). Üslup ölçüleri `rapor-polis-mevzuati.md` §2–§9'da, personel sorularının açı ölçümü `rapor-personel-mevzuati.md` §1–§2'dedir; burada tekrarlanmaz, 657'ye uygulanır.

**İşaretler.** Açı: **S** süre/sayı · **M** merci · **Ş** şart · **İ** istisna · **K** kavram/kapsam · **F** fiil→yaptırım · **Sn** sonuç · **A** iki yakın hükmü ayırt etme · **V** vaka. Değer **Y/O/D**. **✱** aynı değer başka yerde de geçer; kök olguyla tek hükme kilitlenir. **⚑ metinde yok**: metin dışı bilgi; ne doğru şık ne açıklama dayanağı olur. **[K→K]** koşul → kural sorusuna uygun. **◆** polise doğrudan uygulanır ya da polis amirini doğrudan ilgilendirir. **sınır**: başka bir kuralı ölçen ama yeni soruya çeldirici ya da yasak sınırı veren soru. **(i)/(ii)/(iii)**: PAEM'in fiilen sorduğu alan / polis amirini doğrudan ilgilendiren genel hüküm / 7068-3201 karşısında polise uygulanmadığı için değeri tartışmalı alan.

## 0. Özet

| Ölçü | Değer |
|---|---|
| Resmî korpusta 657'yi ölçen soru | 93 (90'ı Polis Mevzuatı dosyasında, 3'ü İdare dosyasında). **93'ün 93'ü bankada.** |
| PAEM (8., 9., 10. dönem) | **5**: [P232] ödev/hak başlığı, [P233] kınama fiili, [P259] kanuna aykırı emir, [P260] kariyer ilkesi, [İ367] fiil–ceza uyumsuzluğu → konu unsuru |
| Misyon Koruma (JGK 2023) | **3**: [P261] itiraz (md 135), [P262] kınama fiili, [İ394] aylıktan kesme → beş yıl büyükelçi |
| GYS (İçişleri 14, MEB 12, Adalet 12, Milli Emlak 5) | 43 |
| MEB Müfettiş Yrd. 21 · Kaymakamlık 8 · hâkimlik/HMGS/İYÖS/Sayıştay 9 · KPSS 4 | 42 |
| Bankada | 223 (198 beş şıklı, 25 dört şıklı); 84 etiketli madde; 23 soru "md ?", 1 soru etiketsiz |
| Diğer konularda 657'yi anan | 42 (31'i İdare Hukuku başlığında, 657 hükmü ölçüyor) |
| Çakışma dosyası (352) | ≈70 ilgili / ≈100 sınır / ≈180 ilgisiz (betikle kaba sınıflama) |
| Yürürlükteki başlık | 233 (103 başlık bütünüyle mülga) |

- **PAEM ve Misyon'un sekiz sorusunun beşi disiplindir** (md 125 ×3, md 135, md 132); kalan üçü ödev/hak başlığı, kanuna aykırı emir ve temel ilke. Hepsi tek adımlı bilgi; vaka yok (PAEM 9'un [P259]'u bile önerme sorusu). Yani PAEM, polise 7068 uygulandığı hâlde **657'nin disiplin fiil–ceza eşleşmesini soruyor**.
- **Banka dolu ve derin.** Türetim ve merkez turu (11 Kas) izinleri, çekilmeyi, görevden uzaklaştırmayı, atanmayı vakalarla da ölçmüş (bankada 178–216. sorular). Bir önceki turda 29 hüküm sınav değeri ya da mükerrerlik yüzünden reddedildi (§6).
- **Metin temiz.** Banka metni resmî metinle 335 ortak başlıkta sözcük sözcük aynıdır; tek içerik farkı md 59'da eksik bir ibaredir (soru konusu değil). md 76 günceldir. 2026'da üç kanun 657'ye dokundu: 7573 (md 56, 57, 127), 7578 (md 104), 7590 (md 68). Hepsi bankada işlenmiş.
- **Dürüst sayım:** kestirmesiz kurulabilen, bankada ölçülmemiş, PAEM/Misyon'da sorulabilir **8 ana yuva** ve 5 yedek bulundu (§7). Gerçekçi beklenti 4–6 KABUL'dür. md 32–85 aralığı (sınıflandırma, alınma, adaylık, atanma, ilerleme, yer değiştirme) tükenmiştir; bu aralık için parti önerilmez.

**◆ Polise doğrudan uygulanan 657 hükümleri (atıf metinle kanıtlı)**

| 657 hükmü | Atıf | Bankada | Kullanım |
|---|---|---|---|
| md 137–145 görevden uzaklaştırma | 7068 md 28/1: "disiplin soruşturması nedeniyle görevden uzaklaştırma hususunda 657 sayılı Kanun hükümleri uygulanır" | 657 adıyla 9+ soru; 7068 adıyla 3 | p2 #1 (141/1'in kapsamı) |
| md 125/E (Devlet memurluğundan çıkarma fiilleri), 126/2 (cezayı verme yetkisi) | 7068 md 9/1 | E'nin on iki bendinden sekizi ölçülmüş ya da şıkta geçmiş; (a), (b), (e), (f) geçmiyor | p2 #3 (E-e) |
| disiplinde boşluk | 7068 md 34/1: "hüküm bulunmayan hallerde 657'nin disipline ilişkin hükümleri"; 34/2: kademe ilerlemesinin durdurulması = uzun süreli durdurma gibi | — | bağlam; sorulmaz (7068 sorusudur) |
| md 62 mehil | Atama Yön. md 20 | 657 adıyla 5 soru | sorulmaz |
| md 92, 93, 94 yeniden alınma, çekilme | Atama Yön. md 14 | 657 adıyla dolu | sorulmaz |
| md 108 aylıksız izin | Atama Yön. md 43/d | dolu | sorulmaz |
| md 48 genel şartlar; md 53 | 3201 Geçici 31–32; Ek 29 (emniyette oran %5) | iki kanun adıyla da bankada | sorulmaz |
| md 122/3 | metin EGM kadrolarını adıyla sayar (binde yirmi) | kontenjan hesabı bankada | p2 #5 |
| Ek 8 (yurt dışında görevlendirilen güvenlik görevlileri) | metnin kendisi | yalnız genel kural (altı ay, muvafakat, boş kadro) | **p2 #2** |
| md 1/3 | "Emniyet Teşkilatı mensupları özel kanunları hükümlerine tabidir" | iki soru | sorulmaz |

---

## Metnin durumu (BAĞLAYICI)

### a) Resmî metinle karşılaştırma

| Bulgu | Ayrıntı | Sonuç |
|---|---|---|
| Ortak başlık | 335/336. (Banka "Geçici 32"yi ayrı başlık tutuyor; resmî HTML'de bu mülga satır Geçici 31'in gövdesinde. Ayrıştırma farkı, metin aynı.) | — |
| **İçerik farkı: md 59** | Resmî metinde "Genel Sekreter Sekreterliğine," ile "Nükleer Düzenleme Kurumunun" arasında **"Anayasa Mahkemesi Basın Müşavirliğine,"** ibaresi var (6216/75, dipnot [132]); banka metninde yok. | Banka kusuru (§F-1). md 59 listesi zaten sorulmaz. |
| md 61 son | Bankada cümle sonunda düz metin "(2)"; resmî metinde üst simge. Karşılık dipnot bulunamadı. | Metin değildir; alıntıya taşınmaz. |
| md 36, md 152 | Resmî HTML'de birleşik yazımlar ("yardımcılarısigorta", "uzmanlarıve"); banka doğru ayırmış. | fark yok |
| Başlıklar | Bankada madde başlıkları yok (istisnalar: md 23, 61/A, 80, 152 ve birkaç ek/geçici madde). Resmî başlıklar: md 21 "Müracaat, şikayet ve dava açma", md 25 "İsnat ve iftiralara karşı koruma", md 141 "Görevden uzaklaştırılan veya görevinden uzak kalan memurların hak ve yükümlülüğü" … | Tırnaklı başlık resmî başlıktan alınır. Başlık cevabı vermemeli. |
| Bankada olmayanlar | (I)–(IV) sayılı cetveller; 59 "Ek Geçici Madde" (resmî metinde Geçici 52'den sonra); değişiklik tablosu; 364 dipnot | soru konusu değil |
| md 76 | `657-guncel-ek.txt` = banka md 76 = resmî md 76 (betikle doğrulandı). 7537 dipnotu [147] md 77'nin başlığına bağlıdır; md 77 de bankada güncel. | "eski" uyarısı kapanmıştır |
| Gövdeye karışmış dipnot, kesik ya da kaymış madde | yok (md 7 ve md 28 virgülle biter; resmî metinde de öyle) | — |

Karşılaştırma sözcük düzeyindedir; noktalama farkları ölçülmedi.

### b) Anayasa Mahkemesi kayıtları

Bankada dipnot yok; aşağıdaki iptaller gövdede yalnız "(…)" ya da "(İptal: …)" şerhi olarak görünür. Ertelenmiş ya da "yönünden" iptal kaydı resmî metinde **bulunmadı**.

| Hüküm | Kayıt | Bugünkü metin | Kullanım |
|---|---|---|---|
| **md 48/A-8** | KHK 676 ile eklenen "güvenlik soruşturması ve/veya arşiv araştırması yapılmış olmak" bendi; AYM 24/7/2019, E.2018/73, K.2019/65 ile **iptal** | Bent boş. Genel şartlar yedi benttir. | Doğru şık, çeldirici, açıklama olmaz. "Güvenlik soruşturması genel şarttır" da "aranmaz" da yazılmaz (özel kanun ⚑). |
| md 48/A-5 | "milli savunmaya karşı suçlar, devlet sırlarına karşı suçlar ve casusluk" ibaresi; AYM 25/2/2010, E.2008/17, K.2010/44 (dipnot [113]) | Metinde "(…)" | Bu üç suç katalogda sayılmaz; "sayılmamıştır" sorusunda ne doğru şık ne çeldirici olur. md 48 dolu; sorulmaz. |
| md 28/1 son cümle, 28/2 | AYM 18/7/2012, E.2011/113, K.2012/108; 6514 (2014) ile yeniden düzenlendi | güncel | 2011 KHK metni ⚑ |
| md 36 Ortak Hükümler (avukatlık) | "serbest" ibaresi; AYM 27/3/2014, E.2013/101, K.2014/63 (dipnot [101]) | "(…) avukatlıkla geçirdikleri sürelerin 3/4'ü" | bankada; sorulmaz |
| md 36 Ortak Hük. A-12/d | AYM 16/4/2003; 5234 ile yeniden düzenlendi | güncel | sorulmaz |
| md 68/B | 1993 ek fıkrası iptal; son paragraf **7590 (24/7/2026) ile mülga** | gövdede yalnız şerh | sorulmaz |
| **md 86/4** | "birinci fıkrada sayılan" ibaresi; AYM 5/7/2012, E.2012/11, K.2012/104 (dipnot [156]) | "Aynı kurumdan (…) ayrılmalar dolayısiyle atanan vekil memurlara …" | Cümlenin kapsamı bulanık (iki okumalı). Vekâlet aylığının başlangıcı sorulmaz. |
| md 43/B, 72/2–4, 164, 178/A–B, 202, Ek 26, Ek 32 | 1992 ve 1997 iptalleri; 1994–1998'de yeniden düzenlendi | güncel | mali; dışarıda (72 dolu) |
| Ek 33 | iki cümle iptal: AYM 25/1/2023 (E.2022/97) ve **26/11/2025 (E.2025/89, K.2025/243)** | şerh gövdede | sağlık nöbet ücreti; dışarıda. 2025 kararının RG ve yürürlük tarihi **doğrulanamadı**. |
| Geçici 38 (madde), Geçici 45/1, Geçici 47 (ibare; AYM 16/1/2025) | iptal | — | dışarıda |

### c) 2023–2026 değişiklikleri (konsolide metindeki şerh ve dipnotlardan)

| Kanun | Tarih | 657'de dokunduğu yer | Bankada | Not |
|---|---|---|---|---|
| 7433 | 19/1/2023 | md 4/B (işin geçici olması şartı aranmayan sözleşmeli personel; üç yıl; otuz gün), Geçici 48–50 | işlenmiş; 1 soru + 2 RED | — |
| 7446, 7471, 7533 | 2023–2024 | (I) ve (II) sayılı cetveller | cetvel bankada yok | dışarıda |
| 7537 | 25/12/2024 | md 4 (dipnot [11]), md 77/1–2 (Cumhurbaşkanınca belirlenen yurt dışındaki kuruluşlar), md 92 (ek fıkra), md 108/D (ek cümle: on yıl), Ek 41, Geçici 51–52 | işlenmiş | 108/D yeni cümlesi merkez turunda RED (düşük değer) |
| 7547 | 8/5/2025 | **md 61/A baştan yazıldı** (başlığıyla), Ek 41, Ek 44 | işlenmiş; 3 soru güncel metinle uyumlu | §F-12 |
| 7548 | 21/5/2025 | Ek 40/2 | işlenmiş | dışarıda |
| **7573** | 23/1/2026 | **md 56 değişti, md 57 mülga, md 127 son fıkra değişti** | işlenmiş | Aşağıdaki nota bakınız |
| **7578** | 22/4/2026 (RG 1/5/2026, 33240) | **md 104/A**: doğumdan sonra "sekiz" → "onaltı" hafta, toplam "onaltı" → "yirmidört"; "doğumdan önceki üç haftaya kadar" → "iki haftaya kadar"; koruyucu aile için on gün izin cümlesi eklendi | işlenmiş; bankadaki analık sorusu (193.) yeni değerle çözülüyor | RG künyesi 7578'in mevzuat.gov.tr sayfasından doğrulandı |
| 7590 | 24/7/2026 | md 68/B'de bir paragraf mülga | işlenmiş | dışarıda |
| 7456, 7499, 7528, 7566, 7577 | — | Konsolide metinde ve 364 dipnotta bu numaralar **geçmiyor** | — | 657'ye dokunmadıkları sonucu yalnız bu yokluğa dayanır; RG metinleri okunmadı |

**7573 notu (doğrulama sınırı).** mevzuat.gov.tr'de 7573 ve 7590 için ayrı kanun sayfası açılmıyor (404); RG metinleri okunamadı. Değişikliğin içeriği iki kaynaktan biliniyor: konsolide metnin şerhleri ve depodaki `docs/32-yayin-denetimi/GECE-DURUM.md` notu (md 56'nın eski ilişik kesme sebepleri "memuriyetle bağdaşmayan hâl ve hareket" ile "göreve devamsızlık" kalktı, yerine disiplin cezası ölçütü geldi; md 127'de iki yıllık süre değişmedi, iptal sonrası yeniden ceza tesisi cümlesi eklendi). 7573'ün yürürlük maddesi ve geçiş hükmü **doğrulanamadı**.

### d) Ad ve atıf kuralı (BAĞLAYICI)

1. **Dayanak yalnız güncel madde gövdesidir.** Şerh, "(…)", "(Mülga …)", "(İptal …)" satırları hüküm değildir. Yokluktan yargı kurulmaz.
2. **Eski kurum ve unvan adları ölçülen unsur olmaz; doğru şıkta, çeldiricide ve açıklamada kullanılmaz.**

   | Metindeki ad | Geçtiği yer (banka metni) | Durum |
   |---|---|---|
   | Devlet Personel Başkanlığı (ve "Başbakanlık Devlet Personel Başkanlığı") | 35 madde, 49 geçiş: md 46, 47, 50, 52, 53, 72, 91, 105, 109, 122, 124, 132, 178, 179, 191, 210–212, 214, 216, 218–220, 223, 231, Ek 8, Ek 12, Ek 14 … | 2018'de kaldırıldı; halef kurum metinde yazmaz ⚑. md 56 "Kamu Personel Bilgi Sisteminin bulunduğu kurum" der; bu ifade de ölçülmez. |
   | Başbakanlık, müsteşar, müsteşarlık | md 36, 43, 46 (MİT Müsteşarlığı), 59, 68, 122 (Gümrük Müsteşarlığı), 152, Ek 29 | eski |
   | Bakanlar Kurulu | md 237, 239 (yürütme) | eski |
   | Maliye Bakanlığı · Maliye ve Gümrük · Maliye ve Hazine | md 62, 86, 105, 178, 179, 191, 211, 212, 223, Ek 12, Ek 24 | Resmî sorular "Hazine ve Maliye Bakanlığı" diye güncellemiş; yeni soruda bu merci hiç kullanılmaz. |
   | T.C. Emekli Sandığı | md 4, 72, 74, 76, 93, 192 | eski |
   | Özürlüler İdaresi Başkanlığı · Devlet Planlama Teşkilatı · TODAİE · akademiler · Toplu Konut ve Kamu Ortaklığı İdaresi · Sosyal Sigortalar Kurumu | md 53, 223, 1/87, 192, 188 | eski |
   | "Cumhuriyet Savcılığı" · sorgu hâkimliği · Memurin Muhakematı · "meni muhakeme" · "lüzumu muhakeme" | md 25, 131/3 | eski usul; kullanılmaz |
   | "yargılamanın men'i", "cezası ertelenenler", "kamu haklarından mahrum" | md 143, 48/A-4 | eski ceza hukuku terimleri; md 143 listesi sorulmaz |
   | "Türk Medeni Kanununun 12 nci maddesi … kazai rüşt" | md 40 | 4721'deki karşılığı ⚑; md 40 dolu, sorulmaz |
   | "komiser muavini", "emniyet müfettişi, polis müfettişi" | md 36/VII | Emniyet Hizmetleri Sınıfının sayımı sorulmaz |
   | "mahcur", "bucak", "Olağanüstü Hal Bölgesi", "kalkınmada öncelikli yöre", "mahrumiyet yeri", "Katma Bütçeli", "Beden Terbiyesi" | md 28, 125, 88, 72, 64, 199, 1 | ölçülmez |
   | **sicil** | 2011'de (6111) kaldırıldı; md 110–121 mülga; md 98/ç'de "(…)" | "sicil amiri", "olumsuz sicil" çeldirici bile olmaz |
3. **2018 uyarlamaları (KHK 700/703).** "Cumhurbaşkanınca", "Cumhurbaşkanı kararı", "Cumhurbaşkanlığı kararnamesi" 30 maddede 53 kez geçer. Merci sorusunda Cumhurbaşkanı **varsayılan cevaptır**; doğru şık yapılmaz. Bankada bu kalıpta en az beş soru ve iki önerme var (md 2, 80 ×2, 89, 178; 216–217 önermeleri).
4. **Yönetmeliğe ve Cumhurbaşkanı kararına bırakılanlar ⚑.** md 2, 13/3, 21/3, 50, 53, 55/3, 72 son, 80, 89, 95, 100/3, 105, 124, 134, 178, 214, 216, 217, 223. İçerikleri (Şikâyet ve Müracaat Yönetmeliği'ndeki otuz gün ve toplu şikâyet yasağı; Aday Memurların Yetiştirilmesi; Disiplin Kurulları ve Disiplin Amirleri; Yer Değiştirme Suretiyle Atanma; Zarar yönetmeliği) türetim istisnasında değildir; doğru şık, çeldirici ya da açıklama dayanağı olmaz. "Hangi işlemle", "kim çıkarır", "kimin görüşü alınır" yasak kalıptır.
5. **Eski metin değerleri yalnız çeldirici olur, yanlışlığı güncel metinle kanıtlanır.** md 104: "doğumdan sonra sekiz hafta", "toplam on altı hafta", "üç haftaya kadar" (dikkat: yeni doğum sonrası değeri "on altı" eski toplamla aynı sayıdır ✱; analık süresi sorusu yazılmaz). md 56: eski ilişik kesme sebepleri. md 57: mülga. md 61/A: 2025 öncesi metin (sayı sınırı vb.) ⚑.
6. **Kök** "657 sayılı Kanun'a göre," ile açılır; madde, fıkra, bent numarası yazılmaz. Özne "Devlet memuru" ya da "memur"dur. **Polis vakası** yalnız atıfla polise uygulandığı kanıtlı hükümde kurulabilir (özet tablosu): md 141, Ek 8. Disiplin sorusunda (md 124–136) polis vakası kurulmaz.

### e) Her yıl değişen değerler (hiçbir soruda cevap, çeldirici ya da vaka unsuru olmaz)

md 43 (aylık gösterge tablosu, ek gösterge), 146, 149–152 (zam ve tazminat oranları), 154–157 (katsayı), 160–161, 164 son fıkralar, 175–176 (vekâlet, ikinci görev, ders ücreti), 177 (harcırah), 178/A (fazla çalışma ücreti), 180–182, 199–206 (aile yardımı: 1500 ve 250 gösterge; dipnot [276]'ya göre BKK ile 2134), 208 (ölüm yardımı), 210–212, Ek 24, Ek 26, Ek 32, Ek 33, Ek 34, cetveller.

- Gösterge rakamı, ek gösterge, katsayı, TL tutarı ve bunlara bağlı oranlar yasaktır.
- "En yüksek Devlet memuru aylığının … katı / %…'i" biçimindeki oranlar (md 122/2 ödül, md 208, md 12/3 eşiği) sabit görünür ama tutarı her yıl değişir ve hüküm malidir; **değer olarak sorulmaz**. Bankada md 208 ve 12/3 ölçülmüş.
- Doğum yardımı (md 207) ve tedavi yardımı (md 209) mülgadır.

### f) Disiplin hükümleri için kural (md 124–136) (BAĞLAYICI)

Ölçüm: PAEM ve Misyon 657'den en çok disiplini soruyor (8 sorunun 5'i). Banka bu alanı 42 soruyla ölçüyor (md 125: 19; 126: 4; 127: 3; 128: 2; 130–133: 7; 135: 7); ayrıca İdare başlığında 6 soru var. Komşuda 7068 bankası 184 soru.

Aynı fiilin iki kanundaki cezası (ikisi de bankada ya da banka kökünde):

| Fiil | 657 md 125 | 7068 md 8 |
|---|---|---|
| tasarruf tedbirlerine riayet etmemek; göreve geç gelmek | uyarma | uyarma |
| usulsüz müracaat ya da şikâyet | uyarma | kınama |
| kılık ve kıyafet | uyarma | üç günlüğe kadar aylıktan kesme |
| resmî belgeyi kaybetmek | kınama | dört–on günlüğe kadar aylıktan kesme |
| yetkisiz basına bilgi ya da demeç | kınama | on ay kısa süreli durdurma |
| görev sırasında amire saygısızlık | kınama (hâl ve hareketle); aylıktan kesme (sözle) | kısa süreli durdurma |
| mal bildiriminde bulunmamak | kademe ilerlemesinin durdurulması | on iki ay uzun süreli durdurma (PAEM 10 [P300]) |
| ticaret, kazanç getirici faaliyet; göreve sarhoş gelmek; parti yararına faaliyet | kademe ilerlemesinin durdurulması | meslekten çıkarma |
| amire fiilî tecavüz | Devlet memurluğundan çıkarma | meslekten çıkarma (7068 bankasında vaka) |

Usul değerleri: itiraz 7 gün ↔ 10 gün; itiraz mercii disiplin kurulu ya da yüksek disiplin kurulu ↔ bir üst disiplin amiri; uygulama "verildiği tarihten, derhal" ↔ "kesinleşmesini müteakip"; aylıktan kesme 1/30–1/8 ↔ on beş günlüğe kadar; iptal sonrası yeniden ceza: kalan süre ya da altı ay ↔ tebliğden altı ay. Aynı kalanlar ✱: savunma 7 gün, itirazın kararı 30 gün, soruşturma zamanaşımı bir ay ve altı ay, ceza zamanaşımı iki yıl, silinme beş ve on yıl.

**Kural:**
1. **md 125/A–D fiil–ceza eşleştirmesinden yeni soru yazılmaz.** PAEM'in sorduğu kalıp bankada yirmiden çok kez var; yeni soru ya mükerrer olur ya 7068 bankasındaki cevapla çelişen bir bilgi yükler.
2. **md 125/E (Devlet memurluğundan çıkarma) istisnadır:** 7068 md 9/1 bu fiilleri polise de uygular. Yalnız bankada ölçülmemiş ve 7068'de karşılığı bulunmayan bent sorulur: **E-e** (p2 #3; 7068 metninde "afet" sözcüğü hiç geçmez). E-f (fiilî tecavüz) 7068 md 8/6 ile çelişir; E-a (grev ve iş yavaşlatma) 7068 md 8/6-p ile çakışır; ikisi de sorulmaz.
3. **Usul (md 126–136):** bankada doludur. Tek açık yuva, 2026'da değişen md 127 son fıkranın ikinci cümlesidir (p2 #4). md 129, 7068 md 31/4 ile kelimesi kelimesine aynıdır; yuva açılmaz.
4. **Çapraz değer yasağı:** 657 sorusunun şıkkında ve açıklamasında 7068'e özgü ceza adı ("kısa süreli durdurma", "uzun süreli durdurma", "meslekten çıkarma") ve 7068'in değeri yer almaz. Ayrımın varlığı anılabilir; değeri yazılmaz. Tersine, 7068'in 657 ile aynı olan değerleri ✱ 657 sorusunda çeldirici olmaz (iki doğru doğmaz ama ölçme değeri de olmaz).
5. **Disiplin sorusunda vaka "memur" ile kurulur;** "polis memuru", "komiser", "emniyet" yazılmaz (hangi kanunun uygulanacağı tartışması açılır; 7068 md 10 ağırlaştırıcı nedenleri devreye girer).

---

## §1 Resmî sorular

### PAEM ve Misyon Koruma (8 soru; hepsi bankada)

| No | Sınav | Hüküm | Açı | Kök | Çeldirici türü | Zorluk |
|---|---|---|---|---|---|---|
| P232 | PAEM 8 (5 şık) | md 14 ↔ md 17–25 başlıkları | K (liste) | doğrudan; "ödev ve sorumluluklarındandır"; ≈110 krkt | komşu listenin (genel haklar) dört başlığı | kolay |
| P233 | PAEM 8 | 125/B-c | F | "kınama cezası gerektiren fiil ve hâllerdendir" | öbür basamakların gerçek fiilleri (D-f, A-d, C-b, D-j) | orta |
| P259 | PAEM 9 | md 11/3 | Sn | "Kanuna aykırı emir bakımından … doğrudur"; kanun adı yok | zayıf, sağduyuyla elenen dört şık; doğru şık kanun cümlesi | kolay |
| P260 | PAEM 10 | md 3/B | K | tanım tırnak içinde; ≈280 krkt | öbür ilkeler + iki uydurma (tarafsızlık, kademe ilerlemesi) | kolay |
| İ367 | PAEM 10 (İdare) | 125/A-c + işlemin unsurları | A, V | fiil tırnak içinde, yanlış ceza verilmiş → hangi unsur | işlemin beş unsuru | orta/zor (iki bilgi) |
| P261 | JGK Misyon 2023 (4 şık) | md 135 | S | "yanlıştır"; tırnaklı başlık “itiraz” | sayı değiştirme (otuz → altmış) | orta |
| P262 | JGK Misyon 2023 (4 şık) | 125/B-f | F | "kınama cezasını gerektiren" | üç uyarma fiili (komşu basamak) | orta |
| İ394 | JGK Misyon 2023 (4 şık) | 132/4 | S | doğrudan; "kaç yıl boyunca büyükelçi" | sayı dizisi (5, 7, 8, 10); "10" gerçek komşu değer | orta |

**Çıkarım.**
- Beşi disiplin; ikisi liste/tanım; biri sonuç. **Vaka yok, süre hesabı yok, merci sorusu yok.** PAEM 10'un İdare sorusu [İ367] en ayırt edici olanıdır: 657'nin fiil–ceza bilgisini idari işlemin unsuruna bağlar.
- PAEM 657'den dönem başına bir–iki soru soruyor (8. dönem 2, 9. dönem 1, 10. dönem 2). Misyon 2023'te üç.
- PAEM'in sormadıkları: izinler, çekilme, görevden uzaklaştırma, atanma, adaylık, vekâlet, mali ve sosyal hükümler. Bunları GYS ve MEB soruyor.

### GYS, MEB, Kaymakamlık, hâkimlik, KPSS (85 soru): madde dağılımı

| Madde | GYS | MEB Müf. | Kaymakamlık | KPSS | Hâkimlik vb. | Toplam |
|---|---|---|---|---|---|---|
| ödev/hak başlıkları ve çoklu önerme ("md ?") | 6 | 4 | — | 2 | — | 12 |
| md 125 | 3 | 3 | 2 | — | — | 8 |
| md 36 | 3 | 3 | 1 | — | 1 | 8 |
| md 56 | — | — | — | — | 4 | 4 |
| md 135 | 2 | 1 | — | — | — | 3 |
| md 64 · 103 · 80 · 61/A | 2 · 1 · 1 · 1 | 1 · 2 · 0 · 1 | 0 · 0 · 2 · 0 | — | 0 · 0 · 0 · 1 | 3'er |
| md 4, 63, 105, 147 | 5 | 2 | — | 1 | — | 2'şer; toplam 8 (md 63: 1 GYS + 1 KPSS) |
| tek soru: md 1, 2, 3, 6, 7, 10, 13, 21, 58, 59, 62, 77, 83, 86, 89, 91, 102, 127, 128, 133, 138, 139, 141, 145, 165, 206, 208, 221, 225 | 19 | 4 | 3 | 1 | 2 | 29 |

- Kök tipi (85): doğrudan 47, olumsuz 27, boşluk 5, "doğrudur" 3, öncüllü 3. Vaka 3 (hâkimlik [P234], Kaymakamlık [P244], hâkimlik [İ311]).
- GYS'nin sevdiği yasak kalıplar: yönetmelik mercii ([P211], [P272]), Cumhurbaşkanı kararı ([P201], [P240], [P241], [P270]), kimin görüşü alınmaz ([P273]), tablo ezberi ([P243], [P271], [P284]), mali tanım ([P216], [P253]).
- Muhakeme ölçenler yalnız hâkimlik ve Kaymakamlıkta: [P235] aralık sınaması (1/9), [P246] öncüllü eşik (bir kez uyarma ilişik kestirmez), [İ311] fiil–ceza → konu.

---

## §2 Bankada ölçülenler (yeniden sorulmaz)

### Madde bazında doluluk (223 + İdare başlığındaki 31)

| Madde | Soru | Ölçülen açılar | Karar |
|---|---|---|---|
| 1 | 2 | özel kanuna tabi olanlar (sayım) | dolu |
| 2 | 1 | yönetmelikleri Cumhurbaşkanı | yasak kalıp |
| 3 | 3 + İdare 1 | kariyer ×4 (aynı soru), liyakat ×1 | tükendi |
| 4 | 4 + İdare 4 | memur tanımı, dört istihdam şekli, sözleşmeli sayımı, 7433 (otuz gün), fesih bir yıl, işçi | dolu |
| 6 | 1 + İdare 1 | yemin: bir ay | dolu |
| 7, 8 | 1 + İdare 2 | başlık eşleme; parti üyeliği | dolu |
| 10 | 1 + İdare 1 | amirlik yetkisi; borç ve hediye | dolu |
| 11 | 2 + "md ?" 1 + İdare 2 | suç teşkil eden emir ×3; yazılı yenileme vakası ×2 | dolu |
| 12 | 1 + İdare 1 | rayiç bedel; brüt aylığın yarısı vakası | dolu |
| 13 | 1 (+2 önerme) | kurum aleyhine dava; yönetmelik mercii | 13/1 ikinci cümle ve 13/2 **ölçülmemiş** |
| 14, 15 | başlık; İdare 1; önerme 2 | mal bildiriminin kapsamı; illerde valiler | dolu |
| 16 | — | — | **ölçülmemiş** |
| 17–25 başlıkları | 8 | "hangisi ödev / hak / yasak değildir" | tükendi (aynı kalıp sekiz kez) |
| 21 | 1 | usul yönetmelikle | 21/2 usul **ölçülmemiş** |
| 25 | — | yalnız başlık | ölçülmemiş; §6 |
| 26, 27, 30 | liste öğesi | — | zayıf |
| 28 | 5 | anonim ortaklık; kooperatif ve meslek kuruluşu; vakıf üniversitesi; 15 gün; komandite ortak → ceza | dolu |
| 29 | 2 | aracı; borç; Etik Kurulu | dolu |
| 31 | 2 | yetkili bakanın yazılı izni (aynı vaka iki kez) | dolu |
| 36 | 11 + İdare 1 | sınıf sayımı ×5, 2016'da eklenenler ×2, meslek → sınıf ×2, giriş derecesi ×3, avukatlık 3/4 | tükendi |
| 40, 41, 48 | 4 + İdare 3 | yaş, kazai rüşt, öğrenim, mahkûmiyet kataloğu, özel şart | dolu |
| 47, 53 | 3 | 15 gün; %3; dolu kadro; engelli sınavı | dolu |
| 54, 56, 58 | 8 + İdare 1 | bir–iki yıl; nakil yasağı; ilişik kesme şartı ×4; teklif–onay ×2; üç yıl | tükendi |
| 59, 61, 61/A | 6 + İdare 2 | sayım; uygulanmayan hükümler; müşavir | dolu |
| 62, 63 | 7 + İdare 1 | 15 gün ×3; tebliğ günü; süre başlangıçları; bir yıl ×2; iki ay; on gün ek süre vakası | tükendi |
| 64, 68 | 6 + İdare 2 | önermeler ×4; üç yıl ×2 | dolu |
| 72, 73, 76 | 4 | eş: dört yıl; koordinasyon; karşılıklı; üç derece | dolu |
| 77–80, 83 | 8 | on yıl ×2; dört yıl; masraf iadesi; Cumhurbaşkanı kararı ×2; otuz gün; tarih hesabı | dolu |
| 86, 87, 89 | 4 | aylıksız vekâlet; açıktan vekil izni ×2; ikinci görev yasağı; ders görevi mercii | dolu |
| 91, 92 | 4 | altı ay ×2; kadrosu kaldırılanın durumu; iki defa | dolu |
| 94–98 | 7 + 1 | on gün ×2; bir ay; olağanüstü mazeret; altı ay, bir yıl, üç yıl, hiçbir surette; sona erme hâli değildir | 98/b ölçülmemiş (yedek) |
| 99–103 | 9 | 40 saat; başlama saatleri; gece nöbeti; 20–30 gün; ikişer gün; iki yıl birleşir; radyoaktif ×3 | tükendi |
| 104 | 9 + İdare 1 | babalık 10; evlenme 7; ölüm 7; süt 3 saat; yarım zamanlı ×2; analık hesabı; çoğul gebelik; mazeret mercii; evlat edinme; koruyucu aile | tükendi |
| 105, 108 | 16 | 18–36 ay; iyileşinceye kadar; refakat ×2; yataklı tedavi; öncelikli atanma; 18 ay; 24 ay; beş yıl–bir yıl; on gün; eş durumu | tükendi |
| 122 | 1 | binde on / binde yirmi (EGM) hesabı | yetki ve belge **ölçülmemiş** |
| 125 | 19 + İdare 5 | her basamaktan çok sayıda fiil (E'de sekiz bent); ceza tanımları; aylıktan kesme aralığı; tekerrür, üçüncü uygulama, bir derece hafif, son kademe | A–D tükendi; E-a, E-b, E-e, E-f ölçülmemiş |
| 126–128 | 9 | kim verir ×3; ret → 15 gün; bir ay; altı ay; iki yıl; 15–30 gün; altı ay | 127 son fıkra 2. cümle **ölçülmemiş** |
| 130–133 | 7 + İdare 1 | yedi gün; kovuşturma geciktirmez; derhal; aybaşı; beş–on yıl ×4; silinme ×2 | 133/3 ölçülmemiş (yedek) |
| 135 | 7 | yedi gün ×3; otuz gün ×4; merciler ×2 | tükendi |
| 137–145 | 9 | tanım; her safha; yetkililer ×2; 10 iş günü ×3; amirin sorumluluğu; 2/3 ×2; geri ödeme; müfettiş → atamaya yetkili amir; üç ay; iki ayda bir | 141/1'in kapsamı **ölçülmemiş** |
| 147, 164, 165, 178 | 6 | zam tanımları; peşin aylık; hak kazanma; fazla çalışmada on gün izin (◆); MİT talimatı | mali; dışarıda |
| 206, 208, 221, 224, 225 | 6 | — | dışarıda |
| Ek 8 | 2 | altı ay; boş kadro; muvafakat | yurt dışı güvenlik görevlisi **ölçülmemiş** |
| Ek 31, Ek 39, Ek 43 | 4 | avukat ücreti (◆ polis vakası); engelli yakını ataması (◆ polis vakası); yarım zamanlı | dolu |

**Hiç ölçülmemiş, yürürlükteki maddeler (sınav değeri taşıyabilecekler):** 9, 16, 21/2, 25, 26, 30, 33, 39, 45, 49–52, 55/2, 60, 67, 69, 71, 74, 81, 82, 84, 85, 88, 90, 93, 109, 124, 129, 134, 143, 144. Bunların çoğu §3'te gerekçesiyle dışarıda bırakıldı; 37, 52, 58/2, 64/3, 71, 74, 77/3, 83/2, 85, 88, 104/E, 108/D, 109, 163, 167, 169, 170, 202, 210 ve Ek 34 bir önceki turda **RED** aldı.

### Mükerrer kümeler

| Küme | Bankadaki sıra no | Not |
|---|---|---|
| kariyer ilkesinin tanımı | 68, 77, 223 (+İdare 1) | aynı soru dört kez |
| ödev / hak / yasak başlığı | 4, 11, 13, 19, 36, 97, 121, 122 | aynı kalıp sekiz kez |
| md 135 itiraz | 42, 44, 60, 65, 136, 137, 221 | — |
| md 64 önermeleri | 15, 66, 67, 143 | — |
| md 56 ilişik kesme | 78, 79, 80, 88, 106, 120 | — |
| sınıf sayımı | 39, 85, 93, 123 (+İdare 1); 102, 119 | — |
| radyoaktif ışın: bir ay | 8, 16, 126 | — |
| md 31 emekli memurun anı kitabı | 174, 181 | aynı vaka iki kez |
| ikili tekrarlar | 1–89 (md 80); 48–101 (md 91); 54–82 (md 62); 26–161 (md 139); 84–158 (md 133); 45–141 (md 77); 124–170 (md 11/3); 180–218 (md 29); 166–219 (md 94); 94–222 (md 63); 71–129 (md 105) | — |

### Dört şıklı sorular (25)

| No | md | Kök (ilk 60 karakter, kanun adı çıkarılmış) |
|---|---|---|
| 1 | 80 | şahsen özel burs sağlayan ve bu burstan istifade etmesi için… |
| 4 | ? | hangisi ödevler ve sorumluluklar arasında sayılmamıştır? |
| 20 | 125 | “Görev yeri sınırları içinde herhangi bir yeri toplantı, tör… |
| 21 | 127 | Disiplin cezasını gerektiren fiil ve hâllerin işlendiği tari… |
| 22 | 125 | aşağıdakilerden hangisi kınama cezasını gerektiren fiil ve h… |
| 31 | 125 | “Görevin yerine getirilmesinde dil, ırk, cinsiyet, siyasi dü… |
| 41 | 125 | “özürsüz olarak bir yılda toplam 20 gün göreve gelmemek” fii… |
| 42 | 135 | disiplin cezalarına “itiraz” ile ilgili aşağıdakilerden hang… |
| 45 | 77 | yabancı memleketlerin resmî kurumları veya uluslararası kuru… |
| 46 | 83 | Devlet memuru iken muvazzaf askerlik hizmetini yapmak üzere … |
| 47 | 89 | ücretle okutulacak ders saatlerinin sayısı, ders görevi alac… |
| 48 | 91 | kadrosu kaldırılan memurlar, en geç kaç ay içinde kendi kuru… |
| 56 | 125 | “eşlerinin, reşit olmayan veya mahcur olan çocuklarının kaza… |
| 57 | 36 | sosyal hizmetler mütehassısı aşağıdaki sınıflardan hangisini… |
| 58 | 36 | 3 yıl süreli yükseköğrenimi bitirenlerin (istisnai durumlar … |
| 59 | 21 | müracaat ve şikâyetler ile ilgili esas ve usuller aşağıdakil… |
| 61 | 61/A | kamu görevlisi iken bakan müşavirliğine atananlar görevden a… |
| 62 | 7 | Devlet memurlarının, görevlerini yerine getirirlerken hiçbir… |
| 63 | 86 | “vekâlet görevi ve aylık verilmesinin şartları” ile ilgili a… |
| 64 | 28 | aşağıdakilerden hangisi yanlıştır? |
| 66 | 64 | “kademe ve kademe ilerlemesi” ile ilgili hangisi yanlıştır? |
| 67 | 64 | “kademe ve kademe ilerlemesi” ile ilgili aşağıdakilerden han… |
| 70 | 105 | hastalık raporlarının hangi hâllerde, hangi hekimler veya sa… |
| 71 | 105 | memura, aylık ve özlük hakları korunarak, verilecek raporda … |
| 73 | 4 | I. Sözleşmeli personel II. Yarı zamanlı personel III. Fahri … |

Hepsi resmî dört şıklı sınavlardan (Milli Emlak, İçişleri GYS, JGK Misyon). Bkz. bellek notu "Dört Şıklı Sorular".

### Banka kökü sızıntısı (kökü ya da şıkları başka hükmün cevabını basan sorular)

| No (md) | Bastığı bilgi | Kapattığı yuva |
|---|---|---|
| 79 (56) | md 56/1'in tamamı kökte: sebepler, teklif–onay | md 56'da her açı |
| 33 (58) | md 58/1'in tamamı | md 58 (merkez turunda bu yüzden RED) |
| 166 (94) | 94/1 ikinci cümlenin tamamı | "çekilmiş sayılma" şartı |
| 45 (77) | "her üç yılda bir Bakan onayı yenilenmek kaydıyla" | md 77 |
| 3 (47) | duyurunun içerik listesi | md 47 |
| 158 (133) | "atamaya yetkili amire başvurarak" | silinme başvuru mercii |
| 203 (122) | "üstün başarı belgesi üzerine … ödüllendirilebilir"; EGM'nin binde yirmisi | ödülün üstün başarı belgesine bağlı olduğu bilgisi tek başına sorulmaz (p2 #5 bunu ölçmez) |
| 204 (141) | "143 üncü maddede sayılan durumlardan biri … kaldırılmıştır" | 141/2 |
| 205 (142) | müfettişin uzaklaştırdığı memur; yalnız kınama uygun görülmüş → atamaya yetkili amir | 142 ve 145/2'deki müfettiş parantezi |
| 37, 156, 160 şıkları | üç ay; iki ayda bir; 10 iş günü; valinin muvafakati; her safha; 2/3 | görevden uzaklaştırmanın bütün süre ve merci değerleri |
| 6-D, 171 | md 15'in tam cümlesi ("illerde valiler") | md 15 |
| 49-E | 13/3 (yönetmelik) | — |
| 133 öncülleri | md 128'in 15 ve 30 günü | md 128 |
| 140, 168, 113 kökleri | 108/E; 108/A ve C; 86 son fıkra | — |
| 42, 65, 137 şıkları | yedi gün, otuz gün | md 135 |
| 15, 66, 67, 52, 154 şıkları | md 64 ve md 125 son fıkralarının cümleleri | — |
| 96-B | "dördüncü ve daha yukarı dereceden boş kadro şarttır" (genel kural) | p2 #2 için **lehte**: bu genel kuralı bilen eksik aday yanılır |

### Kusurlu ya da eskimiş görünen sorular (kullanıcıya bildirilecek; düzeltilmedi)

| No | md | Kök (ilk 60 karakter) | Sorun |
|---|---|---|---|
| 222 | (boş) | «Kanun'a göre bu kişiler kaç yıl süreyle Devlet memuru olarak» | **Kök kopuk.** "Bu kişiler" kimdir, yazmıyor; madde etiketi boş. Büyük olasılıkla [P251] (2024 KPSS Kamu Yönetimi, md 63) sorusunun baş tarafı içe aktarımda düşmüş. Cevap "1" ancak özgün kökle anlamlı. |
| İdare başlığı (diğer konu 10.) | — | «Bakanlık teşkilatı ile ilgili aşağıdakilerden hangisi doğrudur?» | Anahtar: "bakan müşavirlerinin sayısı on beşi geçemez". md 61/A'nın 7547 (8/5/2025) sonrası metninde **sayı sınırı yok**. Dayanak başka bir mevzuat olabilir; **doğrulanamadı**. |
| 99 | 41 | «Aşağıdakilerden hangisinde devlet memurluğuna alınacaklarda » | Anahtar "en az ilkokul mezunu olmak" genel şart değildir diyor. md 41 ortaokulu genel kural sayar ama "ilkokulu bitirenlerin de alınması caizdir" der; şık savunulabilir biçimde doğrudur. Tartışmalı anahtar. |
| 96 | Ek 8 | «Aşağıdakilerden hangisi kurumlar arası geçici süreli görevle» | Anahtar "resen yapılır, muvafakat aranmaz" önermesini yanlış sayıyor. Ek 8'in son fıkrası kurumların memuru altı aya kadar (muvafakat şartı yazmadan) görevlendirebileceğini söyler. Birinci fıkra rejimi için anahtar doğrudur; kök rejimi ayırmıyor. |
| 174, 181 | 31 | «Bir bakanlıkta görev yaptıktan sonra emekli olan (B), görevi» / «Bir bakanlıktaki görevinden emekli olan bir kişi, yazdığı an» | Aynı vaka, aynı cevap. |
| 68, 77, 223 | 3 | «… “Devlet memurlarına, yaptıkları hizmetler için lüzumlu bil» | Üç resmî sınavın aynı sorusu (+İdare başlığında dördüncü). |
| 114 | 104 | «Memura, eşinin doğum yapması halinde ve isteği üzerine veril» | "7 gün" ile "1 hafta" eşdeğer iki çeldirici. Kusur değil, biçim zaafı. |
| 23 soru | "md ?" | — | Madde etiketi yok; çoğu çoklu önerme ya da başlık sorusu. |

Eskimiş cevap taşıyan soru **bulunmadı**: md 56 (6 soru), md 104 (analık hesabı, çoğul gebelik), md 127, md 61/A ve md 77 soruları bugünkü metinle uyumludur.

---

## §3 Madde madde değer tablosu

### Ayrıntılı (sınav değeri taşıyabilecek hükümler)

| md | (i/ii/iii) | Değer | Açı | Bankada | Varsayılan / sezgi riski | Karar |
|---|---|---|---|---|---|---|
| 3 | i | O | K | ×4 | — | tükendi |
| 6–8, 10, 14, 15 | i, ii | Y | K, Sn | dolu | başlık eşleme ezberi | dışarıda |
| 9 | ii | D | K | — | sağduyu | yalnız doğru önerme |
| **11** ◆ | i | Y | Sn, V | ×7 | 11/4 "acele hâller … istisnalar saklıdır" iki okumalı (suç teşkil eden emre uygulanır mı) | dışarıda |
| 12 ◆ | ii | Y | Sn | ×2 | — | dışarıda; 12/1 doğru önerme olur |
| **13/1 ikinci cümle** | ii | O/Y | Sn [K→K] | hayır | Sezgi "mahkûmiyet beklenir" **yanlışa** götürür (lehte) | **p1 #2** |
| 13/2 ◆ | ii | O | Sn | hayır | "Sorumluya rücu edilir" sezgiyle bulunur (ters) | yalnız doğru önerme |
| **16** ◆ | ii | O | Ş, Sn | hayır | "ölümle sona erer" sezgisi yanlışa götürür (lehte); ilk fıkra sağduyu | **p1 #3** |
| 17–20, 22–24 | i | D | K | başlık ×8 | — | tükendi |
| **21/2** ◆ | ii | Y | Ş [K→K] | hayır | "Şikâyet edilen atlanır" sağduyudur; ölçülen unsur silsile ve en yakın amir olmalı | **p1 #1** |
| 25 | ii | O | Ş, M | hayır | "illerde vali" varsayılan; "en büyük amir" ile "bakan" ya da "atamaya yetkili amir" örtüşür; 4483 md 15 farklı rejim kurar (savcılık re'sen) | dışarıda (iki okumalı) |
| 26, 27 | ii | D/O | K | liste öğesi | "birlikte" ↔ "toplu" kök yankısı | dışarıda |
| 30 ◆ | ii | O | K, V | liste öğesi | yasak olduğu sağduyu; başlık eşleme | yedek |
| 28, 29, 31 | i, ii | Y | Ş, İ | ×9 | — | tükendi |
| 36 ◆ | ii | O | K | ×12 | Emniyet Hizmetleri Sınıfının sayımı eski unvanlı; bekçinin iki sınıfta yer alması "jandarma bölgesi" sezgisiyle bulunur | tükendi |
| 40, 41, 48 | ii | O | Ş | ×7 | 48/A-8 iptal | tükendi |
| 53 | ii | O | S | ×2 | emniyette %5 (3201 Ek 29): aynı kavram iki değer | dışarıda |
| 54–58 | ii | Y | Ş, M, S | ×9 | — | tükendi |
| 62, 63 ◆ | ii | Y | S, Sn | ×9 | — | tükendi |
| 64, 68 | iii | O | S, Ş | ×9 | polise 3201 md 55 (rütbe) ayrıca | dışarıda |
| 72–76 | iii | O | Ş, M | ×5 | polise Atama Yönetmeliği | dışarıda |
| 86 | ii | O | Ş, S | ×2 | 86/4 "(…)" iptal sonrası bulanık | dışarıda |
| 90 | ii | D/O | Ş | hayır | "birden çok görev olmaz" sezgisi; "ücretli" kaydı yokluktan yargı ister | dışarıda |
| 91, 92 ◆ | ii | O | S, Ş | ×4 | — | dolu |
| 94–97 ◆ | ii | Y | S, Sn, V | ×7 | — | tükendi |
| 98/b | ii | O/Y | Sn, A | hayır (98 ×1: "hangisi değildir") | "şartı kaybeden memur kalamaz" sezgisi; "sona erer" şıkkı kategori adıdır, çıkarma da bir sona erme hâlidir (iki doğru riski) | yedek |
| 99–103 ◆ | ii | Y | S, M | ×9 | — | tükendi |
| 104, 105, 108 ◆ | ii | Y | S, Ş, V | ×26 | — | tükendi |
| 109 | ii | D | K | hayır | — | RED emsali |
| **122** | ii/iii | O | M, Ş, A | ×1 (kontenjan) | "ilçede kaymakam" varsayılanı yanlış önermeye bağlanabilir (lehte). Emniyette ödül 3201 md 86 ile ayrıca düzenli (bankada 3 soru) | **p2 #5** |
| 124, 134 | iii | D | M | — | yönetmelik | dışarıda |
| 125/A–D | i, iii | Y | F | ×25 | 7068 ile aynı fiil farklı ceza | yasak (kural f-1) |
| **125/E-e** ◆ | i, ii | Y | F [K→K] | hayır | "olağanüstü durum → en ağır ceza" sezgisi doğruya götürebilir; karşı ağırlık D-n ("kasten yapmamak" → kademe ilerlemesinin durdurulması) | **p2 #3** |
| 125/E-a, E-b | i | D/O | F | hayır | ideolojik fiil → en ağır ceza sezgisi; E-a 7068 md 8/6-p ile çakışır | dışarıda |
| 125/E-f | iii | — | F | hayır | 7068 md 8/6 ile çelişir | yasak |
| 126, 128, 130–132, 135 | i, iii | Y | M, S | ×27 | — | tükendi |
| **127 son fıkra 2. cümle** | i, iii | Y/O | Sn [K→K] | hayır | "zamanaşımı dolduysa ceza verilemez" sezgisi yanlışa götürür (lehte). 7068 md 29/4 farklı kural koyar | **p2 #4** |
| 129 | iii | D | Ş | hayır | 7068 md 31/4 ile aynı cümle | dışarıda |
| 133/3 | iii | O | M, A | hayır | 135'i bilen "yüksek disiplin kurulu" der (lehte); 126'yı bilen bulur | yedek |
| 137–140, 142, 145 ◆ | ii | Y | M, S | ×9 | — | tükendi |
| **141/1** ◆ | ii | Y | K, Sn [K→K] | değer ×2; kapsam hayır | "tutukluya aylık ödenmez" ya da "görevle ilgisizse ödenmez" sezgisi yanlışa götürür (lehte) | **p2 #1** |
| 143, 144 ◆ | ii | O | Ş | hayır | 142 ↔ 143/a örtüşür; 144'ün atfı karışık (iki okumalı) | dışarıda |
| 178/B ◆ | ii | O | S | ×1 | — | dolu |
| **Ek 8 (a), (c), (d)** ◆ | ii | Y | İ, S [K→K] | genel kural ×2; istisna hayır | Genel kuralı (altı ay, boş kadro) bilen eksik aday yanılır (lehte) | **p2 #2** |
| Ek 19 | ii | D | K | — | sağduyu | dışarıda |
| Ek 31, Ek 39 ◆ | ii | Y | Ş, V | ×2 | — | dolu |

### Kapsam dışı (kısa gerekçeyle)

| Aralık | Gerekçe |
|---|---|
| md 32, 34, 35, 38, 42, 44, 57, 65, 66, 70, 75, 106, 107, 110–121, 123, 136, 148, 153, 162, 168, 173, 190, 194–198, 207, 209, 213, 226–230, 234–236, 238; Ek 1–7, 9, 11, 13, 16–18, 20–23, 25, 28, 30; Geçici 1–33 | mülga (103 başlık) |
| md 33, 37, 39, 43, 45, 67, 69, 71 | kadro, gösterge ve derece tekniği; md 37 ve 71 RED emsali |
| md 46, 47, 49–52 | alım usulü; Devlet Personel Başkanlığı; md 52 RED emsali |
| md 59–61/A | sayım ezberi; md 59 banka metni eksik |
| md 77–85 | yurt dışı ve askerlik; bankada 10 soru; md 77, 83, 85 RED emsali |
| md 87–89, 93 | ikinci görev ve ders görevi; md 88 RED emsali |
| md 146–186 | mali hükümler (§e) |
| md 187–213 | sosyal haklar; özel kanuna atıf ya da gösterge |
| md 214–225 | yetiştirme ve mecburi hizmet; GYS/MEB konusu; bankada 6 soru |
| md 231–233, 237, 239 | bilgi sistemi, askerî personel, yürürlükten kaldırma, yürütme |
| Ek 10, 12, 14, 15, 24, 26, 27, 29, 32–38, 40–42, 44 | idari ve mali ayrıntı; Ek 34 RED emsali |
| Geçici 34–52; Ek Geçici 1–59; cetveller | intibak, geçiş, kadro ihdası |

---

## §4 Değer tabloları

### Süreler (md 1–145 ve Ek 8; betikle sayım, yaklaşık)

| Değer | Geçiş | Başlıca yerler | Bankada |
|---|---|---|---|
| üç yıl ✱ | ≈21 | 56 yeniden alınmama; 68 derecede bekleme; 97/C; 125/D üst sınır; 4/B; 108/C (yaş) | evet (hepsi) |
| bir yıl ✱ | ≈21 | 54 alt sınır; 63; 64; 97/B; 108/E; 4/B fesih | evet |
| altı ay ✱ | ≈14 | 91; 97/A; 127/1-b; **127 son fıkra**; 128/3; Ek 8/d ve son fıkra; 104/D | 127 son fıkra hariç evet |
| iki yıl ✱ | ≈11 | 54 üst sınır; 78; 101; 127 son fıkra; **Ek 8/d** | Ek 8/d hariç evet |
| on gün ✱ | 9 | 63/2; 94; 104/B, C, E; 108/F; 178/B | evet |
| on yıl ✱ | 8 | 77; 102; 108/D; 132; 133; 192 | evet |
| on beş gün ✱ | 7 | 28; 47; 62; 126/3; 128/1–2 | evet |
| otuz gün / bir ay ✱ | 12 | 4/B; 6; 61/A; 83; 94/2; 103; 127/1-a; 128/2; 135 | evet |
| sekiz hafta ✱ | 6 | 104/A (doğum öncesi; evlat edinme) | evet |
| beş yıl · dört yıl | 5 · 5 | 132, 133, 108/E · 72 | evet |
| 10 iş günü | 1 | 139 (md 1–145'teki tek "iş günü") | evet ×3 |
| yedi gün ✱ | 2 | 130; 135 (104/B'de de yedi gün izin) | evet |
| üç ay ✱ | 4 | 86/4; 105 refakat; 145; 92/5 | 86/4 hariç evet |
| on altı hafta · yirmi dört hafta · iki hafta | 1'er | 104/A (7578) | evet |

- Süre sorusu ancak ✱ kilidiyle kurulur. Bu turun iki süre yuvası var: Ek 8/d (iki yıl) ve 127 son fıkra (altı ay). İkisinde de kök olayı açık yazar.
- Eşdeğer şık yasak: "otuz gün" ↔ "bir ay"; "yedi gün" ↔ "bir hafta" (bankadaki 114. soru bu hatayı taşır).

### Merciler ve aktörler (md 1–145 ve Ek 8)

| Aktör | Geçiş | İş |
|---|---|---|
| **Cumhurbaşkanı** (karar, kararname, "-nca") | 43 | yönetmelik, sayı, saat, pozisyon … **varsayılan** |
| kurum(u) | ≈25 | bildirim, izin, başvuru |
| Devlet Personel Başkanlığı | 24 | eski ad; kullanılmaz |
| atamaya yetkili amir | 14 | 58, 63, 64, 68, 73, 104/C, 126, 133, 138, 142, 145 |
| vali | 12 | 15, 25, 100, 104/C, 122, 126, 138 **(varsayılan: "il → vali")** |
| disiplin kurulu | 11 | 12, 126, 128, 133/3, 135 |
| disiplin amiri | 8 | 12, 56, 58, 126, 128 |
| müfettiş | 7 | 138, 142, 145 |
| kaymakam | 5 | 104/C, 122 (yalnız başarı belgesi), 138 |
| bağlı, ilgili ya da yetkili bakan | 5 | 15, 31, 77, 122 |
| yüksek disiplin kurulu | 4 | 126, 128, 129, 135 |

- **Varsayılanlar:** "Cumhurbaşkanı", "yönetmelik", "illerde vali", "atamaya yetkili amir", "disiplin amirinin teklifi – atamaya yetkili amirin onayı".
- **Çiftler:** disiplin kurulu ↔ yüksek disiplin kurulu (126, 133/3, 135); atamaya yetkili amir ↔ disiplin amiri (56, 58, 126); vali ↔ kaymakam ↔ bakan (122: başarı belgesinde üçü, ödülde ikisi); müfettiş ↔ atamaya yetkili amir (142, 145; bankada).
- **Aynı şık takımına girmeyenler:** "vali" ile "mülki amir"; "atamaya yetkili amir" ile "bakan" (merkezde örtüşebilir); "en büyük amir" (md 25) herhangi bir merciyle.

### İki seçenekli hükümler (yuva açılmaz; 23 Kas kuralı 1)

| Hüküm | İki seçenek |
|---|---|
| 13/1 ilk cümle | dava personele mi kuruma mı |
| 132/1 | ceza verildiği tarihte mi kesinleşince mi uygulanır |
| 103/1 | izin amirin mi memurun mu uygun bulduğu zamanda |
| Ek 8/f | muvafakat aranır mı aranmaz mı |
| 86/2 | vekâlet aylıklı mı aylıksız mı |
| 58/1 | onay tarihinden mi adaylığın sonundan mı geçerli |
| 21/2 | söz ile mi yazı ile mi (ikisi de; yalnız bu unsur sorulmaz) |
| 141/1 "görevi ile ilgili olsun veya olmasın" | tek başına sorulmaz; p2 #1'de rejim şıklarıyla birlikte ölçülür |

### Bilmeyen adayın sezgiyle bulduğu hükümler (tek başına yazılmaz)

md 8 (itibar ve güven), md 9, md 12/1, md 16/1 (belgeyi dışarı çıkaramaz, özel işinde kullanamaz), md 18, md 26–27 (grev ve iş yavaşlatma yasak), md 29–30 (hediye ve menfaat yasak), md 39, md 45/1, md 95 (devir teslim bitmeden bırakamaz), md 96 (afette bırakamaz), md 130/1 (savunmasız ceza olmaz), md 131/1, md 137 (ihtiyati tedbir), md 139/2 (keyfî uzaklaştıran amir sorumludur), md 145/1 son cümle (karar yoksa göreve başlatılır), 13/2 (işkence tazminatında rücu), Ek 19.

---

## §5 Ayırt etme malzemesi

### 657 içinde

- **Emir merdiveni** [K→K]: A-a kayıtsızlık ya da düzensizlik → uyarma · B-a kusurlu davranmak → kınama · B-j verilen emirlere itiraz → kınama (bankada) · C-a kasıtlı olarak tam ve zamanında yapmamak → aylıktan kesme (bankada şık) · D-n verilen görev ve emirleri kasten yapmamak → kademe ilerlemesinin durdurulması · **E-e savaş, olağanüstü hâl veya genel afetlere ilişkin konularda amirlerin verdiği görev veya emirleri yapmamak → Devlet memurluğundan çıkarma.** p2 #3'ün karar uzayı budur.
- **Görevden uzakta kalan memur** [K→K] ◆: 141/1 görevden uzaklaştırılan **ve** herhangi bir suçtan tutuklanan **veya** gözaltına alınan memur aynı rejime girer (aylığın üçte ikisi; sosyal hak ve yardımlar sürer) ↔ 108 aylıksız izin ↔ 94 çekilmiş sayılma (izinsiz terk, kesintisiz on gün) ↔ 125 göreve gelmeme fiilleri. Tutukluluk "mezuniyetsiz terk" değildir ⚑ (metin bunu açıkça yazmaz; şık yapılmaz).
- **Zarar ve tazmin** : 12/2 memurun idareye verdiği zarar (rayiç bedel; bankada) ↔ 12/3 küçük zarar (bankada) ↔ 13/1 c.1 kişinin zararı (kuruma dava; bankada) ↔ **13/1 c.2 zimmet: cezai takibat sonucu beklenmeden Hazine öder** ↔ 13/1 c.3 rücu genel hükümlere göre ↔ 13/2 Avrupa İnsan Hakları Mahkemesi tazminatında rücu ◆.
- **Geçici görevlendirme** [K→K] ◆: Ek 8 genel kural (kurumun talebi + kendi kurumunun izni; dördüncü ve daha yukarı dereceden boş kadro; aylığı kendi kurumundan; bir yılda altı ay; göreviyle ilgili; muvafakat) ↔ **yurt dışında görevlendirilen güvenlik görevlileri** (boş kadro şartı yok; aylığı kendi kurumundan alma kuralı uygulanmaz; en çok iki yıl, bir katına kadar uzatılabilir) ↔ Ek 8 son fıkra (kurumunca, altı aya kadar) ↔ md 78 (yurt dışına yetiştirme: iki yıla kadar, en çok bir kat ✱; bankada "dört yıl" vakası) ↔ md 77 (on ve yirmi bir yıl; bankada).
- **Başarı ve ödül** : başarı belgesi (bakan, vali, kaymakam) ↔ üstün başarı belgesi (üç defa başarı belgesi alan) ↔ ödül (yalnız üstün başarı belgesi verilenlere; bakan ve vali; kaymakam yok) ↔ 125 "ödül veya başarı belgesi alan memura bir derece hafif ceza uygulanabilir" (bankada ×2).
- **Silinme ↔ itiraz ↔ ceza verme** (kademe ilerlemesinin durdurulması): cezayı disiplin kurulu kararı alındıktan sonra atamaya yetkili amir verir (126) ↔ itiraz yüksek disiplin kuruluna (135) ↔ silinmede disiplin kurulunun mütalaası (133/3).
- **Zamanaşımı** : soruşturmaya başlama bir ay ve altı ay (öğrenme tarihinden) ↔ ceza verme iki yıl (fiil tarihinden) ↔ **iptal sonrası**: kararın idareye ulaştığı tarihten kalan süre içinde; süre dolmuş ya da altı aydan az kalmışsa en geç altı ay.

### 657 ↔ 7068 ↔ 3201: aynı kavram, farklı değer

| Kavram | 657 | 7068 / 3201 / yönetmelik | Niteleme |
|---|---|---|---|
| disiplin cezası çeşitleri | beş | yedi (7068 md 7) | ayırt etme malzemesi; ama 657 sorusunda 7068 cezası şık olmaz |
| fiil–ceza | §f tablosu | §f tablosu | **iki doğru tuzağı**: kök kanunu adıyla kilitlese de aday bankada iki farklı cevap görür; yeni soru yazılmaz |
| itiraz süresi ve mercii | 7 gün; disiplin kurulu ya da yüksek disiplin kurulu | 10 gün; bir üst disiplin amiri | ikisi de bankada; yazılmaz |
| cezanın uygulanması | verildiği tarihten, derhal | kesinleşince | iki seçenekli; yazılmaz |
| iptal sonrası yeniden ceza | kalan süre ya da altı ay; başlangıç "kararın idareye ulaştığı tarih" | fiilin hatalı vasıflandırılması ya da düzeltilebilir şekil noksanlığı gerekçesiyle iptalde, "kararın tebliğinden itibaren altı ay" (7068 md 29/4) | **ayırt etme malzemesi** (p2 #4). 7068 md 29/4 bankada ölçülmemiş. Açıklama 7068'in kuralını içerikle yazmaz. |
| savunma süresi, karar süresi, zamanaşımı, silinme | 7 gün; 30 gün; bir ay, altı ay, iki yıl; beş ve on yıl | aynı | ✱ ölçme değeri yok |
| görevden uzaklaştırma | md 137–145 | 7068 md 28/1 aynen atıf; 28/2 ek hâl (çıkarma kararı onaylanıncaya kadar) | tek rejim; 28/2 7068 sorusudur |
| Devlet memurluğundan çıkarma fiilleri | 125/E | 7068 md 9: 657 + iki ek fiil (bölücü faaliyet, işkence) | 657 sorusunda işkence şık olmaz |
| izinsiz görevden uzak kalma → çekilme | kesintisiz on gün (md 94) | 3201 md 64: "mezuniyet müddetlerini 15 gün tecavüz ettiren … istifa etmiş addolunurlar" | **iki doğru tuzağı**; polis vakası kurulmaz. md 94 zaten dolu. |
| yeniden alınma | md 97 (altı ay, bir yıl, üç yıl, hiçbir surette); md 92 (iki defa) | 3201 md 59 (üç sene içinde dönmeyen alınmaz), md 60; Atama Yön. md 14 → 657 md 92–94 | tuzak; dolu |
| engelli oranı | %3 (md 53) | emniyette %5 (3201 Ek 29) | ikisi de bankada |
| mehil | md 62 | Atama Yön. md 20 → 657 md 62 | tek rejim; dolu |
| ödül | md 122 | 3201 md 86 (madalya ve ödül; yönetmelik) | ayrı rejim; p2 #5'te polis vakası kurulmaz |
| isnat ve iftira | md 25 (amir ya da vali kamu davası açılmasını ister) | 4483 md 15 (savcılık re'sen soruşturmaya geçer) | gerilimli; ikisi de yazılmaz |
| mal bildirimi, hediye | md 14, 29 | 3628; 7068 md 8 | o adlarla bankada |
| yemin | md 6 (asli memurluğa atandıktan sonra bir ay) | 3201'de ayrıca hüküm bulunmadı | dolu |

---

## §6 Kaçınılacaklar (BAĞLAYICI)

- **Metin ve iptaller:** md 48/A-8 (iptal); md 48/A-5'in iptal edilen suçları; md 86/4'ün "(…)" sonrası kapsamı; md 68/B'nin mülga paragrafı; md 57 (mülga); md 61/A'nın 2025 öncesi metni; md 104'ün 2026 öncesi değerleri (yalnız çeldirici olabilir ama analık süresi sorusu yazılmaz); md 59 listesi (banka metni eksik).
- **Ad kuralı:** §d-2 tablosundaki bütün adlar. Özellikle Devlet Personel Başkanlığının geçtiği hiçbir cümle doğru şık, çeldirici ya da açıklama olmaz (md 46, 47, 50, 52, 53, 72 son, 91, 105, 109, 122/3 son cümle ve 122/4, 124, 132/3, Ek 8 son fıkra).
- **Yıllık değişen değerler:** §e listesi. md 122/2'deki "%200" ve md 12/3'teki eşik değer olarak kullanılmaz.
- **Yasak kalıplar:** yönetmelik mercii ve işlem türü (md 2, 13/3, 21/3, 55/3, 80, 89, 100/3, 134 …); "Cumhurbaşkanı" cevaplı merci sorusu; "kimin görüşü alınır"; yürütme ve yürürlük; tablo ezberi (md 36 giriş dereceleri, md 43).
- **Bankada tükenenler (§2):** başlık eşleme (ödev / hak / yasak); kariyer ve liyakat tanımı; sınıf sayımı; md 56; md 62–63; md 94–97; md 99–108; md 125/A–D; md 126, 128, 130–133, 135; görevden uzaklaştırmanın süre ve merci değerleri (10 iş günü, üç ay, iki ay, 2/3, yetkililer, müfettiş → atamaya yetkili amir).
- **Önceki turda RED almış hükümler (yeniden yuva açılmaz):** 4/B'nin 7433 ayrıntıları ve fesih tarihi hesabı; md 6; md 37; md 52; md 58/2; md 64/3; md 68/A-b; md 71; md 74; md 77/3; md 83/2; md 85; md 88; md 104/E parantezi; md 104/A erken doğum cümlesi (yorum gerektiriyor); md 105 (18 ay, refakat); md 108/C ve 108/D yeni cümle; md 109; md 163; md 167; md 169; md 170; md 202; md 210; Ek 34.
- **İki okumalı (doğru şıkta, çeldiricide ve açıklamada kullanılmaz):**
  - md 142 ↔ 143/a: soruşturma sonunda yalnız hafif bir disiplin cezası uygun görülen memurun tedbiri "derhal" mi (142), "kararın kesinleşmesi üzerine" mi (143/a) kaldırılır. Bankadaki 205. soru 142 yolunu ölçüyor.
  - md 144'ün atfı ("140 ıncı ve 142 nci maddelerde 143 üncü maddenin a, b, c fıkralarında yazılı olanlar").
  - md 11/4 (acele hâllerde istisna) konusu suç teşkil eden emre uygulanır mı.
  - md 25 ↔ 4483 md 15; md 25'te "en büyük amir".
  - md 86/4 (iptal sonrası "ayrılmalar"); md 90'daki "ücretli" kaydının tersi.
  - md 127 son fıkra: "kalan zamanaşımı süresi"nin hangi ana göre hesaplanacağı; yargılama süresince zamanaşımının işleyip işlemediği ⚑. **Hesaplı vaka kurulmaz**; yalnız "süre dolmuş ya da altı aydan az kalmış" kolu sorulur.
  - Ek 8: birinci fıkra (muvafakatli) ↔ son fıkra (kurumunca, altı aya kadar); yurt dışındaki güvenlik görevlisinin aylığını nereden alacağı (metin yalnız "hariç" der ⚑); "güvenlik görevlisi"nin kimleri kapsadığı ⚑.
  - md 141/1: görevden uzaklaştırılmadan gözaltına alınan memurda "bu süre"nin başlangıcı; gözaltının kısa sürmesi hâlinde uygulama ⚑. Vaka **tutukluluk** üzerinden kurulur.
  - md 98/b: şartı kaybeden memurun memurluğu kendiliğinden mi sona erer, işlemle mi ⚑.
  - md 13/1 c.2: "Hazine" ile ilgili kurum bütçesi ilişkisi ⚑ (şık "ilgili kurum" ile "Hazine"yi karşı karşıya koymaz).
- **Metin dışı (⚑):** yönetmelikler (§d-4); 7315 sayılı Kanun ve güvenlik soruşturması; 4688 (sendika) ve toplu sözleşme; 5510 ve emeklilik; 6245 harcırah; Anayasa md 128–129 ve 137 (kanunsuz emir Anayasa adıyla bankada); Danıştay içtihadı; İnsan Kaynakları Ofisi, Kamu Personel Bilgi Sistemi; "tedviren görevlendirme"; uzaktan çalışma usulü; Emniyet'in ödül, izin ve şikâyet yönetmelikleri.
- **Varsayılan ve sağduyu:** §4'teki sezgi listesi; "Cumhurbaşkanı", "vali", "atamaya yetkili amir" cevaplı merci soruları.

---

## §7 Parti önerisi

**Dürüst sayım.** 233 yürürlükteki başlıktan 84'ü bankada etiketli olarak, 15 kadarı etiketsiz ölçülmüş; kalanların büyük bölümü mali, sosyal, intibak ya da eski kurumlu hükümdür. Taramadan kestirmesiz, ölçülmemiş ve PAEM/Misyon'da sorulabilir **8 ana yuva** çıktı (3'ü zayıf-orta), ayrıca 5 yedek. Üç değil **iki parti** öneriyorum; üçüncüsü (md 32–85) boş bırakılır.

| Parti | Kapsam | Tavan | Önerilen | Ana yuva |
|---|---|---|---|---|
| `657-p1` | md 1–31: ödevler ve sorumluluklar, genel haklar, yasaklar | 4 | 3 | 3 |
| `657-p2` | md 86–145 ve Ek 8: sona erme, ödül, disiplin (yalnız kural f'nin izin verdikleri), görevden uzaklaştırma, geçici görevlendirme | 5 | 4 | 5 |
| `657-p3` | md 32–85: sınıflandırma, alınma, adaylık, atanma, ilerleme, yer değiştirme | 1 | **0** | 0 |

Hedef tavandır; boş parti geçerli sonuçtur. Üretici her yuvayı kendisi yeniden sınar, yazmadığı yuvanın gerekçesini raporlar.

### `657-p1`

| # | Hüküm | Açı / kök | Zorluk | Çeldirici kaynağı (metindeki yakın hükümler) | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 21/2: müracaat ve şikâyet en yakın amirden başlayarak silsile yoluyla, şikâyet edilen amirler atlanarak yapılır | Doğrudan [K→K]: amiri hakkında şikâyette bulunacak memur şikâyetini nasıl yapar. Doğru şık kanunun ifadesi, kısaltılmış. | orta | "doğrudan atamaya yetkili amire" (126, 133 aktarımı); "disiplin kuruluna" (135 itiraz aktarımı); "kurumunun teftiş birimine" (138 müfettiş); "şikâyet edilen amir dahil, silsile yoluyla" (sağduyuyla elenen tek şık) | "Şikâyet edileni atla" sağduyudur: **bütün güçlü şıklar şikâyet edileni zaten atlamalı**, ölçülen unsur silsile ve en yakın amir olmalı. "Yalnız yazılı" şıkkı kullanılmaz (7068 bankasındaki kök "sözlü, yazılı veya elektronik" der). Yönetmelikteki otuz gün ve toplu şikâyet ⚑. Polis vakası kurulmaz. | 59. soru (usul yönetmelikle; farklı açı); 7068 "usulsüz müracaat → kınama" |
| 2 | 13/1 ikinci cümle: Devlet dairesine tevdi edilen ya da dairece tahsil veya muhafaza edilen paranın personelce zimmete geçirilmesi hâlinde miktar, cezai takibat sonucu beklenmeden Hazine tarafından hak sahibine ödenir | “kişilerin uğradıkları zararlar” (tırnaklı resmî başlık); "doğrudur" biçimi. Doğru önerme bu cümle. | orta/zor | yanlış önermeler: "kişiler zararları için görevi yerine getiren personel aleyhine dava açar" (13/1 c.1'in tersi); "Avrupa İnsan Hakları Mahkemesi kararıyla ödenen tazminat için personele rücu edilmez" (13/2'nin tersi; ◆); "zimmete geçirilen miktar, personelden tahsil edildikten sonra hak sahibine ödenir"; "zarar, memurun brüt aylığının yarısını geçmiyorsa disiplin amirinin kararıyla ödenir" (12/3 aktarımı; farklı zarar türü) | "Beklenmeden" ↔ "kesinleşince" ters çifti kurulmaz; Hazine × zaman ızgarası kurulmaz. 49-E'deki yanlış önerme (Hazine ve Maliye Bakanlığı yönetmeliği) yeniden kullanılmaz. "Rücu kasta bağlıdır" önermesi yokluktan yargıdır, yazılmaz. Doğru önerme "zararsız usul cümlesi" değildir (kural 23 Kas-2 karşılanır). | 6-E, 49-D (kurum aleyhine dava; doğru önerme olarak) |
| 3 | ◆ md 16: resmî belge, araç ve gereçler yetki verilen mahaller dışına çıkarılamaz, hususi işlerde kullanılamaz; görev sona erince iade edilir; **bu zorunluluk memurun mirasçılarına da şamildir** | “resmî belge, araç ve gereçler”; YANLIŞTIR (partide tek olumsuz kök). Yanlış önerme: iade zorunluluğu memurun ölümüyle sona erer. | orta | doğru önermeler: 16/1'in iki yasağı; 16/2 ilk cümle; 12/1 (teslim edilen Devlet malını korumak ve her an hizmete hazır bulundurmak için tedbir almak) | Çeldirici havuzu dar. md 125'in fiil–ceza değerleri (kaybetmek → kınama; özel işte kullanmak → kınama; özel menfaat için kullanmak → aylıktan kesme) **önerme yapılmaz** (bankadaki cevaplar). Doğru önermeler sıra oluşturmamalı. Tek cevaplı kurulamıyorsa yazılmaz. | 22. soru (kaybetmek → kınama; farklı açı) |

- **Yedek:**
  - md 30 ◆: denetimi altındaki ya da görevi veya kurumuyla ilgisi olan bir teşebbüsten, doğrudan ya da aracı eliyle, her ne ad altında olursa olsun menfaat sağlama yasağı. Yalnız md 29 ile ayırt ettiren bir vaka kurulabilirse (md 29: hediye isteme, menfaat amacıyla hediye kabul etme, iş sahibinden borç). Başlık eşleme biçimi yazılmaz.
  - md 21/1: "müracaat" (kurumuyla ilgili resmî ve şahsi işler) ↔ "şikâyet" (amirin ya da kurumun uyguladığı idari eylem ve işlem) ayrımı. Yalnız #1 düşerse.
- **Dışarıda:** md 1–5; md 6–8, 10, 11, 12/2–3, 13/1 c.1, 13/3, 14, 15; md 17–20, 22–24 (başlık); md 25 (iki okumalı); md 26–29, 31.
- **Kök tipi (3 soru):** doğrudan 1 (koşul→kural), "doğrudur" 1, olumsuz 1. Olumsuz 1/3; iki parti birlikte 2/7 (sınırın hemen üstü). Orkestratör kabul etmezse #3 "doğrudur" biçimine çevrilir ve #2 doğrudan köke döner ("… hak sahibinin zararı nasıl karşılanır").
- **Parti içi sızıntı:** #2'nin doğru önerme havuzu 12/1'i içermez (#3 kullanıyor). #1 öbürleriyle temas etmez.

### `657-p2`

| # | Hüküm | Açı / kök | Zorluk | Çeldirici kaynağı | Bilinen risk | Bankadaki en yakın soru |
|---|---|---|---|---|---|---|
| 1 | ◆ 141/1: görevden uzaklaştırılan **ve** görevi ile ilgili olsun olmasın herhangi bir suçtan tutuklanan veya gözaltına alınan memura bu süre içinde aylığının üçte ikisi ödenir; sosyal hak ve yardımlardan yararlanmaya devam eder | [K→K]: görevi ile ilgisi olmayan bir suçtan tutuklanan memurun tutukluluk süresindeki durumu. Şıklar oran dizisi değil, **rejim cümleleri**. Polis vakası kurulabilir (7068 md 28/1). | orta | "aylığının tamamı ödenir, çünkü görevden uzaklaştırılmamıştır" yerine kısa biçimi: "aylığını tam alır"; "aylık ödenmez, sosyal yardımları sürer" (çalışmıyor sezgisi); "aylıksız izinli sayılır" (108/G askerlik aktarımı); "suç göreviyle ilgiliyse üçte ikisi, değilse ödenmez" (metnin açıkça kapattığı ayrım) | Gözcü mükerrer sayabilir: 83 ve 160. sorular 2/3'ü ölçüyor. Savunma: onlar kapsamı (uzaklaştırma kararı olmadan tutuklama; görevle ilgisiz suç) ölçmüyor. Vaka tutukluluk üzerinden kurulur; gözaltı tek başına kullanılmaz (§6). 141/2 (geri ödeme) şık olmaz: 204. sorunun cevabı. | 83, 160, 204 |
| 2 | ◆ Ek 8 (a), (d): yurt dışında görevlendirilen güvenlik görevlilerinde boş kadro şartı aranmaz; geçici görevlendirme süresi en çok iki yıldır, gerekli görülürse bir katına kadar uzatılabilir | İki biçimden biri. (A) Süre [S, İ]: yurt dışında geçici süreli görevlendirilen güvenlik görevlisi için ilk görevlendirme en çok ne kadardır. (B) "Aranmaz" [İ]: bu görevlendirmede hangisi ARANMAZ → görevlendirileceği kurumda dördüncü ve daha yukarı dereceden boş kadro. | orta | (A) altı ay (genel kural; bankada, en güçlü), bir yıl (108/E), dört yıl (72; uzatılmış toplam), on yıl (77). (B) aranan şartlar: görevlendirmeyi isteyen kurumun talebi; çalıştığı kurumun izni; görevlendirmenin göreviyle ilgili olması; memurun muvafakati | (A)'da "iki yıl" md 78'de de geçer ✱: kök "güvenlik görevlisi" ve "geçici süreli görevlendirme" ile kilitler; "uzatma dahil" sorulmaz (md 78'in bankadaki vakası "dört yıl"). (B) olumsuz köktür; partide ikinci olumsuz olur, #5 ile birlikte yazılmaz. "Güvenlik görevlisi" metnin ifadesiyle yazılır; "polis", "koruma memuru", "misyon" ⚑. Aylığın nereden alınacağı sorulmaz. | 95 (altı ay), 96 (genel şartlar) |
| 3 | ◆ 125/E-e: savaş, olağanüstü hâl veya genel afetlere ilişkin konularda amirlerin verdiği görev veya emirleri yapmamak → Devlet memurluğundan çıkarma | [K→K] F: genel afete ilişkin bir konuda amirinin verdiği görevi yapmayan memur hakkında hangi disiplin cezası. Şıklar 657'nin beş cezası, hafiften ağıra. Resmî kalıp: "… fiili aşağıdaki disiplin cezalarından hangisini gerektirir?" | orta/zor | merdivenin öbür basamakları (§5): kınama (B-a, B-j), aylıktan kesme (C-a), kademe ilerlemesinin durdurulması (D-n; en güçlü) | "Olağanüstü durum → en ağır ceza" sezgisi doğruya götürebilir; taze kör çözücü ölçer. Kök fiili **kanunun sözleriyle** yazar; "kasten", "zarar doğdu" gibi ek unsur yazılmaz (D-n ya da 7068 md 10'u çağırır). Vaka "memur" ile; polis yazılmaz. Açıklama merdivenin bankadaki basamaklarını (itiraz → kınama; bir–iki gün → aylıktan kesme) içerikle yazmaz. | 14, 23, 149 (aynı kalıp, başka bentler) |
| 4 | md 127 son fıkra, ikinci cümle (7573, 2026): disiplin cezası yargı kararıyla iptal edilirse karar gerekçesi dikkate alınarak yeniden ceza tesis edilebilir; zamanaşımı dolmuşsa ya da altı aydan az kalmışsa kararın idareye ulaştığı tarihten itibaren en geç altı ay içinde | [K→K] Sn: iptal kararı idareye ulaştığında iki yıllık ceza verme zamanaşımı dolmuş olan memur hakkında … Doğru: kararın idareye ulaştığı tarihten itibaren en geç altı ay içinde yeniden ceza tesis edilebilir. | zor | "zamanaşımı dolduğundan yeniden ceza verilemez" (sezgi; en güçlü); "iki yıllık süre kararın idareye ulaştığı tarihte yeniden başlar"; "… on beş gün içinde başka bir ceza verilebilir" (126/3: kurulun reddi hâli ✱); "… bir ay içinde soruşturmaya başlanırsa ceza verilebilir" (127/1-a ✱) | "Altı ay" 127/1-b ve 128/3'te de geçer ✱: kök olayla kilitler. Hesaplı vaka kurulmaz (§6). 7068 md 29/4'ün kuralı ("tebliğden itibaren altı ay"; hatalı vasıflandırma ya da şekil noksanlığı) şık ve açıklama olmaz. "Tesis edilebilir" takdiridir; "tesis edilir" yazılmaz. 7573'ün geçiş hükmü doğrulanamadı: "2026'dan önce verilen cezalar" vakası kurulmaz. | 21, 155, 159 (öbür fıkralar) |
| 5 | md 122/1–2: başarı belgesini merkezde bağlı veya ilgili bakan, illerde valiler, ilçelerde kaymakamlar verebilir; üç defa başarı belgesi alana üstün başarı belgesi verilir; ödül yalnız üstün başarı belgesi verilenlere, bakan ve valilerce uygun görülürse verilebilir | “başarı, üstün başarı değerlendirmesi ve ödül”; YANLIŞTIR. Yanlış önerme: üstün başarı belgesi verilenlere ilçelerde kaymakamın uygun görmesiyle ödül verilebilir. | orta | doğru önermeler: kaymakam başarı belgesi verebilir; üç defa başarı belgesi → üstün başarı belgesi; başarı belgesi somut olay ve verilere dayalı katkının tespitine bağlıdır; ödül verilmesi uygun görülmeye bağlıdır | Polise değeri (iii): emniyette ödül 3201 md 86'da; polis vakası kurulmaz. "%200", "binde on", "binde yirmi" ve Ocak ayı bildirimi (Devlet Personel Başkanlığı) önerme olmaz. #2 (B) ile birlikte yazılmaz (iki olumsuz). Sınav değeri 3 sınırında; gözcü düşük bulursa bırakılır. | 203 (kontenjan hesabı) |

- **Yedek (değer sırasıyla):**
  - md 133/3: kademe ilerlemesinin durdurulması cezasının özlük dosyasından silinmesinde disiplin kurulunun mütalaası alınır. Çeldirici: yüksek disiplin kurulu (135 itiraz mercii), disiplin amiri, atamaya yetkili amir (başvuru mercii; 158. sorunun kökünde yazılı, doğru şık olamaz). (iii).
  - md 98/b: memurluğa alınma şartlarından birini taşımadığı sonradan anlaşılan ya da memurluğu sırasında kaybeden memurun memurluğu sona erer. Yalnız iki doğru riski kapatılabilirse (§3).
  - md 145/1 son cümle: yalnız başka bir sorunun doğru önermesi olarak.
- **Dışarıda:** md 86–97 (dolu ya da iki okumalı); md 99–108 (tükendi); md 109; md 124; md 125/A–D ve E'nin öbür bentleri; md 126, 128–132, 134, 135; md 137–140, 142–145; Ek 8'in genel kuralı ve son fıkrası.
- **Kök tipi (önerilen 4: #1–#4):** doğrudan 4, hepsi koşul→kural; ayırt etme 3 (1, 2, 4). #5 eklenirse olumsuz 1/5.
- **Zorluk:** orta 2 (1, 2), orta/zor 1 (3), zor 1 (4). Kolay yuva yok; bu bilinçlidir (kolay hükümlerin hepsi bankada).
- **Parti içi sızıntı:** #3 ↔ #4: 4'ün açıklaması ceza basamaklarını, 3'ünki zamanaşımını anmaz. #1'de "disiplin soruşturması" geçmez. #2 ↔ #5 temas yok.

### `657-p3` (md 32–85): önerilmez

Aralıktaki 54 başlığın 12'si mülga; kalanların sınav değeri taşıyanları bankada 60'tan çok soruyla ölçülmüş (md 36: 12; md 54–58: 9; md 62–63: 9; md 64 ve 68: 9; md 40, 41, 48: 7). Ölçülmemiş kalanlar ya teknik (33, 37, 39, 45, 67, 69, 71, 74) ya alım usulüdür (49–52) ya da RED emsallidir. Polise bu aralıkta 3201 ve Atama Yönetmeliği uygulanır (iii). Tek aday olan Emniyet ve Jandarma Hizmetleri Sınıflarının sayımı (md 36/VII–VIII; çarşı ve mahalle bekçisi ikisinde de sayılır) eski unvanlar taşır ve "jandarma bölgesi" sezgisiyle bulunur; yazılmaz.

### Partiler arası ve komşu kanunlarla temas kuralları

- Her parti doğru cevabı yalnız kendi madde aralığından kurar; öbür partinin hükmü yalnız çeldirici olur ve o partinin cevabını vermez.
- **p1 ↔ p2:** p1 #1'in çeldiricisindeki "disiplin kuruluna" ve "atamaya yetkili amire" ifadeleri p2 yedeği md 133/3 ile aynı kısa denemeye konmaz. p2 #3'ün açıklaması md 11'i (emre uyma, yazılı yenileme) içerikle yazmaz: bankada 7 sorunun cevabıdır.
- **657 ↔ 7068:** §f kural 4–5. 657 sorusunda 7068'e özgü ceza adı, değer ve merci (Bakanlık Yüksek Disiplin Kurulu, il polis disiplin kurulu) yer almaz. p2 #1 için 7068 md 28/2 (çıkarma kararı onaylanıncaya kadar uzaklaştırma) şık olmaz: 7068 adıyla bankada.
- **657 ↔ 3201 ve Atama Yönetmeliği:** p2 #2'de 3201'in yurt dışı görevlendirme hükümleri ve yönetmelikler ⚑. Hiçbir soru 3201 md 59, 60, 64'ün değerlerini çeldirici yapmaz (eski dilli, 657 ile çelişen hükümler).
- **657 ↔ 4483, 3628:** soruşturma izni, mal bildirimi süreleri ve hediye o adlarla bankadadır; 657 sorusu bunları sormaz, açıklamada değer vermez.
- **657 ↔ Anayasa ve İdare Hukuku bankası:** kanunsuz emir (Anayasa md 137), memur güvenceleri (md 128–129), grev yasağı ve "süreklilik" ilkesi, idari işlemin unsurları (konu, şekil, yetki gasbı) o başlıklarda bankadadır. p2 #3 "bu işlem hangi unsur yönünden sakattır" biçimine çevrilmez ([İ367] ve İdare başlığındaki üç soru).
- Partiler arası açıklama sızıntısını dil gözcüsü tarar.

---

## §8 657'ye özgü kurallar

### Üretici kuralları

1. **Dayanak ve güncellik.** Doğru cevap yalnız güncel madde gövdesinden kurulur. "Metnin durumu" bağlayıcıdır: 48/A-8 iptal; 86/4 bulanık; 57 mülga; 104, 56, 127 ve 61/A'nın bugünkü metni esas. 7573'ün ve 7578'in geçiş hükümleri doğrulanmadı: "değişiklikten önce başlayan durum" vakası kurulmaz.
2. **Ad kuralı.** §d-2'deki eski adlar hiçbir alanda yer almaz. Merci gerekiyorsa metnin yaşayan aktörleri kullanılır: atamaya yetkili amir, disiplin amiri, disiplin kurulu, yüksek disiplin kurulu, vali, kaymakam, bağlı veya ilgili bakan, müfettiş, kurum.
3. **Para ve gösterge yok.** §e.
4. **Disiplin.** §f'nin beş kuralı. Yeni fiil–ceza sorusu yalnız 125/E-e'dir.
5. **Varsayılan.** "Cumhurbaşkanı", "yönetmelik", "il → vali", "ilçe → kaymakam", "atamaya yetkili amir", "disiplin amirinin teklifi – atamaya yetkili amirin onayı" doğru şık olamaz; doğru şık varsayılanla örtüşüyorsa varsayılan bir çeldiriciye ya da yanlış önermeye bağlanır (p2 #5'te kaymakam yanlış önermededir).
6. **Ters ayırt etme yasağı.** Sezgiyi yanlışa götüren hüküm soru lehinedir.

   | Sezgi | Doğruya götürdüğü yer → karar | Yanlışa götürdüğü yer (lehte) |
   |---|---|---|
   | "Şikâyet edilen amire şikâyet verilmez" | 21/2'nin atlama unsuru → tek başına ölçülmez | — |
   | "Şikâyet en üst makama yapılır" | — | 21/2 (p1 #1) |
   | "Mahkeme bitmeden Devlet ödemez" | — | 13/1 c.2 (p1 #2) |
   | "Devlet sorumluya rücu eder" | 13/2 → yalnız önerme | — |
   | "Yükümlülük ölümle biter" | — | md 16 (p1 #3) |
   | "Çalışmayana aylık ödenmez"; "görevle ilgisiz suç memuriyeti etkilemez" | — | 141/1 (p2 #1) |
   | "Geçici görevlendirme en çok altı ay"; "boş kadro şart" (bankayı bilen eksik aday) | — | Ek 8 (p2 #2) |
   | "Emri yapmamak orta ağırlıkta bir cezadır" | — | 125/E-e (p2 #3) |
   | "Olağanüstü durumda en ağır ceza" | 125/E-e → kör çözücü ölçer | — |
   | "Zamanaşımı dolduysa ceza verilemez" | — | 127 son fıkra (p2 #4) |
   | "İlçede kaymakam yetkilidir" | 122 başarı belgesi → doğru önerme | 122 ödül (p2 #5) |
   | "Şartı kaybeden memur kalamaz" | 98/b → yedek | — |
   | "Menfaat sağlamak yasaktır" | md 29–30 → tek başına yazılmaz | — |
7. **Koşul → kural** (partinin en az 1/4'ü; bu turda 8 yuvanın 6'sı). Kök tek koşulu sabitler: tutukluluk (141), yurt dışı + güvenlik görevlisi (Ek 8), afet (125/E-e), iptal + dolmuş süre (127), zimmet (13), amir hakkında şikâyet (21).
8. **Vaka.** 1–2 cümle, en çok 250 karakter; partide en çok bir; unvanlı, adsız. Polis vakası yalnız p2 #1'de (ve istenirse #2'de "güvenlik görevlisi" olarak). Disiplin sorularında "memur".
9. **Liste soruları.** "Aranmaz" ve "sayılmamıştır" yalnız kapalı listede: Ek 8 (a)–(f) kapalıdır. md 122'deki katkı alanları ("kamu kaynağında tasarruf, kamu zararının önlenmesi …") uzun ve açık uçludur; liste sorusu yapılmaz.
10. **Çakışma ve mükerrer.** §2'deki sızıntı tablosu ve §6. Dolu bankada aday **çeldiricileriyle birlikte** taranır: dört çeldiricinin dördü de bankadaki soruların cevabıysa soru elemeyle çözülür (p2 #3'te dört çeldiricinin üçü bankadaki cevaplardır; D-n ölçülmemiştir, risk orta). Bankadaki bir kökün adayın tek ölçtüğü açıyı yazıp yazmadığı ayrıca taranır.
11. **Biçim.** Kök "657 sayılı Kanun'a göre,"; madde numarası yok. Önerme sorusunda tırnaklı resmî başlık. Kanunun kendi mutlak ifadesi doğru şıkta durabilir: "hiçbir surette" (97/D), "cezai takibat sonucu beklenmeden" (13), "mirasçılarına da şamildir" (16; "mirasçılarını da kapsar" diye sadeleştirilir).
12. **Dil.**

    | Metindeki ifade | Kök ve şıkta | Kural |
    |---|---|---|
    | görevden uzaklaştırma; ihtiyati tedbir; Devlet memurluğundan çıkarma; kademe ilerlemesinin durdurulması; aylıktan kesme; asli memur; aday memur; atamaya yetkili amir; disiplin amiri; silsile yolu | korunur | terimdir |
    | "tecziye edilenler" | "cezalandırılanlar" | — |
    | "maiyetindeki memur" | korunur ya da "emrindeki memur" | "astı" yazılmaz (7068 terimi) |
    | "mezuniyetsiz" | "izinsiz" | — |
    | "şamildir" | "kapsar" | — |
    | "tevdi" · "hususi" · "müstahak" · "mütalaa" | "teslim" · "özel" · "hak kazanmış" · "görüş" | "mütalaası alınır" → "görüşü alınır" |
    | "tutuklanan veya gözaltına alınan" | korunur | "yakalanan", "hüküm giyen" yazılmaz |
    | "herhangi bir suçtan" | korunur | "kasıtlı suçtan" yazılmaz (şart eklenmiş olur) |
    | "tesis edilebilir", "verilebilir" | korunur | zorunluluğa çevrilmez |
    | "üçte ikisi" | yazıyla | "2/3" yazılmaz (bankadaki şıkların yankısı) |
    | "güvenlik görevlileri" (Ek 8) | korunur | "özel güvenlik görevlisi" YASAK (5188 kavramı) |

### Gözcü kontrol listesi

1. **Kör çözüm.** Doğru şık bir varsayılanla mı bulunuyor (Cumhurbaşkanı, yönetmelik, vali, atamaya yetkili amir, altı ay, bir yıl, üç yıl)? §8 kural 6'daki "doğruya götüren" sezgilerden biriyle mi? Kök cevabı çağırıyor mu ("afet" → "en ağır"; "güvenlik görevlisi" → "istisna"; "zimmet" → "Hazine")?
2. **Ters ayırt etme.** Bankayı (Ek 8'in genel kuralı, 2/3, itirazın mercii, D-n) bilen eksik aday yanılıyor, hiç bilmeyen buluyor mu? Taze kör çözücü madde bilgisi olmadan buluyorsa RED.
3. **Mükerrer ve çakışma.** `657-mevcut-sorular.txt` (223), `657-diger-konu-sorulari.txt` (özellikle İdare başlığındaki 31 soru), `7068-mevcut-sorular.txt`. Yeni soru §2 sızıntı tablosundaki bir kökle ya da şıkla çözülüyor mu? Dört çeldiricinin dördü de bankadaki cevap mı?
4. **Güncellik ve ad.** Doğru şık, çeldirici ya da açıklama şunlardan birine dayanıyor mu: 48/A-8; Devlet Personel Başkanlığı ve §d-2'deki öbür adlar; sicil; md 57; md 104'ün ya da md 56'nın eski metni; md 61/A'nın 2025 öncesi hâli; gösterge, katsayı, TL, "%200"?
5. **7068 karışması.** Şıkta ya da açıklamada 7068'e özgü ceza, değer ya da merci var mı? Disiplin sorusunda polis vakası kurulmuş mu? Açıklama 7068'in farklı değerini içerikle yazıyor mu? Hepsi RED.
6. **İki okumalı.** §6'daki unsurlardan biri (142 ↔ 143/a; 144; 11/4; 25; 86/4; 127'de hesap; Ek 8'de aylık ve son fıkra; 141'de gözaltı; 98/b) doğru şıkta, çeldiricide ya da açıklamada mı?
7. **Sayılar.** Eşdeğer şık ("otuz gün" ↔ "bir ay"; "yedi gün" ↔ "bir hafta") var mı? Süre sorusunda ✱ kilidi, tek birim, artan sıra var mı? Ek 8 sorusunda "uzatma dahil" sorulmuş mu (RED: md 78 vakasıyla karışır)?
8. **Şık takımı.** "Vali" ile "mülki amir", "atamaya yetkili amir" ile "bakan" aynı takımda mı? İki şık birbirinin tersi mi ("beklenmeden" ↔ "kesinleşince")? 2×2 ızgara + 1 var mı? YANLIŞTIR'da doğru önermeler sıra oluşturuyor mu (başarı belgesi → üstün başarı → ödül sırası p2 #5'te risklidir: önermeler ayrı unsurlar ölçmeli)? "Doğrudur" sorusunda doğru önerme takımın zararsız usul cümlesi mi?
9. **Sınav değeri.**
   - `sinavDegeri` en çok 2: yönetmelik mercii; Cumhurbaşkanı kararı; mali ve sosyal hüküm; derece, kademe, intibak; askerlik ve yurt dışı eğitim; alım usulü (46–52); özlük dosyası içeriği; istisnai memurluk sayımı; §6'daki RED emsalleri.
   - RED: md 125/A–D'den yeni fiil–ceza sorusu; başlık eşleme; md 36 sayımı; md 56; görevden uzaklaştırmanın bankadaki süre ve mercileri.
10. **Parti oranları.** Koşul→kural en az 1/4; olumsuz kök en çok 1/4 (p1 tek başına 1/3: iki parti birlikte değerlendirilir, §7); öncüllü, boşluk, "doğrudur" ve vaka en çok birer tane; doğru harfler dengeli; uydurma değer partide en çok bir. Tavanlar: p1 en çok 4 (önerilen 3), p2 en çok 5 (önerilen 4), p3 en çok 1 (önerilen 0).

---

## Şüpheli metin noktaları (soru konusu olmaz; kullanıcıya bildirilir)

**Banka metni**
1. **md 59:** "Anayasa Mahkemesi Basın Müşavirliğine," ibaresi banka metninde yok; resmî metinde var (6216 sayılı Kanun md 75; dipnot [132]). Tek içerik farkı budur. Madde tazelenmeli.
2. **md 61 sonu:** bankada düz metin "(2)" kalmış; resmî metinde üst simge. Karşılık dipnot bulunamadı.
3. Bankada (I)–(IV) sayılı cetveller ve 59 "Ek Geçici Madde" yok. Soru konusu olmadıkları için eksiklik sayılmaz; yalnız bilgi.

**Resmî metnin kendi tutarsızlıkları (bankaya aynen geçmiş)**
4. md 147/Ç "ödül"ü "Kanunun 123 üncü maddesinde yazılı hallerde" diye tanımlar; md 123 mülgadır, ödül md 122'dedir.
5. md 233 "124, 136 ncı maddelerindeki" der (124–136 kastediliyor); md 136 mülgadır.
6. md 239 "Bu Kanun hükümlerini Bakanlar Kurulu yürütür."
7. md 131/3 sorgu hâkimliği, Memurin Muhakematı, "meni muhakeme" ve 160 sayılı Kanuna atıf taşır.
8. md 36/VII'de "başkomiser emniyet müfettişi" (virgül eksik) ve "komiser muavini"; md 15'te "yetkili, kıldığı personel dışın da".
9. md 7 ve md 28 virgülle biter.
10. md 86/4: iptal edilen ibareden sonra "Aynı kurumdan (…) ayrılmalar dolayısiyle" cümlesinin kapsamı belirsiz.
11. md 142 ile md 143/a aynı durumu iki farklı ana bağlıyor; md 144'ün atfı okunaksız.
12. **md 56, 57 ve 127 (7573):** değişikliğin RG metni okunamadı. Ayrıca resmî korpusta 2021, 2023 ve 2024 tarihli üç soru ([P236], [P246], [P247]) md 56'yı bugünkü, yani 2026 metniyle soruyor. Korpus bankadan dışa aktarıldığı için kökler tazeleme turunda güncellenmiş olabilir; **doğrulanamadı**. Soru üretimini etkilemez, ama "resmî sınav sorusu" etiketi taşıyan bir kökün sonradan değiştirilmiş olması kayıt altında tutulmalı.

**Bankadaki sorular**
13. 222. soru (etiketsiz): kök kopuk ("Kanun'a göre bu kişiler kaç yıl süreyle Devlet memuru olarak istihdam edilemez?"). Özgün kök [P251]'den tamamlanmalı ya da soru çekilmeli; aynı bilgi 94. soruda zaten var.
14. İdare Hukuku başlığındaki "Bakanlık teşkilatı ile ilgili aşağıdakilerden hangisi doğrudur?" sorusu (anahtar: bakan müşavirlerinin sayısı on beşi geçemez): md 61/A'nın bugünkü metninde sayı sınırı yok. Dayanağı ayrıca doğrulanmalı.
15. 99. soru: "en az ilkokul mezunu olmak" şıkkını genel şart saymıyor; md 41'in ikinci cümlesi karşısında tartışmalı.
16. 96. soru: Ek 8'in son fıkrası (kurumunca, altı aya kadar görevlendirme) karşısında "resen yapılır, muvafakat aranmaz" önermesinin yanlışlığı yalnız birinci fıkra rejimi için kesin; kök rejimi ayırmıyor.
17. Mükerrer kümeler (§2): kariyer tanımı dört kez; başlık eşleme sekiz kez; md 31 vakası iki kez; radyoaktif ışın izni üç kez.
18. 23 soruda madde etiketi "?"; 25 soru dört şıklı.
