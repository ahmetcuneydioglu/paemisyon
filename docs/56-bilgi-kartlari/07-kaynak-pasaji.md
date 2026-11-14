# Doc 56 §12 — Kaynak pasajına dayanan bilgi kartı

Karar: kullanıcı, 14 Kas 2026. Kural metni `CLAUDE.md` (İSTİSNA 14 Kas 2026). İlk ders: Atatürk İlkeleri ve
İnkılap Tarihi. Silah Bilgisi, kaynağı sağlandığında aynı hatla yürür.

## 1. Neden

Bilgi kartı istisnası her kartı bir resmî maddeye bağlar ve sayıları madde metninde betikle doğrular. Mevzuatı
olmayan derslerde (İnkılap Tarihi 751 soru, Silah Bilgisi 283, Genel Kültür, Protokol…) dayanılacak madde
yoktur; bu dersler 13 Kas 2026'ya kadar kartsız kaldı. Bankadaki sorular tek başına dayanak olamaz: doğru şık
tek bir olgu verir, açıklamaların çoğu boştur (Silah Bilgisi'nde 283 sorunun 13'ü açıklamalı).

Çözüm, maddenin yerine **kaynak pasajını** koymaktır: panele yüklenmiş, denetçinin geri dönebildiği yazılı metin.

## 2. İki ayrı rol

| Rol | Kaynak | Kullanım |
|---|---|---|
| Kapsam ("ne soruluyor, neyle karıştırılıyor") | Bankadaki yayındaki sorular, çıkmışlar önde | Yalnız üretim girdisi. Dayanak DEĞİL: soruda geçip pasajda geçmeyen bilgiden kart yazılmaz. |
| Doğruluk dayanağı | Kaynak pasajı | Kartın referansı; tarih ve sayılar burada geçmek zorunda. |

## 3. Veri modeli (migration `20261114090000_kart_kaynak_pasaji`, eklemeli)

- `source_documents`: kaynak metin (slug, konu, panel adı, künye, tür, URL).
- `source_passages`: pasaj (`passage_no` kaynak içinde tekil, başlık, sayfa, metin, sıra). `LawArticle`'ın eşi.
- `flashcard_passages`: kart → pasaj referansı (birincil / ilgili). `FlashcardArticle`'ın eşi.
- `flashcards.source_document_id`: kartın dayandığı kaynak; `legislation_id` ile birlikte dolmaz.

Ders kitabı metni bilerek mevzuat tablolarına KONMADI: `legislation` kayıtları Mevzuat sekmesine, public SEO
sayfalarına, site haritasına ve kart oynatıcısındaki madde bağına çıkar; bir süzgeç unutulursa kitap metni
yayımlanırdı. Ayrı tabloları hiçbir kullanıcı ucu seçmez (`kart-kaynak.spec.ts` bunu bekçiler).

## 4. Hat

```
PDF (insan indirir) → pasajlara böl → kaynak.json
  → APPLY=1 kaynak-ekle.ts kaynak.json                      (source_documents + source_passages)
  → kaynak-girdi.ts <slug> --prefix "2.3-" girdi.json --sorular "<regex>"
  → kart-uret.ts girdi.json - deste.json --slug <deste> --baslik "<başlık>" --hedef 25
  → kart-dogrula.ts deste.json --md                          (pasajlar veritabanından)
  → iki bağımsız denetçi + hakem, denetim/<deste>.md
  → kart-yukle.ts deste.json --replace                       (in_review)
  → panel: kartın yanında pasaj metni; yayın kararı insanın
```

Deste JSON'u `deck.legislationSlug` yerine `deck.sourceSlug` taşır; `articleRefs` pasaj numarasıdır. Doğrulayıcı
(`validateCard`) değişmedi: yalnız "numara → metin" haritası ister, harita `kart-kaynak.ts`'te madde ya da pasajdan
kurulur. İçe aktarma, panel ayrıntısı, kart düzenleme, tek ve toplu yayın kapısı aynı yardımcıyı kullanır.

## 5. Üretim kuralları (istem eki `KAYNAK_EKI`)

- Yalnız pasajda açıkça yazan olgu; genel kültürden tamamlama yok.
- Her tarih ve sayı pasaj metninde aynen geçer (betik). Hesapla bulunan değer (süre farkı, yüzyıl) yazılmaz.
- "İlk", "tek", "en önemli" gibi nitelemeler ve neden-sonuç bağı yalnız pasaj aynı ifadeyi kuruyorsa.
- Kaynak cümlesi kopyalanmaz; özel adlar, tarihler ve belge adları dışında özgün kısa ifade.
- Tuzak kartı aynı destenin pasajlarında geçen iki olgunun karıştırılması üzerine kurulur; yanlış öğenin pasajı
  da referansa eklenir.
- Ders kitabının etkinlik, görsel altı ve ölçme sorusu gibi öğretim öğelerinden kart yazılmaz.
- Kart metninde kaynak, kitap, sayfa ya da pasaj sözü geçmez; `sourceLabel` kitap adını taşımaz.

## 6. Eskime ve düzeltme

Pasaj sürümlenmez. `kaynak-ekle.ts` metni değişen pasaja bağlı kartları eskitir (`staleSince`; yayın kapısı
kapanır, kart panelde gözden geçirilip kaydedilince açılır). Karta bağlı bir pasaj dosyadan çıkarılırsa işlem durur.

## 7. Kapsam dışı

- Soru üretimi: bu istisna yalnız bilgi kartı içindir.
- Panelden elle "yeni kart" oluşturma kaynak pasajıyla çalışmaz (yalnız içe aktarma); düzenleme çalışır.
- Kaynakta geçmeyen ama bankada sık sorulan bilgiler kart olmaz; "kaynak eksiği" listesine yazılır ve ikinci bir
  kaynak (resmî antlaşma metni, Nutuk) onaylanırsa sonradan eklenir.

## 8. Doğrulama (14 Kas 2026, yerel)

Yerel deneme veritabanında (Docker, :55432) uçtan uca: migration → üç pasajlık deneme kaynağı → `kaynak-girdi` →
`kart-uret` kaynak kipi (10 kart) → `kart-dogrula` GEÇTİ → `kart-yukle` → toplu yayın kuru çalıştırma 10/10 →
panel ayrıntı servisi pasaj metnini döndürüyor, kullanıcı seçimi yalnız boş `articles` görüyor. Birim testleri:
kart, panel ve özet paketleri geçti. Panel ekranı tarayıcıda açılmadı (yönetici girişi gerekir); prod'da ilk
pilot desteyle bakılacak.
