'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chat-store';
import { useMessages } from '@/hooks/use-messages';
import { MessageList } from '@/components/chat/MessageList';
import { InputBar } from '@/components/chat/InputBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Skeleton loading state — 3 message bubble rows
// ---------------------------------------------------------------------------

function MessageSkeletons(): React.ReactElement {
  return (
    <div
      aria-label="Loading messages"
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        flex: 1,
      }}
    >
      {/* User bubble — right-aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rect" width="55%" height={52} />
      </div>
      {/* Assistant bubble — left-aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Skeleton variant="rect" width="72%" height={88} />
      </div>
      {/* User bubble — right-aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton variant="rect" width="40%" height={52} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner page — receives resolved conversationId string
// ---------------------------------------------------------------------------

interface ConversationPageInnerProps {
  conversationId: string;
}

function ConversationPageInner({
  conversationId,
}: ConversationPageInnerProps): React.ReactElement {
  const router = useRouter();
  const setCurrentConversationId = useChatStore((s) => s.setCurrentConversationId);

  const { isLoading, error } = useMessages(conversationId);

  // Register the active conversation in global store.
  useEffect(() => {
    setCurrentConversationId(conversationId);
    return () => {
      setCurrentConversationId(null);
    };
  }, [conversationId, setCurrentConversationId]);

  const handleRetry = useCallback(() => {
    router.refresh();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <MessageSkeletons />
      </div>
    );
  }

  if (error) {
    const isNotFound =
      error instanceof Error &&
      'status' in error &&
      (error as Error & { status: number }).status === 404;

    if (isNotFound) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <EmptyState
            variant="noResults"
            heading="Conversation not found"
            description="This conversation may have been deleted or the link is invalid."
          />
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <EmptyState variant="error" onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Message list — scrollable */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList conversationId={conversationId} />
      </div>

      {/* Input bar — sticky at bottom */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 24px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <InputBar conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — Next.js 14 client page with dynamic params
// ---------------------------------------------------------------------------

interface ChatPageProps {
  params: { id: string };
}

export default function ChatPage({ params }: ChatPageProps): React.ReactElement {
  return <ConversationPageInner conversationId={params.id} />;
}
