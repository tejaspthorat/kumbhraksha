import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../models/family_group.dart';
import '../repositories/family_repository.dart';

/// Manages the local family-member registry (max 10 members per the spec).
class FamilyProvider extends ChangeNotifier {
  FamilyProvider(this._repo);
  final FamilyRepository _repo;

  static const int maxMembers = 10;

  List<FamilyMember> members = [];
  bool loading = false;

  bool get isFull => members.length >= maxMembers;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    members = await _repo.getMembers();
    loading = false;
    notifyListeners();
  }

  Future<void> save({
    String? id,
    required String name,
    int? age,
    String? gender,
    String? phoneNumber,
    String? photoUrl,
  }) async {
    final member = FamilyMember(
      id: id ?? const Uuid().v4(),
      name: name.trim(),
      age: age,
      gender: gender,
      phoneNumber: phoneNumber,
      photoUrl: photoUrl,
    );
    members = await _repo.upsert(member);
    notifyListeners();
  }

  Future<void> delete(String id) async {
    members = await _repo.remove(id);
    notifyListeners();
  }
}
