# BLE Service Implementation Guide

## Overview

The BLE service handles:
1. **Scanning** — Discover nearby KumbhRaksha devices
2. **Advertising** — Broadcast this device's rotating UUID
3. **Encounter Logging** — Store RSSI + timestamp locally
4. **Distance Estimation** — Convert RSSI to meters

---

## Service Architecture

```
┌─────────────────────────────────────────┐
│  BleService (Public Interface)           │
│  - startScanning()                       │
│  - startAdvertising()                    │
│  - stopScanning()                        │
│  - stopAdvertising()                     │
│  - get discoveredDevices Stream          │
│  - estimateDistance(rssi)                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  flutter_blue_plus (BLE Stack)           │
│  - Scans for service UUID                │
│  - Advertises with custom payload        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  EncounterRepository (Data Layer)        │
│  - Save encountered UUID                 │
│  - Query encounters in time window       │
│  - Cleanup old data                      │
└─────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update pubspec.yaml

```yaml
dependencies:
  flutter_blue_plus: ^1.30.0        # BLE stack
  permission_handler: ^11.10.0      # Permission requests
  shared_preferences: ^2.2.0        # Local storage
  sqflite: ^2.3.0                   # SQLite
  dio: ^5.3.0                       # HTTP
  riverpod: ^2.4.0                  # State management
  flutter_gen_runner: ^5.0.0        # Asset generation
```

---

### Step 2: Create BLE Constants

**File**: `lib/core/constants/ble_constants.dart`

```dart
class BleConstants {
  // Kumbh Raksha service UUID (v4 UUID - replace with real one)
  static const String kumbhRakshaServiceUuid = '1234abcd-e567-89ab-cdef-0123456789ab';
  
  // BLE Advertising
  static const int advertisingIntervalMs = 4000;      // 4 seconds
  static const int advertisingDurationMs = 5000;      // 5 seconds per burst
  static const String adLocalName = 'KumbhRaksha';
  
  // BLE Scanning
  static const int scanningTimeoutMs = 10000;         // 10 seconds per session
  static const Duration scanSession = Duration(seconds: 10);
  static const Duration scanPause = Duration(seconds: 5);
  
  // UUID Rotation
  static const Duration rotationInterval = Duration(minutes: 15);
  static const Duration gracePeriod = Duration(minutes: 5);
  
  // RSSI & Distance Calculation
  static const int txPowerDbm = -59;                  // Transmit power at 1m
  static const double pathLossExponent = 2.0;         // Propagation constant
  static const int rssiThreshold = -120;              // Ignore weaker signals
  
  // Cleanup
  static const Duration encountedWindowDuration = Duration(hours: 2);
  static const Duration cleanupInterval = Duration(minutes: 10);
}
```

---

### Step 3: Create BLE Encounter Data Model

**File**: `lib/models/ble_encounter.dart`

```dart
import 'package:equatable/equatable.dart';

class BleEncounter extends Equatable {
  final String id;
  final String encounteredUuid;      // UUID of other device
  final int rssi;                    // Signal strength (usually -40 to -100)
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double? distanceEstimate;    // Calculated from RSSI
  final String syncStatus;           // 'pending', 'synced'

  const BleEncounter({
    required this.id,
    required this.encounteredUuid,
    required this.rssi,
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    this.distanceEstimate,
    this.syncStatus = 'pending',
  });

  // For database storage
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'encountered_uuid': encounteredUuid,
      'rssi': rssi,
      'timestamp': timestamp.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      'distance_estimate': distanceEstimate,
      'sync_status': syncStatus,
    };
  }

  factory BleEncounter.fromMap(Map<String, dynamic> map) {
    return BleEncounter(
      id: map['id'] as String,
      encounteredUuid: map['encountered_uuid'] as String,
      rssi: map['rssi'] as int,
      timestamp: DateTime.parse(map['timestamp'] as String),
      latitude: map['latitude'] as double,
      longitude: map['longitude'] as double,
      distanceEstimate: map['distance_estimate'] as double?,
      syncStatus: map['sync_status'] as String? ?? 'pending',
    );
  }

  BleEncounter copyWith({
    String? id,
    String? encounteredUuid,
    int? rssi,
    DateTime? timestamp,
    double? latitude,
    double? longitude,
    double? distanceEstimate,
    String? syncStatus,
  }) {
    return BleEncounter(
      id: id ?? this.id,
      encounteredUuid: encounteredUuid ?? this.encounteredUuid,
      rssi: rssi ?? this.rssi,
      timestamp: timestamp ?? this.timestamp,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceEstimate: distanceEstimate ?? this.distanceEstimate,
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }

  @override
  List<Object?> get props => [
    id, encounteredUuid, rssi, timestamp, latitude, longitude,
    distanceEstimate, syncStatus,
  ];
}
```

---

### Step 4: Create Distance Calculator Utility

**File**: `lib/core/utils/distance_calculator.dart`

```dart
class DistanceCalculator {
  /// Convert RSSI to estimated distance in meters
  /// 
  /// Formula: distance = 10^((txPower - rssi) / (10 * n))
  /// where:
  ///   - txPower: TX power at 1 meter (-59 dBm typical for BLE)
  ///   - rssi: measured signal strength
  ///   - n: path loss exponent (2.0 in free space, higher in dense areas)
  static double estimateDistance({
    required int rssi,
    int txPowerDbm = -59,
    double pathLossExponent = 2.0,
  }) {
    if (rssi > 0) return 0.0;  // Invalid RSSI
    if (rssi < -120) return 100.0;  // Too weak, estimate max range
    
    final ratio = (rssi - txPowerDbm) / (10 * pathLossExponent);
    return pow(10.0, ratio).toDouble();
  }
  
  /// Calibrate distance based on device type and environment
  /// (Optional: can be improved with machine learning)
  static double calibratedDistance(
    int rssi, {
    required String deviceType,  // 'android' or 'ios'
    required String environment,  // 'indoor', 'outdoor'
  }) {
    double distance = estimateDistance(rssi: rssi);
    
    // iOS tends to report higher RSSI (adjust down)
    if (deviceType == 'ios') {
      distance *= 0.9;
    }
    
    // Indoor has more reflections (higher uncertainty)
    if (environment == 'indoor') {
      distance *= 1.1;
    }
    
    return distance;
  }
}

import 'dart:math';
```

---

### Step 5: Create Database Service

**File**: `lib/services/database_service.dart`

```dart
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:async';
import 'package:flutter/services.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  static Database? _database;

  factory DatabaseService() {
    return _instance;
  }

  DatabaseService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDb();
    return _database!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'kumbhraksha.db');

    return openDatabase(
      path,
      version: 1,
      onCreate: _createDb,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _createDb(Database db, int version) async {
    // Encounters table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS encounters (
        id TEXT PRIMARY KEY,
        encountered_uuid TEXT NOT NULL,
        rssi INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        distance_estimate REAL,
        sync_status TEXT DEFAULT 'pending'
      )
    ''');

    // Indices for performance
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_timestamp ON encounters(timestamp)'
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_uuid ON encounters(encountered_uuid)'
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_sync_status ON encounters(sync_status)'
    );

    // User BLE UUIDs (for registry)
    await db.execute('''
      CREATE TABLE IF NOT EXISTS my_ble_uuids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rotating_uuid TEXT NOT NULL,
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,
        is_current BOOLEAN DEFAULT 0
      )
    ''');

    // User cache
    await db.execute('''
      CREATE TABLE IF NOT EXISTS user_cache (
        user_id TEXT PRIMARY KEY,
        phone_number TEXT,
        fcm_token TEXT,
        language_preference TEXT,
        is_onboarded BOOLEAN,
        created_at DATETIME
      )
    ''');

    // Pending reports (for offline support)
    await db.execute('''
      CREATE TABLE IF NOT EXISTS pending_reports (
        id TEXT PRIMARY KEY,
        report_json TEXT NOT NULL,
        created_at DATETIME,
        synced_at DATETIME
      )
    ''');
  }

  Future<void> _onUpgrade(
    Database db,
    int oldVersion,
    int newVersion,
  ) async {
    // Handle future migrations here
  }

  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
    }
    _database = null;
  }
}
```

---

### Step 6: Create BLE Service

**File**: `lib/services/ble_service.dart`

```dart
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:uuid/uuid.dart';
import 'dart:async';
import 'package:logger/logger.dart';

import '../core/constants/ble_constants.dart';
import '../core/utils/distance_calculator.dart';
import '../models/ble_encounter.dart';

class BleService {
  final _logger = Logger();
  late String _myRotatingUuid;
  
  // Streams
  final _discoveredDevicesController = StreamController<BleEncounter>.broadcast();
  final _bleStateController = StreamController<BluetoothAdapterState>.broadcast();
  
  // Scanning/Advertising state
  bool _isScanning = false;
  bool _isAdvertising = false;
  Timer? _scanTimer;
  Timer? _advertisingTimer;

  BleService() {
    _initBle();
  }

  Future<void> _initBle() async {
    // Set up BLE state listener
    FlutterBluePlus.adapterState.listen((state) {
      _bleStateController.add(state);
    });
  }

  // ============ PERMISSIONS ============

  Future<bool> requestPermissions() async {
    try {
      // Android permissions
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt >= 31) {
        // Android 12+: Need BLUETOOTH_SCAN, BLUETOOTH_CONNECT
        final location = await Permission.location.request();
        final bluetoothScan = await Permission.bluetoothScan.request();
        final bluetoothConnect = await Permission.bluetoothConnect.request();
        
        return location.isGranted && 
               bluetoothScan.isGranted && 
               bluetoothConnect.isGranted;
      }
    } catch (e) {
      _logger.e('Permission error: $e');
    }
    return false;
  }

  Future<bool> isBleEnabled() async {
    return FlutterBluePlus.adapterStateNow == BluetoothAdapterState.on;
  }

  // ============ SCANNING ============

  Future<void> startScanning(String serviceUuid) async {
    if (_isScanning) {
      _logger.w('Scanning already in progress');
      return;
    }

    try {
      _isScanning = true;
      _logger.i('Starting BLE scan for service: $serviceUuid');

      // Create Guid from UUID string
      final guid = Guid(serviceUuid);

      await FlutterBluePlus.startScan(
        withServices: [guid],
        timeout: Duration(seconds: 10),
      );

      // Listen to scan results
      FlutterBluePlus.scanResults.listen((results) {
        for (var result in results) {
          _handleScanResult(result);
        }
      });
    } catch (e) {
      _logger.e('Scanning error: $e');
      _isScanning = false;
    }
  }

  Future<void> stopScanning() async {
    try {
      await FlutterBluePlus.stopScan();
      _isScanning = false;
      _logger.i('BLE scan stopped');
    } catch (e) {
      _logger.e('Stop scan error: $e');
    }
  }

  void _handleScanResult(ScanResult result) {
    final uuid = _extractUuidFromAdvertisement(result.advertisementData);
    if (uuid == null) return;

    // Skip our own UUID
    if (uuid == _myRotatingUuid) return;

    final distance = DistanceCalculator.estimateDistance(rssi: result.rssi);
    
    // Create encounter
    final encounter = BleEncounter(
      id: const Uuid().v4(),
      encounteredUuid: uuid,
      rssi: result.rssi,
      timestamp: DateTime.now(),
      latitude: 0.0,  // Will be filled by location service
      longitude: 0.0,
      distanceEstimate: distance,
    );

    _logger.d('Encountered device: $uuid, RSSI: ${result.rssi}, Distance: ${distance.toStringAsFixed(1)}m');
    
    // Emit to listeners
    _discoveredDevicesController.add(encounter);
  }

  String? _extractUuidFromAdvertisement(AdvertisementData advData) {
    // Look for service UUIDs in advertisement
    if (advData.serviceUuids.isNotEmpty) {
      return advData.serviceUuids.first.toString();
    }
    
    // Look for manufacturer data or other custom payloads
    // (depends on how you structure your advertisement)
    return null;
  }

  Stream<BleEncounter> get discoveredDevices => _discoveredDevicesController.stream;

  // ============ ADVERTISING ============

  Future<void> startAdvertising(String rotatingUuid) async {
    _myRotatingUuid = rotatingUuid;

    if (_isAdvertising) {
      _logger.w('Advertising already active');
      return;
    }

    try {
      _isAdvertising = true;
      _logger.i('Starting BLE advertising: $rotatingUuid');

      final guid = Guid(BleConstants.kumbhRakshaServiceUuid);

      // Configure advertisement data
      final manufacturerData = {
        // Google manufacturer ID (0x00E0 = Google)
        0x00E0: [
          ...rotatingUuid.codeUnits,
          // Optional: add version byte, app state, etc
          0x01,
        ],
      };

      // Start advertising
      await FlutterBluePlus.startAdvertising(
        allowConnectingWhileAdvertising: false,
        includeDeviceName: true,
        includeLocalServiceUUIDs: [guid],
        manufacturerData: manufacturerData,
        txPowerLevel: TxPowerLevelValues.max,
      );

      _logger.i('BLE advertising started');
    } catch (e) {
      _logger.e('Advertising error: $e');
      _isAdvertising = false;
    }
  }

  Future<void> stopAdvertising() async {
    try {
      await FlutterBluePlus.stopAdvertising();
      _isAdvertising = false;
      _logger.i('BLE advertising stopped');
    } catch (e) {
      _logger.e('Stop advertising error: $e');
    }
  }

  // ============ UTILITY METHODS ============

  double estimateDistance(int rssi) {
    return DistanceCalculator.estimateDistance(rssi: rssi);
  }

  Stream<BluetoothAdapterState> get bleState => _bleStateController.stream;

  bool get isScanning => _isScanning;
  bool get isAdvertising => _isAdvertising;

  // ============ CLEANUP ============

  void dispose() {
    _scanTimer?.cancel();
    _advertisingTimer?.cancel();
    _discoveredDevicesController.close();
    _bleStateController.close();
  }
}
```

---

### Step 7: Create Encounter Repository

**File**: `lib/repositories/encounter_repository.dart`

```dart
import 'package:uuid/uuid.dart';
import '../models/ble_encounter.dart';
import '../services/database_service.dart';
import 'package:logger/logger.dart';

class EncounterRepository {
  final DatabaseService _db;
  final _logger = Logger();

  EncounterRepository(this._db);

  // ============ ADD ============

  Future<BleEncounter> addEncounter(BleEncounter encounter) async {
    final database = await _db.database;
    await database.insert('encounters', encounter.toMap());
    _logger.d('Encounter saved: ${encounter.id}');
    return encounter;
  }

  // ============ QUERY ============

  Future<List<BleEncounter>> getEncountersInWindow(
    Duration window, {
    DateTime? beforeTime,
  }) async {
    final database = await _db.database;
    beforeTime ??= DateTime.now();
    final afterTime = beforeTime.subtract(window);

    final result = await database.query(
      'encounters',
      where: 'timestamp > ? AND timestamp <= ?',
      whereArgs: [
        afterTime.toIso8601String(),
        beforeTime.toIso8601String(),
      ],
      orderBy: 'timestamp DESC',
    );

    return result.map((map) => BleEncounter.fromMap(map)).toList();
  }

  Future<List<BleEncounter>> getUnsyncedEncounters() async {
    final database = await _db.database;
    final result = await database.query(
      'encounters',
      where: 'sync_status = ?',
      whereArgs: ['pending'],
      orderBy: 'timestamp DESC',
    );

    return result.map((map) => BleEncounter.fromMap(map)).toList();
  }

  Future<int> getPendingEncountersCount() async {
    final database = await _db.database;
    final result = await database.rawQuery(
      'SELECT COUNT(*) as count FROM encounters WHERE sync_status = "pending"'
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // ============ UPDATE ============

  Future<void> markEncountersAsSynced(List<String> encounterIds) async {
    if (encounterIds.isEmpty) return;

    final database = await _db.database;
    final placeholders = List.filled(encounterIds.length, '?').join(',');

    await database.rawUpdate(
      'UPDATE encounters SET sync_status = "synced" WHERE id IN ($placeholders)',
      encounterIds,
    );

    _logger.d('Marked ${encounterIds.length} encounters as synced');
  }

  // ============ DELETE ============

  Future<void> deleteOldEncounters(DateTime olderThan) async {
    final database = await _db.database;
    await database.delete(
      'encounters',
      where: 'timestamp < ?',
      whereArgs: [olderThan.toIso8601String()],
    );

    _logger.i('Deleted encounters before $olderThan');
  }

  Future<void> deleteAllEncounters() async {
    final database = await _db.database;
    await database.delete('encounters');
  }

  // ============ UUID HISTORY ============

  Future<void> saveUuidHistory(String uuid, DateTime validFrom, DateTime validUntil) async {
    final database = await _db.database;
    await database.insert('my_ble_uuids', {
      'rotating_uuid': uuid,
      'valid_from': validFrom.toIso8601String(),
      'valid_until': validUntil.toIso8601String(),
      'is_current': 0,
    });
  }

  Future<List<Map<String, dynamic>>> getUuidRegistry() async {
    final database = await _db.database;
    final now = DateTime.now();
    
    return database.query(
      'my_ble_uuids',
      where: 'valid_from <= ? AND valid_until >= ?',
      whereArgs: [
        now.toIso8601String(),
        now.toIso8601String(),
      ],
      orderBy: 'valid_from DESC',
    );
  }
}
```

---

## Integration with Riverpod

**File**: `lib/features/ble/presentation/providers/ble_provider.dart`

```dart
import 'package:riverpod/riverpod.dart';
import '../../../../models/ble_encounter.dart';
import '../../../../services/ble_service.dart';

// BLE Service (singleton)
final bleServiceProvider = Provider((ref) {
  return BleService();
});

// Encounters stream
final bleEncountersProvider = StreamProvider((ref) {
  final bleService = ref.watch(bleServiceProvider);
  return bleService.discoveredDevices;
});

// BLE state
final bleStateProvider = StateProvider<BleState>((ref) {
  return const BleState.initial();
});
```

---

## Testing

**File**: `test/services/ble_service_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:kumbhraksha/services/ble_service.dart';
import 'package:kumbhraksha/core/utils/distance_calculator.dart';

void main() {
  group('DistanceCalculator', () {
    test('estimateDistance calculates correctly', () {
      // At 1m distance: RSSI = -59 dBm
      expect(DistanceCalculator.estimateDistance(rssi: -59), lessThan(1.5));

      // At 10m distance: RSSI ≈ -79 dBm
      expect(DistanceCalculator.estimateDistance(rssi: -79), greaterThan(7.0));
      expect(DistanceCalculator.estimateDistance(rssi: -79), lessThan(13.0));
    });

    test('handles invalid RSSI values', () {
      expect(DistanceCalculator.estimateDistance(rssi: 0), equals(0.0));
      expect(DistanceCalculator.estimateDistance(rssi: -120), equals(100.0));
    });
  });
}
```

---

## Checklist

- [ ] BLE constants defined
- [ ] Distance calculator implemented & tested
- [ ] Database service with encounters table
- [ ] BLE service with scan/advertise functions
- [ ] Encounter repository with CRUD
- [ ] Riverpod providers for BLE state
- [ ] Permissions flow tested on Android
- [ ] Real device testing (not emulator)
- [ ] Encounter logging verified
- [ ] UUID extraction working

---

**Last Updated**: 2026-06-27
