import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

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
    final text = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image stack
          if (alert.photoUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  Image.network(
                    alert.photoUrl!,
                    height: 260,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 260,
                      color: Colors.grey.shade200,
                      child: const Center(
                        child: Icon(Icons.broken_image_outlined, size: 40, color: Colors.grey),
                      ),
                    ),
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 260,
                        color: Colors.grey.shade100,
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
                          color: const Color(0xFF8D5332), // Brown status badge background
                          borderRadius: BorderRadius.circular(12),
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
                              alert.statusText!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
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
                          color: Colors.white.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Transform.rotate(
                              angle: 0.785, // rotate near_me icon or location icon slightly
                              child: const Icon(
                                Icons.navigation,
                                color: Color(0xFF8D5332),
                                size: 14,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              alert.distanceText!,
                              style: const TextStyle(
                                color: Colors.black87,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
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
                  style: text.titleMedium?.copyWith(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: Dimens.xs),
                // Age and Gender
                Builder(
                  builder: (context) {
                    final ageStr = alert.age != null ? '${alert.age} years old' : '';
                    final genderStr = alert.gender ?? '';
                    final parts = [if (ageStr.isNotEmpty) ageStr, if (genderStr.isNotEmpty) genderStr];
                    if (parts.isEmpty) return const SizedBox.shrink();
                    return Text(
                      parts.join(' • '),
                      style: text.bodyMedium?.copyWith(
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  },
                ),
                const SizedBox(height: Dimens.md),
                Text(
                  alert.alertText,
                  style: text.bodyMedium?.copyWith(
                    color: Colors.grey.shade700,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: Dimens.md),
                Divider(color: Colors.grey.shade200, height: 1),
                const SizedBox(height: Dimens.md),
                Row(
                  children: [
                    Icon(Icons.access_time_outlined, size: 16, color: Colors.grey.shade600),
                    const SizedBox(width: Dimens.sm),
                    Expanded(
                      child: Text(
                        _formatAlertTime(alert.createdAt),
                        style: text.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                          fontSize: 13,
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
                  child: OutlinedButton(
                    onPressed: () => onRespond?.call('yes'),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: const Color(0xFFF1EDE9),
                      side: BorderSide.none,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'View Details',
                      style: TextStyle(
                        color: Color(0xFF2C2C2C),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
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
