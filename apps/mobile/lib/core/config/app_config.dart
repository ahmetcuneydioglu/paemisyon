/// Uygulama yapılandırması.
/// Not: Supabase URL ve ANON anahtarı PUBLIC'tir (istemciye gömülmek için tasarlanmış,
/// RLS ile korunur) — commit'lenmesi Supabase modeline uygun. GİZLİ olan service_role
/// anahtarı BURADA ASLA bulunmaz; ona yalnızca backend erişir (Doc 8).
class AppConfig {
  const AppConfig._();

  /// Backend API kök adresi.
  /// Varsayılan: Mac'in Bonjour (.local) adı — IP değişse de SABİT kalır, hem
  /// fiziksel cihazda hem simülatörde çalışır (aynı Wi-Fi'da). Böylece geliştirmede
  /// --dart-define gerekmez. Prod build'de gerçek URL --dart-define ile verilir.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://AHMETCND-MacBook-Pro.local:3000/api/v1',
  );

  /// E-posta doğrulama / şifre yenileme bağlantılarının açıldığı web kökü.
  static const String webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://paemisyon.com',
  );

  /// Google OAuth iOS client ID (public — Doc 28 P0-①). Boşsa Google butonu
  /// gizlenir. Google Cloud Console → iOS OAuth client'tan alınır ve
  /// --dart-define=GOOGLE_IOS_CLIENT_ID=... ile verilir.
  static const String googleIosClientId =
      String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');

  /// Google OAuth WEB client ID — Supabase idToken audience'ı bunu bekler
  /// (Supabase dashboard'daki Google provider'da kayıtlı web client).
  static const String googleWebClientId =
      String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

  static bool get hasGoogleSignIn =>
      googleIosClientId.isNotEmpty && googleWebClientId.isNotEmpty;

  /// Supabase proje URL'i (public). Frankfurt (eu-central-1) projesi.
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://yhkiuzevyqdqtofrmroj.supabase.co',
  );

  /// Supabase anon/publishable anahtarı (public — istemcide bulunması normaldir).
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloa2l1emV2eXFkcXRvZnJtcm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjU0OTAsImV4cCI6MjA5OTQ0MTQ5MH0.Znv7XODkWl3cA2hcLce2tY5nlOfBp6WEWevRdDbkRDw',
  );
}
