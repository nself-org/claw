'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';

interface ConversationEmptyStateProps {
  onNewConversation?: () => void;
}

export function ConversationEmptyState({
  onNewConversation,
}: ConversationEmptyStateProps): React.ReactElement {
  const user = useAppStore((s) => s.user);

  function handleNew(): void {
    onNewConversation?.();
  }

  return (
    <EmptyState
      variant="firstTime"
      description={
        user
          ? 'ɳClaw remembers everything — just start talking.'
          : 'Sign in and start your first conversation.'
      }
      action={
        <Button
          variant="primary"
          size="md"
          onClick={handleNew}
          aria-label="Start a new conversation"
        >
          <Plus size={16} aria-hidden="true" />
          New conversation
        </Button>
      }
    />
  );
}

export default ConversationEmptyState;
