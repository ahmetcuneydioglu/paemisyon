// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: packages/tokens/design-tokens.json (v3.0.0, Nöbet). Yenile: node packages/tokens/build.mjs

import 'dart:ui';

const String tokenVersion = '3.0.0';
const String identityName = 'Nöbet';

class NobetDark {
  NobetDark._();
  static const Color bg = Color(0xFF17161A);
  static const Color surface = Color(0xFF221F25);
  static const Color surfaceAlt = Color(0xFF2C2830);
  static const Color ink = Color(0xFFF4EEE6);
  static const Color inkSoft = Color(0xFFA79F96);
  static const Color inkSubtle = Color(0xFF7C746C);
  static const Color line = Color(0xFF34303A);
  static const Color accent = Color(0xFFE3804F);
  static const Color accentSoft = Color(0xFF3A281F);
  static const Color accentInk = Color(0xFFF2A47C);
  static const Color onAccent = Color(0xFF17161A);
  static const Color success = Color(0xFF8FB39A);
  static const Color successSoft = Color(0xFF243029);
  static const Color successInk = Color(0xFFA6CDB1);
  static const Color warning = Color(0xFFE0B15A);
  static const Color warningSoft = Color(0xFF3A2F1C);
  static const Color warningInk = Color(0xFFF0CB7E);
  static const Color danger = Color(0xFFE07A6B);
  static const Color dangerSoft = Color(0xFF3F2422);
  static const Color dangerInk = Color(0xFFF3A396);
  static const Color focusRing = Color(0xFFF2A47C);
}

class NobetLight {
  NobetLight._();
  static const Color bg = Color(0xFFF1EDE9);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceAlt = Color(0xFFE8E2DC);
  static const Color ink = Color(0xFF1F1C21);
  static const Color inkSoft = Color(0xFF6A6269);
  static const Color inkSubtle = Color(0xFF8D858C);
  static const Color line = Color(0xFFDBD4CE);
  static const Color accent = Color(0xFFB5532E);
  static const Color accentSoft = Color(0xFFF8E1D4);
  static const Color accentInk = Color(0xFF9C4827);
  static const Color onAccent = Color(0xFFFFFFFF);
  static const Color success = Color(0xFF5F8A6B);
  static const Color successSoft = Color(0xFFE3EEE6);
  static const Color successInk = Color(0xFF3F6A4C);
  static const Color warning = Color(0xFFA87530);
  static const Color warningSoft = Color(0xFFF7EAD2);
  static const Color warningInk = Color(0xFF7A5416);
  static const Color danger = Color(0xFFB8453A);
  static const Color dangerSoft = Color(0xFFF8DDD9);
  static const Color dangerInk = Color(0xFF8E2E25);
  static const Color focusRing = Color(0xFFB5532E);
}

class NobetSpace {
  NobetSpace._();
  static const double s1 = 4;
  static const double s2 = 8;
  static const double s3 = 12;
  static const double s4 = 16;
  static const double s5 = 20;
  static const double s6 = 24;
  static const double s8 = 32;
  static const double s12 = 48;
  static const double screenGutter = 20;
}

class NobetRadius {
  NobetRadius._();
  static const double control = 10;
  static const double card = 14;
  static const double sheet = 20;
  static const double pill = 999;
}

class NobetSize {
  NobetSize._();
  static const double touchTarget = 44;
  static const double icon = 24;
  static const double iconStroke = 1.75;
}
