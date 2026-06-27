import 'package:flutter/material.dart';

import '../../../../core/constants/dimensions.dart';

/// Active-alerts map. Full Google Maps integration lands in Phase 3; this is a
/// structured placeholder with the intended controls.
class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Map')),
      body: Stack(
        children: [
          Container(
            color: scheme.surfaceContainerHighest,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.map_outlined, size: 72, color: scheme.outline),
                  const SizedBox(height: Dimens.md),
                  Text('Active alerts map', style: text.titleMedium),
                  const SizedBox(height: Dimens.xs),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: Dimens.xl),
                    child: Text(
                      'Google Maps with live cases & sightings arrives in Phase 3.',
                      textAlign: TextAlign.center,
                      style: text.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: Dimens.lg,
            bottom: Dimens.lg,
            child: FloatingActionButton(
              onPressed: () {},
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}
