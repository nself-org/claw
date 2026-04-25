import 'package:dio/dio.dart';

import '../auth/auth_client.dart';
import 'storage_bucket.dart';

/// MinIO-compatible object storage client.
///
/// Access via [NselfClient.storage]:
/// ```dart
/// await nself.storage.from('avatars').upload('uid/photo.jpg', bytes);
/// final url = nself.storage.from('avatars').getPublicUrl('uid/photo.jpg');
/// ```
class NselfStorageClient {
  final Dio _dio;
  final String _storageUrl;
  final NselfAuthClient _auth;

  NselfStorageClient({
    required Dio dio,
    required String url,
    required NselfAuthClient authClient,
  })  : _dio = dio,
        _storageUrl = '$url/storage/v1',
        _auth = authClient;

  /// Return a [NselfStorageBucket] handle for the named bucket.
  NselfStorageBucket from(String bucket) {
    return NselfStorageBucket(
      dio: _dio,
      storageUrl: _storageUrl,
      bucket: bucket,
      authClient: _auth,
    );
  }

  /// List all buckets (requires service_role key or admin privileges).
  Future<List<Map<String, dynamic>>> listBuckets() async {
    final token = _auth.authToken;
    final response = await _dio.get(
      '$_storageUrl/bucket',
      options: Options(
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ),
    );
    return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
  }
}
