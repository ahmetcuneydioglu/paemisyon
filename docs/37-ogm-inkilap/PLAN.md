# Doc 37 — OGM Materyal İnkılap Tarihi Partisi

Başlangıç: 8 Eylül 2026 · Kaynak: MEB **OGM Materyal** soru bankasından
yazdırılmış 10 soruluk test (`ogmmateryal.eba.gov.tr`, id 251…22683).
Ders: Atatürk İlkeleri ve İnkılap Tarihi.

Kullanıcı isteği: *"bu soruları in review'e alabilir misin. soruları incelesin
denetçi ve yanlış varsa tespit etsin ve açıklama oluştursun. ardından ben
onaylayacağım."*

## 0. Kaynak — metin katmanı SAĞLAM

Doc 34'ün aksine bu bir tarama değil, tarayıcıdan yazdırılmış PDF (Skia/PDF).
OCR hattı gerekmedi; `pdftotext` doğrudan çalıştı. İki tuzak vardı:

- **İki sütun.** `-layout` çıktısında yan yana duran iki farklı sorunun
  satırları birbirine giriyor. Çözüm: sütunları piksel olarak kırpmak
  (`-x 0 -W 300` / `-x 300 -W 300`), yani karışmayı kaynağında kesmek.
- **Yazdırma altbilgisi.** Sayfa dibindeki uzun URL tam sayfa genişliğinde tek
  bir "kelime"; sütun kırpması onu ikiye bölünce sağ yarısı, sağ sütundaki son
  şıkkın devamı gibi metne yapışıyordu (8. ve 10. soruda E şıkkına). Çözüm:
  gövdeyi `-H 790`'da kesmek — altbilgi y≈819, soru metni y≈721'de bitiyor.

`ogm-ayristir.ts` bu iki kesimi yapar ve yazmadan önce doğrular: sıra atlaması,
eksik şık, kısa kök, eksik/fazla anahtar, metne karışmış altbilgi. Sorun varsa
dosya ÜRETMEZ — yarım parti üretmek, yanlış anahtarla soru yazmaya giden yoldur.

Sonuç: **10 soru · 10 anahtar · 0 sorun.**

## 1. Mükerrer taraması

`ogm-mukerrer-tara.ts` iki tur çalışır:

- **Tam eşleşme** — `questionFingerprint` (bankanın kendi parmak izi).
- **Yakın eşleşme** — bu parti hazır bir soru bankasından geliyor ve klasik
  ders kitabı soruları bankada başka bir dizgiyle durabilir. İnkılap Tarihi
  sorularıyla kelime kümesi benzerliği (Jaccard ≥ 0,55) ölçülür. Eşiği aşan
  SİLİNMEZ, insana gösterilir.

Sonuç: tam eşleşme 0, yakın eşleşme 0 → **10 aday**.

## 2. Kör çift denetim

İki bağımsız denetçi, cevap anahtarını görmeden (`parti/ogm-1-kor.json`) her
soruyu kendi çözer. Talimat: `DENETCI-TALIMATI.md`.

Bu partinin Doc 34'ten farkı: **eskime ekseni yok** (tarih sorusu eskimez),
onun yerine **anahtar tartışması** var. MEB'in anahtarı burada bir veri, kutsal
bir doğru değil. İnkılap Tarihi'nde iki soru tipi kronik olarak tartışmalıdır:
ilke eşleştirme ("bu söz hangi ilkeyle ilgilidir" — iki ilke birden
savunulabilir) ve kök-şık uyuşmazlığı (kökteki tanım, doğru şıkkın gerçekte
düzenlediği konuyu karşılamıyor).

`ogm-denetim-birlestir.ts` kararı üretir:

| Karar | Anlamı | Bankaya |
|---|---|:--:|
| `ONAY` | iki denetçi + anahtar aynı, uyarı yok, güven yüksek | ✓ |
| `ZAYIF` | aynı, ama bir denetçinin güveni düşük | ✓ |
| `UYARI` | aynı, ama soruda kusur bildirilmiş | ✗ |
| `ANAHTAR-SUPHELI` | denetçiler hemfikir, **anahtardan farklı** | ✗ |
| `CELISKI` | denetçiler birbirinden farklı | ✗ |

## 3. Denetim sonucu

| Karar | Soru | |
|---|--:|---|
| `ONAY` | 7 | s1 s2 s3 s6 s7 s8 s10 |
| `UYARI` | 2 | s4 (kök kusuru) · s9 (ikinci savunulabilir şık) |
| `CELISKI` | 1 | s5 (ilke eşleştirmesi tartışmalı) |
| `ANAHTAR-SUPHELI` | 0 | — |

Denetçiler **anahtarın hiçbirinde** yanılmadı: 10 sorunun 9'unda ikisi de MEB
anahtarını buldu. Ama üç soruda kusur çıkardılar ve **ikisinde birbirinden
bağımsız aynı kusuru** yazdılar — çift denetimin işe yaradığı yer tam burası:

- **s4 — Kabotaj.** Kök "kıta sahanlığını (deniz kıyı güvenliği) garanti altına
  alan yasa" diyor. 815 sayılı Kanun kabotaj hakkını, yani Türk limanları
  arasında taşımacılık ve liman hizmetlerini millî egemenliğe bağlar; kıta
  sahanlığı deniz yatağı ve toprak altı kaynaklarına ilişkin ayrı bir kavram ve
  Türkiye gündemine 1970'lerde girdi. Parantez içindeki "deniz kıyı güvenliği"
  tanımı da yanlış. Doğru şık değişmiyor — **kusur kökte.**
- **s9 — sağlık kurumları.** Anahtar C (Etfal Hastanesi, 1899 — Osmanlı), ama D
  şıkkındaki Sıhhiye Müdüriyet-i Umumiyesi de Osmanlı kurumu (1913, Dahiliye
  Nezareti). Cumhuriyet'in organı 3 Mayıs 1920'de kurulan Sıhhiye ve
  Muavenet-i İçtimaiye Vekâleti. "Yer almaz" ölçütünü **iki şık** karşılıyor.
- **s5 — Ankara'nın başkent oluşu.** Denetçiler ayrıştı: biri Milliyetçilik
  (anahtarla aynı), diğeri İnkılapçılık dedi. İkisi de sözün iki ilkeyle birden
  okunabildiğini yazdı. Kök zaten "daha çok" diyerek belirsizliği kabul ediyor.

Üçü de bankaya girmedi.

## 4. Bankaya yazım

`ogm-bankaya-yaz.ts` — `ONAY`/`ZAYIF` + açıklaması yazılmış sorular,
`status: in_review`. Konu: **Atatürk İlkeleri ve İnkılap Tarihi**
(`23d22785…`) — dersin tek konusu (bkz. §5).

`sourceLabel` bu partide **DOLU**: soru MEB'in açık soru bankasından geliyor ve
"her sorunun kaynağı bankada kayıtlıdır" kuralı bunu gerektiriyor. Etiket son
kullanıcıya gösterilmez (`SettingsService.showQuestionSource`, varsayılan
kapalı); yalnız admin panelde görünür.

Onay kullanıcıda: sorular admin panelin onay kuyruğuna düşer.

## 5. Yan iş — üç İnkılap konusu tek konuda birleşti (8 Eyl 2026)

Bu parti yazılacak konuyu ararken çıktı: **Atatürk İlkeleri ve İnkılap Tarihi**
dersinin altında neredeyse aynı adı taşıyan ÜÇ kök konu vardı.

| Konu | Ad | Soru |
|---|---|--:|
| `181c590f…` | Atatürk İlkeleri ve İnkılap Tarihi | 30 |
| `e699f23d…` | Atatürk İlkeleri ve İnkılap Tarihi | 161 |
| `23d22785…` | İnkilap Tarihi *(yazım hatası)* | 437 |

Sınavın kendi başlığı tek ve müfredat Trablusgarp'tan I. Dünya Savaşı'na tek bir
bütün; üçe bölünmüş konu ağacı kütüphaneyi, konu bazlı alıştırmayı ve
ilerleme/mastery kayıtlarını da üçe bölüyordu. Kullanıcı kararı: birleştir.

`inkilap-konu-birlestir.ts` en çok soruyu tutan konuyu HEDEF aldı (en az satır
taşınsın), adını düzeltti ve `e699f23d`'nin 26 `matchKeywords` birikimini
hedefe taşıdı.

**Kullanıcı verisi toplandı, silinmedi.** 39 kullanıcının birden fazla konuda
ilerlemesi, 98 (kullanıcı, hafta) çiftinin birden fazla mastery fotoğrafı vardı:

- `user_topic_progress`: solved/correct toplandı, `mastery = correct/solved` —
  `progress.service.ts`teki `ON CONFLICT` formülünün birebir aynısı.
- `topic_mastery_snapshots`: solved toplandı, mastery solved ile ağırlıklı
  ortalama. Snapshot'ta `correct_count` yok; ağırlıklı ortalama, mastery
  zaten `correct/solved` olduğu için o oranın **birebir** yeniden kurulmuş hâli.

Kaynak konular en son, satırları boşaldıktan sonra silindi — FK'ler `RESTRICT`
olduğu için gözden kaçan bir referans olsaydı silme hata verecek ve işlem geri
alınacaktı. Emniyet supabı script'te değil, veritabanında.

Doğrulama (yedekle karşılaştırmalı):

| | Önce | Sonra |
|---|--:|--:|
| ilerleme satırı | 121 | 65 |
| toplam çözülen / doğru | 776 / 447 | **776 / 447** |
| mastery fotoğrafı | 295 | 168 |
| benzersiz (kullanıcı, hafta) | 168 | **168** |
| konu | 3 | **1** |

`mastery = correct/solved` bağıntısı 65 satırın 65'inde tutuyor. Geri dönüş
yedeği repo DIŞINA yazıldı (kullanıcı verisi commit edilmez).
