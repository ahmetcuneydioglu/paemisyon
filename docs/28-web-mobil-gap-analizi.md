# Doc 28 — Paemisyon Web → Mobil Gap Analizi ve Entegrasyon Yol Haritası

> Statü: TASLAK — onay bekliyor (19 Tem 2026)
> Yöntem: 3 paralel keşif (web rota/bileşen envanteri · mobil feature envanteri ·
> API yüzeyi + tüketici analizi) + Doc 27 W1-W4/B dilimleri durum notları.
> İlke: web'i mobile KOPYALAMAK değil; ortak beyni (API) mobile-native UX ile
> tüketmek. Backend duplicate edilmez — mobil işin ~%80'i "var olan ucu bağlamak".

---

## 1. Web'de son dönemde eklenenler (17-18 Tem dalgası)

Doc 27 (W1-W4 + B dilimleri) ile web "ikinci oda"dan BİNAya dönüştü:

- **App kabuğu:** sidebar + 5 bölgeli mobil alt nav + ⌘K komut paleti + koç rayı
- **Seans Oynatıcı (L3):** klavye öncelikli, limit duvarı, seans içi favori/hata
  bildirimi/not, sonuçta konu kırılımı
- **Devam eden seans:** `GET /quiz/active-session` + `/resume` — Bugün'de çapa
- **Yanlış tekrarı reçetesi:** quiz `mode=review` (free 7 gün, premium süresiz)
- **Favorilerden seans:** `fromBookmarks` bayrağı + /kutuphane/favoriler
- **Madde Atlası tam hali:** LawArticle modeli (resmî metin, mevzuat.gov.tr
  künyesi, admin yayın akışı) + LawWorkspace/ArticleWorkspace + cevap
  feedback'inde `relatedArticle.text` (seansta resmî metin!)
- **Karma mevzuat seansı:** `pickTopicBalanced` — courseId+practice artık konu
  dengeli; kanunlar sayfasında "karışık çöz" kartı
- **Performans:** 12 haftalık ısı takvimi (`/progress/activity?days=84`),
  net trendi, süre şeridi (TimingStrip); Bugün'de 7 günlük nöbet çizelgesi
- **CoachBrief eklentisi:** `weeklyPhoto` (ders bazlı haftalık Δ listesi);
  mode kataloğu 10'a çıktı (onboarding/post_exam/aftermath eklendi)
- **Deneme Oynatıcı yeni:** optik form paneli, sunucu saati, otomatik teslim;
  Deneme Merkezi + net gelişim çizgisi
- **Günün Quizi:** girişsiz 10 soruluk funnel (`/public/daily-quiz`)
- **Sosyal login:** Google + Apple (PKCE, ortak Supabase kimliği)
- **Tema:** Oto (19:00-07:00 koyu) / Açık / Koyu, `tk-scope` ada mimarisi
- **Premium modeli değişti:** 3 aylık 499,99 TL, MANUEL satış
  (Telegram/Instagram `@paemvemisyon`); free limit 30; `/public/pricing` tek
  fiyat kaynağı; iOS IAP kodu duruyor ama mağaza ürünü yok (pratikte kapalı)
- **Rozet kataloğu sayfası** (`/me/badges`), genel lider tablosu, soru öner

## 2. Mobilde zaten olan ve güncel kalanlar

Bugün/koç sahnesi (kart kataloğunun eski 15 tipi + hero/Odak) · Seans motoru
(practice/daily/exam + AI "Koça sor" + çevrimdışı kuyruk — AI yalnız mobilde!) ·
Öğrenme merkezi (ders detay) · Konu haritası · Onboarding İlk Devriye (webde
YOK) · Atlas fetih çipleri + maddeden seans · Rütbe arması · Seri/sigorta
mantığı (sunucuda) · Deneme akışı (çalışıyor; görsel dili eski) · KVKK hesap
silme (webde de var) · Paywall manuel yol (Telegram/Instagram adımlarıyla —
güncel modelle uyumlu).

## 3. Mobilde var ama ESKİ/EKSİK (B/G sınıfı)

| Konu | Durum |
|---|---|
| CoachBrief modeli | `weeklyPhoto`, `gamification.records`, `streak.freezesLeft` parse edilmiyor; `post_exam`/`aftermath` kartlarının görsel eşlemesi yok |
| Seans feedback | `relatedArticle` (resmî madde metni + künye) modelde DÜŞÜYOR — web gösteriyor, mobil göstermiyor; `mediaUrl` parse edilip render edilmiyor |
| Favoriler/Yanlışlar | Listeler ölü: satır tıklanmıyor, favoriden çıkarılamıyor, listeden seans başlatılamıyor; `fromBookmarks` ve `mode=review` mobil start() imzasında yok |
| Deneme akışı | ExamRunner/ExamResult ham renklerle (token dili dışında); deneme sonrası soru inceleme (`/exams/:id/questions`) yok |
| Odak sheet | "Ders/konu seç" gerçek drill-down değil, katalog ekranına fırlatıyor |
| Paywall/limit metinleri | Free limit artık 30 — mobilde 15 varsayan metin/fallback taraması gerekli |
| Kanun tespiti | TopicsScreen'de istemci regex'i ("istemci kural bilmez" ihlali) — public/laws'daki courseId/topicId eşlemesi kullanılmalı |

## 4. Mobilde TAMAMEN eksik (C sınıfı)

1. **Sosyal login (Google/Apple)** — KRİTİK ürün kırığı: web'de Google/Apple
   ile kayıt olan kullanıcının şifresi YOK → mobile hiç giremez. Ekosistem
   "tek hesap" vaadi mobilde kopuyor. (Apple kuralı: 3P login varsa Sign in
   with Apple zorunlu — ikisi birlikte gelir.)
2. **Devam eden seans** — uygulama öldürülünce alıştırma seansı kaybolur;
   mobilde kesinti web'den ÇOK daha normal. Uçlar hazır.
3. **Bildirim altyapısı** — paket bile yok. Seri riski/deneme günü/hedef
   hatırlatması imkânsız; seri mekaniğine dayanan ürün için en büyük boşluk.
4. **Bottom tab navigasyon** — Doc 25 §7 5 sekmeyi tanımlıyor; web mobil
   görünümünde bile var, native'de yok (tek stack + hızlı erişim kutuları).
5. Resmî madde metni yüzeyi (seans + Atlas) — API hazır, `ArticleCard`
   bileşeni yazılmış ve hiç çağrılmamış.
6. 12 hafta ısı takvimi + nöbet çizelgesi (`/progress/activity` hiç çağrılmıyor)
7. Rozet koleksiyonu (`/me/badges` hiç çağrılmıyor)
8. Genel lider tablosu (`/exams/leaderboard/global`)
9. Karma mevzuat seansı giriş noktası
10. İlk Devriye teşhis karnesi (normal sonuç ekranına düşüyor)
11. Tema seçici (sistem takibi var, kullanıcı kontrolü yok)
12. Ayarlarda KVKK/gizlilik/koşullar/destek linkleri (App Store incelemesi
    için pratik zorunluluk) · avatar · soru görseli desteği

## 5. Web'de kalması gerekenler (D sınıfı — mobile taşınmayacak)

SEO kapıları (kanun/madde teaser, /paem, /misyon, hesaplayıcı, lider-tablosu
public sayfası) · Günün Quizi girişsiz funnel'ı (mobil kullanıcı zaten girişli;
mobil 'daily' modu ayrı ve yeterli) · ⌘K komut paleti · Soru Öner formu (mobil
"hata bildir" yeter) · TimingStrip düzeyinde derin süre analizi (mobilde özet
yeter) · üç panolu Atlas okuma düzeni (mobilde sheet/stack daha doğru).

## 6-7. Taşıma kararları (öneri / önermeme)

**TAŞI:** sosyal login, devam eden seans, madde metni (seans+Atlas), review
reçetesi + canlı Favori/Yanlış listeleri, karma mevzuat seansı, weeklyPhoto +
records + freezesLeft, ısı takvimi + nöbet çizelgesi, rozet koleksiyonu,
genel lider tablosu (podyumlu), bottom tab, bildirim v1, tema seçici, yasal
linkler, İlk Devriye karnesi, deneme akışı re-skin + soru inceleme.

**TAŞIMA:** yukarıdaki D listesi + web ödeme/premium sayfa modeli (mobil
paywall manuel akışıyla zaten hizalı) + seans içi not (web'de bile kalıcı
değil; mobilde klavye maliyeti yüksek, değer düşük).

## 8. Mobilde FARKLI tasarlanacaklar (E sınıfı)

- **Navigasyon:** 5'li bottom tab (Bugün · Kütüphane · Denemeler · Performans
  · Ben). Oynatıcılar tam ekran modal (tab bar gizli — mevcut davranış korunur).
  "Hızlı erişim" kutuları kalkar; Bugün sadeleşir.
- **Madde metni:** ayrı sayfa değil, seans içinde "İlgili madde: PVSK m.16"
  dokununca **bottom sheet** (ArticleCard: resmî metin ↔ künye); Atlas'ta çipe
  uzun-bas/bilgi ile aynı sheet.
- **Isı takvimi:** GitHub ızgarasının dikey kopyası değil — yatay kaydırmalı
  12 sütunlu kompakt şerit + "N/84 aktif gün" başlığı.
- **Genel lider tablosu:** web tablosu değil; ilk 3 podyum + liste +
  **sticky "Sen #183"** satırı; Bugün/Hafta/Ay filtreleri mevcut leaderboard
  ekranına 3. sekme olarak.
- **Devam eden seans:** Bugün'de kart + uygulama açılışında yarım seans varsa
  tek dokunuş "kaldığın yerden devam".
- **Haptic:** doğru cevapta hafif, rozet/terfide belirgin (reduce-motion'a
  saygılı) — yalnız anlam taşıyan anlarda.

## 9. Backend: ortak kullanılacaklar (yeni uç GEREKMEZ)

`/quiz/active-session`, `/quiz/sessions/:id/resume`, quiz `mode=review` +
`fromBookmarks`, `/progress/activity?days=14|84`, `/me/badges`,
`/exams/leaderboard/global`, `/exams/:id/questions`, CoachBrief.weeklyPhoto/
records/freezesLeft, feedback.relatedArticle, `/public/laws*` (madde metni —
mobil de public uçtan okur; slug, laws() topicId eşlemesinden çözülür),
karma seans = mevcut `courseId+practice`. **Sıfır şema değişikliği; tek olası
API dokunuşu:** topics yanıtına `isLaw`/`lawSlug` bayrağı (istemci regex'ini
söküp sunucu gerçeğine bağlamak için — additive).

## 10-11. Navigasyon + UI/UX özeti

§8'deki bottom tab + şu ilkeler: her sekme kendi stack'ini korur; Ben sekmesi
profil+ayarlar+rozetler+destek+yasal linkleri toplar; Kütüphane = dersler +
Mevzuat kapısı + Yanlışlarım/Favorilerim kapıları (web `navigation.ts` beş
bölgesiyle birebir — tek zihinsel model). Görsel dil: mevcut token sistemi
(`AppTokens`) her yeni ekranda; deneme akışı token diline çekilir.

## 12. Performans riskleri

Isı takvimi (84 hücre) → tek CustomPaint/basit Wrap, sorun değil ama
setState'i izole et · Global leaderboard → `ListView.builder` (zaten
virtualized) + sayfa boyu sınırlı uç · Madde metni sheet → metin uzun
olabilir, lazy + `SingleChildScrollView`, önbelleğe alma (aynı madde tekrar
açılınca istek yok) · Bottom tab geçişleri → `IndexedStack` ile state korunur,
her sekme kendi provider'ını `autoDispose` etmeden tutmamalı (mevcut 1 dk
cache'ler yeterli) · Sosyal login → ek paket (google_sign_in / 
sign_in_with_apple) boyut etkisi kabul edilebilir.

## 13. Öncelikli yol haritası

**P0 — Mutlaka (ekosistem bütünlüğü + en ucuz/etkili kazanımlar)**
1. Sosyal login: Google + Apple (Supabase OAuth; web ile tek hesap)
2. Devam eden seans: açılış çapası + resume akışı
3. CoachBrief senkronu: weeklyPhoto kartı, rekorlar, sigorta rozeti,
   post_exam/aftermath kart görselleri
4. Seansta resmî madde metni: `relatedArticle` parse + ArticleCard bottom
   sheet (Atlas çiplerinden de erişim)
5. Hafıza döngüsü: `mode=review` + `fromBookmarks` + canlı Yanlış/Favori
   listeleri (satırdan seans, favoriden çıkarma)

**P1 — Çok önemli**
6. Bottom tab navigasyon (5 bölge) + Bugün sadeleşmesi
7. Bildirim v1 (yerel): seri riski akşam hatırlatıcısı + deneme günü;
   ayarlarda aç/kapat + saat
8. Karma mevzuat seansı kartı (Kütüphane/Mevzuat kapısı) + topics'e
   isLaw/lawSlug bayrağı (regex sökümü)
9. Deneme akışı re-skin (token dili) + deneme sonrası soru inceleme
10. Performans: 12 hafta ısı + Bugün nöbet çizelgesi
11. Ayarlar: tema seçici + KVKK/gizlilik/koşullar/destek linkleri

**P2 — Faydalı**
12. Rozet koleksiyon ekranı · 13. Genel lider tablosu (podyum + sticky ben)
· 14. İlk Devriye teşhis karnesi · 15. Avatar · 16. mediaUrl render
· 17. Odak drill-down sheet içinde · 18. Haptic cila paketi

**P3 — Sonra**
19. Push bildirim (FCM/APNs — sunucu işiyle birlikte) · 20. IAP yeniden
aktivasyonu (ürün kararı: manuel model sürerken kapalı) · 21. Web'in
AI-açıklama arayüzü (ters yön: mobildeki "Koça sor" web'e taşınır)
