# Doc 36 — PAEM Çıkmış Sorular (Eylül 2026)

Başlangıç: 6 Eylül 2026. **PAEM 10. dönem sınavı ~20 Eylül 2026** — bu takvim
planın her kararını belirliyor.

Amaç iki katmanlı: (1) adaya gerçek çıkmış sınavı çözülebilir, açıklamalı ve
istatistikli biçimde vermek; (2) `"paem çıkmış sorular"` aramasında birinci
olmak. İkinci amaç birincinin yan ürünü — tersi değil.

## 0. Elimizdeki külliyat ve ne olduğu

`~/Documents/PaemÇıkmışSorular/`

| Dosya | Gerçekte ne | Karar |
|---|---|---|
| `Paem9.pdf` (36 s.) | Resmî kitapçık, 2025, **A ve B grubu yan yana** (1-18 A, 19-36 B), 100 soru, **her grubun son sayfasında cevap anahtarı**, metin katmanı temiz | Bankaya girer |
| `paem8.pdf` (17 s.) | Resmî kitapçık, 2024 | Bankada zaten var (100 soru, etiketli) |
| `Paem 7 - Cevaplar.pdf` | Aday hatırlatması, 100 satır: sıra + ders + doğru cevabın özeti | Konu analizi + soru türetme |
| `PAEM 7.pdf` (20 s.) | Aynı sınavın ham hatırlatması, 98 satır (4-20 boş) | Yedek/çapraz kontrol |
| `paem6.pdf` (6 s.) | Aday hatırlatması, 108 satır, ders/kanun etiketli, 4 satır "hatırlamıyorum" | Yalnız konu analizi |
| `PAEM-5Benzeri(50 Tane).pdf` | **Sınav değil**: M. Anıl ve S. Yıldırım imzalı, "PAEM-5'e benzer" diye yazılmış 50 soru | **Kapsam dışı** (kullanıcı kararı) |

PAEM 5 neden çıktı: telif bir yana, bu dosya PAEM 5'te *ne çıktığının kaydı
değil*, birinin ne çıkabileceğine dair tahmini. Konu analizi bile yapılamaz.

### PAEM 9'da iptal edilen üç soru

Cevap anahtarında `iD`, `iE`, `iA` biçiminde işaretli: **A grubu 88-89-90**,
**B grubu 85-86-87** (aynı sorular, farklı sıra). Bankaya girerler ama `iptal`
rozetiyle ve puanlamaya katılmadan. Geçerli soru sayısı **97**.

## 1. Dürüstlük çerçevesi (bağlayıcı)

Aday hatırlatmasından türetilen soru **çıkmış soru değildir**. Bankanın varlık
nedeni "gerçek, kaynaklı çıkmış soru" güveni; bu güveni SEO için harcamayız.
Google'ın *helpful content* tarafı da "başlıkta vaat, içerikte başka şey"
kalıbını cezalandırıyor — yani dürüstlük burada ahlakla SEO'nun aynı yere
baktığı ender durumlardan biri.

Uygulanışı — her dönemin **rozeti** liste ekranında da, sayfanın kendisinde de
görünür, alt yazıya gizlenmez:

| Dönem | Rozet | İçerik |
|---|---|---|
| PAEM 9 (2025) | **Çıkmış sınav** | 100 soru + resmî cevap anahtarı |
| PAEM 8 (2024) | **Çıkmış sınav** | 100 soru (bankada) |
| PAEM 7 (2022) | **Konu analizi + benzer sorular** | Dağılım tablosu + türetilmiş sorular |
| PAEM 6 | **Konu analizi + benzer sorular** | Dağılım tablosu + türetilmiş sorular |

## 2. PDF yayınlamıyoruz — gerekçe

Public sayfada PDF **yok**. Dört gerekçe:

1. Google PDF'i indeksler ama HTML'in belirgin gerisinde sıralar; iç bağlantı,
   hız ve mobil okunabilirlik yok.
2. PDF indiren geri gelmez. SEO'dan beklentimiz ziyaretçiyi uygulamaya sokmak.
3. PDF rakiplerde ve Telegram gruplarında **zaten var**. Onların sahip olduğu
   şeyi vererek onları geçemeyiz.
4. Dağıtımı kontrol edilemez.

Farkımız: **çözülebilir + açıklamalı + istatistikli**. İstisna: giriş yapmış
kullanıcıya pazarlama amaçlı PDF verilebilir, public sayfada değil.

## 3. Veri modeli

**Katman 1 — banka.** Sorular normal `Question`/`QuestionVersion`, konu ağacına
oturur, `sourceLabel = "2025 PAEM 9. Dönem Yazılı Sınavı"`. Bedava getirisi:
çıkmış sorular alıştırmada, koçta, yanlış defterinde, madde atlasında da çalışır.

**Katman 2 — sınav kimliği.** Yeni:

```prisma
model PastExam         { slug, ad, kurum, donem, tarih, tur (resmi|analiz), status }
model PastExamQuestion { pastExamId, questionId, siraNo, iptal, herkeseAcik }
```

`Exam` modeli kullanılmadı: o canlı/zamanlı deneme için (`startAt`,
`liveAnswerReveal`, oturumlar) ve çıkmış sınavı deneme listesine karıştırır.
Ama **her çıkmış sınav için ayrıca bir `Exam` kaydı üretilir** → "sınav gibi
çöz, süre tut, net hesapla" mevcut motordan bedavaya gelir.

`herkeseAcik`: dönem başına **20 soru** (kullanıcı kararı), **ders dağılımına
orantılı** seçilir — hem dürüst örneklem hem de "paem 9 tck soruları" gibi uzun
kuyruk aramalarını yakalar.

## 4. Yüzeyler

| Yüzey | İçerik |
|---|---|
| `/paem-cikmis-sorular` | Vitrin: 4 dönem, rozetler, dağılım özetleri |
| `/paem-cikmis-sorular/paem-9-2025` | 20 soru **HTML olarak basılı** + tam konu analizi + CTA |
| `/paem-cikmis-sorular/paem-7-2022` | Konu analizi tablosu + türetilmiş sorulardan 20'si |
| Uygulama (web + mobil) | "Çıkmış Sınavlar" → *Sınav modu* (süreli, net) / *Çalışma modu* (açıklamalı) |

Public sayfada cevap `<details>` içinde açılır: JS gerekmez, Google içeriği
görür, kullanıcı önce düşünür. Yapısal veri (`Quiz`/`FAQPage`) 2023'ten beri
zengin sonuç vermiyor — emek harcanmaz; içerik, iç bağlantı ve hız kazandırır.

## 5. Denetim rolü değişti — ve asıl değer burada

Resmî anahtar elimizde olduğu için denetçiler cevabı **belirlemiyor, doğruluyor**.
Ucuzladı ve güçlendi. Kıymetli çıktı şurada: PAEM 9 **2025** sınavı. İki kör
denetçi resmî anahtarla ayrışıyorsa iki ihtimal var — ya biz yanılıyoruz, ya da
**2026'da mevzuat değişti ve resmî cevap eskidi**. Doc 34'ün `ESKIMIS` kararı
tam bunun için.

Sayfada şunu yazabilmek hiçbir PDF'in yapamayacağı şeydir:
*"Bu sorunun sınavdaki resmî cevabı D idi; 7590 sayılı Kanun'la değişen hüküm
nedeniyle bugünkü doğru cevap B'dir."*

## 6. Ayrıştırma

`Paem9.pdf` metin katmanı temiz — **OCR yok** (Doc 34'ten kolay). İki sütun
`pdftotext -layout` ile x-kırpması yapılarak ayrılır (A4 595pt, sınır 300pt):
sol sütun, sonra sağ sütun → doğrusal soru akışı. Sütun içi fazla boşluklar
normalize edilir.

**Bedava denetim katmanı — A/B çapraz doğrulama:** aynı soru iki kitapçıkta
farklı sırada ve iki ayrı anahtar satırıyla var. Kök+şık kümesi eşleşen A ve B
sorularının anahtar harfleri aynı şıkkı göstermiyorsa ayrıştırmada hata vardır.
Ayrıştırıcı bunu HATA olarak verir, sessiz geçmez.

## 7. Takvim (sınava 2 hafta)

| Gün | İş |
|---|---|
| 1-2 | PAEM 9 ayrıştırma + anahtar eşleme + A/B çapraz doğrulama + mükerrer tarama |
| 2-4 | Kör doğrulama + açıklama üretimi + eskime taraması |
| 3-5 | `PastExam` modeli, admin ekranı, public sayfalar, uygulama sekmesi |
| 5-7 | PAEM 7 ve 6 konu analizi + türetilmiş sorular |
| 8+ | PAEM 8'i vitrine bağlama, sitemap, iç bağlantılar |

**PAEM 10 hazırlığı:** sınavın akşamı `"paem 10 çıkmış sorular"` diye arayacak
binlerce kişi olacak ve ortada hiçbir şey olmayacak. Şablon önceden hazırsa o
akşam konu analizi yayınlanır. İşin en yüksek getirili tek parçası, ama ancak
altyapı önceden kurulursa mümkün.

## 7.1 Yapılanlar (6 Eyl 2026)

| Katman | Durum |
|---|---|
| PAEM 9 ayrıştırma + kör denetim + açıklama | ✅ 100 soru `in_review` |
| PAEM 8 vitrine bağlama | ✅ 100 soru, 47 eksik açıklama üretildi (`in_review`) |
| PAEM 7 · PAEM 6 konu analizi | ✅ yayında |
| `PastExam` / `PastExamQuestion` + admin API | ✅ |
| Panel: Çıkmış Sınavlar listesi + dönem detayı | ✅ |
| Public uç + vitrin + dönem sayfaları | ✅ |
| Deneme motoruna bağlama ("sınav gibi çöz") | ✅ PAEM 8 |
| Sitemap + iç bağlantı (üst menü, footer, PAEM rehberi, komut paleti) | ✅ |
| PAEM 10 hazırlığı | ✅ `PAEM10-GECESI.md`, URL ayrıldı |

**Bekleyen tek şey kullanıcı onayı:** PAEM 9'un 100 sorusu ve PAEM 8'in 47
açıklaması onay kuyruğunda. Onaylanınca `cikmis-vitrin-sec.ts` yeniden
çalıştırılır (vitrin açıklamalı soruları tercih eder) ve PAEM 9
`cikmis-sinav-motora-bagla.ts` ile motora bağlanır.

### Zamanla eskiyen soru sınıfı

PAEM 8'in 94. sorusu (Alper Gezeravcı'nın rütbesi) **bugün cevapsız**: 30
Ağustos 2026'da tuğgeneral oldu, hiçbir şık doğru değil. Kişinin güncel
rütbesini/unvanını soran sorular bu sınıfa girer ve düzenli taranmalı.
CMK md 134'e dayanan PAEM 9 s.20 ise **25 Şubat 2027'de** eskiyecek (AYM
iptali o gün yürürlüğe giriyor).

## 8. Kural istisnası

CLAUDE.md'deki "kaynak etiketi son kullanıcıya gösterilmez" kuralı (4 Eyl 2026)
sorunun alındığı **kitabı** korumak içindi. Resmî yayımlanmış bir sınavın adı
kamuya açıktır ve bu üründe kimliğin kendisidir. Kullanıcı onayıyla istisna
CLAUDE.md'ye yazıldı.
