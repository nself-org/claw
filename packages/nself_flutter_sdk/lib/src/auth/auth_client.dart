import 'package:dio/dio.dart';

import 'session.dart';
import 'user.dart';

/// Auth operations against the nSelf Auth service (nHost-compatible).
///
/// Access via [NselfClient.auth]:
/// ```dart
/// final session = await nself.auth.signInWithEmail('user@example.com', 'password');
/// ```
class NselfAuthClient {
  final Dio _dio;
  final String _url;
  final String _anonKey;

  NselfSession? _currentSession;

  NselfAuthClient({
    required Dio dio,
    required String url,
    required String anonKey,
  })  : _dio = dio,
        _url = url,
        _anonKey = anonKey;

  /// The currently authenticated session, or null if signed out.
  NselfSession? get currentSession => _currentSession;

  /// The currently authenticated user, or null if signed out.
  NselfUser? get currentUser => _currentSession?.user;

  /// The auth JWT to attach as Authorization header.
  String? get authToken => _currentSession?.accessToken;

  /// Sign in with email and password. Returns the session on success.
  Future<NselfSession> signInWithEmail(String email, String password) async {
    final response = await _dio.post(
      '$_url/auth/v1/token?grant_type=password',
      data: {'email': email, 'password': password},
      options: Options(headers: {'apikey': _anonKey}),
    );
    final session = NselfSession.fromJson(response.data as Map<String, dynamic>);
    _currentSession = session;
    return session;
  }

  /// Register a new user with email and password.
  Future<NselfSession> signUpWithEmail(String email, String password) async {
    final response = await _dio.post(
      '$_url/auth/v1/signup',
      data: {'email': email, 'password': password},
      options: Options(headers: {'apikey': _anonKey}),
    );
    final session = NselfSession.fromJson(response.data as Map<String, dynamic>);
    _currentSession = session;
    return session;
  }

  /// Sign out and clear the current session.
  Future<void> signOut() async {
    final token = _currentSession?.accessToken;
    _currentSession = null;
    if (token != null) {
      await _dio.post(
        '$_url/auth/v1/logout',
        options: Options(
          headers: {
            'apikey': _anonKey,
            'Authorization': 'Bearer $token',
          },
          validateStatus: (_) => true, // ignore 401 on expired tokens
        ),
      );
    }
  }

  /// Refresh the session using the stored refresh token.
  /// Returns null if no refresh token is available.
  Future<NselfSession?> refreshSession() async {
    final refreshToken = _currentSession?.refreshToken;
    if (refreshToken == null) return null;

    final response = await _dio.post(
      '$_url/auth/v1/token?grant_type=refresh_token',
      data: {'refresh_token': refreshToken},
      options: Options(headers: {'apikey': _anonKey}),
    );
    final session = NselfSession.fromJson(response.data as Map<String, dynamic>);
    _currentSession = session;
    return session;
  }

  /// Get the user object for the current session.
  Future<NselfUser?> getUser() async {
    final token = _currentSession?.accessToken;
    if (token == null) return null;

    final response = await _dio.get(
      '$_url/auth/v1/user',
      options: Options(
        headers: {
          'apikey': _anonKey,
          'Authorization': 'Bearer $token',
        },
      ),
    );
    return NselfUser.fromJson(response.data as Map<String, dynamic>);
  }

  /// Update the current user's metadata.
  Future<NselfUser> updateUser({Map<String, dynamic>? data}) async {
    final token = _currentSession?.accessToken;
    if (token == null) {
      throw StateError('Cannot update user: not signed in.');
    }
    final response = await _dio.put(
      '$_url/auth/v1/user',
      data: {'data': data},
      options: Options(
        headers: {
          'apikey': _anonKey,
          'Authorization': 'Bearer $token',
        },
      ),
    );
    return NselfUser.fromJson(response.data as Map<String, dynamic>);
  }
}
