/// Bildirim izni daveti ne zaman gösterilir — saf mantık (ekrandan ayrı, test edilir).
///
/// Eski davranış "cihazda BİR KEZ sor, bir daha asla" idi. Pratikte şu oldu:
/// uygulamayı kurup o an "Şimdi değil" diyen herkes KALICI olarak ulaşılamaz
/// hâle geldi — 152 kullanıcının yalnız 17'sine bildirim gidebiliyordu ve
/// 5 Eylül 2026 denemesine bu yüzden 6 kişi katıldı.
///
/// Yeni davranış: reddedene ısrar yok ama kalıcı sessizlik de yok — 30 gün
/// sonra bir kez daha sorulur. Web tarafındaki ön-soru da aynı süreyi kullanır
/// (apps/web/src/components/push-opt-in.tsx).
library;

const int bildirimDavetiErtelemeGun = 30;

/// [sonSorulanMs] daha önce sorulduysa o anın epoch milisaniyesi, hiç
/// sorulmadıysa null. [zatenAcik] kullanıcı bildirimleri açmışsa true.
bool bildirimDavetiGosterilsinMi({
  required int? sonSorulanMs,
  required bool zatenAcik,
  required int simdiMs,
}) {
  if (zatenAcik) return false;
  if (sonSorulanMs == null) return true;
  // İleri tarihli kayıt (cihaz saati geri alınmış) sonsuz sessizlik üretmesin.
  if (sonSorulanMs > simdiMs) return true;
  return simdiMs - sonSorulanMs >= bildirimDavetiErtelemeGun * 24 * 60 * 60 * 1000;
}
