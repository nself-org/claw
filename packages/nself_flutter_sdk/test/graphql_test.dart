import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';

import 'package:nself_flutter_sdk/src/auth/auth_client.dart';
import 'package:nself_flutter_sdk/src/graphql/graphql_client.dart';
import 'package:nself_flutter_sdk/src/graphql/result.dart';

@GenerateMocks([Dio])
import 'graphql_test.mocks.dart';

void main() {
  late MockDio mockDio;
  late NselfGraphQLClient graphql;

  const testUrl = 'https://api.test.com';
  const testWsUrl = 'wss://api.test.com';
  const testAnonKey = 'anon-key';

  setUp(() {
    mockDio = MockDio();
    final auth = NselfAuthClient(
      dio: mockDio,
      url: testUrl,
      anonKey: testAnonKey,
    );
    graphql = NselfGraphQLClient(
      dio: mockDio,
      wsUrl: testWsUrl,
      anonKey: testAnonKey,
      authClient: auth,
    );
  });

  group('NselfGraphQLClient', () {
    // T14 — query success
    test('query parses data response', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {
                  'data': {'np_users': []},
                },
                statusCode: 200,
              ));

      final result = await graphql.query('query { np_users { id } }');
      expect(result, isA<GraphQLResult>());
      expect(result.hasErrors, isFalse);
      expect(result.data, containsKey('np_users'));
    });

    // T15 — query with variables
    test('query passes variables to POST body', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {'data': {'node': null}},
                statusCode: 200,
              ));

      final result = await graphql.query(
        'query GetNode(\$id: uuid!) { node(id: \$id) { id } }',
        variables: {'id': 'abc-123'},
      );
      expect(result, isA<GraphQLResult>());
    });

    // T16 — GraphQL error response
    test('query surfaces errors in GraphQLResult', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {
                  'errors': [
                    {'message': 'field "bad" not found'}
                  ],
                },
                statusCode: 200,
              ));

      final result = await graphql.query('query { bad }');
      expect(result.hasErrors, isTrue);
      expect(result.errors!.first.message, contains('bad'));
    });

    // T17 — mutate is alias for query
    test('mutate delegates to query', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {
                  'data': {'insert_np_messages_one': {'id': 'msg-1'}},
                },
                statusCode: 200,
              ));

      final result = await graphql.mutate(
        'mutation CreateMsg(\$text: String!) { insert_np_messages_one(object: {text: \$text}) { id } }',
        variables: {'text': 'Hello'},
      );
      expect(result.data, containsKey('insert_np_messages_one'));
    });

    // T18 — GraphQLError.fromJson
    test('GraphQLError.fromJson parses message and extensions', () {
      final err = GraphQLError.fromJson({
        'message': 'not found',
        'extensions': {'code': 'NOT_FOUND'},
      });
      expect(err.message, equals('not found'));
      expect(err.extensions, containsPair('code', 'NOT_FOUND'));
    });

    // T19 — Dio error propagates
    test('query propagates DioException', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenThrow(DioException(
            requestOptions: RequestOptions(path: ''),
            type: DioExceptionType.connectionError,
          ));

      expect(
        () => graphql.query('query { np_users { id } }'),
        throwsA(isA<DioException>()),
      );
    });
  });
}
