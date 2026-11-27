# 59 — Düello ve çok oyunculu salon · 27 Kas 2026

Kullanıcı kararı (27 Kas 2026): plan önerilen varsayılanlarla onaylandı. Rakip uygulamanın
ekranları yalnız işlev referansıdır; tasarım Paemisyon'un kendi dili ve bileşen kitiyle yapılır.

## 1. Kararlar

1. **Otorite sunucuda.** İstemci hiçbir tabloya erişmez; her şey `/api/v1/me/duel/*` üzerinden.
   Yeni tablolarda RLS açık, politika yok. Puan, doğruluk, süre ve sıralama API'de hesaplanır.
2. **Zamanlayıcı yok.** Maçın her fazı `phaseEndsAt` damgası taşır; `advance` (saf fonksiyon)
   maçı "şu an"a taşır. Süre dolumu herhangi bir okuma/cevap isteğinde tembel işlenir; hiç istek
   gelmezse süpürücü (15 sn'de bir, yalnız Railway) kapatır.
3. **Realtime yalnız taşıyıcı.** Supabase Realtime Broadcast, özel kanal: `duel:<maç>` (yalnız
   katılımcı) ve `duel-user:<kullanıcı>` (yalnız kendisi). Yayın API'den servis anahtarıyla çıkar,
   istemci yalnız dinler. Yayın düşerse istemci `GET matches/:id` yoklamasıyla aynı durumu alır.
4. **Kurum = modül** (`users.preferred_module_id`). Yalnız aynı modülün adayları eşleşir.
5. **Navigasyon:** altıncı sekme yok; giriş Çalış'ta + Bugün'de kart, ekranlar `/duello` yığınında.
6. **XP ayrı, lig puanı ayrı.** XP `xp_events` defterine yazılır (rütbe XP'sine Aşama 4'te eklenir);
   lig puanı `duel_stats.rating` (1'e 1, Elo) ve `room_rating` (salon), 1000'den başlar.
7. **Premium:** ücretsiz günde 5 maç (`duel.free_daily_limit`, 0 = sınırsız), premium sınırsız.
8. **Bayrak:** `duel.enabled` varsayılan KAPALI; kapalıyken yalnız admin ve beta rolleri görür.
9. **Kapsam:** yalnız mobil (`apps/app`); web sonra.
10. **Soru:** yalnız bankadaki yayında, iptal edilmemiş, premium olmayan, tam beş şıklı ve tek doğru
    cevaplı sorular; kök + şıklar 650 karakteri aşmaz (20 saniyede okunabilirlik). Yeni soru üretilmez.

## 2. Kurallar (tek yer: `duel.config.ts`)

1'e 1: 10 soru × 20 sn. Doğru 100 + kalan süre oranında en çok 50 hız bonusu; yanlış/boş 0.
Eşitlik: puan → doğru sayısı → doğru cevapların toplam süresi; üçü de eşitse berabere.
Geri sayım 3 sn, soru arası gösterim 3,5 sn, geç cevap toleransı 0,4 sn.
XP: galibiyet 60, beraberlik 25, mağlubiyet 10; salon 100 / 70 / 50, diğerleri 15.
Açık sorunun puanı kapanışta işlenir: rakibin puanı artınca "doğru bildi" diye sızmaz.
Ayrılan oyuncu sıralamada kalanların arkasına düşer; 1'e 1'de maç hemen biter.

## 3. Veri modeli (migration `20261127000000_duello`, eklemeli)

`duel_matches` (1'e 1 ve salon tek tabloda) · `duel_participants` · `duel_match_questions`
(sabit soru seti) · `duel_answers` · `duel_queue` · `duel_invitations` · `duel_stats` ·
`xp_events` · `friendships` · `user_blocks`.

Veritabanının kendisinin kapattığı yarışlar:

| Yarış | Kapı |
|---|---|
| Aynı soruya iki cevap | `duel_answers` birincil anahtarı (maç, soru, kullanıcı) + maç satırı kilidi |
| Aynı kullanıcı iki maçta / iki cihaz | kısmi tekil indeks `duel_participants(user_id) WHERE active` |
| Dolu salona çift katılım | kapasite sayımı maç satırı kilidi (`FOR UPDATE`) altında |
| Aynı rakibin iki maça verilmesi | modül başına `pg_advisory_xact_lock` + yukarıdaki indeks |
| Çift ödül | maç kilidi altında `rewarded_at` + `xp_events (user, source, source_id)` tekil |
| Aynı kişiye tekrar davet | kısmi tekil indeks `(from, to) WHERE status = 'pending'` |
| Çift "kabul" | davet satırı kilidi |

## 4. Uçlar (`/api/v1/me/duel`)

`GET /` merkez · `GET /active` yeniden bağlanma · `POST|GET|DELETE /queue` hızlı eşleşme ·
`POST /code`, `POST /join` kodla özel düello · `GET|POST /invitations`,
`POST /invitations/:id/respond`, `DELETE /invitations/:id` · `GET /matches/:id`,
`POST /matches/:id/answers`, `POST /matches/:id/leave`.

Anlık görüntü (`DuelSnapshot`) herkese aynıdır: faz, sunucu saati, faz bitişi, oyuncular (puan,
"cevapladı" bayrağı), açık soru (anahtarsız). `reveal` yalnız soru kapanınca dolar.

## 5. Aşamalar

1. **Altyapı — BİTTİ (27 Kas 2026).** Şema, motor, soru seçimi, eşleşme, kod, davet, süpürücü.
   30 birim testi + `scripts/duel-e2e.ts` (gerçek Postgres, 94 kontrol; istemdeki 16 senaryonun
   sunucu tarafı). Migration CANLIYA UYGULANMADI.
2. **1'e 1 ve salon ekranları — SÜRÜYOR (27 Kas 2026).**
   - Tasarım BİTTİ: Figma PaemisyonNew, sayfa "Düello" (`283:1735`), 35 çerçeve: 1'e 1 akışı,
     salon akışı (20–25), durumlar (04b son 5 sn, 10 bağlantı koptu, 11 rakip ayrıldı, 12 maça dön),
     30 yanlış inceleme, 40 sıralama, 41 istatistik, 50 küçük ekran + büyük yazı, açık tema kopyaları.
   - Sunucu BİTTİ: salon (kur, hızlı, katıl, hazır, başlat, çıkar, ayar, davet), oyuncu arama ve
     çevrimiçi listesi, engelleme, sıralama (mod × dönem × kapsam), maç sonu inceleme.
     `duel-e2e.ts` 149 kontrol.
   - Mobil BİTTİ: veri katmanı (`src/features/duel`), canlı maç kancası (`use-duel-match.ts`:
     yoklama esas, Realtime hızlandırıcı), saat yardımcıları + testi, kit
     (`components/domain/duel.tsx`, `duel-sheets.tsx`), galeri bölümü ve ekranlar:
     `(tabs)/kutuphane/duello/{index,siralama,istatistik}` (alt gezinme görünür),
     `duello/{ara,mac/[id],salon-kur,inceleme/[id]}` (tam ekran). Giriş: Çalış'ta "Düello"
     kısayolu, yalnız `useDuelEnabled()` (bayrak + rol, sunucu) açıksa. Bugün kartı YOK.
   - Doğrulama (27 Kas 2026, yerel): sahte Supabase Auth + yerel API + yerel sınama veritabanı.
     HTTP düzeyi gerçek zamanlı sınama 25/25 (süpürücü dahil). iPhone 17 Pro simülatöründe
     (açık tema) bot rakiple tam 1'e 1 maç, yanlış inceleme ve iki botla hızlı salon oynandı.
     Bu turda Realtime YOKTU (sahte auth): yalnız yoklama yolu sınandı.
3. **Salon:** sunucu ve tasarım Aşama 2'de bitti; ekranlar 1'e 1 ile birlikte yazılacak.
4. **Ödül ve sosyal:** sıralama ekranı, XP'nin rütbeye eklenmesi, rozetler (`BadgeKind` genişler),
   profil istatistikleri, arkadaşlar, engelleme uçları, push (`NotificationCategory` yeni değer,
   yalnız `NotificationsService.enqueue`).
5. **Sağlamlaştırma:** yük sınaması, iki cihazlı tur, AX3 ve küçük ekran, koyu mod.

## 6. Canlıya geçiş (yapılmadı; sıra geldiğinde)

1. Backend durdurulur (pooler limiti), `prisma migrate deploy` (tek migration).
2. Supabase'de migration sonundaki `realtime.messages` politikası ve `duel_can_listen`
   fonksiyonunun oluştuğu doğrulanır (yerelde `realtime` şeması olmadığı için bu blok atlanır).
3. Bayrak kapalı kalır; admin/beta hesabıyla iki cihazda tur. Mobil sürüm yayılınca açılır.

## 7. Açık noktalar

- Çevrimiçi sinyali `users.last_active_at` üzerinden (merkez/arama çağrısı, en çok 30 sn'de bir
  yazılır; pencere 90 sn). Ayrı varlık (presence) tablosu yok.
- "Düelloda bulunabilir olayım" tercihi (kullanıcı kolonu ister) ve arkadaş listesi uçları Aşama 4.
- Figma'da rakamlar dosyanın "Metric" stili (Roboto Mono) ile çizili; uygulamada mono font yok,
  rakamlar `stat` rolüyle (Lora, tabular) çizilir. Şık satırı kodda mevcut `QuestionOption`'dır.
  27 Kas'ta Düello sayfası koda hizalandı (rakamlar Lora SemiBold, harf dairesi 28 pt).
- İkinci simülatör turu (27 Kas 2026, koyu tema): salon kur, bekleme odası (başkan, hazır, basılı tutup
  çıkarma onayı, başlat), kod bekleme ekranı, maça geri dön, maçtan ayrıl (mağlubiyet işlendi), istatistik;
  AX3 büyük yazıda merkez, arama, geri sayım, soru; iPhone SE'de (375 pt) merkez, geri sayım, soru.
  Düzeltilenler: kit `Sheet` klavyeden kaçınmıyordu (KeyboardAvoidingView), tek harfli aramada sonsuz
  iskelet, segment sekmesi büyük yazıda sola kırılıyordu (kit `ChoiceTabs` 1,3× + ortalı), geri sayım
  kartları eşit değildi ve ad kırpılıyordu, skor şeridi etiketi ve durum satırı AX3'te kırpılıyordu.
- Hâlâ görülmeyenler: Android; klavye açıkken alt sayfa (düzeltme yazıldı, ekranda DOĞRULANMADI);
  arkadaş çağır listesinin dolu hali; sıralama koyu tema; bağlantı koptu uyarısı; açıklama ve madde bağı
  gerçek içerikle. Mevcut `QuestionOption` harfi AX3'te 28 pt daireden taşıyor (düello öncesi kusur).

- Özel kanal yetkisi (`duel_can_listen`) gerçek Supabase'de henüz sınanmadı.
- Mevcut tabloların RLS durumu bu işin kapsamında incelenmedi (migration'larda hiç RLS yok).
- Zorluk dengesi yok: seçim rastgele, karışıkta konu başına tavanla. Gerekirse sonra.
