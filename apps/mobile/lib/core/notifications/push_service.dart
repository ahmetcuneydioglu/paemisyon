import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../firebase_options.dart';
import '../network/dio_client.dart';
import 'notification_service.dart';

/// FCM push (Faz 2). Görevleri:
///  1) Firebase'i başlat (yapılandırma yoksa SESSİZCE vazgeç — stub options).
///  2) Cihaz token'ını al ve girişli kullanıcıya bağla (POST /me/push-token).
///  3) Uygulama ön plandayken gelen push'u yerel bildirim olarak göster.
///  4) Push'a dokunuşu (arka plan + soğuk açılış) derin bağlantıya çevir —
///     yerel bildirimlerle AYNI payload dili (NotificationService.onTap).
class PushService {
  PushService(this._ref);
  final Ref _ref;

  bool _ready = false;
  bool _listenersBound = false;

  Future<bool> _ensureFirebase() async {
    if (_ready) return true;
    try {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform);
      _ready = true;
      return true;
    } catch (_) {
      // Yapılandırma yok (stub) ya da platform hatası — push devre dışı,
      // uygulama normal çalışır.
      return false;
    }
  }

  /// Girişten/açılıştan sonra çağrılır — idempotent. İzin verilmemişse
  /// token alınamaz; bir sonraki açılışta yeniden denenir.
  Future<void> register() async {
    if (!await _ensureFirebase()) return;
    final messaging = FirebaseMessaging.instance;

    _bindListeners(messaging);

    try {
      // İzin akışı Faz 1'dekiyle aynı yerden (davet/ayarlar) yürür; burada
      // yalnız mevcut durumu okuruz — kullanıcıya sürpriz diyalog yok.
      final settings = await messaging.getNotificationSettings();
      if (settings.authorizationStatus == AuthorizationStatus.notDetermined ||
          settings.authorizationStatus == AuthorizationStatus.denied) {
        return;
      }
      final token = await messaging.getToken();
      if (token == null) return;
      await _send(token);
      messaging.onTokenRefresh.listen(_send);
    } catch (_) {
      /* ağ/APNs geçici hatası — sonraki açılışta tekrar */
    }
  }

  Future<void> _send(String token) async {
    try {
      await _ref.read(dioProvider).post<void>('/me/push-token', data: {
        'token': token,
        'platform':
            defaultTargetPlatform == TargetPlatform.android ? 'android' : 'ios',
      });
    } catch (_) {
      /* girişsiz/çevrimdışı — sonraki register denemesinde */
    }
  }

  /// Çıkışta çağrılır: bu cihaza artık push gitmesin (KVKK + doğru hedefleme).
  Future<void> unregister() async {
    if (!_ready) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _ref
            .read(dioProvider)
            .delete<void>('/me/push-token', data: {'token': token});
      }
    } catch (_) {/* en iyi çaba */}
  }

  void _bindListeners(FirebaseMessaging messaging) {
    if (_listenersBound) return;
    _listenersBound = true;

    // Ön planda gelen push: sistem banner'ı iOS'ta gösterilmez — yerel
    // bildirim olarak aynı görünümle sunulur (payload = data.route).
    FirebaseMessaging.onMessage.listen((msg) {
      final n = msg.notification;
      if (n == null) return;
      _ref.read(notificationServiceProvider).showNow(
            title: n.title ?? 'Paemisyon',
            body: n.body ?? '',
            payload: msg.data['route'] as String?,
          );
    });

    // Arka plandayken dokunulan push → derin bağlantı.
    FirebaseMessaging.onMessageOpenedApp.listen((msg) {
      final route = msg.data['route'] as String?;
      if (route != null) NotificationService.onTap?.call(route);
    });

    // Push'a dokunularak SOĞUK açılış.
    messaging.getInitialMessage().then((msg) {
      final route = msg?.data['route'] as String?;
      if (route != null) NotificationService.onTap?.call(route);
    });
  }
}

final pushServiceProvider = Provider<PushService>((ref) => PushService(ref));
