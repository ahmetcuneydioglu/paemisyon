# Doc 53 / 04 — F4: Anayasa 12 ünite üretimi

Tarih: 26 Ekim 2026. Durum: **12 ünite canlıda `in_review`; yayın kararı panelden (insan).**

## Hat

`ozet-girdi` (canlı madde metinleri + o maddelerden çıkmış soruların kökleri ve şıkları) → `ozet-uret`
(claude-opus-5-5, adaptive thinking, sunucu tarafı fallback, 64k çıktı) → `ozet-dogrula --md --write`
(istatistik ve köprü veriden) → kusur düzeltme → `ozet-yukle --replace` (sıra numarasıyla, in_review).
Dosyalar: `uniteler/<slug>.json` (kaynak) ve `.md` (okunur); girdi ve raporlar gitignore'da.

| # | Ünite | md | Kart | Bağlı soru | Üretim notu |
|---|---|---|---|---|---|
| 1 | Genel esaslar | 1–11 | 23 | 17 | "md 1–6" aralığı sayı sayılıyordu → doğrulayıcı düzeltildi |
| 2 | Temel hakların rejimi | 12–16 | 24 | 14 | aynı aralık sorunu |
| 3 | Kişi hakları I | 17–26 | 24 | 44 | counterNumbers `{value,note}` nesnesi → normalize |
| 4 | Kişi hakları II | 27–40 | 23 | 31 | temiz |
| 5 | Sosyal ve ekonomik haklar | 41–65 | 24 | 32 | satırlı 3 kartta articleRefs boştu → satır refs birleşimi; istem kuralı eklendi |
| 6 | Siyasi haklar | 66–74 | 24 | 48 | temiz |
| 7 | Yasama I (pilot) | 75–86 | 22 | 77 | elle üretim, sıra 7 ile yeniden yüklendi |
| 8 | Yasama II | 87–100 | 24 | 65 | zincirli türetim (600/3=200 → 101) → doğrulayıcı kuralı |
| 9 | Yürütme I | 101–122 | 24 | 119 | 32k çıktıda kesildi → 64k |
| 10 | Yürütme II | 123–137 | 24 | 30 | bir kez bağlantı koptu, tekrar üretildi |
| 11 | Yargı I | 138–153 | 24 | 111 | `ceil` formülü; AYM yeter sayısı örneği 2010 öncesi 12 üyeyle kurulmuştu → md 149'daki "en az on üye" ile 7'ye çekildi |
| 12 | Yargı II | 154–177 | 24 | 84 | 64k ile temiz |

Toplam 284 kart, 672 bağlı soru. Model çıktısı: giriş 6–40k, çıkış 17–44k token / ünite.

## Doğrulayıcıya bu turda eklenenler

- Madde aralığı atfı ("md 1–6") sayı değildir.
- `counterNumbers` nesne biçimi (`{value, note}`) kabul edilir (içe aktarmada da normalize).
- Zincirli türetim: işlenen, aynı karttaki başka bir türetilmiş sayı olabilir.
- `ceil` formülü (üçte iki gibi yukarı yuvarlanan çoğunluklar).
- Ünite `sortOrder` içe aktarılır.

## İnsan incelemesi için notlar

Betik sayıları ve referansları doğrular; anlamı doğrulamaz. Okurken özellikle şunlara bakılmalı:
tuzak kartlarındaki olumsuz iddialar ("X md 2'de geçmez"), 2017 sonrası düzene aykırı kalıntılar
(Yargı I'de bir örnek yakalandı: 12 üyeli Genel Kurul), ve "Sınav der ki" satırlarının sınav adları.
Okunan dört ünite (Genel esaslar, Yasama II, Yürütme I, Yargı I'in ilgili kartı) metne sadık bulundu.

## Sıradaki

- Panelden ünite ünite inceleme ve yayın (Konu Özetleri › ünite › Yayınla). İlk 2 ünite açık, kalanı premium
  (Doc 53 karar 8): yayın öncesi "Ünite bilgilerini düzenle" ile Premium işareti.
- Doğrulayıcı değişiklikleri (ceil, aralık, nesne) canlıya push edilmeli; aksi hâlde panelde Yargı I'in
  yeter sayı kartı düzenlenince `ceil` reddedilir.
- F5: üniteler alt konu olur (hâkimiyet, koç reçetesi).
- Diğer dersler: polis mevzuatı kanun bazında aynı hat.
