/// /me yanıtının domain modeli (Doc 7 §4.2). freezed'e Sprint 2'de taşınacak.
class MeProfile {
  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final bool emailVerified;
  final List<String> roles;
  final bool isPremium;
  final DateTime? validUntil;
  final String? preferredModuleName;
  final String? preferredModuleId;
  final int dailyGoal;
  final DateTime? targetExamDate;
  final DateTime? memberSince;

  const MeProfile({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.emailVerified = false,
    required this.roles,
    required this.isPremium,
    this.validUntil,
    this.preferredModuleName,
    this.preferredModuleId,
    this.dailyGoal = 20,
    this.targetExamDate,
    this.memberSince,
  });

  factory MeProfile.fromJson(Map<String, dynamic> json) {
    return MeProfile(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      emailVerified: json['emailVerified'] as bool? ?? false,
      roles: (json['roles'] as List<dynamic>?)?.cast<String>() ?? const [],
      isPremium: json['isPremium'] as bool? ?? false,
      validUntil: json['validUntil'] != null
          ? DateTime.tryParse(json['validUntil'] as String)
          : null,
      preferredModuleName: (json['preferredModule']
          as Map<String, dynamic>?)?['name'] as String?,
      preferredModuleId:
          (json['preferredModule'] as Map<String, dynamic>?)?['id'] as String?,
      dailyGoal: json['dailyGoal'] as int? ?? 20,
      targetExamDate: json['targetExamDate'] != null
          ? DateTime.tryParse(json['targetExamDate'] as String)
          : null,
      memberSince: json['memberSince'] != null
          ? DateTime.tryParse(json['memberSince'] as String)
          : null,
    );
  }
}
