/// Uygulama yapılandırması. Secret İÇERMEZ (Doc 8 ilkesi).
/// API adresi derleme-zamanı --dart-define ile geçilebilir:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000/api/v1
class AppConfig {
  const AppConfig._();

  /// Backend API kök adresi. Varsayılan: yerel geliştirme (iOS simülatör → localhost).
  /// Fiziksel cihazda makinenin LAN IP'sini --dart-define ile ver.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
}
