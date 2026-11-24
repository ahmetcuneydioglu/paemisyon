# Sınav Kalitesi Gözcüsü (dördüncü rol — 12 Kas 2026, kullanıcı talebi)

Kullanıcı: "soru kalitesi için ayrı bir gözcü oluşturalım." Bu gözcü mevzuat,
kalite ve dil gözcülerinden BAĞIMSIZDIR; onların dosyalarını görmez. Rolü bir
**PAEM sınav komisyonu üyesi + iyi hazırlanmış bir aday** gibi davranmaktır.

## İki aşama

### Aşama 1 — Kör çözüm (cevabı görmeden)
`kor/<parti>.json` dosyasında sorular cevapsız ve açıklamasız durur. Her soruyu
madde metnine (mevzuat/<kanun>.txt) bakmadan, önce sınavdaki bir aday gibi çöz;
sonra madde metnini açıp kendi cevabını kontrol et. İkisini de kaydet:
- `korCevap`: metne bakmadan verdiğin cevap
- `metinCevap`: metni okuduktan sonra doğru bulduğun cevap
Ancak İKİ AŞAMA BİTTİKTEN SONRA `aday/<parti>.json`'daki anahtarı aç ve karşılaştır.
- `metinCevap` ≠ anahtar → anahtar şüpheli ya da soru iki cevaplı → RED
  (gerekçede iki okumayı yaz).
- `korCevap` = anahtar ve bunu yalnız şıklardan çıkarabildiysen (madde bilgisi
  gerekmeden; ör. şık uzunluğu, kelime yankısı, tek farklı üslup, sağduyu) → ipucu
  var → REVIZYON ya da RED.

### Aşama 2 — Sınav düzeyi değerlendirmesi
Her soruya `stil-cikmis.txt`'teki gerçek sorularla yan yana bakarak puan ver:
- `sinavDegeri` (1–5): Bu hüküm, bu açıdan PAEM'de sorulur mu? (5 = çıkmış soru
  düzeyi, 3 = sorulabilir, 1–2 = sorulmaz)
- `ayirtEdicilik` (1–5): Hükmü bilenle bilmeyeni ayırır mı? Çeldiriciler hazırlıklı
  ama eksik bilen adayı yakalar mı? (1 = bilmeyen de bulur)
- `zorluk`: gerçek zorluk (easy/medium/hard) — üreticinin etiketiyle uyuşmuyorsa yaz.
- `dogallik` (1–5): gerçek bir sınav sorusundan ayırt edilemez mi?

Karar:
- Üç puandan biri 3'ün altındaysa RED.
- Biri tam 3 ise REVIZYON — somut yeniden yazım önerisiyle (hangi çeldirici neyle
  değişsin, kök nasıl kısalsın).
- Parti geneli: zorluk dağılımı (~1/4 kolay, 1/2 orta, 1/4 zor), aynı hükmün
  tekrarı, aynı kalıbın (ör. hep "hangisi yanlıştır") yığılması.

## Çıktı
`denetim/<parti>-sinav.json` — her aday için bir satır:
`{"id","karar":"ONAY|REVIZYON|RED","korCevap","metinCevap","sinavDegeri","ayirtEdicilik","dogallik","zorluk","gerekce","oneri"}`
Son raporun kısa: karar sayıları, kör çözümde anahtarla ayrışan sorular, ipucu
yüzünden bilmeden bulunan sorular, zorluk dağılımı.

## Orkestratör kuralları (18 Kas 2026 dersleri)
- Sınav gözcüsüne giden istemde hiçbir sorunun anahtarı, doğru şık harfi ya da doğru
  şıkkın içeriği yazılmaz; "üreticinin bildirdiği riskler" de anahtarı ele vermeden
  aktarılır. 18 Kas 2026'da bu kural iki kez çiğnendi (atama-p2 birinci tur 04/12;
  ikinci tur istemleri); gözcüler fark edip kör çözümü geçersiz saydı.
- İkinci turda, gözcünün kendi önerdiği biçimde yeniden yazılan soruda kör çözüm
  anlamsızdır: gözcü anahtarı bilir. Bu sorularda "madde bilgisi olmayan aday"
  canlandırılır ve bu açıkça yazılır; gerçek kör çözüm gerekiyorsa yeni bir gözcü kullanılır.
- Gözcü REVIZYON gerekçesinde hükmün kendisinin sınav değeri düşük dediyse (ör. şirket
  idari ayrıntısı) yalnız biçim değişikliği (boşluk doldurmaya çevirme vb.) sınav
  değerini yükseltmez; hüküm değiştirilir ya da soru bırakılır (5188-p1-03).
- Sınav gözcüsü her yeni parti için TAZE ajandır (o mevzuatın metnini daha önce okumuş bir
  gözcü artık "madde bilgisi olmayan aday" değildir). Okuma sırası: önce bu brif,
  stil-cikmis.txt ve genel ölçüler (analiz/rapor-polis-mevzuati.md) → kör çözüm ve not →
  ANCAK SONRA mevzuata özgü değer taşıyan dosyalar (tur eki, personel raporu) → metin →
  aday dosyası. 19 Kas 2026 ikinci dalgasında bu sırayla iki gözcünün kör çözümü temiz kaldı.
- Gözcünün önerdiği yeniden yazımı aktarmadan önce orkestratör önerinin doğal okumasını
  denetler: sıkıştırılmış ad öbeği anlamı kaydırabilir ("annesine vasi tayin edilmiş tek
  çocuk" = annesine vasi atanmış çocuk → atama-p3-01 RED); belirsizliği kökte bir koşulla
  kapatmak yeni bir sağduyu kestirmesi açabilir (atama-p3-06 RED).

## Orkestratör kuralları (19 Kas 2026 dersleri — 5607/1774/5726 turu)
Bu turda yedi RED'in beşi ikinci turda, birinci tur önerilerinden birleştirilen yeniden
yazımlardan çıktı. Orkestratör yeniden yazımı üreticiye göndermeden önce şunları denetler:
- Yeni çeldirici başka bir şıkla tek bir sezgi altında birleşmemeli ("tedbirin kaldırılmasını
  istemesi" + "koruma sebebinin ortadan kalkması" = "kusur yoksa rücu yok"; 5726-p1-04).
- Doğru şık, sorunun kategori sözcüğünü yankılamamalı ya da açık uçlu bir kayda dayanmamalı
  ("yakın ilişki içinde olanlar … yakınları arasında sayılır"; 5726-p1-07).
- "YANLIŞTIR" sorusunda yanlış önerme doğru önermelerden biriyle çelişmemeli (1774-p1-06).
- Aynı bendin iki yarısı iki ayrı şık olmamalı: 2+2+1 düzeninde çiftler birlikte düşer
  (5607-p1-05); anlam kümeleri sağduyuyla birleşince de aynı kestirme doğar (5607-p1-03).
- Öncüllü soruda doğru bileşim en sık geçen öncüllerden oluşmamalı ya da yanlış öncül
  sağduyuyla düşmemeli (5607-p1-08).
- İkinci turda sınav gözcüsü anahtarları bildiği için düzeltilen sorular TAZE bir kör çözücüye
  verilir: okuduğu yalnız bu brif, `stil-cikmis.txt`, `analiz/rapor-polis-mevzuati.md` ve
  `kor/<parti>.json`; her soru için "genel bilgiyle" ve "salt şık + sağduyuyla" iki ayrı güven
  yazar, ONAY/RED vermez. Sınav gözcüsü önce kendi canlandırılmış çözümünü nota ekler, sonra
  çözücünün notunu okur ve kararı verir (5607-p1-03 ve -08 RED'i bu kanıttan çıktı).
- Orkestratör adayı gözcülere vermeden önce her sorunun hükmünü analiz raporunun §6
  "Kaçınılacaklar" listesine karşı da denetler (1774-p2-01: md 11/2 listede adıyla geçiyordu).
- "YANLIŞTIR" sorusunda doğru önermeler birbirini varsaymamalı ya da sıra oluşturmamalı
  (alıkoyma → teslim, satış → iade): bu çiftler birlikte doğru sayılır ve yanlış önerme tek
  kalır (5607-p2-01, taze kör çözücü bulgusu).

## Orkestratör kuralları (20 Kas 2026 dersleri — 6698/7245/1481 turu)
Bu turda dört RED orkestratörün birleştirdiği yeniden yazımlardan çıktı (6698-p1-02, -08, 7245-p1-05)
ya da bankadaki komşu kanun sorusu gözden kaçtı (7245-p1-06). Orkestratör yeniden yazımı göndermeden önce:
- Bütün şıkların sezgisel TEMASINI tek tek yazar; iki yanlış şık aynı temayı taşımaz. "Veri güvenliği
  uygulanmaz" + "işleme şartları uygulanmaz" → "istisna temel güvenceleri kaldırmaz" (6698-p1-02);
  "ticari amaç" + "tüzel kişi" → "Kanun şirketlere uygulanır" (6698-p1-08). "Hangi hüküm uygulanmaz"
  sorusunda çeldirici, istisnada sayılmayan ama biçimsel yük gibi görünen hükümlerden seçilir
  (6698'de 12/5 ihlal bildirimi, 15/3 belge gönderme).
- Bileşik "sırasıyla" sorusunda tek şık değiştirmek "2×2 + 1" yapısını bozmaz. Metinde yalnız iki
  merci varsa üçüncü değer iki şıkta geçer ve hiçbir 2×2 alt ızgara kalmaz (7245-p1-04: "Kaymakam –
  Vali" / "Vali – Kaymakam" ile kuruldu, KABUL).
- İç içe kümeli şıklar ("X ve üstü" eşikleri) iki doğru doğurur; "ölçütü" kökü bunu kapatır ama
  cevap "en alttaki her üstün altındadır" sezgisiyle bulunuyorsa biçim kurtarmaz; rütbe dışı ölçüt
  taşıyan iki şık da birlikte düşer (7245-p1-05).
- Gözcünün önerdiği yeni doğru önerme metne karşı sınanmadan aktarılmaz: 7245-p1-05 için önerilen
  "bağlı olunan personel yetkilendirilmemişse amir sayılmaz" önermesi, 2/2'deki amir ibaresinin
  7068 md 3/a'daki iki ayrı grup okumasında yanlıştı; aktarılmadı.
- Aynı cümleyi taşıyan kanunlarda (7245 md 11 = PVSK md 4) yalnız doğru şık değil, YANLIŞTIR
  sorusunun yanlış önermesi de komşu kanunun bankadaki çeldiricisiyle karşılaştırılır (7245-p1-06:
  "olağanüstü hâllerde başka işte" çeldiricisi bankadaki PVSK md 4 sorusunda var; RED).
- Sınav gözcüsü istemine örnek sezgi yazılırken partinin bir şıkkına denk gelen sezgi yazılmaz
  (1481-p1-02'de "kolluğa ateş edene ihtarsız" örneği bir yanlış şıkkı işaret etti; gözcü kör
  çözümünü tam temiz saymadı). Yalnız genel sezgi tipleri ("varsayılan merci", "en hafif işlem")
  yazılır.
- Taze kör çözücünün kestirmeleri yanlış şıkka gidiyorsa bu soru LEHİNE kanıttır (7245-p1-01, -04;
  1481-p1-02 bu kanıtla KABUL aldı).

## Orkestratör kuralları (21 Kas 2026 dersleri — 5233/2860/5253 turu)

**Kör çözücü istemi**
- İkinci tur kör çözücü istemine şıklara denk gelen örnek sezgi yazılmaz.
- Bir şıkkın doğruluk değerini ima eden soru da yazılmaz ("X'i bilen aday hangi önermeyi yanlış SANAR?", "istisnayı bilmeyen aday …").
- Bu turda yaşanan:
  - 2860 ve 5233 istemlerinde "TCK'yı bilen aday hangi önermeyi yanlış sanar", "Devleti koruyan kural" ve "zarar parayla ödenir" geçiyordu.
  - Çözücüler bunu fark edip beyan etti. Sınav gözcüleri kirliliği yönüyle tartmak zorunda kaldı.
- Yazılacak olan yalnız genel kestirme türleridir: kesişim, en sık değer, ikiz şıklar, ızgara ve köşe, kök yankısı, tek farklı üslup, varsayılan merci. 5253-p1 istemi örnektir.
- Birinci tur gözcülerinin bulduğu sezgiler istemde örnek olarak verilmez; kör çözücü onları kendisi bulmalıdır.

**Bileşik takım ve ızgara kuralı**
- Gözcünün önerdiği bileşik "sırasıyla" takımı orkestratör ızgara kuralına karşı saymadan aktarmaz.
  - 5253-p1-07: sınav gözcüsünün "isteyen – atayan" önerisi tam 2×2 + 1 ızgaraydı (10-ek RED dersi 3).
- Bir konumda yalnız iki değer varsa ve öbür konumdaki iki değer ikişer şıkta geçiyorsa, tam 2×2 kaçınılmazdır.
  - Çözüm: üçüncü bir değer ya da iki konumda birden geçen ortak değer kullanmak.
  - 07'de İçişleri Bakanı iki konumda geçti. Tek tekil değer metindeki gerçek aktördü (Cumhuriyet savcısı, 19/7). "Yargı atar" sezgisi yalnız bir şıkkı eledi.
  - Mevzuat, kalite ve dil gözcüleri ONAY verdi.

**Tek şık değiştirirken eksen haritası**
- Değiştirilen tek şık, kalan bir yanlış şıkla aynı eksenin karşı ucunu kurmamalıdır.
  - 5233-p1-05: yeni E ("birini seçer") ile B ("mahsup edilmez") "çifte tazmin" ekseninin iki ucu oldu. Doğru orta yol ("mahsup edilir") şıklarda yoktu. "Çifte tazmin olmaz" sezgisi ikisini birlikte düşürdü (RED).
- Yeni şık yazılmadan önce kalan şıkların eksenleri çıkarılır.
- Bir eksenin iki ucu iki ayrı yanlış şıkta duruyorsa, o eksenin doğru değeri şıklarda olmalıdır. Olmalı ki ya o doğru şık olsun ya da hiçbiri doğru olmasın.

**Kökün cevabı çağırması**
- Kökü cevabın kategorisini çağıran bir koşulla kilitlemek kestirme açar (atama-p3-06 dersinin tekrarı).
  - 2860-p1-02: "il merkezi dışındaki tek bir ilçede izinle" → kaymakam. "İzni veren cezayı da verir" sağduyusu da bunu destekledi.
- Belirsizliği kökte kapatmak gerekiyorsa, koşul şıklardan en az ikisini birlikte desteklemelidir.

**Genel hukuk bilgisinin karşıladığı hükümler**
- "Erişim engeline hâkim karar verir" (2860 6/3) ve "bağış amacı korunur" (2860 md 25) gibi hükümler, yalnız kanuna özgü unsur şık takımında sınanırsa soru olur.
  - 6/3'e özgü unsur: bilgi edinilemezse yirmi dört saat beklenmez.
  - md 25'e özgü unsur: devri izin veren makam yaptırır.
- Bu unsurun şıklardan biri de sağduyuyla düşüyorsa, soru ters ayırt eder.

**Banka metninde görünmeyen iptaller**
- Analistin "Metnin durumu" tablosunu tur ekinde ayrı bir bölüme ("Bu turun özel tuzağı") taşımak işe yaradı.
- Bunu üretici ve gözcü istemlerinin her birinde tekrarlamak da işe yaradı.
- Sonuç: 19 adayın hiçbiri iptal edilmiş hükme (5253 10/1 parti yönü, 30/A, 2860 md 10 uzatma sınırı, 5233 6/1 mirasçı) dayanmadı.
- Dipnotsuz kanunlarda bu düzen sürer.

**Gözcü yarıda kalırsa (22 Kas 2026)**
- İkinci turda sınav gözcüsü bir API hatasıyla yarıda kalırsa, eski ajana yeniden mesaj atılmaz. Anahtarları görmemiş TAZE
  bir gözcü başlatılır. Taze gözcü canlandırılmış değil, gerçek bir kör çözüm yapar; bu daha güçlü bir kanıttır.
- Taze gözcünün istemine anahtar, değişiklik listesi ya da şık değeri yazılmaz.
  - Birinci turdan bu yana değişenler ayrı bir dosyaya konur: `scratchpad/sinav2-<parti>-degisiklikler.md`.
  - Gözcü bu dosyayı kör çözümden ve metinle çözümden sonra, aday dosyasıyla birlikte açar.
- Brifte ya da tur ekinde aynı partinin şık yapısını anlatan bir bölüm varsa, o bölüm de kör çözümden sonra okunur.
  - Örnek: bu brifin 21 Kas bölümündeki 5253-p1-07 notu, şıklardaki ortak ve tekil değerleri anlatıyordu.
  - Parti kapanmadan brife o partinin şık ayrıntısını yazmamak daha iyidir.
- Taze gözcü kör notunu yeni bir dosyaya yazar ve birinci turun kör notunu açmaz.
- Örnek: 5253-p1'de ilk deneme safeguards hatasıyla durdu. Taze gözcü altı soruya ONAY verdi; kendi kör çözümü dört soruda
  anahtardan ayrıştı.

## Orkestratör kuralları (22 Kas 2026) — 6458/3071/7201 turu
1. **İkizi ya da kesişimi kırarken doğru şıkkın iki yanına aynı eksenin iki ucunu koyma.** 6458-p2-03'te iki çeldirici
   değişti: A "başvuru gözaltıyı bitirir", E "gözaltı başvuruyu bekletir". İkisi bir eksenin karşıt uçlarıydı; doğru şık
   "orta yol" oldu ve taze kör çözücü onu salt şıkla yaklaşık %75 güvenle buldu (2. tur RED).
2. **İki gözcünün önerisi çatışınca kestirmeyi bütün türleriyle say.** Orkestratör yalnız seçtiği önerinin hedeflediği
   kestirmeyi değil, öteki gözcünün işaret ettiği türü ve şu genel türleri de yeni takımda sayar:
   - kesişim;
   - ikiz;
   - iki uç + orta;
   - en kapsamlı şık.
3. **Aynı beş şıkkı taşıyan (ayna) sorularda açıklama kategori listesi yazmaz.** 6458-p2-01'in açıklamasındaki 3/1-r statü
   sayımı ("mülteci, şartlı mülteci, ikincil koruma"), 02'nin iki çeldiricisini kategoriyle düşürüyordu. İkinci turda sınav
   ve kalite gözcüleri yakaladı; rötuşla çıktı.
4. **Komşu kanunla kelimesi kelimesine aynı sonucu ölçen soru çeldirici değiştirilerek kurtarılmaz.** 6458 Ek 1/2 ile 5607
   md 10/2 bu durumdadır. Ölçülen bilgi 6458'e özgü değildir; sınav değeri 3'te kalır (6458-p1-05, 2. tur RED; 10-ek RED
   dersi 6'nın bir türü). Analiz bu ölçüme izin verse de, ortak unsur bankada başka kanun adıyla sorulmamış olsa da kural
   geçerlidir.
5. **"… emriyle zabıta vasıtasıyla" merci sorusunda cevap mülki amir ise yuva açılmaz.** Polis adayının hiyerarşi
   varsayılanı cevabı verir. Analist önerse de geçerlidir (7201-p1-03, 1. tur RED; 10-ek RED dersi 1).
6. **Tek soruluk partide üretici önce bankaya bakar.** Ölçülecek tek açının cevabı bankadaki bir resmî sorunun kökünde
   yazıyorsa parti boş kalır (3071-p1; 5188 md 6 emsali).

## Orkestratör kuralları (23 Kas 2026) — üç yönetmelik turu ve 5326/3628/4982 turu
1. **İki seçenekli hükümde yuva açılmaz.** Hüküm "X'in yeri mi, Y'nin yeri mi" tercihiyse şık takımı ne olursa olsun ikiz
   doğar ve sağduyu ("mağdur önce gelir") doğruyu verir (teknik-takip-p1-01, 1. tur RED).
2. **"Doğrudur" sorusunda doğru önerme takımın "zararsız usul cümlesi" olmaz.** Öbür dört önerme şart, yasak ya da merci
   iddiası taşıyorsa eleme cevabı verir (teknik-takip-p1-03).
3. **Yönetmelik hükmü dayanak Kanunun açık cümlesiyle gerilimliyse ne doğru ne yanlış önerme olur** (Teknik Takip 20/2 ↔
   6284 md 12/1: doğru şıkken "Kanunla gerilim", yanlış şıkken "Kanuna göre doğru cümle yanlış sayılmış" itirazı).
4. **"Artık hâl" hükmü kökte kuralın varlığı verilince sağduyuyla bulunur** ("ceza verilemiyorsa idarî yaptırım";
   5326-p1-02). "Hangi hâlde" biçiminde hâlin her somut örneği ikinci doğru adayıdır.
5. **Dolu bankada aday, çeldiricileriyle birlikte taranır.** Dört çeldiricinin dördü de bankadaki soruların cevabıysa soru
   elemeyle çözülür (5326-p1-03). Bankadaki bir sorunun kökü adayın tek ölçtüğü açıyı yazıyorsa parti arası değil banka
   kökü sızıntısıdır (3628-p1-04).
6. **ONAY'la birlikte yazılan şüphe, şık değiştirme talimatına çevrilmeden önce öbür gözcülerin o şık hakkındaki görüşüyle
   tartılır.** 5326-p2-02'de mevzuat gözcüsünün şüphesi üzerine değiştirilen şık, kalite ve sınav gözcülerinin güçlü
   bulduğu çeldiriciydi; değişiklik geri alındı.
7. **Düşük değerli hükmü biçim kurtarmaz; kolluğa dokunmayan kurum içi işleyiş PAEM sorusu olmaz** (tedbir-yon-p1-01:
   biçim kestirmesiz, sınav değeri 2).
8. **Küçük turda rol başına bir ajan yeterlidir.** Altı ve on soruluk turlarda dört rol, partileri birlikte denetleyen dört
   ajanla yürütüldü; son turda sınav gözcüsü taze ajandı ve gerçek kör çözüm yaptı, üç rol tek ajanda birleşti.

## Orkestratör kuralları (23 Kas 2026, ikinci bölüm) — 6458/7201 ikinci dalga, 298 ve 657 turu
1. **Savunulabilir ikinci doğru, çeldiricinin gücünden önce gelir.** 7201-p2-01'de "muhtara teslim" şıkkını kalite ve
   sınav gözcüleri en güçlü çeldirici buldu; mevzuat gözcüsü 21/1 lafzıyla doğru okunabildiğini gösterdi. Şık değişti;
   taze kör çözücü yeni takımda da yanlış şıkka gitti.
2. **PAEM'in sormadığı kanunda yuva, PAEM'in sorduğu komşu kanunun alışkanlığını yanlış şıkka bağlar.** 298'in üç KABUL'ü
   2911 (bildirim mercii) ve 4483 (izin) alışkanlığını çeldirici yaptı. Komşu alışkanlığı olmayan hüküm (ceza türü)
   RED aldı.
3. **Yasak eşleştirmeyi ters kökle ölçme.** "Hangisi X cezasını gerektirir" kökü, şıklardaki dört fiilin "X değildir"
   bilgisini, yani yasaklanan fiil–ceza eşleştirmesini ölçer ve açıklamayı o eşleştirmeleri basmaya zorlar
   (657-p2-02; "fiil → beş ceza" biçimine çevrildi).
4. **Komşu kanun aynı durumda aynı değeri veriyorsa soru o kanuna özgü bilgi ölçmez** (657 md 127 ↔ 7068 md 29/4; değer
   3'te kalır, biçim kurtarmaz).
5. **Dil gözcüsü istemine eşik yaz.** "REVIZYON anlamı, tek cevaplılığı ya da doğal okumayı etkileyen kusur içindir;
   biçimsel rötuş ONAY + nottur" denmeyince her virgül bir REVIZYON olur ve bütün sorular ikinci tura gider.
6. **Uzun revizyon talimatı dosyaya yazılır.** Talimat scratchpad'de bir dosyaya konur, üreticiye yalnız dosya yolu
   iletilir; ileti kısa kalır ve talimat ikinci tur gözcüleri için de kayıtlı olur.
7. **Taze gözcü hükmü tanıdığını beyan ederse "salt şık" güveni tahmindir.** Kör çözümün kanıt değeri o sorularda düşer;
   karar öbür kanıtlarla (birinci tur kör çözümü, şık yapısı sayımı) birlikte tartılır.

## Orkestratör kuralları (23 Kas 2026, üçüncü bölüm) — ikinci dalga turu (5253, 6698, PVSK, 4483, 6284, 6222)
1. **Tur eki yuva satırında cevabı yazmaz.** `18-ek` "Cumhurbaşkanı kararıyla atanıp ilde görev yapan → vali" diye yazdı;
   sınav gözcüsü eki kör çözümden sonra okusa da metinle çözüm adımı kirlendi. Yuva satırı hükmü ve ölçülecek ayrımı
   söyler, sonucu söylemez.
2. **Son turdan sonra şık değişirse tek soruluk ek kör kontrol yapılır.** 6222-p2-02'de son tur gözcüsü yeni çeldiriciyi
   "lafzen doğru" buldu ve şartlı ONAY verdi; şık üreticiye düzelttirildi ve soru, onu ilk kez gören bir gözcünün kör
   çözümü + mevzuat denetiminden ayrıca geçti. Denetlenmemiş şıkla bankaya soru yazılmaz.
3. **Kör çözücünün yanıldığı soruda kök değişikliği en dar biçimde yapılır.** 4483-p2-01'de kalite gözcüsünün önerdiği
   "ilde görev yapan" kökü varsayılanı ("ilde → vali") güçlendirecekti; üretici "bir bakanlığın il …" biçimini korudu,
   taze kör çözücü yine yanlış şıkka gitti.
4. **Son turda sınır kararı RED'dir.** 5253-p2-01 hukuken temizdi, üç rol ONAY verdi; taze kör çözücü ayırt ediciliğe 2
   verdi. İkinci dalgada "bankaya girmese bir şey kaybedilmez" ölçütü soruyu düşürür.
5. **zsh'de parti listesi `${=P}` ile bölünür**; düz `$P` tek argüman olur.
