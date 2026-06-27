import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/constants/api_constants.dart';
import '../models/sighting.dart';
import '../models/witness_alert.dart';
import '../repositories/alerts_repository.dart';
import '../services/location_service.dart';
import '../services/websocket_service.dart';

enum FeedStatus { initial, loading, loaded, error }

/// Paginated, real-time alert feed. Loads pages on demand and prepends live
/// alerts pushed over the WebSocket.
class AlertsFeedProvider extends ChangeNotifier {
  AlertsFeedProvider(this._repo, this._ws, this._location);

  final AlertsRepository _repo;
  final WebSocketService _ws;
  final LocationService _location;

  StreamSubscription<WitnessAlert>? _wsSub;

  bool get isConnected => _ws.isConnected;

  FeedStatus status = FeedStatus.initial;
  String? errorMessage;
  final List<WitnessAlert> alerts = [];
  bool hasMore = true;
  bool _loadingMore = false;
  int _page = 0;

  Future<void> init() async {
    await _connectRealtime();
    await refresh();
  }

  Future<void> _connectRealtime() async {
    await _ws.connect(ApiConstants.baseUrl, token: null);
    _wsSub ??= _ws.alerts.listen((alert) {
      alerts.insert(0, alert);
      notifyListeners();
    });
  }

  Future<void> refresh() async {
    status = FeedStatus.loading;
    notifyListeners();
    try {
      _page = 0;
      hasMore = true;
      final first = await _repo.getAlerts(page: _page);
      alerts
        ..clear()
        ..addAll(first);
      hasMore = first.isNotEmpty;
      status = FeedStatus.loaded;
    } catch (e) {
      errorMessage = e.toString();
      status = FeedStatus.error;
    }
    notifyListeners();
  }

  Future<void> loadMore() async {
    if (_loadingMore || !hasMore || status != FeedStatus.loaded) return;
    _loadingMore = true;
    try {
      final next = await _repo.getAlerts(page: ++_page);
      if (next.isEmpty) {
        hasMore = false;
      } else {
        alerts.addAll(next);
      }
      notifyListeners();
    } catch (_) {
      _page--; // allow retry
    } finally {
      _loadingMore = false;
    }
  }

  Future<void> respond(String alertId, String response) async {
    final i = alerts.indexWhere((a) => a.id == alertId);
    if (i == -1) return;
    alerts[i] = alerts[i].copyWith(userResponded: true, responseText: response);
    notifyListeners();
    await _repo.respond(alertId, response);
  }

  /// Submits an "I See Them" sighting and marks the alert responded.
  Future<void> submitSighting({
    required WitnessAlert alert,
    required String personType,
    required String gender,
    required String behavior,
    String? photoPath,
    String? notes,
    bool shareLocation = true,
    double? confidence,
  }) async {
    double lat = 0, lng = 0;
    if (shareLocation) {
      final pos = await _location.getCurrentLocation();
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
      }
    }
    final sighting = Sighting(
      id: AlertsRepository.newId(),
      spotterUserId: 'me',
      missingReportId: alert.missingReportId,
      personType: personType,
      gender: gender,
      behavior: behavior,
      photoUrl: photoPath,
      latitude: lat,
      longitude: lng,
      notes: notes,
      createdAt: DateTime.now(),
      matcherConfidence: confidence,
    );
    await _repo.submitSighting(sighting);
    await respond(alert.id, 'yes');
  }

  /// Submits an "I Was There" witness memory and marks the alert responded.
  Future<void> submitWitnessMemory({
    required WitnessAlert alert,
    required DateTime seenAt,
    String? direction,
    String? notes,
  }) async {
    await _repo.submitWitnessMemory(
      missingReportId: alert.missingReportId,
      seenAt: seenAt,
      direction: direction,
      notes: notes,
    );
    await respond(alert.id, 'yes');
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    super.dispose();
  }
}
