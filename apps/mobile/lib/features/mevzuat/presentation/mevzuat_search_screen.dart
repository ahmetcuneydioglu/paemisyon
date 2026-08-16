import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/mevzuat_repository.dart';

/// Mevzuat araması (Doc 29 §7): "PVSK", "2559", "cmk 90", "4/A",
/// "zor kullanma" — hepsi tek kutu. Sonuç dokunuşu maddeye gider, kanun
/// başına değil. Sunucu highlight'ı ⟪…⟫ ayraçlarıyla gelir.
class MevzuatSearchScreen extends ConsumerStatefulWidget {
  const MevzuatSearchScreen({super.key});

  @override
  ConsumerState<MevzuatSearchScreen> createState() =>
      _MevzuatSearchScreenState();
}

class _MevzuatSearchScreenState extends ConsumerState<MevzuatSearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  MevzuatSearchResult? _result;
  bool _loading = false;
  String _lastQuery = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _search(q));
  }

  Future<void> _search(String q) async {
    final query = q.trim();
    if (query.length < 2) {
      setState(() {
        _result = null;
        _lastQuery = query;
      });
      return;
    }
    setState(() => _loading = true);
    try {
      final r = await ref.read(mevzuatRepositoryProvider).search(query);
      if (mounted && _controller.text.trim() == query) {
        setState(() {
          _result = r;
          _lastQuery = query;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = _result;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: AppSpacing.lg),
          child: TextField(
            controller: _controller,
            autofocus: true,
            textInputAction: TextInputAction.search,
            onChanged: _onChanged,
            onSubmitted: _search,
            decoration: InputDecoration(
              hintText: 'PVSK, cmk 90, zor kullanma…',
              border: InputBorder.none,
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () {
                        _controller.clear();
                        _search('');
                      },
                    )
                  : null,
            ),
          ),
        ),
      ),
      body: Column(children: [
        if (_loading) const LinearProgressIndicator(minHeight: 2),
        Expanded(child: _body(context, r)),
      ]),
    );
  }

  Widget _body(BuildContext context, MevzuatSearchResult? r) {
    final tokens = context.tokens;
    if (r == null) {
      // Henüz arama yok — ipucu ekranı.
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ŞUNLARI DENEYEBİLİRSİN',
                style: AppTypography.caption
                    .copyWith(color: tokens.inkSoft, letterSpacing: .8)),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (final s in const [
                  'PVSK',
                  'cmk 90',
                  'zor kullanma',
                  'kimlik sorma',
                  'gözaltı',
                  'yakalama'
                ])
                  ActionChip(
                    label: Text(s),
                    labelStyle: AppTypography.label
                        .copyWith(color: tokens.ink, fontSize: 12),
                    onPressed: () {
                      _controller.text = s;
                      _search(s);
                    },
                  ),
              ],
            ),
          ],
        ),
      );
    }
    if (r.isEmpty) {
      return EmptyStateView(
        icon: Icons.search_off_rounded,
        message:
            '"$_lastQuery" için sonuç bulunamadı.\nKanun adı, numarası veya bir kavram dene.',
      );
    }
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        if (r.legislation.isNotEmpty) ...[
          Text('MEVZUAT',
              style: AppTypography.caption
                  .copyWith(color: tokens.inkSoft, letterSpacing: .8)),
          const SizedBox(height: AppSpacing.sm),
          for (final l in r.legislation)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.balance_rounded, color: tokens.brand),
              title: Text(
                [if (l.number != null) l.number, l.name].join(' — '),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.body
                    .copyWith(color: tokens.ink, fontWeight: FontWeight.w600),
              ),
              trailing: Icon(Icons.chevron_right_rounded,
                  size: 18, color: tokens.inkSoft),
              onTap: () => context.push('/mevzuat/${l.slug}'),
            ),
          const SizedBox(height: AppSpacing.md),
        ],
        if (r.articles.isNotEmpty) ...[
          Text('MADDELER',
              style: AppTypography.caption
                  .copyWith(color: tokens.inkSoft, letterSpacing: .8)),
          const SizedBox(height: AppSpacing.sm),
          for (final a in r.articles) _ArticleHitTile(hit: a),
        ],
      ],
    );
  }
}

class _ArticleHitTile extends StatelessWidget {
  final ArticleHit hit;
  const _ArticleHitTile({required this.hit});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        onTap: () => context.push(
            '/mevzuat/${hit.lawSlug}/oku?madde=${Uri.encodeComponent(hit.no)}'),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: tokens.surface,
            border: Border.all(color: tokens.line),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                [
                  if (hit.lawShort != null) hit.lawShort!,
                  'Madde ${hit.no}',
                  if (hit.title != null) hit.title!,
                ].join(' · '),
                style: AppTypography.label.copyWith(color: tokens.brand),
              ),
              if (hit.headline.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xs),
                _HighlightedText(text: hit.headline),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// ⟪…⟫ ayraçlı sunucu highlight'ını kalın+brand'e çevirir.
class _HighlightedText extends StatelessWidget {
  final String text;
  const _HighlightedText({required this.text});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final base = AppTypography.body.copyWith(
        color: tokens.inkSoft, fontSize: 13, height: 1.4);
    final spans = <TextSpan>[];
    final re = RegExp('⟪(.+?)⟫');
    var last = 0;
    for (final m in re.allMatches(text)) {
      if (m.start > last) {
        spans.add(TextSpan(text: text.substring(last, m.start)));
      }
      spans.add(TextSpan(
        text: m.group(1),
        style: base.copyWith(
            color: tokens.brand, fontWeight: FontWeight.w700),
      ));
      last = m.end;
    }
    if (last < text.length) spans.add(TextSpan(text: text.substring(last)));
    return Text.rich(
      TextSpan(style: base, children: spans),
      maxLines: 3,
      overflow: TextOverflow.ellipsis,
    );
  }
}
