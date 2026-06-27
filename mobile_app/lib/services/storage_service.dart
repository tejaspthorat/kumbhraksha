import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Wraps secure storage (tokens, keys) and shared preferences (flags).
class StorageService {
  StorageService._internal();
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;

  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // Secure
  Future<void> saveSecure(String key, String value) =>
      _secure.write(key: key, value: value);

  Future<String?> getSecure(String key) => _secure.read(key: key);

  Future<void> deleteSecure(String key) => _secure.delete(key: key);

  Future<void> clearSecure() => _secure.deleteAll();

  // Prefs
  Future<void> setString(String key, String value) async =>
      (await _preferences).setString(key, value);

  Future<String?> getString(String key) async =>
      (await _preferences).getString(key);

  Future<void> setBool(String key, bool value) async =>
      (await _preferences).setBool(key, value);

  Future<bool> getBool(String key, {bool defaultValue = false}) async =>
      (await _preferences).getBool(key) ?? defaultValue;

  Future<void> setDouble(String key, double value) async =>
      (await _preferences).setDouble(key, value);

  Future<double?> getDouble(String key) async =>
      (await _preferences).getDouble(key);

  Future<void> remove(String key) async => (await _preferences).remove(key);
}
