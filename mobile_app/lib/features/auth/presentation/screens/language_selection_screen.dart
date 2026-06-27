import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/enums.dart';
import '../../../../providers/auth_provider.dart';
import 'permissions_screen.dart';

/// Onboarding step 1 — choose preferred language.
class LanguageSelectionScreen extends StatelessWidget {
  const LanguageSelectionScreen({super.key});
  static const String route = '/onboarding/language';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Dimens.lg),
              Text('Choose your language', style: text.headlineSmall),
              const SizedBox(height: Dimens.xs),
              Text('अपनी भाषा चुनें', style: text.bodyMedium),
              const SizedBox(height: Dimens.lg),
              Expanded(
                child: ListView.separated(
                  itemCount: supportedLanguages.length,
                  separatorBuilder: (_, index) => const SizedBox(height: Dimens.sm),
                  itemBuilder: (context, i) {
                    final code = supportedLanguages[i];
                    final selected = auth.language == code;
                    return _LanguageTile(
                      code: code,
                      selected: selected,
                      onTap: () => auth.selectLanguage(code),
                    );
                  },
                ),
              ),
              const SizedBox(height: Dimens.sm),
              FilledButton(
                onPressed: () => Navigator.of(context)
                    .pushNamed(PermissionsScreen.route),
                child: const Text('Continue'),
              ),
              const SizedBox(height: Dimens.sm),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.code,
    required this.selected,
    required this.onTap,
  });

  final String code;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(Dimens.radiusCard),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(Dimens.lg),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Dimens.radiusCard),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
          color: selected ? scheme.primary.withValues(alpha: 0.06) : null,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                languageNames[code] ?? code,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            Text(code, style: Theme.of(context).textTheme.bodySmall),
            if (selected) ...[
              const SizedBox(width: Dimens.sm),
              Icon(Icons.check_circle, color: scheme.primary),
            ],
          ],
        ),
      ),
    );
  }
}
