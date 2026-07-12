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

  /// Supabase proje URL'i (public).
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://yanbnekypmtkcnpirpfs.supabase.co',
  );

  /// Supabase anon/publishable anahtarı (public — istemcide bulunması normaldir).
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbmJuZWt5cG10a2NucGlycGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3OTU1MDQsImV4cCI6MjA5OTM3MTUwNH0.XqXvd87qJ9Wn_EpT2vYE1-iUCsMCa2DrfOEg8yaE4Q8',
  );
}
