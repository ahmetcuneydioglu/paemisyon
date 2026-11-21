# Kanun dipnot taraması — 21 Kasım 2026

Kullanıcı: "Evet, burada yap" (tarama) · "Evet, uygula" (üretim değişiklikleri). Yönetmelik taramasının devamı
(Doc 39 `rapor/durum.md` → "Yönetmelik taraması").

## Neden

mevzuat.gov.tr bazı Anayasa Mahkemesi kararlarını metne işlemez:

- "… yönünden" kısmi iptallerde metin aynen kalır, yalnız dipnot düşülür.
- Ertelenmiş iptallerde metin, yürürlük tarihine kadar aynı kalır.
- 703 sayılı KHK'nin yürürlükten kaldırmalarının iptalinde (AYM E.2018/117, K.2023/212) hüküm yeniden yürürlüğe
  girdiği hâlde metin "Mülga" gösterilmeye devam eder.

Bankadaki metinler buradan alındığı için içerik iptal edilmiş ya da değişmiş bir kuralı geçerli gibi öğretebiliyor.
Tazeleme betiği bunu yakalayamaz, çünkü metin değişmiyor.

## Yöntem

1. Bankadaki 57 kanunun resmî metni indirildi (Anayasa ve TBMM İçtüzüğü dahil, uluslararası belgeler hariç).
2. 261 AYM kaydı (118 dipnot, 143 satır içi şerh) maddelerle eşlendi.
3. Bankadaki metin resmî metinle karşılaştırıldı.
4. Riskli 45 madde beş konu kümesine ayrıldı: 7068; TCK/CMK; idare/anayasa; kolluk/trafik; 703 KHK iptalleri.
5. Her küme bir analist ajanında incelendi: hukuki etki birincil kaynaktan (RG, mevzuat.gov.tr) doğrulandı, maddelere
   bağlı 122 soru, 117 kart ve 129 blok tek tek sınıflandırıldı. Madde bağı olmayan içerik ayrıca ifade örüntüsüyle
   arandı.
6. Kusur iddiaları iki bağımsız çürütücüye verildi; araya üç sağlam öğe karıştırıldı. Hukuki olguların hiçbiri
   çürümedi. Sınıf ve ifade düzeltmeleri çürütücülerin önerileriyle birleştirildi.

## Uygulanan değişiklikler

- **Yayından çekildi (1):** 4fa6e1f2, TCK md 53. AYM 8/10/2015 E.2014/140 K.2015/85 seçme ve seçilme yoksunluğunu
  maddenin kendiliğinden sonucu olmaktan çıkardı; E şıkkı da savunulabilir. İki çürütücü de esasa ilişkin kusur dedi.
  Panelin arşivleme mantığıyla çekildi; denetim kaydı `question.archive`.
- **Soru açıklaması (5), `sik-metni-guncelle.ts`:**
  - c57e9b7e — 5188 md 11/4;
  - 8c13f4e5, f9e0262c — İçtüzük md 163;
  - bf530a26 — 5442 md 11, AYM dışı iki yanlış alıntı.
- **Bilgi kartı (5):**
  - 1d8c942a — 5188 md 11/4;
  - 1f60e40a — 2918 md 67: araç sahibi değilse araçtan men yok;
  - 40a1ffa5 — TCK 53;
  - ddf66791 — CMK geçici md 5: yasak yalnız kesinleşmiş dosyalarda;
  - 7d8434eb — İçtüzük 163.
- **Konu özeti bloğu (15; 8 ünite):**
  - `stk-5-secim-gunu-isleri`: 8 blok, mektupla oy (298 md 94/B, AYM 2008/113). İki blokta başlık da değişti.
  - `dk-1` 7: 5253 md 10, dernekten partiye yardım.
  - `gkdk-ceza-verilecek-fiiller` 14: 7068 md 8/4-b-5, yeni şartlı hâl.
  - `tck-guvenlik-tedbirleri-ve-tekerrur` 7: TCK 53.
  - `ogk-genel-hukumler` 16: 5188.
  - `ytk-genel-hukumler` 11: 2860 md 10.
  - `tihek-1` 14: 6701, yeniden yürürlüğe giren hükümler için not.
  - `ktk-trafik-kurallari` 19: AYM dışı, eksik ceza basamağı.
- **Yürürlük notu (35 madde, `effective_info`):**
  - Not düşülen başlıca hükümler: 7068 md 8; TCK 53; CMK 82, 134, 226, 234 ve geçici 5; 657 md 36; 2577 md 45, 48;
    İçtüzük 163; 298 md 94/B; 5253 md 10 ve Ek 1; 5393 md 14; 6085 md 18, 35; 2918 md 26, 65, 67, 94, 110;
    2911 md 7, 22; 2860 md 10; 7245 md 2; 5188 md 10, 11; 5275 md 59; 5442 md 11.
  - Yeniden yürürlüğe giren beş hükmün (5442 md 5, 6, 7; 6216 md 11; 6701 md 10) notu resmî metni aynen aktarıyor.
  - 5275 md 59'daki "undefined" notu düzeltildi.
- **Madde metni tazeleme (1):** 657 Ek md 33 resmî metinden tazelendi (`mevzuat-madde-tazele.ts`). Tablodan düşen
  135 göstergesi geri geldi; gövdeye karışmış dipnotlar çıktı. Yedek `tazeleme-yedek-2026-11-21.json`.
- **Kaynak adresi (2):** PVSK tertip 5 → 3 (eski adres boş sayfa dönüyordu); 6458'e eksik adres eklendi.
- **Kaynak dosyalar:** 8 ünite JSON'u ve .md eşi, 5 deste (tck-guvenlik-tedbirleri,
  cmk-olaganustu-kanun-yollari-giderler, tic-4, ktk-11, ogk-1). Dosyalar veritabanıyla birebir doğrulandı.

Defterler: `sik-guncelleme.jsonl` (açıklamalar), `mevzuat-tazeleme.jsonl` (notlar, kaynak adresleri, tazeleme).
Yedekler scratchpad `kanun-tarama/duzeltme/`. Uygulama tek bir transaction içinde yapıldı. İlk deneme Prisma'nın
5 saniyelik işlem süresini aştı ve tamamen geri alındı; süre 180 saniyeye çıkarıldı.

## Temiz çıkanlar (özet)

- 7068 md 8: banka metni güncel, 73 soru ve 24 kart sağlam.
- TCK 103, CMK 308/A ve CMK 234: dipnotlar tarihî; hükümler sonradan yeniden düzenlenmiş.
- 2918 md 26, 94, 110; 2911 md 7, 22; 5188 md 10: banka metni güncel, içerik doğru.
- 657 md 36'daki "serbest" iptaline bağlı 30 öğe sağlam.

## Açık işler

- **Ertelenmiş iptaller takvimi:**

  | Tarih | Madde | Yapılacak |
  |---|---|---|
  | 18/12/2026 | CMK md 82 | Blok cc95c4cf'teki "Yönetmelik (md 82)" satırına bakılacak; büyük olasılıkla değişiklik gerekmez. |
  | 25/2/2027 | CMK md 134 | Yeni düzenleme gelmezse 9 öğe çekilecek ya da arşivlenecek: sorular 3ff83dc8, 82178f10; kartlar e8ff382d, 183627a9; bloklar c8276e57, 59736a95, bd1d094d, 4c2e46a5, c76ee41d. |
  | 16/4/2027 | CMK md 226 | (4) fıkranın 3. cümlesi kalkacak: soru 137f011d (açıklama), kart dc281be7, bloklar e9c08728, 74ed71a8. |

- **Yeniden yürürlüğe giren hükümler madde metnine işlensin mi?** Kullanıcı kararı bekliyor. Şimdilik yalnız notla
  bırakıldı, çünkü metin mevzuat.gov.tr'den ayrılır ve bağlı içerik eskimiş sayılabilir. 6701 sayı satırları
  (blok 964ac58b: on yıl, dört yıl, iki dönem) bu karara bağlı. 5442 md 5/2 ve 6/2 üzerine içerik üretilmemeli:
  bugün uygulanıp uygulanamayacakları tartışmalı (375 sayılı KHK ek 36, 7547).
- **`mevzuat-madde-tazele.ts` notları ezer:** Betik `effective_info`'yu `${effectiveInfo} (mevzuat.gov.tr …)` diye
  yeniden yazıyor. Bu yüzden bu taramada eklenen notlar sonraki bir tazelemede silinebilir; girdide not yoksa da
  başa "undefined" yazıyor. Notları koruyacak düzeltme önerildi.
- **Dört şıklı sorular:** e57b303a, 8671c1dc (657 md 36); 6880e67a (2577 md 45); 4173cf25 (6713; açıklaması boş).
- **Kapsam dışı:** dab587d6 ("Özgün soru", 5442 md 11) 6ba89fed ile aynı bilgiyi soruyor. 6216 md 57/2 ve geçici
  md 2 ertelemeli iptal sonrası 7551 ile yeniden düzenlenmiş; banka metni güncel.
- **Tarama betiği sınırları:**
  - "MADDE 59 .-" biçimli başlıklar tanınmıyor.
  - Yazım hatalı dipnotlar ("Anaya Mahkemesinin") süzgeçten kaçıyor.
  - Madde sonundaki dipnot işaretinin eşlenmesi düzeltildi.
