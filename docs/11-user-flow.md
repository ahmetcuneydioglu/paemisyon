# Doc 11 — User Flow

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 2 (PRD), Doc 8 (auth/göç), Doc 10 (modüller).
> **Kapsam:** Kullanıcının uçtan uca akışları — ilk açılıştan aboneliğe ve günlük dönüş döngüsüne. Ekran taslakları Doc 12.

---

## 1. İlk Açılış → Onboarding
```
Uygulama ilk açılış
  → Karşılama slaytları (değer önermesi, 3-4 ekran)
  → Hedef sınav seçimi (PAEM / POMEM / PMYO)
  → "Hesabın var mı?" → Giriş / Kayıt
  → [değer gösterildikten SONRA] bildirim izni isteği
  → Home
```
> İzinler açılışta değil, değer gösterildikten sonra istenir (kabul oranı yüksek + premium his).

## 2. Kayıt / Giriş
```
Giriş ekranı
  ├─ Apple ile Giriş  → (Supabase Auth) → Home
  ├─ Google ile Giriş → (Supabase Auth) → Home
  └─ E-posta ile
       ├─ Kayıt → e-posta doğrulama bekle → doğrulandı → Home
       └─ Giriş → başarılı → Home
                → başarısız → jenerik hata (enumerasyon yok)
Şifremi unuttum → e-posta → sıfırlama linki → yeni şifre → Giriş
```

## 3. Eski Kullanıcı Göçü (claim)
```
E-posta ile giriş denemesi
  → sistem: bu e-posta legacy_user_map'te + password_reset_required=true
  → "Hesabın yeni platforma taşındı 🎉 Güvenlik için yeni şifre belirle"
  → e-posta doğrulama → yeni şifre
  → eski verisi (kıdem/istatistik) bağlanır → Home
Sosyal giriş yapanlar bu adımı görmez (OAuth ile otomatik eşleşir).
```

## 4. Çekirdek Çalışma Döngüsü (ana değer)
```
Home
  → "Çalışmaya başla" / kategori seç
  → Catalog: Modül → Ders → Konu
  → Konu detay → "Çözmeye başla" (mod seç: pratik / deneme)
  → Quiz (soru → cevap → [pratik: anlık açıklama] → sonraki)
  → Oturum biter → Result (skor, doğru/yanlış, açıklamalar, mevzuat)
  → "Yanlışları tekrar et" → Review oturumu (quiz motoru, review modu)
  → Home (streak +1, ilerleme güncellendi)
```

## 5. Deneme Sınavı (exam modu)
```
Home/Catalog → "Deneme sınavı"
  → süre başlar, soru sayısı sabit
  → cevaplar kaydedilir (geri bildirim YOK, doğru cevap sunucuda)
  → süre biter / tamamla
  → Result: tam analiz + soru-soru inceleme (şimdi açıklamalar açılır)
```

## 6. Freemium Limit → Paywall → Dönüşüm (gelir akışı)
```
Ücretsiz kullanıcı soru çözüyor
  → günlük limit yaklaşıyor (Home'da göstergeyle şeffaf uyarı)
  → limit doldu → cevap denemesi → 403 DAILY_LIMIT_REACHED
  → Paywall (nazik): "Bugünlük harika iş çıkardın! Sınırsız çalışmak için Premium"
       ├─ Aylık / Yıllık plan
       ├─ Satın al → StoreKit → makbuz → SUNUCU doğrular → entitlement=premium
       │     → "Premium aktif!" → çalışmaya devam (sınırsız)
       └─ Şimdi değil → Home (yarın limit sıfırlanır)
Diğer paywall tetikleyicileri: premium konuya dokunma, detaylı analitik.
```
> Paywall **moral bozmaz**: kullanıcı o gün çalıştıysa kutlar, sonra teklif eder. Rahatsız edici değil.

## 7. Günlük Dönüş Döngüsü (retention motoru)
```
Push bildirimi ("Serini koru! 🔥 Bugün 10 soru seni bekliyor")
  → uygulama açılır → Home
  → günlük hedef / streak durumu
  → günün sorusu (V1) veya kaldığın yerden devam
  → kısa oturum → streak korunur → tatmin
```

## 8. Premium İçerik Kapısı
```
Catalog → premium konu (kilit rozeti)
  → dokun → Paywall (bu içeriğe özel vurgu)
  → abone → kilit açılır
  → değilse → ücretsiz konulara yönlendir
```

## 9. Profil / Hesap
```
Profile
  ├─ Profil düzenle (ad, avatar, hedef sınav)
  ├─ Bildirim tercihleri
  ├─ Aboneliğim (durum, geri yükle)
  ├─ Yasal (KVKK, gizlilik, şartlar)
  ├─ Hesabı sil (KVKK) → onay → veri silme/anonimleştirme → çıkış
  └─ Çıkış → token temizliği → Giriş
```

## 10. Hata / Offline Akışları
```
Ağ yok:
  → cache'li içerik gösterilir ("çevrimdışısın" bilgisi)
  → çözülen cevaplar yerel kuyruğa
  → bağlantı gelince otomatik senkron (idempotent)
Sunucu hatası:
  → moral bozmayan, aksiyon öneren mesaj ("tekrar dene")
Oturum süresi doldu (401):
  → sessiz token yenileme → başarısızsa nazikçe Giriş'e
Uygulama sürümü çok eski:
  → "Güncelle" ekranı (min_supported_version — Doc 7)
```

## 11. Kritik Yol (Happy Path) — özet
```
İlk açılış → onboarding → kayıt(Apple) → hedef sınav
  → Home → konu seç → 10 soru çöz → sonuç → streak
  → (birkaç gün sonra) push → geri dön → limit dolar
  → paywall → yıllık premium → sınırsız çalışma
```
Bu yol, **aktivasyon → alışkanlık → dönüşüm** hunisini temsil eder; tüm metrikler (Doc 1 §7) bu yolu ölçer.

## 12. Vizyona hizmet
| İlke | Flow karşılığı |
|---|---|
| Alışkanlık/motivasyon | Günlük dönüş döngüsü + streak + nazik paywall |
| Premium UX | İzin zamanlaması, moral bozmayan hata/paywall |
| Kullanıcıya saygı (göç) | Sorunsuz sosyal geçiş + açıklamalı claim akışı |
| Sürdürülebilir gelir | Şeffaf freemium → değer anında dönüşüm |
