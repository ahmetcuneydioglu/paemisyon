# Paemisyon — Proje Kuralları

Monorepo: `apps/api` (NestJS+Prisma), `apps/admin` (Next.js, :3001),
`apps/web` (Next.js, :3002), `apps/mobile` (**Flutter** — SwiftUI DEĞİL).
Ürün anayasası: `docs/24` (kullanıcı yolculuğu), `docs/25` (bilgi mimarisi).

## Tasarım ve kod kalitesi standartları (kullanıcı talebi — bağlayıcı)

Bu kurallar her UI kodu yazımında geçerlidir; "sonradan düzeltiriz" yaklaşımı yasaktır:

1. **Production kalitesi, ilk seferde.** Geçici component yok, placeholder yok,
   "çalışan ama çirkin" ekran yok. Premium hissi veren ürün hedeflenir.
2. **Tasarım sistemi önce gelir.** Her yeni ekran şu sistemleri KULLANARAK yazılır
   (sistem yoksa önce sistem kurulur):
   - Design token sistemi (renk, tipografi, spacing, radius, gölge)
   - Typography ölçeği · Spacing ölçeği · Color paleti · Icon seti
   - Component Library (buton, kart, liste satırı, sheet, progress, rozet…)
3. **Her component yeniden kullanılabilir** — tek ekrana özel widget/component
   yazılmaz; varyant parametreleriyle genelleştirilir.
4. **İlk günden:** Dark Mode desteği, animasyon/geçişler, accessibility
   (semantics/kontrast/dokunma hedefleri ≥44pt), responsive yapı (küçük telefon →
   tablet; web'de mobil → masaüstü).
5. **Mobil (Flutter):** Apple Human Interface Guidelines'a uygun his (iOS birincil
   hedef); Flutter'ın güncel idiyomları (Material 3 altyapısı üstünde Cupertino
   duyarlılığı, `ThemeExtension` ile token'lar). SwiftUI kullanılmıyor — mobil
   uygulama Flutter'dır.
6. **Web (Next.js + Tailwind):** token'lar CSS custom property + Tailwind theme
   olarak tek kaynaktan; koç kartları/seans oynatıcı web'de de aynı tasarım dilini
   kullanır.

## Çalışma prensipleri

- "Doğru geliştir" > hızlı geliştir; teknik borç bırakma.
- Büyük özellik: plan → onay → uygulama. Her özellik gerçek veriyle/E2E doğrulanır.
- Supabase pooler 15 bağlantı limiti: DB-yazma pencerelerinde backend durdurulur;
  scriptler `connection_limit=1` ile ve `apps/api/scripts/` altında çalıştırılır.
- `.env` ve SQL dump'ları asla commit edilmez. Secret değerler yalnız platform
  panellerine (Railway/Vercel) elle girilir.
- Koç kuralları SUNUCUDA yaşar (`/me/coach`); istemciler kural bilmez.
- Soru bankasının varlık nedeni "gerçek, kaynaklı çıkmış soru" güvenidir:
  AI soru üretimi yapılmaz; kaynak etiketi her zaman görünür.
