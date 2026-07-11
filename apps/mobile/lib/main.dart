import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

void main() {
  // ProviderScope = Riverpod kökü (DI + state — Doc 3).
  runApp(const ProviderScope(child: PaemisyonApp()));
}
