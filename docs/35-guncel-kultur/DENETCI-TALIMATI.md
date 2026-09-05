# Denetçi Talimatı — Doc 35, Güncel Bilgiler 2026

Sana **cevap anahtarı VERİLMEYECEK**. Her soruyu kendin çözeceksin ve cevabını
**birincil kaynaktan yeniden bulacaksın**. Amaç, üreten ajanın bulduğu olgunun
bağımsız olarak yeniden doğrulanabilir olduğunu göstermek.

## 0. MUTLAK KURALLAR

1. **Veritabanına yazma.** Salt okuma + tek çıktı dosyası.
2. **Cevap anahtarı dosyalarını AÇMA.** `*-anahtar.json` ve `arastirma/*.json`
   dosyalarına bakmak yasak — körlüğü onlar bozar.
3. **Hafızandan cevaplama.** Her cevap, bu turda AÇTIĞIN bir kaynağa dayanmalı;
   URL'sini yazacaksın. Kaynağı bulamıyorsan `dogrulanamadi: true`.
4. Uydurma tarih/sayı/isim yok.

## 1. Kaynak ölçütü

**Kabul edilen:** Resmî Gazete, kurum siteleri (tccb.gov.tr, mfa.gov.tr,
tuik.gov.tr, ssb.gov.tr, tua.gov.tr, bakanlıklar, valilikler), uluslararası
örgütlerin kendi siteleri (un.org, nato.int, unesco.org, nobelprize.org,
olympics.com, unfccc.int), ulusal ajanslar (AA, TRT).

**Kabul EDİLMEYEN:** sınav hazırlık siteleri, YouTube, blog, forum, sosyal
medya, wiki. Vikipedi yalnız BAŞKA bir resmî kaynağa götüren ipucu olarak
kullanılabilir; tek başına dayanak olamaz.

Bir olgu için **tek kaynak yetmez** ise (özellikle "ilk/en/tek" iddiaları,
sayılar, tarihler) ikinci bir kaynak ara. Bulamazsan güveni düşür.

## 2. Özellikle bak

- **Tarih kayması.** Olay 2025'te mi 2026'da mı? Duyuru tarihi ile gerçekleşme
  tarihi karışmış olabilir.
- **"İlk/en/tek" iddiaları.** Genelde abartılıdır; kaynağın gerçekten öyle
  dediğini gör.
- **Sayılar.** Nüfus, ihracat, kapasite, madalya — kaynaktaki rakamla birebir mi?
- **Henüz gerçekleşmemiş olaylar.** Bugün 5 Eylül 2026. Ekim-Aralık 2026'ya ait
  bir olay hakkında soru varsa bu bir hatadır.
- **Vefat iddiaları.** Yaşayan biri hakkında vefat bilgisi en ağır hatadır;
  kurum duyurusu ara.

## 3. Çıktı

`denetim/<alan>-d{1,2}.json`:

```json
[{"id":"gk-3","cevap":"C","guven":"yuksek|orta|dusuk",
  "kaynak":"NATO, 8 Temmuz 2026 zirve bildirisi",
  "kaynakUrl":"https://…",
  "gerekce":"kaynağın ne dediği, tek cümle",
  "dogrulanamadi":false,
  "uyari":"soruda kusur varsa (ikinci doğru şık, yanıltıcı kök, eskimiş bilgi); yoksa null"}]
```

Her soru için kayıt yaz, atlama. Cevabı bulamadıysan `cevap: null` +
`dogrulanamadi: true`.

## 4. Son cevabın

SADECE: dosya yolu · denetlenen soru · güven dağılımı · doğrulanamayan sayısı ·
uyarı sayısı. Soruları ve cevapları tekrarlama.
