import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';

/// Mevzuat Merkezi veri katmanı (Doc 29). Public uçlar auth'suz ama tek Dio
/// üzerinden gider (Accept-Language + hata kalıbı ortak); bookmark/progress
/// uçları kimlikli.

class LegislationSummary {
  final String slug;
  final String type; // kanun | cbk | yonetmelik | genelge | yonerge
  final String? number;
  final String name;
  final String? shortName;
  final int articleCount;
  final int questionCount;
  final String? topicId;

  /// Okunabilir metni var mı — yoksa listede "metin yakında" rozeti.
  final bool readable;

  const LegislationSummary({
    required this.slug,
    required this.type,
    this.number,
    required this.name,
    this.shortName,
    required this.articleCount,
    required this.questionCount,
    this.topicId,
    this.readable = false,
  });

  /// Kompakt gösterim adı: "PVSK" yoksa tam ad.
  String get displayShort => shortName ?? name;

  factory LegislationSummary.fromJson(Map<String, dynamic> j) =>
      LegislationSummary(
        slug: j['slug'] as String,
        type: j['type'] as String? ?? 'kanun',
        number: j['number'] as String?,
        name: j['name'] as String,
        shortName: j['shortName'] as String?,
        articleCount: j['articleCount'] as int? ?? 0,
        questionCount: j['questionCount'] as int? ?? 0,
        topicId: j['topicId'] as String?,
        readable: j['readable'] as bool? ?? (j['articleCount'] as int? ?? 0) > 0,
      );
}

class SectionItem {
  final String id;
  final String? parentId;
  final String heading;
  const SectionItem(
      {required this.id, this.parentId, required this.heading});

  factory SectionItem.fromJson(Map<String, dynamic> j) => SectionItem(
        id: j['id'] as String,
        parentId: j['parentId'] as String?,
        heading: j['heading'] as String,
      );
}

class TocEntry {
  final String no;
  final String slug;
  final String? title;
  final String? sectionId;
  final int questionCount;
  const TocEntry({
    required this.no,
    required this.slug,
    this.title,
    this.sectionId,
    required this.questionCount,
  });

  factory TocEntry.fromJson(Map<String, dynamic> j) => TocEntry(
        no: j['no'] as String,
        slug: j['slug'] as String,
        title: j['title'] as String?,
        sectionId: j['sectionId'] as String?,
        questionCount: j['questionCount'] as int? ?? 0,
      );
}

class LegislationDetail {
  final String slug;
  final String name;
  final String? shortName;
  final String? number;
  final String type;
  final String? topicId;
  final String? officialSourceUrl;
  final String? effectiveInfo;
  final DateTime? lastVerifiedAt;
  final int articleCount;
  final int questionCount;
  final List<SectionItem> sections;
  final List<TocEntry> toc;

  const LegislationDetail({
    required this.slug,
    required this.name,
    this.shortName,
    this.number,
    required this.type,
    this.topicId,
    this.officialSourceUrl,
    this.effectiveInfo,
    this.lastVerifiedAt,
    required this.articleCount,
    required this.questionCount,
    required this.sections,
    required this.toc,
  });

  factory LegislationDetail.fromJson(Map<String, dynamic> j) =>
      LegislationDetail(
        slug: j['slug'] as String,
        name: j['name'] as String,
        shortName: j['shortName'] as String?,
        number: j['number'] as String?,
        type: j['type'] as String? ?? 'kanun',
        topicId: j['topicId'] as String?,
        officialSourceUrl: j['officialSourceUrl'] as String?,
        effectiveInfo: j['effectiveInfo'] as String?,
        lastVerifiedAt: j['lastVerifiedAt'] != null
            ? DateTime.tryParse(j['lastVerifiedAt'] as String)
            : null,
        articleCount: j['articleCount'] as int? ?? 0,
        questionCount: j['questionCount'] as int? ?? 0,
        sections: (j['sections'] as List<dynamic>? ?? [])
            .map((e) => SectionItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        toc: (j['toc'] as List<dynamic>? ?? [])
            .map((e) => TocEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ReaderArticle {
  final String no;
  final String slug;
  final String? title;
  final String text;
  final String? sectionId;
  final int questionCount;
  const ReaderArticle({
    required this.no,
    required this.slug,
    this.title,
    required this.text,
    this.sectionId,
    required this.questionCount,
  });

  factory ReaderArticle.fromJson(Map<String, dynamic> j) => ReaderArticle(
        no: j['no'] as String,
        slug: j['slug'] as String,
        title: j['title'] as String?,
        text: j['text'] as String,
        sectionId: j['sectionId'] as String?,
        questionCount: j['questionCount'] as int? ?? 0,
      );
}

class ReaderPayload {
  final String slug;
  final String name;
  final String? shortName;
  final String? topicId;
  final String source;
  final String? sourceUrl;
  final String? effectiveInfo;
  final DateTime? verifiedAt;
  final List<SectionItem> sections;
  final List<ReaderArticle> articles;

  const ReaderPayload({
    required this.slug,
    required this.name,
    this.shortName,
    this.topicId,
    required this.source,
    this.sourceUrl,
    this.effectiveInfo,
    this.verifiedAt,
    required this.sections,
    required this.articles,
  });

  String get displayShort => shortName ?? name;

  factory ReaderPayload.fromJson(Map<String, dynamic> j) => ReaderPayload(
        slug: j['slug'] as String,
        name: j['name'] as String,
        shortName: j['shortName'] as String?,
        topicId: j['topicId'] as String?,
        source: j['source'] as String? ?? 'mevzuat.gov.tr',
        sourceUrl: j['sourceUrl'] as String?,
        effectiveInfo: j['effectiveInfo'] as String?,
        verifiedAt: j['verifiedAt'] != null
            ? DateTime.tryParse(j['verifiedAt'] as String)
            : null,
        sections: (j['sections'] as List<dynamic>? ?? [])
            .map((e) => SectionItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        articles: (j['articles'] as List<dynamic>? ?? [])
            .map((e) => ReaderArticle.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Arama sonucu — sunucu highlight'ı ⟪…⟫ ayraçlarıyla gelir.
class MevzuatSearchResult {
  final List<LegislationSummary> legislation;
  final List<ArticleHit> articles;
  const MevzuatSearchResult({required this.legislation, required this.articles});

  bool get isEmpty => legislation.isEmpty && articles.isEmpty;

  factory MevzuatSearchResult.fromJson(Map<String, dynamic> j) =>
      MevzuatSearchResult(
        legislation: (j['legislation'] as List<dynamic>? ?? [])
            .map((e) => LegislationSummary.fromJson({
                  'articleCount': 0,
                  'questionCount': 0,
                  ...(e as Map<String, dynamic>),
                }))
            .toList(),
        articles: (j['articles'] as List<dynamic>? ?? [])
            .map((e) => ArticleHit.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ArticleHit {
  final String lawSlug;
  final String? lawShort;
  final String no;
  final String? title;
  final String headline;
  const ArticleHit({
    required this.lawSlug,
    this.lawShort,
    required this.no,
    this.title,
    required this.headline,
  });

  factory ArticleHit.fromJson(Map<String, dynamic> j) => ArticleHit(
        lawSlug: j['lawSlug'] as String,
        lawShort: j['lawShort'] as String?,
        no: j['no'] as String,
        title: j['title'] as String?,
        headline: j['headline'] as String? ?? '',
      );
}

class ArticleBookmarkItem {
  final String no;
  final String? title;
  final String lawSlug;
  final String lawShort;
  const ArticleBookmarkItem({
    required this.no,
    this.title,
    required this.lawSlug,
    required this.lawShort,
  });

  factory ArticleBookmarkItem.fromJson(Map<String, dynamic> j) =>
      ArticleBookmarkItem(
        no: j['no'] as String,
        title: j['title'] as String?,
        lawSlug: j['lawSlug'] as String,
        lawShort: j['lawShort'] as String,
      );
}

class ReadingProgressItem {
  final String lawSlug;
  final String lawShort;
  final String lawName;
  final String no;
  final DateTime updatedAt;
  const ReadingProgressItem({
    required this.lawSlug,
    required this.lawShort,
    required this.lawName,
    required this.no,
    required this.updatedAt,
  });

  factory ReadingProgressItem.fromJson(Map<String, dynamic> j) =>
      ReadingProgressItem(
        lawSlug: j['lawSlug'] as String,
        lawShort: j['lawShort'] as String,
        lawName: j['lawName'] as String,
        no: j['no'] as String,
        updatedAt: DateTime.parse(j['updatedAt'] as String),
      );
}

/// Madde işareti (highlight) — tek renk, karakter aralığı çapalı (Doc 29 §17).
class HighlightItem {
  final String id;
  final String no;
  final int startOffset;
  final int endOffset;
  final String snippet;
  const HighlightItem({
    required this.id,
    required this.no,
    required this.startOffset,
    required this.endOffset,
    required this.snippet,
  });

  factory HighlightItem.fromJson(Map<String, dynamic> j) => HighlightItem(
        id: j['id'] as String,
        no: j['no'] as String,
        startOffset: j['startOffset'] as int,
        endOffset: j['endOffset'] as int,
        snippet: j['snippet'] as String? ?? '',
      );
}

/// Kanunun tüm kullanıcı katmanı: işaretler + notlar (tek istek).
class ArticleAnnotations {
  final List<HighlightItem> highlights;
  final Map<String, String> notes; // articleNo → not metni
  const ArticleAnnotations({required this.highlights, required this.notes});

  static const empty = ArticleAnnotations(highlights: [], notes: {});

  factory ArticleAnnotations.fromJson(Map<String, dynamic> j) =>
      ArticleAnnotations(
        highlights: (j['highlights'] as List<dynamic>? ?? [])
            .map((e) => HighlightItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        notes: {
          for (final n in (j['notes'] as List<dynamic>? ?? []))
            (n as Map<String, dynamic>)['no'] as String: n['text'] as String,
        },
      );
}

class MevzuatRepository {
  final Dio _dio;
  const MevzuatRepository(this._dio);

  Future<T> _get<T>(String path, T Function(Map<String, dynamic>) parse) async {
    try {
      final r = await _dio.get<Map<String, dynamic>>(path);
      return parse(r.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }

  Future<List<LegislationSummary>> list() => _get(
      '/public/mevzuat',
      (d) => (d['items'] as List<dynamic>)
          .map((e) => LegislationSummary.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<LegislationDetail> detail(String slug) =>
      _get('/public/mevzuat/$slug', LegislationDetail.fromJson);

  Future<ReaderPayload> reader(String slug) =>
      _get('/public/mevzuat/$slug/oku', ReaderPayload.fromJson);

  Future<MevzuatSearchResult> search(String q) => _get(
      '/public/mevzuat/search?q=${Uri.encodeQueryComponent(q)}',
      MevzuatSearchResult.fromJson);

  Future<List<ArticleBookmarkItem>> bookmarks() => _get(
      '/me/article-bookmarks',
      (d) => (d['items'] as List<dynamic>)
          .map((e) => ArticleBookmarkItem.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<void> addBookmark(String lawSlug, String no) async {
    await _dio.post('/me/article-bookmarks', data: {'lawSlug': lawSlug, 'no': no});
  }

  Future<void> removeBookmark(String lawSlug, String no) async {
    await _dio
        .delete('/me/article-bookmarks', data: {'lawSlug': lawSlug, 'no': no});
  }

  Future<List<ReadingProgressItem>> readingProgress() => _get(
      '/me/reading-progress',
      (d) => (d['items'] as List<dynamic>)
          .map((e) => ReadingProgressItem.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<ArticleAnnotations> annotations(String lawSlug) => _get(
      '/me/article-annotations?lawSlug=${Uri.encodeQueryComponent(lawSlug)}',
      ArticleAnnotations.fromJson);

  Future<String?> addHighlight({
    required String lawSlug,
    required String no,
    required int startOffset,
    required int endOffset,
    required String snippet,
  }) async {
    final r = await _dio.post<Map<String, dynamic>>('/me/article-highlights',
        data: {
          'lawSlug': lawSlug,
          'no': no,
          'startOffset': startOffset,
          'endOffset': endOffset,
          'snippet': snippet,
        });
    final data = r.data?['data'] as Map<String, dynamic>?;
    if (data == null || data['ok'] != true) return null;
    return data['id'] as String?;
  }

  Future<void> removeHighlight(String id) async {
    await _dio.delete('/me/article-highlights/$id');
  }

  /// Boş metin notu siler (sunucu sözleşmesi).
  Future<void> putNote(String lawSlug, String no, String text) async {
    await _dio.put('/me/article-notes',
        data: {'lawSlug': lawSlug, 'no': no, 'text': text});
  }

  /// Sessiz kaydetme — okuma akışını hata snack'iyle bölmeyiz.
  Future<void> saveProgress(String lawSlug, String no) async {
    try {
      await _dio
          .post('/me/reading-progress', data: {'lawSlug': lawSlug, 'no': no});
    } catch (_) {/* offline vb. — bir sonraki kayıtta düzelir */}
  }
}

final mevzuatRepositoryProvider =
    Provider<MevzuatRepository>((ref) => MevzuatRepository(ref.watch(dioProvider)));

/// Liste yavaş değişir — 5 dk canlı tut (katalogdaki _cacheFor deseni).
final mevzuatListProvider =
    FutureProvider.autoDispose<List<LegislationSummary>>((ref) {
  final link = ref.keepAlive();
  final timer = Timer(const Duration(minutes: 5), link.close);
  ref.onDispose(timer.cancel);
  return ref.watch(mevzuatRepositoryProvider).list();
});

final legislationDetailProvider =
    FutureProvider.autoDispose.family<LegislationDetail, String>(
        (ref, slug) => ref.watch(mevzuatRepositoryProvider).detail(slug));

final readerProvider = FutureProvider.autoDispose.family<ReaderPayload, String>(
    (ref, slug) {
  final link = ref.keepAlive();
  final timer = Timer(const Duration(minutes: 10), link.close);
  ref.onDispose(timer.cancel);
  return ref.watch(mevzuatRepositoryProvider).reader(slug);
});

final articleBookmarksProvider =
    FutureProvider.autoDispose<List<ArticleBookmarkItem>>(
        (ref) => ref.watch(mevzuatRepositoryProvider).bookmarks());

final readingProgressProvider =
    FutureProvider.autoDispose<List<ReadingProgressItem>>(
        (ref) => ref.watch(mevzuatRepositoryProvider).readingProgress());
