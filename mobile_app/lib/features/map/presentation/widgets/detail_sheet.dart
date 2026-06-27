import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/constants/dimensions.dart';
import '../../domain/map_marker.dart';

/// Bottom sheet shown when a map marker is tapped.
class MarkerDetailSheet extends StatelessWidget {
  const MarkerDetailSheet({super.key, required this.marker});
  final MapMarkerData marker;

  static Future<void> show(BuildContext context, MapMarkerData marker) {
    return showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Dimens.radiusSheet)),
      ),
      builder: (_) => MarkerDetailSheet(marker: marker),
    );
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: marker.color.withValues(alpha: 0.15),
                  child: Icon(marker.icon, color: marker.color),
                ),
                const SizedBox(width: Dimens.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(marker.title, style: text.titleMedium),
                      Text(marker.label, style: text.labelMedium),
                    ],
                  ),
                ),
                if (marker.time != null)
                  Text(DateFormat.jm().format(marker.time!),
                      style: text.bodySmall),
              ],
            ),
            const SizedBox(height: Dimens.lg),
            Text(marker.subtitle, style: text.bodyMedium),
            if (marker.radiusMeters != null) ...[
              const SizedBox(height: Dimens.sm),
              Row(
                children: [
                  const Icon(Icons.radar, size: 18),
                  const SizedBox(width: Dimens.xs),
                  Text('Alert radius: ${marker.radiusMeters!.round()} m',
                      style: text.bodySmall),
                ],
              ),
            ],
            const SizedBox(height: Dimens.xl),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.directions),
                    label: const Text('Directions'),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                const SizedBox(width: Dimens.md),
                Expanded(
                  child: FilledButton.icon(
                    icon: const Icon(Icons.visibility),
                    label: const Text('I see them'),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
