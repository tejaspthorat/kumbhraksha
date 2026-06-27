import 'package:geolocator/geolocator.dart';

import '../core/constants/app_constants.dart';
import '../core/utils/app_logger.dart';
import 'storage_service.dart';

/// GPS access with permission handling and last-known-location caching.
class LocationService {
  LocationService(this._storage);
  final StorageService _storage;

  Future<bool> requestPermissions() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<Position?> getCurrentLocation() async {
    try {
      if (!await requestPermissions()) return _cached();
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      await _storage.setDouble(AppConstants.keyLastLat, pos.latitude);
      await _storage.setDouble(AppConstants.keyLastLng, pos.longitude);
      return pos;
    } catch (e) {
      appLogger.e('getCurrentLocation failed', error: e);
      return _cached();
    }
  }

  Future<Position?> _cached() async {
    final lat = await _storage.getDouble(AppConstants.keyLastLat);
    final lng = await _storage.getDouble(AppConstants.keyLastLng);
    if (lat == null || lng == null) return null;
    return Position(
      latitude: lat,
      longitude: lng,
      timestamp: DateTime.now(),
      accuracy: 0,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      headingAccuracy: 0,
      speed: 0,
      speedAccuracy: 0,
    );
  }

  Stream<Position> get locationStream => Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      );
}
