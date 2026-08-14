import 'package:firebase_core/firebase_core.dart';

/// STUB — gerçek dosya `flutterfire configure` ile üretilir ve BUNUN ÜZERİNE
/// yazılır (Firebase projesi kurulunca). Bu stub sayesinde uygulama Firebase
/// yapılandırması olmadan da derlenir; PushService init'te hatayı yakalayıp
/// push'u sessizce devre dışı bırakır.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    throw UnsupportedError(
      'Firebase yapılandırılmadı — `flutterfire configure` çalıştırın '
      '(bkz. bildirim Faz 2 kurulum adımları).',
    );
  }
}
