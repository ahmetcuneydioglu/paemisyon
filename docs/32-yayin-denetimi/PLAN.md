# Doc 32 — Yayındaki Soruların Denetimi

Başlangıç: 28 Ağustos 2026 · Kapsam: `status = published` soru sürümleri
(Doc 31 yalnız onay kuyruğunu kapsıyordu; bu külliyat hiç denetlenmemişti.)

---

## 0. Külliyat kuyruk gibi tek parça değil

Ölçüm (`scripts/yayin-kapsam.ts`) iki ayrı problem gösteriyor:

| Blok | Soru | Doğrulama zemini |
|---|---:|---|
| **Mevzuat** — CMK 487, TCK 251, Anayasa 247, PVSK 93, Kabahatler 92, Bilgi Edinme 86, 657 83, +30 kanun | ~1660 | Resmî metin elde (`LawArticle`) ya da çekilebilir. Doc 31 yöntemi birebir işler. |
| **Mevzuat dışı** — Genel Kültür 731, İnkılap 486, Silah Bilgisi 285, İdare doktrini 194, İngilizce 155, İnsan Hakları 147, Protokol 139, Türkçe 106 | ~2250 | Tek yetkili metin yok. "Kaynak gösterilmeden doğru kabul etme" kuralı burada kilitler. |

Yapısal olarak külliyat temiz: doğru cevabı olmayan **0**, birden fazla doğru
işaretli **0**, 4'ten az şıklı **0**, boş şık **0**. Buna karşılık **%65'inin
(2532) açıklaması yok** — kontrol edilecek gerekçe olmadığı için doğrudan resmî
metne gitmek gerekiyor.

### Kullanıcı kararları (28 Ağu 2026)

1. Mevzuat dışı blok → **yalnız eskime taraması** (tam denetim değil)
2. Uygulama → **kesin kusurlar otomatik düzeltilir**, yoruma açık olanlar rapora
3. Mükerrerler → **elensin**

---

## 1. Aşama 0 — Makine turu (BİTTİ)

Hukuk okuması gerektirmeyen, kesin kusurlar. **Soru sayısı 3908 → 3835.**

| İş | Sonuç |
|---|---|
| Katı mükerrer eleme | 50 küme, 51 soru arşivlendi. 5'inde sınavda kullanılan taraf tutuldu. |
| Kaynak filigranı temizliği | 29 yerde son şıkka yapışmış `MEMURA` / `MEMUR A` / `SAYMANA` silindi |
| OCR düzeltmesi | `ver almaz`→`yer almaz` (2), `ge lişmeleri`→`gelişmeleri`, `kurul ması`→`kurulması`, `hangisi dir`→`hangisidir` |
| Gevşek mükerrer eleme | Temizlik sonrası 21 küme daha çıktı; 22 soru arşivlendi |
| `articleNo` denetimi | 638 bağlantının 602'si çözülüyor, **mülga maddeye giden yok**. 36'sı çözülmüyor (aşağıda) |
| **Banka içi çelişki** | 23 aday, **5'i gerçek** — aşağıda |

### 1.1 Banka içi çelişki taraması — yöntem

Doc 31'in son ve en değerli keşfi (`6089f30c`). Mekanik, hiç metin okumadan
kusur bulur. Üç şart birlikte aranır (`scripts/yayin-celiski.ts`):

1. **Aynı şeyi soruyorlar mı** — kök jetonlarında Jaccard ≥ 0.55
2. **Şıklar örtüşüyor mu** — ya çapraz (A'nın doğrusu B'de yanlış işaretli) ya da şık seti Jaccard ≥ 0.6
3. **Kutup aynı mı** — "doğrudur" / "yanlıştır" farkı varsa cevabın farklı olması normaldir

Tek başına kök benzerliği **yetmez** (şablon kökler), tek başına şık ortaklığı da
**yetmez** ("3 gün / 7 gün / 15 gün" ya da şehir adları gibi jenerik havuzlar).
Ayrıca "Yalnız I / I ve II" biçimindeki öncül göndermeleri şık olarak ayırt edici
değildir, elenir. `norm()` Türkçe küçültme yaptığı için büyük `I` **noktasız `ı`**
olur — desenler bunu karşılamalı.

### 1.2 Bulunan gerçek çelişkiler

| Soru | Kusur | Karar |
|---|---|---|
| `ac3ebc09` | `1f368ff4` ile aynı kök + AYNI ŞIK SETİ; o "Ankara Antlaşması", bu "Gümrü" diyordu | **Düzeltildi** → B) Ankara Antlaşması. Gümrü (3 Ara 1920) Ermenistan ile; Fransa–İngiltere ayrılığına yol açan 20 Eki 1921 Ankara Antlaşması'dır. |
| `aa674a5f` | `73683c8c` ile aynı kök + AYNI ŞIK SETİ; o "Kapitülasyonlar", bu "Türkiye-Irak sınırı" diyordu | **Düzeltildi** → D) Kapitülasyonlar. Kapitülasyonlar Lozan'da kaldırıldı; Musul sorunu 1926'ya kadar sürdü. |
| `918c0f9b` · `491525b2` | Filigran artığı yüzünden mükerrer taramasından kaçmışlardı | Temizlendi, ardından mükerrer olarak arşivlendi |
| `f870fba2` | "Devlet Personel Başkanlığı" — DPB 2018'de kaldırıldı | **Kusur değil.** 657 m.105/6 resmî metni hâlâ DPB diyor; soru "Kanun'a göre" soruyor. |

### 1.3 Yanlış pozitif olarak kapatılanlar — tekrar açılmasın

| Çift | Neden meşru |
|---|---|
| `8dcb48a1` / `92c24c24` | İl kurulu → Vali, İlçe kurulu → Kaymakam |
| `b2894d32` / `8d95537b` / `716b11a4` | TCK m.66 farklı ceza dilimleri → farklı zamanaşımı |
| `d147644b` / `d03c2433` | Fişek parçası olmayan iki ayrı şey (yay / ateşleme pimi) |
| `c6e8aaf4` / `3e324e18` | Viyana Sözleşmesi m.30 (özel konut) ≠ m.29 (kişisel dokunulmazlık) |
| `15/16/17/18/21/22` (4483) | Farklı görevliler → farklı merci |
| `1a8cc32a` / `5cfd3fe7` | İstifa 8-9 Tem 1919: Amasya'dan (22 Haz) **sonra**, Erzurum'dan (23 Tem) **önce** — ikisi de doğru |
| `246b46d8` / `fbcc5966` / `378a030d` | Farklı ödül dalları |
| `875597ab` / `839b5a2a` | Yerleşme-seyahat (m.23) ve düşünce-kanaat (m.25) ikisi de "Kişinin Hakları ve Ödevleri" |
| `74f6f603` / `db4c231e` | Aynı görev listesini ters yönden soruyorlar, tutarlılar |

### 1.4 Çözülmeyen 36 `articleNo` — açık iş

- **Çoklu madde yazımı** (9): TCK `m.43, 44, 81` · `m.45-49` gibi. Doc 31'de bu
  sınıf "birincil maddeye indir" kuralıyla düzeltilmişti; aynısı uygulanacak.
- **Konusunda resmî metin olmayan** (~15): Protokol, İnkılap, İdare Hukuku,
  İnsan Hakları, Genel Kültür — `articleNo` bu konularda anlamsız, temizlenmeli.
- **Yanlış konuya bağlı** (1): `Anayasa m.118` — Anayasa metni "T.C. Anayasası"
  konusunda duruyor, soru "Anayasa" konusunda.
- **Alt fıkra gösterimi** (1): CMK `m.219/1` → `219`.
- **Metni yüklenmemiş kanun** (4): 6458 m.102.

---

## 2. Aşama 1 — Mevzuat bloğu (~1660) · SIRADAKİ

Madde kümesi bazında çalışılır: resmî metin bir kez çekilir, o maddeye bağlı
**tüm** sorular birlikte okunur. Böylece doğrulama ve banka içi tutarlılık aynı
anda görülür. 3908'i 7'şerli turlarla okumak ~550 tur ederdi; madde kümesi bunu
kırar.

**Öncelik sırası** (Doc 31'de kusurun nerede yoğunlaştığına göre):

1. **Sayısal/süreli hükümler** — en sık kusur buradaydı: 2820 m.8 `30→3 gün`,
   2839 m.39 `60→90 gün`, 2839 m.12/A `7→3 gün`
2. Yetki / merci soruları
3. Tanım soruları

**Kanun sırası** — küçük ve tamamen maddeye bağlı olanlar önce (hızlı kazanç):

| Sıra | Konu | Soru | Resmî metin |
|---|---|---:|---|
| 1 | PVSK | 93 | 42 md ✓ |
| 2 | Kabahatler | 92 | 52 md ✓ |
| 3 | Bilgi Edinme | 86 | 33 md ✓ |
| 4 | 657 | 83 | 337 md ✓ (`articleNo` yok, önce bağlanacak) |
| 5 | 4483 · İYUK · İl İdaresi · Arama Yön. | 120 | ✓ |
| 6 | Anayasa | 247 | 210 md ✓ |
| 7 | TCK | 251 | 349 md ✓ |
| 8 | CMK | 487 | 349 md ✓ |

---

## 3. Aşama 2 — Mevzuat dışı blok (~2250) · yalnız eskime taraması

Tam denetim **yapılmayacak** (kullanıcı kararı). Hedef, zamanla yanlışa dönen
sorular:

- güncel rakam / yönetici adı / kurum adı içerenler
- "şu anda", "günümüzde", "son", "hâlen" gibi zamana bağlı ifadeler
- değişmiş idari yapı (ör. kaldırılan bakanlık/kurum adları)
- eski nüfus, il sayısı, sıralama verileri

Çıkan her şüpheli **tek tek kaynakla** doğrulanır; doğrulanamayan
`manuel_inceleme` olarak işaretlenir, tahmin yapılmaz.

---

## 4. Yöntem kuralları — Doc 31'den öğrenilenler

1. **Kaynak gösterilmeden hiçbir soru doğru kabul edilmez.** Kayıtta madde
   numarası ve resmî metinden alıntı bulunmak zorunda.
2. **Şıkların HEPSİ kontrol edilir.** Doc 31'de en sık yakalanan kusur çift doğru
   cevaptı; yalnız işaretli şıkka bakmak yetmez.
3. **Dipnotlar okunur.** Değişiklik geçmişi orada: 7573 s.K. (657 m.56/57) ve
   4778 s.K. m.16 (2839 m.39 `altmışıncı`→`doksanıncı`) böyle yakalandı.
4. **Emin değilsen tahmin yok** — `tartismali` / `manuel_inceleme`.
5. **Doktrin sorusunda tek geçiş yetmez.** Doc 31'de kendi hukuki değerlendirmem
   iki kez çürütüldü (`5613acc6` TCK m.30/2, `6089f30c` m.43/2). Çekişmeli
   doğrulama şart.
6. **Canlı içerikte her yazma öncesi yedek.** Bu klasördeki `*-yedek*.json`
   dosyaları soru sürümü kimliği + eski kök/açıklama/şık metinlerini tutar;
   `scripts/isim-geri-al.ts` deseniyle geri alınabilir.
7. **Sınavda kullanılmış soru arşivlenmez** — mükerrer elemede bu kural, geçmiş
   sonuçların bozulmasını engelledi (5 soruda devreye girdi).
8. **Filtre yazarken Türkçe küçültmeye dikkat** — `'I'.toLocaleLowerCase('tr')`
   noktasız `ı` verir; `â î û` harf sınıfına alınmazsa "hâkim" içindeki H tek
   harf sanılır.

---

## 5. Scriptler

| Dosya | İş |
|---|---|
| `yayin-kapsam.ts` | Kapsam ölçümü — ders dağılımı, yapısal kusur, madde yoğunluğu |
| `yayin-mukerrer.ts` | Mükerrer kümeleri + cevapları çelişiyor mu |
| `yayin-mukerrer-ele.ts` | Mükerrer eleme (`--gevsek` noktalama duyarsız mod) |
| `yayin-artik.ts` | Kaynak filigranı + gevşek parmak izi mükerreri |
| `yayin-ocr.ts` | OCR bozulma kalıpları |
| `yayin-metin-temizle.ts` | Filigran + OCR temizliği |
| `yayin-celiski.ts` | Banka içi çelişki taraması |
| `celiski-dok.ts` | Çelişki adaylarını tam metinle döker |
| `yayin-cevap-duzelt.ts` | Kaynakla doğrulanmış cevap anahtarı düzeltmesi |

Hepsi varsayılan olarak **kuru çalışır**; yazma `--yaz` ile.
