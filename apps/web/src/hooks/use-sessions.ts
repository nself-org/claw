'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import { backfillUntitledSessions } from '@/lib/session-titler';
import type { Conversation } from '@/types';

const CONVERSATIONS_KEY = ['conversations'] as const;

/**
 * Hook for session (conversation) management.
 *
 * - Fetches the full conversations list via TanStack Query.
 * - Syncs the result into the Zustand chat store.
 * - Auto-backfills untitled sessions once per mount.
 * - Exposes createConversation and deleteConversation mutations.
 */
export function useSessions(): {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  createConversation: (topicId?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const setConversations = useChatStore((s) => s.setConversations);
  const addConversation = useChatStore((s) => s.addConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const storeConversations = useChatStore((s) => s.conversations);

  // Track whether the backfill has already been attempted this mount.
  const backfillDoneRef = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const page = await api.listConversations(1, 200);
      return page.data;
    },
    staleTime: 30_000,
  });

  // Keep store in sync whenever query data changes.
  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);

  // Backfill untitled sessions once after the first successful fetch.
  useEffect(() => {
    if (!data || backfillDoneRef.current) return;
    backfillDoneRef.current = true;

    void backfillUntitledSessions(data, updateConversation);
  }, [data, updateConversation]);

  const createMutation = useMutation({
    mutationFn: (topicId?: string) => api.createConversation(topicId),
    onSuccess: (conv) => {
      addConversation(conv);
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: (_data, id) => {
      removeConversation(id);
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const createConversation = async (topicId?: string): Promise<Conversation> => {
    return createMutation.mutateAsync(topicId);
  };

  const deleteConversation = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    conversations: storeConversations,
    isLoading,
    error: error as Error | null,
    createConversation,
    deleteConversation,
  };
}

export default useSessions;
