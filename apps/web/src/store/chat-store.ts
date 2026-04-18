'use client';

import { create } from 'zustand';
import type { Conversation, Message, Topic } from '@/types';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  topics: Topic[];
  isStreaming: boolean;
  streamingContent: string;
  searchQuery: string;

  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setCurrentConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  setTopics: (topics: Topic[]) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingContent: (delta: string) => void;
  clearStreamingContent: () => void;
  setSearchQuery: (q: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  topics: [],
  isStreaming: false,
  streamingContent: '',
  searchQuery: '',

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conv) =>
    set((s) => ({ conversations: [conv, ...s.conversations] })),

  updateConversation: (id, updates) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      currentConversationId:
        s.currentConversationId === id ? null : s.currentConversationId,
    })),

  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: messages } })),

  appendMessage: (message) => {
    const { conversationId } = message;
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [
          ...(s.messages[conversationId] ?? []),
          message,
        ],
      },
    }));
  },

  setTopics: (topics) => set({ topics }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamingContent: (delta) =>
    set((s) => ({ streamingContent: s.streamingContent + delta })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
