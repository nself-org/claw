'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/store/chat-store';
import { useAppStore } from '@/store/app-store';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Message } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageListProps {
  conversationId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({ conversationId }: MessageListProps): React.ReactElement {
  const allMessages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);

  const messages: Message[] = allMessages[conversationId] ?? [];

  // Resolve display name for user avatar initials
  const userName: string =
    settings?.displayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'You';

  // Scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track whether the user has scrolled up to read history; if so, suppress
  // auto-scroll until they return to the bottom.
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up IntersectionObserver on the sentinel at the bottom of the list
  useEffect(() => {
    const sentinel = bottomRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // If the sentinel is visible, user is at the bottom
        if (entry.isIntersecting) {
          setUserScrolledUp(false);
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observerRef.current.observe(sentinel);

    return () => observerRef.current?.disconnect();
  }, []);

  // Detect manual upward scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom > 80) {
      setUserScrolledUp(true);
    }
  };

  // Auto-scroll to bottom when new messages arrive (unless user is reading history)
  useEffect(() => {
    if (userScrolledUp) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streamingContent, userScrolledUp]);

  // Always scroll to bottom when conversation changes
  useEffect(() => {
    setUserScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [conversationId]);

  // Determine which message is the streaming one (last assistant message with
  // empty or in-progress content while isStreaming is true).
  const streamingMsgId: string | null =
    isStreaming && messages.length > 0
      ? (messages.findLast((m) => m.role === 'assistant')?.id ?? null)
      : null;

  if (messages.length === 0) {
    return (
      <div
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <EmptyState variant="firstTime" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      aria-relevant="additions"
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        gap: '4px',
      }}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={
            // Patch streaming assistant message with live content
            isStreaming && msg.id === streamingMsgId
              ? { ...msg, content: streamingContent || msg.content }
              : msg
          }
          isStreaming={isStreaming && msg.id === streamingMsgId}
          userName={userName}
        />
      ))}

      {/* Scroll sentinel */}
      <div ref={bottomRef} aria-hidden="true" style={{ height: '1px', flexShrink: 0 }} />
    </div>
  );
}

export default MessageList;
