# Data Models Implementation Guide

## Overview

All data models follow these principles:
1. **Immutable** — Use `final` fields, implement `copyWith`
2. **Serializable** — `toJson()` and `fromJson()` methods
3. **Equatable** — Implement equality for testing and comparison
4. **Dart best practices** — Null safety, const constructors

---

## Entity vs Model Pattern

```
┌──────────────────┐
│ API Response     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Model (JSON serialization)
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Entity (Domain logic)
└──────────────────────────┘
         │
         ▼
┌──────────────────┐
│ UI/State Mgmt    │
└──────────────────┘
```

---

## User Model

**File**: `lib/models/user.dart`

```dart
import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String phoneNumber;
  final String languagePreference;
  final String? fcmToken;
  final String? bleRotatingUuid;
  final bool isOnboarded;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.phoneNumber,
    required this.languagePreference,
    this.fcmToken,
    this.bleRotatingUuid,
    required this.isOnboarded,
    required this.createdAt,
    this.updatedAt,
  });

  // ============ SERIALIZATION ============

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phoneNumber: json['phone_number'] as String,
      languagePreference: json['language_preference'] as String? ?? 'hindi',
      fcmToken: json['fcm_token'] as String?,
      bleRotatingUuid: json['ble_rotating_uuid'] as String?,
      isOnboarded: json['is_onboarded'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone_number': phoneNumber,
      'language_preference': languagePreference,
      'fcm_token': fcmToken,
      'ble_rotating_uuid': bleRotatingUuid,
      'is_onboarded': isOnboarded,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // For local storage (shared_preferences or secure_storage)
  Map<String, dynamic> toLocalJson() => toJson();
  factory User.fromLocalJson(Map<String, dynamic> json) => User.fromJson(json);

  // ============ COPYITH ============

  User copyWith({
    String? id,
    String? phoneNumber,
    String? languagePreference,
    String? fcmToken,
    String? bleRotatingUuid,
    bool? isOnboarded,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      languagePreference: languagePreference ?? this.languagePreference,
      fcmToken: fcmToken ?? this.fcmToken,
      bleRotatingUuid: bleRotatingUuid ?? this.bleRotatingUuid,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ============ EQUALITY ============

  @override
  List<Object?> get props => [
    id,
    phoneNumber,
    languagePreference,
    fcmToken,
    bleRotatingUuid,
    isOnboarded,
    createdAt,
    updatedAt,
  ];

  // ============ HELPERS ============

  bool get isComplete => isOnboarded && fcmToken != null;
  
  String getDisplayName() => 'User $phoneNumber';
}
```

---

## BLE Encounter Model

**File**: `lib/models/ble_encounter.dart`

```dart
import 'package:equatable/equatable.dart';

class BleEncounter extends Equatable {
  final String id;
  final String encounteredUuid;
  final int rssi;                    // Signal strength: -40 to -100
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double? distanceEstimate;
  final String syncStatus;           // 'pending', 'synced', 'failed'

  const BleEncounter({
    required this.id,
    required this.encounteredUuid,
    required this.rssi,
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    this.distanceEstimate,
    this.syncStatus = 'pending',
  });

  // ============ DATABASE MAPPING ============

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'encountered_uuid': encounteredUuid,
      'rssi': rssi,
      'timestamp': timestamp.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      'distance_estimate': distanceEstimate,
      'sync_status': syncStatus,
    };
  }

  factory BleEncounter.fromMap(Map<String, dynamic> map) {
    return BleEncounter(
      id: map['id'] as String,
      encounteredUuid: map['encountered_uuid'] as String,
      rssi: map['rssi'] as int,
      timestamp: DateTime.parse(map['timestamp'] as String),
      latitude: map['latitude'] as double,
      longitude: map['longitude'] as double,
      distanceEstimate: map['distance_estimate'] as double?,
      syncStatus: map['sync_status'] as String? ?? 'pending',
    );
  }

  // ============ JSON MAPPING ============

  factory BleEncounter.fromJson(Map<String, dynamic> json) {
    return BleEncounter(
      id: json['id'] as String,
      encounteredUuid: json['encountered_uuid'] as String,
      rssi: json['rssi'] as int,
      timestamp: DateTime.parse(json['timestamp'] as String),
      latitude: json['latitude'] as double,
      longitude: json['longitude'] as double,
      distanceEstimate: json['distance_estimate'] as double?,
      syncStatus: json['sync_status'] as String? ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encountered_uuid': encounteredUuid,
      'rssi': rssi,
      'timestamp': timestamp.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      'distance_estimate': distanceEstimate,
      'sync_status': syncStatus,
    };
  }

  // ============ COPYITH ============

  BleEncounter copyWith({
    String? id,
    String? encounteredUuid,
    int? rssi,
    DateTime? timestamp,
    double? latitude,
    double? longitude,
    double? distanceEstimate,
    String? syncStatus,
  }) {
    return BleEncounter(
      id: id ?? this.id,
      encounteredUuid: encounteredUuid ?? this.encounteredUuid,
      rssi: rssi ?? this.rssi,
      timestamp: timestamp ?? this.timestamp,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceEstimate: distanceEstimate ?? this.distanceEstimate,
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }

  @override
  List<Object?> get props => [
    id, encounteredUuid, rssi, timestamp, latitude, longitude,
    distanceEstimate, syncStatus,
  ];

  // ============ HELPERS ============

  bool get isGood => rssi > -80;  // Strong signal
  bool get isWeak => rssi < -90;  // Weak signal
  
  String getSignalStrengthLabel() {
    if (rssi > -70) return 'Excellent';
    if (rssi > -80) return 'Good';
    if (rssi > -90) return 'Fair';
    return 'Poor';
  }
}
```

---

## Missing Report Model

**File**: `lib/models/missing_report.dart`

```dart
import 'package:equatable/equatable.dart';

class Clothing extends Equatable {
  final String? topColor;      // Red, Blue, Green, etc.
  final String? topType;       // T-shirt, Kurta, Saree, etc.
  final String? bottomColor;
  final String? bottomType;    // Pants, Shorts, Dhoti, Saree, etc.
  final String? footwear;      // Slippers, Shoes, Barefoot, etc.
  final String? extras;        // Jewelry, marks, tattoos, etc.

  const Clothing({
    this.topColor,
    this.topType,
    this.bottomColor,
    this.bottomType,
    this.footwear,
    this.extras,
  });

  factory Clothing.fromJson(Map<String, dynamic> json) {
    return Clothing(
      topColor: json['top_color'] as String?,
      topType: json['top_type'] as String?,
      bottomColor: json['bottom_color'] as String?,
      bottomType: json['bottom_type'] as String?,
      footwear: json['footwear'] as String?,
      extras: json['extras'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'top_color': topColor,
      'top_type': topType,
      'bottom_color': bottomColor,
      'bottom_type': bottomType,
      'footwear': footwear,
      'extras': extras,
    };
  }

  @override
  List<Object?> get props => [
    topColor, topType, bottomColor, bottomType, footwear, extras
  ];
}

class MissingReport extends Equatable {
  final String id;
  final String reporterId;
  final String personName;
  final int personAge;
  final String personGender;        // M, F, Other
  final String? photoUrl;
  final Clothing clothing;
  final String? build;              // Thin, Average, Heavy, Muscular
  final String? distinguishingFeatures;
  final String? languageSpoken;
  final String? medicalConditions;
  final double lastSeenLatitude;
  final double lastSeenLongitude;
  final DateTime lastSeenTime;
  final DateTime reportedAt;
  final String status;              // reported, escalated, resolved
  final int cascadeLevel;
  final int alertRadiusMeters;
  final DateTime? resolvedAt;
  final String? resolutionType;     // found, safe, other

  const MissingReport({
    required this.id,
    required this.reporterId,
    required this.personName,
    required this.personAge,
    required this.personGender,
    this.photoUrl,
    required this.clothing,
    this.build,
    this.distinguishingFeatures,
    this.languageSpoken,
    this.medicalConditions,
    required this.lastSeenLatitude,
    required this.lastSeenLongitude,
    required this.lastSeenTime,
    required this.reportedAt,
    this.status = 'reported',
    this.cascadeLevel = 1,
    this.alertRadiusMeters = 500,
    this.resolvedAt,
    this.resolutionType,
  });

  // ============ SERIALIZATION ============

  factory MissingReport.fromJson(Map<String, dynamic> json) {
    return MissingReport(
      id: json['id'] as String,
      reporterId: json['reporter_id'] as String,
      personName: json['person_name'] as String,
      personAge: json['person_age'] as int,
      personGender: json['person_gender'] as String,
      photoUrl: json['photo_url'] as String?,
      clothing: Clothing.fromJson(json['clothing'] as Map<String, dynamic>),
      build: json['build'] as String?,
      distinguishingFeatures: json['distinguishing_features'] as String?,
      languageSpoken: json['language_spoken'] as String?,
      medicalConditions: json['medical_conditions'] as String?,
      lastSeenLatitude: (json['last_seen_latitude'] as num).toDouble(),
      lastSeenLongitude: (json['last_seen_longitude'] as num).toDouble(),
      lastSeenTime: DateTime.parse(json['last_seen_time'] as String),
      reportedAt: DateTime.parse(json['reported_at'] as String),
      status: json['status'] as String? ?? 'reported',
      cascadeLevel: json['cascade_level'] as int? ?? 1,
      alertRadiusMeters: json['alert_radius_meters'] as int? ?? 500,
      resolvedAt: json['resolved_at'] != null
          ? DateTime.parse(json['resolved_at'] as String)
          : null,
      resolutionType: json['resolution_type'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reporter_id': reporterId,
      'person_name': personName,
      'person_age': personAge,
      'person_gender': personGender,
      'photo_url': photoUrl,
      'clothing': clothing.toJson(),
      'build': build,
      'distinguishing_features': distinguishingFeatures,
      'language_spoken': languageSpoken,
      'medical_conditions': medicalConditions,
      'last_seen_latitude': lastSeenLatitude,
      'last_seen_longitude': lastSeenLongitude,
      'last_seen_time': lastSeenTime.toIso8601String(),
      'reported_at': reportedAt.toIso8601String(),
      'status': status,
      'cascade_level': cascadeLevel,
      'alert_radius_meters': alertRadiusMeters,
      'resolved_at': resolvedAt?.toIso8601String(),
      'resolution_type': resolutionType,
    };
  }

  // ============ COPYITH ============

  MissingReport copyWith({
    String? id,
    String? reporterId,
    String? personName,
    int? personAge,
    String? personGender,
    String? photoUrl,
    Clothing? clothing,
    String? build,
    String? distinguishingFeatures,
    String? languageSpoken,
    String? medicalConditions,
    double? lastSeenLatitude,
    double? lastSeenLongitude,
    DateTime? lastSeenTime,
    DateTime? reportedAt,
    String? status,
    int? cascadeLevel,
    int? alertRadiusMeters,
    DateTime? resolvedAt,
    String? resolutionType,
  }) {
    return MissingReport(
      id: id ?? this.id,
      reporterId: reporterId ?? this.reporterId,
      personName: personName ?? this.personName,
      personAge: personAge ?? this.personAge,
      personGender: personGender ?? this.personGender,
      photoUrl: photoUrl ?? this.photoUrl,
      clothing: clothing ?? this.clothing,
      build: build ?? this.build,
      distinguishingFeatures: distinguishingFeatures ?? this.distinguishingFeatures,
      languageSpoken: languageSpoken ?? this.languageSpoken,
      medicalConditions: medicalConditions ?? this.medicalConditions,
      lastSeenLatitude: lastSeenLatitude ?? this.lastSeenLatitude,
      lastSeenLongitude: lastSeenLongitude ?? this.lastSeenLongitude,
      lastSeenTime: lastSeenTime ?? this.lastSeenTime,
      reportedAt: reportedAt ?? this.reportedAt,
      status: status ?? this.status,
      cascadeLevel: cascadeLevel ?? this.cascadeLevel,
      alertRadiusMeters: alertRadiusMeters ?? this.alertRadiusMeters,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolutionType: resolutionType ?? this.resolutionType,
    );
  }

  @override
  List<Object?> get props => [
    id, reporterId, personName, personAge, personGender, photoUrl, clothing,
    build, distinguishingFeatures, languageSpoken, medicalConditions,
    lastSeenLatitude, lastSeenLongitude, lastSeenTime, reportedAt,
    status, cascadeLevel, alertRadiusMeters, resolvedAt, resolutionType,
  ];

  // ============ HELPERS ============

  bool get isResolved => status == 'resolved' && resolvedAt != null;
  bool get isActive => !isResolved;
  
  Duration get timeSinceReport => DateTime.now().difference(reportedAt);
  
  String get personDescription => '$personName, $personAge years old ($personGender)';
  
  String getClothingDescription() {
    final parts = <String>[];
    if (clothing.topColor != null) parts.add('${clothing.topColor} ${clothing.topType ?? "top"}');
    if (clothing.bottomColor != null) parts.add('${clothing.bottomColor} ${clothing.bottomType ?? "bottom"}');
    if (clothing.footwear != null) parts.add(clothing.footwear!);
    return parts.isEmpty ? 'Clothing unknown' : parts.join(', ');
  }
}
```

---

## Witness Alert Model

**File**: `lib/models/witness_alert.dart`

```dart
import 'package:equatable/equatable.dart';

class WitnessAlert extends Equatable {
  final String id;
  final String missingReportId;
  final String witnessUserId;
  final String alertType;           // ble_witness, gps_radius
  final String alertText;
  final DateTime createdAt;
  final DateTime? notifiedAt;
  final bool userResponded;
  final String? responseText;       // yes, no, unsure
  final DateTime? respondedAt;

  const WitnessAlert({
    required this.id,
    required this.missingReportId,
    required this.witnessUserId,
    required this.alertType,
    required this.alertText,
    required this.createdAt,
    this.notifiedAt,
    this.userResponded = false,
    this.responseText,
    this.respondedAt,
  });

  factory WitnessAlert.fromJson(Map<String, dynamic> json) {
    return WitnessAlert(
      id: json['id'] as String,
      missingReportId: json['missing_report_id'] as String,
      witnessUserId: json['witness_user_id'] as String,
      alertType: json['alert_type'] as String,
      alertText: json['alert_text'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      notifiedAt: json['notified_at'] != null
          ? DateTime.parse(json['notified_at'] as String)
          : null,
      userResponded: json['user_responded'] as bool? ?? false,
      responseText: json['response_text'] as String?,
      respondedAt: json['responded_at'] != null
          ? DateTime.parse(json['responded_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'missing_report_id': missingReportId,
      'witness_user_id': witnessUserId,
      'alert_type': alertType,
      'alert_text': alertText,
      'created_at': createdAt.toIso8601String(),
      'notified_at': notifiedAt?.toIso8601String(),
      'user_responded': userResponded,
      'response_text': responseText,
      'responded_at': respondedAt?.toIso8601String(),
    };
  }

  WitnessAlert copyWith({
    String? id,
    String? missingReportId,
    String? witnessUserId,
    String? alertType,
    String? alertText,
    DateTime? createdAt,
    DateTime? notifiedAt,
    bool? userResponded,
    String? responseText,
    DateTime? respondedAt,
  }) {
    return WitnessAlert(
      id: id ?? this.id,
      missingReportId: missingReportId ?? this.missingReportId,
      witnessUserId: witnessUserId ?? this.witnessUserId,
      alertType: alertType ?? this.alertType,
      alertText: alertText ?? this.alertText,
      createdAt: createdAt ?? this.createdAt,
      notifiedAt: notifiedAt ?? this.notifiedAt,
      userResponded: userResponded ?? this.userResponded,
      responseText: responseText ?? this.responseText,
      respondedAt: respondedAt ?? this.respondedAt,
    );
  }

  @override
  List<Object?> get props => [
    id, missingReportId, witnessUserId, alertType, alertText, createdAt,
    notifiedAt, userResponded, responseText, respondedAt,
  ];

  bool get isBleAlert => alertType == 'ble_witness';
  bool get isAreaAlert => alertType == 'gps_radius';
  bool get isPending => !userResponded;
  bool get sawPerson => responseText == 'yes';
  bool get didntSeePerson => responseText == 'no';
}
```

---

## Sighting Model

**File**: `lib/models/sighting.dart`

```dart
import 'package:equatable/equatable.dart';

class Sighting extends Equatable {
  final String id;
  final String spotterUserId;
  final String? missingReportId;       // May be null if person not yet reported
  final String personType;             // child, adult, elderly
  final int? approxAge;
  final String gender;                 // M, F, Other
  final String behavior;               // crying, confused, wandering, etc
  final String? photoUrl;
  final double latitude;
  final double longitude;
  final String? notes;
  final DateTime createdAt;
  final double? matcherConfidence;     // 0-1, how well it matches reports

  const Sighting({
    required this.id,
    required this.spotterUserId,
    this.missingReportId,
    required this.personType,
    this.approxAge,
    required this.gender,
    required this.behavior,
    this.photoUrl,
    required this.latitude,
    required this.longitude,
    this.notes,
    required this.createdAt,
    this.matcherConfidence,
  });

  factory Sighting.fromJson(Map<String, dynamic> json) {
    return Sighting(
      id: json['id'] as String,
      spotterUserId: json['spotter_user_id'] as String,
      missingReportId: json['missing_report_id'] as String?,
      personType: json['person_type'] as String,
      approxAge: json['approx_age'] as int?,
      gender: json['gender'] as String,
      behavior: json['behavior'] as String,
      photoUrl: json['photo_url'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      matcherConfidence: (json['matcher_confidence'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'spotter_user_id': spotterUserId,
      'missing_report_id': missingReportId,
      'person_type': personType,
      'approx_age': approxAge,
      'gender': gender,
      'behavior': behavior,
      'photo_url': photoUrl,
      'latitude': latitude,
      'longitude': longitude,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'matcher_confidence': matcherConfidence,
    };
  }

  @override
  List<Object?> get props => [
    id, spotterUserId, missingReportId, personType, approxAge, gender,
    behavior, photoUrl, latitude, longitude, notes, createdAt, matcherConfidence,
  ];

  String get personDescription {
    final ageStr = approxAge != null ? ', ~$approxAge years' : '';
    final behaviorStr = behavior.replaceAll('_', ' ');
    return '$personType$ageStr ($gender) — $behaviorStr';
  }

  bool get isHighConfidenceMatch => (matcherConfidence ?? 0) > 0.7;
}
```

---

## Enums & Constants

**File**: `lib/models/enums.dart`

```dart
enum ReportStatus {
  reported('reported'),
  escalated('escalated'),
  resolved('resolved');

  final String value;
  const ReportStatus(this.value);

  factory ReportStatus.fromString(String value) {
    return ReportStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ReportStatus.reported,
    );
  }
}

enum AlertType {
  bleWitness('ble_witness'),
  gpsRadius('gps_radius');

  final String value;
  const AlertType(this.value);

  factory AlertType.fromString(String value) {
    return AlertType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => AlertType.gpsRadius,
    );
  }

  String get label {
    switch (this) {
      case AlertType.bleWitness:
        return 'Proximity Alert';
      case AlertType.gpsRadius:
        return 'Area Alert';
    }
  }
}

enum PersonType {
  child('child'),
  adult('adult'),
  elderly('elderly');

  final String value;
  const PersonType(this.value);
}

// Language options
const List<String> supportedLanguages = [
  'hindi',
  'english',
  'tamil',
  'telugu',
  'kannada',
  'marathi',
  'gujarati',
  'punjabi',
  'bengali',
  'odia',
  'maithili',
];

Map<String, String> languageNames = {
  'hindi': 'हिन्दी',
  'english': 'English',
  'tamil': 'தமிழ்',
  'telugu': 'తెలుగు',
  'kannada': 'ಕನ್ನಡ',
  'marathi': 'मराठी',
  'gujarati': 'ગુજરાતી',
  'punjabi': 'ਪੰਜਾਬੀ',
  'bengali': 'বাংলা',
  'odia': 'ଓଡ଼ିଆ',
  'maithili': 'मैथिली',
};
```

---

## Testing Models

**File**: `test/models/user_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:kumbhraksha/models/user.dart';

void main() {
  group('User Model', () {
    test('User.fromJson creates user correctly', () {
      final json = {
        'id': '123',
        'phone_number': '+919876543210',
        'language_preference': 'hindi',
        'fcm_token': 'token123',
        'is_onboarded': true,
        'created_at': '2026-06-27T10:00:00Z',
      };

      final user = User.fromJson(json);

      expect(user.id, equals('123'));
      expect(user.phoneNumber, equals('+919876543210'));
      expect(user.languagePreference, equals('hindi'));
      expect(user.fcmToken, equals('token123'));
      expect(user.isOnboarded, isTrue);
    });

    test('User.toJson serializes correctly', () {
      final user = User(
        id: '123',
        phoneNumber: '+919876543210',
        languagePreference: 'english',
        fcmToken: null,
        isOnboarded: false,
        createdAt: DateTime(2026, 6, 27),
      );

      final json = user.toJson();

      expect(json['id'], equals('123'));
      expect(json['phone_number'], equals('+919876543210'));
      expect(json['language_preference'], equals('english'));
      expect(json['fcm_token'], isNull);
    });

    test('User equality works correctly', () {
      final user1 = User(
        id: '123',
        phoneNumber: '+919876543210',
        languagePreference: 'hindi',
        isOnboarded: false,
        createdAt: DateTime(2026, 6, 27),
      );

      final user2 = User(
        id: '123',
        phoneNumber: '+919876543210',
        languagePreference: 'hindi',
        isOnboarded: false,
        createdAt: DateTime(2026, 6, 27),
      );

      expect(user1, equals(user2));
    });

    test('copyWith creates new instance with updated fields', () {
      final user = User(
        id: '123',
        phoneNumber: '+919876543210',
        languagePreference: 'hindi',
        isOnboarded: false,
        createdAt: DateTime(2026, 6, 27),
      );

      final updatedUser = user.copyWith(isOnboarded: true);

      expect(updatedUser.isOnboarded, isTrue);
      expect(updatedUser.id, equals(user.id));
      expect(updatedUser == user, isFalse);
    });
  });
}
```

---

## Summary

All models follow this pattern:

1. **Constructor** — Immutable with required fields
2. **Serialization** — `fromJson()` and `toJson()`
3. **Comparison** — `copyWith()` and equality
4. **Database** — `toMap()` and `fromMap()` (if stored locally)
5. **Helpers** — Computed properties, formatting methods
6. **Tests** — Unit tests for serialization

---

**Last Updated**: 2026-06-27
