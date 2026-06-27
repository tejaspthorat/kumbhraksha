import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

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

  String _formatAlertTime(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCheck = DateTime(dt.year, dt.month, dt.day);

    final timeStr = DateFormat('h:mm a').format(dt);
    if (dateToCheck == today) {
      return 'Today, $timeStr';
    } else if (dateToCheck == yesterday) {
      return 'Yesterday, $timeStr';
    } else {
      return '${DateFormat('MMM d').format(dt)}, $timeStr';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image stack
          if (alert.photoUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              child: Stack(
                children: [
                  Image.network(
                    alert.photoUrl!,
                    height: 240,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 240,
                      color: scheme.surfaceDim,
                      child: Center(
                        child: Icon(Icons.broken_image_outlined, size: 40, color: scheme.onSurface.withOpacity(0.3)),
                      ),
                    ),
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 240,
                        color: scheme.surfaceDim,
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    },
                  ),
                  // Top right status badge
                  if (alert.statusText != null)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: scheme.secondary, // Blue status badge for area info
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: scheme.secondary.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              alert.statusText!.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Bottom left distance badge
                  if (alert.distanceText != null)
                    Positioned(
                      bottom: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: scheme.surface.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: scheme.outlineVariant, width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Transform.rotate(
                              angle: 0.785,
                              child: Icon(
                                Icons.navigation_rounded,
                                color: scheme.primary,
                                size: 12,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              alert.distanceText!,
                              style: TextStyle(
                                color: scheme.onSurface,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(Dimens.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.personName ?? 'Missing Person',
                  style: text.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: scheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                // Age and Gender
                Builder(
                  builder: (context) {
                    final ageStr = alert.age != null ? '${alert.age} years old' : '';
                    final genderStr = alert.gender ?? '';
                    final parts = [if (ageStr.isNotEmpty) ageStr, if (genderStr.isNotEmpty) genderStr];
                    if (parts.isEmpty) return const SizedBox.shrink();
                    return Text(
                      parts.join('  •  '),
                      style: text.bodyMedium?.copyWith(
                        color: scheme.onSurface.withOpacity(0.5),
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  },
                ),
                const SizedBox(height: Dimens.md),
                Text(
                  alert.alertText,
                  style: text.bodyMedium?.copyWith(
                    color: scheme.onSurface.withOpacity(0.7),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: Dimens.md),
                Divider(color: scheme.outlineVariant, height: 1),
                const SizedBox(height: Dimens.md),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded, size: 14, color: scheme.onSurface.withOpacity(0.4)),
                    const SizedBox(width: Dimens.sm),
                    Expanded(
                      child: Text(
                        _formatAlertTime(alert.createdAt),
                        style: text.bodySmall?.copyWith(
                          color: scheme.onSurface.withOpacity(0.4),
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Dimens.md),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    onPressed: onIWasThere,
                    child: const Text('Provide Witness Details'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
