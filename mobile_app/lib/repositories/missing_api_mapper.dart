import '../models/missing_report.dart';
import '../models/sighting.dart';
import '../models/witness_alert.dart';

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

  /// Normalize the backend `Gender` enum to a display label for the feed.
  static String _genderLabel(String? g) {
    switch ((g ?? '').toUpperCase()) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  /// Human-readable distance from raw meters.
  static String _distanceText(num? meters) {
    if (meters == null) return '';
    if (meters < 1000) return '${meters.round()} m away';
    return '${(meters / 1000).toStringAsFixed(1)} km away';
  }

  /// Map a status from the backend to the feed's short "Active Search" badge.
  static String? _statusText(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'REUNITED':
        return null;
      case 'ESCALATED':
        return 'Escalated';
      default:
        return 'Active Search';
    }
  }

  /// Map a single `/api/missing/feed` item (a live MissingReport with
  /// `distanceMeters`) into the feed's [WitnessAlert] view model.
  ///
  /// Reports within ~150 m of the user are surfaced as BLE-proximity witness
  /// alerts; farther ones as area (GPS-radius) alerts.
  static WitnessAlert alertFromFeedItem(Map<String, dynamic> json) {
    final person = (json['person'] as Map<String, dynamic>?) ?? const {};
    final distance = json['distanceMeters'] as num?;
    final clothing = person['clothing'] as String?;
    final description = person['description'] as String?;
    final label = json['lastSeenLabel'] as String?;
    final text = [clothing, description]
        .where((s) => s != null && s.trim().isNotEmpty)
        .join(' · ');

    return WitnessAlert(
      id: json['id'] as String,
      missingReportId: json['id'] as String,
      witnessUserId: 'me',
      alertType:
          (distance != null && distance < 150) ? 'ble_witness' : 'gps_radius',
      alertText: text.isNotEmpty
          ? text
          : (label != null ? 'Last seen near $label' : 'Last seen recently'),
      createdAt: DateTime.parse(json['reportedAt'] as String),
      personName: person['name'] as String?,
      photoUrl: person['photoUrl'] as String?,
      age: (person['age'] as num?)?.toInt(),
      gender: _genderLabel(person['gender'] as String?),
      distanceText: _distanceText(distance),
      statusText: _statusText(json['status'] as String?),
    );
  }
}
