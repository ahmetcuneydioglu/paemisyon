# Transkript Talimatı — Doc 42, KPSS 2025 Kamu Yönetimi (taranmış)

Kaynak, 2025 KPSS A Grubu **Kamu Yönetimi** alan sınavının çıkmış soruları
(ÖSYM). Sayfalar bir uygulamadan telefonla çekilmiş görüntülerdir; PDF'te
**metin katmanı yoktur**. Senin işin verilen görüntüleri okuyup soruları
**birebir** yazıya dökmek.

Sınavın 40 sorusunun tamamı değil, müfredatımıza giren **22 tanesi** seçildi.
Sana yalnız onların görüntüleri veriliyor.

**KİMLİK DOSYA ADIDIR.** `q08.png` → `q8`, `q40.png` → `q40`. Bu numara
sayfadaki basılı "Soru No" ile aynıdır.

**Sayfanın altındaki "Cevap Anahtarı" satırı görüntüye DAHİL DEĞİL** (kırpıldı).
Bir şekilde görürsen de çıktına yazma; anahtar ayrıca çıkarıldı ve denetçiler
soruyu kör çözecek.

## 0. MUTLAK KURALLAR

1. **Sen soru YAZMIYORSUN, KOPYALIYORSUN.** Görüntüde ne yazıyorsa o. Cümleyi
   düzeltme, kısaltma, sadeleştirme, "daha doğrusu şu olmalı" deme.
2. Okuyamadığın bir yer varsa **uydurma**: o soruyu `okunamadi: true` ile
   işaretle ve ne göremediğini yaz. Eksik bir soruyu atlamak, yanlış
   kopyalanmış bir soruyu bankaya sokmaktan sonsuz kez iyidir.
3. Cevabı bulmak senin işin değil. Soruyu çözme, metni çıkar.
4. Veritabanına dokunma.

## 1. Bu kaynağın kendine özgü tuzakları

- **ÖSYM filigranı.** Her sayfanın ortasında soluk turuncu bir daire ve "ÖSYM"
  yazısı var; bu filigran metnin üstüne biniyor ve bazı harfleri kapatıyor.
  Filigranın altında kalan kelimeyi **tahmin etme** — bağlamdan çıkarabiliyorsan
  yaz ama emin değilsen `okunamadi: true`. Filigranın kendisi ("ÖSYM") soru
  metni DEĞİLDİR, çıktıya yazma.
- **Üstteki turuncu şerit** ("← Soru No: 8") uygulamanın başlığıdır, soru metni
  değildir.
- **Şapkalı harfler.** Bu kaynakta `hükûmet`, `Millî`, `kâr`, `imkân`, `dâhil`,
  `âyan`, `malî`, `Askerî` gibi düzeltme işaretli yazımlar var ve ÖSYM bunları
  tutarlı kullanıyor. Gördüğünü aynen yaz; kendiliğinden `hükümet`/`Milli`
  yazma. Şapkanın olup olmadığından emin değilsen `not` alanına yaz.
- **Roma rakamlı öncüller.** Bazı sorularda `I. … II. … III.` listesi ve
  `A) Yalnız I`, `D) II ve III` gibi şıklar var. Bir rakam hatası soruyu
  sessizce çözülemez yapar. Her roma rakamını iki kez oku.
- **Beş şık.** Bu sınavın her sorusu beş şıklıdır (A–E). Dört şık görüyorsan
  beşincisi kırpılmış olabilir — dördünü yazıp geçme, `okunamadi: true` yaz.
- **Kanun adları ve numaraları** (`6216 sayılı…`, `5393 sayılı…`) birebir
  aktarılır; numarayı iki kez oku.
- **Uzun şıklar iki satıra sarabilir.** Şıkkın tamamını tek metin olarak yaz,
  satır sonunu boşlukla birleştir.

## 2. Çıktı

```json
[{"id":"q8",
  "kok":"…\n…",
  "siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
  "okunamadi":false,
  "not":null}]
```

`kok` içinde satır sonları korunur (öncül listeleri okunabilir kalsın).
Şık metinleri tek satırdır.

## 3. Son cevabın

SADECE: dosya yolu · transkribe edilen soru sayısı · `okunamadi` sayısı.
Soru metinlerini TEKRARLAMA.
