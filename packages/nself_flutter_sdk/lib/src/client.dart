import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'auth/auth_client.dart';
import 'graphql/graphql_client.dart';
import 'realtime/realtime_client.dart';
import 'storage/storage_client.dart';

/// The central entry-point for the nSelf Flutter SDK.
///
/// Initialize once at application startup before any other call:
///
/// ```dart
/// await NselfClient.initialize(
///   url: 'https://api.myapp.com',
///   anonKey: const String.fromEnvironment('NSELF_ANON_KEY'),
/// );
/// final nself = NselfClient.instance;
/// ```
class NselfClient {
  static NselfClient? _instance;

  /// The singleton instance. Throws if [initialize] has not been called.
  static NselfClient get instance {
    if (_instance == null) {
      throw StateError(
        'NselfClient is not initialized. '
        'Call NselfClient.initialize() before accessing instance.',
      );
    }
    return _instance!;
  }

  /// The base URL of the nSelf backend (e.g. https://api.myapp.com).
  final String url;

  /// The anonymous (public) JWT key for unauthenticated requests.
  final String anonKey;

  late final Dio _dio;

  /// Auth operations: sign-in, sign-out, session refresh.
  late final NselfAuthClient auth;

  /// GraphQL queries, mutations, and subscriptions via Hasura.
  late final NselfGraphQLClient graphql;

  /// File upload/download via MinIO-compatible Storage API.
  late final NselfStorageClient storage;

  /// Table-level Realtime subscriptions (non-GraphQL).
  late final NselfRealtimeClient realtime;

  NselfClient._({required this.url, required this.anonKey}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: url,
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );

    auth = NselfAuthClient(dio: _dio, url: url, anonKey: anonKey);
    graphql = NselfGraphQLClient(
      dio: _dio,
      wsUrl: _toWsUrl(url),
      anonKey: anonKey,
      authClient: auth,
    );
    storage = NselfStorageClient(dio: _dio, url: url, authClient: auth);
    realtime = NselfRealtimeClient(
      wsUrl: _toWsUrl(url),
      anonKey: anonKey,
      authClient: auth,
    );
  }

  /// Initialize the singleton. Safe to call multiple times — subsequent
  /// calls are no-ops if [url] and [anonKey] are identical.
  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    final normalizedUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;

    if (_instance != null) {
      if (_instance!.url == normalizedUrl && _instance!.anonKey == anonKey) {
        return;
      }
      debugPrint('NselfClient: re-initializing with new config.');
      await _instance!.dispose();
    }

    _instance = NselfClient._(url: normalizedUrl, anonKey: anonKey);
  }

  /// Dispose all underlying resources (HTTP client, WebSockets).
  Future<void> dispose() async {
    await realtime.dispose();
    _dio.close();
  }

  static String _toWsUrl(String httpUrl) {
    return httpUrl
        .replaceFirst('https://', 'wss://')
        .replaceFirst('http://', 'ws://');
  }
}
