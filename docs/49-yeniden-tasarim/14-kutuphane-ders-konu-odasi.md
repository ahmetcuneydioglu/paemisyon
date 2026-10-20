# Kütüphane — Ders odası ve Konu odası (plan, onaylı 20 Eki 2026)

Figma: PaemisyonNew sayfa "Page 1" → "Ders odası · Koyu/Açık" (15:621 / 15:816),
"Konu odası · Koyu/Açık" (15:740 / 15:935), tam akışlar 15:1026 / 15:1146.
Karar: ders kartına dokunan kullanıcı menü değil **ders odası** görür: durum paneli → koç
satırı → **konular (gövde)** → araçlar → tek "Başla". Konuya dokununca **konu odası**
(küçük sayfa): durum, koç cümlesi, "Bu konuda" (yanlışlar, favoriler, ilgili maddeler),
"Başla · <konu>'dan 10 soru" + ikincil "Yanlışları çöz". Bilgi kartları KARAR BEKLİYOR —
kodda hiç gösterilmez (ne satır ne yer tutucu). "Son turların" ilk sürümde yok (konu
bazlı tur geçmişi tutulmuyor; sonra).

## Kurallar
- Veri ve cümleler sunucudan (`/me/course-room/:courseId`, `/me/topic-room/:topicId`);
  istemci eşik bilmez. Yüzde tonu sunucudan gelen `band`: `weak` (<%50), `normal`,
  `strong` (≥%75) — Performans zayıf konu eşiğiyle aynı sabitten.
- "En zayıf" = konu listesindeki en düşük doğruluk (en az 5 çözümlü konular arasında).
- Tur kaynakları: `source: "course_room" | "topic_room"` (HomeSource'a eklenir).
- Native başlık tek satır ("Yürütme"); ders adı panel üstünde etiket.
- Kaynak etiketi/sourceLabel yine gösterilmez.

## Aşamalar
| K1 API | `CourseRoomService`: ders durumu (doğruluk, çözülen, sınav payı, en zayıf), konular (ad, soru, doğruluk, band, plan bağı), araç sayıları (yanlış, favori, kanun madde sayısı + slug), koç cümlesi; konu odası: durum, band, planda mı, yanlış/favori sayısı, ilgili madde aralığı (topic↔article eşlemesi varsa), koç cümlesi | spec'ler; E2E yerel |
| K2 Expo | `kutuphane/ders/[id]` ders odası olarak yeniden; yeni `kutuphane/konu/[topicId]`; kit: `StatPanel`(panel), `TopicRow`; source'lar | sim + telefon |
| K3 Web | `/kutuphane/ders/[id]` ve `/kutuphane/konu/[id]` aynı iki ekran | pane + axe |
| K4 | Bilgi kartları — ayrı plan (dayanaklı, önceden üretilmiş, insan onaylı) | — |

## İlerleme
