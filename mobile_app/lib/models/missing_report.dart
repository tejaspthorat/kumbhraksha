import 'package:equatable/equatable.dart';

class Clothing extends Equatable {
  final String? topColor;
  final String? topType;
  final String? bottomColor;
  final String? bottomType;
  final String? footwear;
  final String? extras;

  const Clothing({
    this.topColor,
    this.topType,
    this.bottomColor,
    this.bottomType,
    this.footwear,
    this.extras,
  });

  factory Clothing.fromJson(Map<String, dynamic> json) => Clothing(
        topColor: json['top_color'] as String?,
        topType: json['top_type'] as String?,
        bottomColor: json['bottom_color'] as String?,
        bottomType: json['bottom_type'] as String?,
        footwear: json['footwear'] as String?,
        extras: json['extras'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'top_color': topColor,
        'top_type': topType,
        'bottom_color': bottomColor,
        'bottom_type': bottomType,
        'footwear': footwear,
        'extras': extras,
      };

  Clothing copyWith({
    String? topColor,
    String? topType,
    String? bottomColor,
    String? bottomType,
    String? footwear,
    String? extras,
  }) =>
      Clothing(
        topColor: topColor ?? this.topColor,
        topType: topType ?? this.topType,
        bottomColor: bottomColor ?? this.bottomColor,
        bottomType: bottomType ?? this.bottomType,
        footwear: footwear ?? this.footwear,
        extras: extras ?? this.extras,
      );

  @override
  List<Object?> get props =>
      [topColor, topType, bottomColor, bottomType, footwear, extras];
}

class MissingReport extends Equatable {
  final String id;
  final String reporterId;
  final String personName;
  final int personAge;
  final String personGender;
  final String? photoUrl;
  final Clothing clothing;
  final String? build;
  final String? distinguishingFeatures;
  final String? languageSpoken;
  final String? medicalConditions;
  final double lastSeenLatitude;
  final double lastSeenLongitude;
  final DateTime lastSeenTime;
  final DateTime reportedAt;
  final String status;
  final int cascadeLevel;
  final int alertRadiusMeters;
  final DateTime? resolvedAt;
  final String? resolutionType;

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

  factory MissingReport.fromJson(Map<String, dynamic> json) => MissingReport(
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

  Map<String, dynamic> toJson() => {
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

  @override
  List<Object?> get props => [
        id, reporterId, personName, personAge, personGender, photoUrl, clothing,
        build, distinguishingFeatures, languageSpoken, medicalConditions,
        lastSeenLatitude, lastSeenLongitude, lastSeenTime, reportedAt,
        status, cascadeLevel, alertRadiusMeters, resolvedAt, resolutionType,
      ];

  bool get isResolved => status == 'resolved' && resolvedAt != null;
  bool get isActive => !isResolved;

  Duration get timeSinceReport => DateTime.now().difference(reportedAt);

  String get personDescription =>
      '$personName, $personAge years old ($personGender)';

  String getClothingDescription() {
    final parts = <String>[];
    if (clothing.topColor != null) {
      parts.add('${clothing.topColor} ${clothing.topType ?? "top"}');
    }
    if (clothing.bottomColor != null) {
      parts.add('${clothing.bottomColor} ${clothing.bottomType ?? "bottom"}');
    }
    if (clothing.footwear != null) parts.add(clothing.footwear!);
    return parts.isEmpty ? 'Clothing unknown' : parts.join(', ');
  }
}
