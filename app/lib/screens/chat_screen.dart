import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/chat_provider.dart';
import '../providers/connection_provider.dart';

/// Full-screen chat UI for the nClaw AI assistant.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final serverUrl =
        ref.read(connectionProvider).activeServer?.url ?? '';
    _textController.clear();

    ref.read(chatProvider.notifier).sendMessage(text, serverUrl);
  }

  void _showSessionList(BuildContext context) {
    final sessions = ref.read(chatSessionsProvider);
    final activeId = ref.read(chatProvider).activeSessionId;

    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text(
                  'Sessions',
                  style: Theme.of(ctx).textTheme.titleMedium,
                ),
                const Spacer(),
                TextButton.icon(
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('New'),
                  onPressed: () {
                    ref.read(chatProvider.notifier).newSession();
                    Navigator.of(ctx).pop();
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: sessions.length,
              itemBuilder: (_, index) {
                final session = sessions[index];
                final isActive = session.id == activeId;
                return ListTile(
                  leading: Icon(
                    Icons.chat_bubble_outline,
                    color: isActive
                        ? Theme.of(ctx).colorScheme.primary
                        : null,
                  ),
                  title: Text(session.displayTitle),
                  subtitle: Text(
                    '${session.messages.length} message${session.messages.length == 1 ? '' : 's'}',
                    style: Theme.of(ctx).textTheme.bodySmall,
                  ),
                  trailing: isActive
                      ? Icon(Icons.check,
                          color: Theme.of(ctx).colorScheme.primary)
                      : null,
                  onTap: () {
                    ref
                        .read(chatProvider.notifier)
                        .switchSession(session.id);
                    Navigator.of(ctx).pop();
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final messages = chatState.messages;
    final isStreaming = chatState.isStreaming;
    final sessionTitle = chatState.activeSession?.displayTitle ?? '\u014BClaw';

    return Scaffold(
      appBar: AppBar(
        title: Text(sessionTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.list),
            tooltip: 'Sessions',
            onPressed: () => _showSessionList(context),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        mini: true,
        onPressed: () => ref.read(chatProvider.notifier).newSession(),
        tooltip: 'New session',
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? _EmptyChat(isStreaming: isStreaming)
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      // Reversed list — index 0 is the last message.
                      final msg =
                          messages[messages.length - 1 - index];
                      return _MessageBubble(message: msg);
                    },
                  ),
          ),
          _InputBar(
            controller: _textController,
            isStreaming: isStreaming,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

/// Empty state shown when there are no messages yet.
class _EmptyChat extends StatelessWidget {
  final bool isStreaming;

  const _EmptyChat({required this.isStreaming});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isStreaming) {
      return const Center(child: CircularProgressIndicator());
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
          ),
          const SizedBox(height: 16),
          Text(
            'Ask \u014BClaw anything',
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

/// A single message bubble (user on right, assistant on left).
class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    final theme = Theme.of(context);

    return GestureDetector(
      onLongPress: () {
        Clipboard.setData(ClipboardData(text: message.content));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Copied to clipboard'),
            duration: Duration(seconds: 2),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: isUser
                  ? MainAxisAlignment.end
                  : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!isUser) ...[
                  CircleAvatar(
                    radius: 14,
                    backgroundColor:
                        theme.colorScheme.primary.withValues(alpha: 0.2),
                    child: Icon(
                      Icons.smart_toy_outlined,
                      size: 16,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Flexible(
                  child: isUser
                      ? _UserBubble(content: message.content, theme: theme)
                      : _AssistantBubble(
                          content: message.content, theme: theme),
                ),
                if (isUser) const SizedBox(width: 8),
              ],
            ),
            if (!isUser && message.tierSource != null) ...[
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.only(left: 36),
                child: _TierBadge(
                  tierSource: message.tierSource!,
                  latencyMs: message.latencyMs,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// User message chip (indigo, right-aligned).
class _UserBubble extends StatelessWidget {
  final String content;
  final ThemeData theme;

  const _UserBubble({required this.content, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.75,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(18),
          topRight: Radius.circular(18),
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(4),
        ),
      ),
      child: Text(
        content,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onPrimary,
        ),
      ),
    );
  }
}

/// Assistant message card (dark, left-aligned).
class _AssistantBubble extends StatelessWidget {
  final String content;
  final ThemeData theme;

  const _AssistantBubble({required this.content, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.75,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(4),
          topRight: Radius.circular(18),
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(18),
        ),
      ),
      child: Text(
        content,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onSurface,
        ),
      ),
    );
  }
}

/// Small badge showing which AI tier/model served the response.
///
/// Color coding:
///   local         → green
///   free / gemini → blue
///   api_key       → orange
///   default       → grey
class _TierBadge extends StatelessWidget {
  final String tierSource;
  final int? latencyMs;

  const _TierBadge({required this.tierSource, this.latencyMs});

  Color _badgeColor(BuildContext context) {
    final lower = tierSource.toLowerCase();
    if (lower.contains('local') || lower.contains('phi')) {
      return Colors.green;
    }
    if (lower.contains('free') ||
        lower.contains('gemini') ||
        lower.contains('flash')) {
      return Colors.blue;
    }
    if (lower.contains('api') ||
        lower.contains('claude') ||
        lower.contains('openai') ||
        lower.contains('gpt')) {
      return Colors.orange;
    }
    return Colors.grey;
  }

  String _label() {
    final latency = latencyMs != null
        ? ' \u2022 ${(latencyMs! / 1000).toStringAsFixed(1)}s'
        : '';
    return '$tierSource$latency';
  }

  @override
  Widget build(BuildContext context) {
    final color = _badgeColor(context);

    return Chip(
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
      side: BorderSide(color: color.withValues(alpha: 0.4)),
      backgroundColor: color.withValues(alpha: 0.12),
      label: Text(
        _label(),
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

/// Bottom input bar with text field and send/loading button.
class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isStreaming;
  final VoidCallback onSend;

  const _InputBar({
    required this.controller,
    required this.isStreaming,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'Message \u014BClaw...',
                  hintStyle: TextStyle(
                    color: theme.colorScheme.onSurface
                        .withValues(alpha: 0.4),
                  ),
                  filled: true,
                  fillColor:
                      theme.colorScheme.surfaceContainerHighest,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (_) {
                  if (!isStreaming) onSend();
                },
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 44,
              height: 44,
              child: isStreaming
                  ? const Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    )
                  : IconButton.filled(
                      icon: const Icon(Icons.send, size: 20),
                      onPressed: onSend,
                      tooltip: 'Send',
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
