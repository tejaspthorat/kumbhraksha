/// App-wide constants & secure-storage keys.
class AppConstants {
  AppConstants._();

  static const String appName = 'KumbhRaksha';

  // Secure storage keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyBaseUuid = 'ble_base_uuid';

  // Prefs keys
  static const String keyOnboarded = 'is_onboarded';
  static const String keyLanguage = 'language_preference';
  static const String keyUserId = 'user_id';
  static const String keyLastLat = 'last_latitude';
  static const String keyLastLng = 'last_longitude';
}
