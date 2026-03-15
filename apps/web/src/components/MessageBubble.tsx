'use client'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import TierChip from './TierChip'
import type { ChatMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: 'rgba(99,102,241,0.2)' }}
        >
          <BotIcon />
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {isUser ? (
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
            style={{
              background: '#6366F1',
              color: '#fff',
            }}
          >
            {message.content}
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm ${isStreaming ? 'streaming-cursor' : ''}`}
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="prose-nclaw">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Tier chip — only for assistant messages with tier info */}
        {!isUser && message.tier_source && !isStreaming && (
          <TierChip tierSource={message.tier_source} latencyMs={message.latency_ms} />
        )}

        {/* Knowledge badge — shown when knowledge base informed the response */}
        {!isUser && message.knowledge_used && !isStreaming && (
          <div title="Response informed by nSelf knowledge base">
            <KnowledgeBadge />
          </div>
        )}
      </div>

      {/* User avatar placeholder spacer */}
      {isUser && <div className="w-7 shrink-0" />}
    </div>
  )
}

function KnowledgeBadge() {
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.25)',
        color: '#a5b4fc',
      }}
    >
      <BookBadgeIcon />
      docs used
    </div>
  )
}

function BookBadgeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h5c.9 0 1.7.4 2 1 .3-.6 1.1-1 2-1h3v11h-3c-.9 0-1.7.4-2 1-.3-.6-1.1-1-2-1H2z" />
      <line x1="9" y1="3" x2="9" y2="13" />
    </svg>
  )
}

function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )
}
