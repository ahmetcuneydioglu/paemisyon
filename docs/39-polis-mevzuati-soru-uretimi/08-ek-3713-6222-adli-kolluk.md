# Ek — 3713 + 6222 + Adli Kolluk Yönetmeliği turu (12 Kas 2026)

Kullanıcı talebi (bağlayıcı): **önemli olan soru kalitesi; sorular SINAV DÜZEYİNDE
olsun.** Her agent'ın ayrı görevi var ve soru kalitesine ayrıca bir gözcü bakar
(`09-sinav-kalitesi-gozcusu.md`). Önceki turların kuralları aynen geçerli:
`01-uretici-brief.md`, `03-kalite-onceligi.md`, `07-ek-4483-6284.md` (doğallık,
`stil-cikmis.txt` ölçütü, kısa kanun adı, kısa öncüllü).

## "Sınav düzeyi" ne demek (üretici ve bütün gözcüler için)
`stil-cikmis.txt`'teki resmî PAEM / Misyon Koruma / İçişleri GYS soruları ölçüttür.
Sınav düzeyindeki soru:
- Hükmün ÖZÜNÜ ölçer: şart, istisna, merci, süre, yaptırım, kapsam sınırı —
  madde numarası ya da tanım ezberi değil.
- Hazırlıklı ama eksik bilen adayı yakalayan çeldiricilere sahiptir: komşu
  fıkradaki gerçek değer, benzer makam, kapsamı biraz genişletilmiş hâl,
  genel kuralla istisnanın yer değiştirmesi. Bilmeyenin şıklardan sezgiyle
  bulabildiği soru sınav düzeyinde DEĞİLDİR.
- Tek okumada anlaşılır; vaka varsa kısa ve unvanlıdır, ayırt edici unsuru
  açıkça verir.
- Zorluk karışımı: partinin yaklaşık 1/4'ü kolay, 1/2'si orta, 1/4'ü zor.
  "Zor" = iki yakın hükmü ayırt etmeyi ya da istisnayı uygulamayı gerektiren
  soru; uzun ya da dolambaçlı soru değil.

## Kapsam
- **3713 Terörle Mücadele Kanunu** (52 madde; bankada 13 gerçek soru + 10 başka konuda).
  Mülga: md 8, 9, 10, 11, 12, 13, 16, 18. Geçici maddeler kapsam dışı. md 23
  (yürürlükten kaldırılanlar), 24–25 (yürürlük/yürütme) kapsam dışı.
  md 21 (yardım), Ek 1 ve Ek 3 çok uzun mali/sosyal yardım hükümleridir —
  yalnız polisin/aday kitlenin bilmesi gereken özü varsa (hak sahibi, temel
  kural) soru yazılır; oran/tutar/ödeme usulü ezberi YAZILMAZ.
  Terör suçlarının TCK karşılıkları (md 3, 4) TCK'ya değil 3713'e göre sorulur.
  **md 7'nin son fıkrası kapsam dışı (12 Kas 2026, kalite gözcüsü bulgusu):** fıkra
  TCK 314/3'e atıf yapar; 314/3 (7499 ile 2024'te eklendi) Anayasa Mahkemesinin
  5/11/2024 tarihli, E.2024/81, K.2024/189 sayılı kararıyla İPTAL edildi. Bankadaki
  3713 metni bunu göstermez (TCK yedeği: docs/32-yayin-denetimi/dipnot-yedek-2026-10-03-5237.json).
  md 8/B yalnız TCK 60 yollamasıdır; bankada TCK soruları aynı bilgiyi ölçer.
- **6222 Sporda Şiddetin Önlenmesine Dair Kanun** (29 madde; bankada 2 soru).
  md 26–27 (yürürlük/yürütme) ve Geçici 1 kapsam dışı. Öncelik kolluğun sahada
  uyguladığı hükümler: güvenlik kurulları ve görevleri, seyirci yasağı ve süreleri,
  kolluğun yetkileri, suç ve cezalar, idari tedbirler.
- **Adli Kolluk Yönetmeliği** (15 madde; bankada 4 soru + 7 başka konuda, çoğu CMK).
  md 8'in sonu bankada kesik ve madde yalnız kanun listesidir — md 8'den soru YAZILMAZ.
  md 14–15 kapsam dışı. Yönetmeliğin bir kısmı CMK md 164–167'yi tekrarlar:
  CMK'da aynen bulunan hükmü değil, YÖNETMELİĞE ÖZGÜ ayrıntıyı sor (adli kolluk
  görevlisinin tanımı ve görevlendirilmesi, eğitim, sertifika, değerlendirme raporu,
  çalışma esasları, denetim). Mükerrer tabanında CMK soruları da var
  (`adli-kolluk-diger-konu-sorulari.txt`).

## Biçim (kullanıcı kararları)
- Kök kısa adla: "3713 sayılı Kanun'a göre", "6222 sayılı Kanun'a göre",
  "Adli Kolluk Yönetmeliği'ne göre".
- Öncüllü soru kısa (kök ≤ ~500 karakter) ve partinin en fazla 1/5'i.
- Süre/sayı şıkları artan sırada; kökle doğru şık arasında kelime yankısı yok.
- Beş şık, tek doğru; olumsuz kök ≤ 1/4 ve vurgulu (BÜYÜK HARF).

## Gözcü görev bölümü (her agent'ın ayrı görevi — kullanıcı talebi)
Dört gözcü birbirinin dosyasını görmez; oy birliği aranır (ROLLER=mevzuat,kalite,dil,sinav).
- **Mevzuat gözcüsü** (`-mevzuat`): hukuki doğruluk — doğru şık, her çeldirici,
  açıklamadaki her cümle madde metnine karşı; künye.
- **Kalite gözcüsü** (`-kalite`): BİÇİM, İPUCU ve MÜKERRER — şık uzunluğu, kök–şık
  kelime yankısı, şık sırası, mutlak ifade, olumsuz kök/öncüllü sınırları, zorluk
  etiketi, banka mükerreri (mevcut + diğer-konu dosyaları), parti içi tekrar ve
  sızıntı. Bu turda sınav değeri ve doğallık puanını Sınav Kalitesi Gözcüsü verir;
  kalite gözcüsü puan vermez, kusur arar.
- **Dil gözcüsü** (`-dil`): dil/mantık — iki doğru şık/cevapsızlık, kökün tek
  okumada anlaşılması, vakada ayırt edici unsur, öncül bağımsızlığı, kök–şık uyumu.
- **Sınav Kalitesi Gözcüsü** (`-sinav`): `09-sinav-kalitesi-gozcusu.md` — kör çözüm
  + sınav değeri, ayırt edicilik, doğallık, gerçek zorluk.
