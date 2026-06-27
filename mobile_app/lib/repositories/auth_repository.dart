import 'package:uuid/uuid.dart';

import '../core/constants/api_constants.dart';
import '../core/constants/app_constants.dart';
import '../core/utils/app_logger.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

/// Auth flow: request OTP → verify → persist tokens & user.
///
/// When [mockMode] is true (default until the backend is live) the OTP `123456`
/// is accepted locally so the full onboarding flow is demoable offline.
class AuthRepository {
  AuthRepository(this._api, this._storage, {this.mockMode = true});

  final ApiService _api;
  final StorageService _storage;
  final bool mockMode;

  static const String mockOtp = '123456';

  Future<void> requestOtp(String phoneNumber) async {
    if (mockMode) {
      appLogger.i('Mock OTP for $phoneNumber is $mockOtp');
      return;
    }
    await _api.post(ApiConstants.register, data: {'phone_number': phoneNumber});
  }

  /// Returns the authenticated [User] on success, throws otherwise.
  Future<User> verifyOtp({
    required String phoneNumber,
    required String otp,
    required String language,
  }) async {
    if (mockMode) {
      if (otp != mockOtp) {
        throw Exception('Invalid code. Use $mockOtp in demo mode.');
      }
      final user = User(
        id: const Uuid().v4(),
        phoneNumber: phoneNumber,
        languagePreference: language,
        isOnboarded: true,
        createdAt: DateTime.now(),
      );
      await _persist(user, accessToken: 'mock-access', refreshToken: 'mock-refresh');
      return user;
    }

    final res = await _api.post(ApiConstants.verifyOtp, data: {
      'phone_number': phoneNumber,
      'otp': otp,
      'language_preference': language,
    });
    final data = res.data as Map<String, dynamic>;
    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    await _persist(
      user,
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
    );
    return user;
  }

  Future<void> _persist(User user,
      {required String accessToken, required String refreshToken}) async {
    await _storage.saveSecure(AppConstants.keyAccessToken, accessToken);
    await _storage.saveSecure(AppConstants.keyRefreshToken, refreshToken);
    await _storage.setString(AppConstants.keyUserId, user.id);
    await _storage.setString(AppConstants.keyLanguage, user.languagePreference);
    await _storage.setBool(AppConstants.keyOnboarded, true);
  }

  Future<bool> isOnboarded() => _storage.getBool(AppConstants.keyOnboarded);

  Future<void> logout() async {
    await _storage.clearSecure();
    await _storage.remove(AppConstants.keyOnboarded);
    await _storage.remove(AppConstants.keyUserId);
  }
}
