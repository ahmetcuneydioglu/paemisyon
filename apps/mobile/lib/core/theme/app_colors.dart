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

  // ── Vurgu ramp'leri (Denemeler yeniden tasarımı — onaylı wireframe paleti) ──
  // Kural: açık temada 50 zemin + 600 metin; koyu temada 800 zemin + 100/200 metin.
  static const Color blue50 = Color(0xFFE6F1FB);
  static const Color blue200 = Color(0xFF85B7EB);
  static const Color blue400 = Color(0xFF378ADD); // dolgu: CTA, ilerleme çubuğu
  static const Color blue600 = Color(0xFF185FA5);
  static const Color blue800 = Color(0xFF0C447C);

  static const Color teal50 = Color(0xFFE1F5EE);
  static const Color teal200 = Color(0xFF5DCAA5);
  static const Color teal400 = Color(0xFF1D9E75); // canlı nokta
  static const Color teal600 = Color(0xFF0F6E56);
  static const Color teal800 = Color(0xFF085041);

  static const Color amber50 = Color(0xFFFAEEDA);
  static const Color amber100 = Color(0xFFFAC775);
  static const Color amber600 = Color(0xFF854F0B);
  static const Color amber800 = Color(0xFF633806);

  static const Color purple50 = Color(0xFFEEEDFE);
  static const Color purple100 = Color(0xFFCECBF6);
  static const Color purple600 = Color(0xFF534AB7);
  static const Color purple800 = Color(0xFF3C3489);
}
