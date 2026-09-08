# Doc 38 — AÖF Ara Sınavı Partisi (9 Eyl 2026)

Kaynak: Anadolu Üniversitesi Açıköğretim, **Atatürk İlkeleri ve İnkılap
Tarihi-II**, 2024-2025 Bahar ara sınavı, A kitapçığı (60 soru, 10 sayfa).

Kullanıcı isteği: yalnız belirttiği **27 soru** alınacak (1, 2, 3, 4, 6, 7, 9,
10, 14, 18, 19, 23, 24, 29, 30, 31, 32, 33, 38, 40, 41, 45, 46, 49, 51, 52, 54)
ve denetimden **sorunsuz geçerse onay kuyruğuna değil DOĞRUDAN YAYINA** alınacak.

## 0. Doğrudan yayın — kuralın bilinçli istisnası

Kod tabanında açık bir kural var: içe aktarılan soru asla doğrudan yayına
çıkmaz, onay kuyruğuna düşer (`admin-questions.service.ts:450`). Bu turda
kullanıcının açık talimatıyla istisna yapıldı.

"Sorunsuz" DAR yorumlandı: **yalnız `ONAY`** — üç denetçi de anahtarla aynı
şıkta, hiç uyarı yok, hiç düşük güven yok. `ONAY-HAKEM` dahil geri kalan her
şey onay kuyruğuna gitti.

Eşiği karşılamak için hat üç yerden sıkıldı:

1. **İki değil ÜÇ denetçi.** `ogm-denetim-birlestir.ts`e üçüncü denetçi
   desteği eklendi; oybirliği aranır, bir kişinin ayrışması soruyu durdurur.
2. **Denetçilere eşik söylendi.** Talimatta "bu sorular insan gözünden
   geçmeyecek, `uyari` alanın son savunma hattı; 'muhtemelen sorun değil' diye
   geçme" yazıyor.
3. **Düzeltilmiş soru yayına çıkmadı.** Kaynağın metnini değiştirdiğim soru
   "denetimden sorunsuz geçti" sayılmaz; hepsi onay kuyruğuna gitti.

## 1. Kaynak — taranmış, ama iki anahtar kaynağı var

On sayfanın hepsi görüntü, metin katmanı yok → Doc 37 §7.2'deki transkript
hattı. İki bağımsız ajan, iki yarı: **27/27 birebir aynı.**

Anahtar için iki aday vardı:
- **10. sayfadaki resmî "A Grubu Cevap Anahtarı" tablosu** (60 soru),
- **sayfalardaki renkli işaretlemeler** (doğru şıkkın harfi vurgulu).

İlk yedi soruda ikisi uyuştuğu için işaretlemeler "ikinci bağımsız kaynak"
sanıldı. **Yanlıştı:** 49. soruda tablo B (Sümerbank), işaretleme D (Etibank)
diyor. Birinci Beş Yıllık Sanayi Planı'nı uygulama görevi Sümerbank'a
verilmiştir; tablo doğru, işaretleme yanlış. Yani işaretlemeler anahtar değil,
birinin kendi cevapları.

Veriye zarar gelmedi — baştan resmî tablo kullanıldı ve üç denetçi de s49 için
bağımsız olarak B dedi. Ama "iki kaynak uyuşuyor" ifadesi birkaç örnekten
genellenmiş bir varsayımdı; ders: **örneklem uyuşması kaynak doğrulaması
değildir.**

## 2. Denetim: cevaplar sağlam, sorular kusurlu

| | Soru |
|---|--:|
| `ONAY` | 8 |
| `UYARI` | 19 |
| `ANAHTAR-SUPHELI` / `CELISKI` | **0** |

Üç denetçi de 27 sorunun 27'sinde resmî anahtarla aynı şıkta. Uyarı oranının
yüksekliği (%70) kısmen talimatın eseri — denetçilere "en ufak tereddüdünü yaz"
dendi. Bu turun uyarı sayısı önceki turlarla **kıyaslanabilir değil.**

## 3. Hakem: 18 temiz, 1 kusurlu

İki hakem tam mutabık ve **dokuz soruda birebir aynı düzeltmeyi** önerdi —
bağımsız iki hakemin aynı kelimeyi aynı şekilde düzeltmesi, düzeltmelerin
keyfi olmadığının göstergesi.

### 3.1 Uygulanan 8 düzeltme

| Soru | Ne değişti |
|---|---|
| s7 | Maarif Kongresi "15-22 Temmuz" → "15-21 Temmuz 1921" |
| s14 | Emrin tarihi "30 Ağustos" → "1 Eylül 1922" |
| s19 | "Maden **Teknik** Arama" → "Maden **Tetkik ve** Arama Enstitüsü" |
| s29 | Emrin tarihi "30 Ağustos" → "1 Eylül 1922" |
| s33 | "başalatılan" → "başlatılan" |
| s40 | "kaynaklarını **bulmak ve bunları** işletmek" → "kaynaklarını işletmek" |
| s45 | Alıntı → "Ben size **taarruzu emretmiyorum**, ölmeyi emrediyorum." |
| s54 | "ünvanı" → "unvanı" |

`ogm-duzeltme-uygula.ts` her düzeltmeyi eski/yeni hâliyle `duzeltme-kaydi.json`
dosyasına yazar ve aranan metni bulamazsa **durur** — kaynağın metnini
değiştirmek iz bırakmadan yapılmamalı, "bulamadım, geçtim" sessiz bir kusurdur.

s40'ınki en esaslısı: "bulmak" MTA'nın görevi, Etibank bulunanı işletmek için
kuruldu; kök o hâliyle aynı sınavın 19. sorusuyla (MTA) çakışıyordu.

### 3.2 s30 elendi — düzeltilemez

Kaynakta A) "430 Sayılı Öğretim Birliği Kanunu" ve B) "Tevhid-i Tedrisat
Kanunu" — **aynı kanun.** Üç denetçi de bağımsız yakaladı, kaynak görüntüsünden
doğrulandı. Hakemler A'yı başka bir kanunla değiştirmeyi önerdi; bu düzeltme
değil soruyu yeniden yazmak olurdu, kaynakta ne olduğunu bilemeyiz.

## 4. Sonuç

| | Soru |
|---|--:|
| İstenen | 27 |
| **Doğrudan YAYINA** | **8** (s1 s3 s4 s6 s9 s10 s38 s49) |
| Onay kuyruğuna | 18 (8'i düzeltilmiş) |
| Elendi | 1 (s30) |

Yayına çıkan sürümler `Question.currentVersionId` ile bağlandı — panelin
onaylama akışıyla aynı adım. Bu atlanırsa soru "yayında" görünür ama uygulamada
çıkmaz.

Kaynak etiketi: "Anadolu Üniversitesi Açıköğretim — Atatürk İlkeleri ve İnkılap
Tarihi-II, 2024-2025 Bahar ara sınavı (A)". Son kullanıcıya gösterilmez.
