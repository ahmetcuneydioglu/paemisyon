# Hakem talimatı — bilgi kartı destesinde denetçi bulgularını karara bağla ve düzelt

Bir deste iki bağımsız denetçiden geçti (A: maddeye sadakat, B: kart kalitesi). Sen hakemsin: her bulguyu madde
metnine bakarak karara bağlar, desteyi düzeltir, mekanik kapıyı yeniden çalıştırır ve denetim raporunu yazarsın.
Denetçi talimatı (kusur sınıfları K1–K10): aynı klasördeki `TALIMAT-KART-DENETIM.md` — önce onu oku.

## Karar kuralları

1. Her bulgu için madde metnini (girdi dosyasındaki `articles`) kendin oku. Denetçi haklıysa düzelt; haksızsa
   reddet ve gerekçesini rapora yaz. İki denetçi çelişiyorsa madde metni belirler.
2. Düzeltme, yalnız referans maddelerde yazana dayanır. Denetçinin "bildiği güncel değer"i ya da özgün metindeki
   anlamı karta YAZMA (K4 ve K9'da dayanak yoktur): kart ya çıkarılır ya da kusurlu/eskimiş yere dayanmayan, yine
   madde metninde duran bir bilgiye çevrilir.
3. K10 (sınav değeri düşük) bulgularında cömert ol: çıkar. Ama bankadaki sorularda (girdi `questions`) açıkça
   sorulan bir bilgi K10 sayılmaz.
4. K8'de kart dili güncel ve sade Türkçe olmalı; eski sözcükler ve bozuk çeviri kalıpları sadeleştirilir, anlam
   korunur. Organ adı güncellemesi yalnız karışıklık doğurmuyorsa ve bankadaki sorular o adı kullanıyorsa yapılır;
   bu durumda açıklamaya eski adı parantez içinde ekleme (kartta kaynak dili izi kalmasın).
5. Kart biçimi: `back` kısa cevap (≤400 karakter), `explanation` isteğe bağlı (≤1200), `articleRefs` madde
   numaraları (girdi `articles[].no` ile birebir, "Başlangıç" dahil). Cevap ve açıklamadaki her sayı referans
   maddenin metninde geçmeli; tuzak kartındaki yanlış sayı `counterNumbers`'a yazılır ve referans metninde
   geçmemeli, ama belgenin başka bir maddesinde geçmeli. Aynı arka yüze giden iki kart olamaz.
6. Kart eklemek serbest değil: yalnız denetçi B'nin NOTLAR'ında "sık sorulan ama kartı yok" dediği ve madde
   metninde açıkça duran bilgi için en çok 3 kart ekleyebilirsin (aynı kurallarla).
7. Kartların SIRASINI koru (çıkarılanlar hariç); raporda kart numaraları üretim sırasına (düzeltme öncesi) göredir.

## Adımlar

1. Desteyi düzelt (JSON'u doğrudan düzenle; `deck` başlığına dokunma).
2. Mekanik kapı: 
   `cd /Users/ahmetcnd/Developer/paemisyon/apps/api && set -a && source .env && set +a && npx tsx scripts/kart-dogrula.ts <deste.json> --md > /tmp/<slug>.md; head -1 /tmp/<slug>.md; grep "✗" /tmp/<slug>.md`
   Çıktı boş gelirse (veritabanı havuzu geçici hata verebilir) birkaç saniye bekleyip yeniden dene. İlk satır
   "… geçti" olana kadar düzelt. Geçince çıktıyı `<deste yolu, .json yerine>.dogrulama.md` olarak kaydet.
   `.env` içeriğini okuma, yazdırma; yalnız `source` et.
3. Raporu yaz: `/Users/ahmetcnd/Developer/paemisyon/docs/56-bilgi-kartlari/denetim/<slug>.md`. İlk satır tam olarak
   `KARAR: GEÇTİ` (mekanik kapı geçtiyse ve açık CONFIRMED kusur kalmadıysa; aksi hâlde `KARAR: KALDI` ve nedeni).
   Sonra: başlık (`# Denetim — <slug> (<n> kart, <belge> md …)`), tarih (17 Kas 2026), üretim ve son kart sayısı,
   hat özeti (Denetçi A + Denetçi B bağımsız alt ajan, hakem ayrı alt ajan), ardından tablolar:
   - "Resmî çeviri / baskı kusuru (K9) ve eskimiş hüküm (K4)": madde, sorun, yapılan.
   - "Düzeltmeler": `| # | Sınıf | Hakem (CONFIRMED/PLAUSIBLE/RET) | Sorun | Yapılan |`
   - "Reddedilen bulgular" (varsa, gerekçeyle).
   - "İnsan incelemesine kalanlar": denetçi NOTLAR'ından yayın kararını verecek kişinin bilmesi gerekenler; kartı
     olmayan ama bankada sık sorulan bilgi ("kaynak eksiği").
   Raporda kaynak sızıntısı yapma endişesi yok (rapor yalnız ekip içidir), ama sade yaz.
4. Başka dosyaya dokunma; git komutu çalıştırma; veritabanına yazan betik çalıştırma (yalnız `kart-dogrula.ts`).

Son mesajında yalnız şunu bildir: karar, üretim → son kart sayısı, çıkarılan kart numaraları ve nedenleri (birer
sözcük), K4/K9 nedeniyle çıkarılan ya da yeniden kurulan kartlar, insan incelemesine kalan en önemli 1–3 nokta.
