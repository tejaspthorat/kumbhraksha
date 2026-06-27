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
    if (page >= 3) return [];
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    return List.generate(pageSize, (i) {
      final n = page * pageSize + i;
      if (n == 0) {
        return WitnessAlert(
          id: 'a-0',
          missingReportId: 'r-0',
          witnessUserId: 'me',
          alertType: 'ble_witness',
          alertText: 'Last seen wearing a blue windbreaker, khaki pants, and a green baseball cap. He has mild...',
          createdAt: DateTime(today.year, today.month, today.day, 14, 30),
          personName: 'Arthur Pendelton',
          photoUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?fit=crop&w=600&h=600',
          age: 78,
          gender: 'Male',
          distanceText: '2.4 km away',
          statusText: 'Active Search',
        );
      } else if (n == 1) {
        return WitnessAlert(
          id: 'a-1',
          missingReportId: 'r-1',
          witnessUserId: 'me',
          alertType: 'gps_radius',
          alertText: 'Left school at 3 PM but didn\'t return home. Carrying a yellow backpack. Wearing a black...',
          createdAt: DateTime(yesterday.year, yesterday.month, yesterday.day, 15, 15),
          personName: 'Maya Lin',
          photoUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?fit=crop&w=600&h=600',
          age: 14,
          gender: 'Female',
          distanceText: '5.1 km away',
          statusText: null,
        );
      }

      final ble = n.isEven;
      return WitnessAlert(
        id: 'a-$n',
        missingReportId: 'r-$n',
        witnessUserId: 'me',
        alertType: ble ? 'ble_witness' : 'gps_radius',
        alertText: ble
            ? 'Wearing a white kurta pyjama, last seen near the main entrance gate.'
            : 'Missing person last seen near the bathing ghat. Speaks only Hindi.',
        createdAt: now.subtract(Duration(hours: n * 2)),
        personName: ble ? 'Rajesh Kumar' : 'Sita Devi',
        photoUrl: ble
            ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=600&h=600'
            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=600&h=600',
        age: ble ? 45 : 68,
        gender: ble ? 'Male' : 'Female',
        distanceText: '${1.2 + (n * 0.5)} km away',
        statusText: ble ? 'Active Search' : null,
      );
    });
  }

  static String newId() => const Uuid().v4();
}
