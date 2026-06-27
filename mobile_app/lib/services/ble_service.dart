import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:uuid/uuid.dart';

import '../core/constants/ble_constants.dart';
import '../core/utils/app_logger.dart';
import '../core/utils/distance_calculator.dart';
import '../models/ble_encounter.dart';

/// Handles BLE scanning + encounter emission.
///
/// NOTE: `flutter_blue_plus` is central-only and cannot advertise (peripheral
/// mode). [startAdvertising] is therefore a logged stub — a dedicated
/// peripheral plugin (e.g. `flutter_ble_peripheral`) is required on Android to
/// broadcast the rotating UUID. Scanning is fully functional.
class BleService {
  final _encountersController = StreamController<BleEncounter>.broadcast();
  StreamSubscription<List<ScanResult>>? _scanSub;
  String? _myRotatingUuid;
  bool _isAdvertising = false;

  Stream<BleEncounter> get discoveredDevices => _encountersController.stream;
  Stream<BluetoothAdapterState> get bleState => FlutterBluePlus.adapterState;
  bool get isScanning => FlutterBluePlus.isScanningNow;
  bool get isAdvertising => _isAdvertising;

  /// Requests the BLE + location permissions required for scanning.
  Future<bool> requestPermissions() async {
    final statuses = await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.locationWhenInUse,
    ].request();
    return statuses.values.every((s) => s.isGranted || s.isLimited);
  }

  Future<bool> isBleEnabled() async =>
      FlutterBluePlus.adapterStateNow == BluetoothAdapterState.on;

  /// Begin scanning for KumbhRaksha devices. Safe to call repeatedly.
  Future<void> startScanning({
    double latitude = 0,
    double longitude = 0,
  }) async {
    if (FlutterBluePlus.isScanningNow) return;
    try {
      await _scanSub?.cancel();
      _scanSub = FlutterBluePlus.scanResults.listen((results) {
        for (final r in results) {
          _handleResult(r, latitude, longitude);
        }
      });
      await FlutterBluePlus.startScan(
        withServices: [Guid(BleConstants.kumbhRakshaServiceUuid)],
        timeout: BleConstants.scanSession,
      );
      appLogger.i('BLE scan started');
    } catch (e, st) {
      appLogger.e('startScanning failed', error: e, stackTrace: st);
    }
  }

  Future<void> stopScanning() async {
    try {
      await FlutterBluePlus.stopScan();
      await _scanSub?.cancel();
      _scanSub = null;
    } catch (e) {
      appLogger.e('stopScanning failed', error: e);
    }
  }

  void _handleResult(ScanResult result, double lat, double lng) {
    final uuid = _extractUuid(result.advertisementData);
    if (uuid == null || uuid == _myRotatingUuid) return;
    if (result.rssi < BleConstants.rssiThreshold) return;

    final encounter = BleEncounter(
      id: const Uuid().v4(),
      encounteredUuid: uuid,
      rssi: result.rssi,
      timestamp: DateTime.now(),
      latitude: lat,
      longitude: lng,
      distanceEstimate: DistanceCalculator.estimateDistance(rssi: result.rssi),
    );
    _encountersController.add(encounter);
  }

  String? _extractUuid(AdvertisementData adv) {
    if (adv.serviceUuids.isNotEmpty) return adv.serviceUuids.first.str;
    return null;
  }

  /// Stub: advertising requires a peripheral-capable plugin. We record the
  /// active rotating UUID so scans can self-filter, and log the limitation.
  Future<void> startAdvertising(String rotatingUuid) async {
    _myRotatingUuid = rotatingUuid;
    _isAdvertising = true;
    appLogger.w(
      'BLE advertising requested ($rotatingUuid) — peripheral mode not '
      'supported by flutter_blue_plus; integrate flutter_ble_peripheral.',
    );
  }

  Future<void> stopAdvertising() async {
    _isAdvertising = false;
  }

  double estimateDistance(int rssi) =>
      DistanceCalculator.estimateDistance(rssi: rssi);

  void dispose() {
    _scanSub?.cancel();
    _encountersController.close();
  }
}
