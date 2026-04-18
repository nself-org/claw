'use client';

import React from 'react';
import {
  AlertCircle,
  Lock,
  Search,
  SearchX,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { EmptyStateVariant } from '@/types';

interface EmptyStateConfig {
  icon: React.ReactNode;
  heading: string;
  description: string;
  hasRetry: boolean;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, EmptyStateConfig> = {
  firstTime: {
    icon: (
      <Sparkles
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
    heading: 'Start your first conversation',
    description: 'ɳClaw remembers everything — just start talking.',
    hasRetry: false,
  },
  error: {
    icon: (
      <AlertCircle
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-error)' }}
      />
    ),
    heading: 'Something went wrong',
    description: 'An error occurred — tap to try again.',
    hasRetry: true,
  },
  offline: {
    icon: (
      <WifiOff
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
    heading: "You're offline",
    description: 'Check your connection and try again.',
    hasRetry: true,
  },
  noResults: {
    icon: (
      <SearchX
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
    heading: 'Nothing here yet',
    description: 'No conversations match your search.',
    hasRetry: false,
  },
  loading: {
    icon: <Spinner size="lg" aria-label="Loading content" />,
    heading: 'Loading...',
    description: '',
    hasRetry: false,
  },
  forbidden: {
    icon: (
      <Lock
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
    heading: 'Access denied',
    description: "You don't have permission to view this.",
    hasRetry: false,
  },
  searchEmpty: {
    icon: (
      <Search
        size={48}
        aria-hidden="true"
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
    heading: 'No matches',
    description: 'Try a different search term.',
    hasRetry: false,
  },
};

interface EmptyStateProps {
  variant: EmptyStateVariant;
  heading?: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function EmptyState({
  variant,
  heading,
  description,
  action,
  onRetry,
  className,
}: EmptyStateProps): React.ReactElement {
  const config = VARIANT_CONFIG[variant];
  const resolvedHeading = heading ?? config.heading;
  const resolvedDescription = description ?? config.description;
  const showRetry = config.hasRetry && onRetry != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="status"
      aria-live="polite"
      aria-label={resolvedHeading}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: '12px',
      }}
    >
      <div style={{ marginBottom: '4px' }}>{config.icon}</div>

      <h2
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text)',
          lineHeight: 1.4,
        }}
      >
        {resolvedHeading}
      </h2>

      {resolvedDescription && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            maxWidth: '280px',
          }}
        >
          {resolvedDescription}
        </p>
      )}

      {showRetry && (
        <div style={{ marginTop: '8px' }}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {action != null && <div style={{ marginTop: '8px' }}>{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
