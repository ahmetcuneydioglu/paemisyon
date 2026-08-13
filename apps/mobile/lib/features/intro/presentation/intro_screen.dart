import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_haptics.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../intro_prefs.dart';

/// First-launch tanıtımı (onaylı konsept: HEDEF → GÜVEN → PLAN → ÖLÇÜ →
/// YARIŞ+BAŞLA). "Gece Nöbeti" görsel dünyası: app icon/splash ile aynı navy
/// gradyan; hero'lar gerçek bileşen diliyle (cam kart + token renkleri) —
/// asset yok, her ölçekte keskin. Tema'dan bağımsız tek dünya (splash gibi).
class IntroScreen extends ConsumerStatefulWidget {
  const IntroScreen({super.key});

  @override
  ConsumerState<IntroScreen> createState() => _IntroScreenState();
}

// Marka sabitleri — icon/splash ile birebir (tema token'ı değil; bu ekran
// bilinçli olarak tek-dünya, bkz. konsept raporu "Gece Nöbeti").
const _navyTop = Color(0xFF27548F);
const _navyMid = Color(0xFF1B3A6B);
const _navyDeep = Color(0xFF122A52);
const _amber = Color(0xFFF3A93C);
const _teal = Color(0xFF2FC493);
const _blue = Color(0xFF378ADD);
const _softInk = Color(0xFF9FB6D6);

class _IntroPage {
  const _IntroPage({required this.title, required this.body, required this.hero});
  final String title;
  final String body;
  final Widget hero;
}

class _IntroScreenState extends ConsumerState<IntroScreen> {
  final _controller = PageController();
  int _index = 0;

  static final List<_IntroPage> _pages = [
    const _IntroPage(
      title: 'Hedefin belli.\nArtık yolun da.',
      body: 'Paemisyon, Komiser Yardımcılığı yolculuğunu tek merkezden '
          'yöneten kişisel hazırlık koçun.',
      hero: _HeroTarget(),
    ),
    const _IntroPage(
      title: 'Gerçek sınav soruları, kaynağıyla',
      body: 'Yapay zekâ üretimi soru yok. Her soru gerçek sınavlardan — '
          'hangi sınavda çıktığı üstünde yazar.',
      hero: _HeroQuestion(),
    ),
    const _IntroPage(
      title: 'Bugün ne çalışacağını koçun söyler',
      body: 'Zayıf konuların, tekrarı gelen yanlışların ve günün hedefi her '
          'sabah tek kartta hazır. Yanlışların asla unutulmaz.',
      hero: _HeroCoach(),
    ),
    const _IntroPage(
      title: 'Nerede eksiksin, harita gösterir',
      body: 'Kanun kanun, konu konu ısı haritası. Çözdükçe rütbe atlarsın — '
          'son kapı: Komiserlik.',
      hero: _HeroHeat(),
    ),
    const _IntroPage(
      title: 'Canlı denemede yerini gör',
      body: 'Herkes aynı anda yarışır; NET’in ve Türkiye sıralaman '
          'anında ekranda.',
      hero: _HeroPodium(),
    ),
  ];

  bool get _isLast => _index == _pages.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish({required bool register}) async {
    await persistIntroSeen(ref.read(introSeenProvider.notifier));
    if (mounted) context.go(register ? '/auth/register' : '/auth/login');
  }

  void _next() {
    if (_isLast) return;
    AppHaptics.select();
    _controller.nextPage(
      duration: AppMotion.respect(AppMotion.standard) +
          const Duration(milliseconds: 1), // Duration.zero PageView'da geçersiz
      curve: AppMotion.standardCurve,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_navyTop, _navyMid, _navyDeep],
            stops: [0, .55, 1],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) {
                    final p = _pages[i];
                    return Semantics(
                      label: 'Tanıtım, ${_pages.length} ekrandan ${i + 1}.si',
                      child: _Entrance(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.xl),
                          child: Column(
                            children: [
                              Flexible(flex: 5, child: Center(child: p.hero)),
                              const SizedBox(height: AppSpacing.lg),
                              Text(
                                p.title,
                                textAlign: TextAlign.center,
                                style: AppTypography.title.copyWith(
                                    color: Colors.white, height: 1.2),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                p.body,
                                textAlign: TextAlign.center,
                                style: AppTypography.body
                                    .copyWith(color: _softInk, height: 1.45),
                              ),
                              const SizedBox(height: AppSpacing.lg),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              // ── Navigasyon ──
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.lg),
                child: Column(
                  children: [
                    _Dots(count: _pages.length, index: _index),
                    const SizedBox(height: AppSpacing.lg),
                    SizedBox(
                      width: double.infinity,
                      child: _isLast
                          ? FilledButton(
                              onPressed: () => _finish(register: true),
                              style: FilledButton.styleFrom(
                                backgroundColor: _amber,
                                foregroundColor: _navyDeep,
                                textStyle: AppTypography.label
                                    .copyWith(fontWeight: FontWeight.w800),
                              ),
                              child: const Text('İlk Devriyene Çık'),
                            )
                          : FilledButton(
                              onPressed: _next,
                              style: FilledButton.styleFrom(
                                  backgroundColor: _blue,
                                  foregroundColor: Colors.white),
                              child: const Text('Devam Et'),
                            ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    TextButton(
                      onPressed: () => _finish(register: false),
                      style: TextButton.styleFrom(
                        foregroundColor: _softInk,
                        minimumSize: const Size(64, 44), // dokunma hedefi
                      ),
                      child:
                          Text(_isLast ? 'Zaten hesabım var' : 'Atla'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sayfa girişi: yumuşak fade + yükselme. Reduce Motion'da animasyonsuz.
class _Entrance extends StatelessWidget {
  const _Entrance({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: AppMotion.respect(const Duration(milliseconds: 420)),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, 16 * (1 - t)), child: child),
      ),
      child: child,
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.index});
  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: AppMotion.respect(AppMotion.quick),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: i == index ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: i == index
                  ? _amber
                  : Colors.white.withValues(alpha: .28),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
      ],
    );
  }
}

// ─────────────────────── Hero kompozisyonları ───────────────────────
// Ortak dil: cam kart (beyaz %9 dolgu + %15 kenar), tek amber odak noktası,
// teal=doğru, mavi=eylem. Boyutlar Flexible içinde FittedBox'la küçük ekrana
// uyum sağlar.

BoxDecoration _glass({Color? borderColor, double radius = 16}) => BoxDecoration(
      color: Colors.white.withValues(alpha: .09),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
          color: borderColor ?? Colors.white.withValues(alpha: .15)),
    );

Widget _bar(double w, double h, Color c, {double r = 99}) => Container(
      width: w,
      height: h,
      decoration:
          BoxDecoration(color: c, borderRadius: BorderRadius.circular(r)),
    );

class _Fit extends StatelessWidget {
  const _Fit({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) =>
      FittedBox(fit: BoxFit.scaleDown, child: child);
}

/// S1 · Hedef Kilidi: nişangâh halkası + amber kilit + yörünge kartları.
class _HeroTarget extends StatefulWidget {
  const _HeroTarget();
  @override
  State<_HeroTarget> createState() => _HeroTargetState();
}

class _HeroTargetState extends State<_HeroTarget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
      vsync: this, duration: const Duration(seconds: 7))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final animate = !AppMotion.reduceMotion;
    return _Fit(
      child: SizedBox(
        width: 280,
        height: 300,
        child: AnimatedBuilder(
          animation: _float,
          builder: (context, _) {
            final t = animate ? _float.value : .5;
            return Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 210,
                  height: 210,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: Colors.white.withValues(alpha: .12), width: 2),
                  ),
                ),
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 22),
                  ),
                ),
                Container(
                  width: 44,
                  height: 44,
                  decoration:
                      const BoxDecoration(shape: BoxShape.circle, color: _amber),
                ),
                Positioned(
                  left: 8,
                  top: 24 + 8 * t,
                  child: Container(
                      width: 84,
                      height: 30,
                      decoration: _glass(radius: 10),
                      padding: const EdgeInsets.all(8),
                      child: _bar(48, 8, Colors.white.withValues(alpha: .7))),
                ),
                Positioned(
                  right: 4,
                  bottom: 40 - 8 * t,
                  child: Container(
                      width: 92,
                      height: 30,
                      decoration: _glass(radius: 10),
                      padding: const EdgeInsets.all(8),
                      child: Row(children: [
                        _bar(8, 8, _teal),
                        const SizedBox(width: 6),
                        _bar(40, 8, Colors.white.withValues(alpha: .5)),
                      ])),
                ),
                Positioned(
                  right: 26,
                  top: 12 + 6 * (1 - t),
                  child: Container(
                      width: 56, height: 22, decoration: _glass(radius: 8)),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// S2 · Gerçek soru kartı: kaynak rozeti + şıklar, doğru şık teal onaylı.
class _HeroQuestion extends StatelessWidget {
  const _HeroQuestion();

  @override
  Widget build(BuildContext context) {
    Widget option({bool correct = false}) => Container(
          height: 34,
          margin: const EdgeInsets.only(top: 10),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: correct
              ? BoxDecoration(
                  color: _teal, borderRadius: BorderRadius.circular(10))
              : _glass(radius: 10),
          child: Row(children: [
            if (correct) ...[
              const Icon(Icons.check_circle_rounded,
                  size: 18, color: Colors.white),
              const SizedBox(width: 8),
              _bar(90, 8, Colors.white.withValues(alpha: .95)),
            ] else
              _bar(110, 8, Colors.white.withValues(alpha: .35)),
          ]),
        );

    return _Fit(
      child: Transform.rotate(
        angle: -.03,
        child: Container(
          width: 260,
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: _glass(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _amber.withValues(alpha: .18),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: _amber.withValues(alpha: .6)),
                ),
                child: Text('2023 · Komiser Yrd.',
                    style: AppTypography.caption
                        .copyWith(color: _amber, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 12),
              _bar(220, 9, Colors.white.withValues(alpha: .8)),
              const SizedBox(height: 7),
              _bar(170, 9, Colors.white.withValues(alpha: .55)),
              option(),
              option(correct: true),
              option(),
            ],
          ),
        ),
      ),
    );
  }
}

/// S3 · Koç planı: brief kartı + karışım şeridi + hafıza yayı.
class _HeroCoach extends StatelessWidget {
  const _HeroCoach();

  @override
  Widget build(BuildContext context) {
    return _Fit(
      child: SizedBox(
        width: 270,
        height: 290,
        child: Column(
          children: [
            Container(
              width: 260,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: _glass(),
              child: Row(children: [
                Container(
                    width: 34,
                    height: 34,
                    decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: _blue),
                    child: const Icon(Icons.support_agent_rounded,
                        color: Colors.white, size: 20)),
                const SizedBox(width: 10),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _bar(150, 8, Colors.white.withValues(alpha: .85)),
                  const SizedBox(height: 6),
                  _bar(110, 7, Colors.white.withValues(alpha: .45)),
                ]),
              ]),
            ),
            const SizedBox(height: 14),
            Container(
              width: 240,
              padding: const EdgeInsets.all(10),
              decoration: _glass(radius: 12),
              child: Row(children: [
                _bar(88, 10, _teal, r: 5),
                const SizedBox(width: 5),
                _bar(64, 10, _blue, r: 5),
                const SizedBox(width: 5),
                _bar(40, 10, _amber, r: 5),
              ]),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: 150,
              height: 84,
              child: CustomPaint(painter: _MemoryArcPainter()),
            ),
          ],
        ),
      ),
    );
  }
}

class _MemoryArcPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(6, 10, size.width - 12, (size.height - 14) * 2);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..color = Colors.white.withValues(alpha: .16);
    final fill = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..color = _teal;
    canvas.drawArc(rect, math.pi, math.pi, false, track);
    canvas.drawArc(rect, math.pi, 2.1, false, fill);
    const dotAngle = math.pi + 2.1;
    final cx = rect.center.dx + (rect.width / 2) * math.cos(dotAngle);
    final cy = rect.center.dy + (rect.height / 2) * math.sin(dotAngle);
    canvas.drawCircle(Offset(cx, cy), 6, Paint()..color = _amber);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// S4 · Isı haritası + rütbe kartı.
class _HeroHeat extends StatelessWidget {
  const _HeroHeat();

  static const List<Color> _cells = [
    _teal, Color(0x662FC493), _amber, Colors.white24, Color(0x992FC493),
    Color(0x662FC493), Color(0xFFE2574C), _teal, Color(0x88F3A93C), Colors.white24,
    Color(0xCC2FC493), Color(0x442FC493), Colors.white24, _teal, Color(0x66F3A93C),
  ];

  @override
  Widget build(BuildContext context) {
    return _Fit(
      child: SizedBox(
        width: 264,
        height: 290,
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: _glass(),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final c in _cells)
                  Container(
                      width: 38,
                      height: 30,
                      decoration: BoxDecoration(
                          color: c, borderRadius: BorderRadius.circular(7))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: 240,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: _glass(borderColor: _amber.withValues(alpha: .5)),
            child: Row(children: [
              Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                      shape: BoxShape.circle, color: _amber),
                  child: const Icon(Icons.military_tech_rounded,
                      color: _navyDeep, size: 22)),
              const SizedBox(width: 12),
              Expanded(
                child:
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _bar(110, 8, Colors.white.withValues(alpha: .85)),
                  const SizedBox(height: 8),
                  Stack(children: [
                    _bar(160, 7, Colors.white.withValues(alpha: .18)),
                    _bar(96, 7, _blue),
                  ]),
                ]),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// S5 · Podyum + canlı deneme satırı.
class _HeroPodium extends StatefulWidget {
  const _HeroPodium();
  @override
  State<_HeroPodium> createState() => _HeroPodiumState();
}

class _HeroPodiumState extends State<_HeroPodium>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
      vsync: this, duration: const Duration(seconds: 2))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget card(double w, double h, Color avatar, {bool winner = false}) =>
        Container(
          width: w,
          height: h,
          decoration: _glass(
              borderColor: winner ? _amber.withValues(alpha: .7) : null),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
                width: winner ? 34 : 26,
                height: winner ? 34 : 26,
                decoration:
                    BoxDecoration(shape: BoxShape.circle, color: avatar)),
            const SizedBox(height: 8),
            _bar(w * .5, 7, Colors.white.withValues(alpha: .8)),
            if (winner) ...[
              const SizedBox(height: 6),
              _bar(w * .35, 6, Colors.white.withValues(alpha: .45)),
            ],
          ]),
        );

    return _Fit(
      child: SizedBox(
        width: 270,
        height: 290,
        child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              card(72, 96, const Color(0xFFC8CDD8)),
              const SizedBox(width: 10),
              card(88, 128, _amber, winner: true),
              const SizedBox(width: 10),
              card(72, 84, const Color(0xFFB07A46)),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: 260,
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: 10),
            decoration: _glass(borderColor: _blue.withValues(alpha: .4)),
            child: Row(children: [
              FadeTransition(
                opacity: AppMotion.reduceMotion
                    ? const AlwaysStoppedAnimation(1)
                    : _pulse.drive(Tween(begin: .35, end: 1)),
                child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: _teal)),
              ),
              const SizedBox(width: 10),
              _bar(120, 8, Colors.white.withValues(alpha: .75)),
              const Spacer(),
              _bar(44, 16, _blue, r: 8),
            ]),
          ),
        ]),
      ),
    );
  }
}
