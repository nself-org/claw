import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

/// A single chat message (user or assistant).
class ChatMessage {
  final String id;
  final String role; // 'user' or 'assistant'
  final String content;
  final String? tierSource;
  final int? latencyMs;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    this.tierSource,
    this.latencyMs,
    required this.createdAt,
  });
}

/// A chat session holding a list of messages.
class ChatSession {
  final String id;
  final String title;
  final DateTime createdAt;
  final List<ChatMessage> messages;

  const ChatSession({
    required this.id,
    required this.title,
    required this.createdAt,
    this.messages = const [],
  });

  ChatSession copyWith({
    String? id,
    String? title,
    DateTime? createdAt,
    List<ChatMessage>? messages,
  }) {
    return ChatSession(
      id: id ?? this.id,
      title: title ?? this.title,
      createdAt: createdAt ?? this.createdAt,
      messages: messages ?? this.messages,
    );
  }
}

/// Combined state for the chat provider.
class ChatState {
  final List<ChatSession> sessions;
  final String? activeSessionId;
  final bool isStreaming;
  final String streamingContent;

  const ChatState({
    this.sessions = const [],
    this.activeSessionId,
    this.isStreaming = false,
    this.streamingContent = '',
  });

  /// The currently active session, if any.
  ChatSession? get activeSession {
    if (activeSessionId == null) return null;
    try {
      return sessions.firstWhere((s) => s.id == activeSessionId);
    } catch (_) {
      return null;
    }
  }

  /// Messages from the active session.
  List<ChatMessage> get messages => activeSession?.messages ?? const [];

  ChatState copyWith({
    List<ChatSession>? sessions,
    String? activeSessionId,
    bool? isStreaming,
    String? streamingContent,
  }) {
    return ChatState(
      sessions: sessions ?? this.sessions,
      activeSessionId: activeSessionId ?? this.activeSessionId,
      isStreaming: isStreaming ?? this.isStreaming,
      streamingContent: streamingContent ?? this.streamingContent,
    );
  }
}

/// Simple uuid-like generator using timestamp + random suffix.
String _generateId() {
  final now = DateTime.now().microsecondsSinceEpoch;
  final rand = (now % 999983).toString().padLeft(6, '0');
  return '${now}_$rand';
}

/// Manages chat sessions and message exchange with the nself-claw backend.
class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier() : super(const ChatState()) {
    _createInitialSession();
  }

  void _createInitialSession() {
    final session = ChatSession(
      id: _generateId(),
      title: 'New Chat',
      createdAt: DateTime.now(),
    );
    state = ChatState(
      sessions: [session],
      activeSessionId: session.id,
    );
  }

  /// Create a new chat session and make it active.
  void newSession() {
    final session = ChatSession(
      id: _generateId(),
      title: 'New Chat',
      createdAt: DateTime.now(),
    );
    state = state.copyWith(
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    );
  }

  /// Switch to an existing session by id.
  void switchSession(String id) {
    state = state.copyWith(activeSessionId: id);
  }

  /// Send a user message and fetch the assistant response.
  ///
  /// Uses a non-streaming HTTP POST to `/claw/chat`.
  /// Falls back gracefully if the server URL is empty or the request fails.
  Future<void> sendMessage(String text, String serverUrl) async {
    final sessionId = state.activeSessionId;
    if (sessionId == null) return;

    // 1. Add the user message immediately.
    final userMsg = ChatMessage(
      id: _generateId(),
      role: 'user',
      content: text,
      createdAt: DateTime.now(),
    );
    _appendMessage(sessionId, userMsg);

    // 2. Begin streaming indicator.
    state = state.copyWith(isStreaming: true, streamingContent: '');

    try {
      if (serverUrl.isEmpty) {
        throw Exception('No server connected');
      }

      // 3. POST to /claw/chat.
      final uri = Uri.parse('$serverUrl/claw/chat');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'session_id': sessionId,
          'message': text,
          'stream': false,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}: ${response.body}');
      }

      // 4. Parse the response.
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final responseText = data['response'] as String? ?? '';
      final tierSource = data['tier_source'] as String?;
      final latencyMs = data['latency_ms'] as int?;

      // 5. Add the assistant message.
      final assistantMsg = ChatMessage(
        id: _generateId(),
        role: 'assistant',
        content: responseText,
        tierSource: tierSource,
        latencyMs: latencyMs,
        createdAt: DateTime.now(),
      );
      _appendMessage(sessionId, assistantMsg);
    } catch (e) {
      // On any error, add an error message as the assistant reply.
      final errorMsg = ChatMessage(
        id: _generateId(),
        role: 'assistant',
        content: 'Error: $e',
        createdAt: DateTime.now(),
      );
      _appendMessage(sessionId, errorMsg);
    } finally {
      // 6. Always clear streaming state.
      state = state.copyWith(isStreaming: false, streamingContent: '');
    }
  }

  /// Append a message to the specified session.
  void _appendMessage(String sessionId, ChatMessage message) {
    final updatedSessions = state.sessions.map((s) {
      if (s.id != sessionId) return s;
      return s.copyWith(messages: [...s.messages, message]);
    }).toList();
    state = state.copyWith(sessions: updatedSessions);
  }
}

/// The primary chat provider.
final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>(
  (ref) => ChatNotifier(),
);

/// Convenience provider for the list of chat sessions.
final chatSessionsProvider = Provider<List<ChatSession>>(
  (ref) => ref.watch(chatProvider).sessions,
);
