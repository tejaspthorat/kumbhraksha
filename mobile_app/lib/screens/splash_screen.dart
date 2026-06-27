import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/durations.dart';
import '../providers/auth_provider.dart';
import '../features/auth/presentation/screens/language_selection_screen.dart';
import 'nav_shell.dart';

/// Branded boot screen. Bootstraps auth state then routes to onboarding or home.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  static const String route = '/';

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppDurations.slow)
      ..forward();
    _scale = CurvedAnimation(parent: _controller, curve: Curves.easeOutBack);
    _boot();
  }

  Future<void> _boot() async {
    final auth = context.read<AuthProvider>();
    await Future.wait([
      auth.bootstrap(),
      Future<void>.delayed(AppDurations.splash),
    ]);
    if (!mounted) return;
    final next = auth.status == AuthStatus.authenticated
        ? NavShell.route
        : LanguageSelectionScreen.route;
    Navigator.of(context).pushReplacementNamed(next);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.primary,
      body: Center(
        child: ScaleTransition(
          scale: _scale,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Icon(Icons.shield_moon,
                    size: 64, color: scheme.primary),
              ),
              const SizedBox(height: 24),
              Text(
                'KumbhRaksha',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Reuniting families at Kumbh Mela',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white70,
                    ),
              ),
              const SizedBox(height: 40),
              const SizedBox(
                width: 26,
                height: 26,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
