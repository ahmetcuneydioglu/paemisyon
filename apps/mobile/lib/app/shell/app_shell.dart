import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Uygulama kabuğu (Doc 25 §7, Doc 28 P1-6): 5 bölgeli bottom tab.
/// Bugün · Kütüphane · Denemeler · Performans · Ben — web `navigation.ts`
/// beş bölgesiyle birebir (tek zihinsel model). Her sekme kendi stack'ini
/// korur (IndexedStack); oynatıcılar kabuksuz tam ekran açılır.
class AppShell extends StatelessWidget {
  final StatefulNavigationShell shell;
  const AppShell({super.key, required this.shell});

  static const _destinations = [
    (icon: Icons.today_outlined, active: Icons.today_rounded, label: 'Bugün'),
    (
      icon: Icons.menu_book_outlined,
      active: Icons.menu_book_rounded,
      label: 'Kütüphane'
    ),
    (
      icon: Icons.timer_outlined,
      active: Icons.timer_rounded,
      label: 'Denemeler'
    ),
    (
      icon: Icons.insights_outlined,
      active: Icons.insights_rounded,
      label: 'Performans'
    ),
    (icon: Icons.person_outline_rounded, active: Icons.person_rounded, label: 'Ben'),
  ];

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        // Aynı sekmeye tekrar dokunmak stack'i köke döndürür (yaygın beklenti).
        onDestinationSelected: (index) => shell.goBranch(
          index,
          initialLocation: index == shell.currentIndex,
        ),
        backgroundColor: tokens.surface,
        indicatorColor: tokens.brand.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppTypography.caption.copyWith(
            color: states.contains(WidgetState.selected)
                ? tokens.brand
                : tokens.inkSoft,
            letterSpacing: 0,
          ),
        ),
        destinations: [
          for (final d in _destinations)
            NavigationDestination(
              icon: Icon(d.icon, color: tokens.inkSoft),
              selectedIcon: Icon(d.active, color: tokens.brand),
              label: d.label,
            ),
        ],
      ),
    );
  }
}
