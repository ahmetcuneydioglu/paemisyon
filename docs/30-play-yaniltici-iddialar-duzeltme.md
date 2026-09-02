# Google Play — "Yanıltıcı İddialar" ihlali düzeltme dosyası

**Sorun:** Resmi Bilgilerle İlgili Kaynak Bağlantısı Eksik
**Tarih:** 26 Ağustos 2026 · **Durum:** Uygulama Google Play'de kullanılamaz

Google'ın kanıt olarak gösterdiği yer: **Play Store tam açıklama (tr-TR)**.
Açıklamada "Her metin resmî kaynaktan alınır" deniyor ama hiçbir resmî kaynak
URL'si verilmiyor ve devlet kurumu olunmadığına dair sorumluluk reddi yok.

İtiraz yolu (Düzeltme yöntemi md. 1) bize uygun değil — devlet kuruluşuyla
bağımız yok. Md. 2'deki adımları uygulayacağız.

---

## ADIM 1 — Play Console mağaza açıklaması (kod gerektirmez, bugün yapılabilir)

Mevcut tam açıklamanın **sonuna** aşağıdaki iki bloğu ekle. Mevcut metni silme.

```
━━━━━━━━━━━━━━━━━━━━━━━━
RESMÎ KAYNAKLAR

Uygulamadaki tüm kanun, yönetmelik ve mevzuat metinleri T.C. Cumhurbaşkanlığı
Mevzuat Bilgi Sistemi'nden alınmıştır:
https://www.mevzuat.gov.tr

Her kanunun kendi resmî kaynak bağlantısı uygulama içinde de görünür ve tek
dokunuşla mevzuat.gov.tr üzerindeki orijinal metne gider. Her metnin son
doğrulama tarihi uygulamada yazar.

Sınav soruları, sınavı yapan kurumların yayımladığı gerçek çıkmış sorulardan
derlenmiştir. Sınav bilgileri için resmî kaynaklar:
ÖSYM — https://www.osym.gov.tr
Polis Akademisi Başkanlığı — https://www.pa.edu.tr
Emniyet Genel Müdürlüğü — https://www.egm.gov.tr

━━━━━━━━━━━━━━━━━━━━━━━━
SORUMLULUK REDDİ

Paemisyon bağımsız bir sınav hazırlık uygulamasıdır. Emniyet Genel Müdürlüğü,
Polis Akademisi Başkanlığı, ÖSYM, İçişleri Bakanlığı veya herhangi bir kamu
kurum ya da kuruluşu ile bağlantılı DEĞİLDİR; bu kurumlar tarafından
onaylanmamış, desteklenmemiş veya yetkilendirilmemiştir. Resmî bir devlet
uygulaması değildir ve resmî hizmet sunmaz.

Uygulama yalnızca eğitim ve sınav hazırlık amaçlıdır. Hukuken bağlayıcı ve
güncel metin için daima yukarıdaki resmî kaynaklar esas alınmalıdır.
```

Aynı ekleme, varsa **diğer dil sürümlerine** de yapılmalı (Google "uygulamanızın
kullanılabildiği tüm bölgeleri kontrol edin" diyor).

---

## ADIM 2 — Uygulama içi düzeltmeler (kod + veri)

Google "Uygulamanızdaki bilgilere açıklık getirin ve/veya ekleme yapın" diyor
ve sonunda "Uygulama güncellemenizi gönderin" istiyor. Sadece mağaza metni
yetmeyebilir; aşağıdakiler hem ihlali kapatır hem gerçek eksikleri giderir.

### 2a. Resmî kaynak URL'si eksik olan mevzuat (VERİ)

Yayındaki 37 mevzuattan **5'inde** `officialSourceUrl` boş → uygulamada
"Resmî Kaynak (mevzuat.gov.tr)" butonu bu 5 kanunda hiç görünmüyor.
Google'ın tespitiyle birebir örtüşen nokta budur.

| Mevzuat | slug |
|---|---|
| Adli Kolluk Yönetmeliği | `adli-kolluk-yonetmeligi` |
| Adli ve Önleme Aramaları Yönetmeliği | `adli-ve-onleme-aramalari-yonetmeligi` |
| Emniyet Atama ve Yer Değiştirme Yönetmeliği | `emniyet-atama-ve-yer-degistirme-yonetmeligi` |
| Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği | `yakalama-gozaltina-alma-ve-ifade-alma-yonetmeligi` |
| Emniyet Performans Değerlendirme Yönetmeliği | `emniyet-performans-degerlendirme-yonetmeligi` |

Ayrıca yayındaki 3003 maddeden **190'ında** `LawArticle.sourceUrl` boş.

Yönetmelik URL biçimi (kanunlardan farklı):
`https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=<no>&MevzuatTur=7&MevzuatTertip=5`

### 2b. Okuyucu ekranında kaynak tıklanabilir değil (KOD)

`apps/mobile/lib/features/mevzuat/presentation/reader_screen.dart:490`
`'Kaynak: ${r.source}'` düz metin olarak basılıyor — link değil.
Kullanıcı madde okurken resmî kaynağa gidemiyor.

**Yapılacak:** bu satırı `TextButton.icon` / tıklanabilir hâle getirip
`officialSourceUrl`'e `launchUrl` ile bağla. Detay ekranındaki
(`legislation_detail_screen.dart:171`) çalışan buton örnek alınabilir.

### 2c. Uygulamada hiçbir yerde sorumluluk reddi yok (KOD)

`grep` ile tarandı: mobil uygulamanın hiçbir ekranında "kamu kurumu ile
bağlantılı değildir" benzeri bir ifade yok.

**Yapılacak:**
- Ayarlar → Hakkında ekranına kalıcı sorumluluk reddi metni
- Mevzuat Merkezi ana ekranına tek satırlık, görülebilir not:
  "Metinler mevzuat.gov.tr kaynaklıdır · Paemisyon resmî bir devlet uygulaması değildir"

---

## ADIM 3 — Yeni sürüm gönder

1. `pubspec.yaml` sürüm/build numarasını artır
2. Release build al, Play Console'a yükle
3. Politika sorunu sayfasından "Uygulama güncellemenizi gönderin" akışını tamamla

---

## Kontrol listesi

- [ ] Play Console tam açıklama (tr-TR) güncellendi
- [ ] Varsa diğer dillerdeki açıklamalar güncellendi
- [ ] 5 yönetmeliğe `officialSourceUrl` eklendi
- [ ] 190 maddeye `sourceUrl` eklendi
- [ ] Okuyucu ekranında kaynak linki tıklanabilir
- [ ] Hakkında ekranında sorumluluk reddi
- [ ] Mevzuat ana ekranında kaynak/disclaimer notu
- [ ] Yeni sürüm yüklendi ve inceleme için gönderildi
- [ ] App Store tarafı da aynı açıdan kontrol edildi (aynı iddialar orada da var)
