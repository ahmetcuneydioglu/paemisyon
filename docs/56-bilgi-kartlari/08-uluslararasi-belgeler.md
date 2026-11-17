# Doc 56/08 — Uluslararası insan hakları belgelerinden bilgi kartı (17 Kas 2026)

İnsan Hakları dersinde AİHS, TİHEK ve İnsan Haklarını İnceleme Komisyonu kartları yayındaydı; dersin genel konusundaki
521 sorunun dayandığı öteki uluslararası belgeler bankada yoktu. Bu tur, resmî Türkçe metni Resmî Gazete'de yayımlanmış
beş belgeyi Mevzuat Merkezi'ne ekler ve üstlerinden madde bağlı normal hatla (CLAUDE.md Doc 56 istisnası) kart üretir.
Kaynak pasajı istisnası (§12) KULLANILMADI: dayanak resmî madde metnidir.

## 1. Metinlerin kaynağı

Uluslararası belgeler mevzuat.gov.tr'de yoktur; resmî Türkçe metin Resmî Gazete nüshasındadır. Nüshaları bu turda
kullanıcının açık talimatıyla ("sen indir") oturum indirdi; Doc 29 §13'teki "insan indirir" kuralının bir kerelik
esnetilmesidir, genel kural değişmedi.

| Belge | slug | Resmî Gazete | Kayıt | Bankada |
| --- | --- | --- | --- | --- |
| İnsan Hakları Evrensel Beyannamesi | `iheb` | 27.5.1949 / 7217 | Başlangıç + 30 | taslak |
| Ekonomik, Sosyal ve Kültürel Haklara İlişkin Uluslararası Sözleşme | `eskhus` | 11.8.2003 / 25196 | Başlangıç + 31 | taslak |
| Medeni ve Siyasi Haklara İlişkin Uluslararası Sözleşme | `mshus` | 21.7.2003 / 25175 | Başlangıç + 53 | taslak |
| BM İşkenceye Karşı Sözleşme | `bm-iskenceye-karsi-sozlesme` | 10.8.1988 / 19895 | Başlangıç + 33 | taslak |
| Avrupa Konseyi Statüsü | `avrupa-konseyi-statusu` | 17.12.1949 / 7382 | Başlangıç + 42 | taslak |
| Birleşmiş Milletler Andlaşması | (eklenmedi) | 24.8.1945 / 6092 | Başlangıç + 111 | — |

2003 nüshalarının Resmî Gazete tarih ve sayısı sayfa görüntülerinde basılı değildir (karar sayısı ve tarihi basılıdır,
doğrulandı); tarih ve sayı arşiv adresinden gelir.

## 2. Döküm hattı (taranmış nüshadan madde metni)

Nüshaların hepsi taranmış görüntüdür (1945–1988 PDF, 2003 sayfa GIF'leri); gömülü metin katmanı kullanılamaz.

1. Sayfalar görsele çevrilir, `scripts/pdf-ocr.swift` (macOS Vision, tr-TR) ile okutulur. OCR yalnız yardımcıdır.
2. **Birinci okuma:** bir alt ajan sayfa GÖRÜNTÜLERİNDEN madde madde döker (`antlasma/TALIMAT-DOKUM.md`): basıldığı
   yazım korunur, hafızadan tamamlama yok, okunamayan yer `[?]` ile işaretlenir.
3. **İkinci okuma:** bağımsız bir alt ajan dökümü görüntüyle madde madde karşılaştırır
   (`antlasma/TALIMAT-DOGRULAMA.md`): A anlam, B sözcük, C biçim.
4. `scripts/antlasma-ekle.ts` dökümü bankaya yazar. Kapılar: tekil ve ardışık madde numarası, boş metin yok, `[?]`
   içeren döküm REDDEDİLİR. Önce taslak (draft) yazılır.

Sonuç: altı belgede ikinci okuma A (anlam) bulgusu çıkarmadı; B/C bulguları noktalama ve tek harf düzeyindeydi.
Dökümler ve doğrulama çıktıları `antlasma/<slug>.dokum.json` / `.dogrulama.json`, içe aktarma ayarı
`antlasma/config.json`.

## 3. Kart hattı

`scripts/antlasma-girdi.ts` (taslak maddeleri okur; dersin genel konusundaki soruları desenle süzer) → `kart-uret.ts`
(ünitesiz kip) → `kart-dogrula.ts` → Denetçi A + Denetçi B (bağımsız alt ajanlar, `antlasma/TALIMAT-KART-DENETIM.md`,
sınıflar K1–K10) → hakem (ayrı alt ajan, `antlasma/TALIMAT-HAKEM.md`) → `kart-yukle.ts --replace` (in_review).

| Deste | Kapsam | Üretim | Son |
| --- | --- | --- | --- |
| ih-iheb | İHEB Başlangıç, md 1–30 | 31 | 30 |
| ih-eskhus-1 | ESKHUS Başlangıç, md 1–15 | 24 | 25 |
| ih-eskhus-2 | ESKHUS md 16–31 | 14 | 3 |
| ih-mshus-1 | MSHUS Başlangıç, md 1–15 | 26 | 25 |
| ih-mshus-2 | MSHUS md 16–27 | 22 | 21 |
| ih-mshus-3 | MSHUS md 28–53 | 22 | 13 |
| ih-iskence-1 | İşkence Söz. Başlangıç, md 1–16 | 22 | 19 |
| ih-iskence-2 | İşkence Söz. md 17–32 | 18 | 17 |
| ih-avrupa-konseyi | AK Statüsü (md 26 hariç) | 26 | 14 |
| **Toplam** | | **205** | **167** |

167 kart prod'da `in_review`. Yayın kararı insanındır. Kartlar taslak maddelere bağlıdır: kartlar yayımlanmadan önce
beş belge de yayımlanmalıdır (`PUBLISH=1` yeniden çalıştırma var olan kaydı değiştirmez; panelden ya da durum
güncellemesiyle yapılır).

## 4. Bu turun dersleri

- **Üretici eski dili karta taşıyor ve belgeyi ön yüzde anmıyor.** 1949 ve 1988 çevirilerinin dili ("işbu",
  "mütaallik", "Assamble") kartlara geçti; ön yüzlerin çoğu hangi belgeden söz ettiğini söylemiyordu (benzer hükümler
  dört belgede var). İkisi de hakemde toplu düzeltildi. Sonraki turda `kart-uret.ts` istemine belge kısa adı ve
  "güncel Türkçe" kuralı eklenmeli.
- **Resmî çeviri kusurludur (K9).** Karta özgün metindeki anlam YAZILMAZ (dayanağı yok); kart ya çıkarılır ya da
  kusurlu ibareye dayanmayacak biçimde yeniden kurulur. Saptanan yerler: İşkence Söz. md 1 (bozuk amaç cümlesi),
  md 3/2, md 6/1, md 15 (istisna), md 19/4 (ters olumsuzluk), md 22/2 "imzasız", md 22/3 "tazminat", md 27/1 "otuz
  gün içinde", md 28/2 (eksik sözcük), md 33 (beş dil; nüshadaki İngilizce metin altı); MSHUS md 8/3-c-i ve md 9/3
  "gözaltında", md 9/5 "zorunlu tazminat", md 14/1 (bozuk ibare), md 19/3 bağlaçları, md 24/1 "ya da", md 26 "her
  bağlamda"; ESKHUS md 14; AK Statüsü md 5/a. Bu değerlendirmeler denetçi bilgisine dayanır, özgün metinle
  karşılaştırma insandadır.
- **Eski nüsha eskimiş hüküm taşır (K4).** AK Statüsü 1949 hâlidir: temsilci sayıları (md 26), toplantı ve oylama
  usulleri sonradan değişti; yalnız değişmediği açık temel bilgiler kartlandı. ESKHUS md 19'daki İnsan Hakları
  Komisyonu 2006'da kaldırıldı; raporları bugün metinde olmayan bir Komite inceliyor.
- **Terim eşlemesi (oturum kararı, insan onayına açık).** Kartlar sınavın kullandığı güncel adları kullanır:
  Bakanlar Komitesi (metinde Vekiller Komitesi), Parlamenter Meclis (İstişari Assamble), Genel Sekreter (Umumi
  Kâtip), BM İşkenceye Karşı Komite (resmî çeviride "İşkencenin Önlenmesi Komitesi"; bu ad Avrupa Konseyi'nin
  komitesiyle aynıdır). Bu adlar madde metninde geçmez; denetim raporlarında yazılıdır.
- **Usul ve son hükümlerin sınav değeri düşük.** Yürürlük, depoziter, değişiklik, raporlama takvimi kartlarının çoğu
  çıkarıldı (ESKHUS-2 14 → 3, MSHUS-3 22 → 13).
- **Mekanik kapı yazıyla yazılmış sayıyı ("on sekiz", "üçte iki") saymıyor**; bu kartlarda sayı denetimi denetçilerde.

## 5. Kaynak eksiği (bankada sık, madde metninde yok; kart yazılmadı)

- Belge künyeleri: kabul ve yürürlük tarihleri, hazırlayan organ, bağlayıcılık, Türkiye'nin imza/onay tarihleri,
  "ikiz sözleşmeler" adı. İHEB'e ilişkin 25 sorunun tamamı bu türdendir.
- Türkiye'nin beyan ve çekinceleri (MSHUS md 27; ESKHUS md 13/3–4; İşkence Söz. md 21–22 beyanı, md 30 ihtirazi kaydı).
- İhtiyari protokoller (bireysel başvuru, ölüm cezası, OPCAT), Ekonomik, Sosyal ve Kültürel Haklar Komitesi, komitelerin
  toplanma sıklığı ve yeri.
- Avrupa Konseyi'nin güncel yapısı (üye sayısı, Kongre, Komiser, AİHM ilişkisi).
- BM organları ve uzman kuruluşlar, hak kuşakları, Jellinek, düşünürler, tarihsel belgeler (Aşama 2: madde metni yok;
  kaynak pasajı istisnasının bu derse genişletilmesi ve bir kaynak gerekir — kullanıcı kararı).

Bunlar konu özeti/ders tarafında ya da onaylanacak ayrı bir dayanakla karşılanabilir.

## 6. Açık kalanlar

- **BM Andlaşması bankaya ALINMADI.** Döküm hazır ve iki okumadan geçti (`antlasma/bm-andlasmasi.dokum.json`), ama:
  md 105/1'in son sözcüğünün eki taramada okunamıyor (`[?]`; içe aktarma kapısı reddeder); metin 1945 hâlidir
  (Güvenlik Konseyi 11 üye, 7 oy; Ekonomik ve Sosyal Konsey 18 üye); çeviri daimî üyelere "süreli", seçilen üyelere
  "süresiz" der. Milletlerarası Adalet Divanı Statüsü (aynı nüsha, 70 madde) dökülmedi. Karar kullanıcıda.
- **İl ve İlçe İnsan Hakları Kurulları yönetmeliği** eklenmedi: mevzuat.gov.tr numarası bulunamadı; güncel PDF'i
  kullanıcı indirirse `mevzuat-ekle.ts` ile girer.
- **Yayındaki soruda anahtar hatası** (denetimde yakalandı, bankadaki AİHS md 15/2 ile doğrulandı): "AİHS'e göre
  olağanüstü hâllerde dahi askıya alınamaz" öncüllü soruda (id `d63d559e-99b8-4cbc-b1f7-920bc2ca9fbc`) doğru şık
  "I, II ve III" işaretli; md 15/2 yalnız 4. maddenin 1. fıkrasını korur, "zorla çalıştırma yasağı" (4/2) askıya
  alınabilir; doğru cevap "I ve III". Kullanıcı onayıyla 17 Kas 2026'da anahtar E → D düzeltildi
  (`cikmis-sinav-sik-duzelt.ts`, yedek `scripts/out/`); soruya daha önce verilmiş 6 cevap yeniden puanlanmadı.
- İHEB'in 1949 baskısı bugün bilinen metinden kısa yerler içerir (Önsöz'de bir gerekçe paragrafı, md 16/1'in ikinci
  cümlesi, md 8'de "yetkili"); döküm baskıya sadıktır, bu yerlere dayanan kart yoktur.
- Eklenen kartlar (hakemin eklediği 12 kart) yalnız mekanik kapıdan ve hakemden geçti, iki denetçiden geçmedi.
