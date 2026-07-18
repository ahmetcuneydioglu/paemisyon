import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/features/me/domain/me_profile.dart';

void main() {
  test('GET /me profil ve çalışma hedeflerini eksiksiz eşler', () {
    final profile = MeProfile.fromJson({
      'id': 'user-1',
      'email': 'aday@example.com',
      'displayName': 'Aday Kullanıcı',
      'avatarUrl': 'https://example.com/avatar.png',
      'emailVerified': true,
      'roles': ['user'],
      'isPremium': true,
      'validUntil': '2027-01-01T00:00:00.000Z',
      'preferredModule': {'id': 'module-1', 'name': 'Misyon Koruma'},
      'dailyGoal': 35,
      'targetExamDate': '2026-12-01',
      'memberSince': '2026-07-18T00:00:00.000Z',
    });

    expect(profile.displayName, 'Aday Kullanıcı');
    expect(profile.emailVerified, isTrue);
    expect(profile.preferredModuleId, 'module-1');
    expect(profile.preferredModuleName, 'Misyon Koruma');
    expect(profile.dailyGoal, 35);
    expect(profile.targetExamDate, DateTime(2026, 12, 1));
    expect(profile.memberSince, isNotNull);
  });

  test('opsiyonel profil alanları yoksa güvenli varsayılanları kullanır', () {
    final profile = MeProfile.fromJson({
      'id': 'user-2',
      'email': 'yeni@example.com',
      'roles': <String>[],
    });

    expect(profile.emailVerified, isFalse);
    expect(profile.dailyGoal, 20);
    expect(profile.preferredModuleId, isNull);
    expect(profile.targetExamDate, isNull);
  });
}
