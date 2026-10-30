# Doc 54 — Aşama 5 üretim raporu (28 Eki 2026)

**Kapsam:** 2559 PVSK, 42 yayımlı madde. **Üretilen:** 41 (Ek 7 hariç — metni 7590 s.K. ile değişmiş, tazeleme
kullanıcıda; tazelendikten sonra `girdi → uret → dogrula → yukle` ile tek madde üretilir).
**Otomatik doğrulama:** 41/41 geçti (`madde-ozeti-dogrula.ts`, 13 birim testli kurallar). **Mülga kayıtları:** 3, 18, Ek 8.
**Model:** claude-opus-5-5, madde başına bir çağrı; uzun maddelerde 8–11k çıkış tokenı (4/A, 5, 16, Ek 6).

Üretim sırasında doğrulayıcıya eklenen kurallar (hepsi testli): değişiklik şerhindeki yıl ve KHK numarası;
"CMK md 81" gibi başka kanun atfının aynı kanun sayılmaması; "değil/yoktur" cümlesindeki metin-dışı sayı örtük
karşı örnek; kanunun kendisi ilgili mevzuat olamaz; kalın numaralı ara başlıklar sayı taramasına girmez.
Modelde görülen ve betikle kesilen tek sistematik hata: kendi kanununu `relatedLegislation`a yazmak (3 maddede).

**İnsan incelemesinde dikkat (betik göremez):** yetki/şart karışıklığı, fıkra numaralarının metindeki sıraya uygunluğu,
Anayasa Mahkemesi iptal notlarının doğru fıkraya bağlanması (4/A f.6, Ek 6), "sınavda dikkat" vurgularının metne
dayanması. Örnek okuma: `uretim/2559-md-4-A.md` (okunur biçim her madde için `.md` olarak yanında).

| Madde | Başlık | Alan dolulukları |
|---|---|---|
| 1 | Polisin Genel Görevleri | 5 nokta · 0 süre · 0 sayı · 5 hatırlatma · 0 mevzuat |
| 2 | Polisin genel emniyet görevleri, hukuka aykırı emir ve sözlü emir hâlleri | 8 nokta · 1 süre · 3 sayı · 8 hatırlatma · 1 mevzuat |
| 3 | Madde 3 (Mülga) | mülga |
| 4 | Polisin Vazifesi Dışında Kullanılamaması | 3 nokta · 0 süre · 0 sayı · 4 hatırlatma · 0 mevzuat |
| 4/A | Kişi ve Araçları Durdurma, Kimlik Sorma ve Kimliği Belirlenemeyen Kişiler | 10 nokta · 5 süre · 4 sayı · 9 hatırlatma · 3 mevzuat |
| 5 | Parmak izi ve fotoğraf alınması, sisteme kaydı, kullanımı ve silinmesi | 12 nokta · 3 süre · 8 sayı · 10 hatırlatma · 2 mevzuat |
| 6 | Umuma Açık İstirahat ve Eğlence Yerlerinin İşletmecilerine İdarî Para Cezası | 12 nokta · 2 süre · 6 sayı · 9 hatırlatma · 2 mevzuat |
| 7 | Umuma açık istirahat ve eğlence yerleri: tanım, ruhsat ve denetim | 11 nokta · 2 süre · 5 sayı · 9 hatırlatma · 1 mevzuat |
| 8 | Bazı Yerlerin Geçici Süreyle Faaliyetten Men Edilmesi ve Ruhsat İptali | 10 nokta · 3 süre · 3 sayı · 9 hatırlatma · 0 mevzuat |
| 9 | Önleme Araması | 11 nokta · 0 süre · 5 sayı · 10 hatırlatma · 2 mevzuat |
| 10 | Taşınması yasak kama, hançer ve saldırmanın yapılması ve satılması yasağı | 4 nokta · 0 süre · 0 sayı · 5 hatırlatma · 0 mevzuat |
| 11 | Genel ahlak ve edebe aykırı davranışlara karşı polisin müdahalesi | 7 nokta · 1 süre · 3 sayı · 7 hatırlatma · 0 mevzuat |
| 12 | Umuma açık yerlerde küçüklerin çalıştırılması ve bu yerlere girmesi yasağı | 7 nokta · 0 süre · 6 sayı · 8 hatırlatma · 0 mevzuat |
| 13 | Polisin koruma altına alma, uzaklaştırma ve yakalama yetkisi; yakalananlara ilişkin işlemler | 9 nokta · 4 süre · 2 sayı · 9 hatırlatma · 0 mevzuat |
| 13/A | Kaybolan çocukların bulunması amacıyla banka hesap hareketleri, iletişimin denetlenmesi ve sinyal bilgileri | 7 nokta · 4 süre · 6 sayı · 7 hatırlatma · 0 mevzuat |
| 14 | Gece Gürültüsünün Polisçe Menedilmesi | 8 nokta · 1 süre · 2 sayı · 6 hatırlatma · 1 mevzuat |
| 15 | İfadesine başvurulacak kişileri çağırma ve ifadeyi ikamet yerinde veya işyerinde alma | 5 nokta · 0 süre · 3 sayı · 7 hatırlatma · 0 mevzuat |
| 16 | Zor ve silah kullanma yetkisi | 9 nokta · 0 süre · 4 sayı · 10 hatırlatma · 1 mevzuat |
| 17 | Polisin emrine itaatsizlik ve polise mukavemet edenler hakkında yapılacak işlem | 5 nokta · 0 süre · 4 sayı · 6 hatırlatma · 0 mevzuat |
| 18 | Madde 18 (Mülga) | mülga |
| 19 | Sokak ve umuma mahsus yerlerde düzen ve trafiğe uygun olmayan araç ile sürücülerin men edilmesi | 5 nokta · 0 süre · 0 sayı · 4 hatırlatma · 1 mevzuat |
| 20 | Zabıtanın konut, iş yeri ve üniversite binalarına girmesi | 7 nokta · 2 süre · 1 sayı · 7 hatırlatma · 0 mevzuat |
| 21 | Yayın araçları adına belgesiz abone ve ilan toplayanların men edilmesi | 6 nokta · 0 süre · 0 sayı · 6 hatırlatma · 1 mevzuat |
| 22 | İçişleri Bakanının Re'sen Emir Verme Yetkisi | 5 nokta · 0 süre · 0 sayı · 4 hatırlatma · 0 mevzuat |
| 23 | Diğer kanunlarla polise verilen vazife ve salahiyetlerin saklı tutulması | 4 nokta · 0 süre · 0 sayı · 4 hatırlatma · 0 mevzuat |
| 24 | Özel zabıta teşkilatı olan işlerde polisin yetkisi | 5 nokta · 0 süre · 0 sayı · 5 hatırlatma · 0 mevzuat |
| 25 | Polis teşkilatı bulunmayan yerlerde görev ve yetkiyi kullanacak jandarma komutanları | 5 nokta · 0 süre · 1 sayı · 5 hatırlatma · 0 mevzuat |
| 26 | Uygulama Yönetmeliği | 4 nokta · 0 süre · 0 sayı · 3 hatırlatma · 0 mevzuat |
| 27 | Yürürlük | 4 nokta · 1 süre · 0 sayı · 3 hatırlatma · 0 mevzuat |
| 28 | Yürütme | 4 nokta · 0 süre · 0 sayı · 3 hatırlatma · 0 mevzuat |
| Ek 1 | Umuma açık yerlerde oyun, temsil ve gösteri için bildirim | 7 nokta · 2 süre · 3 sayı · 7 hatırlatma · 0 mevzuat |
| Ek 2 | Gözaltına alınanların yeme, içme ve nakil masrafları | 4 nokta · 0 süre · 4 sayı · 4 hatırlatma · 0 mevzuat |
| Ek 3 | İkametgâh veya iş adresinden ayrılmama istemi | 7 nokta · 1 süre · 0 sayı · 6 hatırlatma · 0 mevzuat |
| Ek 4 | Polisin görev alanında karşılaştığı suça müdahale görev ve yetkisi | 6 nokta · 0 süre · 3 sayı · 6 hatırlatma · 0 mevzuat |
| Ek 5 | Önemli Olaylar İçin Merkezden ve İller Arası Ekip (Tim) Görevlendirilmesi | 7 nokta · 0 süre · 1 sayı · 6 hatırlatma · 0 mevzuat |
| Ek 6 | Polisin adli görev ve yetkileri; olay yeri işlemleri ve teşhis usulü | 12 nokta · 4 süre · 4 sayı · 10 hatırlatma · 2 mevzuat |
| Ek 8 | Ek Madde 8 (Mülga) | mülga |
| Ek 9 | Silah kullanmak zorunda kalan polis hakkında soruşturma, avukat ücreti ve arananları bildirenlere para ödülü | 10 nokta · 0 süre · 3 sayı · 8 hatırlatma · 2 mevzuat |
| Ek 10 | Görev sırasında veya görev nedeniyle uzuv ya da duyu kaybeden personelin cihaz ve sistem ihtiyacının karşılanması | 6 nokta · 0 süre · 3 sayı · 6 hatırlatma · 1 mevzuat |
| Geçici 1 | Umuma açık istirahat ve eğlence yerlerine ait işlem dosyalarının devri | 4 nokta · 1 süre · 1 sayı · 5 hatırlatma · 0 mevzuat |
| Geçici 2 | Ek 7 nci maddede düzenlenen merkezin kurulma süresi ve kuruluncaya kadarki uygulama | 6 nokta · 2 süre · 4 sayı · 7 hatırlatma · 2 mevzuat |

**Sıradaki:** deploy → `madde-ozeti-yukle.ts uretim/` prod'a in_review → admin `/article-summaries` inceleme → yayın.

## Ek 7 (31 Eki 2026)

`mevzuat-madde-tazele.ts` kuru çalışması bankadaki Ek 7 metnini mevzuat.gov.tr konsolide metniyle **birebir aynı**
buldu (5225 karakter; "Siber Güvenlik Başkanlığı" ibaresi zaten işli) — tazeleme gerekmedi, `--yaz` koşulmadı.
Özet tek madde hattıyla üretildi (`girdi/2559-ek7.json` → `uretim/2559-md-Ek-7.json`, giriş 5,7k / çıkış 13,9k token).
Doğrulayıcı 1 kusur buldu: "1 ay" karşı örneği metinde geçen bir sayıydı (fıkra şerhleri) → karşı örnek ve iki hatırlatmadaki
"1 ay" ibaresi çıkarıldı, GEÇTİ. Yükleme: `madde-ozeti-yukle.ts uretim/2559-md-Ek-7.json` (in_review; yayın insanda).
