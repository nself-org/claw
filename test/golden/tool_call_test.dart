// tool_call_test.dart
// T-0449 — Flutter: golden tests for tool call visualization widget
//
// Visualizes AI tool calls: tool name, arguments JSON, result display.
// Golden variants:
//   - pending (tool called, awaiting result)
//   - success (result returned)
//   - error (tool execution failed)

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// ---------------------------------------------------------------------------
// ToolCallWidget stub
// Replace with: import 'package:nself_claw/widgets/tool_call_widget.dart';
// ---------------------------------------------------------------------------

enum ToolCallState { pending, success, error }

class ToolCallWidget extends StatelessWidget {
  final String toolName;
  final Map<String, dynamic> arguments;
  final String? result;
  final ToolCallState state;

  const ToolCallWidget({
    super.key,
    required this.toolName,
    required this.arguments,
    this.result,
    this.state = ToolCallState.pending,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color borderColor;
    IconData statusIcon;
    Color statusColor;

    switch (state) {
      case ToolCallState.pending:
        borderColor = theme.colorScheme.outline;
        statusIcon = Icons.hourglass_empty;
        statusColor = theme.colorScheme.outline;
        break;
      case ToolCallState.success:
        borderColor = Colors.green;
        statusIcon = Icons.check_circle_outline;
        statusColor = Colors.green;
        break;
      case ToolCallState.error:
        borderColor = theme.colorScheme.error;
        statusIcon = Icons.error_outline;
        statusColor = theme.colorScheme.error;
        break;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: borderColor, width: 1.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: tool name + status icon
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(Icons.build_outlined, size: 16, color: theme.colorScheme.primary),
                const SizedBox(width: 6),
                Text(
                  toolName,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                    fontFamily: 'monospace',
                  ),
                ),
                const Spacer(),
                Icon(statusIcon, size: 16, color: statusColor),
              ],
            ),
          ),

          // Arguments
          if (arguments.isNotEmpty) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Arguments',
                    style: TextStyle(
                      fontSize: 11,
                      color: theme.colorScheme.outline,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatArgs(arguments),
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                  ),
                ],
              ),
            ),
          ],

          // Result
          if (result != null) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    state == ToolCallState.error ? 'Error' : 'Result',
                    style: TextStyle(
                      fontSize: 11,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    result!,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: state == ToolCallState.error ? theme.colorScheme.error : null,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Pending indicator
          if (state == ToolCallState.pending) ...[
            const Divider(height: 1),
            const Padding(
              padding: EdgeInsets.all(12),
              child: Row(
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('Executing...', style: TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatArgs(Map<String, dynamic> args) {
    final lines = args.entries.map((e) => '  "${e.key}": ${_formatValue(e.value)}');
    return '{\n${lines.join(',\n')}\n}';
  }

  String _formatValue(dynamic v) {
    if (v is String) return '"$v"';
    return v.toString();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Widget _wrap(Widget child, {bool dark = false}) {
  return MaterialApp(
    theme: dark
        ? ThemeData.dark(useMaterial3: true)
        : ThemeData.light(useMaterial3: true),
    home: Scaffold(
      body: SingleChildScrollView(child: child),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ToolCallWidget golden tests', () {
    // -------------------------------------------------------------------------
    // Pending state
    // -------------------------------------------------------------------------

    testWidgets('tool_call_pending_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ToolCallWidget(
            toolName: 'search_web',
            arguments: {'query': 'nself self-hosted backend', 'limit': 5},
            state: ToolCallState.pending,
          ),
        ),
      );

      await expectLater(
        find.byType(ToolCallWidget),
        matchesGoldenFile('goldens/tool_call_pending_light.png'),
      );
    });

    // -------------------------------------------------------------------------
    // Success state
    // -------------------------------------------------------------------------

    testWidgets('tool_call_success_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ToolCallWidget(
            toolName: 'read_file',
            arguments: {'path': '/etc/nginx/nginx.conf'},
            result: '# nginx config\nworker_processes auto;\n...',
            state: ToolCallState.success,
          ),
        ),
      );

      await expectLater(
        find.byType(ToolCallWidget),
        matchesGoldenFile('goldens/tool_call_success_light.png'),
      );
    });

    // -------------------------------------------------------------------------
    // Error state
    // -------------------------------------------------------------------------

    testWidgets('tool_call_error_light', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ToolCallWidget(
            toolName: 'execute_command',
            arguments: {'command': 'rm -rf /important'},
            result: 'Permission denied: operation not allowed',
            state: ToolCallState.error,
          ),
        ),
      );

      await expectLater(
        find.byType(ToolCallWidget),
        matchesGoldenFile('goldens/tool_call_error_light.png'),
      );
    });

    // -------------------------------------------------------------------------
    // Dark mode
    // -------------------------------------------------------------------------

    testWidgets('tool_call_pending_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ToolCallWidget(
            toolName: 'search_web',
            arguments: {'query': 'nself self-hosted backend', 'limit': 5},
            state: ToolCallState.pending,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(ToolCallWidget),
        matchesGoldenFile('goldens/tool_call_pending_dark.png'),
      );
    });

    testWidgets('tool_call_success_dark', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ToolCallWidget(
            toolName: 'read_file',
            arguments: {'path': '/etc/nginx/nginx.conf'},
            result: '# nginx config\nworker_processes auto;\n...',
            state: ToolCallState.success,
          ),
          dark: true,
        ),
      );

      await expectLater(
        find.byType(ToolCallWidget),
        matchesGoldenFile('goldens/tool_call_success_dark.png'),
      );
    });
  });
}
