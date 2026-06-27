import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/app_translations.dart';
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
    final theme = Theme.of(context);
    final text = theme.textTheme;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('permissions_title'),
                style: text.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: Dimens.xs),
              Text(
                context.tr('permissions_desc'),
                style: text.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: Dimens.xl),
              _PermissionCard(
                icon: Icons.bluetooth,
                title: context.tr('bluetooth_title'),
                subtitle: context.tr('bluetooth_desc'),
              ),
              const SizedBox(height: Dimens.md),
              _PermissionCard(
                icon: Icons.location_on_outlined,
                title: context.tr('location_title'),
                subtitle: context.tr('location_desc'),
              ),
              const SizedBox(height: Dimens.md),
              const _PermissionCard(
                icon: Icons.notifications_active_outlined,
                title: 'Instant Notifications',
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
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(context.tr('allow_access')),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pushNamed(PhoneInputScreen.route),
                  child: Text(
                    'Skip for now',
                    style: TextStyle(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Dimens.sm),
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
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: scheme.primary.withOpacity(0.04),
                border: Border.all(color: scheme.outlineVariant, width: 1),
              ),
              child: Icon(icon, color: scheme.primary, size: 22),
            ),
            const SizedBox(width: Dimens.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurface.withOpacity(0.6),
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
