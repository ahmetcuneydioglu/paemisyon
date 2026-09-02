# Tek Harf → Gerçek Ad Değişimi

28 Ağustos 2026 · Sorularda kişi yerine kullanılan `A`, `B`, `S`, `M`… harfleri
gerçek Türkçe adlarla değiştirildi.

## Sonuç

| | Adet |
|---|---:|
| Değiştirilen soru | **207** (kuyrukta 168 · yayında 39) |
| — otomatik | 190 |
| — elle isimlendirilen | 17 |
| Bilerek dokunulmayan | 2 |
| `contentHash` çakışması | 0 |
| Biçim bozulması | 0 |

## Neden mekanik arama-değiştirme yetmez

Kaynak metindeki çekim eki **harfin okunuşuna** göre seçilmiştir:
`A` = /a/ → `A'nın`; `B` = /be/ → `B'yi`; `S` = /se/ → `S'ye`.
Yeni ad konunca ek de yeniden üretilmelidir:

```
A'nın → Ahmet'in      (Tolga olsaydı: Tolga'nın)
B'yi  → Burak'ı       (Ayşe olsaydı:  Ayşe'yi)
S'ye  → Serkan'a
B de  → Burak da      (ayrı yazılan bağlaç da ünlü uyumuna girer)
```

Motor `apps/api/scripts/lib/turkce-isim.ts` içinde: önce ekin **hâli** çözülür
(yalın/ilgi/belirtme/yönelme/bulunma/ayrılma/vasıta/çoğul), sonra ek ünlü uyumu +
kaynaştırma harfi + sertleşme kurallarıyla **yeni ada göre** üretilir.

## Ad havuzu

Baş harf korunur: A→Ahmet, B→Burak, C→Cem, D→Deniz, F→Fatih, G→Gökhan, H→Hakan,
K→Kemal, L→Levent, M→Murat, P→Polat, S→Serkan, T→Tolga, V→Volkan, Y→Yusuf,
Z→Zeynep. Türkçede ad başı olmayan harfler için yedek havuz (X→Sinan…).

Elle isimlendirilen 17 soruda ad, bağlama göre seçildi: cinsiyet belirten metinlerde
kadın adı (`annesi B` → Berrin, `22 haftalık gebe olan X` → Selin), yabancı uyrukta
o ülkeye uygun ad (`Alman vatandaşı B` → Bernd, `Fransız vatandaşı eşi B` → Bruno).

## Dokunulmayan 2 soru — gerekçe

| Soru | Gerekçe |
|---|---|
| `424028fc` | Açıklaması birebir *"soruda cinsiyet belirtilmemiştir"* diyor. Mağdura kadın ad verilirse **TCK m.82/1-f** ("kadına karşı") devreye girer, müşterek fail C de nitelikli hâlden sorumlu olur → işaretli cevap (A) yanlışa döner. |
| `0bb5b858` | Aynı gerekçe: eş olan mağdurun cinsiyeti bilerek belirsiz bırakılmış. Kadın ad verilmesi işaretli cevabı (C) bozar. |

## Yanlış pozitif olarak elenenler

- **Yabancı Dil dersi** — İngilizce "I'm", "I've" zamiri
- **`(I) … (II) … (V)`** — Türkçe paragraf sorularında cümle numarası
- **`JGY 167-3(B)`** — yönerge belge kodu (rakam/tire önündeki parantezli harf)
- **`hâkim`, `her hâlde`** — düzeltme şapkalı harfler (`â î û`) harf sınıfına
  alınmayınca içlerindeki büyük harf tek harf sanılıyordu
- **`X Partisi`** — kurum adı, kişi değil
- **`doğru (D) / yanlış (Y)`** — D/Y tablo soruları. Bu koruma sonradan eklendi;
  ilk turda `2ce35d05` ve `7dc8f5b4` bozulmuş, yedekten geri alındı.

## Scriptler

| Dosya | İş |
|---|---|
| `scripts/lib/turkce-isim.ts` | Ortak motor: morfoloji, geçiş tespiti, değiştirme, parmak izi |
| `scripts/harf-tespit.ts` | Salt okuma tarama — kapsam ölçümü |
| `scripts/isim-ata.ts` | Toplu otomatik atama (varsayılan kuru çalışma, `--yaz` uygular) |
| `scripts/isim-elle.ts` | Elle harf→ad tablosu; gerekçesi kodda yazılı |
| `scripts/isim-geri-al.ts` | Yedekten geri alma: `npx tsx scripts/isim-geri-al.ts <8hane> --yaz` |

Yedekler bu klasörde: `isim-yedek-171.json`, `isim-yedek-elle.json`,
`isim-yedek-tur2-19.json`, `isim-yedek-elle-tur2.json` (soru sürümü kimliği, eski
kök/açıklama, eski şık metinleri).
