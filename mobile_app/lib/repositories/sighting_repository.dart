import 'package:uuid/uuid.dart';

import '../core/utils/app_logger.dart';
import '../models/sighting.dart';
import '../services/api_service.dart';

/// Submits proactive sightings ("someone looks lost") and lists recent ones for
/// the map. Defaults to [mockMode] so it works without the backend.
class SightingRepository {
  SightingRepository(this._api, {this.mockMode = true});

  final ApiService _api;
  final bool mockMode;

  Future<Sighting> submit(Sighting sighting) async {
    if (mockMode) {
      appLogger.i('Mock proactive sighting: ${sighting.personDescription}');
      await Future<void>.delayed(const Duration(milliseconds: 600));
      // Simulate a match confidence from the backend matcher.
      return sighting;
    }
    final res = await _api.post('/sightings', data: sighting.toJson());
    return Sighting.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Sighting>> recent({double? lat, double? lng}) async {
    if (mockMode) {
      final now = DateTime.now();
      return List.generate(4, (i) {
        return Sighting(
          id: 's-$i',
          spotterUserId: 'u$i',
          personType: ['child', 'elderly', 'adult', 'child'][i],
          gender: ['M', 'F', 'F', 'M'][i],
          behavior: ['crying', 'confused', 'wandering', 'sitting'][i],
          latitude: (lat ?? 25.4358) + (i - 2) * 0.0015,
          longitude: (lng ?? 81.8463) + (i - 1) * 0.0018,
          createdAt: now.subtract(Duration(minutes: i * 11)),
          matcherConfidence: [0.82, 0.41, 0.66, 0.9][i],
        );
      });
    }
    final res = await _api.get('/sightings/recent',
        query: {'lat': lat, 'lng': lng});
    return (res.data['sightings'] as List<dynamic>)
        .map((e) => Sighting.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static String newId() => const Uuid().v4();
}
