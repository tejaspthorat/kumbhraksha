import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/constants/ble_constants.dart';
import '../models/ble_encounter.dart';
import '../repositories/encounter_repository.dart';
import '../services/ble_service.dart';

/// Exposes BLE scanning state and the recent encounter list to the UI.
class BleProvider extends ChangeNotifier {
  BleProvider(this._service, this._repo);

  final BleService _service;
  final EncounterRepository _repo;

  StreamSubscription<BleEncounter>? _sub;
  Timer? _cleanupTimer;

  bool isActive = false;
  bool permissionGranted = false;
  final List<BleEncounter> recent = [];

  int get encounterCount => recent.length;

  Future<bool> ensurePermissions() async {
    permissionGranted = await _service.requestPermissions();
    notifyListeners();
    return permissionGranted;
  }

  Future<void> start({double latitude = 0, double longitude = 0}) async {
    if (isActive) return;
    if (!permissionGranted && !await ensurePermissions()) return;

    isActive = true;
    notifyListeners();

    _sub = _service.discoveredDevices.listen((e) async {
      await _repo.add(e);
      recent.insert(0, e);
      if (recent.length > 50) recent.removeRange(50, recent.length);
      notifyListeners();
    });

    await _service.startScanning(latitude: latitude, longitude: longitude);

    _cleanupTimer ??= Timer.periodic(BleConstants.cleanupInterval, (_) {
      _repo.deleteOlderThan(DateTime.now().subtract(BleConstants.encounterWindow));
    });
  }

  Future<void> stop() async {
    await _service.stopScanning();
    await _sub?.cancel();
    _sub = null;
    isActive = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _cleanupTimer?.cancel();
    _sub?.cancel();
    super.dispose();
  }
}
