import 'package:equatable/equatable.dart';

class Sighting extends Equatable {
  final String id;
  final String spotterUserId;
  final String? missingReportId;
  final String personType; // child, adult, elderly
  final int? approxAge;
  final String gender;
  final String behavior;
  final String? photoUrl;
  final double latitude;
  final double longitude;
  final String? notes;
  final DateTime createdAt;
  final double? matcherConfidence;

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

  factory Sighting.fromJson(Map<String, dynamic> json) => Sighting(
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

  Map<String, dynamic> toJson() => {
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
