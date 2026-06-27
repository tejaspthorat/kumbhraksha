import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/constants/app_constants.dart';
import '../core/utils/app_logger.dart';
import 'storage_service.dart';

/// Thin Dio wrapper with auth + logging interceptors and 401 token refresh.
class ApiService {
  ApiService(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      headers: {'Content-Type': 'application/json'},
    ));
    _setupInterceptors();
  }

  late final Dio _dio;
  final StorageService _storage;

  Dio get client => _dio;

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getSecure(AppConstants.keyAccessToken);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        appLogger.d('→ ${options.method} ${options.path}');
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final clone = await _retry(error.requestOptions);
            return handler.resolve(clone);
          }
        }
        appLogger.e('API error: ${error.message}');
        handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.getSecure(AppConstants.keyRefreshToken);
      if (refresh == null) return false;
      final res = await _dio.post(ApiConstants.refresh,
          data: {'refresh_token': refresh});
      final access = res.data['access_token'] as String?;
      if (access == null) return false;
      await _storage.saveSecure(AppConstants.keyAccessToken, access);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Response<dynamic>> _retry(RequestOptions options) {
    return _dio.request(
      options.path,
      data: options.data,
      queryParameters: options.queryParameters,
      options: Options(method: options.method, headers: options.headers),
    );
  }

  Future<Response<dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _dio.get(path, queryParameters: query);

  Future<Response<dynamic>> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  Future<Response<dynamic>> postMultipart(String path, FormData data) =>
      _dio.post(path, data: data);
}
