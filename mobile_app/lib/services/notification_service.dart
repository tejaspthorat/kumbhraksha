import '../core/utils/app_logger.dart';
import 'storage_service.dart';

/// Push-notification handling.
///
/// NOTE: Full FCM requires a Firebase project, `google-services.json`, and the
/// `firebase_messaging` native plugin. To keep the app building without that
/// setup, this is a lightweight stub that manages a (placeholder) token and
/// logs notification intents. Swap the body for `firebase_messaging` calls once
/// Firebase is configured — the public surface stays the same.
class NotificationService {
  NotificationService(this._storage);

  final StorageService _storage;
  static const String _tokenKey = 'fcm_token';

  String? _token;
  String? get token => _token;

  Future<void> init() async {
    // TODO(firebase): request permission + FirebaseMessaging.instance.getToken()
    _token = await _storage.getString(_tokenKey) ?? 'mock-fcm-token';
    await _storage.setString(_tokenKey, _token!);
    appLogger.i('NotificationService init (stub). Token: $_token');
  }

  /// Called when a new token is issued by FCM.
  Future<void> onTokenRefresh(String token) async {
    _token = token;
    await _storage.setString(_tokenKey, token);
    appLogger.i('FCM token refreshed');
  }
}
