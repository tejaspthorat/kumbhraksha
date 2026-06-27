/// BLE configuration constants for proximity witness detection.
class BleConstants {
  BleConstants._();

  static const String kumbhRakshaServiceUuid =
      '1234abcd-e567-89ab-cdef-0123456789ab';

  // Advertising
  static const int advertisingIntervalMs = 4000;
  static const String adLocalName = 'KumbhRaksha';

  // Scanning
  static const Duration scanSession = Duration(seconds: 10);
  static const Duration scanPause = Duration(seconds: 5);

  // UUID rotation
  static const Duration rotationInterval = Duration(minutes: 15);
  static const Duration gracePeriod = Duration(minutes: 5);

  // RSSI / distance
  static const int txPowerDbm = -59;
  static const double pathLossExponent = 2.0;
  static const int rssiThreshold = -120;

  // Cleanup
  static const Duration encounterWindow = Duration(hours: 2);
  static const Duration cleanupInterval = Duration(minutes: 10);
}
