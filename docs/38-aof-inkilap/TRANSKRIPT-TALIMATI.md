# Transkript Talimatı — Doc 38, AÖF ara sınavı (taranmış)

Kaynak, Anadolu Üniversitesi Açıköğretim "Atatürk İlkeleri ve İnkılap
Tarihi-II" 2024-2025 Bahar ara sınavı (A kitapçığı). PDF'in on sayfası da
taranmış görüntü; metin katmanı yok. Senin işin bu sayfaları okuyup soruları
**birebir** yazıya dökmek.

**Sayfalarda doğru şıkkın harfi renkli olarak İŞARETLİ.** Bu işaretlemeleri
çıktına YAZMA — cevap anahtarı ayrı bir kaynaktan alındı ve denetçiler soruyu
kör çözecek. İşaretli şıkkı görmen sorun değil, kaydetmen sorun.

## 0. MUTLAK KURALLAR

1. **Sen soru YAZMIYORSUN, KOPYALIYORSUN.** Sayfada ne yazıyorsa o. Cümleyi
   düzeltme, kısaltma, sadeleştirme, "daha doğrusu şu olmalı" deme.
2. Sayfada okuyamadığın bir yer varsa **uydurma**: o soruyu `okunamadi: true`
   ile işaretle ve ne göremediğini yaz. Eksik bir soruyu atlamak, yanlış
   kopyalanmış bir soruyu bankaya sokmaktan sonsuz kez iyidir.
3. **Cevap anahtarını çıktına yazma.** Son sayfada resmî anahtar tablosu var
   ve şık harfleri sayfalarda işaretli; ikisini de kaydetme. Senin işin metni
   çıkarmak, soruyu çözmek değil.
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
[{"id":"s1",
  "kok":"…\n…",
  "siklar":{"A":"…","B":"…","C":"…","D":"…","E":"…"},
  "gorselGerekli":false,
  "okunamadi":false,
  "not":null}]
```

`kok` içinde satır sonları korunur (öncül listeleri okunabilir kalsın).
`id` = `s<soru-no>` (örn. 14. soru → `s14`).

## 3. Son cevabın

SADECE: dosya yolu · transkribe edilen soru sayısı · `okunamadi` sayısı ·
`gorselGerekli` sayısı. Soru metinlerini TEKRARLAMA.
