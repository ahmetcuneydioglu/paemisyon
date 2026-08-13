import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// First-launch tanıtımı (5 ekran) yalnız BİR kez gösterilir.
/// Bayrak cihazda kalır: çıkış yapan eski kullanıcı tanıtımı yeniden görmez.
const String kIntroSeenKey = 'intro_seen_v1';

/// main() SharedPreferences'tan okuyup override eder. Varsayılan `true` —
/// override unutulursa bile kullanıcı tanıtıma HAPSOLMAZ (güvenli taraf).
final introSeenProvider = StateProvider<bool>((ref) => true);

/// Tanıtım bitti/atlandı: bellekte anında (router redirect'i görsün),
/// diskte kalıcı olarak işaretle. Çağrı: `persistIntroSeen(ref.read(introSeenProvider.notifier))`.
Future<void> persistIntroSeen(StateController<bool> seen) async {
  seen.state = true;
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(kIntroSeenKey, true);
}
