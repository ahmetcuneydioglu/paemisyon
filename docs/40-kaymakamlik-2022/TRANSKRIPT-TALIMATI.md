# Transkript Talimatı — Doc 39, Kaymakamlık 2022 (taranmış)

Kaynak, 2022 Kaymakamlık sınavı çıkmış soruları. **Her sayfada tek soru** var:
üstte "Soru No", altta "Cevap Anahtarı". Sayfalar taranmış görüntü; metin
katmanı yok. Senin işin bu sayfaları okuyup soruları **birebir** yazıya dökmek.

**Sayfanın altındaki "Cevap Anahtarı" satırını çıktına YAZMA.** Anahtar ayrıca
çıkarıldı ve denetçiler soruyu kör çözecek. Görmen sorun değil, kaydetmen
sorun.

**KİMLİK SAYFA NUMARASIDIR.** PDF'te 67. sayfada ikinci bir kitapçık başlıyor
ve basılı "Soru No" 1'den yeniden sayıyor; bu yüzden basılı numaraya değil
DOSYA ADINDAKİ sayfa numarasına göre kimlik ver: `p-034.png` → `p34`.

## 0. MUTLAK KURALLAR

1. **Sen soru YAZMIYORSUN, KOPYALIYORSUN.** Sayfada ne yazıyorsa o. Cümleyi
   düzeltme, kısaltma, sadeleştirme, "daha doğrusu şu olmalı" deme.
2. Sayfada okuyamadığın bir yer varsa **uydurma**: o soruyu `okunamadi: true`
   ile işaretle ve ne göremediğini yaz. Eksik bir soruyu atlamak, yanlış
   kopyalanmış bir soruyu bankaya sokmaktan sonsuz kez iyidir.
3. **Cevap anahtarını çıktına yazma.** Her sayfanın altında yazıyor; kaydetme.
   Senin işin metni çıkarmak, soruyu çözmek değil.
4. Veritabanına dokunma.

## 1. Dikkat edilecekler

- **Roma rakamları.** Bu sorular `I. … II. … III. … IV.` biçiminde öncüllerle
  dolu ve şıklar da `A) Yalnız I`, `D) II, III ve IV` gibi. Burada bir rakam
  hatası soruyu sessizce çözülemez yapar. Her roma rakamını iki kez oku.
- **Şıklar iki sütuna yayılabilir.** `A) … B) … C) …` bir satırda, `D) … E) …`
  altında olabilir. Beş şıkkın hepsini bul; dördünü bulup "demek dört şıklı"
  deme. Bu bankada soruların hepsi beş şıklıdır — dört şık görüyorsan
  beşincisini kaçırmışsındır, `okunamadi: true` yaz.
- **Tırnak içindeki alıntılar** (Atatürk'ün sözleri) üç nokta ve tırnak
  işaretleriyle birlikte aynen aktarılır.
- **Görsele dayanan soru.** Kök bir haritaya, tabloya, grafiğe atıf yapıyorsa
  (`Haritaya göre;`, `Yukarıdaki tabloya göre`) metni yaz ve
  `gorselGerekli: true` işaretle — o soru ayrıca görselle taşınacak.
- Sayfa üstbilgisi/altbilgisi (tarih, "OGM Materyal", URL, sayfa numarası) ve
  "Okul / Ad Soyad / Sınıf / Numara" satırı soru metni DEĞİLDİR.

## 2. Çıktı

```json
[{"id":"p1",
  "kok":"…\n…",
  "siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
  "gorselGerekli":false,
  "okunamadi":false,
  "not":null}]
```

`kok` içinde satır sonları korunur (öncül listeleri okunabilir kalsın).
`id` = `p<sayfa-no>` (örn. `p-034.png` → `p34`).

## 3. Son cevabın

SADECE: dosya yolu · transkribe edilen soru sayısı · `okunamadi` sayısı ·
`gorselGerekli` sayısı. Soru metinlerini TEKRARLAMA.
