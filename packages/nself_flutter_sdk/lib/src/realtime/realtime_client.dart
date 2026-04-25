import 'package:web_socket_channel/web_socket_channel.dart';

import '../auth/auth_client.dart';
import 'channel.dart';

/// Realtime table-change subscriptions using the Phoenix channel protocol.
///
/// Access via [NselfClient.realtime]:
/// ```dart
/// nself.realtime
///   .channel('realtime:public:messages')
///   .on(RealtimeListenTypes.insert, ChannelFilter(table: 'messages'), (p) => print(p))
///   .subscribe();
/// ```
class NselfRealtimeClient {
  final String _wsUrl;
  final String _anonKey;
  final NselfAuthClient _auth;

  WebSocketChannel? _socket;
  final Map<String, RealtimeChannel> _channels = {};

  NselfRealtimeClient({
    required String wsUrl,
    required String anonKey,
    required NselfAuthClient authClient,
  })  : _wsUrl = wsUrl,
        _anonKey = anonKey,
        _auth = authClient;

  /// Create (or return cached) a [RealtimeChannel] for [topic].
  ///
  /// Topic format: `realtime:<schema>:<table>` or a custom broadcast topic.
  RealtimeChannel channel(String topic) {
    if (_channels.containsKey(topic)) return _channels[topic]!;
    _ensureSocket();
    final ch = RealtimeChannel(topic: topic, socket: _socket!);
    _channels[topic] = ch;
    return ch;
  }

  /// Remove a channel and unsubscribe.
  Future<void> removeChannel(String topic) async {
    await _channels[topic]?.unsubscribe();
    _channels.remove(topic);
  }

  void _ensureSocket() {
    if (_socket != null) return;
    final token = _auth.authToken;
    final uri = Uri.parse(
      '$_wsUrl/realtime/v1/websocket?apikey=$_anonKey'
      '${token != null ? "&vsn=1.0.0" : ""}',
    );
    _socket = WebSocketChannel.connect(uri);
  }

  /// Dispose all channels and close the WebSocket.
  Future<void> dispose() async {
    for (final ch in _channels.values) {
      await ch.unsubscribe();
    }
    _channels.clear();
    await _socket?.sink.close();
    _socket = null;
  }
}
