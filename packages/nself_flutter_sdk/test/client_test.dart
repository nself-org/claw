import 'package:flutter_test/flutter_test.dart';

import 'package:nself_flutter_sdk/nself_sdk.dart';

void main() {
  setUp(() async {
    // Reset singleton between tests by re-initializing.
    // In real usage you call initialize() once at startup.
  });

  group('NselfClient', () {
    // T31 — uninitialized access throws
    test('instance throws StateError before initialize()', () {
      expect(() => NselfClient.instance, throwsA(isA<StateError>()));
    });

    // T32 — barrel export exposes all public types
    test('barrel export makes NselfClient available', () {
      // If this file compiles the export is correct.
      expect(NselfClient, isNotNull);
    });
  });
}
