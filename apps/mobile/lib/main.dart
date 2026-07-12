import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/config/app_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase'i başlat (YALNIZCA kimlik için — Doc 8).
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    // Legacy anon (JWT) anahtarı bununla çalışır; yeni publishableKey farklı formattadır.
    // ignore: deprecated_member_use
    anonKey: AppConfig.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: PaemisyonApp()));
}
