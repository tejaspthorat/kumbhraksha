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

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone_number': phoneNumber,
        'language_preference': languagePreference,
        'fcm_token': fcmToken,
        'ble_rotating_uuid': bleRotatingUuid,
        'is_onboarded': isOnboarded,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
      };

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

  bool get isComplete => isOnboarded && fcmToken != null;

  String getDisplayName() => 'User $phoneNumber';
}
