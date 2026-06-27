import 'package:uuid/uuid.dart';

import '../core/constants/api_constants.dart';
import '../core/utils/app_logger.dart';
import '../models/sighting.dart';
import '../models/witness_alert.dart';
import '../services/api_service.dart';
import 'missing_api_mapper.dart';

/// Fetches the alert feed and submits responses, sightings and witness memories.
///
/// Reads the live, geo-sorted feed of active missing-person reports from the
/// Express backend (`GET /api/missing/feed`) and maps each report into the
/// feed's witness-alert view model. When [mockMode] is true — or the backend is
/// unreachable — it falls back to a seeded feed so the screen stays populated
/// and interactive offline.
class AlertsRepository {
  AlertsRepository(this._api, {this.mockMode = false});

  final ApiService _api;
  final bool mockMode;

  /// The backend feed is not paginated: it returns every active report sorted
  /// by proximity. We surface it all on the first page and report no more.
  Future<List<WitnessAlert>> getAlerts({
    int page = 0,
    int pageSize = 10,
    double? lat,
    double? lng,
  }) async {
    if (mockMode) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return _mockPage(page, pageSize);
    }
    if (page > 0) return const [];
    try {
      final res = await _api.get(
        ApiConstants.missingFeed,
        query: {if (lat != null) 'lat': lat, if (lng != null) 'lng': lng},
      );
      final items = (res.data['items'] as List<dynamic>);
      return items
          .map((e) =>
              MissingApiMapper.alertFromFeedItem(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      appLogger.w('Feed fetch failed, falling back to seeded feed: $e');
      return _mockPage(page, pageSize);
    }
  }

  /// Marking an alert seen/not-seen is a local optimistic action — the backend
  /// records engagement implicitly through the sightings a witness submits.
  Future<void> respond(String alertId, String response) async {
    appLogger.i('Respond to $alertId: $response');
  }

  Future<void> submitSighting(Sighting sighting) async {
    if (mockMode) {
      appLogger.i('Mock sighting submitted for ${sighting.missingReportId}');
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return;
    }
    await _api.post(
      ApiConstants.sightings,
      data: MissingApiMapper.sightingToBackend(sighting),
    );
  }

  /// "I was there" memories map to a citizen sighting at the witness's location
  /// linked to the report — the backend's sole sighting-intake endpoint.
  Future<void> submitWitnessMemory({
    required String missingReportId,
    required DateTime seenAt,
    String? direction,
    String? notes,
    double? lat,
    double? lng,
  }) async {
    if (mockMode || lat == null || lng == null) {
      appLogger.i('Mock witness memory for $missingReportId');
      await Future<void>.delayed(const Duration(milliseconds: 500));
      return;
    }
    await _api.post(ApiConstants.sightings, data: {
      'missingReportId': missingReportId,
      'lat': lat,
      'lng': lng,
      'description': [
        if (direction != null) 'Heading $direction',
        if (notes != null) notes,
      ].join(' — '),
    });
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
