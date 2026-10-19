// ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: packages/tokens/design-tokens.json (v4.0.0, Nöbet defteri). Yenile: node packages/tokens/build.mjs

import 'dart:ui';

const String tokenVersion = '4.0.0';
const String identityName = 'Nöbet defteri';

class NobetDark {
  NobetDark._();
  static const Color bg = Color(0xFF121A26);
  static const Color surface = Color(0xFF1E2B3C);
  static const Color surfaceAlt = Color(0xFF28374A);
  static const Color ink = Color(0xFFF5F0E5);
  static const Color inkSoft = Color(0xFFBAC4D0);
  static const Color inkSubtle = Color(0xFF94A0B0);
  static const Color line = Color(0xFF394657);
  static const Color accent = Color(0xFFE8B46C);
  static const Color accentSoft = Color(0xFF2E3447);
  static const Color accentInk = Color(0xFFE8B46C);
  static const Color onAccent = Color(0xFF1B293B);
  static const Color panel = Color(0xFF1E2B3C);
  static const Color panelInk = Color(0xFFF5F0E5);
  static const Color panelSoft = Color(0xFFBAC4D0);
  static const Color success = Color(0xFF8FB39A);
  static const Color successSoft = Color(0xFF213229);
  static const Color successInk = Color(0xFFA6CDB1);
  static const Color warning = Color(0xFFE0B15A);
  static const Color warningSoft = Color(0xFF3A3220);
  static const Color warningInk = Color(0xFFF0CB7E);
  static const Color danger = Color(0xFFE07A6B);
  static const Color dangerSoft = Color(0xFF3F2630);
  static const Color dangerInk = Color(0xFFF3A396);
  static const Color focusRing = Color(0xFFE8B46C);
}

class NobetLight {
  NobetLight._();
  static const Color bg = Color(0xFFFFFCF6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceAlt = Color(0xFFEAE5DA);
  static const Color ink = Color(0xFF1B293B);
  static const Color inkSoft = Color(0xFF596371);
  static const Color inkSubtle = Color(0xFF6B7482);
  static const Color line = Color(0xFFD9D7CF);
  static const Color accent = Color(0xFFE8B46C);
  static const Color accentSoft = Color(0xFFF6E9D2);
  static const Color accentInk = Color(0xFF8B5E23);
  static const Color onAccent = Color(0xFF1B293B);
  static const Color panel = Color(0xFF1B293B);
  static const Color panelInk = Color(0xFFF5F0E5);
  static const Color panelSoft = Color(0xFFBAC4D0);
  static const Color success = Color(0xFF5F8A6B);
  static const Color successSoft = Color(0xFFE3EEE6);
  static const Color successInk = Color(0xFF3F6A4C);
  static const Color warning = Color(0xFFA87530);
  static const Color warningSoft = Color(0xFFF7EAD2);
  static const Color warningInk = Color(0xFF7A5416);
  static const Color danger = Color(0xFFB8453A);
  static const Color dangerSoft = Color(0xFFF8DDD9);
  static const Color dangerInk = Color(0xFF8E2E25);
  static const Color focusRing = Color(0xFF8B5E23);
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
  static const double panel = 4;
  static const double control = 10;
  static const double card = 10;
  static const double sheet = 20;
  static const double pill = 999;
}

class NobetSize {
  NobetSize._();
  static const double touchTarget = 44;
  static const double icon = 24;
  static const double iconStroke = 1.75;
}
