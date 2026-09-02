# GECE TALIMATI — 3 Eylul 2026 (cron turu, 20 dakikada bir)

Kullanici uykuda. **Uzun anlatim yapma; calis, gunluge tek satir yaz, dur.**
Her tur TEK ADIM ilerletir. Durum diskte tutulur, hicbir is kaybolmaz.

## KULLANICI TALIMATI (3 Eyl 2026, aynen)

> "ozgun, guzel sorulari sikintisiz sorulari sistemi almaya calisalim. her soruyu
> almak icin kendini zorlama zaten veritabanimizda yeterince guzel sorular var."

Bunun operasyonel karsiligi: **kapsam degil kalite hedefi.** Bir sayfadan sifir
soru cikmasi basarisizlik DEGILDIR. Suphede kalan, mukerrere yakin duran,
birden fazla sikki savunulabilir olan soru ALINMAZ. Parti 20 soruysa 20 kalir.

## SIRA

1. **CMK** — `Themis Soru - Ceza Muhakemesi Hukuku` bitirilecek. Kalan sayfalar:
   `s-001..s-041`, `s-053..s-059`, `s-068..s-083`.
   Gorseller: `<scratchpad>/cmk-png/s-NNN.png` (124 sayfa, s-001..s-116).
   Yeniden uretmek gerekirse:
   `pdftoppm -png -r 200 -f <ilk> -l <son> "$HOME/Downloads/Themis Soru - Ceza Muhakemesi Hukuku.pdf" <scratchpad>/cmk-png/s`
2. **Idare Hukuku** — `~/Downloads/Themis Soru - Idare Hukuku.pdf`
3. **Idari Yargilama Hukuku** — `~/Downloads/Themis Soru - Idari Yargilama Hukuku.pdf`

### Idare/IYUK'a ozel kullanici kararlari (3 Eyl 2026)

- **Konu anlatimi ARTIK KAYNAK OLARAK KULLANILABILIR — ama yalniz ACIKLAMA icin.**
  `~/Downloads/Themis Konu - Idare Hukuku.pdf` aciklama yazarken temel alinabilir.
  SORU URETIMI YASAGI DEVAM EDIYOR: soru yalnizca "Themis Soru - ..." kitabindaki
  gercek sorulardan alinir. (GECE-DURUM.md sonundaki yasak bu yonuyle daralmistir.)
- **IYUK metinleri bankada var** — dayanak maddeler oradan bulunur, disari cikilmaz.
- **DANISTAY: yalnizca TEMEL duzey, hedef ~20 soru.** Ornek: Danistay uyeleri kim
  tarafindan secilir, kurul kac uyeden olusur, daire sayisi. Derinlikli/istisnai
  Danistay sorulari ALINMAZ. 20'ye ulasinca Danistay konusu KAPANIR.

## TUR AKISI (her tur TEK adim)

Durum dosyasi: `docs/32-yayin-denetimi/GECE-DURUM.md` -> "NEREDE KALDIM".

1. `git status` temiz degilse ve yarim parti varsa once ONU bitir.
2. **Kuyrukta in_review soru varsa** (denetimi bekleyen parti): kume uret ->
   `Workflow denetim-hat.js` -> `denetim-yayinla.ts --yaz` -> commit. DUR.
3. **Kuyruk bossa**: siradaki 3-4 sayfayi ALT AJANA okut (sablon: GECE-SAYFA-OKUYUCU.md).
   Gorseller ana dongunun context'ine GIRMEZ. DUR (okuma uzun surer).
4. **Okuma ciktisi hazirsa**: eleme -> tarama -> aciklama -> import -> kume -> denetim.

## ELEME (once eleme, sonra soru)

Alt ajan sunlari "elendi" isaretler:
1. Dayanagi kanun METNINDE olmayanlar (doktrin, madde gerekcesi, salt ictihat).
2. Degismis/mulga hukum, eskimis sure. Tereddut varsa "supheli" -> ALINMAZ.
3. Birden fazla sikki dogru olabilecek belirsiz sorular.
4. Kitabin cevap harfi kendi cozum metniyle celisiyorsa.

Ana dongu ayrica sunlari duser:
5. **Kok, baska mevzuatin kuralini bu kanuna mal ediyorsa.** (3 Eyl: bir soru
   "5271 sayili CMK'ya gore" deyip 5651 s.K. m.8 katalogunu soruyordu — dusuruldu.)
6. **Mukerrer** — asagidaki iki tarama.

## MUKERRER TARAMASI — IKI AYRI TARAMA, IKISI DE ZORUNLU

Betikler artik depoda: `apps/api/scripts/kitap-hatti/` (scratchpad oturuma bagli).
```
python3 apps/api/scripts/kitap-hatti/mukerrer-tara.py <okunan.json>   # BANKAYA karsi
python3 apps/api/scripts/kitap-hatti/ic-tarama.py    <okunan.json> ... # PARTI ICINE karsi
python3 apps/api/scripts/kitap-hatti/karsilastir.py  <okunan.json> <sayfa> <no> <banka-onegi>
```

- `mukerrer-tara.py` bankayla karsilastirir. Once `cmk-mevcut.json`'i TAZELE.
- `ic-tarama.py` adaylari birbiriyle karsilastirir. Ayni kitabin ardisik
  sayfalarinda ayni kural iki kez soruluyor; bunlar bankada olmadigi icin ilk
  taramadan TEMIZ geciyor, sonra ayni partiyle birlikte bankaya giriyor.
- Isaretlenen her cift `karsilastir.py` ile ELLE bakilir; tarayici yanilabilir.
  (3 Eyl: tarayici yanlis esi isaretledi, gercek es elle bulundu.)
- Tarayicinin kacirdigi tur: **ayni maddeden gelen kumeler.** Partide ayni maddeye
  bagli 2+ soru varsa kokler benzemese de ELLE karsilastir; birinin kapsami
  digerinin alt kumesiyse genis olani tut.

## ACIKLAMA

- KANUN METNINDEN yeniden yazilir; yayinevi cozumu kopyalanmaz.
- Turkce diakritik zorunlu, >=200 karakter, kurali OGRET, soruyu tekrar etme.
- Yazmadan once maddeyi bankadan CEK ve OKU. Ezberden yazma.
  (3 Eyl: m.128'in "agir ceza mahkemesince oy birligi" olcutu 6763 s.K. ile 2016'da
  kaldirilmis; ezberden yazilan aciklama yanlisti, denetim yakaladi.)

## HARITA — IKI KURAL

1. **FIKRA NUMARASI YAZILMAZ.** `Ceza Muhakemesi|253` dogru, `|253/19` YANLIS
   (eslesmez, soru sessizce kumeden duser). Harf eki korunur: `308/A`.
2. **Eslestirme kok+SIK anahtariyla yapilir, yalniz kokle DEGIL.** Iki soru ayni
   koke sahip olabilir (3 Eyl: iki otopsi sorusu); kok bazli eslestirme birini ezer.
3. Kume uretiminden sonra **"haritada N = kumede N"** kontrolu SART.

## KOMUTLAR

```
cd apps/api && set -a && source .env && set +a
DATABASE_URL="${DATABASE_URL%%\?*}?connection_limit=1" npx tsx <script>
```
- Gecici .ts betikleri `apps/api/` ICINDE olmali (module resolution); scratchpad'den calismaz.
- Import   : `import-ozgun-sorular.ts <json> --yaz`
- Kume     : `hedefli-kume.ts --harita <json> --cikti <dizin> --inceleme`
- Denetim  : `Workflow({scriptPath: "<scratchpad>/denetim-hat.js", args: {kok, dosyalar}})`
- Topla    : `sonuc-topla.py <journal.jsonl> "" <sonuc.json>`
- Yayinla  : `denetim-yayinla.ts --sonuc <sonuc.json> --yaz`
- Eleme    : `kuyruk-arsivle.ts --id <8hane> --gerekce "..." --yaz`  (kusurlu/belirsiz)

## DEGISMEZ KURALLAR

- Supabase havuzu 15 baglanti: DB betikleri SIRALI ve `connection_limit=1` ile.
  Alt ajanlar DB'ye ASLA dokunmaz, script CALISTIRMAZ.
- AI soru uretimi yasak. Yalnizca kitaptaki gercek sorular.
- `kusurlu` cikan soru otomatik uygulanmaz; `belirsiz` de yayina alinmaz.
- Her parti kendi commit'ini alir; gunluge tek satir yazilir.
