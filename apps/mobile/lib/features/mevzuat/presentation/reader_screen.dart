import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_haptics.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/mevzuat_repository.dart';
import 'toc_sheet.dart';

/// Mevzuat okuyucusu (Doc 29 §8/10): madde-blok yapılı sürekli akış.
/// Metin ekrana hâkimdir — üst bar kaydırınca gizlenir, içindekiler FAB'ı
/// köşede bekler. Okuma konumu sunucuya sessizce yazılır (devam et).
class ReaderScreen extends ConsumerStatefulWidget {
  final String slug;
  final String? initialArticleNo;
  const ReaderScreen({super.key, required this.slug, this.initialArticleNo});

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final _itemScroll = ItemScrollController();
  final _positions = ItemPositionsListener.create();
  Set<String> _bookmarked = {};
  bool _barVisible = true;
  String? _visibleNo;
  Timer? _progressTimer;
  String? _lastSavedNo;

  @override
  void initState() {
    super.initState();
    _positions.itemPositions.addListener(_onPositionsChanged);
    // Kayıtlı maddeleri tohumla (rozetler doğru başlasın).
    Future.microtask(() async {
      try {
        final items = await ref.read(mevzuatRepositoryProvider).bookmarks();
        if (mounted) {
          setState(() => _bookmarked = {
                for (final b in items.where((b) => b.lawSlug == widget.slug))
                  b.no,
              });
        }
      } catch (_) {/* kimliksiz/offline — rozetsiz devam */}
    });
    // Konum kaydı: 20 sn'de bir + çıkışta (istek sağanağı yok).
    _progressTimer = Timer.periodic(
        const Duration(seconds: 20), (_) => _saveProgress());
  }

  @override
  void dispose() {
    _saveProgress();
    _progressTimer?.cancel();
    _positions.itemPositions.removeListener(_onPositionsChanged);
    super.dispose();
  }

  List<ReaderArticle> get _articles =>
      ref.read(readerProvider(widget.slug)).valueOrNull?.articles ?? const [];

  void _onPositionsChanged() {
    final positions = _positions.itemPositions.value;
    if (positions.isEmpty || _articles.isEmpty) return;
    // Ekranın üst yarısındaki ilk madde = "şu an okunan".
    final top = positions
        .where((p) => p.itemLeadingEdge < .5)
        .fold<int?>(null, (acc, p) => acc == null || p.index > acc ? p.index : acc);
    final idx = (top ?? positions.first.index).clamp(0, _articles.length - 1);
    final no = _articles[idx].no;
    if (no != _visibleNo && mounted) setState(() => _visibleNo = no);
  }

  void _saveProgress() {
    final no = _visibleNo;
    if (no == null || no == _lastSavedNo) return;
    _lastSavedNo = no;
    ref.read(mevzuatRepositoryProvider).saveProgress(widget.slug, no);
  }

  Future<void> _toggleBookmark(String no) async {
    final repo = ref.read(mevzuatRepositoryProvider);
    final was = _bookmarked.contains(no);
    AppHaptics.select();
    setState(() => was ? _bookmarked.remove(no) : _bookmarked.add(no));
    try {
      was
          ? await repo.removeBookmark(widget.slug, no)
          : await repo.addBookmark(widget.slug, no);
      ref.invalidate(articleBookmarksProvider);
    } catch (_) {
      // Geri al + tek satır bilgi.
      if (mounted) {
        setState(() => was ? _bookmarked.add(no) : _bookmarked.remove(no));
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Kaydedilemedi — tekrar dene.')));
      }
    }
  }

  void _share(ReaderPayload r, ReaderArticle a) {
    // V1 paylaşımı: SEO'lu web sayfası (Doc 29 §14) — alan herkes açabilir.
    final url = 'https://paemisyon.com/kanun/${r.slug}/madde/${a.slug}';
    Share.share('${r.displayShort} Madde ${a.no} — $url');
  }

  Future<void> _openToc(ReaderPayload r) async {
    final detail =
        await ref.read(legislationDetailProvider(widget.slug).future);
    if (!mounted) return;
    final no = await showTocSheet(context,
        sections: detail.sections, toc: detail.toc, currentNo: _visibleNo);
    if (no != null) _jumpTo(no);
  }

  void _jumpTo(String no) {
    final idx = _articles.indexWhere((a) => a.no == no);
    if (idx >= 0 && _itemScroll.isAttached) {
      _itemScroll.scrollTo(
          index: idx,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOutCubic);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final reader = ref.watch(readerProvider(widget.slug));

    return Scaffold(
      body: reader.when(
        loading: () => const SafeArea(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Column(children: [
              LoadingSkeleton(height: 40),
              SizedBox(height: AppSpacing.lg),
              LoadingSkeleton(height: 160),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 160),
            ]),
          ),
        ),
        error: (e, _) => SafeArea(
          child: ErrorStateView(
            message: e is Failure ? e.message : 'Metin yüklenemedi.',
            onRetry: () => ref.invalidate(readerProvider(widget.slug)),
          ),
        ),
        data: (r) {
          // İlk açılışta hedef maddeye konumlan (arama/deep-link/devam).
          final initialIndex = widget.initialArticleNo != null
              ? r.articles
                  .indexWhere((a) => a.no == widget.initialArticleNo)
                  .clamp(0, r.articles.length - 1)
              : 0;
          final sectionsById = {for (final s in r.sections) s.id: s};

          return NotificationListener<UserScrollNotification>(
            onNotification: (n) {
              final show = n.direction != ScrollDirection.reverse;
              if (show != _barVisible) setState(() => _barVisible = show);
              return false;
            },
            child: Stack(children: [
              SafeArea(
                child: Column(children: [
                  // ── Minimal üst bar (kaydırınca gizlenir) ──
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: _barVisible ? 48 : 0,
                    child: _barVisible
                        ? Row(children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_rounded),
                              onPressed: () => context.pop(),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Text(r.displayShort,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.label
                                          .copyWith(color: tokens.ink)),
                                  if (_visibleNo != null)
                                    Text(
                                        'Madde $_visibleNo / ${r.articles.length} madde',
                                        style: AppTypography.caption
                                            .copyWith(
                                                color: tokens.inkSoft)),
                                ],
                              ),
                            ),
                          ])
                        : const SizedBox.shrink(),
                  ),
                  Expanded(
                    child: ScrollablePositionedList.builder(
                      itemScrollController: _itemScroll,
                      itemPositionsListener: _positions,
                      initialScrollIndex: initialIndex,
                      itemCount: r.articles.length + 1,
                      itemBuilder: (context, i) {
                        if (i == 0) {
                          return _ReaderHeader(payload: r);
                        }
                        final a = r.articles[i - 1];
                        final prev =
                            i >= 2 ? r.articles[i - 2] : null;
                        final sectionChanged =
                            a.sectionId != prev?.sectionId &&
                                a.sectionId != null;
                        return _ArticleBlock(
                          article: a,
                          sectionHeading: sectionChanged
                              ? sectionsById[a.sectionId]?.heading
                              : null,
                          bookmarked: _bookmarked.contains(a.no),
                          onBookmark: () => _toggleBookmark(a.no),
                          onShare: () => _share(r, a),
                          onQuiz: r.topicId != null && a.questionCount > 0
                              ? () => context.push('/quiz', extra: {
                                    'topicId': r.topicId,
                                    'articleNo': a.no,
                                    'topicName':
                                        '${r.displayShort} m.${a.no}',
                                    'mode': 'practice',
                                    'count':
                                        a.questionCount.clamp(1, 10),
                                  })
                              : null,
                        );
                      },
                    ),
                  ),
                ]),
              ),
              // ── İçindekiler FAB ──
              Positioned(
                right: AppSpacing.lg,
                bottom: AppSpacing.xl,
                child: FloatingActionButton.small(
                  heroTag: 'toc',
                  backgroundColor: tokens.brand,
                  foregroundColor: tokens.surface,
                  tooltip: 'İçindekiler',
                  onPressed: () => _openToc(r),
                  child: const Icon(Icons.toc_rounded),
                ),
              ),
            ]),
          );
        },
      ),
    );
  }
}

/// Okuyucu başlığı: kanun adı + kaynak künyesi (bir kez, en üstte).
class _ReaderHeader extends StatelessWidget {
  final ReaderPayload payload;
  const _ReaderHeader({required this.payload});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final r = payload;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl, AppSpacing.md, AppSpacing.xl, AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(r.name, style: AppTypography.title.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text(
            [
              'Kaynak: ${r.source}',
              if (r.effectiveInfo != null) r.effectiveInfo!,
              if (r.verifiedAt != null)
                '${r.verifiedAt!.day.toString().padLeft(2, '0')}.'
                    '${r.verifiedAt!.month.toString().padLeft(2, '0')}.'
                    '${r.verifiedAt!.year} itibarıyla doğrulandı',
            ].join(' · '),
            style: AppTypography.caption.copyWith(color: tokens.inkSoft),
          ),
          const SizedBox(height: AppSpacing.sm),
          Divider(color: tokens.line),
        ],
      ),
    );
  }
}

/// Tek madde bloğu: belirgin numara + başlık + resmî metin + aksiyon satırı.
class _ArticleBlock extends StatelessWidget {
  final ReaderArticle article;
  final String? sectionHeading;
  final bool bookmarked;
  final VoidCallback onBookmark;
  final VoidCallback onShare;
  final VoidCallback? onQuiz;
  const _ArticleBlock({
    required this.article,
    this.sectionHeading,
    required this.bookmarked,
    required this.onBookmark,
    required this.onShare,
    this.onQuiz,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (sectionHeading != null)
            Padding(
              padding: const EdgeInsets.only(
                  top: AppSpacing.xl, bottom: AppSpacing.sm),
              child: Text(
                sectionHeading!.toUpperCase(),
                style: AppTypography.caption.copyWith(
                    color: tokens.brand,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w700),
              ),
            ),
          const SizedBox(height: AppSpacing.lg),
          Text('MADDE ${article.no}',
              style: AppTypography.heading
                  .copyWith(color: tokens.brand, letterSpacing: .5)),
          if (article.title != null) ...[
            const SizedBox(height: 2),
            Text(article.title!,
                style: AppTypography.label
                    .copyWith(color: tokens.inkSoft, fontSize: 14)),
          ],
          const SizedBox(height: AppSpacing.sm),
          // Okuma tipografisi (Doc 29 §11): 17px / 1.6 — AppTypography.body'den
          // bilinçli ayrı; uzun mevzuat okuması için nefes payı.
          SelectableText(
            article.text,
            style: const TextStyle(fontSize: 17, height: 1.6)
                .copyWith(color: tokens.ink),
          ),
          const SizedBox(height: AppSpacing.sm),
          // Aksiyon satırı — sessiz, metni bastırmayan.
          Row(children: [
            _action(
              context,
              icon: bookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
              label: bookmarked ? 'Kaydedildi' : 'Kaydet',
              color: bookmarked ? tokens.brand : tokens.inkSoft,
              onTap: onBookmark,
            ),
            const SizedBox(width: AppSpacing.lg),
            _action(context,
                icon: Icons.share_outlined,
                label: 'Paylaş',
                color: tokens.inkSoft,
                onTap: onShare),
            if (onQuiz != null) ...[
              const SizedBox(width: AppSpacing.lg),
              _action(context,
                  icon: Icons.track_changes_rounded,
                  label: '${article.questionCount} soru',
                  color: tokens.accentSession,
                  onTap: onQuiz!),
            ],
          ]),
          const SizedBox(height: AppSpacing.lg),
          Divider(color: tokens.line),
        ],
      ),
    );
  }

  Widget _action(BuildContext context,
      {required IconData icon,
      required String label,
      required Color color,
      required VoidCallback onTap}) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs, vertical: AppSpacing.sm),
          child: Row(children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: AppSpacing.xs),
            Text(label,
                style: AppTypography.caption
                    .copyWith(color: color, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}
