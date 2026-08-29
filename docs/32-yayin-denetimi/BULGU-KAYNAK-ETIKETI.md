# Bulgu — Yayındaki soruların %46'sında kaynak etiketi yok

**Tespit tarihi:** 29 Ağustos 2026 · Doc 32 Aşama 1 sırasında, kapsam taraması yan ürünü
**Durum:** ERTELENDİ — kullanıcı kararı: "şimdilik not et, Anayasa ile devam edelim"

## Ölçüm

`questionVersion.sourceLabel` alanı **2101 / 4554** yayın sorusunda boş (`null` veya boş dize).

| Konu | Kaynaksız |
|---|---|
| Türk Ceza Kanunu | 461 |
| Genel Kültür | 327 |
| 5271 CMK | 307 |
| İnkılap Tarihi | 295 |
| T.C. Anayasası | 174 |
| Silah Bilgisi | 166 |
| İngilizce | 95 |
| Protokol Bilgisi | 75 |
| İnsan Hakları | 66 |
| İdare Hukuku | 57 |
| Atatürk İlkeleri | 41 |
| Anayasa | 20 |
| diğer (Temel Kavramlar, 5395, 6284) | 8 |

Bunlardan **95 tanesi en az bir sınavda kullanılmış**.

## Neden önemli

`CLAUDE.md`: *"Soru bankasının varlık nedeni 'gerçek, kaynaklı çıkmış soru' güvenidir:
AI soru üretimi yapılmaz; kaynak etiketi her zaman görünür."*

Şu an `app_settings.show_question_source = false` olduğu için kullanıcı boş etiketi
GÖRMÜYOR — acil bir görünüm hatası yok. Ancak bu anahtar açıldığında yayındaki
soruların yarısında kaynak alanı boş çıkar ve ürün vaadi ile veri çelişir.

Şema kontrolü: `QuestionVersion` üzerinde köken taşıyan başka alan YOK; `sourceLabel`
tek kaynak alanıdır (schema.prisma:519). Yani bilgi başka bir yerde saklı değil,
gerçekten eksik.

## Alt küme: mevzuat-tarihi trivia soruları

Kaynaksızların içinde ayrıca **öğretici değeri olmayan** bir grup var. Örnek:

- `f0aad78e` — "Tutuklu işlerde ... zorla getirme kararına ilişkin süreye dair ibare,
  2/3/2024 tarihli ve 7499 sayılı Kanunla nasıl değiştirilmiştir?" (cevap: "yedi gün" → "iki hafta")
- `ddf4d78c` — "5328 sayılı Kanunla, Geçici Madde 1'de yer alan tarih ibaresi hangi
  şekilde değiştirilmiştir?" (cevap: 1 Nisan 2005 → 1 Haziran 2005)

Bunlar hukukun kendisini değil, DEĞİŞİKLİK GEÇMİŞİNİ ölçüyor; sınav hazırlığına katkısı
yok. İkisi de kaynaksız ve hiçbir sınavda kullanılmamış.

## Önerilen tur (yapılmadı)

1. Kaynaksız + sınavda kullanılmamış + mevzuat-tarihi trivia olanları arşivle.
2. Kalan kaynaksızlar için içe aktarma kayıtlarından (`import-*` scriptleri, orijinal
   PDF'ler) etiket geri kazanılabilir mi diye bak.
3. Geri kazanılamayanlar için `show_question_source` açılmadan önce bir karar gerekir:
   ya etiketsizler arşivlenir ya da "kaynak belirtilmemiş" gibi dürüst bir etiket yazılır.

## Araç

Tarama şu scriptle tekrarlanabilir: `apps/api/scripts/konu-uyum.ts` (kök-konu uyumu) ve
kaynaksız sayımı için `questionVersion.sourceLabel` üzerinden basit bir count.
