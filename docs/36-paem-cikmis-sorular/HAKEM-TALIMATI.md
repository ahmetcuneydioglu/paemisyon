# Doc 36 — Hakem Talimatı (PAEM 9 / 2025)

Hakem, iki kör denetçinin **resmî cevap anahtarıyla** ayrıştığı sorulara bakar.
Bu ayrışmanın üç olası açıklaması var ve hangisi olduğunu tespit etmek senin
işin:

1. **Denetçiler yanılmış.** Anahtar doğru; soru bankaya olduğu gibi girer.
2. **Bizim aktarımımız bozuk.** Soru metni, şıklar veya numaralandırma PDF'ten
   yanlış çıkmış; denetçi aslında başka bir soruyu çözmüş. → Kaynak PDF'e bak.
3. **Mevzuat değişmiş.** Anahtar 2025'te doğruydu, bugün değil.

Üçünü karıştırma. En sık ve en sinsi olanı **2**: soru kâğıdında sözcüklerin
altına basılan numaralar, iki sütunlu düzende yer değiştiren satırlar,
şıkka bulaşan sonraki cümlenin ilk sözcüğü. Denetçi cevabı tuhaf geliyorsa
önce metni kaynaktan doğrula.

## Girdi

- `denetim/<parti>-karar.json` — ayrışan sorular (`CELISKI`, `ESKIMIS`, `ZAYIF`)
- `parti/<parti>-kor.json` ve `-anahtar.json`
- Kaynak PDF: `~/Documents/PaemÇıkmışSorular/Paem9.pdf`
  (A grubu s. 1-18, B grubu s. 19-36; **aynı soru iki kitapçıkta da var**,
  metni çapraz okumak aktarım hatasını hemen gösterir)

## Çıktı

`denetim/<parti>-hakem.json` — dizi:

```json
{
  "no": 80,
  "karar": "ONAY | ESKIMIS | KUSURLU | AKTARIM-HATASI",
  "gerekce": "Ne oldu, hangi kaynağa dayanıyorsun.",
  "duzeltme": { "kok": null, "siklar": null }
}
```

- `ONAY` — anahtar doğru, denetçiler yanılmış.
- `ESKIMIS` — hüküm değişti; hangi kanun/madde, hangi tarih, bugünkü doğru cevap.
- `KUSURLU` — soru gerçekten hatalı (iki doğru şık, eksik öncül). Sınavda nasıl
  çıktıysa öyle kalır ama açıklamada söylenir.
- `AKTARIM-HATASI` — bizim çıkarımımız bozuk; `duzeltme` alanına DOĞRU metni yaz.

## Kural

Kararın **bağlayıcıdır**; birleştirici hakem dosyasını gördüğü an kendi
kararının yerine seninkini koyar. Bu yüzden emin olmadığın soruda `KUSURLU`
deyip geçme — kaynağa bak. Emin olamıyorsan gerekçede bunu açıkça yaz.
