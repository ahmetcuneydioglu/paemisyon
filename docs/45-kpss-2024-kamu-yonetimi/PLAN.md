# Doc 45 — 2024 KPSS Kamu Yönetimi alan sınavı

**Sonuç: 17 soru onay kuyruğunda, 2 soru mevzuat değişikliği yüzünden elendi.**
12 Eylül 2026.

## Kaynak

`KPSS 2024 Kamu Yönetimi.pdf` — 2024 KPSS A Grubu Kamu Yönetimi alan sınavının
40 sorusu. Uygulamadan çekilmiş ekran görüntüleri; **metin katmanı yok**, her
sayfada bir soru ve altında basılı cevap anahtarı, ortada ÖSYM filigranı.
Doc 44'ün (2024 Hukuk) ikizi bir dosya.

## Kapsam

| | Soru |
|---|--:|
| Sınavdaki toplam | 40 |
| Siyasi düşünceler / siyaset bilimi (1–8) | 8 |
| Yönetim bilimi kuramı (15–19) | 5 |
| Kentleşme ve çevre (31–36) | 6 |
| Mükerrer (11, 14) | 2 |
| Hatta alınan | 19 |
| **Bankaya yazılan** | **17** |

Ölçüt Doc 42'den aynen alındı: siyasi düşünceler tarihi, siyaset bilimi
metodolojisi, yönetim bilimi kuramı ve kentleşme/çevre müfredat dışıdır;
Anayasa, mevzuat ve İnkılap Tarihi alınır. Kırk sorunun her biri için gerekçe
`kapsam.json`'da.

**Mükerrer elenenler:** s14 (MGK'ya Cumhurbaşkanının yokluğunda başkanlık) —
bankada aynı soru İKİ kez var, ikisi de yayında. s11 (AYM ret kararı, 10 yıl) —
bankadaki soru aynı olguyu aynı değerle soruyor, yalnız çeldiricileri farklı.

s21 önce mükerrer sanıldı (bankada 4483 üzerine 33 soru var, biri tam bu
başlıkta); açılıp karşılaştırıldı, farklı soru çıktı ve alındı.

## Hat

1. **Tarama.** 40 sayfa macOS Vision ile Türkçe OCR'dan geçirildi ve çıkan
   kökler bankadaki bütün sorularla kelime örtüşmesine sokuldu. Kısa köklerde
   Jaccard yanıltıyor (s2 "liberalizmin unsurları" ↔ bankadaki "fişeğin
   unsurları"); eşiği geçen her aday elle açıldı.
2. **Transkripsiyon.** 19 sayfa 200 dpi'da render edildi, anahtar satırı
   kırpıldı. İki bağımsız ajan: **18/19 birebir aynı**, `okunamadi` 0.
3. **İnsan doğrulaması.** Tek ayrışma q20'deydi: bir ajan metnin başına
   kaynakta olmayan bir `[Görsel — …]` satırı eklemişti; t2 sadıktı. İkisinin
   de işaretlediği belirsizlik — filigranın kapattığı kelime — görüntüden elle
   doğrulandı: "Teşkilâtı Esasiye **kanununun** 91 inci maddesi". 19 cevap
   anahtarı tek görüntüde birleştirilip elle okundu ve OCR'la karşılaştırıldı,
   19/19 uyuştu.
4. **Mükerrer taraması.** Tam eş 0, yakın eş 1 (q21) — elle bakıldı, farklı.
5. **Kör çift denetim.** ONAY 15 · UYARI 3 · ÇELİŞKİ 1.
6. **Hakem.** Dört soru, iki hakem, **dördünde de tam uyum**.
7. **Açıklama.** 17 soruya 2026 hukukuna göre.
8. **Bankaya yazım.** 17 soru `in_review`,
   `sourceLabel = "2024 KPSS Kamu Yönetimi (ÖSYM)"`.

## Güncellik ekseni: iki soru bozulmuş

Doc 44'te (2024 Hukuk) hiç eskime çıkmamıştı. Aradaki fark konu: Kamu Yönetimi
soruları **teşkilat yapısına** dayanıyor, teşkilat ise Cumhurbaşkanlığı
kararnamesiyle değişiyor ve kararname sık değişiyor.

- **q26 — Cumhurbaşkanlığı ofisleri. ELENDİ.** 183 sayılı CBK (RG 28/3/2025)
  Dijital Dönüşüm, Finans ve İnsan Kaynakları ofislerini mülga etti; Yatırım
  Ofisi "Yatırım ve Finans Ofisi" oldu ve 1 sayılı CBK'nın Yedinci Kısım
  başlığı da buna çevrildi. Bugün Cumhurbaşkanlığına bağlı tek ofis odur.
  Soru "hangisi ofislerden biri **değildir**" dediği için dört şıkkı birden
  doğru hâle geldi. Düzeltilemez — şıkları yeniden yazmak gerekir.
- **q21 — 4483, soruşturma izni vermeye yetkili merciler. ELENDİ.** 7547
  sayılı Kanun md 8 (yür. 16/5/2025) 4483 md 3/1-(g)'deki "İdari İşler
  Başkanı" ibaresini "Genel Sekreteri" yaptı. E şıkkındaki unvan artık
  kanunda geçmediği için soru iki doğru cevaplı.

  **Kullanıcı kararı bekliyor:** iki hakem de aynı düzeltmeyi önerdi —
  E şıkkındaki unvanı "Cumhurbaşkanlığı Genel Sekreteri" yapmak. Bu aynı
  makamın kanunla değişen adı, içerik değişmiyor ve soru yeniden tek cevaplı
  oluyor. Ama Doc 38'de konan "şık değiştirmek soruyu yeniden yazmaktır"
  kuralı gereği ve Doc 40'taki p41/p37 emsaline uyarak UYGULANMADI.

## Hakem turunun kararları

- **q20 → TEMİZ.** Kök 1929 tarihli 1426 sayılı Vilâyet İdaresi Kanunu'nun
  tıpkıbasımını okutuyor; kanun mülga ama sorulan şey kanunun yürürlüğü değil
  "tevsi-i mezuniyet" kavramının bugünkü karşılığı (yetki genişliği, 1982 AY
  md 126/2). Kanun mevzuat.gov.tr'de bulunmadığı için bir hakem alıntıyı
  **TBMM Kanunlar Dergisi c.7**'den birebir doğruladı.
- **q28 → TEMİZ, doğru cevap D.** Denetçiler cevapta ayrışmıştı (d1=D, d2=B).
  İki hakem de güncel konsolide metinden doğruladı: 5393 md 74/3'teki izin
  mercii 7153 sayılı Kanun md 28 ile (29/11/2018) İçişleri'nden Çevre ve
  Şehircilik Bakanlığına çevrilmiş (dipnot 48); bugünkü adıyla Çevre,
  Şehircilik ve İklim Değişikliği Bakanlığı. ÖSYM anahtarı da D.

## Hatta yapılan değişiklik

`kpss-hakem-uygula.ts` yalnız `UYARI` kararlarını işliyordu; **`CELISKI` —
denetçilerin CEVAPTA ayrıştığı durum — hiç ele alınmıyordu** ve q28 sessizce
dışarıda kalacaktı. Artık çelişki de hakeme gidiyor, ama daha sıkı eşikle:
iki hakemin "TEMIZ" demesi yetmiyor, ikisinin de `dogruCevap` yazması, aynı
harfi yazması ve bu harfin anahtarla uyuşması gerekiyor. Biri şaşarsa soru
düşer.

Ayrıca karar dosyası adı `k-\d+-karar.json` kalıbına sabitlenmişti; parti
adları doc'tan doc'a değiştiği için `-karar.json` ile biten her dosyayı
okuyacak biçimde genelleştirildi.

## Hattın zayıf noktası

İkinci denetçi mevzuat.gov.tr'ye erişemedi (TLS zinciri) ve Lexpera ile resmî
ikincil kaynaklardan doğruladı. Sonucu birinciyle örtüştüğü için karar sağlam,
ama bu partide "iki bağımsız RESMÎ doğrulama" iddiası kurulamaz — iki eskime
de bu yüzden ayrıca elle teyit edildi. mevzuat.gov.tr'nin PDF ucu
(`MevzuatMetin/1.5.XXXX.pdf`) bu ortamda düzensiz davranıyor: bazen askıda
kalıyor, `curl -k --http1.1` ile ve HTML ucuyla
(`/anasayfa/MevzuatFihristDetayIframe`) çalışıyor. Sonraki partilerde
denetçilere bu iki yolu baştan söylemek gerekir.
