// Kişisel Koç modelleri (Doc 19 §3) — GET /me/coach sözleşmesinin Dart hali.
// İLKE: istemci hiçbir kural bilmez; kartları olduğu gibi çizer, type+meta
// yalnız dokunuş yönlendirmesi için kullanılır.

class CoachCta {
  final String label;
  final String route;
  const CoachCta({required this.label, required this.route});

  factory CoachCta.fromJson(Map<String, dynamic> j) =>
      CoachCta(label: j['label'] as String, route: j['route'] as String);
}

class CoachCard {
  final String type;
  final int priority;
  final String title;
  final String? body;
  final CoachCta? cta;
  final Map<String, dynamic> meta;

  const CoachCard({
    required this.type,
    required this.priority,
    required this.title,
    this.body,
    this.cta,
    this.meta = const {},
  });

  factory CoachCard.fromJson(Map<String, dynamic> j) => CoachCard(
        type: j['type'] as String,
        priority: j['priority'] as int,
        title: j['title'] as String,
        body: j['body'] as String?,
        cta: j['cta'] != null
            ? CoachCta.fromJson(j['cta'] as Map<String, dynamic>)
            : null,
        meta: (j['meta'] as Map<String, dynamic>?) ?? const {},
      );
}

class NextBadge {
  final String key;
  final String name;
  final int progress;
  final int target;
  const NextBadge({
    required this.key,
    required this.name,
    required this.progress,
    required this.target,
  });

  factory NextBadge.fromJson(Map<String, dynamic> j) => NextBadge(
        key: j['key'] as String,
        name: j['name'] as String,
        progress: j['progress'] as int,
        target: j['target'] as int,
      );
}

class CoachBrief {
  final String? displayName;
  final bool isPremium;
  final bool onboardingCompleted;
  final String? preferredModuleName;

  final int goal;
  final int answered;
  final int streakCurrent;
  final int streakLongest;
  final bool streakAtRisk;

  final CoachCta primaryAction;
  final String primaryActionType;
  final List<CoachCard> cards;

  final int totalSolved;
  final int accuracy;
  final int totalSessions;

  final NextBadge? nextBadge;
  final int weeklyActiveDays;
  final int weeklyGoalDays;

  const CoachBrief({
    required this.displayName,
    required this.isPremium,
    required this.onboardingCompleted,
    required this.preferredModuleName,
    required this.goal,
    required this.answered,
    required this.streakCurrent,
    required this.streakLongest,
    required this.streakAtRisk,
    required this.primaryAction,
    required this.primaryActionType,
    required this.cards,
    required this.totalSolved,
    required this.accuracy,
    required this.totalSessions,
    required this.nextBadge,
    required this.weeklyActiveDays,
    required this.weeklyGoalDays,
  });

  factory CoachBrief.fromJson(Map<String, dynamic> j) {
    final greeting = j['greeting'] as Map<String, dynamic>;
    final today = j['today'] as Map<String, dynamic>;
    final streak = today['streak'] as Map<String, dynamic>;
    final primary = j['primaryAction'] as Map<String, dynamic>;
    final stats = j['stats'] as Map<String, dynamic>;
    final gami = j['gamification'] as Map<String, dynamic>;
    final weekly = gami['weekly'] as Map<String, dynamic>;
    return CoachBrief(
      displayName: greeting['displayName'] as String?,
      isPremium: greeting['isPremium'] as bool? ?? false,
      onboardingCompleted: greeting['onboardingCompleted'] as bool? ?? true,
      preferredModuleName: greeting['preferredModuleName'] as String?,
      goal: today['goal'] as int,
      answered: today['answered'] as int,
      streakCurrent: streak['current'] as int? ?? 0,
      streakLongest: streak['longest'] as int? ?? 0,
      streakAtRisk: streak['atRisk'] as bool? ?? false,
      primaryAction: CoachCta.fromJson(primary),
      primaryActionType: primary['type'] as String? ?? 'default',
      cards: (j['cards'] as List<dynamic>? ?? const [])
          .map((e) => CoachCard.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalSolved: stats['totalSolved'] as int? ?? 0,
      accuracy: stats['accuracy'] as int? ?? 0,
      totalSessions: stats['totalSessions'] as int? ?? 0,
      nextBadge: gami['nextBadge'] != null
          ? NextBadge.fromJson(gami['nextBadge'] as Map<String, dynamic>)
          : null,
      weeklyActiveDays: weekly['activeDays'] as int? ?? 0,
      weeklyGoalDays: weekly['goalDays'] as int? ?? 5,
    );
  }
}
