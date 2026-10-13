# Doc 48 / Faz 2 — Low-fi Wireframe

> Durum: **onay bekliyor** (14 Eki 2026). Figma:
> https://www.figma.com/design/qHrLLOXtJSIqpKxTx2FrYi
> Low-fi ve gri tonlu. Tek vurgu rengi birincil eylemi gösterir.
> Cihaz 393×852 (iPhone 15). Renk, tipografi ve koyu tema Faz 3'te gelecek.

## Dosyadaki ekranlar (sayfa "Wireframe — Bugün")

| Grup | Ekranlar |
|---|---|
| Yerleşim A — Klasik dikey (CTA kartın içinde) | A1 Normal · A2 Yarım tur (taze) · A3 Yarım tur (eski) · A4 İlk gün · A5 Boş (tarih yok, veri az) · A6 Hedef tamam · A7 Dönüş · A8 Çevrimdışı · A1 tam uzunluk |
| Yerleşim B — Başparmak önce (CTA + odak sabit çubukta) | B1–B8, aynı 8 durum |
| Odak akışı | O1 kök · O2 dersler · O3 konular · O4 seçim yapılmış kök |
| Karşılaştırma | "A mı B mi? — aday gözünden" kartı |

## Wireframe sırasında verilen tasarım kararları (Faz 1'e ek)

1. **Zayıf konular Hazırlık'ın başında.** Ders listesi ikinci sırada. S3'ün tek dokunuşluk
   yolu ilk ekranda kalır. Zayıf konu satırının eylemi sayıyı söyler: "10 soru ›".
2. **Dönüş durumunda zayıf konular gizli** (Doc 24 §7.1). Dönen adaya önce güçlü
   konudan kısa bir tur sunulur, zayıflık listesi o gün gösterilmez.
3. **Kartta aynı anda tek ilerleme.** Yarım turda kart turun ilerlemesini gösterir
   ("4/10 soru"); günlük halka o sırada gizlenir. İki benzer kesir yan yana durmaz.
4. **Yarım turdan çıkış yolu.** "Şimdilik bitir, sonucu gör" metin bağlantısıyla sunulur
   (D3 ile tutarlı: çözülenler ilerlemeye yazılır). Yeni tur açan ikinci bir düğme yok.
5. **Mevzuat kısa yolu maddenin adını taşır:** "TCK md. 81 — Kasten öldürme" ve kanunun
   tam adı. Bu yüzden yer imi yanıtına `lawName` eklenmeli (bugün yalnız `lawShort` dönüyor).
   Faz 4'te B12 olarak küçük bir API eklentisi.
6. **Odak listesi 3 satır:**
   - Koç seçsin
   - Ders veya konu (tek hiyerarşik seçici)
   - Yanlışlarım

   Doc 25'teki ayrı "Konu seç" satırı hiyerarşik seçiciye katıldı. Kanun/madde satırı,
   web'deki seçili mevzuat mobile gelince eklenir.
7. **Odak ders → konu inişi aynı sheet'te yığın olarak ilerler.** Konuya dokununca seçim
   yapılır ve köke dönülür. Kökteki birincil düğme seçimi söyler:
   "Başlat · 10 soru · Temel Haklar".

## Karar bekleyen

**A mı B mi?** Önerim B (gerekçe Figma'daki karşılaştırma kartında). Faz 3'te seçilen
yerleşimin tasarım sistemi kurulur. Diğer yerleşim istenirse `home_v2` bayrağı altında
A/B testine kalır.
