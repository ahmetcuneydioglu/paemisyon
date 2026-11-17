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

## 7. Yayın (17 Kas 2026, kullanıcı kararı)

- Beş belge yayımlandı (`mevzuat-yayinla.ts`: iheb, eskhus, mshus, bm-iskenceye-karsi-sozlesme,
  avrupa-konseyi-statusu; 194 kayıt) ve 167 kart toplu yayınlandı (`kart-toplu-yayin.ts`: kapıdan 167/167). Prod'da
  toplam 7.464 kart yayında, incelemede 0.
- **BM Andlaşması bankaya alındı, TASLAK** (`bm-andlasmasi`, Başlangıç + 111 madde). Md 105/1'in okunamayan son
  sözcüğü tahminle doldurulmadı; metinde "fayda… [sözcüğün devamı Resmî Gazete nüshasında okunamıyor]" olarak durur.
  Künye, metnin 1945 hâli olduğunu, 23/27/61/109. maddelerdeki sayıların sonradan değiştiğini ve "süreli/süresiz"
  terimini belirtir. Yayımlanmadı, kart üretilmedi.
- İl ve İlçe İnsan Hakları Kurulları yönetmeliği alınmayacak (kullanıcı kararı).

## 8. BM Andlaşması: yayın ve kartlar (17 Kas 2026, kullanıcı kararı)

Kullanıcı "yayınla ve üret" dedi. Belge yayımlandı (112 kayıt). Kartlar yalnız değişmeyen maddelerden üretildi; girdiye
ALINMAYANLAR: md 23, 27, 61, 108, 109 (üye sayıları ve oy çoklukları sonradan değişti), md 105 (okunamayan sözcük),
md 73–91 (özerk olmayan ülkeler ve vesayet), md 106–107, 110–111.

| Deste | Kapsam | Üretim | Son |
| --- | --- | --- | --- |
| ih-bm-1 | Başlangıç, md 1–22 (amaç, ilke, üyelik, organlar, Genel Kurul) | 24 | 22 |
| ih-bm-2 | md 24–26, 28–54 (Güvenlik Konseyi, barışçı çözüm, zorlama önlemleri, bölgesel anlaşmalar) | 21 | 14 |
| ih-bm-3 | md 55–60, 62–72, 92–104 (ekonomik ve sosyal işbirliği, Divan, Sekretarya) | 18 | 16 |

52 kart yayında (toplu yayın kapısından 52/52). İnsan Hakları turunun toplamı: altı belge, on iki deste, 219 kart.

- **Terim eşlemesi:** Birleşmiş Milletler Şartı / BM Şartı (metinde Andlaşma), Güvenlik Konseyi (Güvenlik Meclisi),
  Ekonomik ve Sosyal Konsey, Vesayet Konseyi, Uluslararası Adalet Divanı (Milletlerarası Adalet Divanı), Sekretarya,
  uzman kuruluşlar (ihtisas müesseseleri), daimî/geçici üye (metinde süreli/süresiz). Banka belgeyi "Birleşmiş
  Milletler Antlaşması" adıyla da soruyor.
- **Denetimde eskimiş sayı ya da ters terim karta sızmadı** (altı denetçi). Uygulamada işlememiş hükümlere dayanan
  kartlar çıkarıldı: özel anlaşmalar ve hazır hava birlikleri (md 43–45), Askerî Kurmay Komitesi (md 47), silahlanma
  planları (md 26), "düşman devlet" istisnası (md 53), vesayet anlaşmaları (md 16).
- **Kaynak eksiği (en önemlisi):** Güvenlik Konseyi'nin üye sayısı, beş daimî üye, veto ve geçici üyelerin süresi
  kartsız kaldı; bankada Konsey hakkında sorulanların çoğu budur. Şart'ın değişiklik işlenmiş güncel resmî metni ya
  da ayrı bir dayanak gerekir. Divan'ın merkezi, yargıç sayısı ve seçimi (Divan Statüsü; dökülmedi), Genel
  Sekreter'in görev süresi, uzman kuruluş adları da metinde yok.
- Altı ana organı sayan kart Vesayet Konseyi'ni de sayar (metne sadık); Konsey'in 1994'ten beri çalışmadığı karta
  yazılmadı.
- Hakemlerin eklediği ya da yeniden kurduğu 8 kart iki denetçiden geçmedi (mekanik kapı + hakem).

