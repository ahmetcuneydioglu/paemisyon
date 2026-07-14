import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Onaylı wireframe paleti — tema duyarlı vurgu eşlemesi (Doc 18/19 uygulaması).
/// Kural: açık temada 50 zemin + 600 metin; koyu temada 800 zemin + 100/200
/// metin (kontrast her iki temada garanti). Denemeler ve Koç ekranı ortak kullanır.
class AccentPalette {
  final Color accent; // CTA + ilerleme çubukları (her iki temada canlı mavi)
  final Color accentText; // sayaç/vurgu metni
  final Color heroBg;
  final Color heroBorder;
  final Color liveBg, liveFg; // canlı/başarı (teal)
  final Color warnBg, warnFg; // uyarı/seri (amber)
  final Color proBg, proFg; // premium/rozet (mor)

  const AccentPalette._({
    required this.accent,
    required this.accentText,
    required this.heroBg,
    required this.heroBorder,
    required this.liveBg,
    required this.liveFg,
    required this.warnBg,
    required this.warnFg,
    required this.proBg,
    required this.proFg,
  });

  static const _dark = AccentPalette._(
    accent: AppColors.blue400,
    accentText: AppColors.blue200,
    heroBg: AppColors.blue800,
    heroBorder: AppColors.blue600,
    liveBg: AppColors.teal800,
    liveFg: AppColors.teal200,
    warnBg: AppColors.amber800,
    warnFg: AppColors.amber100,
    proBg: AppColors.purple800,
    proFg: AppColors.purple100,
  );

  static const _light = AccentPalette._(
    accent: AppColors.blue400,
    accentText: AppColors.blue600,
    heroBg: AppColors.blue50,
    heroBorder: AppColors.blue200,
    liveBg: AppColors.teal50,
    liveFg: AppColors.teal600,
    warnBg: AppColors.amber50,
    warnFg: AppColors.amber600,
    proBg: AppColors.purple50,
    proFg: AppColors.purple600,
  );

  static AccentPalette of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? _dark : _light;
}
