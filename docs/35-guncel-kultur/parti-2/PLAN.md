# Doc 35 · 2. parti — Güncel olaylar, Ocak–Eylül 2026 (A1)

Başlangıç: **23 Eylül 2026**. Kullanıcı isteği: zayıf konu analizinde "Güncel ve
Kültürel Olaylar" P11 sınavı için tazelenmeli çıktı (bankadaki 96 sorunun çoğu
kalıcı kilometre taşı ya da 2025 olayı; taze ve çıkmamış olgu çok az).

Bu dosya `../ARASTIRMA-TALIMATI.md` ve `../DENETCI-TALIMATI.md`'nin ÜSTÜNE
okunur. Çelişirse bu dosya geçerlidir (tarih ve kapsam burada güncel).

## 0. Tarih ve kapsam

- **Bugün 23 Eylül 2026.** Yalnız **1 Ocak – 22 Eylül 2026** arasında
  GERÇEKLEŞMİŞ olaylar. Duyurusu yapılmış ama henüz olmamış olay (Nobel 2026,
  CB Kültür ve Sanat Ödülleri 2026, COP31, Altın Portakal 2026) bu partiye
  girmez — onlar Kasım sonrası partinin işi.
- Hedef sınav P11 (muhtemelen 2027 ortası). Kökte **mutlak tarih** kullan:
  "Nisan 2026'da", "2026 yılında". "Bu yıl", "geçen ay", "son olarak" YOK —
  soru bir yıl sonra okunacak.
- Kaynak ölçütü, çıktı biçimi ve açıklama biçimi ARASTIRMA-TALIMATI'ndaki
  gibidir (birincil kaynak + URL + `olayTarihi`).

## 1. Kullanıcının reddettiği tipler — ÜRETME

Kullanıcı 5 Eylül 2026'da 1. partinin 29 sorusunu admin panelden elle arşivledi
(liste: `mevcut-sorular.md` §B). Örüntü açık:

1. **Teknik ürün ayrıntısı:** namlu çapı, menzil, güdüm kiti açılımı, gemi
   sınıfı adı, tersane adı, "ilk uçuş + envantere giriş" tarih ikilisi, bir
   kanunun sayı numarası. Savunmada sorulan şey OLAYDIR (teslim, ihracat, ilk
   uçuş, katılım) — katalog bilgisi değil.
2. **Siyasi hassasiyeti yüksek ya da hukuki içerikli düzenleme:** terörle
   mücadele/infaz düzenlemeleri, CBK/kanun içeriği. Güncel konusunda YENİ
   MEVZUAT SORUSU ÜRETİLMEZ (bu içerik ilgili kanun konularına aittir).
3. **Yabancı ülke ayrıntısı:** yabancı spor müsabakasının madalya tablosu,
   skor, turnuva formatı; bir yabancı ülkenin yeni devlet başkanı; "listeye
   ilk kez giren ülkeler" gibi liste soruları.
4. **Türk sporunda maç ayrıntısı:** golü kim attı, hangi skorla.

## 2. Kullanıcının TUTTUĞU tip — hedef bu

Türkiye merkezli ya da dünya çapında manşet düzeyinde, **tek ve net** cevabı
olan olgu: kurum, platform, ev sahibi şehir, örgüt üyeliği, ödül alan eser/kişi,
resmî istatistik eşiği. Gerçek sınav kalıpları (P9/P10):

| Kalıp | Örnek (künye, kullanıcı başarısı) |
|---|---|
| amaç/görev tanımı → kurum adı | P9#74 Millî İstihbarat Akademisi (%78), P9#72 İletişim Başkanlığı (%81) |
| teslim edilen yerli platform → adı | P10#78 AKSUNGUR → EGM Havacılık (%50) |
| yabancı savunma projesi → adı | P10#71 FCAS, Haziran 2026'da durduruldu (%27) |
| örgütten ayrılan/katılan ülke | P10#80 BAE, OPEC'ten 1 Mayıs 2026'da ayrıldı (%24) |
| bölgenin bağlı olduğu ülke | P10#77 Grönland → Danimarka (%55) |
| organizasyonun ev sahibi şehir(ler)i | P10#79 Milano ve Cortina (%45), P9#75 Tokyo (%42) |
| UNESCO alanı → il | P10#74 Sardes → Manisa (%55) |
| resmî istatistik eşiği | P10#76 1 milyonu aşan ilk ilçe Esenyurt (%64) |
| eser listesi + vefat → kişi | P9#76 Filiz Akın (%58) |

## 3. Alanlar ve hedefler

| Alan (dosya adı) | Hedef | İçerik |
|---|---:|---|
| `savunma-2026` | 6 | 4 soru: 2026'da gerçekleşen teslimat, ilk uçuş, ihracat, envantere giriş OLAYI (SSB, TUSAŞ, ASELSAN, ROKETSAN, Baykar, İletişim Başkanlığı duyuruları). 2 soru: 2026'da gündeme gelen uluslararası savunma projesi ya da ittifak tedariki (P10#71 kalıbı). KAAN, AKSUNGUR→EGM, TB3–TCG Anadolu gibi bankadaki olgular tekrarlanmaz. |
| `egm-ic-guvenlik` | 5 | EGM ve iç güvenlik birimlerine 2026'da katılan araç, sistem, birim (egm.gov.tr, içişleri.gov.tr, jandarma.gov.tr, TUSAŞ/Baykar/ASELSAN teslim duyuruları); 2026 Interpol/Europol toplantısı ya da iş birliği; EGM'nin 2026'daki kurumsal bir ilki. Mevzuat içeriği YOK. |
| `kurumlar-2026` | 5 | 2025–2026'da CBK ya da kanunla KURULAN, adı veya bağlılığı değişen kurumlar (Resmî Gazete). P9#74 kalıbı: amaç + kuruluş tarihi → kurum adı; beş şık aynı alanın gerçek kurumları. Kişi/unvan sorusu YOK (eskiyor). |
| `uluslararasi-2026` | 6 | 2026'da örgüt üyeliğine giriş/çıkış (OPEC, NATO, AB, BRICS, ŞİÖ, Türk Devletleri Teşkilatı...), bir bölgenin statüsü/bağlılığı, Türkiye'nin ev sahipliği yaptığı uluslararası zirve. Yabancı devlet başkanı adı sorusu YOK. |
| `spor-2026` | 4 | 2026–2027 büyük organizasyonların ev sahibi şehir/ülkesi (açıklanmış ve kesinleşmiş olanlar); Türk sporcuların 2026'daki "ilk" ya da "rekor" başarıları (federasyon/bakanlık duyurusu). Skor, format, madalya tablosu YOK. |
| `vefat-2026` | 3 | 2026'da vefat eden Türk sanatçı, yazar, bilim insanı. P9#76 kalıbı: eser/film listesi → kişi. Vefat İKİ kaynaktan (AA + Kültür ve Turizm Bakanlığı ya da ilgili kurum) doğrulanır. Bankadaki Haldun Dormen, İlber Ortaylı, Kadir İnanır tekrarlanmaz. Çeldiriciler aynı kuşak ve alandan; hayatta olan birini vefat etmiş gösteren kök/şık YOK. |
| `kultur-sanat-2026` | 3 | 2026'da gerçekleşmiş uluslararası ödül/festivalde Türk film, sanatçı ya da eser başarısı (Berlinale, Cannes, Venedik, Oscar...); UNESCO ya da TÜRKSOY'un 2026'da Türkiye'ye ilişkin kararları. Duyurusu henüz yapılmamış ödül YOK. |

Toplam hedef 32. Sayı için kalite düşürme: ARASTIRMA-TALIMATI §5 geçerli.

## 4. Ek kurallar

- **Mükerrer yok:** `mevcut-sorular.md` §A ve §C'deki olguları tekrar sorma.
- **Beş şık, tek doğru.** Çeldiriciler gerçek ve aynı sınıftan; bariz yanlış yok.
- **Zorluk:** P9/P10 bandı (kullanıcı başarısı %25–80). Tek tahminle bulunacak
  kadar kolay soru üretme.
- **Kişi adı soruluyorsa** kişi o tarihte o sıfatı gerçekten taşıyordu; vefat
  etmiş birini güncel bir göreve/ödüle aday gösterme.
- Parti kurma: araştırma dosyası bittiğinde
  `GUNCEL_KOK=<bu klasör> npx tsx scripts/guncel-parti-kur.ts <alan>` (yalnız o alan).

## 5. Hat

```
arastirma/<alan>.json  (üretici, birincil kaynak)
  → guncel-parti-kur.ts <alan>        → parti/<alan>-{kor,anahtar,meta}.json
  → iki KÖR denetçi                   → denetim/<alan>-d{1,2}.json
  → guncel-denetim-birlestir.ts       → denetim/<alan>-karar.json   (DENGELEMEDEN ÖNCE)
  → guncel-kurtarma-parti.ts + KURTARMA-TALIMATI → kurtarma/parca-N-oneri.json
  → guncel-kurtarma-uygula.ts → guncel-sik-dengele.ts → guncel-bankaya-yaz.ts (in_review)
```

Bütün script'ler `GUNCEL_KOK=/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur/parti-2`
ile çalıştırılır; 1. partinin dosyalarına dokunulmaz.

## 6. Sonuç (23 Eylül 2026)

| Adım | Sonuç |
|---|---|
| Araştırma | 31 soru (savunma 6, EGM 3, kurumlar 5, uluslararası 7, spor 4, vefat 3, kültür-sanat 3) |
| Kör denetim | 31/31 iki denetçide anahtarla aynı; 0 çelişki, 0 doğrulanamadı · ONAY 11, UYARI 20 |
| Kurtarma | A 5 · C 10 · F 5 (4 kurumlar sorusu: CBK hüküm ayrıntısı; savunma-2026-4: egm-ic-guvenlik-1 ile aynı cevap, T625 GÖKBEY) |
| Son okuma | kurumlar-2026-4 elendi (hukuki bağlam, 2025 olayı, zayıf çeldirici — ret örüntüsüne yakın; kullanıcı isterse geri alınır) |
| Dengeleme | yazılan 25 soruda A4 B5 C6 D4 E6; sıralı sayı şıklı 1 soruya dokunulmadı |
| Banka | **25 soru `in_review`** (uluslararası 7, savunma 5, spor 4, EGM 3, vefat 3, kültür-sanat 3); DB'den geri okunarak 25/25 doğrulandı |

Kurumlar alanından soru çıkmadı: Resmî Gazete taraması (CBK 193–200, Kanun
7573–7595) 1 Ocak–22 Eylül 2026 arasında kanun ya da CBK ile kurulan yeni bir
kurum bulamadı; 2025 kuruluşları CBK hüküm ayrıntısına dayandığı için elendi.

Düzeltilen tarih kaymaları: HÜRJET–İspanya sözleşmesi 29 Aralık 2025'te
imzalandı (28 Nisan 2026 duyuru töreni); TDT İçişleri Bakanları 3. Toplantısı
10 Eylül 2026 (11 Eylül açıklama tarihi).

**Arşiv notu:** `parti/` ve `denetim/` dosyaları dengeleme ÖNCESİ harfleri
taşır ve kendi içinde tutarlıdır; bankadaki gerçek, dengeleme sonrası
`arastirma/*.json`'dur. Parti dosyaları bilerek yeniden kurulmadı. Bu partinin
alanları birleştirici/dengeleme/kurtarma/bankaya-yaz koruma listelerine eklendi.

**Sonraki parti (Kasım 2026 sonrası):** Nobel 2026, CB Kültür ve Sanat Büyük
Ödülleri 2026, COP31 (Antalya, 9-20 Kasım 2026), INTERPOL 94. Genel Kurulu,
TDT Ankara zirvesinde TÜRKPOL'ün akıbeti (kurulursa egm-ic-guvenlik-2 eskir).
