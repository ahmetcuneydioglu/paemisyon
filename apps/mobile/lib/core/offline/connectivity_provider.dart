import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Çevrimiçi/çevrimdışı durumu (Doc 3 §5.1). Ağ arayüzü durumunu izler.
/// Not: gerçek internet erişimini değil arayüzü kontrol eder; MVP için yeterli.
final connectivityProvider = StreamProvider<bool>((ref) async* {
  final conn = Connectivity();
  bool online(List<ConnectivityResult> r) =>
      r.isNotEmpty && !r.every((e) => e == ConnectivityResult.none);

  yield online(await conn.checkConnectivity());
  await for (final r in conn.onConnectivityChanged) {
    yield online(r);
  }
});

/// Anlık boolean (widget'lar için kısayol; bilinmiyorsa true varsayar).
final isOnlineProvider = Provider<bool>((ref) {
  return ref.watch(connectivityProvider).maybeWhen(data: (v) => v, orElse: () => true);
});
