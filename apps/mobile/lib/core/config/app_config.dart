/// Uygulama yapılandırması.
/// Not: Supabase URL ve ANON anahtarı PUBLIC'tir (istemciye gömülmek için tasarlanmış,
/// RLS ile korunur) — commit'lenmesi Supabase modeline uygun. GİZLİ olan service_role
/// anahtarı BURADA ASLA bulunmaz; ona yalnızca backend erişir (Doc 8).
class AppConfig {
  const AppConfig._();

  /// Backend API kök adresi.
  ///
  /// Varsayılan ÜRETİMDİR: mağaza/TestFlight derlemesinde `--dart-define`
  /// unutulursa uygulama sessizce ölmesin. (Eskiden varsayılan geliştirici
  /// Mac'inin Bonjour adıydı; bayrağı unutulan bir sürüm kullanıcıda hiç
  /// açılmazdı.) Geliştirmede yerel sunucu için bayrağı AÇIKÇA ver:
  ///   flutter run --dart-define=API_BASE_URL=http://<mac>.local:3000/api/v1
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.paemisyon.com/api/v1',
  );

  /// E-posta doğrulama / şifre yenileme bağlantılarının açıldığı web kökü.
  static const String webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://paemisyon.com',
  );

  /// Google OAuth iOS client ID (PUBLIC kimlik — Supabase anon key gibi
  /// gömülebilir; Info.plist'teki URL şemasıyla eşleşir). dart-define ile
  /// üzerine yazılabilir.
  static const String googleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue:
        '685808602334-vdcfaaajqo8f50po7son57ceginfmgvj.apps.googleusercontent.com',
  );

  /// Google OAuth WEB client ID (PUBLIC) — Supabase idToken audience'ı bunu
  /// bekler; dashboard'daki Google provider'la birebir aynı değer.
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '685808602334-mt9otaollpn2seef6q6q30gsk1th1gpa.apps.googleusercontent.com',
  );

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
