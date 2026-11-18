# Hakem talimatı — Silah Bilgisi destesinde denetçi bulgularını karara bağla ve düzelt

Bir deste iki bağımsız denetçiden geçti (A: pasaja sadakat, B: kart kalitesi). Sen hakemsin: her bulguyu pasaj
metnine bakarak karara bağlar, desteyi düzeltir, mekanik kapıyı yeniden çalıştırır ve denetim raporunu yazarsın.
Denetçi talimatı (kusur sınıfları S1–S11): aynı klasördeki `sil-TALIMAT-DENETIM.md` — önce onu oku.

## Karar kuralları

1. Her bulgu için pasaj metnini (girdi dosyasındaki `articles`) kendin oku. Denetçi haklıysa düzelt; haksızsa reddet
   ve gerekçesini rapora yaz. İki denetçi çelişiyorsa pasaj metni belirler.
2. Düzeltme yalnız referans pasajlarda yazana dayanır. S9 (kaynak hatası şüphesi) işaretli kart, şüpheli sayı/ölçü/
   tarihi TAŞIMADAN pasajda duran başka bir bilgiyle yeniden kurulur ya da çıkarılır. Ne kaynaktaki ne de denetçinin
   "bildiği" değer karta yazılır. Model/yıla göre değişen teknik veri (kapasite, uzunluk, menzil, ağırlık, ilk hız,
   atış sürati) yalnız bankada açıkça soruluyorsa, model adı ön yüzde olmak ve denetçi A somut bir çelişki
   bulmamış olmak şartıyla kalır; aksi hâlde çıkar.
3. S4 (mevzuat), S11 (zararlı ayrıntı): her zaman çıkar. S10 (sınav değeri düşük): cömert ol, çıkar; ama bankadaki
   sorularda açıkça sorulan bilgi S10 sayılmaz.
4. S8'de kart dili güncel ve sade Türkçe olmalı; kaynağın yazım bozuklukları karta taşınmaz, anlam korunur.
5. Kart biçimi: `back` kısa cevap (≤400 karakter), `explanation` isteğe bağlı (≤1200), `articleRefs` pasaj numaraları
   (girdi `articles[].no` ile birebir). Cevap ve açıklamadaki her sayı referans pasajın metninde geçmeli; tuzak
   kartındaki yanlış sayı `counterNumbers`'a yazılır ve referans metninde geçmemeli. Aynı arka yüze giden iki kart
   olamaz.
6. Kart eklemek serbest değil: yalnız denetçi B'nin NOTLAR'ında "sık sorulan ama kartı yok" dediği ve pasaj
   metninde açıkça duran bilgi için en çok 3 kart ekleyebilirsin (aynı kurallarla; kaynak cümlesini kopyalama).
7. Kartların SIRASINI koru (çıkarılanlar hariç); raporda kart numaraları üretim sırasına (düzeltme öncesi) göredir.

## Adımlar

1. Desteyi düzelt (JSON'u doğrudan düzenle; `deck` başlığına dokunma).
2. Mekanik kapı:
   `cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && npx tsx scripts/kart-dogrula.ts <deste.json> --md > <scratch>/<slug>.md; head -1 <scratch>/<slug>.md; grep "✗" <scratch>/<slug>.md`
   (`<scratch>` sana verilen geçici klasördür.) Çıktı boş gelirse ya da "Can't reach database server" görürsen
   birkaç saniye bekleyip yeniden dene. İlk satır "… geçti" olana kadar düzelt. Geçince çıktıyı
   `<deste yolu, .json yerine>.dogrulama.md` olarak kaydet. `.env` içeriğini okuma, yazdırma; yalnız `source` et.
3. Raporu yaz: `/Users/ahmetcnd/Developer/paemisyon/docs/56-bilgi-kartlari/denetim/<slug>.md`. İlk satır tam olarak
   `KARAR: GEÇTİ` (mekanik kapı geçtiyse ve açık CONFIRMED kusur kalmadıysa; aksi hâlde `KARAR: KALDI` ve nedeni).
   Sonra: başlık (`# Denetim — <slug> (<n> kart, Silah Bilgisi kaynak pasajı <pasaj aralığı>)`), tarih (17 Kas 2026),
   üretim ve son kart sayısı, hat özeti (Denetçi A + Denetçi B bağımsız alt ajan, hakem ayrı alt ajan), ardından
   tablolar:
   - "Kaynak hatası şüphesi (S9)": pasaj, kaynaktaki ifade, bilinen/şüphe, yapılan.
   - "Düzeltmeler": `| # | Sınıf | Hakem (CONFIRMED/PLAUSIBLE/RET) | Sorun | Yapılan |`
   - "Reddedilen bulgular" (varsa, gerekçeyle).
   - "İnsan incelemesine kalanlar": yayın kararını verecek kişinin bilmesi gerekenler; bankada sık sorulan ama
     kaynakta olmayan bilgi ("kaynak eksiği").
   Sade yaz.
4. Başka dosyaya dokunma; git komutu çalıştırma; veritabanına yazan betik çalıştırma (yalnız `kart-dogrula.ts`).

Son mesajında yalnız şunu bildir: karar, üretim → son kart sayısı, çıkarılan kart numaraları ve nedenleri (birer
sözcük), S9 nedeniyle çıkarılan ya da yeniden kurulan kartlar, insan incelemesine kalan en önemli 1–3 nokta.
