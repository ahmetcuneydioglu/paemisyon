/// /me yanıtının domain modeli (Doc 7 §4.2). freezed'e Sprint 2'de taşınacak.
class MeProfile {
  final String id;
  final String email;
  final String? displayName;
  final List<String> roles;
  final bool isPremium;
  final DateTime? validUntil;
  final String? preferredModuleName;

  const MeProfile({
    required this.id,
    required this.email,
    this.displayName,
    required this.roles,
    required this.isPremium,
    this.validUntil,
    this.preferredModuleName,
  });

  factory MeProfile.fromJson(Map<String, dynamic> json) {
    return MeProfile(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String?,
      roles: (json['roles'] as List<dynamic>?)?.cast<String>() ?? const [],
      isPremium: json['isPremium'] as bool? ?? false,
      validUntil: json['validUntil'] != null
          ? DateTime.tryParse(json['validUntil'] as String)
          : null,
      preferredModuleName:
          (json['preferredModule'] as Map<String, dynamic>?)?['name'] as String?,
    );
  }
}
