import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Semantic renk token'ları (Doc 26 §3.1) — ThemeExtension olarak taşınır,
/// tüm bileşenler renge `context.tokens.<ad>` ile erişir; ham hex KULLANILMAZ.
/// Koyu tema naif ters çevirme değildir: ramp kuralı (açıkta 50 zemin/600 metin,
/// koyuda 800 zemin/100-200 metin) `app_colors.dart` ile aynıdır.
@immutable
class AppTokens extends ThemeExtension<AppTokens> {
  const AppTokens({
    required this.brand,
    required this.surface,
    required this.surfaceAlt,
    required this.ink,
    required this.inkSoft,
    required this.line,
    required this.success,
    required this.warning,
    required this.danger,
    required this.accentSession,
    required this.accentLive,
    required this.accentStreak,
    required this.accentAtlas,
  });

  final Color brand;
  final Color surface;
  final Color surfaceAlt;
  final Color ink;
  final Color inkSoft;
  final Color line;
  final Color success;
  final Color warning;
  final Color danger;

  /// Accent aileleri — bir ekranda en fazla biri baskın olur (Doc 26 §3.1).
  final Color accentSession;
  final Color accentLive;
  final Color accentStreak;
  final Color accentAtlas;

  static const AppTokens light = AppTokens(
    brand: AppColors.seed,
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFF4F6F9),
    ink: Color(0xFF1A1C22),
    inkSoft: Color(0xFF5B6070),
    line: Color(0xFFE4E7EC),
    success: AppColors.success,
    warning: AppColors.warning,
    danger: AppColors.danger,
    accentSession: AppColors.blue400,
    accentLive: AppColors.teal400,
    accentStreak: AppColors.amber600,
    accentAtlas: AppColors.purple600,
  );

  static const AppTokens dark = AppTokens(
    brand: AppColors.blue200,
    surface: Color(0xFF15171C),
    surfaceAlt: Color(0xFF1D2027),
    ink: Color(0xFFECEEF2),
    inkSoft: Color(0xFF9BA1AF),
    line: Color(0xFF2C3038),
    success: AppColors.teal200,
    warning: AppColors.amber100,
    danger: Color(0xFFE08578),
    accentSession: AppColors.blue200,
    accentLive: AppColors.teal200,
    accentStreak: AppColors.amber100,
    accentAtlas: AppColors.purple100,
  );

  @override
  AppTokens copyWith({
    Color? brand,
    Color? surface,
    Color? surfaceAlt,
    Color? ink,
    Color? inkSoft,
    Color? line,
    Color? success,
    Color? warning,
    Color? danger,
    Color? accentSession,
    Color? accentLive,
    Color? accentStreak,
    Color? accentAtlas,
  }) {
    return AppTokens(
      brand: brand ?? this.brand,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      ink: ink ?? this.ink,
      inkSoft: inkSoft ?? this.inkSoft,
      line: line ?? this.line,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      accentSession: accentSession ?? this.accentSession,
      accentLive: accentLive ?? this.accentLive,
      accentStreak: accentStreak ?? this.accentStreak,
      accentAtlas: accentAtlas ?? this.accentAtlas,
    );
  }

  @override
  AppTokens lerp(ThemeExtension<AppTokens>? other, double t) {
    if (other is! AppTokens) return this;
    return AppTokens(
      brand: Color.lerp(brand, other.brand, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      inkSoft: Color.lerp(inkSoft, other.inkSoft, t)!,
      line: Color.lerp(line, other.line, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      accentSession: Color.lerp(accentSession, other.accentSession, t)!,
      accentLive: Color.lerp(accentLive, other.accentLive, t)!,
      accentStreak: Color.lerp(accentStreak, other.accentStreak, t)!,
      accentAtlas: Color.lerp(accentAtlas, other.accentAtlas, t)!,
    );
  }
}

/// Kısayol: `context.tokens.brand`
extension AppTokensContext on BuildContext {
  AppTokens get tokens => Theme.of(this).extension<AppTokens>()!;
}
