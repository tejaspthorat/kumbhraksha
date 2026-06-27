import '../models/missing_report.dart';
import '../models/sighting.dart';

/// Translates between the mobile domain models (flat, snake_case) and the
/// centralized Express backend contract (nested, camelCase) at /api/missing/*.
///
/// The backend is the single source of truth, so all wire-format knowledge for
/// the missing-persons network lives here rather than leaking into the models.
class MissingApiMapper {
  MissingApiMapper._();

  /// Normalize the app's gender code to the backend `Gender` enum.
  static String _gender(String g) {
    switch (g.toUpperCase()) {
      case 'M':
      case 'MALE':
        return 'MALE';
      case 'F':
      case 'FEMALE':
        return 'FEMALE';
      case 'O':
      case 'OTHER':
        return 'OTHER';
      default:
        return 'UNKNOWN';
    }
  }

  /// Build the POST /api/missing/reports request body from a [MissingReport].
  static Map<String, dynamic> reportToBackend(MissingReport r) => {
        'person': {
          'name': r.personName,
          'age': r.personAge,
          'gender': _gender(r.personGender),
          'description': r.distinguishingFeatures,
          'clothing': r.getClothingDescription(),
          'medicalNotes': r.medicalConditions,
          'photoUrl': r.photoUrl,
        },
        'lastSeenLat': r.lastSeenLatitude,
        'lastSeenLng': r.lastSeenLongitude,
        'lastSeenLabel': null,
        'lastSeenTime': r.lastSeenTime.toIso8601String(),
        'source': 'mobile',
      };

  /// Build the POST /api/missing/sightings request body from a [Sighting].
  static Map<String, dynamic> sightingToBackend(Sighting s) => {
        'missingReportId': s.missingReportId,
        'spotterName': s.spotterUserId,
        'photoUrl': s.photoUrl,
        'lat': s.latitude,
        'lng': s.longitude,
        'description': s.notes ?? s.personDescription,
      };

  /// Map a backend Sighting response back into the app's [Sighting] model.
  /// Backend sightings don't carry person-type/behavior, so those are derived
  /// to safe defaults rather than fabricated.
  static Sighting sightingFromBackend(Map<String, dynamic> json) => Sighting(
        id: json['id'] as String,
        spotterUserId: (json['spotterName'] as String?) ?? '',
        missingReportId: json['missingReportId'] as String?,
        personType: 'adult',
        gender: 'UNKNOWN',
        behavior: 'unknown',
        photoUrl: json['photoUrl'] as String?,
        latitude: (json['lat'] as num).toDouble(),
        longitude: (json['lng'] as num).toDouble(),
        notes: json['description'] as String?,
        createdAt: DateTime.parse(json['spottedAt'] as String),
        matcherConfidence: (json['aiMatchConfidence'] as num?)?.toDouble(),
      );
}
