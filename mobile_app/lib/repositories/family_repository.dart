import 'dart:convert';

import '../models/family_group.dart';
import '../services/storage_service.dart';

/// Persists the user's family members locally (shared preferences) so reports
/// can be pre-filled. A single implicit group is used per device.
class FamilyRepository {
  FamilyRepository(this._storage);
  final StorageService _storage;

  static const _key = 'family_members';

  Future<List<FamilyMember>> getMembers() async {
    final raw = await _storage.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<FamilyMember> members) async {
    final raw = jsonEncode(members.map((e) => e.toJson()).toList());
    await _storage.setString(_key, raw);
  }

  Future<List<FamilyMember>> upsert(FamilyMember member) async {
    final members = await getMembers();
    final i = members.indexWhere((m) => m.id == member.id);
    if (i == -1) {
      members.add(member);
    } else {
      members[i] = member;
    }
    await _save(members);
    return members;
  }

  Future<List<FamilyMember>> remove(String id) async {
    final members = await getMembers();
    members.removeWhere((m) => m.id == id);
    await _save(members);
    return members;
  }
}
