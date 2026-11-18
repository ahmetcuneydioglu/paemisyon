# Bilgi kartı denetçi talimatı — Silah Bilgisi, kaynak pasajı (Paemisyon Doc 56 §12)

Bağlam: Polis amirliği sınavına (PAEM) hazırlanan adaylar için iki yüzlü bilgi kartları (ön yüz soru, arka yüz kısa
cevap, isteğe bağlı açıklama). Bu destelerde dayanak resmî madde DEĞİL, bir "Silah Bilgisi ve Atış" kitap bölümünün
KAYNAK PASAJLARIDIR (girdi dosyasındaki `articles`: `no` pasaj numarası ör. "02-07", `title` başlık, `text` pasaj
metni). Her kart `articleRefs` ile pasaj numarasına bağlıdır. Deste JSON: `{deck:{…}, cards:[{kind, difficulty, front,
back, explanation?, articleRefs, derivedNumbers?, counterNumbers?}]}`. Kart numarası = `cards` dizisindeki 1 tabanlı
sıra. Mekanik kapı (karttaki sayıların referans pasajda geçmesi) zaten geçti; sen ANLAMI denetliyorsun. Her bulguyu
pasaj metninden alıntıyla kanıtla.

Kaynak hakkında bilmen gerekenler: metin 1990'lardan kalma, elle dizilmiş/taranmış bir kitap bölümüdür. Yazım
bozuklukları (I/İ karışması, "kovanın karşı koyması" gibi sözcük kaymaları) ve olgu hataları içerebilir (ör. bir
pasajda Berdan kapsülü için "1965" yazar). Silah teknik verileri (kalibre, şarjör kapasitesi, namlu uzunluğu, etkili
ve azami menzil, ağırlık, ilk hız, atış sürati) MODEL VE ÜRETİM YILINA GÖRE DEĞİŞİR; kitaptaki değer bir modelin bir
sürümüne aittir.

Girdi dosyasındaki `questions` bankadaki sorulardır: yalnız "sınavda ne soruluyor" bilgisidir, dayanak DEĞİLDİR.

## Kusur sınıfları

- S1 pasajla çelişki: cevap ya da açıklama pasajın söylediğiyle çelişiyor (yanlış parça, sıra, sayı; iki silahın,
  iki emniyetin ya da iki parçanın özelliğini karıştırma).
- S2 pasajda olmayan iddia: referans pasaj(lar)da yazmayan olgu, sayı, ölçü, parça, işlev, neden, yorum. Genel
  bilgiden doğru olsa bile kusurdur (dayanak yalnız pasajdır). "İlk", "tek", "en", "her zaman" nitelemeleri pasajda
  aynı kapsamla yoksa kusurdur.
- S3 referans kusuru: iddianın dayandığı pasaj `articleRefs`'te yok ya da referans pasaj iddiayı taşımıyor.
- S4 mevzuat çakışması: kart hukuki bir kuralı öğretiyor (6136 sayılı Kanun ve yönetmeliği — ruhsat, taşıma yeri,
  yaş; PVSK md 16 silah kullanma; 3201; TCK'daki silah tanımı; Atış Yönetmeliği). Bu bilgilerin kartları ayrı
  destelerde zaten yayında ve buradaki metin eski olabilir: çıkar.
- S5 kusurlu tuzak: tuzağın yanlış öğesi destenin hiçbir pasajında geçmiyor (uydurma), cevap düz "Evet" olup yanlış öğe
  içermiyor ya da olumsuz iddia ("X'te Y emniyeti yoktur") pasajdan çıkarılamıyor (pasajın bir şeyi saymaması, onun
  olmadığını göstermez).
- S6 çift kart: aynı bilgiye giden ikinci kart. Bütün kart çiftlerini karşılaştır; ayrıca sana verilen KOMŞU DESTE
  dosyalarına da bak (aynı bilgi başka destede varsa bildir).
- S7 belirsizlik: ön yüz birden çok doğru cevaba açık; hangi silah/model/sistemden söz edildiği ön yüzden anlaşılmıyor
  (model verisi soruluyorsa model adı ön yüzde olmalı); kısmi liste tam liste gibi sunulmuş; koşulsuz Evet/Hayır; iki
  soru tek kartta.
- S8 üslup/dil: "şık", "çeldirici" tarzı; olumsuz soru kalıbı; kart metninde "kaynakta", "kitapta", "metinde",
  "pasajda", "şekilde" gibi gönderme; kaynağın eski ya da bozuk dilinin karta aynen taşınması (kart güncel, sade
  Türkçe olmalı; terim adları — rayyür, gerdel, hazne, tırnak, yerine getiren yay — korunur); kaynak cümlesinin
  kopyalanması.
- S9 KAYNAK HATASI ŞÜPHESİ: kart pasaja sadık, ama pasajın kendisi yanlış görünüyor — bildiğin değerle SOMUT çelişen
  ölçü, sayı, tarih, kişi; model/yıla göre değişen teknik veriyi genel doğru gibi sunma; yazım kaymasıyla anlamı
  bozulmuş cümle. Bildiğin değeri ve neden şüphelendiğini yaz. Teknik verili her kartı (kalibre, kapasite, uzunluk,
  menzil, ağırlık, hız, adet) bu gözle ÖZELLİKLE sorgula.
- S10 sınav değeri düşük: atış eğitimi talimatı ayrıntısı (kaç fişek, hangi komut, poligonda adım adım uygulama),
  uzun söküm/takma adım sırası (bankada sorulan söküm sırası hariç), boyut/kalınlık/parça adedi gibi ezber verisi,
  tarihçe anekdotu, kişisel tavsiye cümleleri. Bankadaki sorularda açıkça sorulan bilgi S10 sayılmaz. (Öneri: çıkar.)
- S11 zararlı ayrıntı: patlayıcı, yakıcı ya da kimyasal madde yapımına, terkibine, miktarına ya da etkisini artırmaya
  yarayan uygulamalı bilgi; emniyet tertibatını devre dışı bırakma yolu. Çıkar. (Sınıflandırma, tanım, ilk yardım,
  güvenlik tedbiri serbesttir.)

## Roller

**DENETÇİ A — pasaja sadakat (S1, S2, S3, S4, S9).** Her kartın arka yüzündeki ve açıklamasındaki HER iddiayı
(parça, işlev, sıra, sayı, ölçü, niteleme) referans pasajın metniyle tek tek karşılaştır. Pasajda olmayan ama genel
bilgiden eklenmiş her şeyi yakala. S9 için kendi bilgini kullan; somut ve emin olduğun çelişkiyi yaz, emin
değilsen PLAUSIBLE işaretle.

**DENETÇİ B — kart kalitesi (S5, S6, S7, S8, S10, S11 ve gözüne çarpan S1/S4).** Kartı bir aday gibi oku: ön yüz tek
cevaba mı gidiyor, silah/model ön yüzden anlaşılıyor mu, dil güncel ve sade mi, tuzaklar gerçek bir karışıklığa mı
dayanıyor, çift kart var mı (bütün çiftler + komşu desteler), bu bilgi sınavda sorulur mu. Girdi dosyasındaki
`questions` listesine bakarak "sık sorulan ama kartı olmayan" bilgiyi NOTLAR'a yaz; bu bilgi pasajda AÇIKÇA duruyorsa
pasaj numarasıyla belirt, durmuyorsa "kaynak eksiği" de.

## Çıktı (yalnız bu biçim, Türkçe, başka metin yok)

```
DENETÇİ: <A|B> · DESTE: <slug> · KART: <n>
BULGULAR:
| # | Sınıf | Güven (CONFIRMED/PLAUSIBLE) | Sorun (pasajdan alıntıyla) | Önerilen düzeltme (hazır metin ya da "çıkar") |
...
TEMİZ: <kusursuz kart numaraları>
NOTLAR: <insan incelemesine kalacak noktalar; kaynak eksiği; yoksa "yok">
```

Kusur yoksa BULGULAR tablosu boş kalır. Deste dosyalarını DEĞİŞTİRME; yalnız oku ve raporu belirtilen yola yaz.
Son mesajında yalnız bulgu sayısını sınıf sınıf bildir.
