# Doc 15 — AI Entegrasyon Stratejisi

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 1 (AI kişiselleştirme değeri), Doc 3 (`infra/ai` adapter), Doc 14 (R1 içerik, R8 mevzuat, R10 maliyet).
> **Kapsam:** AI'ı nerede, nasıl, hangi maliyet ve güvenlik kontrolüyle kullanacağımız. Güncel Claude modelleriyle (2026) hizalı.

---

## 1. AI Felsefesi (üç tavizsiz kural)

1. **AI asla otomatik yayın yapmaz.** Üretilen her içerik (soru, açıklama) bir **insan uzman onayından** geçer (Doc 6/9 editoryal akış). Yanlış mevzuat kullanıcıya zarardır (R8). AI hız verir, sorumluluğu değil.
2. **AI yalnızca backend'de çalışır.** API anahtarı istemcide asla bulunmaz; tüm çağrılar NestJS `ai` modülünden (Doc 3). İstemci sonucu gösterir, üretmez.
3. **Sağlayıcı soyutlanır.** `infra/ai` bir adapter arkasında; model/sağlayıcı değişimi tek yerden yapılır (vendor kilidi yok).

---

## 2. Kullanım Alanları (öncelik sırasına göre)

| # | Kullanım | Değer | Faz | İnsan onayı |
|---|---|---|---|---|
| A | **İçerik taslağı üretimi** (soru + açıklama + mevzuat referansı önerisi) | R1'i (en büyük risk) doğrudan azaltır | V1 | ✅ Zorunlu (yayın öncesi) |
| B | **Kişiye özel çalışma planı** (zayıf konu → öneri) | Vizyonun kişiselleştirme sütunu | V1 | — (öneri, kullanıcıya) |
| C | **Zayıf nokta analizi** (istatistikten içgörü) | Motivasyon + verimlilik | V1 | — |
| D | **AI Koç / soru-cevap** (mevzuat/konu açıklama) | Farklılaşma | V2 | — (kaynak-bağlı yanıt) |
| E | **Açıklama zenginleştirme** (var olan soruya çözüm metni) | İçerik kalitesi | V2 | ✅ |

> **MVP'de AI yok.** MVP çekirdek öğrenme döngüsünü kanıtlar; AI V1'de devreye girer. Ama `infra/ai` adapter ve DB kancaları (Doc 6 `study_plans`, `recommendations`) MVP'de hazır — sonradan migration ağrısı olmaz.

### En kritik: A — İçerik taslağı üretimi
İş akışı (R1 + R8'i birlikte çözer):
```
Editör konu seçer → AI taslak soru + şık + açıklama + önerilen mevzuat referansı üretir
  → editör panelde "in_review" kuyruğunda görür
  → uzman DÜZELTİR + mevzuatı DOĞRULAR + onaylar → published
AI'nın ürettiği hiçbir şey doğrudan yayına çıkmaz.
```
Bu, soru bankasını sıfırdan doldurma hızını katbekat artırır ama doğruluğu insana bırakır.

---

## 3. Model Seçimi ve Maliyet Katmanlaması

**Karar: Claude API (Anthropic).** Türkçe kalitesi, akıl yürütme ve yapılandırılmış çıktı desteği güçlü. Adapter sayesinde gerekirse değiştirilebilir. İş yüküne göre üç katman:

| Katman | Model | Fiyat (giriş/çıkış, 1M token) | Nerede |
|---|---|---|---|
| Ucuz/yüksek hacim | **Claude Haiku 4.5** | $1 / $5 | Basit sınıflandırma, kısa öneri, zayıf-konu etiketleme (C) |
| Dengeli (varsayılan) | **Claude Sonnet 5** | $3 / $15 (2026-08-31'e dek giriş $2/$10) | Çalışma planı (B), AI koç (D), açıklama (E) |
| En zor | **Claude Opus 4.8** | $5 / $25 | Karmaşık mevzuat sorusu üretimi + doğrulama önerisi (A) |

> İlke: **en ucuz yeten modeli kullan.** Soru üretimi gibi doğruluğun kritik olduğu yerde Opus; günlük öneri gibi hacimli işte Haiku. Model seçimi de adapter'da yapılandırılır, koda gömülmez.

---

## 4. Maliyet Kontrolü (R10'a doğrudan yanıt)

Solo geliştirici + abonelik geliri dengesi için AI maliyeti disiplinli yönetilir:

1. **Batch API ile toplu içerik üretimi** — soru taslakları interaktif değil; Anthropic Batch API **%50 indirimli**. Yüzlerce soru taslağı gece toplu üretilir.
2. **Prompt caching** — ortak bağlam (mevzuat metni, üretim talimatı, konu şablonu) tekrar tekrar gönderilir; cache ile tekrar eden kısım ~%90 ucuzlar.
3. **AI özellikleri premium-öncelikli** — AI çalışma planı/koç gibi maliyetli özellikler premium abonelere (freemium'da sınırlı). Gelirle maliyet dengelenir.
4. **Sonuç cache'leme** — aynı zayıf-konu profiline aynı plan; tekrar üretme yok.
5. **Maliyet izleme** — admin panelde AI harcaması takibi (Doc 9 analitik); bütçe eşiği aşılırsa uyarı.

---

## 5. Teknik Mimari (özet)

```
İstemci → NestJS API → ai modülü
                        ├── AIProvider adapter (Claude API)
                        ├── ContentDraftService (A) — Batch, insan onayı kuyruğuna
                        ├── StudyPlanService (B) — istatistikten plan
                        ├── InsightService (C) — zayıf konu
                        └── CoachService (D) — kaynak-bağlı Q&A
```
- **Yapılandırılmış çıktı:** Soru üretimi JSON şemasına zorlanır (kök, 4-5 şık, doğru cevap, açıklama, mevzuat) → parse hatası yok, doğrudan `question_versions` taslağına yazılır.
- **Kaynak-bağlı (grounded) yanıt:** AI koç, uydurmasın diye yalnızca onaylı içerik/mevzuattan yanıt verir (halüsinasyon riski, R8 ile bağlantılı).
- **Adaptive thinking:** Karmaşık üretim/akıl yürütme için açık; basit işlerde kapalı — maliyet/kalite dengesi.

---

## 6. Güvenlik & Gizlilik
- API anahtarı yalnızca sunucu ortam değişkeninde; istemcide/binary'de asla (Doc 8 ilkesi).
- Kullanıcı verisi AI'a giderken minimize edilir (KVKK, R9); kişisel tanımlayıcılar gönderilmez, yalnızca gerekli öğrenme sinyalleri.
- AI çıktısı loglanırken PII sızdırılmaz.

---

## 7. Vizyona hizmet
| İlke | AI karşılığı |
|---|---|
| İçerik güncelliği = güven | AI taslak üretir, uzman mevzuatı doğrular; otomatik yayın yok |
| Kişiselleştirme | Çalışma planı + zayıf konu analizi + koç |
| Sürdürülebilir maliyet | Katmanlı model + Batch + cache + premium-öncelikli |
| Backend tek kaynak | Tüm AI sunucuda, adapter arkasında, anahtar istemcide yok |
| 10 yıl esneklik | Sağlayıcı-agnostik adapter; model tek yerden değişir |
