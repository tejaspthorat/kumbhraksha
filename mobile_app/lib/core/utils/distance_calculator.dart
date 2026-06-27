import 'dart:math';

import '../constants/ble_constants.dart';

/// Converts BLE RSSI readings into estimated distance (meters).
class DistanceCalculator {
  DistanceCalculator._();

  /// distance = 10^((txPower - rssi) / (10 * n))
  static double estimateDistance({
    required int rssi,
    int txPowerDbm = BleConstants.txPowerDbm,
    double pathLossExponent = BleConstants.pathLossExponent,
  }) {
    if (rssi >= 0) return 0.0; // Invalid reading
    if (rssi < BleConstants.rssiThreshold) return 100.0; // Beyond useful range

    final ratio = (txPowerDbm - rssi) / (10 * pathLossExponent);
    return pow(10.0, ratio).toDouble();
  }

  static String signalLabel(int rssi) {
    if (rssi > -70) return 'Excellent';
    if (rssi > -80) return 'Good';
    if (rssi > -90) return 'Fair';
    return 'Poor';
  }
}
