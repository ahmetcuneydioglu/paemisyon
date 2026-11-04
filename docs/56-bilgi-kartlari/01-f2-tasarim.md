# Doc 56 / 01 — Aşama 2: Figma tasarımı

Tarih: 4 Kasım 2026. Durum: **tasarım Figma'da; kullanıcı göz incelemesi bekliyor.** Figma dosyası
PaemisyonNew `91lHqxSXl25Gz585TnXqfi`, Page 1, mevcut Çalış v2 çerçevelerinin sağında (x ≥ 14100).
Koyu tema birincil (y = −2451), açık türev hemen altında (y = −1459); admin iki çerçeve (x ≥ 17800).

Bağlantı kalıbı: `https://www.figma.com/design/91lHqxSXl25Gz585TnXqfi/?node-id=<id, ":" yerine "-">`.

## 1. Çerçeveler

| Ekran | Koyu | Açık |
|---|---|---|
| Bileşenler (kit) | `158:672` | `162:989` |
| Konu oku sayfası (karar B: üçüncü bölüm "Bilgi kartları") | `159:681` | `162:1175` |
| Mod seçimi sayfası | `159:913` | `162:1384` |
| Oynatıcı · ön yüz | `159:1166` | `162:1614` |
| Oynatıcı · arka yüz | `159:1211` | `162:1659` |
| Kaydırma geri bildirimi + Geri al şeridi | `161:952` | `162:1728` |
| Oturum sonu | `161:1019` | `162:1795` |
| Admin · liste (1280) | `163:1306` | — |
| Admin · kart detayı (1280 × 1320) | `163:1565` | — |

## 2. Bileşenler (`158:672` içinde; koyu ana bileşenler, açık kopyalar " · Açık" son ekli)

| Bileşen | Düğüm | Kod karşılığı (Expo `components/domain/flashcards.tsx`, web `components/kartlar/`) |
|---|---|---|
| Kart türü rozeti | `158:720` | `FlashcardKindBadge` — ton: accent (Kavram, Sayı), warning (Tuzak), success (Cevap), danger (Tekrar); metin zorunlu |
| Kart durum çubuğu | `158:732` | `FlashcardStateBar` — üç dilim: öğrenildi (success) · öğreniliyor (accent) · yeni (surfaceAlt), 4 pt |
| Bilgi kartları girişi | `158:738` | `FlashcardEntry` — ikon `layers`, başlık, rozet "N tekrar" (warning) / "Yeni" (accent) / "Premium", durum çubuğu, künye, chevron |
| Mod satırı | `158:757` | `FlashcardModeRow` — ikon, başlık, alt yazı, sayı, chevron; sayı 0 → opacity 0.45 + devre dışı |
| Puan çubuğu | `158:769` | `RatingBar` — Tekrar (dangerSoft/dangerInk, `rotate-ccw`) · Biliyorum (accent/onAccent, `check`); 54 pt |
| Bilgi kartı · Ön | `158:782` | `FlashCard side="front"` — 343 × 460, p20, SPACE_BETWEEN: [rozet + kapsam etiketi, favori 44 pt] · soru (Lora SemiBold 24/30, ortalı) · ipucu |
| Bilgi kartı · Arka | `158:793` | `FlashCard side="back"` — rozet "Cevap", favori (dolu, accentInk), cevap (Lora SemiBold 20/27), çizgi, açıklama (Inter 14/20 inkSoft), madde hapları (`ArticlePeek`), köprü "Bu konudan soru çöz" |
| Rota kalemi · Kart tekrarı | `158:830` | Bugün `RouteList` kind `flashcards` |
| Senin için · Kart tekrarı | `158:838` | Bugün `ForYouList` kind `flashcards_due`, eylem "Tekrar et" |
| Geri al şeridi | `158:849` | `UndoStrip` — 5 sn, sonuç metni + "Geri al" (accentInk, 44 pt hedef) |
| Yeni ikonlar | `158:676`–`158:714` | Lucide: layers, bookmark, x, check, clock, arrow-right, undo, hash, alert-triangle, flame (24 ızgara, 1.75 kontur) |

## 3. Tasarım kararları (ekranlardan okunur)

- **Giriş (karar B):** "Konu oku" sayfası üç grup: Ünite özetleri · Mevzuat · **Bilgi kartları** (`FlashcardEntry`).
  Aynı satır konu eylem sayfasına ve konu odası "Bu konuda" bölümüne girer; Çalış ana ekranına "Kart tekrarı · N" hapı.
- **Mod seçimi:** başlık + durum çubuğu + açıklama noktaları; birincil düğme sunucunun önerdiği mod ("Tekrara başla · 6 kart");
  beş satır: Yeni · Zorlandıklarım · Favorilerim · Tüm kartlar · Karışık. Sıfır sayılı satır sönük.
- **Oynatıcı:** tam ekran modal (kapat, başlık + "Tekrar zamanı · 12 / 20", seçenekler), 4 pt ilerleme, kart yığını
  (arkadaki kart surfaceAlt, %98 ölçek, 16 pt yukarıda görünür), `RatingBar`, tur sayacı satırı. Tab bar yok.
- **Geri bildirim (damga yok):** kaydırılan kart ±6° eğilir; kenar `success`/`danger` 1.5 pt, üstünde kaydırma mesafesiyle
  orantılı `successSoft`/`dangerSoft` ton katmanı (en çok %18 opaklık), sol üstte köşe rozeti ("Biliyorum" / "Tekrar", ikonlu).
  Eşikte haptic (Success/Warning), kart 140 ms çıkış eğrisiyle süzülür, arkadaki kart %98→%100 yaylanır; reduce-motion'da yalnız opaklık.
  Kart çıkınca 5 sn `UndoStrip`.
- **Oturum sonu:** "BU TUR" etiketi, Lora 64 "16 / 20 biliyorum", koç cümlesi, üç `StatTile` (Öğrenildi +3 · Tekrar kuyruğu 4 ·
  Sonraki tekrar Yarın), günlük kart hedefi kartı (36/40, 6 pt çubuk, seri notu), eylemler: Geldiğin yere dön (primary) ·
  Tekrarı sür · 4 kart (secondary) · Bu konudan 10 soru çöz (ghost).
- **Admin liste:** `PageHeader` + CSV/JSON içe aktar + Yeni kart; beş `Stat` (Yayında, İncelemede, Eskimiş, Mevzuat kontrolü
  bekleyen, Toplam); eskimiş kuyruğu uyarı şeridi; filtre çubuğu (Ders, Konu, Ünite, Durum, Tür, arama); tablo (seçim, ön yüz,
  tür, maddeler, konu · ünite, durum, kaynak etiketi "yalnız panel", mevzuat kontrolü); toplu işlem çubuğu (panel tonu,
  "yalnız admin yayınlar · AI kaynaklı kartlar toplu onaydan geçmez"); sayfalama.
- **Admin detay:** breadcrumb, başlık + durum/tür/sürüm rozetleri, Arşivle/Kaydet; **karar şeridi** (yayın kapısı gerekçesi,
  mevzuat kontrolü select, Yayından al / Yayınla sönük + "neden kapalı" satırı); form (ön yüz, arka yüz, açıklama, tür, zorluk,
  konu, ünite etiketi, madde referansları hapları, kaynak etiketi, üreten); **doğrulama raporu** (✓/✗ satırları, "betik anlamı
  doğrulamaz" notu); geçmiş (audit); sağda yapışkan **Referans maddeler** paneli (resmî metin).

## 4. Token kullanımı

Yalnız v4 değerleri: koyu `bg #141D2A` (Figma'daki mevcut ekranlarla aynı), `surface #1E2B3C`, `surfaceAlt #28374A`,
`ink #F5F0E5`, `inkSoft #BAC4D0`, `inkSubtle #94A0B0`, `line #394657`, `accent #E8B46C`, `accentSoft #2E3447`,
`success/Soft/Ink #8FB39A/#213229/#A6CDB1`, `danger/Soft/Ink #E07A6B/#3F2630/#F3A396`, `warning Soft/Ink #3A3220/#F0CB7E`.
Açık tema aynı haritanın v4 açık değerleri (altın yalnız dolgu; metin olarak `accentInk #8B5E23`). Gölge yok; derinlik
arkadaki kartın tonuyla. Köşe: kart 10, düğme 10 (seans) / 4 (Çalış v2 sheet'i ile uyumlu birincil düğme), hap 999.
Tipografi: Lora SemiBold (başlık, soru, cevap, büyük rakam Lora Medium 64), Inter (gövde, etiket 11/%10 büyük harf).

## 5. İnceleme için notlar

- Göz testi: SE (375) ve Pro Max; kart 460 pt yüksek, SE'de kart + puan çubuğu + sayaç toplamı 852'ye sığıyor (içerik 4+4+476+54+18+24).
  SE'de kart yüksekliği 420'ye düşürülebilir (kodda `compactType` kuralıyla aynı eşik).
- Favori ikonu kartın sağ üstünde; jestle çakışmaması için 44 pt hedef ve `activeOffsetX` eşiği (kodda).
- "Seçenekler" (⋯) menüsü: yazı boyu, kartı bildir, oturumu bitir — ayrı ekran değil `Sheet`.
- Açık tema klonları ayrıştırılmış (detached) kopyalardır; ana bileşenler koyu çerçevededir.

Onay gelince aşama 3 (veri ve API, flag kapalı) başlar: Prisma migration ve CLAUDE.md istisnası ayrıca onaylanır.
