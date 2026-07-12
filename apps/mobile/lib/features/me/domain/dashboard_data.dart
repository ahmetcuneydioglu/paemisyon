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
  final int totalSolved;
  final int totalSessions;
  final int accuracy; // 0-100

  const DashboardData({
    this.displayName,
    required this.onboardingCompleted,
    this.preferredModuleName,
    required this.isPremium,
    required this.currentStreak,
    required this.longestStreak,
    required this.answeredToday,
    this.dailyLimit,
    required this.totalSolved,
    required this.totalSessions,
    required this.accuracy,
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
      totalSolved: stats['totalSolved'] as int? ?? 0,
      totalSessions: stats['totalSessions'] as int? ?? 0,
      accuracy: stats['accuracy'] as int? ?? 0,
    );
  }
}
