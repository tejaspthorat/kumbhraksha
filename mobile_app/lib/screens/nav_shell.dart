import 'package:flutter/material.dart';

import '../features/alerts/presentation/screens/home_screen.dart';
import '../features/map/presentation/screens/map_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/report/presentation/screens/report_missing_screen.dart';

/// Bottom-navigation container hosting the main app sections.
class NavShell extends StatefulWidget {
  const NavShell({super.key});
  static const String route = '/home';

  @override
  State<NavShell> createState() => _NavShellState();
}

class _NavShellState extends State<NavShell> {
  int _index = 0;

  static const _tabs = [HomeScreen(), MapScreen(), ProfileScreen()];

  void _onTap(int i) {
    // Center "Report" item opens the full-screen form instead of a tab.
    if (i == 1) {
      Navigator.of(context).pushNamed(ReportMissingScreen.route);
      return;
    }
    setState(() => _index = i > 1 ? i - 1 : i);
  }

  int get _barIndex => _index >= 1 ? _index + 1 : _index;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _barIndex,
        onTap: _onTap,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.add_alert_outlined), label: 'Report'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), activeIcon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
