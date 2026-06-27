import 'package:flutter/foundation.dart';

import '../../../../services/location_service.dart';
import '../../domain/map_marker.dart';

/// Holds map markers, layer visibility and the user's location for the active
/// alerts map. Mock data until the backend feed is wired.
class MapProvider extends ChangeNotifier {
  MapProvider(this._location);
  final LocationService _location;

  // Map centred near Prayagraj (Kumbh Mela) by default.
  double centerLat = 25.4358;
  double centerLng = 81.8463;
  double? userLat;
  double? userLng;

  bool loading = false;
  final List<MapMarkerData> _all = [];

  final Map<MarkerKind, bool> layers = {
    MarkerKind.missing: true,
    MarkerKind.sighting: true,
    MarkerKind.cctv: false,
  };

  bool showDensity = false;

  List<MapMarkerData> get visibleMarkers =>
      _all.where((m) => layers[m.kind] ?? false).toList();

  void toggleLayer(MarkerKind kind) {
    layers[kind] = !(layers[kind] ?? false);
    notifyListeners();
  }

  void toggleDensity() {
    showDensity = !showDensity;
    notifyListeners();
  }

  Future<void> load() async {
    loading = true;
    notifyListeners();

    final pos = await _location.getCurrentLocation();
    if (pos != null) {
      userLat = pos.latitude;
      userLng = pos.longitude;
      centerLat = pos.latitude;
      centerLng = pos.longitude;
    }

    _all
      ..clear()
      ..addAll(_mock(centerLat, centerLng));

    loading = false;
    notifyListeners();
  }

  void recenterOnUser() {
    if (userLat != null && userLng != null) {
      centerLat = userLat!;
      centerLng = userLng!;
      notifyListeners();
    }
  }

  List<MapMarkerData> _mock(double lat, double lng) {
    final now = DateTime.now();
    return [
      MapMarkerData(
        id: 'm1',
        kind: MarkerKind.missing,
        latitude: lat + 0.0012,
        longitude: lng - 0.0009,
        title: 'Arthur Pendelton',
        subtitle: 'Last seen near Centennial Park wearing a grey coat and blue scarf....',
        radiusMeters: 500,
        time: now.subtract(const Duration(hours: 2)),
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      ),
      MapMarkerData(
        id: 'm2',
        kind: MarkerKind.missing,
        latitude: lat - 0.0018,
        longitude: lng + 0.0016,
        title: 'Maya Lin',
        subtitle: 'Last seen near Sector 4 food stall wearing a red jacket.',
        radiusMeters: 1200,
        time: now.subtract(const Duration(minutes: 48)),
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      ),
      MapMarkerData(
        id: 's1',
        kind: MarkerKind.sighting,
        latitude: lat + 0.0006,
        longitude: lng + 0.0011,
        title: 'Child seen wandering',
        subtitle: 'Confidence 82% • 4 min ago',
        time: now.subtract(const Duration(minutes: 4)),
      ),
      MapMarkerData(
        id: 's2',
        kind: MarkerKind.sighting,
        latitude: lat - 0.0009,
        longitude: lng - 0.0014,
        title: 'Elderly woman, confused',
        subtitle: 'Confidence 66% • 12 min ago',
        time: now.subtract(const Duration(minutes: 12)),
      ),
      MapMarkerData(
        id: 'c1',
        kind: MarkerKind.cctv,
        latitude: lat + 0.0019,
        longitude: lng + 0.0004,
        title: 'CCTV — Sector 4 gate',
        subtitle: 'Live feed available',
      ),
    ];
  }
}
