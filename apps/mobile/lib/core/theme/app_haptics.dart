import 'package:flutter/services.dart';

import 'app_motion.dart';

/// Haptic cila paketi (Doc 26 §3.4, Doc 28 P2-18).
/// Kural: doğru cevapta HAFİF, yanlışta orta, rozet/terfi/hedefte belirgin;
/// sistem "animasyonları azalt" diyorsa hepsi susar (motion'la aynı saygı).
class AppHaptics {
  const AppHaptics._();

  /// Şık seçimi, çip/segment dokunuşu.
  static void select() {
    if (AppMotion.reduceMotion) return;
    HapticFeedback.selectionClick();
  }

  /// Doğru cevap — kutlama değil, onay.
  static void correct() {
    if (AppMotion.reduceMotion) return;
    HapticFeedback.lightImpact();
  }

  /// Yanlış cevap — ceza değil, fark ettirme.
  static void wrong() {
    if (AppMotion.reduceMotion) return;
    HapticFeedback.mediumImpact();
  }

  /// Gerçek dönüm noktaları: rozet, terfi, hedef/seans tamamlama.
  static void celebrate() {
    if (AppMotion.reduceMotion) return;
    HapticFeedback.heavyImpact();
  }
}
