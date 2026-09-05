# Doc 35 — Güncel ve Kültürel Olaylar Partisi (Eylül 2026)

Başlangıç: 5 Eylül 2026. Kullanıcı isteği: gerçek sınavda sıkça çıkan **güncel
olay** sorularının bankada hiç olmaması. Doc 33/34'ten farkı: ortada taranacak
bir kitap yok — konular belirlenir, **bilgi resmî kaynaktan derlenir**, soru
bizim tarafımızdan yazılır.

**Kaynak etiketi kullanılmaz** (Doc 33/34 ile aynı gerekçe); `sourceLabel`
yalnız admin görünürlüğü için `kurum, tarih (olay: YYYY-AA-GG)` biçiminde tutulur.

## 0. Kapsam kararı — video kopyalanmadı

Kullanıcı bir YouTube videosundaki 60 soruyu göstererek "sisteme çekelim" dedi.
Soruların kendisi o kanalın emeği; kopyalanmadı. Anlaşılan yol: **konu başlıkları**
alındı, üstüne bağımsız bir tarama yapıldı, olgular resmî kaynaktan (TÜİK, AA,
bakanlıklar, TUSAŞ/ROKETSAN/ASELSAN, Resmî Gazete) doğrulandı ve sorular sıfırdan
yazıldı. Video sorularıyla birebir örtüşen tek soru yok.

## 1. Konu

Genel Kültür dersi altına **"Güncel ve Kültürel Olaylar"** konusu açıldı
(`konu-ekle.ts`). Deneme otomatik doldurma adayları **derse** göre seçtiği için
konu kendiliğinden denemelere girer; kota konular arasında **eşit** bölündüğü
için 30 soruluk Genel Kültür bloğunda ~10 güncel soru demektir. Ağırlıklandırma
istenirse müfredat tarafında ayrıca ele alınmalı.

## 2. Külliyat

| Parti | Soru | Bankaya |
|---|---:|---:|
| Cumhurbaşkanlığı Kültür ve Sanat Ödülleri 2025 | 6 | 6 |
| Güncel 2026 — 5 alan (ekonomi-teknoloji, kültür-sanat-bilim, spor, siyaset-mevzuat, uluslararası) | 70 | 68 |
| Savunma sanayii — 3 alan (hava-uzay, füze-kurumsal, kara-deniz) | 47 | 47 |
| **Toplam** | **123** | **121** |

Savunma bloğu kullanıcının tespitiyle eklendi: "Türkiye savunma sanayiinde büyük
atılımlar yaptı ama savunma sanayiine yönelik soru hiç yok." 2026'ya bağlı olma
şartı aranmadı; alan gerçek sınavda süreklidir.

## 3. Hat

```
ARASTIRMA-TALIMATI.md   → arastirma/<alan>.json      (olgu + kaynak + olay tarihi)
guncel-parti-kur.ts     → parti/<alan>-{kor,anahtar,meta}.json
DENETCI-TALIMATI.md     → denetim/<alan>-d{1,2}.json  (KÖR: anahtarı görmez)
guncel-denetim-birlestir.ts → denetim/<alan>-karar.json
KURTARMA-TALIMATI.md    → kurtarma/<parca>-oneri.json (A-F sınıfı)
guncel-kurtarma-uygula.ts / guncel-sik-dengele.ts / guncel-bankaya-yaz.ts
```

Denetçiler yalnız **birincil kaynak** kabul eder; doğrulayamadıklarını
`dogrulanamadi` ile işaretler — bu, yanlış cevaptan ayrı bir karardır, çünkü
güncel olayda "kaynak yok" ile "cevap yanlış" aynı şey değildir.

## 4. Sonuç

117 araştırma sorusunda **0 ÇELİŞKİ, 0 DOĞRULANAMADI**; 75 ONAY, 42 UYARI.
Kurtarma turu 42 uyarıdan 40'ını kurtardı (A 33 · C 7), 2'sini eledi:

- `uluslararasi-12` (F): ITF 2027 dönem başkanlığında ITF'nin kendi sitesi ile
  Ulaştırma Bakanlığı doğrudan çelişiyor — tek doğru cevap yok.
- `uluslararasi-14` (E): "Hiçbiri" şıkkı olumsuz kökle mantıksal olarak bozuk.

Kurtarma turu üç denetçi iddiasını da çürüttü (TAYFUN kataloğu erişilebilir,
AKSUNGUR'un "Kasım 2023"ü TUSAŞ sayfasında var, HÜRJET adlandırması TUSAŞ
başlığıyla doğrulandı) ve bir anakronizmi düzeltti (3238 sayılı Kanun'un bugünkü
adı 703 sayılı KHK ile, 2018'de verildi).

## 5. Şık dengeleme

Üreten ajanlar doğru cevabı ilk şıkka koyma eğilimindeydi: ilk 70 soruda A %41,
bir alanda **%100**. Aday bunu iki denemede öğrenir. `guncel-sik-dengele.ts`
deterministik olarak dengeler; **sıralı/sayısal şıklara dokunmaz** (1945/1949/1950
gibi bir dizide artan sıra okunabilirliğin parçasıdır). Konu genelinde son durum
**A24 B24 C23 D21 E23**.

## 6. Olay — bozulan karar arşivi ve onarımı

Dengelemeden sonra birleştirici **yeniden çalıştırıldı**. Denetçiler soruları
dengeleme öncesi görmüştü; harfleri dengeleme sonrası anahtarla karşılaştırılınca
ilk beş alanda **48 sahte ÇELİŞKİ** doğdu. Bankaya yazılmış sorular etkilenmedi
— bozulan yalnız denetim arşiviydi, ama rapor üretirken yanıltırdı.

`guncel-karar-onar.ts` özgün kararları kurtarma partilerinden geri türetti:
parça dosyaları özgün birleştirmenin UYARI kümesidir (27 soru) ve dengeleme
**öncesi** şıkları da taşır; bu kümede olmayan her soru ONAY'dı. Eşleme harf
üzerinden değil **metin** üzerinden doğrulandı (denetçinin işaretlediği şıkkın
metni bugünkü doğru şıkkın metnine eşit olmalı); 27/27 tuttu, tek fark kurtarmada
düzeltilen bir imlaydı (Trencin → Trenčín).

Tekrarı önleyen korumalar: `guncel-denetim-birlestir.ts` `TAMAMLANDI`,
`guncel-sik-dengele.ts` `ATLA`, `guncel-kurtarma-uygula.ts` `uygulandi.json`,
`guncel-bankaya-yaz.ts` `YAZILMIS`. **Kural: bir alan dengelendikten sonra o
alanın birleştiricisi bir daha çalıştırılmaz.**

## 7. Açık uçlar

- Sorular `in_review` yazılır; yayın kararı kullanıcıdadır (kullanıcı isteği).
- Kültür-Sanat sorularında çeldirici olarak İlber Ortaylı geçiyor; 13 Mart 2026'da
  vefat etti, değiştirilmesi düşünülebilir.
- Genel Kültür'de Sözel/Analitik/Matematik konuları boş; güncel konunun deneme
  kotasındaki payı bu yüzden yüksek.
