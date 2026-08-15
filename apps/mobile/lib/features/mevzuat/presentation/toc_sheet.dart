import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../data/mevzuat_repository.dart';

/// İçindekiler bottom sheet'i (Doc 29 §9): bölüm başlıkları + madde listesi.
/// Seçilen madde no'sunu döndürür (vazgeçince null). Uzun kanunlar için
/// üstte hızlı madde-no filtresi vardır.
Future<String?> showTocSheet(
  BuildContext context, {
  required List<SectionItem> sections,
  required List<TocEntry> toc,
  String? currentNo,
}) {
  return showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      builder: (ctx, controller) => _TocBody(
        sections: sections,
        toc: toc,
        currentNo: currentNo,
        controller: controller,
      ),
    ),
  );
}

class _TocBody extends StatefulWidget {
  final List<SectionItem> sections;
  final List<TocEntry> toc;
  final String? currentNo;
  final ScrollController controller;
  const _TocBody({
    required this.sections,
    required this.toc,
    this.currentNo,
    required this.controller,
  });

  @override
  State<_TocBody> createState() => _TocBodyState();
}

class _TocBodyState extends State<_TocBody> {
  String _filter = '';

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final sectionsById = {for (final s in widget.sections) s.id: s};
    final filtered = _filter.isEmpty
        ? widget.toc
        : widget.toc
            .where((t) =>
                t.no.toLowerCase().contains(_filter) ||
                (t.title ?? '').toLowerCase().contains(_filter))
            .toList();

    // Akış: bölüm başlığı değiştikçe araya başlık satırı gir.
    final rows = <Widget>[];
    String? lastSection;
    for (final t in filtered) {
      if (_filter.isEmpty && t.sectionId != lastSection) {
        lastSection = t.sectionId;
        final s = t.sectionId != null ? sectionsById[t.sectionId] : null;
        if (s != null) {
          rows.add(Padding(
            padding: const EdgeInsets.only(
                top: AppSpacing.lg, bottom: AppSpacing.xs),
            child: Text(s.heading.toUpperCase(),
                style: AppTypography.caption
                    .copyWith(color: tokens.inkSoft, letterSpacing: .8)),
          ));
        }
      }
      final isCurrent = t.no == widget.currentNo;
      rows.add(ListTile(
        dense: true,
        contentPadding: EdgeInsets.zero,
        leading: SizedBox(
          width: 64,
          child: Text('m.${t.no}',
              style: AppTypography.label.copyWith(
                color: isCurrent ? tokens.brand : tokens.ink,
                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
              )),
        ),
        title: Text(
          t.title ?? '',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.body.copyWith(
              color: t.title == null ? tokens.inkSoft : tokens.ink,
              fontSize: 13),
        ),
        trailing: t.questionCount > 0
            ? Text('${t.questionCount} soru',
                style:
                    AppTypography.caption.copyWith(color: tokens.inkSoft))
            : null,
        selected: isCurrent,
        onTap: () => Navigator.pop(context, t.no),
      ));
    }

    return Column(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
        child: TextField(
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.filter_alt_outlined, size: 20),
            hintText: 'Madde no veya başlık filtrele',
            isDense: true,
          ),
          onChanged: (v) =>
              setState(() => _filter = v.trim().toLowerCase()),
        ),
      ),
      Expanded(
        child: ListView(
          controller: widget.controller,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.xl),
          children: rows,
        ),
      ),
    ]);
  }
}
