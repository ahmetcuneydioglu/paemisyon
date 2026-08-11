import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Yerel bildirim v1 (Doc 28 P1-7): günlük seri hatırlatıcısı.
/// Tamamen CİHAZDA zamanlanır — push/sunucu altyapısı yok. Varsayılan KAPALI
/// (Doc 24 §11: izin, değeri görüldükten sonra istenir); ayarlardan açılır.
/// Hedef o gün dolduysa hatırlatıcı ertesi güne kayar — koç dırdır etmez.
class NotificationService {
  static const _idDaily = 1001;

  static const _kEnabled = 'daily_reminder_enabled';
  static const _kHour = 'daily_reminder_hour';
  static const _kMinute = 'daily_reminder_minute';

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
      // Bilinmeyen kimlik → UTC'de kalır; hatırlatıcı yine kurulur.
    }
    await _plugin.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(
          // İzin, kullanıcı ayarı AÇTIĞINDA istenir (requestPermission) —
          // uygulama açılışında sormayız.
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
    );
    _initialized = true;
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

  /// Günlük hatırlatıcıyı kurar. [skipToday] true ise ilk bildirim yarına
  /// atılır (bugünkü hedef zaten dolduysa akşam bildirimi anlamsız).
  Future<void> scheduleDaily(TimeOfDay time, {bool skipToday = false}) async {
    await _ensureInitialized();
    final now = tz.TZDateTime.now(tz.local);
    var first = tz.TZDateTime(
        tz.local, now.year, now.month, now.day, time.hour, time.minute);
    if (first.isBefore(now) || (skipToday && first.day == now.day)) {
      first = first.add(const Duration(days: 1));
    }
    await _plugin.zonedSchedule(
      _idDaily,
      'Nöbet vakti',
      'Bugünkü hedefin seni bekliyor — kısa bir seans seriyi korur.',
      first,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'daily_reminder',
          'Günlük hatırlatıcı',
          channelDescription: 'Günlük çalışma serisi hatırlatıcısı',
          importance: Importance.defaultImportance,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      // Kesin alarm İZNİ istememek için inexact — dakikası dakikasına şart değil.
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time, // her gün tekrarla
    );
  }

  Future<void> cancelDaily() async {
    await _ensureInitialized();
    await _plugin.cancel(_idDaily);
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

  /// Açarken izin ister; reddedilirse false döner ve ayar kapalı kalır.
  Future<bool> setEnabled(bool enabled) async {
    if (enabled) {
      final granted = await _service.requestPermission();
      if (!granted) return false;
      await _service.scheduleDaily(state.time);
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
    if (state.enabled) await _service.scheduleDaily(time);
  }

  /// Bugün ekranından çağrılır: hedef dolduysa bugünkü bildirimi yarına kaydır.
  Future<void> syncWithGoal({required bool goalMetToday}) async {
    if (!state.enabled || !goalMetToday) return;
    await _service.scheduleDaily(state.time, skipToday: true);
  }
}

final reminderSettingsProvider =
    NotifierProvider<ReminderSettingsNotifier, ReminderSettings>(
        ReminderSettingsNotifier.new);
