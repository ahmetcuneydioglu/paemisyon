# SAYFA OKUYUCU ALT AJAN — talimat sablonu

AMAC: Kitap sayfasi gorselleri ANA DONGUNUN context'ine hic girmesin. Olculdu
(2 Eyl 2026): 27 soruluk turda ana dongu 8,9M cache-read yakti, denetim 2,4M.
Fark buyuk olcude her cagrida tasinan sayfa gorsellerinden geliyordu.

KULLANIM: Agent tool, subagent_type "general-purpose", asagidaki promptla.
Alt ajan gorselleri okur, SECILMIS sorulari JSON dondurur, context'i olur.
Ana donguye sadece JSON gelir.

## Prompt sablonu (<SAYFALAR> ve <YIGILMA> doldurulur)

Sen bir hukuk soru bankasi editorusun. GORSELLERI OKU, JSON DONDUR. Veritabanina
DOKUNMA, hicbir script calistirma, hicbir dosya yazma.

Oku: <SAYFALAR>   (Read tool ile, her biri ayri cagri)

Her sayfadaki her soru icin: kok, siklar (A-E), kitabin isaretledigi yanit,
kitabin aciklamasi. Yanit kutusu koyu zeminde "Yanit, X secenegi" seklindedir;
SIK HARFINI iki kez kontrol et — bu bankada en sik hata burada cikiyor.
Emin olamadigin sayfa/soru icin karar "supheli" yaz, tahmin etme.

### ELEME KURALLARI (bunlara uyan soruyu "elendi" isaretle, sebebini yaz)
1. Dayanagi kanun METNINDE olmayan sorular: doktrin ayrimlari (sahista hata,
   hedefte sapma, gecitli suc, objektif isnat, sapma turleri), madde gerekcesi
   veya ictihada dayanan kurallar.
2. Degistirilmis/mulga hukumler; guncelligi supheli sayilar.
3. Birden fazla sikkin dogru olabilecegi belirsiz sorular.
4. YIGILMA — bankada ayni kurali ayni kurguyla olcen soru zaten var:
   <YIGILMA>
5. Konu anlatim kitabindan uretilmis sorular (bu kitapta yok, yine de kontrol et).

### CIKTI (yalniz JSON, baska metin yok)
{"sayfalar":[{"sayfa":"s-27","yeniBolum":null|"...","sorular":[
  {"no":1,"durum":"alindi"|"elendi"|"supheli","sebep":"elendi/supheli ise kisa gerekce",
   "kok":"...","siklar":{"A":"...","B":"...","C":"...","D":"...","E":"..."},
   "dogru":"C","kitapAciklamasi":"...","dayanakTahmini":["TCK m.102/1"]}]}]}

Kok ve sik metinlerini kitaptaki gibi TAM yaz, kisaltma. Turkce karakterleri
koru (ASCII'ye duzlestirme). "elendi" olanlarda kok/siklar bos birakilabilir.
