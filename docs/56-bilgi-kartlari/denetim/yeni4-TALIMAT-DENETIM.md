# Bilgi kartı denetçi talimatı — yeni alınan dört kanun (4207, 4250, 5199, 7258) (Paemisyon Doc 56)

Bağlam: Polis amirliği sınavına (PAEM) hazırlanan adaylar için iki yüzlü bilgi kartları (ön yüz soru, arka yüz kısa
cevap, isteğe bağlı açıklama). Dayanak, kanunun mevzuat.gov.tr'deki KONSOLİDE RESMÎ METNİDİR (21/11/2024 tarihli ve
7533 sayılı Kanun değişiklikleri işlenmiş). Girdi dosyasındaki `articles`: `no` madde numarası, `title` madde başlığı,
`text` madde metni. Her kart `articleRefs` ile madde numarasına bağlıdır. Deste JSON: `{deck:{…}, cards:[{kind,
difficulty, front, back, explanation?, articleRefs, derivedNumbers?, counterNumbers?}]}`. Kart numarası = `cards`
dizisindeki 1 tabanlı sıra. Mekanik kapı (karttaki sayıların referans maddede geçmesi) zaten geçti; sen ANLAMI
denetliyorsun. Her bulguyu madde metninden alıntıyla kanıtla.

Bu kanunun maddelerine bağlı bankada soru yok (`questions` boş). Sınav değerini PAEM'in polis mevzuatı sorularının
genel tipine göre tart: görev ve yetkilerin sınırı (ne zaman, nerede, kime karşı), şartlar, süreler, yetkili makam.

## Kusur sınıfları

- K1 maddeyle çelişki: cevap ya da açıklama maddenin söylediğiyle çelişiyor (yanlış sayı, süre, yaş, makam, şart,
  istisna; iki maddenin ya da iki görevin özelliğini karıştırma; "yapar"ı "yapabilir" yapma ya da tersi; görev
  bölgesi / çalışma saati sınırını düşürme).
- K2 maddede olmayan iddia: referans madde(ler)de yazmayan olgu, sayı, yetki, şart, istisna, gerekçe, yorum. Genel
  bilgiden doğru olsa bile kusurdur (dayanak yalnız madde metnidir). Başka kanunun (2559 PVSK, 5271 CMK, 3201, 657,
  7068) içeriğini, madde metni yalnız ona ATIF yapıyorsa karta taşımak da K2'dir: kart "PVSK md 16'daki yetkiyi
  haizdir" diyebilir, o yetkinin içeriğini anlatamaz. "İlk", "tek", "en", "yalnız" nitelemeleri metinde aynı
  kapsamla yoksa kusurdur.
- K3 referans kusuru: iddianın dayandığı madde `articleRefs`'te yok (iddia destedeki başka maddede geçiyor), ya da
  referans verilen madde iddiayı taşımıyor.
- K4 işlemeyen/eskimiş hüküm: kart, sonradan değişmiş, iptal edilmiş ya da süresi dolmuş bir hükmü güncel bilgi gibi
  öğretiyor (ör. dolmuş geçiş süresi, 7533 öncesi düzen, Anayasa Mahkemesi iptali). Bildiğin güncel durumu ve neden
  eskidiğini yaz; emin değilsen PLAUSIBLE işaretle.
- K5 kusurlu tuzak: tuzak kartının yanlış öğesi kanunun hiçbir maddesinde geçmiyor (uydurma), ya da cevap düz "Evet"
  olup yanlış öğe içermiyor, ya da tuzağın olumsuz iddiası ("bekçi X yapamaz") madde metninden çıkarılamıyor
  (metnin bir yetkiyi saymaması, yasak olduğunu göstermez; yasak ancak metin açıkça söylüyorsa yazılır).
- K6 çift kart: aynı bilgiye giden ikinci kart. Destedeki bütün kart çiftlerini karşılaştır; ayrıca sana verilen
  KOMŞU DESTE dosyalarına (yayındaki PVSK, 3201, 657 desteleri) bak: aynı bilgi orada varsa bildir.
- K7 belirsizlik: ön yüz birden çok doğru cevaba açık; kimden söz edildiği ön yüzden anlaşılmıyor (deste karışık
  gösterilebilir: ön yüz "çarşı ve mahalle bekçisi" ya da "7245 sayılı Kanun" bağlamını taşımalı); kısmi liste tam
  liste gibi sunulmuş; koşulsuz Evet/Hayır; iki soru tek kartta.
- K8 üslup/dil: "şık", "çeldirici", "sorulursa hatırla" tarzı; olumsuz soru kalıbı; kart metninde "kaynakta",
  "metinde", "kanun metninde" gibi gönderme; kaynak cümlesinin aynen kopyalanması; gereksiz uzunluk.
- K9 PLATFORM KAYDI KUSURU ŞÜPHESİ: madde metninin kendisi bozuk görünüyor (başlık gövdeye ya da gövde başlığa
  kaymış, cümle yarıda, bir maddenin metni komşusuna yapışmış, dipnot gövdeye girmiş). Kart bu bozukluğa dayanıyorsa
  bildir.
- K10 sınav değeri düşük: Jandarma teşkilatına ÖZGÜ ayrıntı (PAEM polis amirliği sınavıdır; 7068 destelerinde de
  kullanıcı kararıyla yalnız EGM tarafı kartlandı — her iki teşkilatı birlikte anan ortak hüküm serbesttir),
  değiştirilen başka kanun hükümleri, yönetmelik çıkarma süresi gibi usul ayrıntısı, yürürlük/yürütme. (Öneri: çıkar.)

## Roller

**DENETÇİ A — maddeye sadakat (K1, K2, K3, K4, K9).** Her kartın arka yüzündeki ve açıklamasındaki HER iddiayı
(sayı, süre, yaş, makam, şart, istisna, sıra, niteleme, kip) referans maddenin metniyle tek tek karşılaştır. Maddede
olmayan ama genel bilgiden eklenmiş her şeyi yakala. Eskimiş hüküm (K4) için kendi bilgini kullan; somut ve emin
olduğun çelişkiyi yaz.

**DENETÇİ B — kart kalitesi (K5, K6, K7, K8, K10 ve gözüne çarpan K1).** Kartı bir aday gibi oku: ön yüz tek cevaba
mı gidiyor, bekçiden söz edildiği ön yüzden anlaşılıyor mu, dil sade mi, tuzaklar gerçek bir karışıklığa mı dayanıyor
(ör. bekçi yetkisi ile polis yetkisinin farkı), çift kart var mı (bütün çiftler + komşu desteler), bu bilgi sınavda
sorulur mu. Madde metninde açıkça duran ama kartı olmayan, sınav değeri yüksek bilgiyi NOTLAR'a madde numarasıyla yaz.

## Çıktı (yalnız bu biçim, Türkçe, başka metin yok)

```
DENETÇİ: <A|B> · DESTE: <slug> · KART: <n>
BULGULAR:
| # | Sınıf | Güven (CONFIRMED/PLAUSIBLE) | Sorun (maddeden alıntıyla) | Önerilen düzeltme (hazır metin ya da "çıkar") |
...
TEMİZ: <kusursuz kart numaraları>
NOTLAR: <insan incelemesine kalacak noktalar; yoksa "yok">
```

Kusur yoksa BULGULAR tablosu boş kalır. Deste dosyalarını DEĞİŞTİRME; yalnız oku ve raporu belirtilen yola yaz.
Git komutu ve veritabanına yazan betik çalıştırma. Son mesajında yalnız bulgu sayısını sınıf sınıf bildir.

## Bu tura özgü ekler (23 Kas 2026; yukarıdaki 7245'e özgü örneklerin yerine geçer)

- Desteler: 4207 (tütün), 4250 (alkollü içki), 5199 (hayvanları koruma, iki deste), 7258 (spor bahisleri). Dayanak
  mevzuat.gov.tr konsolide metnidir; "bekçi" örneklerini kendi destenin konusuna uyarla. Ön yüz kanunun adını ya da
  konusunu taşımalı (K7).
- **Nominal TL tutarı (K10-TUTAR):** kullanıcı kararıyla para cezası TUTARI kartlanmaz (yeniden değerlemeyle eskir);
  yaptırımın türü, cezayı veren makam, tekerrür artırımı, süreler kartlanır. Tutar içeren her kartı bildir.
- **K4 için bilinenler:** 4250 ve 7258 eski kanunlardır; İnhisarlar İdaresi, İcra Vekilleri Heyeti, Bakanlar Kurulu,
  Tütün ve Alkol Piyasası Düzenleme Kurumu (TAPDK, 2017'de kapatıldı; görevleri Tarım ve Orman Bakanlığına geçti)
  gibi kurumlar metinde durur. 7258'de mülga görünen maddeler hakkında Anayasa Mahkemesi kararı vardır (kartlanmaz).
  5199'da (…) ile gösterilen iptal boşlukları vardır.
- K10: Jandarma maddesi bu turda geçerli değil; K10 = yürürlük/yürütme, yönetmelik süresi, geçiş hükümleri, medya
  kuruluşlarına ve üretici firmalara özgü ayrıntılar (polis sınavı için değeri düşük), kurul oluşumunun üye listesi.
- Komşu deste: aynı kanunun öteki destesi (5199) ve yayındaki Kabahatler Kanunu desteleri verilirse onlara bak.
