import 'package:uuid/uuid.dart';

import '../core/utils/app_logger.dart';
import '../models/sighting.dart';
import '../models/witness_alert.dart';
import '../services/api_service.dart';

/// Fetches the alert feed and submits responses, sightings and witness memories.
///
/// Defaults to [mockMode] so the feed is populated and interactive without the
/// Phase 2 backend. Real endpoints are wired behind the same methods.
class AlertsRepository {
  AlertsRepository(this._api, {this.mockMode = true});

  final ApiService _api;
  final bool mockMode;

  Future<List<WitnessAlert>> getAlerts({int page = 0, int pageSize = 10}) async {
    if (mockMode) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return _mockPage(page, pageSize);
    }
    final res = await _api.get('/alerts',
        query: {'page': page, 'page_size': pageSize});
    final list = (res.data['alerts'] as List<dynamic>);
    return list
        .map((e) => WitnessAlert.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> respond(String alertId, String response) async {
    if (mockMode) {
      appLogger.i('Mock respond to $alertId: $response');
      return;
    }
    await _api.post('/alerts/$alertId/respond', data: {'response': response});
  }

  Future<void> submitSighting(Sighting sighting) async {
    if (mockMode) {
      appLogger.i('Mock sighting submitted for ${sighting.missingReportId}');
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return;
    }
    await _api.post('/sightings', data: sighting.toJson());
  }

  Future<void> submitWitnessMemory({
    required String missingReportId,
    required DateTime seenAt,
    String? direction,
    String? notes,
  }) async {
    final payload = {
      'missing_report_id': missingReportId,
      'seen_at': seenAt.toIso8601String(),
      'direction': direction,
      'notes': notes,
    };
    if (mockMode) {
      appLogger.i('Mock witness memory: $payload');
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return;
    }
    await _api.post('/witness-memories', data: payload);
  }

  List<WitnessAlert> _mockPage(int page, int pageSize) {
    // Three pages of demo data, then empty (end of feed).
    if (page >= 3) return [];
    final now = DateTime.now();
    return List.generate(pageSize, (i) {
      final n = page * pageSize + i;
      final ble = n.isEven;
      return WitnessAlert(
        id: 'a-$n',
        missingReportId: 'r-$n',
        witnessUserId: 'me',
        alertType: ble ? 'ble_witness' : 'gps_radius',
        alertText: ble
            ? 'You were near this person around ${(now.hour) % 12 + 1}:${(n * 7) % 60} today.'
            : 'Missing person last seen ${100 + n * 20}m from your location.',
        createdAt: now.subtract(Duration(minutes: n * 6)),
        personName: ble ? 'Witness case #$n' : 'Area case #$n',
      );
    });
  }

  static String newId() => const Uuid().v4();
}
