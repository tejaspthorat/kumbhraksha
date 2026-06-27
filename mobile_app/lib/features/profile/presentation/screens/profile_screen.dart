import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/enums.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/ble_provider.dart';
import '../../../../screens/splash_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ble = context.watch<BleProvider>();
    final text = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(Dimens.lg),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: scheme.primary.withValues(alpha: 0.12),
                child: Icon(Icons.person, size: 36, color: scheme.primary),
              ),
              const SizedBox(width: Dimens.lg),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user?.phoneNumber ?? 'Guest', style: text.titleLarge),
                  Text(
                    languageNames[user?.languagePreference ?? auth.language] ??
                        auth.language,
                    style: text.bodySmall,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: Dimens.xl),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.bluetooth),
                  title: const Text('BLE protection'),
                  subtitle: Text(ble.isActive ? 'Scanning nearby' : 'Off'),
                  value: ble.isActive,
                  onChanged: (v) => v ? ble.start() : ble.stop(),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.group_outlined),
                  title: const Text('Family group'),
                  subtitle: const Text('Pre-register family for quick reporting'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language),
                  title: const Text('Language'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context)
                      .pushNamed('/onboarding/language'),
                ),
              ],
            ),
          ),
          const SizedBox(height: Dimens.lg),
          OutlinedButton.icon(
            icon: const Icon(Icons.logout),
            label: const Text('Log out'),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                Navigator.of(context)
                    .pushNamedAndRemoveUntil(SplashScreen.route, (_) => false);
              }
            },
          ),
        ],
      ),
    );
  }
}
