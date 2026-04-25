import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';

import 'package:nself_flutter_sdk/src/auth/auth_client.dart';
import 'package:nself_flutter_sdk/src/storage/storage_client.dart';
import 'package:nself_flutter_sdk/src/storage/storage_bucket.dart';

@GenerateMocks([Dio])
import 'storage_test.mocks.dart';

void main() {
  late MockDio mockDio;
  late NselfStorageClient storage;
  late NselfAuthClient auth;

  const testUrl = 'https://api.test.com';
  const testAnonKey = 'anon-key';

  setUp(() {
    mockDio = MockDio();
    auth = NselfAuthClient(
      dio: mockDio,
      url: testUrl,
      anonKey: testAnonKey,
    );
    storage = NselfStorageClient(
      dio: mockDio,
      url: testUrl,
      authClient: auth,
    );
  });

  group('NselfStorageClient', () {
    // T20 — from() returns bucket
    test('from() returns a NselfStorageBucket', () {
      final bucket = storage.from('avatars');
      expect(bucket, isA<NselfStorageBucket>());
    });

    // T21 — upload success
    test('upload returns the path on success', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {'Key': 'avatars/uid/photo.jpg'},
                statusCode: 200,
              ));

      final bucket = storage.from('avatars');
      final path = await bucket.upload('uid/photo.jpg', Uint8List.fromList([1, 2, 3]));
      expect(path, equals('uid/photo.jpg'));
    });

    // T22 — download returns bytes
    test('download returns Uint8List', () async {
      when(mockDio.get<List<int>>(any, options: anyNamed('options')))
          .thenAnswer((_) async => Response<List<int>>(
                requestOptions: RequestOptions(path: ''),
                data: [0x89, 0x50, 0x4E, 0x47],
                statusCode: 200,
              ));

      final bucket = storage.from('avatars');
      final bytes = await bucket.download('uid/photo.png');
      expect(bytes, isA<Uint8List>());
      expect(bytes.isNotEmpty, isTrue);
    });

    // T23 — getPublicUrl
    test('getPublicUrl returns correct URL', () {
      final bucket = storage.from('avatars');
      final url = bucket.getPublicUrl('uid/photo.jpg');
      expect(url, equals('$testUrl/storage/v1/object/public/avatars/uid/photo.jpg'));
    });

    // T24 — delete calls Dio.delete
    test('delete calls DELETE endpoint', () async {
      when(mockDio.delete(any, options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                statusCode: 200,
              ));

      final bucket = storage.from('avatars');
      await bucket.delete('uid/old.jpg');
      verify(mockDio.delete(any, options: anyNamed('options'))).called(1);
    });

    // T25 — createSignedUrl
    test('createSignedUrl returns signed URL string', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => Response(
                requestOptions: RequestOptions(path: ''),
                data: {'signedURL': '/object/sign/avatars/uid/photo.jpg?token=xyz'},
                statusCode: 200,
              ));

      final bucket = storage.from('avatars');
      final url = await bucket.createSignedUrl('uid/photo.jpg', expiresIn: 600);
      expect(url, contains('xyz'));
    });
  });
}
