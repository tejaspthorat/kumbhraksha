/// Backend API endpoints & networking constants.
class ApiConstants {
  ApiConstants._();

  // KumbhRaksha web/backend (Express). Use 10.0.2.2 for the Android emulator
  // (it maps to the host's localhost); use the LAN IP for a physical device.
  static const String baseUrl = 'http://localhost:5001/api';
  // static const String baseUrl = 'http://10.0.2.2:5001/api'; // Android emulator

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);

  // Auth
  static const String register = '/auth/register';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refresh = '/auth/refresh';

  // User
  static const String me = '/users/me';
  static const String fcmToken = '/users/fcm-token';

  // Missing-person reports (web backend: /api/missing/*)
  static const String reports = '/missing/reports';
  static const String sightings = '/missing/sightings';
  // Geo-sorted feed of active reports near a coordinate.
  static const String missingFeed = '/missing/feed';

  // Encounters / witness matching
  static const String encounters = '/encounters';
}
