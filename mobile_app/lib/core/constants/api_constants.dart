/// Backend API endpoints & networking constants.
class ApiConstants {
  ApiConstants._();

  // Swap for a real host when backend is deployed.
  static const String baseUrl = 'https://api.kumbhraksha.example.com/v1';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);

  // Auth
  static const String register = '/auth/register';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refresh = '/auth/refresh';

  // User
  static const String me = '/users/me';
  static const String fcmToken = '/users/fcm-token';

  // Reports
  static const String reports = '/reports';

  // Encounters / witness matching
  static const String encounters = '/encounters';
}
