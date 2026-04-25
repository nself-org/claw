import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../auth/auth_client.dart';
import 'result.dart';
import 'subscription_handle.dart';

/// GraphQL client for Hasura — queries, mutations, and subscriptions.
///
/// Access via [NselfClient.graphql]:
/// ```dart
/// final result = await nself.graphql.query(
///   'query GetUser(\$id: uuid!) { np_users_by_pk(id: \$id) { id email } }',
///   variables: {'id': userId},
/// );
/// ```
class NselfGraphQLClient {
  final Dio _dio;
  final String _wsUrl;
  final String _anonKey;
  final NselfAuthClient _auth;

  WebSocketChannel? _wsChannel;
  StreamSubscription<dynamic>? _wsSub;
  int _nextId = 1;
  final Map<String, StreamController<Map<String, dynamic>>> _subscriptions = {};
  bool _wsConnected = false;

  NselfGraphQLClient({
    required Dio dio,
    required String wsUrl,
    required String anonKey,
    required NselfAuthClient authClient,
  })  : _dio = dio,
        _wsUrl = wsUrl,
        _anonKey = anonKey,
        _auth = authClient;

  Map<String, String> get _headers {
    final token = _auth.authToken;
    return {
      'Content-Type': 'application/json',
      'apikey': _anonKey,
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Execute a GraphQL query or mutation.
  Future<GraphQLResult> query(
    String document, {
    Map<String, dynamic>? variables,
    String? operationName,
  }) async {
    final response = await _dio.post(
      '/v1/graphql',
      data: {
        'query': document,
        if (variables != null) 'variables': variables,
        if (operationName != null) 'operationName': operationName,
      },
      options: Options(headers: _headers),
    );
    return GraphQLResult.fromJson(response.data as Map<String, dynamic>);
  }

  /// Execute a GraphQL mutation (alias for [query]).
  Future<GraphQLResult> mutate(
    String document, {
    Map<String, dynamic>? variables,
    String? operationName,
  }) =>
      query(document, variables: variables, operationName: operationName);

  /// Subscribe to a GraphQL subscription using the graphql-ws protocol.
  /// Returns a [SubscriptionHandle] whose [SubscriptionHandle.stream] emits
  /// each data payload received from the server.
  Future<SubscriptionHandle> subscribe(
    String document, {
    Map<String, dynamic>? variables,
    String? operationName,
  }) async {
    await _ensureWsConnected();

    final id = '${_nextId++}';
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _subscriptions[id] = controller;

    final payload = {
      'id': id,
      'type': 'subscribe',
      'payload': {
        'query': document,
        if (variables != null) 'variables': variables,
        if (operationName != null) 'operationName': operationName,
      },
    };
    _wsChannel!.sink.add(jsonEncode(payload));

    return SubscriptionHandle(
      stream: controller.stream,
      subscriptionId: id,
      dispose: _cancelSubscription,
    );
  }

  Future<void> _cancelSubscription(String id) async {
    _subscriptions[id]?.close();
    _subscriptions.remove(id);
    if (_wsChannel != null) {
      _wsChannel!.sink.add(jsonEncode({'id': id, 'type': 'complete'}));
    }
    if (_subscriptions.isEmpty) {
      await _closeWs();
    }
  }

  Future<void> _ensureWsConnected() async {
    if (_wsConnected) return;

    final wsGraphqlUrl = '$_wsUrl/v1/graphql';
    _wsChannel = WebSocketChannel.connect(
      Uri.parse(wsGraphqlUrl),
      protocols: ['graphql-transport-ws'],
    );

    // graphql-ws connection_init
    final token = _auth.authToken;
    _wsChannel!.sink.add(jsonEncode({
      'type': 'connection_init',
      'payload': {
        'headers': {
          'apikey': _anonKey,
          if (token != null) 'Authorization': 'Bearer $token',
        },
      },
    }));

    // Wait for connection_ack
    final completer = Completer<void>();
    _wsSub = _wsChannel!.stream.listen(
      (raw) {
        final msg = jsonDecode(raw as String) as Map<String, dynamic>;
        final type = msg['type'] as String?;

        if (type == 'connection_ack' && !completer.isCompleted) {
          _wsConnected = true;
          completer.complete();
        } else if (type == 'next') {
          final id = msg['id'] as String?;
          if (id != null && _subscriptions.containsKey(id)) {
            final payload = msg['payload'] as Map<String, dynamic>;
            _subscriptions[id]!.add(payload);
          }
        } else if (type == 'error') {
          final id = msg['id'] as String?;
          if (id != null && _subscriptions.containsKey(id)) {
            final errors = (msg['payload'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .join(', ') ??
                'Unknown subscription error';
            _subscriptions[id]!.addError(Exception(errors));
          }
        } else if (type == 'complete') {
          final id = msg['id'] as String?;
          if (id != null) {
            _subscriptions[id]?.close();
            _subscriptions.remove(id);
          }
        }
      },
      onError: (Object err) {
        if (!completer.isCompleted) completer.completeError(err);
        for (final c in _subscriptions.values) {
          c.addError(err);
        }
      },
      onDone: () {
        _wsConnected = false;
        if (!completer.isCompleted) {
          completer.completeError(Exception('WebSocket closed unexpectedly'));
        }
      },
    );

    await completer.future;
  }

  Future<void> _closeWs() async {
    await _wsSub?.cancel();
    await _wsChannel?.sink.close();
    _wsChannel = null;
    _wsConnected = false;
  }

  /// Dispose all subscriptions and close the WebSocket.
  Future<void> dispose() async {
    for (final c in _subscriptions.values) {
      await c.close();
    }
    _subscriptions.clear();
    await _closeWs();
  }
}
