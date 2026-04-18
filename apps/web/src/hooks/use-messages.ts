'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import type { Message, SendMessageRequest } from '@/types';

function messagesKey(conversationId: string) {
  return ['messages', conversationId] as const;
}

/**
 * Hook for message management within a single conversation.
 *
 * - Fetches the message list for conversationId via TanStack Query.
 * - Syncs fetched messages into the Zustand chat store.
 * - Manages streaming state: opens a ReadableStream, appends deltas incrementally.
 * - Exposes sendMessage (initiates a stream) and stopStream (aborts it).
 */
export function useMessages(conversationId: string): {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, topicId?: string | null) => Promise<void>;
  isStreaming: boolean;
  stopStream: () => void;
} {
  const queryClient = useQueryClient();

  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendStreamingContent = useChatStore((s) => s.appendStreamingContent);
  const clearStreamingContent = useChatStore((s) => s.clearStreamingContent);
  const storeMessages = useChatStore((s) => s.messages[conversationId] ?? []);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { isLoading, error } = useQuery({
    queryKey: messagesKey(conversationId),
    queryFn: async () => {
      const page = await api.listMessages(conversationId);
      return page.data;
    },
    staleTime: 10_000,
    enabled: conversationId.length > 0,
    // Sync into Zustand on each successful fetch.
    select: (data: Message[]) => {
      setMessages(conversationId, data);
      return data;
    },
  });

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    clearStreamingContent();
  }, [clearStreamingContent]);

  const sendMessage = useCallback(
    async (content: string, topicId?: string | null): Promise<void> => {
      if (!content.trim() || isStreaming) return;

      // Optimistically append the user message.
      const userMsg: Message = {
        id: `local-user-${Date.now()}`,
        conversationId,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
        tokens: null,
      };
      appendMessage(userMsg);

      // Placeholder assistant message for streaming.
      const assistantMsgId = `local-assistant-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantMsgId,
        conversationId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        tokens: null,
      };
      appendMessage(assistantMsg);

      clearStreamingContent();
      setIsStreaming(true);

      const req: SendMessageRequest = {
        conversationId,
        content: content.trim(),
        topicId: topicId ?? null,
      };

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const stream = await api.sendMessageRaw(req);
        const reader = stream.getReader();
        let accumulated = '';

        while (true) {
          if (abort.signal.aborted) break;

          const { done, value } = await reader.read();
          if (done) break;

          if (value.type === 'delta' && value.content) {
            accumulated += value.content;
            appendStreamingContent(value.content);

            // Patch the in-progress assistant message with accumulated content.
            const current = useChatStore.getState().messages[conversationId] ?? [];
            setMessages(conversationId, [
              ...current.filter((m) => m.id !== assistantMsgId),
              { ...assistantMsg, content: accumulated },
            ]);
          }
        }
      } finally {
        setIsStreaming(false);
        clearStreamingContent();
        abortRef.current = null;
        // Invalidate so the next focus refreshes from server.
        void queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
      }
    },
    [
      conversationId,
      isStreaming,
      appendMessage,
      appendStreamingContent,
      clearStreamingContent,
      setMessages,
      queryClient,
    ],
  );

  return {
    messages: storeMessages,
    isLoading,
    error: error as Error | null,
    sendMessage,
    isStreaming,
    stopStream,
  };
}

export default useMessages;
