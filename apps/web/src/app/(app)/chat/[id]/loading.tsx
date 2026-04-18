import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Next.js loading.tsx for /chat/[id].
 * Displayed while the page chunk and initial data are being fetched.
 * Shows 3 skeleton message bubble rows matching the real layout proportions.
 */
export default function ConversationLoading(): React.ReactElement {
  return (
    <div
      aria-label="Loading conversation"
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        height: '100%',
        boxSizing: 'border-box',
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
