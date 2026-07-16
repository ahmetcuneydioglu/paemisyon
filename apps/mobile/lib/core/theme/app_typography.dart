import 'package:flutter/material.dart';

/// Tipografi ölçeği (Doc 26 §3.2). Aile verilmez — platform varsayılanı
/// (iOS: SF Pro, Android: Roboto/Inter) kullanılır; boyut/ağırlık sabittir.
/// Sayı gösteren her stil `tabular` varyantıyla kullanılır.
class AppTypography {
  const AppTypography._();

  static const List<FontFeature> _tabular = [FontFeature.tabularFigures()];

  /// Seans sonucu skoru, net — 32/800.
  static const TextStyle display = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
    height: 1.15,
    fontFeatures: _tabular,
  );

  /// Ekran başlığı — 22/700.
  static const TextStyle title = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
    height: 1.2,
  );

  /// Kart başlığı, soru kökü — 17/600.
  static const TextStyle heading = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.35,
  );

  /// Gövde, şık metni — 15/400.
  static const TextStyle body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.45,
  );

  /// Buton, sekme, rozet — 13/600.
  static const TextStyle label = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 1.2,
    fontFeatures: _tabular,
  );

  /// Kaynak etiketi, alt bilgi — 11/500, UPPERCASE + %6 tracking (Doc 26).
  /// Metni büyük harfe çevirmek kullanan bileşenin işidir.
  static const TextStyle caption = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.66,
    height: 1.2,
    fontFeatures: _tabular,
  );
}
