import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Aktivite ısı şeridi (Doc 28 P1-10) — GitHub katkı takviminin mobil hali:
/// dikey dev ızgara değil, YATAY kompakt şerit (hafta sütunları). Boş gün
/// suçlanmaz — nötr zeminde kalır. Kabul: iki tema · a11y · boş durum.
class ActivityHeatStrip extends StatelessWidget {
  /// Gün → soru sayısı; tarih artan sırada (API sırası).
  final List<({String date, int count})> days;

  /// true: 7 günlük tek satır (nöbet çizelgesi); false: haftalık sütunlar.
  final bool singleRow;

  const ActivityHeatStrip({super.key, required this.days, this.singleRow = false});

  Color _cellColor(AppTokens tokens, int count) {
    if (count <= 0) return tokens.surfaceAlt;
    if (count < 10) return tokens.brand.withValues(alpha: 0.30);
    if (count < 25) return tokens.brand.withValues(alpha: 0.60);
    return tokens.brand;
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final activeDays = days.where((d) => d.count > 0).length;
    final semantics =
        "Son ${days.length} günün $activeDays'i aktif";

    if (singleRow) {
      // Nöbet çizelgesi: son 7 gün, gün başına bir hücre + gün baş harfi.
      final last7 = days.length > 7 ? days.sublist(days.length - 7) : days;
      const dayLetters = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
      return Semantics(
        label: semantics,
        excludeSemantics: true,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (final d in last7)
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: _cellColor(tokens, d.count),
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusSm),
                      border: Border.all(color: tokens.line),
                    ),
                    alignment: Alignment.center,
                    child: d.count > 0
                        ? Text('${d.count}',
                            style: AppTypography.caption.copyWith(
                                color: d.count >= 25
                                    ? tokens.surface
                                    : tokens.ink))
                        : null,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dayLetters[
                        (DateTime.parse(d.date).weekday - 1).clamp(0, 6)],
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft, fontSize: 9),
                  ),
                ],
              ),
          ],
        ),
      );
    }

    // 12 hafta ısısı: haftalık sütunlar (7 hücre), yatay kaydırmalı.
    final weeks = <List<({String date, int count})>>[];
    for (var i = 0; i < days.length; i += 7) {
      weeks.add(days.sublist(i, (i + 7).clamp(0, days.length)));
    }
    return Semantics(
      label: semantics,
      excludeSemantics: true,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true, // en yeni hafta görünür başlasın
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (final w in weeks)
              Padding(
                padding: const EdgeInsets.only(right: 3),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final d in w)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: _cellColor(tokens, d.count),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
