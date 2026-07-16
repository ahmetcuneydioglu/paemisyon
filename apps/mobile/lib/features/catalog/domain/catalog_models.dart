/// Katalog domain modelleri (Doc 7 §4.3). freezed'e sonra taşınabilir.
class ModuleItem {
  final String id;
  final String key;
  final String name;
  final String? description;

  /// Kart bağlamı (Doc 20 hedef seçimi): yayında soru sayısı,
  /// kullanıcının çözümü/doğruluğu, kayıtlı hedef işareti.
  final int questionCount;
  final int solvedCount;
  final int? accuracy; // % — hiç çözüm yoksa null
  final bool isPreferred;

  const ModuleItem({
    required this.id,
    required this.key,
    required this.name,
    this.description,
    this.questionCount = 0,
    this.solvedCount = 0,
    this.accuracy,
    this.isPreferred = false,
  });

  factory ModuleItem.fromJson(Map<String, dynamic> j) => ModuleItem(
        id: j['id'] as String,
        key: j['key'] as String,
        name: j['name'] as String,
        description: j['description'] as String?,
        questionCount: j['questionCount'] as int? ?? 0,
        solvedCount: j['solvedCount'] as int? ?? 0,
        accuracy: j['accuracy'] as int?,
        isPreferred: j['isPreferred'] as bool? ?? false,
      );
}

class CourseItem {
  final String id;
  final String name;

  /// Müfredat bağlamı (Doc 21) — dersin sınavda göründüğü bölüm başlığı ve
  /// ağırlığı. Eski API'de yok; null olabilir.
  final String? sectionName;
  final int? weightPercent;

  const CourseItem({
    required this.id,
    required this.name,
    this.sectionName,
    this.weightPercent,
  });

  factory CourseItem.fromJson(Map<String, dynamic> j) => CourseItem(
        id: j['id'] as String,
        name: j['name'] as String,
        sectionName: j['sectionName'] as String?,
        weightPercent: j['weightPercent'] as int?,
      );
}

class TopicItem {
  final String id;
  final String name;
  final bool isPremium;

  /// Alt konular (Doc 21 ağaç). Eski API'de yok; boş olabilir.
  final List<TopicItem> children;

  /// Kişisel katman (Doc 25 wireframe 05): 0-100; hiç çözüm yoksa null.
  final int? mastery;
  final int solvedCount;

  const TopicItem({
    required this.id,
    required this.name,
    required this.isPremium,
    this.children = const [],
    this.mastery,
    this.solvedCount = 0,
  });

  factory TopicItem.fromJson(Map<String, dynamic> j) => TopicItem(
        id: j['id'] as String,
        name: j['name'] as String,
        isPremium: j['isPremium'] as bool? ?? false,
        children: (j['children'] as List<dynamic>? ?? const [])
            .map((e) => TopicItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        mastery: j['mastery'] as int?,
        solvedCount: j['solvedCount'] as int? ?? 0,
      );
}

/// Ders öğrenme merkezi yanıtı: konu ağacı + kişisel özet (Doc 25 wireframe 05).
class CourseTopics {
  final List<TopicItem> topics;
  final int solvedCount;

  /// 0-100; ders hiç çalışılmadıysa null.
  final int? mastery;
  final int unresolvedWrongCount;

  const CourseTopics({
    required this.topics,
    required this.solvedCount,
    required this.mastery,
    required this.unresolvedWrongCount,
  });

  factory CourseTopics.fromJson(Map<String, dynamic> j) {
    final summary = (j['summary'] as Map<String, dynamic>?) ?? const {};
    return CourseTopics(
      topics: (j['topics'] as List<dynamic>? ?? const [])
          .map((e) => TopicItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      solvedCount: summary['solvedCount'] as int? ?? 0,
      mastery: summary['mastery'] as int?,
      unresolvedWrongCount: summary['unresolvedWrongCount'] as int? ?? 0,
    );
  }
}
