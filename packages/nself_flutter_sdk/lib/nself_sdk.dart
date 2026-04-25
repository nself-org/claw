/// nSelf Flutter SDK — Hasura GraphQL, Auth, Storage, and Realtime.
///
/// Initialize once at app startup:
/// ```dart
/// await NselfClient.initialize(
///   url: 'https://api.myapp.com',
///   anonKey: const String.fromEnvironment('NSELF_ANON_KEY'),
/// );
/// ```
library nself_sdk;

export 'src/client.dart';

// Auth — re-export from nself_auth_sdk
export 'src/auth/auth_client.dart';
export 'src/auth/session.dart';
export 'src/auth/user.dart';

// GraphQL
export 'src/graphql/graphql_client.dart';
export 'src/graphql/result.dart';
export 'src/graphql/subscription_handle.dart';

// Storage
export 'src/storage/storage_client.dart';
export 'src/storage/storage_bucket.dart';

// Realtime
export 'src/realtime/realtime_client.dart';
export 'src/realtime/channel.dart';
export 'src/realtime/channel_filter.dart';
