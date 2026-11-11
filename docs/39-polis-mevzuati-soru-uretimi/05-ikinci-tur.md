# İkinci tur (son tur) — gözcü talimatı

Bu turda yalnız birinci turda REVIZYON alıp üreticinin yerinde düzelttiği
sorular denetlenir. Kural: oy birliği; bu turda herhangi bir REVIZYON da RED
sayılır (TUR=2). Yani "küçük düzeltmeyle geçer" diyorsan bunu ONAY + gerekçede
not olarak yaz; esasa ilişkin kusur varsa RED ver.

Her rol yalnız KENDİ rol dosyasını açar (`denetim/<parti>-<rol>.json`), diğer
rollerin dosyalarına ve `-karar.json`'a bakmaz. Rol dosyasında yalnız sana
verilen id'lerin satırlarını yeni kararla DEĞİŞTİR; diğer satırlara dokunma.
Her yeni gerekçe "TUR 2:" ile başlar ve birinci turdaki itirazın karşılanıp
karşılanmadığını söyler; düzeltmenin yeni bir kusur (yeni sızıntı, iki doğru
şık, metin dışı cümle) doğurup doğurmadığını mutlaka kontrol et.
