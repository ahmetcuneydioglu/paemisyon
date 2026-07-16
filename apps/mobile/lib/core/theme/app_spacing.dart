/// Boşluk ve köşe yarıçapı ölçeği (Doc 26 §3.3 — 4pt ızgara).
/// Tek kaynak: packages/tokens/design-tokens.json ile birebir.
class AppSpacing {
  const AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 48;

  static const double radiusSm = 8; // giriş alanı, çip
  static const double radiusMd = 12; // kart
  static const double radiusLg = 20; // hero kart, sheet
  static const double radiusFull = 999; // pil / rozet

  /// Minimum dokunma hedefi (Doc 26 §5 — HIG).
  static const double minTouchTarget = 44;
}
