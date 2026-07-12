/// Katalog domain modelleri (Doc 7 §4.3). freezed'e sonra taşınabilir.
class ModuleItem {
  final String id;
  final String key;
  final String name;
  final String? description;

  const ModuleItem(
      {required this.id,
      required this.key,
      required this.name,
      this.description});

  factory ModuleItem.fromJson(Map<String, dynamic> j) => ModuleItem(
        id: j['id'] as String,
        key: j['key'] as String,
        name: j['name'] as String,
        description: j['description'] as String?,
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
