import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../providers/ble_provider.dart';
import 'phone_input_screen.dart';

/// Onboarding step 2 — explain and request runtime permissions.
class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});
  static const String route = '/onboarding/permissions';

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  bool _requesting = false;

  Future<void> _grant() async {
    setState(() => _requesting = true);
    // BLE provider also covers location-when-in-use needed for scanning.
    await context.read<BleProvider>().ensurePermissions();
    if (!mounted) return;
    setState(() => _requesting = false);
    Navigator.of(context).pushNamed(PhoneInputScreen.route);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Permissions we need', style: text.headlineSmall),
              const SizedBox(height: Dimens.xs),
              Text(
                'KumbhRaksha uses these only to help find missing people near you.',
                style: text.bodyMedium,
              ),
              const SizedBox(height: Dimens.lg),
              const _PermissionCard(
                icon: Icons.bluetooth,
                title: 'Bluetooth',
                subtitle:
                    'Detect when you were near a missing person, anonymously.',
              ),
              const SizedBox(height: Dimens.md),
              const _PermissionCard(
                icon: Icons.location_on,
                title: 'Location',
                subtitle: 'Send area alerts and tag where someone was last seen.',
              ),
              const SizedBox(height: Dimens.md),
              const _PermissionCard(
                icon: Icons.notifications_active,
                title: 'Notifications',
                subtitle: 'Alert you instantly when you can help nearby.',
              ),
              const Spacer(),
              FilledButton(
                onPressed: _requesting ? null : _grant,
                child: _requesting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Allow & continue'),
              ),
              TextButton(
                onPressed: () =>
                    Navigator.of(context).pushNamed(PhoneInputScreen.route),
                child: const Text('Skip for now'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermissionCard extends StatelessWidget {
  const _PermissionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: scheme.secondary.withValues(alpha: 0.12),
              child: Icon(icon, color: scheme.secondary),
            ),
            const SizedBox(width: Dimens.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: Dimens.xs),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
