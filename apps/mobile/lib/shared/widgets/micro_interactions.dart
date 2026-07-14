import 'package:flutter/material.dart';

/// Mikro etkileşimler (Doc 18/19 görsel dili) — Denemeler ve Koç ekranı ortak.
/// Hepsi implicit animation: ek paket yok, düşük maliyet.

/// Kademeli giriş: sırasına göre gecikmeli fade + hafif yukarı kayma.
class StaggeredReveal extends StatefulWidget {
  final int index;
  final Widget child;
  const StaggeredReveal({super.key, required this.index, required this.child});

  @override
  State<StaggeredReveal> createState() => _StaggeredRevealState();
}

class _StaggeredRevealState extends State<StaggeredReveal> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 40 * widget.index.clamp(0, 10)), () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedSlide(
        offset: _visible ? Offset.zero : const Offset(0, 0.04),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        child: AnimatedOpacity(
          opacity: _visible ? 1 : 0,
          duration: const Duration(milliseconds: 280),
          child: widget.child,
        ),
      );
}

/// Basınca hafifçe küçülen sarmalayıcı (premium dokunuş hissi).
class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  const PressableScale({super.key, required this.child, this.onTap});

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTapDown:
            widget.onTap == null ? null : (_) => setState(() => _down = true),
        onTapUp: (_) => setState(() => _down = false),
        onTapCancel: () => setState(() => _down = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _down ? 0.98 : 1,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: widget.child,
        ),
      );
}

/// Nefes alan nokta (canlı durum göstergesi).
class PulseDot extends StatefulWidget {
  final Color color;
  final double size;
  const PulseDot({super.key, required this.color, this.size = 7});

  @override
  State<PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: Tween(begin: 0.35, end: 1.0)
            .animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration:
              BoxDecoration(color: widget.color, shape: BoxShape.circle),
        ),
      );
}

/// Açılışta yumuşakça dolan yatay ilerleme çubuğu.
class AnimatedFillBar extends StatelessWidget {
  final double value; // 0..1
  final Color color;
  final double height;
  const AnimatedFillBar(
      {super.key, required this.value, required this.color, this.height = 5});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.clamp(0.0, 1.0)),
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeOutCubic,
        builder: (context, v, _) => ClipRRect(
          borderRadius: BorderRadius.circular(height / 2 + 1),
          child: LinearProgressIndicator(
            value: v,
            minHeight: height,
            color: color,
            backgroundColor: color.withValues(alpha: 0.15),
          ),
        ),
      );
}

/// Açılışta dolan hedef halkası — ortasına içerik alır (Koç hero'su).
class AnimatedGoalRing extends StatelessWidget {
  final double value; // 0..1
  final Color color;
  final double size;
  final Widget center;
  const AnimatedGoalRing({
    super.key,
    required this.value,
    required this.color,
    required this.center,
    this.size = 68,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: value.clamp(0.0, 1.0)),
          duration: const Duration(milliseconds: 900),
          curve: Curves.easeOutCubic,
          builder: (context, v, _) => Stack(
            fit: StackFit.expand,
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: v,
                strokeWidth: 6,
                strokeCap: StrokeCap.round,
                color: color,
                backgroundColor: color.withValues(alpha: 0.15),
              ),
              Center(child: center),
            ],
          ),
        ),
      );
}
