import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/app_translations.dart';
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
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Dimens.xl),
              Text(
                context.tr('choose_language'),
                style: text.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: Dimens.xs),
              Text(
                'अपनी भाषा चुनें',
                style: text.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: Dimens.xl),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: scheme.outlineVariant, width: 1),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: ListView.separated(
                    itemCount: supportedLanguages.length,
                    separatorBuilder: (_, __) => Divider(
                      height: 1,
                      color: scheme.outlineVariant,
                      indent: Dimens.lg,
                    ),
                    itemBuilder: (context, i) {
                      final code = supportedLanguages[i];
                      final selected = auth.language == code;
                      return _LanguageRow(
                        code: code,
                        selected: selected,
                        onTap: () => auth.selectLanguage(code),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: Dimens.lg),
              FilledButton(
                onPressed: () => Navigator.of(context).pushNamed(PermissionsScreen.route),
                child: Text(context.tr('continue')),
              ),
              const SizedBox(height: Dimens.sm),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageRow extends StatelessWidget {
  const _LanguageRow({
    required this.code,
    required this.selected,
    required this.onTap,
  });

  final String code;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final text = theme.textTheme;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: 16),
        color: selected ? scheme.primary.withOpacity(0.03) : Colors.transparent,
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    languageNames[code] ?? code,
                    style: text.titleMedium?.copyWith(
                      fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    code.toUpperCase(),
                    style: text.bodySmall?.copyWith(
                      color: scheme.onSurface.withOpacity(0.4),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (selected)
              Icon(
                Icons.check_circle_rounded,
                color: scheme.primary,
                size: 22,
              )
            else
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: scheme.onSurface.withOpacity(0.15),
                    width: 1.5,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
