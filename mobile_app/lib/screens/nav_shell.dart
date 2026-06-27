import 'dart:ui';
import 'package:flutter/material.dart';

import '../features/alerts/presentation/screens/home_screen.dart';
import '../features/map/presentation/screens/active_alerts_map_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';

class TabSwitchNotification extends Notification {
  final int index;
  const TabSwitchNotification(this.index);
}

/// Bottom-navigation container hosting the main app sections.
class NavShell extends StatefulWidget {
  const NavShell({super.key});
  static const String route = '/home';

  @override
  State<NavShell> createState() => _NavShellState();
}

class _NavShellState extends State<NavShell> {
  int _index = 0;

  static const _tabs = [
    HomeScreen(),
    ProfileScreen(),
    ActiveAlertsMapScreen(),
  ];

  void _onTap(int i) {
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return NotificationListener<TabSwitchNotification>(
      onNotification: (notification) {
        setState(() => _index = notification.index);
        return true;
      },
      child: Scaffold(
        extendBody: true, // Let content scroll behind the floating bar
        body: IndexedStack(index: _index, children: _tabs),
        bottomNavigationBar: SafeArea(
          child: Container(
            margin: const EdgeInsets.only(left: 24, right: 24, bottom: 16),
            height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: scheme.outlineVariant, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(scheme.brightness == Brightness.light ? 0.04 : 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  color: scheme.surface.withOpacity(scheme.brightness == Brightness.light ? 0.82 : 0.72),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildTabItem(0, Icons.security_outlined, 'Home', scheme),
                      _buildTabItem(1, Icons.person_outline_rounded, 'Profile', scheme),
                      _buildTabItem(2, Icons.map_outlined, 'Radar', scheme),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem(int i, IconData icon, String label, ColorScheme scheme) {
    final selected = _index == i;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _onTap(i),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: selected ? scheme.primary.withOpacity(0.08) : Colors.transparent,
              ),
              child: Icon(
                icon,
                color: selected ? scheme.primary : scheme.onSurface.withOpacity(0.4),
                size: 22,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: selected ? FontWeight.bold : FontWeight.w600,
                color: selected ? scheme.primary : scheme.onSurface.withOpacity(0.4),
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
