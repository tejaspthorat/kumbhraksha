import 'package:equatable/equatable.dart';

class BleEncounter extends Equatable {
  final String id;
  final String encounteredUuid;
  final int rssi;
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double? distanceEstimate;
  final String syncStatus; // 'pending', 'synced', 'failed'

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

  Map<String, dynamic> toMap() => {
        'id': id,
        'encountered_uuid': encounteredUuid,
        'rssi': rssi,
        'timestamp': timestamp.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'distance_estimate': distanceEstimate,
        'sync_status': syncStatus,
      };

  factory BleEncounter.fromMap(Map<String, dynamic> map) => BleEncounter(
        id: map['id'] as String,
        encounteredUuid: map['encountered_uuid'] as String,
        rssi: map['rssi'] as int,
        timestamp: DateTime.parse(map['timestamp'] as String),
        latitude: (map['latitude'] as num).toDouble(),
        longitude: (map['longitude'] as num).toDouble(),
        distanceEstimate: (map['distance_estimate'] as num?)?.toDouble(),
        syncStatus: map['sync_status'] as String? ?? 'pending',
      );

  Map<String, dynamic> toJson() => toMap();
  factory BleEncounter.fromJson(Map<String, dynamic> json) =>
      BleEncounter.fromMap(json);

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

  bool get isGood => rssi > -80;
  bool get isWeak => rssi < -90;
}
