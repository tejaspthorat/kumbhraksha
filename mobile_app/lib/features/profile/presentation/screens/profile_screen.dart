import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/ble_provider.dart';
import '../../../../screens/nav_shell.dart';
import '../../../report/presentation/screens/report_missing_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showSettings(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final ble = context.read<BleProvider>();
    final text = Theme.of(context).textTheme;
    final user = auth.user;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(Dimens.lg),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('App Settings', style: text.titleLarge),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: Dimens.md),
                    if (user != null) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                        child: Text(
                          'Phone: ${user.phoneNumber}',
                          style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Divider(height: 1),
                    ],
                    SwitchListTile(
                      secondary: const Icon(Icons.bluetooth),
                      title: const Text('BLE protection'),
                      subtitle: Text(ble.isActive ? 'Scanning nearby' : 'Off'),
                      value: ble.isActive,
                      onChanged: (v) {
                        v ? ble.start() : ble.stop();
                        setModalState(() {});
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.group_outlined),
                      title: const Text('Family group'),
                      subtitle: const Text('Pre-register family for quick reporting'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).pushNamed('/family');
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.language),
                      title: const Text('Language'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).pushNamed('/onboarding/language');
                      },
                    ),
                    const SizedBox(height: Dimens.lg),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.logout),
                        label: const Text('Log out'),
                        onPressed: () async {
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
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Settings trigger row at the top
            Padding(
              padding: const EdgeInsets.only(top: Dimens.md, right: Dimens.lg, left: Dimens.lg),
              child: Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.settings_outlined, color: Colors.black54, size: 26),
                  onPressed: () => _showSettings(context),
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.sm),
                children: [
                  // Card 1: Active Alerts
                  GestureDetector(
                    onTap: () {
                      // Switch to Home tab (index 0)
                      const TabSwitchNotification(0).dispatch(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200, width: 1),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: Color(0xFF8D5332),
                            size: 28,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Active Alerts',
                                  style: text.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '3 active alerts near you in the last 24 hours.',
                                  style: text.bodyMedium?.copyWith(
                                    color: Colors.black54,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Dimens.lg),

                  // Card 2: Report Missing (Urgent)
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).pushNamed(ReportMissingScreen.route);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8D5332),
                        borderRadius: BorderRadius.circular(16),
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
                                    color: Colors.black.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.error_outline, color: Colors.white, size: 14),
                                      SizedBox(width: 4),
                                      Text(
                                        'Urgent',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Report Missing',
                                  style: text.titleMedium?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 22,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Start a new missing person alert immediately.',
                                  style: text.bodyMedium?.copyWith(
                                    color: Colors.white.withOpacity(0.85),
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.notifications_active_outlined,
                            color: Colors.white.withOpacity(0.9),
                            size: 36,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Dimens.lg),

                  // Card 3: Report a Sighting
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).pushNamed('/sighting/report');
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEBE6E3),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.visibility_outlined,
                            color: Color(0xFF8D5332),
                            size: 28,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Report a Sighting',
                            style: text.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Share information.',
                            style: text.bodyMedium?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Dimens.lg),

                  // Card 4: View Alert Map
                  GestureDetector(
                    onTap: () {
                      // Switch to Map tab (index 2)
                      const TabSwitchNotification(2).dispatch(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200, width: 1),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.map_outlined,
                            color: Color(0xFF8D5332),
                            size: 28,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'View Alert Map',
                            style: text.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'See alerts near you.',
                            style: text.bodyMedium?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
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
