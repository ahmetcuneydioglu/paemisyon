/// Backend health yanıtının domain modeli.
/// Not: Model katmanı Sprint 2'de freezed'e taşınacak; skeleton'da düz sınıf.
class HealthStatus {
  final String status;
  final String service;
  final String version;
  final String database;

  const HealthStatus({
    required this.status,
    required this.service,
    required this.version,
    required this.database,
  });

  bool get isDatabaseUp => database == 'up';

  factory HealthStatus.fromJson(Map<String, dynamic> json) {
    return HealthStatus(
      status: json['status'] as String? ?? 'unknown',
      service: json['service'] as String? ?? '-',
      version: json['version'] as String? ?? '-',
      database: json['database'] as String? ?? 'down',
    );
  }
}
