# Tarama Talimatı — Doc 39, Kaymakamlık 2022 çıkmış sorular

Elinde 2022 Kaymakamlık sınavının taranmış sayfaları var: **her sayfada tek
soru**, üstte "Soru No: N", altta "Cevap Anahtarı: X". Senin işin soruları
**çözmek ya da yazıya dökmek değil** — yalnız SINIFLANDIRMAK.

Bu sınav bizim ders programımızdan çok daha geniş (maliye, ekonomi, uluslararası
ilişkiler, medeni hukuk, borçlar, ticaret…). Biz yalnız şu yedi başlığı
alıyoruz:

| Etiket | Kapsam |
|---|---|
| `anayasa` | Anayasa Hukuku, temel haklar, devletin organları, seçim/siyasi partiler mevzuatı |
| `tck` | Türk Ceza Kanunu, suçlar, ceza genel hükümleri |
| `cmk` | Ceza Muhakemesi Kanunu, soruşturma, koruma tedbirleri |
| `inkilap` | Atatürk İlkeleri ve İnkılap Tarihi |
| `genel-kultur` | Türkiye coğrafyası, güncel/genel kültür, tarih (İnkılap dışı) |
| `idare` | İdare Hukuku, idari yargı, kamu personeli, mahalli idareler |
| `polis-mevzuati` | PVSK, emniyet teşkilatı, kolluk yetkileri, güvenlik mevzuatı |
| `disarida` | Yukarıdakilerin hiçbiri (maliye, ekonomi, UA ilişkiler, medeni/borçlar/ticaret hukuku, Türkçe, matematik…) |

## MUTLAK KURALLAR

1. **Soruyu çözme, metnini kopyalama.** Yalnız sınıflandır ve tek cümlelik konu
   notu yaz. Uzun alıntı yapma.
2. **Emin değilsen `disarida` deme** — `belirsiz` yaz ve nedenini not et.
   Yanlışlıkla elenen soru geri gelmez; şüpheliyi insana bırak.
3. Veritabanına dokunma.

## Çıktı

```json
[{"no":1,"ders":"anayasa","konu":"Cumhurbaşkanı adaylarına yardım ve bağışlar (6271 s.K.)",
  "cevap":"A","mevzuataBagli":true,"not":null}]
```

- `cevap`: sayfadaki "Cevap Anahtarı" harfi (aynen).
- `mevzuataBagli`: soru bir kanun/yönetmelik hükmüne mi dayanıyor? Bu sınav
  2022'de yapıldı, biz 2026'dayız — mevzuata bağlı sorular ayrıca güncellik
  denetiminden geçecek, o yüzden işaretlenmesi gerekiyor. Tarih/coğrafya/genel
  kültür sorularında `false`.
- `not`: yalnız gerekiyorsa (belirsizlik, görsel/tablo bağımlılığı, iptal
  ibaresi vb.).

## Son cevabın

SADECE: dosya yolu · taranan soru sayısı · ders dağılımı (etiket=adet).
Soru metinlerini TEKRARLAMA.
