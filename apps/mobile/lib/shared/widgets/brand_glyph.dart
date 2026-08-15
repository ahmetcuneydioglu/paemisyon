import 'package:flutter/material.dart';

/// Nişangâh P marka glifi (app icon ile birebir vektör — brand/app-icon-master.svg).
/// Navy gradyan karo + beyaz P + amber merkez. Auth/marka ekranlarında kullanılır.
class BrandGlyph extends StatelessWidget {
  const BrandGlyph({super.key, this.size = 64});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.22),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF27548F), Color(0xFF1B3A6B), Color(0xFF122A52)],
          stops: [0, .55, 1],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF122A52).withValues(alpha: .35),
            blurRadius: size * 0.25,
            offset: Offset(0, size * 0.09),
          ),
        ],
      ),
      child: CustomPaint(painter: _GlyphPainter()),
    );
  }
}

class _GlyphPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final u = size.width / 96; // 96'lık marka ızgarası
    final white = Paint()..color = Colors.white;
    // Gövde
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(28.6 * u, 21.5 * u, 11.2 * u, 53 * u),
        Radius.circular(5.6 * u),
      ),
      white,
    );
    // Halka
    canvas.drawCircle(
      Offset(56.4 * u, 40.2 * u),
      15.2 * u,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 11.2 * u
        ..color = Colors.white,
    );
    // Amber merkez
    canvas.drawCircle(
        Offset(56.4 * u, 40.2 * u), 5.7 * u, Paint()..color = const Color(0xFFF3A93C));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
