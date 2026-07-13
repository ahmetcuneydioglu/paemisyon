/// Domain katmanı hata tipleri. Dış dünya exception'ları buraya eşlenir (Doc 3 §5.4).
/// Kullanıcıya gösterilen mesajlar Türkçe ve moral bozmayan.
sealed class Failure {
  final String message;
  const Failure(this.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'İnternet bağlantını kontrol et.']);
}

class ServerFailure extends Failure {
  const ServerFailure([super.message = 'Bir şeyler ters gitti, tekrar dene.']);
}

/// Freemium günlük soru hakkı doldu (backend: DAILY_LIMIT_REACHED).
/// İstemci bunu yakalayıp paywall'a yönlendirir (Doc 15).
class DailyLimitFailure extends Failure {
  const DailyLimitFailure([super.message = 'Günlük ücretsiz soru hakkın doldu.']);
}

/// Deneme sınavı süresi doldu (backend: EXAM_TIME_OVER) → oturum otomatik biter.
class ExamTimeOverFailure extends Failure {
  const ExamTimeOverFailure([super.message = 'Sınav süresi doldu.']);
}

class UnknownFailure extends Failure {
  const UnknownFailure([super.message = 'Beklenmeyen bir hata oluştu.']);
}
