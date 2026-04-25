import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'channel_filter.dart';

/// Status of a [RealtimeChannel] subscription.
enum ChannelStatus { subscribed, closed, errored }

typedef RealtimeCallback = void Function(Map<String, dynamic> payload);

/// A channel connected to the nSelf Realtime service.
///
/// Created by [NselfRealtimeClient.channel]. Call [subscribe] to start
/// receiving events, then [unsubscribe] to clean up.
class RealtimeChannel {
  final String _topic;
  final WebSocketChannel _socket;
  String? _ref;
  final Map<String, RealtimeCallback> _callbacks = {};
  StreamSubscription<dynamic>? _sub;
  ChannelStatus _status = ChannelStatus.closed;

  RealtimeChannel({
    required String topic,
    required WebSocketChannel socket,
  })  : _topic = topic,
        _socket = socket;

  /// Current subscription status.
  ChannelStatus get status => _status;

  /// Register a callback for [filter] events.
  /// Returns `this` for method chaining.
  RealtimeChannel on(
    RealtimeListenTypes type,
    ChannelFilter filter,
    RealtimeCallback callback,
  ) {
    final key = '${type.value}:${filter.table}';
    _callbacks[key] = callback;
    return this;
  }

  /// Subscribe to the channel and start receiving events.
  RealtimeChannel subscribe() {
    _ref = DateTime.now().millisecondsSinceEpoch.toString();

    final joinPayload = {
      'topic': _topic,
      'event': 'phx_join',
      'payload': {'config': {'broadcast': {}, 'presence': {}, 'postgres_changes': []}},
      'ref': _ref,
    };
    _socket.sink.add(jsonEncode(joinPayload));

    _sub = _socket.stream.listen(
      (raw) {
        final msg = jsonDecode(raw as String) as Map<String, dynamic>;
        if (msg['topic'] != _topic) return;
        final event = msg['event'] as String?;
        final payload = msg['payload'] as Map<String, dynamic>? ?? {};

        if (event == 'phx_reply' && msg['ref'] == _ref) {
          _status = ChannelStatus.subscribed;
        } else if (event != null) {
          for (final entry in _callbacks.entries) {
            if (entry.key.contains(event) || entry.key.startsWith('*')) {
              entry.value(payload);
            }
          }
        }
      },
      onError: (_) => _status = ChannelStatus.errored,
      onDone: () => _status = ChannelStatus.closed,
    );

    return this;
  }

  /// Unsubscribe and release the channel resources.
  Future<void> unsubscribe() async {
    _socket.sink.add(jsonEncode({
      'topic': _topic,
      'event': 'phx_leave',
      'payload': {},
      'ref': _ref,
    }));
    await _sub?.cancel();
    _status = ChannelStatus.closed;
  }
}
