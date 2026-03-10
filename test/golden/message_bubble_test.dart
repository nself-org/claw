// message_bubble_test.dart
// T-0449 — Flutter: golden tests for message bubble component
//
// Golden test variants:
//   - sent (user bubble) — light mode
//   - received (assistant bubble) — light mode
//   - loading state — light mode
//   - failed/error state — light mode
//   - sent — dark mode
//   - received — dark mode

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// ---------------------------------------------------------------------------
// MessageBubble stub widget
// Replace with: import 'package:nself_claw/widgets/message_bubble.dart';
// ---------------------------------------------------------------------------

enum MessageStatus { sent, received, loading, failed }

class MessageBubble extends StatelessWidget {
  final String content;
  final MessageStatus status;
  final DateTime? timestamp;

  const MessageBubble({
    super.key,
    required this.content,
    required this.status,
    this.timestamp,
  });

  bool get isSent => status == MessageStatus.sent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Color bgColor;
    Color textColor;

    switch (status) {
      case MessageStatus.sent:
        bgColor = colorScheme.primary;
        textColor = colorScheme.onPrimary;
        break;
      case MessageStatus.received:
        bgColor = colorScheme.surfaceContainerHighest;
        textColor = colorScheme.onSurface;
        break;
      case MessageStatus.loading:
        bgColor = colorScheme.surfaceContainerHighest;
        textColor = colorScheme.onSurface;
        break;
      case MessageStatus.failed:
        bgColor = colorScheme.errorContainer;
        textColor = colorScheme.onErrorContainer;
        break;
    }

    return Align(
      alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isSent ? 16 : 4),
            bottomRight: Radius.circular(isSent ? 4 : 16),
          ),
        ),
        child: status == MessageStatus.loading
            ? SizedBox(
                width: 40,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(textColor),
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    content,
                    style: TextStyle(color: textColor, fontSize: 15),
                  ),
                  if (status == MessageStatus.failed)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Failed to send',
                        style: TextStyle(
                          color: textColor.withValues(alpha: 0.7),
                          fontSize: 11,
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Test helper: wrap widget in minimal MaterialApp
// ---------------------------------------------------------------------------

Widget _wrap(Widget child, {bool dark = false}) {
  return MaterialApp(
    theme: dark
        ? ThemeData.dark(useMaterial3: true)
        : ThemeData.light(useMaterial3: true),
    home: Scaffold(
      body: Center(child: child),
    ),
  );
}

// ---------------------------------------------------------------------------
// Golden tests
// ---------------------------------------------------------------------------

void main() {
  // Disable HTTP font loading in tests
  TestWidgetsFlutterBinding.ensureInitialized();

  group('MessageBubble golden tests', () {
    // -------------------------------------------------------------------------
    // Light mode variants
    // -------------------------------------------------------------------------

    testWidgets('bubble_sent_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'Hello, how can you help me?',
            status: MessageStatus.sent,
          ),
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_sent_light.png'),
      );
    });

    testWidgets('bubble_received_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'I can help you with many tasks. What would you like to do?',
            status: MessageStatus.received,
          ),
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_received_light.png'),
      );
    });

    testWidgets('bubble_loading_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: '',
            status: MessageStatus.loading,
          ),
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_loading_light.png'),
      );
    });

    testWidgets('bubble_failed_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'This message failed to send',
            status: MessageStatus.failed,
          ),
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_failed_light.png'),
      );
    });

    // -------------------------------------------------------------------------
    // Dark mode variants
    // -------------------------------------------------------------------------

    testWidgets('bubble_sent_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'Hello, how can you help me?',
            status: MessageStatus.sent,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_sent_dark.png'),
      );
    });

    testWidgets('bubble_received_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'I can help you with many tasks. What would you like to do?',
            status: MessageStatus.received,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_received_dark.png'),
      );
    });

    testWidgets('bubble_loading_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: '',
            status: MessageStatus.loading,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_loading_dark.png'),
      );
    });

    testWidgets('bubble_failed_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const MessageBubble(
            content: 'This message failed to send',
            status: MessageStatus.failed,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(MessageBubble),
        matchesGoldenFile('goldens/bubble_failed_dark.png'),
      );
    });
  });
}
