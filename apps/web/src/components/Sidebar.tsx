'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { ChatSession } from '@/lib/types'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-col w-64',
          'transition-transform duration-200',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xl font-bold text-[#6366F1]">ɳClaw</span>
          <button
            onClick={onNewSession}
            title="New chat"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A40] transition-colors text-[#8888A8] hover:text-white"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 && (
            <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              No sessions yet. Start a new chat.
            </p>
          )}
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <div
                key={session.id}
                className={[
                  'group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer',
                  'transition-colors',
                  isActive
                    ? 'bg-[#2A2A40]'
                    : 'hover:bg-[#222236]',
                ].join(' ')}
                onClick={() => onSelectSession(session.id)}
              >
                <ChatBubbleIcon className={isActive ? 'text-[#6366F1]' : 'text-[#8888A8]'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>
                    {session.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {session.message_count} msg{session.message_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:text-red-400 transition-all shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </nav>

        {/* Footer nav */}
        <div className="shrink-0 px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => router.push('/usage')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/usage'
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <ChartIcon />
            Usage
          </button>
          <button
            onClick={() => router.push('/admin')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/admin'
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <AdminIcon />
            Admin
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  )
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5l-3 3V3a1 1 0 0 1 1-1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 14,4" />
      <path d="M6 4V2h4v2" />
      <rect x="3" y="4" width="10" height="10" rx="1" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="9" width="4" height="6" />
      <rect x="6" y="5" width="4" height="10" />
      <rect x="11" y="2" width="4" height="13" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.5" />
      <line x1="8" y1="2" x2="8" y2="5.5" />
      <line x1="8" y1="10.5" x2="8" y2="14" />
      <line x1="2" y1="8" x2="5.5" y2="8" />
      <line x1="10.5" y1="8" x2="14" y2="8" />
    </svg>
  )
}
