import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/features/catalog/domain/catalog_models.dart';

void main() {
  test('kilit kararı sunucudan gelir: premium konu, premium kullanıcıda açık', () {
    final t = TopicItem.fromJson({
      'id': 't1',
      'name': 'Yasama',
      'isPremium': true,
      'locked': false,
    });
    expect(t.isPremium, isTrue);
    expect(t.locked, isFalse);
  });

  test('locked alanı yoksa kilit yok (istemci isPremium\'dan kural türetmez)',
      () {
    final t = TopicItem.fromJson({'id': 't1', 'name': 'Yasama', 'isPremium': true});
    expect(t.locked, isFalse);
  });
}
