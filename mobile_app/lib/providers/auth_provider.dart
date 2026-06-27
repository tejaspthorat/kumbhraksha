import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../repositories/auth_repository.dart';

enum AuthStatus { unknown, unauthenticated, authenticating, authenticated, error }

/// Drives the onboarding/auth flow and exposes the current user.
class AuthProvider extends ChangeNotifier {
  AuthProvider(this._repo);
  final AuthRepository _repo;

  AuthStatus status = AuthStatus.unknown;
  User? user;
  String? errorMessage;

  // Onboarding selections
  String language = 'hindi';
  String phoneNumber = '';

  void selectLanguage(String lang) {
    language = lang;
    notifyListeners();
  }

  void setPhone(String phone) {
    phoneNumber = phone;
  }

  Future<void> bootstrap() async {
    final onboarded = await _repo.isOnboarded();
    status = onboarded ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> requestOtp() async {
    await _repo.requestOtp(phoneNumber);
  }

  Future<bool> verifyOtp(String otp) async {
    status = AuthStatus.authenticating;
    errorMessage = null;
    notifyListeners();
    try {
      user = await _repo.verifyOtp(
        phoneNumber: phoneNumber,
        otp: otp,
        language: language,
      );
      status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      errorMessage = e.toString().replaceFirst('Exception: ', '');
      status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
