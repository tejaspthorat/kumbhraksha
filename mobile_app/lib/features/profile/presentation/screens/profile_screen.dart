import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/app_translations.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/ble_provider.dart';
import '../../../../screens/nav_shell.dart';
import '../../../report/presentation/screens/report_missing_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;
    
    final auth = context.watch<AuthProvider>();
    final ble = context.watch<BleProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          context.tr('profile_title'),
          style: text.headlineSmall?.copyWith(
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
            color: scheme.onSurface,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.md),
        children: [
          // 1. Digital Pilgrim Pass Wallet Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: scheme.outlineVariant, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.badge_outlined, color: scheme.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          context.tr('trust_pass'),
                          style: text.labelSmall?.copyWith(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: scheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: scheme.secondary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        context.tr('verified'),
                        style: TextStyle(
                          color: scheme.secondary,
                          fontWeight: FontWeight.bold,
                          fontSize: 9,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: scheme.primary.withOpacity(0.05),
                        border: Border.all(color: scheme.outlineVariant, width: 1),
                      ),
                      child: Icon(Icons.person_pin_rounded, color: scheme.primary, size: 36),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user != null ? context.tr('pilgrim_acc') : context.tr('guest_acc'),
                            style: text.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user != null ? user.phoneNumber : 'Not logged in',
                            style: text.bodyMedium?.copyWith(
                              color: scheme.onSurface.withOpacity(0.5),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Divider(color: scheme.outlineVariant, height: 1),
                const SizedBox(height: 16),
                
                // BLE UUID Detail
                Text(
                  context.tr('ble_radar_id'),
                  style: text.labelSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: scheme.onSurface.withOpacity(0.4),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.bleRotatingUuid ?? 'Not Broadcasted (Start Radar)',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: scheme.onSurface.withOpacity(0.7),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                
                // Barcode simulation
                Center(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(32, (index) => Container(
                          width: (index % 4 == 0) ? 3.5 : ((index % 3 == 0) ? 2 : 1),
                          height: 36,
                          margin: const EdgeInsets.symmetric(horizontal: 1),
                          color: scheme.onSurface.withOpacity(0.75),
                        )),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'ID: ${user?.id.toUpperCase().substring(0, 12) ?? "KUMBH-GUEST-PASS"}',
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 2,
                          color: scheme.onSurface.withOpacity(0.4),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimens.xl),

          // 2. Settings Section Header
          Text(
            context.tr('security_hardware'),
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold, letterSpacing: -0.3),
          ),
          const SizedBox(height: Dimens.md),
          
          // BLE Protection Toggle
          Container(
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: scheme.outlineVariant, width: 1),
            ),
            child: SwitchListTile.adaptive(
              secondary: Icon(Icons.bluetooth_searching_rounded, color: scheme.secondary),
              activeColor: scheme.secondary,
              title: Text(
                context.tr('ble_protection'),
                style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                ble.isActive ? context.tr('active_scanning') : context.tr('radar_disabled'),
                style: TextStyle(color: scheme.onSurface.withOpacity(0.5), fontSize: 13),
              ),
              value: ble.isActive,
              onChanged: (v) {
                v ? ble.start() : ble.stop();
              },
            ),
          ),
          const SizedBox(height: Dimens.xl),

          // 3. Pilgrim Configuration & Group
          Text(
            context.tr('preferences_safety'),
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold, letterSpacing: -0.3),
          ),
          const SizedBox(height: Dimens.md),
          Container(
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: scheme.outlineVariant, width: 1),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(Icons.group_outlined, color: scheme.primary),
                  title: Text(
                    context.tr('family_group'),
                    style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    context.tr('family_desc'),
                    style: TextStyle(color: scheme.onSurface.withOpacity(0.5), fontSize: 13),
                  ),
                  trailing: Icon(Icons.chevron_right_rounded, color: scheme.onSurface.withOpacity(0.3)),
                  onTap: () => Navigator.of(context).pushNamed('/family'),
                ),
                Divider(height: 1, color: scheme.outlineVariant),
                ListTile(
                  leading: Icon(Icons.language_rounded, color: scheme.primary),
                  title: Text(
                    context.tr('switch_lang'),
                    style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    context.tr('switch_lang_desc'),
                    style: TextStyle(color: scheme.onSurface.withOpacity(0.5), fontSize: 13),
                  ),
                  trailing: Icon(Icons.chevron_right_rounded, color: scheme.onSurface.withOpacity(0.3)),
                  onTap: () => Navigator.of(context).pushNamed('/onboarding/language'),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimens.xl),

          // 4. Quick Actions
          Text(
            context.tr('emergency_actions'),
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold, letterSpacing: -0.3),
          ),
          const SizedBox(height: Dimens.md),
          
          // Card: Report Missing (Urgent Red Card)
          GestureDetector(
            onTap: () {
              Navigator.of(context).pushNamed(ReportMissingScreen.route);
            },
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: scheme.error,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.error_outline, color: Colors.white, size: 14),
                              SizedBox(width: 4),
                              Text(
                                'URGENT ACTION',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('report_missing'),
                          style: text.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 22,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          context.tr('report_missing_desc'),
                          style: text.bodyMedium?.copyWith(
                            color: Colors.white.withOpacity(0.85),
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.notifications_active,
                    color: Colors.white,
                    size: 32,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Dimens.lg),

          // Cards Row (Report Sighting & Map Radar Shortcuts)
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.of(context).pushNamed('/sighting/report'),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    height: 120,
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(Icons.visibility_outlined, color: scheme.primary, size: 24),
                        Text(
                          context.tr('report_sighting'),
                          style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => const TabSwitchNotification(2).dispatch(context),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    height: 120,
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(Icons.map_outlined, color: scheme.primary, size: 24),
                        Text(
                          context.tr('radar_map'),
                          style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Dimens.xl),

          // 5. Account Section Header
          Text(
            context.tr('account_mgmt'),
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold, letterSpacing: -0.3),
          ),
          const SizedBox(height: Dimens.md),
          Container(
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: scheme.outlineVariant, width: 1),
            ),
            child: ListTile(
              leading: Icon(Icons.logout_rounded, color: scheme.error),
              title: Text(
                context.tr('logout'),
                style: text.bodyLarge?.copyWith(fontWeight: FontWeight.bold, color: scheme.error),
              ),
              subtitle: Text(
                context.tr('logout_desc'),
                style: TextStyle(color: scheme.error.withOpacity(0.6), fontSize: 13),
              ),
              onTap: () async {
                await auth.logout();
                if (context.mounted) {
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    '/onboarding/language',
                    (_) => false,
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 100), // padding at bottom to avoid blocking by bottom navigation bar
        ],
      ),
    );
  }
}
