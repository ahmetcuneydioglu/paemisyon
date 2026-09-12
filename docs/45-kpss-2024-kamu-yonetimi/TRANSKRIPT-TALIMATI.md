# Transkript Talimatı — Doc 45, KPSS 2024 Kamu Yönetimi (taranmış)

Kaynak, **2024 KPSS A Grubu Kamu Yönetimi** alan sınavının çıkmış sorularıdır (ÖSYM).
Sayfalar bir uygulamadan çekilmiş görüntülerdir; PDF'te **metin katmanı
YOKTUR**. Senin işin verilen görüntüleri okuyup soruları **birebir** yazıya
dökmek.

Sınavın 40 sorusunun tamamı değil, müfredatımıza giren ve bankada henüz
bulunmayan **19 tanesi** seçildi. Sana yalnız onların görüntüleri veriliyor.
Numaralar bu yüzden atlamalı (q9, q10, q12, q13, q20…) — eksik numara hata
değil, kapsam kararıdır.

**KİMLİK DOSYA ADIDIR.** `q09.jpg` → `q9`, `q40.jpg` → `q40`. Bu numara
sayfadaki basılı "Soru No" ile aynıdır.

**Cevap anahtarı satırı görüntüden KIRPILDI.** Bir şekilde görürsen de çıktına
yazma; anahtar ayrıca çıkarıldı ve denetçiler soruyu kör çözecek.

## 0. MUTLAK KURALLAR

1. **Sen soru YAZMIYORSUN, KOPYALIYORSUN.** Görüntüde ne yazıyorsa o. Cümleyi
   düzeltme, kısaltma, sadeleştirme, "daha doğrusu şu olmalı" deme. Kaynakta
   bir kusur varsa o kusur da aynen aktarılır — kusuru bulmak denetçinin işi.
2. Okuyamadığın bir yer varsa **uydurma**: o soruyu `okunamadi: true` ile
   işaretle ve ne göremediğini yaz. Eksik bir soruyu atlamak, yanlış
   kopyalanmış bir soruyu bankaya sokmaktan sonsuz kez iyidir.
3. Cevabı bulmak senin işin değil. Soruyu çözme, metni çıkar.
4. Veritabanına dokunma.

## 1. Bu kaynağın kendine özgü tuzakları

- **ÖSYM filigranı.** Her sayfanın ortasında soluk turuncu bir daire ve "ÖSYM"
  yazısı var; filigran metnin üstüne biniyor ve bazı harfleri kapatıyor.
  Filigranın altında kalan kelimeyi **tahmin etme** — bağlamdan kesin
  çıkarabiliyorsan yaz, emin değilsen `okunamadi: true`. Filigranın kendisi
  ("ÖSYM") soru metni DEĞİLDİR, çıktıya yazma.
- **Şık harfi metnin soluna, ortalanmış olarak basılıyor** (`A )`, `B )`).
  Çok satırlı bir şıkta harf ortadaki satırın hizasında durabilir; bu şıkkın
  başladığı yeri şaşırtır. Şıkkın tamamını tek metin olarak yaz, satır sonunu
  boşlukla birleştir.
- **Şapkalı harfler.** Bu kaynakta `hâlinde`, `hâkim`, `Millî`, `kâr`, `imkân`
  gibi düzeltme işaretli yazımlar var ve ÖSYM bunları tutarlı kullanıyor.
  Gördüğünü aynen yaz; kendiliğinden `halinde`/`hakim` yazma. Şapkanın olup
  olmadığından emin değilsen `not` alanına yaz.
- **Roma rakamlı öncüller.** Bazı sorularda `I. … II. … III.` listesi ve
  `A) Yalnız III`, `D) II ve III` gibi şıklar var. Bir rakam hatası soruyu
  sessizce çözülemez yapar. Her roma rakamını iki kez oku; `II` ile `Il`
  (büyük i + küçük L) karışmasın.
- **Kanun adları ve numaraları** (`4483 sayılı…`, `5393 sayılı…`,
  `233 sayılı…`) birebir aktarılır; numarayı iki kez oku.
- **Bu partide bir soru (q20) eski imlâlı bir kanun metnini alıntılıyor**
  (`Tevsii mezuniyet`, `Teşkilâtı Esasiye kanunu`, `vilâyetler umuru`).
  Bunları BUGÜNKÜ Türkçeye çevirme; kaynakta nasıl basılıysa öyle yaz.
- **Kişi adı geçen şıklar** (q25, q30) tam olarak aktarılır; adı değiştirme.
- **Beş şık.** Bu sınavın her sorusu beş şıklıdır (A–E). Dört şık görüyorsan
  beşincisi kırpılmış olabilir — dördünü yazıp geçme, `okunamadi: true` yaz.
- **Altı çizili vurgular** (`yanlıştır`, `değildir`) düz metin olarak yazılır,
  ama vurgulanan kelimeyi atlama — soru olumsuzsa anlamı o kelime taşır.

## 2. Çıktı

Dosyanı belirtilen yola JSON olarak yaz:

```json
[{"id":"q1",
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
