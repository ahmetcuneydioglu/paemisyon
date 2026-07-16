import 'package:flutter/animation.dart';
import 'package:flutter/scheduler.dart';

/// Motion token'ları (Doc 26 §3.4).
/// Kurallar: her etkileşimin `quick` geri bildirimi vardır; `celebrate` yalnız
/// gerçek dönüm noktalarında (seri artışı, rozet/terfi, hedef tamamlama);
/// doğru/yanlış renk değişimi animasyonsuz ANINDA verilir.
class AppMotion {
  const AppMotion._();

  /// Dokunma geri bildirimi, çip seçimi.
  static const Duration quick = Duration(milliseconds: 150);
  static const Curve quickCurve = Curves.easeOut;

  /// Sayfa içi geçiş, kart açılışı, sheet.
  static const Duration standard = Duration(milliseconds: 250);
  static const Curve standardCurve = Curves.easeInOutCubic;

  /// Kutlama anları — spring hissi.
  static const Duration celebrate = Duration(milliseconds: 600);
  static const Curve celebrateCurve = Curves.elasticOut;

  /// Erişilebilirlik: sistem "animasyonları azalt" diyorsa uy (Doc 26 §3.4).
  static bool get reduceMotion =>
      SchedulerBinding.instance.platformDispatcher.accessibilityFeatures.reduceMotion ||
      SchedulerBinding.instance.platformDispatcher.accessibilityFeatures.disableAnimations;

  /// Azaltılmış modda süreyi sıfıra indirir — bileşenler bunu kullanır.
  static Duration respect(Duration d) => reduceMotion ? Duration.zero : d;
}
