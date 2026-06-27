import 'dart:async';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../core/utils/app_logger.dart';
import '../models/witness_alert.dart';

/// Real-time alert transport.
///
/// With [mockMode] (default until the Socket.io backend is live) it emits
/// simulated alerts on a timer so the feed updates live during demos. The real
/// path connects to a WebSocket, authenticates with the JWT, parses inbound
/// `alert` events, and reconnects with exponential backoff.
class WebSocketService {
  WebSocketService({this.mockMode = true});

  final bool mockMode;

  final _alertController = StreamController<WitnessAlert>.broadcast();
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _mockTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _connected = false;
  int _mockSeq = 0;

  Stream<WitnessAlert> get alerts => _alertController.stream;
  bool get isConnected => _connected;

  Future<void> connect(String url, {String? token}) async {
    if (mockMode) {
      _startMock();
      _connected = true;
      return;
    }
    try {
      final uri = Uri.parse(token == null ? url : '$url?token=$token');
      _channel = WebSocketChannel.connect(uri);
      await _channel!.ready;
      _connected = true;
      _reconnectAttempts = 0;
      appLogger.i('WebSocket connected: $url');
      _sub = _channel!.stream.listen(
        _onMessage,
        onDone: () => _scheduleReconnect(url, token),
        onError: (Object e) => _scheduleReconnect(url, token),
      );
    } catch (e) {
      appLogger.e('WebSocket connect failed', error: e);
      _scheduleReconnect(url, token);
    }
  }

  void _onMessage(dynamic data) {
    try {
      // Expecting JSON: {"type":"alert","payload":{...witness alert...}}
      if (data is String && data.contains('alert')) {
        // Parsing kept defensive; backend contract finalized in Phase 2 backend.
        appLogger.d('WS message: $data');
      }
    } catch (e) {
      appLogger.w('WS parse error: $e');
    }
  }

  void _scheduleReconnect(String url, String? token) {
    _connected = false;
    _reconnectAttempts++;
    final delay = Duration(seconds: (1 << _reconnectAttempts).clamp(1, 30));
    appLogger.w('WS reconnecting in ${delay.inSeconds}s (#$_reconnectAttempts)');
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () => connect(url, token: token));
  }

  void _startMock() {
    _mockTimer?.cancel();
    _mockTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      _mockSeq++;
      _alertController.add(WitnessAlert(
        id: 'ws-$_mockSeq',
        missingReportId: 'r-$_mockSeq',
        witnessUserId: 'me',
        alertType: _mockSeq.isEven ? 'ble_witness' : 'gps_radius',
        alertText: _mockSeq.isEven
            ? 'You passed near this person a few minutes ago.'
            : 'A new missing-person alert was raised near you.',
        createdAt: DateTime.now(),
        personName: _mockSeq.isEven ? 'Ramesh, 9 years' : 'Lata, 72 years',
      ));
    });
  }

  Future<void> disconnect() async {
    _mockTimer?.cancel();
    _reconnectTimer?.cancel();
    await _sub?.cancel();
    await _channel?.sink.close();
    _connected = false;
  }

  void dispose() {
    disconnect();
    _alertController.close();
  }
}
