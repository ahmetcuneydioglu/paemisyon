import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

/// Yükleme placeholder'ı — spinner yerine skeleton (premium his, Doc 12 §12).
/// Yumuşak bir nabız animasyonuyla içeriğin geldiğini hissettirir.
class LoadingSkeleton extends StatefulWidget {
  final double height;
  final double? width;

  const LoadingSkeleton({super.key, this.height = 16, this.width});

  @override
  State<LoadingSkeleton> createState() => _LoadingSkeletonState();
}

class _LoadingSkeletonState extends State<LoadingSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Opacity(
          opacity: 0.4 + (_controller.value * 0.4),
          child: Container(
            height: widget.height,
            width: widget.width,
            decoration: BoxDecoration(
              color: base,
              borderRadius: BorderRadius.circular(AppSpacing.sm),
            ),
          ),
        );
      },
    );
  }
}
