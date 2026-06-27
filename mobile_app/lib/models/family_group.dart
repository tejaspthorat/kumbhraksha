import 'package:equatable/equatable.dart';

class FamilyMember extends Equatable {
  final String id;
  final String name;
  final int? age;
  final String? gender;
  final String? phoneNumber;
  final String? photoUrl;

  const FamilyMember({
    required this.id,
    required this.name,
    this.age,
    this.gender,
    this.phoneNumber,
    this.photoUrl,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) => FamilyMember(
        id: json['id'] as String,
        name: json['name'] as String,
        age: json['age'] as int?,
        gender: json['gender'] as String?,
        phoneNumber: json['phone_number'] as String?,
        photoUrl: json['photo_url'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'age': age,
        'gender': gender,
        'phone_number': phoneNumber,
        'photo_url': photoUrl,
      };

  @override
  List<Object?> get props => [id, name, age, gender, phoneNumber, photoUrl];
}

class FamilyGroup extends Equatable {
  final String id;
  final String ownerUserId;
  final String groupName;
  final List<FamilyMember> members;
  final DateTime createdAt;

  const FamilyGroup({
    required this.id,
    required this.ownerUserId,
    required this.groupName,
    this.members = const [],
    required this.createdAt,
  });

  factory FamilyGroup.fromJson(Map<String, dynamic> json) => FamilyGroup(
        id: json['id'] as String,
        ownerUserId: json['owner_user_id'] as String,
        groupName: json['group_name'] as String,
        members: (json['members'] as List<dynamic>? ?? [])
            .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'owner_user_id': ownerUserId,
        'group_name': groupName,
        'members': members.map((e) => e.toJson()).toList(),
        'created_at': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, ownerUserId, groupName, members, createdAt];
}
