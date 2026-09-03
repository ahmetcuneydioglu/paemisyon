import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/auth/data/auth_repository.dart';
import 'package:paemisyon/features/auth/presentation/register_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Kayıt ekranı e-posta denetimi (Supabase 3 Eylül 2026 bounce uyarısı).
/// En kritik iddia: teslim edilemez adreste signUp ÇAĞRILMAZ — yani Supabase
/// o adrese doğrulama maili atmaz ve bounce üretmez.
class _SahteAuthRepository implements AuthRepository {
  final List<String> kaydedilenler = [];

  @override
  Future<AuthResponse> signUp(
      String email, String password, String displayName) async {
    kaydedilenler.add(email);
    return AuthResponse();
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late _SahteAuthRepository repo;

  Widget sar() {
    repo = _SahteAuthRepository();
    return ProviderScope(
      overrides: [authRepositoryProvider.overrideWithValue(repo)],
      child: MaterialApp(theme: AppTheme.light, home: const RegisterScreen()),
    );
  }

  Finder alan(String etiket) => find.widgetWithText(TextField, etiket);

  testWidgets('yazım hatasında öneri çıkar, düzelt adresi değiştirir',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(sar());
    await tester.enterText(alan('E-posta'), 'ahmet@gmial.com');
    await tester.pump();

    expect(find.textContaining('gmail.com" mi demek istedin'), findsOneWidget);

    await tester.tap(find.text('ahmet@gmail.com olarak düzelt'));
    await tester.pump();

    // Adres düzeldi → uyarı da kalktı.
    expect(find.textContaining('demek istedin'), findsNothing);
    expect(
      tester.widget<TextField>(alan('E-posta')).controller!.text,
      'ahmet@gmail.com',
    );
  });

  testWidgets('"Adresim doğru" uyarıyı kapatır, kayıt yolunu açık bırakır',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(sar());
    await tester.enterText(alan('E-posta'), 'ahmet@gmial.com');
    await tester.pump();

    await tester.tap(find.text('Adresim doğru'));
    await tester.pump();
    expect(find.textContaining('demek istedin'), findsNothing);
  });

  testWidgets('teslim edilemez adreste Supabase ÇAĞRILMAZ', (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(sar());
    await tester.enterText(alan('Ad soyad'), 'Deneme Kullanıcı');
    await tester.enterText(alan('E-posta'), 'biri@paemisyon.test');
    await tester.enterText(
        alan('Şifre (en az 8 karakter)'), 'cokGuvenliSifre123');
    await tester.pump();

    await tester.tap(find.text('Kayıt ol'));
    await tester.pump();

    expect(find.textContaining('adresine e-posta ulaşamaz'), findsOneWidget);
    expect(repo.kaydedilenler, isEmpty);
  });
}
