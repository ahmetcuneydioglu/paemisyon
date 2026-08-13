import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/config/app_config.dart';
import 'features/intro/intro_prefs.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase'i başlat (YALNIZCA kimlik için — Doc 8).
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    // Legacy anon (JWT) anahtarı bununla çalışır; yeni publishableKey farklı formattadır.
    // ignore: deprecated_member_use
    anonKey: AppConfig.supabaseAnonKey,
  );

  // First-launch tanıtımı görüldü mü? Router redirect'i senkron okuyabilsin
  // diye açılışta bir kez okunur (SharedPreferences zaten bellekte tutar).
  final prefs = await SharedPreferences.getInstance();
  final introSeen = prefs.getBool(kIntroSeenKey) ?? false;

  runApp(ProviderScope(
    overrides: [introSeenProvider.overrideWith((ref) => introSeen)],
    child: const PaemisyonApp(),
  ));
}
