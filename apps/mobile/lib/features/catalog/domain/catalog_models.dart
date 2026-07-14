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

  const CourseItem({required this.id, required this.name});

  factory CourseItem.fromJson(Map<String, dynamic> j) =>
      CourseItem(id: j['id'] as String, name: j['name'] as String);
}

class TopicItem {
  final String id;
  final String name;
  final bool isPremium;

  const TopicItem(
      {required this.id, required this.name, required this.isPremium});

  factory TopicItem.fromJson(Map<String, dynamic> j) => TopicItem(
        id: j['id'] as String,
        name: j['name'] as String,
        isPremium: j['isPremium'] as bool? ?? false,
      );
}
