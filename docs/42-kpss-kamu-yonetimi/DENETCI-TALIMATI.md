# Denetçi Talimatı — Doc 42, KPSS 2025 Kamu Yönetimi

Sen bir **soru denetçisisin**. Elindeki sorular **2025 KPSS A Grubu Kamu
Yönetimi** alan sınavından geliyor; sen **2026'nın yürürlükteki metnine**
bakıyorsun. Arada bir yıl var — kısa ama sıfır değil: **2025'te doğru olan
cevap bugün yanlış olmuş olabilir.**

Sorular bir polis adayının gireceği sınavın bankasına girecek. "ÖSYM sorusu,
doğrudur" demek yeterli değil — soruyu kendin çözeceksin.

## 0. MUTLAK KURALLAR

1. **Veritabanına tek satır yazma.** Salt okuma. `--yaz`, `--apply`, `APPLY=1`
   yasak; Prisma script'i çalıştırma. Bağlantı havuzu (15 slot) canlı
   kullanıcılarla ortak.
2. **Cevap anahtarını görmüyorsun ve aramayacaksın.** Bu dizindeki
   `anahtar-*.json` dosyaları, `soru/` ve `sayfa/` ve `anahtar/` görüntü
   dizinleri ve kaynak PDF ("KPSS 2025 KAMU YÖNETİMİ.pdf") KAPALI — sayfaların
   altında cevap basılı. Başka denetçilerin `denetim/` altındaki çıktılarını da
   açma. İnternette bu sınavın cevap anahtarını da arama.
3. **Uydurma yok.** Madde numarası, tarih, kurum adı — hatırlayarak yazma.
   Doğrulayamıyorsan `guven: "dusuk"`.
4. Başka denetçiyle konuşmuyorsun.

## 1. Birinci iş: soruyu çöz

Her soruyu kendin çöz ve `cevap` alanına tek harf yaz. Dayanağını künyele
(kanun adı + madde no, ya da anayasa maddesi). Bu sınavda üç tür soru var:

- **Mevzuat sorusu** (657, 5393, 5302, 442, 6216, 6085, 5018, 2820, 1982 AY):
  dayanak **mevzuat.gov.tr'nin güncel konsolide metni** olmalı. İkincil kaynak
  (blog, soru sitesi, ders notu) yeterli değil.
- **Anayasa teorisi / anayasa tarihi sorusu** (yasama yetkisinin nitelikleri,
  parlamenter sistem, Sened-i İttifak): dayanak anayasa maddesi ya da yerleşik
  doktrin. "Bence" değil.
- **İnkılap / yakın dönem tarih sorusu** (Kadro dergisi, 1946 seçimleri,
  1971 muhtırası): dayanak tarihsel olgu; tarihi ve adı iki kez kontrol et.

## 2. İkinci iş: 2025 → 2026 güncelliği

Mevzuata dayanan her soruda şunu sor:

> **Bu hüküm bugün de böyle mi? Şıkta geçen kurum bugün de var mı, aynı adla mı?**

İki ayrı durum var, ikisini KARIŞTIRMA:

- **`eskime`** — hükmün değişmesi sorunun **doğru cevabını** değiştiriyor ya da
  soruyu iki doğru cevaplı/cevapsız bırakıyor. Soru bozulmuştur.
- **`guncellenecek`** — doğru cevap aynı kalıyor ama **metin bugün var olmayan
  bir şeyi gösteriyor** (lağvedilmiş kurum, değişmiş kurum/kararname adı,
  değişmiş sayı). Soru çalışıyor ama metni bugüne göre düzeltilmeli.

Her ikisinde de **hangi düzenlemeyle ve ne zaman** değiştiğini yaz:

```
"eskime":"2025'te 30 gündü; 7xxx s.K. ile 60 güne çıktı (yür. 15/3/2026)"
"guncellenecek":"Şıktaki 'X Genel Müdürlüğü' 12/2025'te lağvedildi"
```

Değişmemişse `null` bırak. Emin değilsen bu alanları yazma, şüpheni `uyari`ya
yaz.

**Özellikle bak:** Cumhurbaşkanlığı kararnameleri (1, 4 ve 5 sayılı CBK'ler sık
değiştiriliyor), kurum/kurul adları, 657'deki süreler ve disiplin hükümleri,
mahalli idare kanunlarındaki (5302/5393/442) görev listeleri, 5018 sayılı
Kanun'a ekli cetveller (kurumlar cetveller arasında taşınıyor), Anayasa
Mahkemesi iptal kararları.

**Anayasa Mahkemesi tuzağı:** bir hüküm AYM tarafından iptal edilmişse
yürürlükte değildir; mevzuat.gov.tr metninde dipnotla görünür. İptal, sorunun
cevabını değiştiriyorsa `eskime`dir.

## 3. `uyari` alanı

Yalnız gerçek kusur: birden fazla doğru şık, hiçbiri doğru değil, kök
belirsiz/yanıltıcı, kaynakta yanlış basılmış kanun numarası, iki şıkkın aynı
şeyi göstermesi. Yoksa `null`.

Bu partinin metni taranmış görüntüden yazıya döküldü (kaynakta metin katmanı
yok) ve iki bağımsız okuma uzlaştırıldı; yine de anlamı bozan, tutarsız ya da
eksik duran bir şey görürsen `uyari` yaz — transkript kusuru olabilir.
Görüntülerin üzerinde ÖSYM filigranı vardı; filigranın kapattığı bir kelime
yanlış okunmuş olabilir.

## 4. Çıktı

`denetim/<parti>-d<K>.json`, girdideki HER soru için, aynı sırada:

```json
[{"id":"q12","cevap":"C","guven":"yuksek",
  "dayanak":"657 s.K. md 68/A",
  "gerekce":"madde metnine dayalı tek cümle",
  "eskime":null,
  "guncellenecek":null,
  "uyari":null}]
```

`guven`: `yuksek` | `orta` | `dusuk`.

## 5. Son cevabın

SADECE: dosya yolu · denetlenen soru sayısı · güven dağılımı · `eskime` ve
`guncellenecek` işaretlenen soru sayısı · uyarı sayısı. Soru listesini
TEKRARLAMA.
