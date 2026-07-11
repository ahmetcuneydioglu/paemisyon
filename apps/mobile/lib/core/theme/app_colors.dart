import 'package:flutter/material.dart';

/// Renk token'ları (Doc 3 §5.6 — tek kaynaklı tasarım sistemi).
/// Nihai marka paleti gerçek UI tasarım fazında kesinleşir; bunlar sağlam bir başlangıç.
class AppColors {
  const AppColors._();

  /// Ana marka rengi — güven veren lacivert (polis teması).
  static const Color seed = Color(0xFF1B3A6B);

  static const Color success = Color(0xFF2E7D5B);
  static const Color warning = Color(0xFFB98900);
  static const Color danger = Color(0xFFC0392B);
}
