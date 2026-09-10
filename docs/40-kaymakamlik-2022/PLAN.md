# Doc 40 — 2022 Kaymakamlık Sınavı Partisi

Kaynak: "Kaymakamlık 2022 Çıkmış Tüm Sorular" (100 sayfa, her sayfada tek soru,
altında cevap anahtarı). Taranmış görüntü; metin katmanı yok.

Kullanıcı isteği: yalnız bizim derslerimizdeki sorular alınacak (Anayasa, TCK,
CMK, İnkılap Tarihi, Genel Kültür, İdare Hukuku, Polis Mevzuatı) ve **sınav
2022'de yapıldığı için güncel mevzuata göre değerlendirilecek**.

## 0. Ayıklama — 100 soruda 62'si bizim

Dört tarama ajanı 100 soruyu sınıflandırdı. Kaymakamlık sınavı bizim
programımızdan geniş: maliye, iktisat, uluslararası ilişkiler, Türkçe de var.

| Ders | Soru |
|---|--:|
| İdare Hukuku | 42 |
| Anayasa Hukuku | 14 |
| Atatürk İlkeleri ve İnkılap Tarihi | 5 |
| Polis Mevzuatı | 1 |
| *Dışarıda* | 31 |
| *Belirsiz* | 7 |

TCK, CMK ve Genel Kültür'den soru çıkmadı — Kaymakamlık sınavının ağırlığı
idare hukukunda.

Tarama ajanlarına konan kural işe yaradı: **emin değilsen `disarida` deme,
`belirsiz` de.** Belirsizlerin ikisi ayrı sebeptendi — TÜİK istatistik bloğu
(verisi zaten eskimiş) ve bir İnsan Hakları bloğu (kullanıcının saydığı yedi
başlıkta yok ama bankada gerçek bir ders). İkisi de alınmadı.

### Sayfa numarası ≠ soru numarası

İki tarama ajanı bağımsız olarak yakaladı: PDF'in 67. sayfasında ikinci bir
kitapçık başlıyor ve basılı "Soru No" 1'den yeniden sayıyor. Kimlikler bu
yüzden **sayfa numarası** üzerinden kuruldu (`p34`), basılı numara üzerinden
değil. Cevap anahtarı şeritleri de sayfa numarasıyla damgalandı.

## 1. Transkript — 62/62 birebir

Doc 37 §7.2'deki hat: her grup için iki bağımsız transkript + bir uzlaştırıcı.
Uzlaştırıcı ayrışan yerde **kaynak sayfaya bakıp** karar verdi.

- İki okuma içerik olarak 62/62 aynı.
- Uzlaştırıcıların bildirdiği 35 "ayrışmanın" tamamı tipografik tırnak/kesme
  farkıydı; karşılaştırma aracı bunları bilerek normalize ediyor.
- Kanonik metnin ham okumalarla birebir aynı olduğu ayrıca doğrulandı —
  uzlaştırıcılar metne "iyileştirme" yapmamış.

## 2. Cevap anahtarı — ÜÇ bağımsız kaynak

| Kaynak | Sonuç |
|---|---|
| İki özel anahtar okuyucusu | 62/62 aynı |
| Dört tarama ajanının kaydı | 0 fark |
| Gözle okunan ilk 10 sayfa | 10/10 |

Doc 38'de "iki kaynak uyuşuyor" varsayımı yanlış çıkmıştı (birkaç örnekten
genellenmişti); burada gerçekten üç bağımsız kaynak var ve hepsi tutuyor.

## 3. Denetim — asıl iş güncellikti

62 soru dört partide **üçer bağımsız denetçiden** geçti. `DENETCI-TALIMATI.md`
Doc 34'ün eskime eksenini geri açıyor: her mevzuat sorusunda "bu hüküm 2026'da
da böyle mi" sorusu ve mevzuat.gov.tr'nin güncel konsolide metninden doğrulama.

46 soru mevzuata bağlıydı. **Beşinde mevzuat 2022'den bu yana değişmiş:**

| Soru | Değişiklik | Etki |
|---|---|---|
| p43 | 1 s. CBK md 254/1-(f) AYM'nin 26/10/2023 kararıyla iptal | soru **iki doğru cevaplı** oldu → elendi |
| p35 | Kaymakam adaylığı md 274/A AYM'nin 5/4/2023 kararıyla iptal | cevap kayıyor, denetçiler ayrıştı → elendi |
| p6 | Kararname adı 194 s. CBK ile değişti (**19/2/2026**) | metin güncellendi |
| p37 | Kurul adı 183 s. CBK ile değişti (28/3/2025) | metin güncellendi |
| p41 | C şıkkındaki genel müdürlük 153 s. CBK ile lağvedildi (2023) | metne dokunulmadı (aşağıda) |

p6'daki değişiklik denetimden üç hafta önce yayımlanmıştı — denetçilerin
güncel metne gerçekten baktığının kanıtı.

### 3.1 Eskimenin İKİ biçimi var — birleştirici düzeltildi

Eskime dalı yalnız "cevap değişti" durumuna bağlıydı. Oysa p37 ve p41'de cevap
doğru kalıyor ama soru metni bugün var olmayan bir kurumu gösteriyor; bunlar
`ONAY` görünüp bankaya girecekti. `ogm-denetim-birlestir.ts` artık ikisini
ayırıyor:

- `ESKIMIS` — cevabı değiştiren eskime (anahtar güncellenmeli)
- `GUNCELLENECEK` — metni eskiten eskime (cevap doğru, metin güncellenmeli)

İkincisini onay saymak, adaya lağvedilmiş bir genel müdürlüğü şık diye
göstermek demekti.

## 4. Hakem — 9/9 mutabakat

İki hakem 9 uyarılı/eskimeli soruda **aynı kararı** verdi: 7 TEMİZ, 2 KUSURLU
(p35, p43). Altısında birebir aynı düzeltmeyi önerdiler.

### Uygulanan 5 düzeltme

| Soru | Düzeltme |
|---|---|
| p6 | Kararname adı → 194 s. CBK ile değişen yeni adı |
| p37 | "Sosyal Politikalar Kurulu" → "Sosyal ve Gençlik Politikaları Kurulu" |
| p81 | "sar hisarlar" → "sarp hisarlar" (kaynağın dizgi hatası) |
| p96 | "6071 sayılı" → "6701 sayılı" (kaynağın dizgi hatası) |
| p96 | "nesnel bir biçimde" → "nesnel olarak" (kanun metnindeki ifade) |

### Uygulanmayan iki öneri

Hakemler p41'de C şıkkını, p37'de B ve E şıklarını değiştirmeyi de önerdi.
**Uygulanmadı:** şık değiştirmek düzeltme değil, soruyu yeniden yazmaktır
(Doc 38 §s30 kuralı, kullanıcı kararı).

p41 ayrıca kontrol edildi: **olumlu** soru ("hangisinin görevidir") olduğu için
lağvedilmiş genel müdürlüğün çeldirici olarak kalması ikinci doğru cevap
yaratmıyor. p43 ise **olumsuz** soru ("hangisi değildir") ve orada aynı durum
soruyu bozuyor — fark buradan geliyor.

## 5. Konu ataması — 70 konuluk ağaç

Önceki partiler tek konuya gidiyordu; burada sorular dört derse ve kanun bazlı
70 konuya dağılıyor. İki bağımsız sınıflandırıcı **60/60 aynı konuyu** seçti.

Konan kural: **emin değilsen dersin genel konusuna koy.** Yanlış bir alt kanuna
atamak adayı şaşırtır; genel konuda durmak yalnız daha kaba bir sınıflandırma.

Üç soruda tarama dersinden bilinçli sapıldı — 657, 6698 ve 4982 sayılı kanunlar
bankada Polis Mevzuatı dersinin altında duruyor.

## 6. Sonuç

| | Soru |
|---|--:|
| Sınavdaki toplam | 100 |
| Bizim derslerimizde | 62 |
| `ONAY` | 53 |
| `ONAY-HAKEM` | 7 |
| `KUSURLU` (mevzuat değişikliği bozdu) | 2 |
| Bankada zaten vardı | 12 |
| **Bankaya yazıldı (`in_review`)** | **48** |

48'in hepsinde açıklama, 47'sinde künye. Açıklamalar **2026 hukukuna göre**
yazıldı; kurum/kararname adı değişmişse bugünkü ad kullanıldı.

## 7. Yan bulgu — bankadaki 112 Kaymakamlık sorusu taranmamış

Mükerrer taraması bu sınavdan bankada **124 soru** olduğunu ortaya çıkardı
(120 yayında, 25 Ağustos 2026'da içe aktarılmış). Bizim denetimimizle kesişen
yalnız 12; kalan **112 yayındaki soru** güncellik denetiminden geçmemiş.

Bizim taradığımız 62 soruda oran %8'di (5 soru) ve ikisi soruyu bozuyordu.
Aynı oran 112'de yaklaşık 9 soru demek. Ayrı bir iş olarak açıldı.
