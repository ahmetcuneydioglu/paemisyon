# Hakem talimatı — yeni dört kanun destelerinde denetçi bulgularını karara bağla ve düzelt

Deste iki bağımsız denetçiden geçti (A: maddeye sadakat, B: kart kalitesi). Sen hakemsin: her bulguyu madde metnine
bakarak karara bağlar, desteyi düzeltir, mekanik kapıyı yeniden çalıştırır ve denetim raporunu yazarsın.
Denetçi talimatı (kusur sınıfları K1–K10): aynı klasördeki `KART-DENETIM.md (scratch klasöründe)` — önce onu oku.

## Karar kuralları

1. Her bulgu için madde metnini (girdi dosyasındaki `articles`) kendin oku. Denetçi haklıysa düzelt; haksızsa reddet
   ve gerekçesini rapora yaz. İki denetçi çelişiyorsa madde metni belirler.
2. Düzeltme yalnız referans maddelerde yazana dayanır. K4'te denetçinin "bildiği güncel değer" karta YAZILMAZ: kart
   ya çıkarılır ya da eskimeyen, yine madde metninde duran bir bilgiye çevrilir.
3. K10 bulgularında cömert ol: çıkar.
4. K8'de kart dili sade Türkçe olmalı; anlam korunur.
5. Kart biçimi: `back` kısa cevap (≤400 karakter), `explanation` isteğe bağlı (≤1200), `articleRefs` madde numaraları
   (girdi `articles[].no` ile birebir; "Geçici 1" dahil). Cevap ve açıklamadaki her sayı referans maddenin metninde
   geçmeli; tuzak kartındaki yanlış sayı `counterNumbers`'a yazılır, referans metninde geçmemeli ama kanunun başka bir
   maddesinde geçmeli. Kart metnine madde metninde geçmeyen bir kanun numarası yazma (kapı takılır). Aynı arka yüze
   giden iki kart olamaz; komşu destede (PVSK, 3201, 657) aynı bilgi varsa bu destedeki kart bekçiye özgü değilse çıkar.
6. Kart eklemek serbest değil: yalnız denetçi B'nin NOTLAR'ında "kartı yok" dediği ve madde metninde açıkça duran
   bilgi için en çok 3 kart ekleyebilirsin (aynı kurallarla).
7. Kartların SIRASINI koru (çıkarılanlar hariç); raporda kart numaraları üretim sırasına (düzeltme öncesi) göredir.

## Adımlar

1. Desteyi düzelt (JSON'u doğrudan düzenle; `deck` başlığına dokunma).
2. Mekanik kapı:
   `cd /Users/ahmetcnd/Developer/paemisyon-worktrees/doc57/apps/api && npx tsx --env-file=.env scripts/kart-dogrula.ts <deste.json> --md > <scratch>/<slug>.md; head -1 <scratch>/<slug>.md; grep "✗" <scratch>/<slug>.md`
   (`<scratch>` sana verilen geçici klasördür.) Çıktı boş gelirse ya da "Can't reach database server" görürsen birkaç
   saniye bekleyip yeniden dene. İlk satır "… geçti" olana kadar düzelt. Geçince çıktıyı `<deste yolu, .json yerine>
   .dogrulama.md` olarak kaydet. `.env` içeriğini okuma, yazdırma; yalnız `source` et.
3. Raporu yaz: `/Users/ahmetcnd/Developer/paemisyon-worktrees/doc57/docs/56-bilgi-kartlari/denetim/<slug>.md`. İlk satır tam olarak
   `KARAR: GEÇTİ` (mekanik kapı geçtiyse ve açık CONFIRMED kusur kalmadıysa; aksi hâlde `KARAR: KALDI` ve nedeni).
   Sonra: başlık (`# Denetim — <slug> (<n> kart, 7245 sayılı Kanun md …)`), tarih (23 Kas 2026), üretim ve son kart
   sayısı, hat özeti (kart-uret.ts → mekanik kapı + stil kapısı → Denetçi A + Denetçi B bağımsız alt ajan → hakem ayrı
   alt ajan), ardından tablolar:
   - "Eskimiş hüküm (K4) ve platform kaydı (K9)": madde, sorun, yapılan.
   - "Düzeltmeler": `| # | Sınıf | Hakem (CONFIRMED/PLAUSIBLE/RET) | Sorun | Yapılan |`
   - "Reddedilen bulgular" (varsa, gerekçeyle).
   - "İnsan incelemesine kalanlar": yayın kararını verecek kişinin bilmesi gerekenler.
   Sade yaz.
4. Başka dosyaya dokunma; git komutu çalıştırma; veritabanına yazan betik çalıştırma (yalnız `kart-dogrula.ts`).

Son mesajında yalnız şunu bildir: karar, üretim → son kart sayısı, çıkarılan kart numaraları ve nedenleri (birer
sözcük), K4/K9 nedeniyle çıkarılan ya da yeniden kurulan kartlar, insan incelemesine kalan en önemli 1–3 nokta.

## Bu tura özgü ekler (23 Kas 2026)

- Rapor başlığında kanun numarasını kendi destene göre yaz (4207 / 4250 / 5199 / 7258); "bekçi" ve 7245 örneklerini
  kendi destenin konusuna uyarla. Hat özeti: "alt ajan üretimi (kart-uret.ts istemi, API'siz kip) → stil kapısı +
  mekanik kapı → Denetçi A + Denetçi B bağımsız alt ajan → hakem ayrı alt ajan".
- Nominal TL tutarı içeren kart: tutarı çıkar (yaptırım türü + makam kalır) ya da kartı çıkar.
- Kalkmış kuruma (Tütün ve Alkol Piyasası Düzenleme Kurumu/Kurulu, Tekel, İnhisarlar İdaresi, Bakanlar Kurulu)
  dayanan kart ÇIKARILIR; güncel kurum karta yazılmaz.
- 5199'da ceza verme yetkisi: Bakanlık; mahallin en büyük mülkî amirine devredilebilir (md 25 → md 17). "Mülkî amir
  verir" diye kesinleştiren kart düzeltilir. Geçici 3'teki dolmuş altı aylık süreye dayanan kart çıkarılır.
- Deste dosyası `docs/56-bilgi-kartlari/uretim/<slug>.json`; doğrulama çıktısını `uretim/<slug>.dogrulama.md` olarak
  kaydet. Denetim raporu: `docs/56-bilgi-kartlari/denetim/<slug>.md`.
