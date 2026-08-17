import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../network/dio_client.dart';

/// Yerel bildirim v1 (Doc 28 P1-7): günlük seri hatırlatıcısı.
/// Tamamen CİHAZDA zamanlanır — push/sunucu altyapısı yok. Varsayılan KAPALI
/// (Doc 24 §11: izin, değeri görüldükten sonra istenir); ayarlardan açılır.
/// Hedef o gün dolduysa hatırlatıcı ertesi güne kayar — koç dırdır etmez.
class NotificationService {
  static const _idDaily = 1001; // 1001..1001+_scheduleDays-1 → günlük pencere
  static const _scheduleDays = 5;

  static const _kEnabled = 'daily_reminder_enabled';
  static const _kHour = 'daily_reminder_hour';
  static const _kMinute = 'daily_reminder_minute';

  /// Kullanıcı bu tarihte ELLE kurulum yaptı (aç/saat değiştir) — o gün
  /// otomatik senkron bugünkü bildirimi İPTAL EDEMEZ. Aksi hâlde "saati
  /// kurdum, Bugün'e döndüm, hedefim dolu diye bildirim silindi" tuzağı
  /// oluşuyordu (yaşandı).
  static const _kManualDate = 'daily_reminder_manual_date';

  /// Bildirime dokunuş yönlendiricisi — app kabuğu router'a bağlar.
  /// (Servis navigasyon bilmez; payload üst katmanda rotaya çevrilir.)
  static void Function(String payload)? onTap;

  /// Günün sorusu payload sabiti (derin bağlantı anahtarı).
  static const payloadDailyQuiz = 'daily-quiz';

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    tzdata.initializeTimeZones();
    try {
      final name = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(name));
    } catch (_) {
      // Kimlik çözülemedi → UTC'ye DÜŞME (Türkiye'de bildirim 3 saat geç
      // gelirdi). Cihazın o anki UTC farkından sabit-ofset bölge kur:
      // Etc/GMT adlandırması ters işaretlidir (UTC+3 → Etc/GMT-3).
      try {
        final off = DateTime.now().timeZoneOffset.inHours;
        tz.setLocalLocation(tz.getLocation('Etc/GMT${off >= 0 ? '-' : '+'}${off.abs()}'));
      } catch (_) {/* son çare: UTC */}
    }
    await _plugin.initialize(
      const InitializationSettings(
        // Durum çubuğu ikonu: beyaz Nişangâh P silueti (brand/notify-icon.svg).
        android: AndroidInitializationSettings('@drawable/ic_stat_notify'),
        iOS: DarwinInitializationSettings(
          // İzin, kullanıcı ayarı AÇTIĞINDA istenir (requestPermission) —
          // uygulama açılışında sormayız.
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
      // Uygulama açıkken/arka plandayken dokunuş → derin bağlantı.
      onDidReceiveNotificationResponse: (response) {
        final p = response.payload;
        if (p != null && p.isNotEmpty) onTap?.call(p);
      },
    );
    _initialized = true;
  }

  /// Uygulama bildirime dokunularak SOĞUK açıldıysa payload'ı döner (bir kez).
  Future<String?> launchPayload() async {
    await _ensureInitialized();
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp != true) return null;
    return details?.notificationResponse?.payload;
  }

  /// Sistem izni ister (iOS izin diyaloğu / Android 13+ runtime izni).
  /// Kullanıcı reddederse false — ayar açılmaz.
  Future<bool> requestPermission() async {
    await _ensureInitialized();
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      return await ios.requestPermissions(
              alert: true, badge: true, sound: true) ??
          false;
    }
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      return await android.requestNotificationsPermission() ?? false;
    }
    return false;
  }

  /// Günlük bildirimleri kurar: önümüzdeki [_scheduleDays] gün için ayrı ayrı
  /// zamanlanır — her günün bildirimi o günün "Günün Sorusu" özetini taşır
  /// ([teasers]: "YYYY-MM-DD" → özet; yoksa genel metin). [skipToday] true ise
  /// bugünkü atlanır (hedef dolduysa akşam bildirimi anlamsız). Dokunuş
  /// payload'ı günün sorusuna derin bağlantıdır.
  Future<void> scheduleDaily(
    TimeOfDay time, {
    bool skipToday = false,
    Map<String, String> teasers = const {},
  }) async {
    await _ensureInitialized();
    await cancelDaily(); // eski pencereyi temizle — çift bildirim olmasın
    final now = tz.TZDateTime.now(tz.local);
    for (var i = 0; i < _scheduleDays; i++) {
      final day = now.add(Duration(days: i));
      final at = tz.TZDateTime(
          tz.local, day.year, day.month, day.day, time.hour, time.minute);
      if (at.isBefore(now)) continue; // bugünün saati geçtiyse o gün yok
      if (skipToday && i == 0) continue;
      final key =
          '${at.year}-${at.month.toString().padLeft(2, '0')}-${at.day.toString().padLeft(2, '0')}';
      final teaser = teasers[key];
      await _plugin.zonedSchedule(
        _idDaily + i,
        teaser != null ? 'Günün Sorusu 🎯' : 'Nöbet vakti',
        teaser ??
            'Bugünkü hedefin seni bekliyor — kısa bir tur seriyi korur.',
        at,
        _details,
        // Kesin alarm İZNİ istememek için inexact — dakikası dakikasına şart değil.
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        payload: payloadDailyQuiz,
      );
    }
  }

  static const _details = NotificationDetails(
    android: AndroidNotificationDetails(
      'daily_reminder',
      'Günlük hatırlatıcı',
      channelDescription: 'Günün sorusu ve çalışma serisi hatırlatıcısı',
      importance: Importance.defaultImportance,
    ),
    // iOS: uygulama ÖN PLANDAYKEN de banner göster — kullanıcı saati test
    // ederken uygulama açıksa bildirim "kaybolmasın".
    iOS: DarwinNotificationDetails(
        presentAlert: true, presentBanner: true, presentSound: true),
  );

  Future<void> cancelDaily() async {
    await _ensureInitialized();
    for (var i = 0; i < _scheduleDays; i++) {
      await _plugin.cancel(_idDaily + i);
    }
  }

  /// Kurulu bekleyen bildirim sayısı (ayarlar ekranı doğrulama geri bildirimi).
  Future<int> pendingCount() async {
    await _ensureInitialized();
    return (await _plugin.pendingNotificationRequests()).length;
  }

  /// Anında yerel bildirim — ön planda gelen PUSH mesajını kullanıcıya
  /// göstermek için (Faz 2; iOS ön planda sistem banner'ı basmaz).
  Future<void> showNow({
    required String title,
    required String body,
    String? payload,
  }) async {
    await _ensureInitialized();
    await _plugin.show(1998, title, body, _details, payload: payload);
  }

}

final notificationServiceProvider =
    Provider<NotificationService>((ref) => NotificationService());

/// Hatırlatıcı ayarı (ayarlar ekranı + Bugün senkronu bunun üstünden çalışır).
class ReminderSettings {
  final bool enabled;
  final TimeOfDay time;
  const ReminderSettings({required this.enabled, required this.time});

  static const defaultTime = TimeOfDay(hour: 19, minute: 0);
}

class ReminderSettingsNotifier extends Notifier<ReminderSettings> {
  @override
  ReminderSettings build() {
    _load();
    return const ReminderSettings(
        enabled: false, time: ReminderSettings.defaultTime);
  }

  NotificationService get _service => ref.read(notificationServiceProvider);

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = ReminderSettings(
      enabled: prefs.getBool(NotificationService._kEnabled) ?? false,
      time: TimeOfDay(
        hour: prefs.getInt(NotificationService._kHour) ??
            ReminderSettings.defaultTime.hour,
        minute: prefs.getInt(NotificationService._kMinute) ??
            ReminderSettings.defaultTime.minute,
      ),
    );
  }

  /// Günün Sorusu özetleri (bildirim metinleri) — kamusal uç, en-iyi-çaba:
  /// ağ yoksa boş döner, bildirimler genel metinle yine kurulur.
  Future<Map<String, String>> _fetchTeasers() async {
    try {
      final res = await ref
          .read(dioProvider)
          .get<Map<String, dynamic>>('/public/daily-quiz/teasers',
              queryParameters: {'days': 5},
              options: Options(receiveTimeout: const Duration(seconds: 6)));
      final rows = (res.data?['data'] as List?) ?? const [];
      return {
        for (final r in rows.cast<Map<String, dynamic>>())
          r['date'] as String: r['teaser'] as String,
      };
    } catch (_) {
      return const {};
    }
  }

  static String _todayKey() {
    final n = DateTime.now();
    return '${n.year}-${n.month}-${n.day}';
  }

  Future<void> _markManualToday() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(NotificationService._kManualDate, _todayKey());
  }

  /// Bildirim penceresini (5 gün) tazeler — her uygulama açılışında çağrılır.
  /// [goalMetToday] true ise bugünkü atlanır — AMA kullanıcı bugün elle
  /// kurulum yaptıysa atlanmaz (elle kurulan bildirim silinmez).
  Future<void> refreshQueue({bool goalMetToday = false}) async {
    if (!state.enabled) return;
    final prefs = await SharedPreferences.getInstance();
    final manualToday =
        prefs.getString(NotificationService._kManualDate) == _todayKey();
    final teasers = await _fetchTeasers();
    await _service.scheduleDaily(state.time,
        skipToday: goalMetToday && !manualToday, teasers: teasers);
  }

  /// Açarken izin ister; reddedilirse false döner ve ayar kapalı kalır.
  Future<bool> setEnabled(bool enabled) async {
    if (enabled) {
      final granted = await _service.requestPermission();
      if (!granted) return false;
      await _markManualToday();
      await _service.scheduleDaily(state.time, teasers: await _fetchTeasers());
    } else {
      await _service.cancelDaily();
    }
    state = ReminderSettings(enabled: enabled, time: state.time);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(NotificationService._kEnabled, enabled);
    return true;
  }

  Future<void> setTime(TimeOfDay time) async {
    state = ReminderSettings(enabled: state.enabled, time: time);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(NotificationService._kHour, time.hour);
    await prefs.setInt(NotificationService._kMinute, time.minute);
    if (state.enabled) {
      await _markManualToday();
      await _service.scheduleDaily(time, teasers: await _fetchTeasers());
    }
  }

  /// Bugün ekranından çağrılır: pencereyi tazele; hedef dolduysa bugünkü
  /// bildirim atlanır (koç, işini bitirmiş kullanıcıyı akşam dürtmez).
  Future<void> syncWithGoal({required bool goalMetToday}) =>
      refreshQueue(goalMetToday: goalMetToday);
}

final reminderSettingsProvider =
    NotifierProvider<ReminderSettingsNotifier, ReminderSettings>(
        ReminderSettingsNotifier.new);
