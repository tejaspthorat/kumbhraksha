import 'package:flutter/material.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/witness_alert.dart';

/// Feed card for a GPS-radius (area) alert. Emphasises location and routes the
/// user to the "I was there" witness-memory recall flow.
class AreaAlertCard extends StatelessWidget {
  const AreaAlertCard({
    super.key,
    required this.alert,
    this.onIWasThere,
    this.onDismiss,
  });

  final WitnessAlert alert;
  final VoidCallback? onIWasThere;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: scheme.secondary,
                    borderRadius: BorderRadius.circular(Dimens.radius),
                  ),
                  child: Text('AREA ALERT',
                      style: text.labelMedium?.copyWith(color: Colors.white)),
                ),
                const Spacer(),
                Icon(Icons.location_on, size: 18, color: scheme.secondary),
              ],
            ),
            const SizedBox(height: Dimens.md),
            Text(alert.personName ?? 'Missing person', style: text.titleMedium),
            const SizedBox(height: Dimens.xs),
            Text(alert.alertText, style: text.bodyMedium),
            if (alert.isPending) ...[
              const SizedBox(height: Dimens.lg),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: onIWasThere,
                      child: const Text('I was there'),
                    ),
                  ),
                  const SizedBox(width: Dimens.md),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onDismiss,
                      child: const Text('Not me'),
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
                    Text('Responded: ${alert.responseText}',
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
