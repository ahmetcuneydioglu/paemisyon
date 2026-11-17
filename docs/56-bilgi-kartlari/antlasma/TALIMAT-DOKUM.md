# Resmî Gazete nüshasından madde dökümü (transkripsiyon)

Amaç: Resmî Gazete'de yayımlanmış bir uluslararası belgenin resmî Türkçe metnini, sayfa GÖRÜNTÜLERİNDEN okuyarak
madde madde JSON'a dökmek. Bu metin bir sınav hazırlık uygulamasının mevzuat bankasına "resmî metin" olarak girecek;
yanlış bir sayı ya da atlanmış bir "değil" kabul edilemez.

## Kurallar

1. **Dayanak görüntüdür.** Sayfa PNG'lerini Read aracıyla aç ve oku. Yanındaki `ocr.txt` yalnız yardımcıdır (macOS
   Vision çıktısı; harf hataları, sütun karışması olabilir). OCR ile görüntü çelişirse görüntü kazanır.
2. **Olduğu gibi yaz.** Basıldığı dil ve yazım korunur (eski yazım dahil: "Andlaşma", "mütaallik", "işbu"). Çağdaş
   Türkçeye çevirme, düzeltme, sadeleştirme YOK. Yalnız şunlar yapılır: satır sonu tirelemesi birleştirilir
   ("herhan-/gi" → "herhangi"), bariz baskı lekesi/OCR bozulması görüntüden okunarak düzeltilir, Türkçe harfler
   doğru yazılır (ı/i, ş, ğ, ü, ö, ç; "Birleşmış" değil görüntüde ne ise o: baskıda nokta silikse sözcüğün doğru
   yazımı esas alınır).
3. **Hafızadan tamamlama YOK.** Bu belgelerin başka çevirilerini biliyor olabilirsin; kullanma. Okunamayan yer
   `[?]` ile işaretlenir ve `belirsiz` listesine yazılır. Tahmin etme.
4. **Sayılar ve tarihler** (madde numarası, süre, üye sayısı, oy çokluğu, tarih, atıf yapılan madde no) görüntüden
   ikinci kez bakılarak doğrulanır. Küçük ya da silik yerlerde sayfayı kırparak büyüt:
   `pdftoppm -r 400 -png -f <sayfa> -l <sayfa> -x <x> -y <y> -W <w> -H <h> <pdf> <çıktı>` (PDF varsa) ya da
   `sips -c <yükseklik> <genişlik> --cropOffset <y> <x> <png> --out <çıktı.png>` (çıktıyı kendi alt klasörüne yaz).
5. Yalnız **Türkçe metin** dökülür; İngilizce/Fransızca metin, imza listeleri, onay kanunu/kararnamesi, bakan adları,
   beyan ve çekinceler madde olarak ALINMAZ (çekince/beyan varsa `notlar` alanına bir cümleyle "var" diye yaz).
6. Fıkra ve bent düzeni korunur: her fıkra yeni satırda (`\n`), numarası/harfi basıldığı gibi ("1.", "a)").
7. Başlangıç (önsöz/dibace) `articleNo: "Başlangıç"` olarak tek kayıt hâlinde alınır.
8. Bölüm/kısım başlığı her maddenin `bolum` alanına yazılır ("BÖLÜM II — Üyeler" gibi, basıldığı adla). Maddenin
   kendi kenar başlığı varsa `title`, yoksa boş dize.

## Çıktı

Belirtilen yola TEK bir JSON dosyası yaz:

```json
{
  "belge": "<belgenin basılı tam adı>",
  "kunye": "<Resmî Gazete tarihi ve sayısı; görüntüde gördüğün hâliyle>",
  "notlar": "<kısa: çekince/beyan var mı, kapsam dışı bırakılanlar>",
  "maddeler": [
    { "articleNo": "Başlangıç", "title": "", "bolum": "", "text": "..." },
    { "articleNo": "1", "title": "", "bolum": "BÖLÜM I — ...", "text": "1. ...\n2. ..." }
  ],
  "belirsiz": [ { "articleNo": "23", "yer": "2. fıkra", "sorun": "sayı silik: 3 mü 8 mi", "sayfa": "s-04" } ]
}
```

Bitince kendi kendini denetle: madde numaraları ardışık mı (atlanan/çift var mı), toplam madde sayısı belgenin
bilinen madde sayısıyla tutuyor mu, JSON `python3 -c "import json;json.load(open(...))"` ile açılıyor mu.

Son mesajında yalnız şunu bildir: madde sayısı, belirsiz sayısı, kapsamla ilgili karar verdiğin noktalar, görüntü
kalitesinden kaynaklı riskler. Metni mesaja yapıştırma.
