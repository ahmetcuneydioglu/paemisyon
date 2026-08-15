import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_haptics.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../catalog/domain/catalog_models.dart';
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

/// Okuma boyutu kademeleri (Doc 29 §12) — yalnız okuyucu metnini ölçekler.
const _kTextScaleKey = 'reading_text_scale_v1';
const _kScales = [0.9, 1.0, 1.15];

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final _itemScroll = ItemScrollController();
  final _positions = ItemPositionsListener.create();
  Set<String> _bookmarked = {};
  Map<String, List<HighlightItem>> _highlights = {};
  Map<String, String> _notes = {};
  int _scaleIndex = 1;
  bool _barVisible = true;
  String? _visibleNo;
  Timer? _progressTimer;
  String? _lastSavedNo;

  @override
  void initState() {
    super.initState();
    _positions.itemPositions.addListener(_onPositionsChanged);
    SharedPreferences.getInstance().then((prefs) {
      final i = prefs.getInt(_kTextScaleKey);
      if (i != null && mounted) {
        setState(() => _scaleIndex = i.clamp(0, _kScales.length - 1));
      }
    });
    // Kayıtlı maddeler + işaret/not katmanı (rozetler doğru başlasın).
    Future.microtask(() async {
      final repo = ref.read(mevzuatRepositoryProvider);
      try {
        final items = await repo.bookmarks();
        if (mounted) {
          setState(() => _bookmarked = {
                for (final b in items.where((b) => b.lawSlug == widget.slug))
                  b.no,
              });
        }
      } catch (_) {/* kimliksiz/offline — rozetsiz devam */}
      try {
        final ann = await repo.annotations(widget.slug);
        if (mounted) {
          setState(() {
            _highlights = {};
            for (final h in ann.highlights) {
              (_highlights[h.no] ??= []).add(h);
            }
            _notes = Map.of(ann.notes);
          });
        }
      } catch (_) {/* işaret katmanı opsiyonel */}
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

  Future<void> _addHighlight(String no, TextSelection sel, String text) async {
    final start = sel.start;
    final end = sel.end;
    if (start < 0 || end <= start || end > text.length) return;
    final snippet = text.substring(start, end);
    AppHaptics.select();
    try {
      final id = await ref.read(mevzuatRepositoryProvider).addHighlight(
            lawSlug: widget.slug,
            no: no,
            startOffset: start,
            endOffset: end,
            snippet: snippet,
          );
      if (id != null && mounted) {
        setState(() => (_highlights[no] ??= []).add(HighlightItem(
              id: id,
              no: no,
              startOffset: start,
              endOffset: end,
              snippet: snippet,
            )));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('İşaretlenemedi — tekrar dene.')));
      }
    }
  }

  Future<void> _removeHighlight(String no, HighlightItem h) async {
    setState(() => _highlights[no]?.removeWhere((x) => x.id == h.id));
    try {
      await ref.read(mevzuatRepositoryProvider).removeHighlight(h.id);
    } catch (_) {
      if (mounted) setState(() => (_highlights[no] ??= []).add(h));
    }
  }

  Future<void> _editNote(String no) async {
    final controller = TextEditingController(text: _notes[no] ?? '');
    final saved = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.xl,
          right: AppSpacing.xl,
          bottom: AppSpacing.xl + MediaQuery.viewInsetsOf(ctx).bottom,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Madde $no — Notum',
              style: AppTypography.heading.copyWith(color: ctx.tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text('Kişisel notun — resmî metnin parçası değildir.',
              style:
                  AppTypography.caption.copyWith(color: ctx.tokens.inkSoft)),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: controller,
            autofocus: true,
            minLines: 3,
            maxLines: 8,
            maxLength: 2000,
            decoration: const InputDecoration(
                hintText: 'Örn. "Yakalama şartlarını tekrar çalış."'),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(children: [
            if ((_notes[no] ?? '').isNotEmpty)
              TextButton(
                onPressed: () => Navigator.pop(ctx, ''),
                child: const Text('Notu sil'),
              ),
            const Spacer(),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: const Text('Kaydet'),
            ),
          ]),
        ]),
      ),
    );
    // Kapanış animasyonu bitmeden dispose çökmesin (login ekranı deseni).
    Future.delayed(const Duration(milliseconds: 400), controller.dispose);
    if (saved == null || !mounted) return;
    final prev = _notes[no];
    setState(() {
      if (saved.isEmpty) {
        _notes.remove(no);
      } else {
        _notes[no] = saved;
      }
    });
    try {
      await ref.read(mevzuatRepositoryProvider).putNote(widget.slug, no, saved);
    } catch (_) {
      if (mounted) {
        setState(() {
          if (prev == null) {
            _notes.remove(no);
          } else {
            _notes[no] = prev;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Not kaydedilemedi — tekrar dene.')));
      }
    }
  }

  void _cycleTextScale() {
    AppHaptics.select();
    setState(() => _scaleIndex = (_scaleIndex + 1) % _kScales.length);
    SharedPreferences.getInstance()
        .then((p) => p.setInt(_kTextScaleKey, _scaleIndex));
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
          // Hâkimiyet katmanı (Doc 29 P1): girişliyse fetih işaretleri;
          // hata/anonim durumda sessizce yok sayılır.
          final atlas = r.topicId != null
              ? ref.watch(atlasProvider(r.topicId!)).valueOrNull
              : null;
          final atlasByNo = <String, AtlasArticle>{
            if (atlas != null) for (final a in atlas.articles) a.no: a,
          };
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
                            IconButton(
                              tooltip: 'Yazı boyutu',
                              icon: Text('Aa',
                                  style: AppTypography.label.copyWith(
                                    color: tokens.ink,
                                    fontSize: 13 + 2.0 * _scaleIndex,
                                  )),
                              onPressed: _cycleTextScale,
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
                          textScale: _kScales[_scaleIndex],
                          mastery: atlasByNo[a.no],
                          highlights: _highlights[a.no] ?? const [],
                          note: _notes[a.no],
                          onHighlight: (sel) =>
                              _addHighlight(a.no, sel, a.text),
                          onRemoveHighlight: (h) =>
                              _removeHighlight(a.no, h),
                          onNote: () => _editNote(a.no),
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
  final double textScale;
  final AtlasArticle? mastery;
  final String? sectionHeading;
  final bool bookmarked;
  final List<HighlightItem> highlights;
  final String? note;
  final VoidCallback onBookmark;
  final VoidCallback onShare;
  final VoidCallback? onQuiz;
  final ValueChanged<TextSelection> onHighlight;
  final ValueChanged<HighlightItem> onRemoveHighlight;
  final VoidCallback onNote;
  const _ArticleBlock({
    required this.article,
    this.textScale = 1.0,
    this.mastery,
    this.sectionHeading,
    required this.bookmarked,
    this.highlights = const [],
    this.note,
    required this.onBookmark,
    required this.onShare,
    this.onQuiz,
    required this.onHighlight,
    required this.onRemoveHighlight,
    required this.onNote,
  });

  /// Metni işaret aralıklarına göre span'lere böler. Çapa doğrulanır:
  /// aralıktaki metin parçayla uyuşmazsa parça aranır; bulunamazsa atlanır
  /// (metin güncellenmiş olabilir — yanlış yeri boyamaktansa gizle).
  List<TextSpan> _spans(BuildContext context, TextStyle base) {
    final text = article.text;
    final ranges = <(int, int)>[];
    for (final h in highlights) {
      var start = h.startOffset;
      var end = h.endOffset;
      final valid = start >= 0 &&
          end <= text.length &&
          end > start &&
          text.substring(start, end) == h.snippet;
      if (!valid) {
        final idx = h.snippet.isNotEmpty ? text.indexOf(h.snippet) : -1;
        if (idx < 0) continue;
        start = idx;
        end = idx + h.snippet.length;
      }
      ranges.add((start, end));
    }
    ranges.sort((a, b) => a.$1.compareTo(b.$1));
    // Çakışan aralıkları birleştir (aynı yeri iki kez boyama).
    final merged = <(int, int)>[];
    for (final r in ranges) {
      if (merged.isNotEmpty && r.$1 <= merged.last.$2) {
        final last = merged.removeLast();
        merged.add((last.$1, r.$2 > last.$2 ? r.$2 : last.$2));
      } else {
        merged.add(r);
      }
    }
    final hlStyle = base.copyWith(
      backgroundColor:
          context.tokens.accentStreak.withValues(alpha: .30),
    );
    final spans = <TextSpan>[];
    var cursor = 0;
    for (final (start, end) in merged) {
      if (start > cursor) {
        spans.add(TextSpan(text: text.substring(cursor, start)));
      }
      spans.add(TextSpan(text: text.substring(start, end), style: hlStyle));
      cursor = end;
    }
    if (cursor < text.length) {
      spans.add(TextSpan(text: text.substring(cursor)));
    }
    return spans;
  }

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
          Row(children: [
            Text('MADDE ${article.no}',
                style: AppTypography.heading
                    .copyWith(color: tokens.brand, letterSpacing: .5)),
            if (mastery != null && mastery!.clearedCount > 0) ...[
              const SizedBox(width: AppSpacing.sm),
              Tooltip(
                message: mastery!.conquered
                    ? 'Fethettin — tüm sorularını çözdün'
                    : '${mastery!.clearedCount}/${mastery!.questionCount} soru temiz',
                child: Icon(
                  mastery!.conquered
                      ? Icons.flag_circle_rounded
                      : Icons.flag_circle_outlined,
                  size: 18,
                  color: mastery!.conquered
                      ? tokens.success
                      : tokens.accentStreak,
                ),
              ),
            ],
          ]),
          if (article.title != null) ...[
            const SizedBox(height: 2),
            Text(article.title!,
                style: AppTypography.label
                    .copyWith(color: tokens.inkSoft, fontSize: 14)),
          ],
          const SizedBox(height: AppSpacing.sm),
          // Okuma tipografisi (Doc 29 §11): 17px / 1.6 — AppTypography.body'den
          // bilinçli ayrı; uzun mevzuat okuması için nefes payı.
          Builder(builder: (context) {
            final base = TextStyle(
                fontSize: 17 * textScale, height: 1.6, color: tokens.ink);
            return SelectableText.rich(
              TextSpan(style: base, children: _spans(context, base)),
              contextMenuBuilder: (ctx, editableTextState) {
                final sel = editableTextState.textEditingValue.selection;
                return AdaptiveTextSelectionToolbar.buttonItems(
                  anchors: editableTextState.contextMenuAnchors,
                  buttonItems: [
                    if (sel.isValid && !sel.isCollapsed)
                      ContextMenuButtonItem(
                        label: '🖍 İşaretle',
                        onPressed: () {
                          editableTextState.hideToolbar();
                          onHighlight(sel);
                        },
                      ),
                    ...editableTextState.contextMenuButtonItems,
                  ],
                );
              },
            );
          }),
          // Kişisel not — resmî metinden GÖRSEL olarak ayrı kart (Doc 29 §37).
          if (note != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: tokens.accentStreak.withValues(alpha: .08),
                border: Border(
                    left: BorderSide(
                        color: tokens.accentStreak, width: 3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('📝 NOTUM',
                      style: AppTypography.caption.copyWith(
                          color: tokens.accentStreak,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .8)),
                  const SizedBox(height: AppSpacing.xs),
                  Text(note!,
                      style: AppTypography.body
                          .copyWith(color: tokens.ink, fontSize: 14)),
                ],
              ),
            ),
          ],
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
                icon: note != null
                    ? Icons.sticky_note_2_rounded
                    : Icons.sticky_note_2_outlined,
                label: note != null ? 'Notum' : 'Not',
                color: note != null ? tokens.accentStreak : tokens.inkSoft,
                onTap: onNote),
            const SizedBox(width: AppSpacing.lg),
            _action(context,
                icon: Icons.share_outlined,
                label: 'Paylaş',
                color: tokens.inkSoft,
                onTap: onShare),
            if (highlights.isNotEmpty) ...[
              const SizedBox(width: AppSpacing.lg),
              _action(context,
                  icon: Icons.border_color_rounded,
                  label: '${highlights.length}',
                  color: tokens.accentStreak,
                  onTap: () => _showHighlightList(context)),
            ],
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

  void _showHighlightList(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xl),
          children: [
            Text('Madde ${article.no} — işaretlerin',
                style:
                    AppTypography.heading.copyWith(color: ctx.tokens.ink)),
            const SizedBox(height: AppSpacing.sm),
            for (final h in highlights)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  '"${h.snippet}"',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.body
                      .copyWith(color: ctx.tokens.ink, fontSize: 13),
                ),
                trailing: IconButton(
                  tooltip: 'İşareti kaldır',
                  icon: Icon(Icons.delete_outline_rounded,
                      size: 20, color: ctx.tokens.danger),
                  onPressed: () {
                    Navigator.pop(ctx);
                    onRemoveHighlight(h);
                  },
                ),
              ),
          ],
        ),
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
