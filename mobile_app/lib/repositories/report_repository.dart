import 'dart:convert';

import 'package:uuid/uuid.dart';

import '../core/constants/api_constants.dart';
import '../core/utils/app_logger.dart';
import '../models/missing_report.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';

/// Submits missing-person reports. Falls back to a local pending queue when the
/// network/backend is unavailable so reports are never lost.
class ReportRepository {
  ReportRepository(this._api, this._db, {this.mockMode = true});

  final ApiService _api;
  final DatabaseService _db;
  final bool mockMode;

  /// Returns the report id and a (simulated) witness count.
  Future<({String reportId, int witnessCount})> submit(
      MissingReport report) async {
    if (mockMode) {
      appLogger.i('Mock report submitted: ${report.personName}');
      await Future<void>.delayed(const Duration(milliseconds: 600));
      return (reportId: report.id, witnessCount: 3);
    }
    try {
      final res = await _api.post(ApiConstants.reports, data: report.toJson());
      final data = res.data as Map<String, dynamic>;
      return (
        reportId: data['id'] as String,
        witnessCount: (data['witness_count'] as int?) ?? 0,
      );
    } catch (e) {
      appLogger.w('Report submit failed, queued offline: $e');
      await _queueOffline(report);
      return (reportId: report.id, witnessCount: 0);
    }
  }

  Future<void> _queueOffline(MissingReport report) async {
    final db = await _db.database;
    await db.insert('pending_reports', {
      'id': report.id,
      'report_json': jsonEncode(report.toJson()),
      'created_at': DateTime.now().toIso8601String(),
      'synced_at': null,
    });
  }

  static String newReportId() => const Uuid().v4();
}
