# Konu özeti ünitesi düzeltici talimatı (Paemisyon Doc 53)

Ünite bağımsız bir anlam denetçisinden geçti. Sen düzelticisin: her bulguyu madde metnine bakarak karara bağlar,
ünite JSON'unu düzeltir ve betik doğrulamasını yeniden geçirirsin. Önce ölçütü oku: aynı klasördeki `ILKE.md`.

## Kurallar

1. Her bulgu için madde metnini (girdi dosyasındaki `articles`) KENDİN oku. Denetçi haklıysa düzelt; haksızsa reddet
   ve gerekçesini rapora yaz. Belirleyici olan madde metnidir.
2. Düzeltme yalnız referans maddelerde yazana dayanır. Kendi bilginden yetki, süre, şart, makam, kurum devri, tarih
   EKLEME. Kalkmış kurum notu yalnız şu kalıptır: "**Not:** … madde metnindeki hâliyle verilmiştir." Metinde olmayan
   devir/kapatılma bilgisi varsa SİL.
3. ESAS ve ESKİME bulgularının hepsi işlenir (düzelt ya da kartı/cümleyi çıkar). TUTAR: TL tutarı çıkar; yaptırım
   türü + merci kalır. Adli para cezasının GÜN sayısı ve hapis süresi tutar DEĞİLDİR, metindeki hâliyle yazılabilir.
   ZAYIF ve BİÇİM: makul olanları işle; sınav değeri düşük kartı çıkarabilirsin (ünite en az 12 içerik kartı kalsın).
4. Olumsuz iddia ("X yapamaz", "yalnız", "tek", "sayılmaz") metin açıkça söylemiyorsa olumlu ve metne dayalı bir
   cümleye çevir ("Metin cezayı verecek makam olarak … gösterir").
5. Tutarlara dayalı "en düşük / daha yüksek / en yüksek" kademe sıralamalarını çıkar (tutarlar değişince eskir).
6. `exam_stats` ve `bridge` kartlarına, `unit` başlık alanlarına (slug, topicId, legislationSlug, sourceLabel,
   articleNos) DOKUNMA. Kartların sırasını koru. `articleRefs` girdi `articles[].no` ile birebir olmalı.
7. Doğrulayıcı tuzakları: karttaki her rakam referans maddede geçmeli; `counterNumbers` sayı dizisidir ve referans
   maddede GEÇMEMELİ; derivedNumbers'da `count(...)` yok; gövdede çıplak madde numarası yerine "md 5" yaz; metinde
   geçmeyen kanun numarası yazma.

## Adımlar

1. Ünite JSON'unu yerinde düzelt.
2. `cd /Users/ahmetcnd/Developer/paemisyon-worktrees/doc57/apps/api && npx tsx --env-file=.env scripts/ozet-dogrula.ts <unite.json> --md --write`
   Son satır "Sonuç: GEÇTİ" olana kadar düzelt. Başka veritabanı betiği çalıştırma; `.env` içeriğini okuma.
3. Kısa raporu `<scratch>/<slug>.duzeltme.md` dosyasına yaz: işlenen bulgular (kart #, sınıf, yapılan), reddedilenler
   (gerekçe), çıkarılan kartlar, insan incelemesine kalanlar.
4. Git komutu çalıştırma; başka dosyaya dokunma.

Son mesajında yalnız şunu bildir: doğrulayıcının son satırı, işlenen/reddedilen bulgu sayısı, çıkarılan kartlar,
insan incelemesine kalan en önemli 1–3 nokta.
