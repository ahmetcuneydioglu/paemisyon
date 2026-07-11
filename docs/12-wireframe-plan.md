# Doc 12 — Wireframe Planı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 10 (modüller), Doc 11 (akışlar).
> **Kapsam:** MVP ekranlarının **yapısal yerleşim planı** — hangi ekranda ne var, hiyerarşi, komponentler, durumlar. Bu bir *low-fidelity* plan; piksel-mükemmel görsel tasarım ayrı bir aşama (tasarım sistemi + gerçek UI). Kilit üç ekranın kaba görseli chat'te SVG olarak sunuldu.

---

## 0. Navigasyon İskeleti
```
Alt TabBar (4 sekme): Ana Sayfa · Kategoriler · İlerleme · Profil
Modal/Push üstüne: Quiz, Result, Paywall (tam ekran, tabbar gizli)
```
> Quiz ve Paywall **tam ekran modal** — odak dağılmasın. Duolingo/Brilliant kalıbı.

---

## 1. Onboarding
```
┌─────────────────────────┐
│      [görsel/ikon]       │
│   Başlık (değer önermesi)│
│   Alt açıklama (1-2 satır)│
│                          │
│   ● ○ ○   (sayfa nokta)  │
│  [ Devam / Atla ]        │
└─────────────────────────┘
Son slayt → Hedef sınav seçimi (kartlar: PAEM/POMEM/PMYO)
          → Giriş/Kayıt CTA
```

## 2. Giriş / Kayıt
```
┌─────────────────────────┐
│  Logo                    │
│  Başlık: Hoş geldin      │
│  [  Apple ile Giriş  ]   │  ← öncelikli
│  [  Google ile Giriş ]   │
│  ── veya ──              │
│  E-posta [____________]  │
│  Şifre   [____________]  │
│  [   Giriş yap   ]       │
│  Şifremi unuttum · Kayıt ol│
└─────────────────────────┘
Göç durumu → "Hesabın taşındı" bilgi kartı + yeni şifre akışı
```

## 3. Ana Sayfa (Home) — en önemli ekran
```
┌─────────────────────────┐
│ Selam, {ad}    🔥{streak}│  ← üst: kişisel + streak
│ ┌─ Günlük hedef ───────┐ │
│ │ ▓▓▓▓▓░░░  6/10 soru   │ │  ← ilerleme halkası/çubuğu
│ └──────────────────────┘ │
│ [ Kaldığın yerden devam ]│  ← birincil CTA
│                          │
│ Günün Sorusu (V1)     ›  │
│ Önerilen konu (V1-AI) ›  │
│                          │
│ Hızlı erişim:            │
│ [Deneme] [Yanlışlarım]   │
│ [Kategoriler]            │
│                          │
│ (free) Bugün: 6/10 soru  │  ← freemium göstergesi (şeffaf)
└─────────────────────────┘
Durumlar: skeleton (yükleme), offline rozeti
```

## 4. Kategoriler (Catalog)
**4a. Modül listesi**
```
Kategoriler
[PAEM   ›]  ilerleme %
[POMEM  ›]
[PMYO   ›]
```
**4b. Ders listesi** (modül içinde) → **4c. Konu listesi**
```
Anayasa Hukuku
[Temel Kavramlar   ▓▓▓ 60%  ›]
[Yürütme        🔒 premium  ›]  ← kilit rozeti
```
**4d. Konu detay**
```
Konu adı · {n} soru
Başarı: %.. 
[  Çözmeye başla  ]  → mod seçimi (Pratik / Deneme)
```

## 5. Quiz (çekirdek ekran)
```
┌─────────────────────────┐
│ ✕            ▓▓▓░░ 3/10  │  ← çık + ilerleme (+ süre exam)
│                          │
│  Soru kökü metni...      │
│  [görsel varsa]          │
│                          │
│  ○ A) şık                │
│  ○ B) şık                │  ← seçilince vurgulanır
│  ○ C) şık                │
│  ○ D) şık                │
│                          │
│  [   Onayla / Sonraki  ] │
└─────────────────────────┘
Pratik modu: cevap sonrası şık yeşil/kırmızı + açıklama kartı açılır
Exam modu: geri bildirim yok, sonraki soruya geçer, süre görünür
Durumlar: yükleme, çıkış onayı, offline (kuyruğa yazıldı bilgisi)
```

## 6. Sonuç (Result)
```
┌─────────────────────────┐
│   🎉 Oturum tamamlandı   │
│   Skor: 8/10             │
│   ✓8  ✗2  ○0  ⏱ 4:12    │
│                          │
│  Konu ilerlemen +12%     │
│  [ Yanlışları tekrar et ]│
│  [ Soru soru incele    ›]│  ← açıklama + mevzuat
│  [ Ana sayfaya dön ]     │
└─────────────────────────┘
Ton: motive edici; zayıf konu yapıcı dille
```

## 7. İlerleme (Progress)
```
Genel istatistik: çözülen · başarı% · trend grafiği
Streak takvimi (aylık ısı haritası)
Konu bazlı mastery (zayıf konular üstte, vurgulu)
Geçmiş oturumlar (liste, sayfalı)
```

## 8. Tekrar (Review) — Yanlışlarım / Favoriler
```
[Yanlışlarım] [Favoriler]  ← sekme
Liste: soru kökü kısaltma + konu
[ Bunları tekrar çöz ]  → quiz (review modu)
Boş durum: "Henüz yanlışın yok, harika!"
```

## 9. Paywall
```
┌─────────────────────────┐
│ ✕                        │
│   Premium'a geç          │
│   "Sınırsız çalış,       │
│    tüm konulara eriş"    │
│   ✓ Sınırsız soru        │
│   ✓ Tüm konular          │
│   ✓ Detaylı analiz       │
│   ✓ Reklamsız            │
│  ┌─────────┐ ┌─────────┐ │
│  │ Aylık   │ │ Yıllık★ │ │  ← yıllık vurgulu (avantaj)
│  │ ₺../ay  │ │ ₺../yıl │ │
│  └─────────┘ └─────────┘ │
│  [   Premium başlat   ]  │
│  Satın alımları geri yükle│
│  Şartlar · Gizlilik      │
└─────────────────────────┘
```

## 10. Bildirimler
```
Bildirimler
[● okunmamış] Başlık · zaman
[  okunmuş  ] Başlık · zaman
Boş durum + bildirim tercihleri kısayolu
```

## 11. Profil / Ayarlar
```
Profil: avatar · ad · hedef sınav  [Düzenle]
Aboneliğim: durum  ›
Ayarlar: bildirim tercihleri · tema · dil(ileride)
Yasal: KVKK · Gizlilik · Şartlar
[ Hesabı sil ]  [ Çıkış yap ]
```

---

## 12. Tüm Ekranlarda Ortak Durum Kalıpları
| Durum | Kalıp |
|---|---|
| Yükleme | **Skeleton** (spinner değil) — premium his |
| Boş | Dostça illüstrasyon + tek net aksiyon |
| Hata | Moral bozmayan mesaj + "tekrar dene" |
| Offline | Üstte ince rozet; cache gösterilir |
| Premium kilit | Rozet + dokununca paywall |

## 13. Tasarım Notları (gerçek UI aşamasına girdi)
- Alt tabbar 4 sekme; quiz/paywall tam ekran.
- Dokunma hedefleri ≥44pt (erişilebilirlik).
- Dinamik yazı tipi, VoiceOver etiketleri, kontrast AA.
- Tutarlılık `core/theme` design system'den gelir (Doc 3 §5.6).
- Bu wireframe **yapısal**; renk/tipografi/mikro-animasyon gerçek tasarım fazında (Doc 1 kalite referansları ışığında).

## 14. Bu plan → sonraki adım
Wireframe onaylanınca gerçek UI tasarımı (yüksek-fidelity) ayrı bir tasarım aşamasıdır — bu proje planında kod öncesi son görsel katman. Sprint planında (Doc 13) tasarım-sistemi kurulumu ilk sprintlerden biridir.
