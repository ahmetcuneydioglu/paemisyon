import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Çalışma modu ilerlemesi — CİHAZDA saklanır (7 Eyl 2026 kullanıcı bildirimi).
///
/// Çalışma modu sunucuda oturum açmaz (değerlendirme istemcide), bu yüzden
/// ekrandan çıkınca ilerleme kayboluyordu: 5 soru çözüp geri dönen aday
/// sıfırdan başlıyordu. 100 soruluk bir sette bu kabul edilemez.
///
/// Neden sunucuda değil de cihazda: bu bir ÖLÇÜM değil, kişisel bir okuma
/// durumu. Sunucuya yazmak oturum açmayı ve kota/puan sorularını geri
/// getirirdi; ölçüm isteyen "Sınav gibi çöz"e gider. Yanlışlar zaten
/// sunucudaki çalışma defterine ayrıca yazılıyor.
class CalismaKaydi {
  static const _onEk = 'cikmis_calisma_v1_';

  static String anahtar(String slug) => '$_onEk$slug';

  /// {sıra: şık harfi} → saklanabilir metin. Anahtarlar JSON'da metin olur.
  static String kodla(Map<int, String> secim) =>
      jsonEncode(secim.map((k, v) => MapEntry(k.toString(), v)));

  /// Bozuk/eski kayıt uygulamayı çökertmez — boş harita döner.
  static Map<int, String> coz(String? ham) {
    if (ham == null || ham.isEmpty) return {};
    try {
      final j = jsonDecode(ham);
      if (j is! Map) return {};
      final out = <int, String>{};
      j.forEach((k, v) {
        final sira = int.tryParse(k.toString());
        if (sira != null && v is String && v.isNotEmpty) out[sira] = v;
      });
      return out;
    } catch (_) {
      return {};
    }
  }

  static Future<Map<int, String>> oku(String slug) async {
    final prefs = await SharedPreferences.getInstance();
    return coz(prefs.getString(anahtar(slug)));
  }

  static Future<void> yaz(String slug, Map<int, String> secim) async {
    final prefs = await SharedPreferences.getInstance();
    if (secim.isEmpty) {
      await prefs.remove(anahtar(slug));
      return;
    }
    await prefs.setString(anahtar(slug), kodla(secim));
  }

  static Future<void> sil(String slug) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(anahtar(slug));
  }
}

/// Dönem ekranındaki "Çalışma modu" kartının alt satırı için ilerleme sayısı.
final calismaIlerlemeProvider =
    FutureProvider.autoDispose.family<int, String>((ref, slug) async {
  final kayit = await CalismaKaydi.oku(slug);
  return kayit.length;
});
