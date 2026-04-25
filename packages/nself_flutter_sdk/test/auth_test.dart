import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';

import 'package:nself_flutter_sdk/src/auth/auth_client.dart';
import 'package:nself_flutter_sdk/src/auth/session.dart';
import 'package:nself_flutter_sdk/src/auth/user.dart';

@GenerateMocks([Dio])
import 'auth_test.mocks.dart';

void main() {
  late MockDio mockDio;
  late NselfAuthClient auth;

  const testUrl = 'https://api.test.com';
  const testAnonKey = 'test-anon-key';
  const testEmail = 'user@example.com';
  const testPassword = 'password123';

  Map<String, dynamic> _sessionJson({String? refreshToken}) => {
        'access_token': 'access-jwt-token',
        'refresh_token': refreshToken ?? 'refresh-token',
        'token_type': 'Bearer',
        'expires_in': 3600,
        'user': {
          'id': 'user-uuid-1',
          'email': testEmail,
          'created_at': '2024-01-01T00:00:00Z',
        },
      };

  setUp(() {
    mockDio = MockDio();
    auth = NselfAuthClient(
      dio: mockDio,
      url: testUrl,
      anonKey: testAnonKey,
    );
  });

  group('NselfAuthClient', () {
    // T1 — initial state
    test('currentUser is null before sign-in', () {
      expect(auth.currentUser, isNull);
    });

    // T2 — initial session
    test('currentSession is null before sign-in', () {
      expect(auth.currentSession, isNull);
    });

    // T3 — sign in success
    test('signInWithEmail returns session and sets currentSession', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));

      final session = await auth.signInWithEmail(testEmail, testPassword);

      expect(session, isA<NselfSession>());
      expect(session.accessToken, equals('access-jwt-token'));
      expect(session.user.email, equals(testEmail));
      expect(auth.currentSession, isNotNull);
    });

    // T4 — user populated after sign-in
    test('currentUser is set after sign-in', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));

      await auth.signInWithEmail(testEmail, testPassword);
      expect(auth.currentUser, isA<NselfUser>());
      expect(auth.currentUser!.id, equals('user-uuid-1'));
    });

    // T5 — auth token exposed after sign-in
    test('authToken returns access token after sign-in', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));

      await auth.signInWithEmail(testEmail, testPassword);
      expect(auth.authToken, equals('access-jwt-token'));
    });

    // T6 — sign out clears session
    test('signOut clears currentSession', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));

      await auth.signInWithEmail(testEmail, testPassword);
      expect(auth.currentSession, isNotNull);

      await auth.signOut();
      expect(auth.currentSession, isNull);
      expect(auth.currentUser, isNull);
    });

    // T7 — refresh session
    test('refreshSession updates currentSession', () async {
      // First sign in
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));
      await auth.signInWithEmail(testEmail, testPassword);

      // Then refresh — returns a new token
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson()..['access_token'] = 'new-access-token',
                statusCode: 200,
              ));

      final refreshed = await auth.refreshSession();
      expect(refreshed, isNotNull);
    });

    // T8 — refresh with no session returns null
    test('refreshSession returns null when no session exists', () async {
      final result = await auth.refreshSession();
      expect(result, isNull);
    });

    // T9 — NselfSession.isExpired
    test('NselfSession.isExpired is false for future expiry', () {
      final session = NselfSession(
        accessToken: 'tok',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
        user: NselfUser(id: 'u1', email: 'u@x.com'),
      );
      expect(session.isExpired, isFalse);
    });

    // T10 — NselfSession.isExpired true when past
    test('NselfSession.isExpired is true for expired token', () {
      final session = NselfSession(
        accessToken: 'tok',
        expiresAt: DateTime.now().subtract(const Duration(minutes: 5)),
        user: NselfUser(id: 'u1', email: 'u@x.com'),
      );
      expect(session.isExpired, isTrue);
    });

    // T11 — NselfUser.fromJson round-trip
    test('NselfUser.fromJson parses all fields', () {
      final user = NselfUser.fromJson({
        'id': 'uid-abc',
        'email': 'alice@example.com',
        'user_metadata': {'name': 'Alice'},
        'created_at': '2024-06-01T00:00:00Z',
      });
      expect(user.id, equals('uid-abc'));
      expect(user.email, equals('alice@example.com'));
      expect(user.userMetadata, containsPair('name', 'Alice'));
      expect(user.createdAt, isA<DateTime>());
    });

    // T12 — signUpWithEmail
    test('signUpWithEmail returns session', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: _sessionJson(),
                statusCode: 200,
              ));

      final session = await auth.signUpWithEmail(testEmail, testPassword);
      expect(session.user.email, equals(testEmail));
    });

    // T13 — DioException propagates from signInWithEmail
    test('signInWithEmail propagates Dio errors', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenThrow(DioException(
            requestOptions: RequestOptions(path: ''),
            message: 'Invalid login credentials',
            type: DioExceptionType.badResponse,
          ));

      expect(
        () => auth.signInWithEmail(testEmail, 'wrong'),
        throwsA(isA<DioException>()),
      );
    });
  });
}
