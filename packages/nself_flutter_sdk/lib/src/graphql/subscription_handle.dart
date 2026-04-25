import 'dart:async';

/// A handle returned from [NselfGraphQLClient.subscribe].
/// Holds the broadcast stream and allows explicit disposal.
class SubscriptionHandle {
  final Stream<Map<String, dynamic>> stream;
  final String _subscriptionId;
  final Future<void> Function(String id) _dispose;

  SubscriptionHandle({
    required this.stream,
    required String subscriptionId,
    required Future<void> Function(String id) dispose,
  })  : _subscriptionId = subscriptionId,
        _dispose = dispose;

  /// Cancel the subscription and release resources.
  Future<void> cancel() => _dispose(_subscriptionId);
}
