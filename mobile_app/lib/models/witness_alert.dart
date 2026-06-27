import 'package:equatable/equatable.dart';

class WitnessAlert extends Equatable {
  final String id;
  final String missingReportId;
  final String witnessUserId;
  final String alertType; // ble_witness, gps_radius
  final String alertText;
  final DateTime createdAt;
  final DateTime? notifiedAt;
  final bool userResponded;
  final String? responseText; // yes, no, unsure
  final DateTime? respondedAt;

  // Denormalized for feed display (optional).
  final String? personName;
  final String? photoUrl;

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
    this.personName,
    this.photoUrl,
  });

  factory WitnessAlert.fromJson(Map<String, dynamic> json) => WitnessAlert(
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
        personName: json['person_name'] as String?,
        photoUrl: json['photo_url'] as String?,
      );

  Map<String, dynamic> toJson() => {
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
        'person_name': personName,
        'photo_url': photoUrl,
      };

  WitnessAlert copyWith({
    bool? userResponded,
    String? responseText,
    DateTime? respondedAt,
  }) =>
      WitnessAlert(
        id: id,
        missingReportId: missingReportId,
        witnessUserId: witnessUserId,
        alertType: alertType,
        alertText: alertText,
        createdAt: createdAt,
        notifiedAt: notifiedAt,
        userResponded: userResponded ?? this.userResponded,
        responseText: responseText ?? this.responseText,
        respondedAt: respondedAt ?? this.respondedAt,
        personName: personName,
        photoUrl: photoUrl,
      );

  @override
  List<Object?> get props => [
        id, missingReportId, witnessUserId, alertType, alertText, createdAt,
        notifiedAt, userResponded, responseText, respondedAt, personName, photoUrl,
      ];

  bool get isBleAlert => alertType == 'ble_witness';
  bool get isAreaAlert => alertType == 'gps_radius';
  bool get isPending => !userResponded;
  bool get sawPerson => responseText == 'yes';
}
