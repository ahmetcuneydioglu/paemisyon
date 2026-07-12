/// Uygulama yapılandırması.
/// Not: Supabase URL ve ANON anahtarı PUBLIC'tir (istemciye gömülmek için tasarlanmış,
/// RLS ile korunur) — commit'lenmesi Supabase modeline uygun. GİZLİ olan service_role
/// anahtarı BURADA ASLA bulunmaz; ona yalnızca backend erişir (Doc 8).
class AppConfig {
  const AppConfig._();

  /// Backend API kök adresi. Fiziksel cihazda LAN IP'sini --dart-define ile ver.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );

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
