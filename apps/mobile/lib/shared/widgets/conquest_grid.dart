import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';

/// Fetih haritası (Doc 26 §4 #13) — kanunu madde madde temizleme ilerlemesi.
/// `onCellTap` verilirse hücreler dokunulabilir olur ve dokunma hedefi
/// ≥44pt'ye çıkarılır; salt gösterimde hücreler küçük kalır.
class ConquestGrid extends StatelessWidget {
  /// Toplam madde sayısı; hücreler 1..total olarak numaralandırılır.
  final int total;

  /// Temizlenen (1 tabanlı) madde numaraları.
  final Set<int> done;
  final ValueChanged<int>? onCellTap;

  const ConquestGrid({
    super.key,
    required this.total,
    required this.done,
    this.onCellTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final interactive = onCellTap != null;
    final double cell = interactive ? AppSpacing.minTouchTarget : 16;

    return Semantics(
      label: 'Fetih haritası: $total maddenin ${done.length} tanesi temiz',
      child: Wrap(
        spacing: interactive ? AppSpacing.xs : 3,
        runSpacing: interactive ? AppSpacing.xs : 3,
        children: [
          for (var no = 1; no <= total; no++)
            _cell(tokens, no, done.contains(no), cell, interactive),
        ],
      ),
    );
  }

  Widget _cell(
      AppTokens tokens, int no, bool isDone, double size, bool interactive) {
    final box = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isDone ? tokens.accentAtlas : tokens.surfaceAlt,
        border: Border.all(
            color: isDone ? tokens.accentAtlas : tokens.line),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm / 2),
      ),
      child: interactive
          ? Text(
              '$no',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDone ? tokens.surface : tokens.inkSoft,
              ),
            )
          : null,
    );

    if (!interactive) {
      return Semantics(
          label: 'Madde $no ${isDone ? "temiz" : "çalışılmadı"}',
          child: box);
    }
    return Semantics(
      button: true,
      label: 'Madde $no ${isDone ? "temiz" : "çalışılmadı"}',
      excludeSemantics: true,
      child: InkWell(
        onTap: () => onCellTap!(no),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm / 2),
        child: box,
      ),
    );
  }
}
