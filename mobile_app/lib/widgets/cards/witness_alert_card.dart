import 'package:flutter/material.dart';

import '../../core/constants/dimensions.dart';
import '../../models/witness_alert.dart';

/// Feed card for a witness/area alert with quick response actions.
class WitnessAlertCard extends StatelessWidget {
  const WitnessAlertCard({
    super.key,
    required this.alert,
    this.onRespond,
  });

  final WitnessAlert alert;
  final void Function(String response)? onRespond;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final accent = alert.isBleAlert ? scheme.primary : scheme.secondary;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: accent,
                borderRadius: BorderRadius.circular(Dimens.radius),
              ),
              child: Text(
                alert.isBleAlert ? 'WITNESS ALERT' : 'AREA ALERT',
                style: text.labelMedium?.copyWith(color: Colors.white),
              ),
            ),
            const SizedBox(height: Dimens.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: scheme.surfaceContainerHighest,
                  child: const Icon(Icons.person, size: 28),
                ),
                const SizedBox(width: Dimens.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(alert.personName ?? 'Missing person',
                          style: text.titleMedium),
                      const SizedBox(height: Dimens.xs),
                      Text(alert.alertText, style: text.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
            if (alert.isPending) ...[
              const SizedBox(height: Dimens.lg),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => onRespond?.call('yes'),
                      child: const Text('I saw them'),
                    ),
                  ),
                  const SizedBox(width: Dimens.md),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => onRespond?.call('no'),
                      child: const Text("Didn't see"),
                    ),
                  ),
                ],
              ),
            ] else
              Padding(
                padding: const EdgeInsets.only(top: Dimens.md),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, size: 18, color: scheme.tertiary),
                    const SizedBox(width: Dimens.xs),
                    Text('You responded: ${alert.responseText}',
                        style: text.bodySmall),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
