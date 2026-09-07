import { CoachRule } from '../coach.types';

/**
 * Çıkmış sınav keşif kartı (Doc 36 §7.2).
 *
 * Sorun: uygulamayı "paem çıkmış sorular" aramasından bulup indiren kişi Bugün
 * ekranına düşüyor ve aradığı şeyin Denemeler sekmesinde olduğunu tahmin etmek
 * zorunda kalıyor. Çıkmış sınavlar ürünün en yüksek güvenli içeriği; ilk
 * oturumda görünmezse hiç görünmeyebilir.
 *
 * Kart KEŞİF kartıdır, günlük iş değil — bu yüzden:
 *   • Kullanıcı bir dönemi çözer çözmez susar (kalıcı vitrin Denemeler'de).
 *   • Yeni dönem yayımlanınca (PAEM 10) kendiliğinden geri gelir.
 *   • Günlük hedefi (75) ezmez; ama hiç görmemiş kişi için yanlış tekrarının
 *     ve günün quizinin önüne geçer — o kişinin uygulamada aradığı şey bu.
 *
 * Nag riski bilinçli kabul edildi: kart hiç çözmeyen kişide her açılışta
 * görünür. Rahatsız ederse çare sunucuda — `priority`'yi düşürmek yeter,
 * mağaza güncellemesi gerekmez.
 *
 * `route` bilerek `/denemeler`: EN DÜŞÜK ORTAK PAYDA. Vitrine gitmeyi kart
 * TİPİ belirler (istemci `cikmis_sinav` tipini görünce kendi vitrinine gider);
 * böylece ekranı bilmeyen eski bir sürüm rotayı çözemeyip hata ekranı
 * göstermez, bildiği deneme listesine düşer.
 */
export const cikmisSinavRule: CoachRule = (ctx) => {
  const c = ctx.cikmisSinavlar;
  if (!c.kartAcik) return null; // panelden kapalı (varsayılan)
  if (!c.cozulmemisEnYeni) return null; // hiç yok ya da hepsi çözülmüş

  const donemAdi = c.cozulmemisEnYeni.donem
    ? `PAEM ${c.cozulmemisEnYeni.donem}`
    : c.cozulmemisEnYeni.ad;
  const govde =
    c.cozulebilirSayisi > 1
      ? `${c.cozulebilirSayisi} dönem, ${c.toplamSoru} gerçek soru — cevaplı ve açıklamalı. Sınav gibi çöz ya da soru soru çalış.`
      : `${donemAdi} — ${c.toplamSoru} gerçek soru, cevaplı ve açıklamalı.`;

  return {
    type: 'cikmis_sinav',
    priority: 72,
    title: 'Çıkmış sınavlar yayında',
    body: govde,
    cta: { label: 'İncele', route: '/denemeler' },
    meta: { slug: c.cozulmemisEnYeni.slug },
  };
};
