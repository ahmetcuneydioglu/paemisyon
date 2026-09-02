# Kitap partisi araclari (Doc 32)

Soru kitabindan bankaya soru alirken kullanilan tarama araclari. Onceden
scratchpad'de duruyorlardi; scratchpad oturuma bagli oldugu icin buraya alindi.

| betik | is |
|---|---|
| `mukerrer-tara.py` | Adaylari **BANKADAKI** sorularla karsilastirir (3 katman: TAM / KOK / YAKIN). |
| `ic-tarama.py` | Adaylari **BIRBIRIYLE** karsilastirir. Ayni kitabin ardisik sayfalarinda ayni kural iki kez soruluyor; bunlar bankada olmadigi icin ilk taramadan temiz gecip partiyle birlikte iceri giriyordu. |
| `karsilastir.py` | Bir adayi bankadaki muhtemel esiyle yan yana doker — karar ELLE verilir. |
| `aday-kur.py` | Secilen etiket listesinden duz aday dosyasi uretir. |
| `dok.py` | Secilen adaylari tam metinle doker (eleme/aciklama icin). |

## Neden iki ayri tarama

`mukerrer-tara.py` tek basina YETMEZ. 3 Eyl 2026'da CMK b06 partisinde 8 banka
mukerreri onunla, **5 parti ici tekrar** ise yalnizca `ic-tarama.py` ve elle
inceleme ile yakalandi.

Tarayici yanilabilir: isaretledigi es YANLIS olabilir (b06'da bir soruda oyle
oldu; gercek es elle bulundu). Bu yuzden her isaret `karsilastir.py` ile
dogrulanir, karar betige birakilmaz.

Tarayicinin yapisi geregi KACIRDIGI tur: ayni maddeye bagli ama kokleri farkli
yazilmis sorular. Partide ayni maddeden 2+ soru varsa ELLE karsilastirilir.

## Yollar

Betiklerin icindeki `SC` sabiti scratchpad'i gosterir; aday JSON'lari ve
`cmk-mevcut.json` (banka dokumu) orada uretilir. Yeni oturumda banka dokumu
yeniden cekilmelidir — bayat dokum mukerreri kacirir.
