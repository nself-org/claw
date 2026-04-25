import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../auth/auth_client.dart';

/// A handle to a specific storage bucket.
///
/// Obtain via [NselfStorageClient.from]:
/// ```dart
/// final bucket = nself.storage.from('avatars');
/// await bucket.upload('uid/photo.jpg', bytes);
/// final url = bucket.getPublicUrl('uid/photo.jpg');
/// ```
class NselfStorageBucket {
  final Dio _dio;
  final String _storageUrl;
  final String _bucket;
  final NselfAuthClient _auth;

  NselfStorageBucket({
    required Dio dio,
    required String storageUrl,
    required String bucket,
    required NselfAuthClient authClient,
  })  : _dio = dio,
        _storageUrl = storageUrl,
        _bucket = bucket,
        _auth = authClient;

  Map<String, String> get _authHeaders {
    final token = _auth.authToken;
    return {
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Upload [bytes] to [path] in this bucket.
  /// Returns the storage path on success.
  Future<String> upload(
    String path,
    Uint8List bytes, {
    String? contentType,
  }) async {
    final url = '$_storageUrl/object/$_bucket/$path';
    await _dio.post(
      url,
      data: bytes,
      options: Options(
        headers: {
          ..._authHeaders,
          'Content-Type': contentType ?? 'application/octet-stream',
        },
      ),
    );
    return path;
  }

  /// Download the file at [path] and return its bytes.
  Future<Uint8List> download(String path) async {
    final url = '$_storageUrl/object/$_bucket/$path';
    final response = await _dio.get<List<int>>(
      url,
      options: Options(
        responseType: ResponseType.bytes,
        headers: _authHeaders,
      ),
    );
    return Uint8List.fromList(response.data ?? []);
  }

  /// Delete the file at [path].
  Future<void> delete(String path) async {
    final url = '$_storageUrl/object/$_bucket/$path';
    await _dio.delete(url, options: Options(headers: _authHeaders));
  }

  /// Return the public URL for [path] (only works for public buckets).
  String getPublicUrl(String path) {
    return '$_storageUrl/object/public/$_bucket/$path';
  }

  /// Return a signed URL for [path] that expires after [expiresIn] seconds.
  Future<String> createSignedUrl(String path, {int expiresIn = 3600}) async {
    final url = '$_storageUrl/object/sign/$_bucket/$path';
    final response = await _dio.post(
      url,
      data: {'expiresIn': expiresIn},
      options: Options(headers: _authHeaders),
    );
    final signedUrl = (response.data as Map<String, dynamic>)['signedURL'] as String;
    return '$_storageUrl$signedUrl';
  }
}
