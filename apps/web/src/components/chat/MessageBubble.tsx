'use client';

import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import type { Message } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Relative time label: "just now", "2 min ago", etc. */
function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Derive up-to-2-char initials from a display string. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Render content: newlines become <br />, everything else is text. */
function renderContent(content: string): React.ReactElement {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageBubbleProps {
  message: Message;
  /** When true, renders a blinking cursor at the end (streaming in progress). */
  isStreaming?: boolean;
  /** Display name for the user (used for initials avatar). */
  userName?: string;
}

// ---------------------------------------------------------------------------
// Avatar components
// ---------------------------------------------------------------------------

function AssistantAvatar(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '12px',
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '-0.5px',
        userSelect: 'none',
      }}
    >
      ɳ
    </div>
  );
}

function UserAvatar({ name }: { name: string }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.25)',
        border: '1px solid rgba(99,102,241,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--color-primary-text)',
        userSelect: 'none',
      }}
    >
      {initials(name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MessageBubble({
  message,
  isStreaming = false,
  userName = 'You',
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bubbleStyle: React.CSSProperties = isUser
    ? {
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '12px 12px 4px 12px',
        padding: '10px 14px',
        maxWidth: '75%',
      }
    : {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px 12px 12px 4px',
        padding: '10px 14px',
        maxWidth: '82%',
      };

  return (
    <div
      role="listitem"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '2px 0',
      }}
    >
      {/* Avatar */}
      {isUser ? (
        <UserAvatar name={userName} />
      ) : (
        <AssistantAvatar />
      )}

      {/* Bubble + meta */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          gap: '4px',
          minWidth: 0,
        }}
      >
        {/* Content */}
        <div style={bubbleStyle}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '22px',
              color: 'var(--color-text)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderContent(message.content)}
            {isStreaming && (
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '14px',
                  background: 'var(--color-primary-text)',
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'nclaw-cursor-blink 900ms step-end infinite',
                }}
              />
            )}
          </p>

          {/* Token badge */}
          {message.tokens !== null && message.tokens > 0 && (
            <span
              aria-label={`${message.tokens} tokens`}
              style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                opacity: 0.7,
                userSelect: 'none',
              }}
            >
              {message.tokens} tokens
            </span>
          )}
        </div>

        {/* Hover meta row: timestamp + copy */}
        <div
          aria-hidden={!hovered}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: hovered ? 1 : 0,
            transition: 'opacity var(--transition-fast)',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              userSelect: 'none',
            }}
          >
            {relativeTime(message.createdAt)}
          </span>

          <button
            type="button"
            aria-label={copied ? 'Copied' : 'Copy message'}
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '5px',
              border: 'none',
              background: 'transparent',
              color: copied
                ? 'var(--color-success)'
                : 'var(--color-text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <Copy size={11} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Cursor blink keyframe */}
      <style>{`
        @keyframes nclaw-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MessageBubble;
