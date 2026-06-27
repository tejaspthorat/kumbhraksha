import 'package:flutter/material.dart';

enum MarkerKind { missing, sighting, cctv }

/// A point rendered on the active-alerts map.
class MapMarkerData {
  const MapMarkerData({
    required this.id,
    required this.kind,
    required this.latitude,
    required this.longitude,
    required this.title,
    required this.subtitle,
    this.radiusMeters,
    this.time,
    this.photoUrl,
  });

  final String id;
  final MarkerKind kind;
  final double latitude;
  final double longitude;
  final String title;
  final String subtitle;
  final double? radiusMeters; // cascading alert radius (missing only)
  final DateTime? time;
  final String? photoUrl;

  Color get color => switch (kind) {
        MarkerKind.missing => const Color(0xFFEF4444),
        MarkerKind.sighting => const Color(0xFFF59E0B),
        MarkerKind.cctv => const Color(0xFF6366F1),
      };

  IconData get icon => switch (kind) {
        MarkerKind.missing => Icons.person_pin_circle,
        MarkerKind.sighting => Icons.visibility,
        MarkerKind.cctv => Icons.videocam,
      };

  String get label => switch (kind) {
        MarkerKind.missing => 'Missing',
        MarkerKind.sighting => 'Sighting',
        MarkerKind.cctv => 'CCTV',
      };
}
