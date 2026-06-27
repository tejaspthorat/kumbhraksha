import 'package:sqflite/sqflite.dart';

import '../core/utils/app_logger.dart';
import '../models/ble_encounter.dart';
import '../services/database_service.dart';

/// CRUD + rolling-window queries for BLE encounters.
class EncounterRepository {
  EncounterRepository(this._db);
  final DatabaseService _db;

  Future<BleEncounter> add(BleEncounter encounter) async {
    final db = await _db.database;
    await db.insert('encounters', encounter.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
    return encounter;
  }

  Future<List<BleEncounter>> getInWindow(Duration window,
      {DateTime? beforeTime}) async {
    final db = await _db.database;
    final before = beforeTime ?? DateTime.now();
    final after = before.subtract(window);
    final rows = await db.query(
      'encounters',
      where: 'timestamp > ? AND timestamp <= ?',
      whereArgs: [after.toIso8601String(), before.toIso8601String()],
      orderBy: 'timestamp DESC',
    );
    return rows.map(BleEncounter.fromMap).toList();
  }

  Future<List<BleEncounter>> getUnsynced() async {
    final db = await _db.database;
    final rows = await db.query('encounters',
        where: 'sync_status = ?', whereArgs: ['pending'], orderBy: 'timestamp DESC');
    return rows.map(BleEncounter.fromMap).toList();
  }

  Future<int> pendingCount() async {
    final db = await _db.database;
    final r = await db
        .rawQuery("SELECT COUNT(*) c FROM encounters WHERE sync_status = 'pending'");
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<void> markSynced(List<String> ids) async {
    if (ids.isEmpty) return;
    final db = await _db.database;
    final placeholders = List.filled(ids.length, '?').join(',');
    await db.rawUpdate(
        "UPDATE encounters SET sync_status = 'synced' WHERE id IN ($placeholders)",
        ids);
  }

  Future<void> deleteOlderThan(DateTime cutoff) async {
    final db = await _db.database;
    final n = await db.delete('encounters',
        where: 'timestamp < ?', whereArgs: [cutoff.toIso8601String()]);
    appLogger.d('Cleaned $n old encounters');
  }
}
