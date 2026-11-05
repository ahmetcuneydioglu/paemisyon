# Giriş bölümü — cihazda inceleme

Beş özgün ders, bağımsız bölüm/ders kimlikleriyle uygulamaya inceleme paketi olarak dahil edildi. Normal giriş: Çalış → Anayasa → Konu oku → T.C. Anayasası → Konu anlatımı → Anayasa Hukukuna Giriş.

Bu bölüm eski madde özetlerinden önce listelenir. Veritabanına yazılmaz, API dağıtımı gerektirmez. Ürün içindeki “İnceleme sürümü” bilgisi, içeriğin editoryal değerlendirme aşamasında olduğunu belirtir. Kalıcı bağımsız ders yönetimi ve yayın altyapısı yerine geçmez.

Markdown kaynaklarından başlıklar, hedefler, metinler ve tablolar aktarılır. Üretici: `python3 apps/app/scripts/build-lesson-content.py`. Kaynak dosyalar değişince yeniden çalıştırılır. Editoryal kontrol notları okuyucuya taşınmaz; kaynakça ayrı panelde gösterilir. Kaynak sürümü değişince okuma konumu sürümle ayrılır.

Okuyucu: içindekilerden bölüme gitme, kaynak paneli, ders sonunda “Okudum”, sonraki ders ve bölüm listesine dönüş. Dar ekranda tablo hücreleri başlıklarıyla alt alta gösterilir. Kaydırma ve okundu bilgisi hesap/ders/sürüm bazında cihazda saklanır. Soru eşlemesi bulunmadığından soru çözme düğmesi eklenmez.

Kontroller: beş dosya → beş benzersiz ders, tüm bölümler dolu; Expo TypeScript ve lint. Cihaz Release derlemesi ve yükleme ayrıca doğrulanır. Doğrudan açılan tek ekran yerine normal Çalış akışından erişim korunur.
