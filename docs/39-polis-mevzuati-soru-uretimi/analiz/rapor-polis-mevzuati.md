# Resmî sınav soruları analizi — Polis Mevzuatı (Doc 39, 18 Kas 2026)

Kaynak `resmi-polis-mevzuati.txt` (358 soru). Sayılar betikle hesaplandı; nitel sınıflama 102 soruluk tabakalı örneklemde elle yapıldı (PAEM 20, Misyon Koruma 20, İçişleri 16, Adalet 16, MEB 16, Diğer 14). Kıyas tabanı `aday/*.json`: 1.108 üretim adayı, reddedilenler dahil.

## 1. Korpus

| Sınav | Soru | Şık |
|---|---|---|
| PAEM 8 / 9 / 10. dönem | 47 (27/10/10) | 5 |
| Misyon Koruma (EGM 2023, JGK 2023, 2020) | 88 | 4 (65), 5 (23) |
| İçişleri GYS | 55 | 4 (51) |
| Adalet GYS (2023, 2025) | 65 | 5 |
| MEB GYS + Müfettiş Yrd. | 68 | 5 |
| Diğer (Kaymakamlık 14, hâkimlik/HMGS 8, Milli Emlak 7, KPSS 5, Sayıştay 1) | 35 | 5 (28) |

3 soru birebir kopya (355 tekil); 15 çift %80'in üstünde benzer, yani soru başka sınavda yeniden kullanılıyor. Çekirdek hükümler 4–5 kez soruluyor (konutta önleme araması 5, 4483 kaymakam mercii 4, avukat bürosu araması 4).

PAEM'de üç üslup var. 8. dönem: tam ad, uzun kök, boşluk doldurma. 9. dönem: 10 sorunun 9'unda mevzuat adı yok, 4'ü mini vaka, çeldiriciler zayıf ([12], [14]). 10. dönem: klasik kalıba dönüş, sayılar rakamla.

## 2. Kök kalıpları (358 soru)

| Kalıp | Oran | Not |
|---|---|---|
| Doğrudan soru | %50 | süre/sayı %22, makam/merci %14, olumlu liste %6, kavram %3, fiil→ceza %3, işlem türü %2 |
| Olumsuz kök | %34 | PAEM %32, Misyon %38, İçişleri %24. "yanlıştır" 81, "sayılmamıştır" 14, "yer almaz" 9 |
| "Hangisi doğrudur" | %6 | yanlıştır : doğrudur oranı 4 : 1 |
| Boşluk doldurma | %6 | önce hüküm, sonra soru |
| Öncüllü | %4 | 3 öncüllü 9, 4 öncüllü 5; "Yalnız I / I ve II" kombinasyonu 10, D/Y dizisi 3, sıralama 1 |
| Eşleştirme / bileşik "X – Y" şık | %1 / %4 | [65], [347] / [10], [293] |
| Vaka | %2,5 | 9 tekil, kök medyanı 230 krkt; PAEM'de yalnız 9. dönem |

- **Olumsuz kök:** olumsuz sözcük metinde hiç büyük harfle yazılmamış (0/123); kitapçıktaki kalın/altı çizili biçim aktarımda kaybolmuş olabilir.
- **Öncüllü:** 12/14 soruda öncüller kökten önce geliyor. Medyan 394 krkt, 5'i 500 krkt'yi aşıyor. Doğru şık ikili küme 6, "Yalnız" 2, üçlü 1, hepsi 1.
- **Kök uzunluğu:** medyan 181 krkt / 22 sözcük (Ç1–Ç3 132–247). Tipe göre: PAEM 141, boşluk 354, öncüllü 394. Kökün %90'ı tek cümle, %98'i "?" ile biter.
- **Kanun adı:** tam ad %75, yönetmelik tam adı %15, numarasız ad %5, ad yok %2,5 (PAEM 9); kısa ad yalnız 3 soruda ("7068 sayılı Kanun", EGM 2023). Kök %85 mevzuat adıyla başlıyor; "göre," %59, işaretsiz %34, "göre;" %7. Madde numarası hiç yok. Önerme sorularının %44'ünde konu tırnakla anılıyor (“koruma tedbirleri” ile ilgili …).

## 3. Şık yapısı

- **Uzunluk:** şık medyanı 3 sözcük (5 şıklılarda 4, PAEM 5); soruların %48'inde en uzun şık bile 4 sözcüğü geçmiyor, %27'sinde şıklar tam cümle. Doğru şık tek başına en uzun %16 (şans %22), en kısa %15. Soru içi uzunluk değişkenliği (CV) medyanı 0,27; çok dengeli (CV<0,15) %20.
- **Paralellik:** bütün şıklar aynı sözcükle başlıyor %4 ([293], [295]); en az üç şık %18.
- **Sayı/süre şıkları (81 soru, %23):** artan sıra %91, azalan 4 ([17], [245]), karışık 3. Yazıyla %62, rakamla %31. %32'si eşit aralıklı dizi (18'i ardışık: 1-2-3-4). Doğru değer uçta %35 (şans %45).
- **Gerçek değer testi** (kanun metni elde olan 52 soru): çeldiricilerin %66'sı aynı kanunda aynı birimle geçiyor (rastgele değerde %31; 657 hariç %51'e karşı %21). En az üç gerçek çeldiricili soru %50 (657 hariç %30).
- **İki değerli boşluk (11 soru):** 5'i 2×2 ızgara + 1 şık; beşinde de doğru şık ızgarada, dışarıdaki şık hep eleniyor. [354] ve [42]'de bir değer tek şıkta geçiyor, soru tek bilgiye iniyor.
- **Diğer:** hepsi/hiçbiri şıkkı yok. Mutlak ifadeli şık 42 (soru başına 0,12), %24'ü doğru (şans %21); kanunun kendi mutlak ifadesi doğru şıkta ([259], [53]). Doğru harf: 5 şıkta A20 B22 C23 D20 E15, 4 şıkta A27 B30 C20 D23.

## 4. Çeldirici taksonomisi (örneklem 102)

Olumlu kökte çeldirici, olumsuz kökte yanlış önermenin kuruluşu sayıldı (bir soruda birden çok tür).

| Tür | Soru % | Örnek |
|---|---|---|
| Sayı değiştirme / uydurma dizi | 35 | [18], [174] |
| Benzer makam/kurum | 24 | [95], [144] |
| Komşu hükmün gerçek değeri/liste öğesi | 24 | [262], [300] |
| Terim/kavram/işlem türü | 16 | [13], [249] |
| Olumsuzlama/tersine çevirme | 8 | [353], [114] |
| Zayıf, sağduyuyla elenen | 6 | [12], [54] |
| Sağduyuya uygun uydurma | 5 | [175], [328] |
| Yer değiştirme / kısmen doğru bileşik | 5 | [223], [293] |
| Kapsam genişletme, şart ekleme | 4 | [352], [227] |
| Kural–istisna, özel–genel rejim | 4 | [333], [335] |
| Başka kanundaki benzer hüküm | 3 | [53], [322] |

Olumsuz köklü 34 soruda yanlış önerme şöyle kurulmuş: makam 8, olumsuzlama 5, komşu değer 5, sayı 5, istisna 4. Doğru önermeler kanun cümlesinin kendisi.

## 5. Ölçme düzeyi (örneklem 102)

Bilgi %79, analiz (iki yakın hükmü ayırt etme) %10, kavrama %8, uygulama/vaka %3.

Muhakeme ölçen sorular ([235], [244], [93], [338], [156], [114], [262], [13]) aynı yapıyı paylaşıyor: (1) kök tek bir koşulu sabitler (rütbe, evre, yer, ceza türü, aralık); (2) bütün şıklar aynı karar uzayından gelir (hiyerarşinin bütün mercileri, bütün ceza basamakları); (3) cevap metin eşleştirmesiyle değil, koşulu kurala bağlayarak bulunur; (4) vaka varsa 1–2 cümledir.

## 6. Zorluk (örneklem 102: kolay %25, orta %52, zor %24)

- **Kolay:** tek adımlı, çok tekrarlanan çekirdek hüküm ([335], [353]); tahmin edilebilir varsayılan cevap (işlem türü sorularının 8'inde 6'sı "Yönetmelik"; yetkide Cumhurbaşkanı ya da İçişleri: [1], [240]); iki zayıf çeldirici ([12]) ya da cevabı çağrıştıran kök sözcüğü ([224]).
- **Orta:** tek belirli bilgi; çeldiriciler aynı türden, inandırıcı.
- **Zor:** iki bilgi birlikte gerekir ([8], [324], [62]); çeldirici komşu hükmün gerçek değeri ([300], [155]); cevap sezgiye aykırı ([95], [144]); uzun önermede ince unsur değişmiş ([128]). Zor kök uzun değil: medyan 196 krkt (orta 225).

## 7. Dil

- **Kalıplar:** "aşağıdakilerden hangisi" %59, "hangisi yanlıştır?" %23, "en geç" %8, "kaç gün/ay/yıl/saat" %13; "… arasında sayılmamıştır / yer almaz / biri değildir"; "hangi disiplin cezasını gerektirir / fiil ve hâllerdendir"; "bu hükümde boş bırakılan yerlere … sırasıyla getirilmelidir"; "numaralanmış ifadelerden hangileri". Belirsizliği gideren ek: "(istisnai durumlar hariç)", "kural olarak".
- **Kökte hiç geçmeyenler:** bağlamında, açısından, çerçevesinde, hususunda, dikkate alındığında, göz önünde, her durumda, doğru şekilde, en doğru, seçenek, hangi süre, yalnızca.

## 8. Yapay zekâ izleri (resmî ↔ üretim adayları)

| Ölçüt | Resmî | Aday |
|---|---|---|
| "hangisi doğrudur" kökü | %6 | %19 |
| Olumsuz kök | %34 | %12 |
| Kökte 2+ cümle | %8 | %25 |
| "Bir …" ile açılan kök | %0,3 | %9 |
| Vaka | %2,5 | %17 (üretici etiketi) |
| Kökte madde numarası | 0 | %11 |
| Kökte "bakımından" | %1,4 | %14 |
| Önerme sorusunda tırnaklı başlık | %44 | %4 |
| Şık sözcük medyanı | 3–5 | 7 |
| En uzun şıkkı ≤4 sözcük olan soru | %48 | %19 |
| Aşırı dengeli şık uzunluğu (CV<0,15) | %20 | %45 |
| Şıkta "yalnızca" | 0 | 152 şık |
| Mutlak ifade / soru · doğru olma oranı | 0,12 · %24 | 0,30 · %16 |
| Sırasız sayı şıkları | %4 | %24 |
| Doğru değer uçta | %35 | %23 |
| Kökte büyük harf (olumsuz sözcük hariç) | 1 | 39 |
| "en geç" / "kaç" | %8 / %15 | %1 / %3 |

İz değil (resmîde de aynı oranda): bütün şıkların aynı sözcükle başlaması (%4 ↔ %6), bileşik şık (%4 ↔ %4), doğru şıkkın en uzun olması (%16 ↔ %14), kök–şık yankısı (%10 ↔ %11).

## 9. Kurallar

### Önceki kuralların korpusla kıyası

| Kural | Korpus | Sonuç |
|---|---|---|
| 03: kısa kanun adı | tam ad %75 | kullanıcı kararı, bilinçli sapma |
| 03: öncüllü ≤500 krkt, ≤1/5 | %4, medyan 394 | uyumlu |
| 03: yönetmelik/görüş/yürütme sorusu yok | resmîde %7, cevap tahmin edilir | doğru sapma |
| 08: olumsuz kök ≤1/4 | %34 | daha sıkı; fark "doğrudur" ile kapatılmasın |
| 08: olumsuz sözcük büyük harf | metinde 0 | yüzey kararı; başka sözcük büyütülmez |
| 08: sayılar artan; kök–şık yankısı yok | %91; %10 | uyumlu |
| 08: zorluk 1/4–1/2–1/4, zor ≠ uzun | 25/52/24 | uyumlu |
| 08: vaka kısa, unvanlı | %2,5, 230 krkt | uyumlu; adaylarda %17 fazla |
| 01: doğru şık en uzun ≤1/3 | %16 | uyumlu; ≤%25 hedeflenebilir |
| 01: ≥3 gerçek sayısal çeldirici | %50 (657 hariç %30) | resmîden sıkı ama ayırt edici; kalsın |
| 01 §12: mutlak ifade doğru şıkta da | %24 doğru | uyumlu |
| 09: ölçüt `stil-cikmis.txt` | — | bu korpus ve rapor ölçüt olsun |

### Üretici kuralları

1. **Dağılım:** doğrudan soru ~%50 (süre/sayı ~%20, makam ~%15), olumsuz kök %20–25, "doğrudur" ≤%8, boşluk doldurma %5–8, öncüllü %4–8, vaka ≤%10.
2. **Kök:** tek cümle, 130–250 krkt. İkinci cümle yalnız boşluk doldurmada ve vakada. Madde numarası yazılmaz.
3. **Açılış:** "… sayılı Kanun'a göre," ile başla. Boşlukta önce hükmü, öncüllüde önce öncülleri yaz.
4. **Tırnaklı başlık:** önerme sorularının yarısında konuyu tırnakla an (“görevden uzaklaştırma” ile ilgili …). Başlık cevabı vermemeli.
5. **Şıklar:** şık ölçülen unsurun kendisi (makam, süre, ceza), medyan ≤5 sözcük. Uzunluğu eşitlemeye zorlama, ama doğru şık göze batacak kadar uzun da olmasın.
6. **Sayılar:** tek birim, artan sıra, partide tek yazım; doğru değer uçlara da düşsün.
7. **Sayısal çeldiriciler:** en az ikisi aynı kanunda aynı birimle geçen gerçek değer; kökle karışan komşu fıkra değeri mutlaka şıkta.
8. **Olumsuz kök:** doğru önermeler kanun cümlesinin kısaltılmış hâli; yanlış önerme aynı kalıpta tek unsur değiştirilerek kurulur (makam, olumsuzluk, sayı, istisna, eklenen şart).
9. **Güçlü çeldirici:** her soruda en az bir tane (komşu hükmün gerçek değeri ya da aynı hiyerarşiden makam); sağduyuyla elenen şık en çok bir.
10. **Muhakeme:** partinin ≥1/4'ü koşul → kural sorusu (koşul kökte, şıklar aynı karar uzayından: [93], [338]); ≥1/10'u iki yakın hükmü ayırt ettirir ([262], [155]).
11. **Vaka:** 1–2 cümle, ≤250 krkt; unvan var, ad ve hikâye yok; önce olay, sonra soru; ayırt edici unsur kökte.
12. **Zorluk:** 1/4–1/2–1/4. Zor = iki bilgi birlikte, komşu hükümden çeldirici ya da sezgiye aykırı doğru.
13. **Bileşik şık:** her değer en az iki şıkta geçsin; 2×2 ızgaranın dışında tek şık bırakma.
14. **Yazma:** işlem türü sorusu, "yönetmeliği kim çıkarır", "kimin görüşü alınır", "kim yürütür".
15. **Dil:** §7 kalıplarını kullan, "hiç geçmeyenler"i ve "bakımından"ı kullanma. Büyük harf yalnız olumsuz sözcükte.

### Gözcü kontrol listesi (parti düzeyi)

1. Olumsuz kök ≤%25, "doğrudur" ≤%8, vaka ≤%10, öncüllü ≤%20.
2. Kök medyanı 130–220 krkt. Boşluk ve öncüllü dışında >300 krkt ≤%10. 2+ cümleli kök ≤%12. Madde numarası 0.
3. Şık sözcük medyanı ≤5. En uzun şıkkı ≤4 sözcük olan soru ≥%30. CV<0,15 ≤%30. Doğru şık tek başına en uzun ≤%25.
4. Sayı şıklarının %100'ü artan ve tek birimli. En az iki gerçek çeldirici (betikle). Doğru değer uçta %25–45.
5. Bileşik şıkta her değer ≥2 şıkta; ızgara dışı tek şık yok.
6. Mutlak ifade soru başına ≤0,15 ve en az %20'si doğru şık. "yalnızca" 0.
7. Kökte "hiç geçmeyenler" ve "bakımından" 0.
8. Olumsuz sözcük ve kısaltma dışında büyük harf 0.
9. Doğru şıkkın kökle en çok ortak sözcüğü taşıyan tek şık olduğu soru ≤%15.
10. Önerme sorularının ≥%30'unda tırnaklı başlık.
11. Kör çözümde varsayılan cevapla (Yönetmelik, Cumhurbaşkanı, İçişleri) ya da yalnız şıklardan bulunan soru 0.
12. Zorluk kolay %20–30, orta %45–55, zor %20–30; zorların ≥yarısında komşu hükümden çeldirici ya da iki bilgi şartı.
