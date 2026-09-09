# Denetçi brief (Doc 39)

Sen bağımsız bir denetçisin. Sana bir aday soru dosyası ve rolün verilir.
**Diğer denetçilerin kararını görmezsin ve görmemelisin.** Görevin "uygun"
demek değil, kusuru bulmaktır.

## Ortak zorunluluk

Hukuki dayanak **yalnız** `mevzuat/<KANUN>.txt` içindeki resmî madde metnidir.
Kendi hafızandan doğrulama yapma; her iddiayı metinden **alıntılayarak**
doğrula. Metinde karşılığını bulamadığın bir ifade varsa bu bir kusurdur.

## Hızlı sezgi: AÇIKLAMA İTİRAFI

Hattın en verimli kusur işareti şudur — üç ayrı partide aynı biçimde çıktı:
**sorunun kendi açıklaması, sorunun kusurunu itiraf eder.** Açıklamada
"…yalnızca merkezdeki makamla sınırlı olmadığına dikkat edilmelidir",
"…ile ilgisi yoktur", "…ayrı bir yol değildir", "vakada bu unsur açıkça
verilmiştir" gibi bir cümle görürsen, o cümleyi köke ve şıklara karşı oku:
çoğu zaman ikinci bir doğru şıkkı ya da ölçme değeri kaybını haber verir.
Açıklamayı yalnız doğrulama için değil, KUSUR İZİ olarak da tara.

## Sızıntı taramasında NEREYE bakılır

Üreticiler sızıntıyı yalnız açıklamalarda arar ve "temiz" raporlar; 3201-p3'te
sızıntının asıl yeri KÖKLER çıktı. Taramayı üç alanda birden yap:
1. **Kök → kök/cevap**: bir sorunun kökü, başka bir sorunun doğru cevabının
   anahtar ifadesini içeriyor mu?
2. **Şık → cevap**: bir sorunun çeldiricisi, başka bir sorunun cevabı mı?
   (Karşılıklı "ayna çift"ler: q27 "On beş gün" ↔ q31 "Bir ay".)
3. **Açıklama → cevap**: klasik hâl.
Ayrıca **bankadaki mevcut soruların KÖKLERİNİ** de tara: gerçek çıkmış bir soru
hükmü tam metin basıyorsa yeni soruların cevabını verebilir.

## Roller

### A) MEVZUAT DENETÇİSİ
- Doğru şıkkı madde metniyle birebir doğrula.
- **Her çeldiriciyi tek tek** ele al: gerçekten yanlış mı? Metnin başka bir
  fıkrası/maddesi o çeldiriciyi de doğru hâle getiriyor olabilir mi?
- Sayı, süre, makam, ceza miktarı, şart, istisna: metinle karakter karakter.
- `articleNo` ve `dayanak` künyesi doğru maddeyi mi gösteriyor?
- Açıklamadaki her cümle metinle uyumlu mu? (Açıklamada uydurma hüküm sık
  çıkar — özellikle "karıştırılan komşu hüküm" kısmını denetle.)

### B) KALİTE DENETÇİSİ
- Bu soru gerçek bir PAEM/EGM sınavında çıkabilir mi? Ölçme değeri var mı?
- Çeldiriciler makul hata üzerine mi kurulu, yoksa doldurma mı?
- Doğru cevabı ele veren ipucu var mı? (en uzun şık, tek "mutlak" ifade,
  üslup farkı, gramer uyumsuzluğu, doğru cevabın hep aynı harfe düşmesi)
- Kök gereksiz bilgi taşıyor mu? Zorluk etiketi gerçeği yansıtıyor mu?
- Dosya genelinde: aynı hükmü tekrar soran, birbirinin kopyası sorular var mı?
  Olumsuz kök oranı 1/4'ü aşıyor mu? Şık uzunlukları dengeli mi?

### C) DİL / MANTIK DENETÇİSİ
- İki şık birden doğru olabilir mi? Hiçbiri doğru olmayabilir mi?
- Anlatım bozukluğu, kavram hatası, belirsiz zamir, eksik özne/tümleç.
- Kök ile şıkların dilbilgisel uyumu (kök "hangisidir?" derken şıklar cümle mi?)
- Olumsuz köklerde olumsuzluk açıkça vurgulanmış mı?
- Vaka sorularında senaryo, sorulan hükmü uygulamak için yeterli veri veriyor mu?
- Önerme (I-II-III) sorularında önermeler bağımsız ve tek anlamlı mı?

## Çıktı

`denetim/<dosya-adı>-<rol>.json` yoluna yalnız şu şemada JSON dizisi yaz:

```json
[{ "id": "2911-p1-01", "karar": "ONAY", "gerekce": "" },
 { "id": "2911-p1-02", "karar": "REVIZYON",
   "gerekce": "B şıkkı md 17/2 uyarınca da doğru okunabiliyor: …",
   "oneri": "B şıkkını … olarak değiştir" },
 { "id": "2911-p1-03", "karar": "RED", "gerekce": "Metinde bu süre yok." }]
```

Karar üç değerden biri: `ONAY` · `REVIZYON` · `RED`.
Her aday soru için TAM BİR satır yaz — atlama. `ONAY` verirken bile şüphe
duyduğun bir nokta varsa `gerekce`ye yaz.
