/// GET /me/dashboard yanıtı (Doc 12 §4) — home ekranının tek veri kaynağı.
class DashboardData {
  final String? displayName;
  final bool onboardingCompleted;
  final String? preferredModuleName;
  final bool isPremium;
  final int currentStreak;
  final int longestStreak;
  final int answeredToday;

  /// null = sınırsız (premium).
  final int? dailyLimit;

  /// Günün sorusu bugün çözüldü mü (Home kartı).
  final bool dailyPlayedToday;
  final int totalSolved;
  final int totalSessions;
  final int accuracy; // 0-100

  /// Kişisel deneme hakkı (Doc 46). Ücretsiz planda günde sınırlı sayıda
  /// açılır ve soru tavanı düşüktür; premium'da sınırsızdır.
  final PersonalExamAllowance personalExam;

  const DashboardData({
    this.displayName,
    required this.onboardingCompleted,
    this.preferredModuleName,
    required this.isPremium,
    required this.currentStreak,
    required this.longestStreak,
    required this.answeredToday,
    this.dailyLimit,
    this.dailyPlayedToday = false,
    required this.totalSolved,
    required this.totalSessions,
    required this.accuracy,
    this.personalExam = const PersonalExamAllowance.sinirsiz(),
  });

  factory DashboardData.fromJson(Map<String, dynamic> j) {
    final streak = j['streak'] as Map<String, dynamic>? ?? const {};
    final today = j['today'] as Map<String, dynamic>? ?? const {};
    final stats = j['stats'] as Map<String, dynamic>? ?? const {};
    return DashboardData(
      displayName: j['displayName'] as String?,
      onboardingCompleted: j['onboardingCompleted'] as bool? ?? true,
      preferredModuleName:
          (j['preferredModule'] as Map<String, dynamic>?)?['name'] as String?,
      isPremium: j['isPremium'] as bool? ?? false,
      currentStreak: streak['current'] as int? ?? 0,
      longestStreak: streak['longest'] as int? ?? 0,
      answeredToday: today['answered'] as int? ?? 0,
      dailyLimit: today['dailyLimit'] as int?,
      dailyPlayedToday:
          (j['daily'] as Map<String, dynamic>?)?['playedToday'] as bool? ?? false,
      totalSolved: stats['totalSolved'] as int? ?? 0,
      totalSessions: stats['totalSessions'] as int? ?? 0,
      accuracy: stats['accuracy'] as int? ?? 0,
      // Alan yoksa (eski sunucu) kısıtsız varsayılır: arayüz kendi başına
      // kural uydurmaz, sunucu zaten asıl karar noktasıdır.
      personalExam: PersonalExamAllowance.fromJson(
        j['personalExam'] as Map<String, dynamic>?,
      ),
    );
  }
}

/// Kişisel deneme hakkı — /me/dashboard `personalExam` bloğu (Doc 46).
class PersonalExamAllowance {
  /// Bugün BAŞLATILAN kişisel deneme sayısı (tamamlanan değil — sunucudaki
  /// kapı da aynı ölçüyü kullanır, ekran farklı bir sayı göstermesin).
  final int usedToday;

  /// Günde kaç hak; null = sınırsız (premium).
  final int? dailyAllowance;

  /// Bir denemenin soru tavanı.
  final int maxQuestions;

  const PersonalExamAllowance({
    required this.usedToday,
    required this.dailyAllowance,
    required this.maxQuestions,
  });

  const PersonalExamAllowance.sinirsiz()
      : usedToday = 0,
        dailyAllowance = null,
        maxQuestions = 120;

  bool get sinirsiz => dailyAllowance == null;

  /// Bugün kalan hak; sınırsızsa null.
  int? get kalan =>
      dailyAllowance == null ? null : (dailyAllowance! - usedToday).clamp(0, 999);

  bool get hakkiBitti => kalan == 0;

  factory PersonalExamAllowance.fromJson(Map<String, dynamic>? j) {
    if (j == null) return const PersonalExamAllowance.sinirsiz();
    return PersonalExamAllowance(
      usedToday: j['usedToday'] as int? ?? 0,
      dailyAllowance: j['dailyAllowance'] as int?,
      maxQuestions: j['maxQuestions'] as int? ?? 120,
    );
  }
}
