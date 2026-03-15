'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { ChatSession, Project } from '@/lib/types'
import { newProject, deleteProject, assignSessionToProject, loadProjects } from '@/lib/storage'
import KnowledgePanel from './KnowledgePanel'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onNewSession: () => void
  onNewSessionInProject: (projectId: string) => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onSessionsChanged: () => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onNewSessionInProject,
  onSelectSession,
  onDeleteSession,
  onSessionsChanged,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const newProjectInputRef = useRef<HTMLInputElement>(null)
  const [showKnowledge, setShowKnowledge] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    sessionId: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    setProjects(loadProjects())
  }, [sessions]) // reload when sessions change (deleteProject refreshes sessions)

  useEffect(() => {
    if (creatingProject) {
      newProjectInputRef.current?.focus()
    }
  }, [creatingProject])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    function handleClick() { setContextMenu(null) }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

  function handleCreateProject() {
    const name = newProjectName.trim()
    if (!name) { setCreatingProject(false); setNewProjectName(''); return }
    newProject(name)
    setProjects(loadProjects())
    setNewProjectName('')
    setCreatingProject(false)
    onSessionsChanged()
  }

  function handleDeleteProject(projectId: string) {
    deleteProject(projectId)
    setProjects(loadProjects())
    onSessionsChanged()
  }

  function toggleCollapse(projectId: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  function handleContextMenu(e: React.MouseEvent, sessionId: string) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ sessionId, x: e.clientX, y: e.clientY })
  }

  function handleAssignToProject(sessionId: string, projectId: string | undefined) {
    assignSessionToProject(sessionId, projectId)
    setContextMenu(null)
    onSessionsChanged()
  }

  // Group sessions
  const ungrouped = sessions.filter((s) => !s.project_id)
  const projectMap = new Map<string, ChatSession[]>()
  for (const p of projects) {
    projectMap.set(p.id, sessions.filter((s) => s.project_id === p.id))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg py-1 shadow-lg text-sm"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            minWidth: '160px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Move to project
          </p>
          <button
            type="button"
            onClick={() => handleAssignToProject(contextMenu.sessionId, undefined)}
            className="w-full text-left px-3 py-1.5 hover:bg-[#2A2A40] transition-colors"
            style={{ color: 'var(--text)' }}
          >
            General
          </button>
          {projects.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => handleAssignToProject(contextMenu.sessionId, p.id)}
              className="w-full text-left px-3 py-1.5 hover:bg-[#2A2A40] transition-colors truncate"
              style={{ color: 'var(--text)' }}
            >
              {p.name}
            </button>
          ))}
        </div>
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCreatingProject(true)}
              title="New project"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2A2A40] transition-colors text-[#8888A8] hover:text-white"
            >
              <FolderPlusIcon />
            </button>
            <button
              type="button"
              onClick={onNewSession}
              title="New chat"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2A2A40] transition-colors text-[#8888A8] hover:text-white"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* New project input */}
        {creatingProject && (
          <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
            <input
              ref={newProjectInputRef}
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject()
                if (e.key === 'Escape') { setCreatingProject(false); setNewProjectName('') }
              }}
              placeholder="Project name…"
              className="w-full bg-transparent text-sm outline-none px-2 py-1 rounded"
              style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={handleCreateProject}
                className="flex-1 text-xs py-1 rounded transition-colors"
                style={{ background: '#6366F1', color: 'white' }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => { setCreatingProject(false); setNewProjectName('') }}
                className="flex-1 text-xs py-1 rounded hover:bg-[#2A2A40] transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Knowledge panel (collapsible) */}
        {showKnowledge && (
          <div
            className="shrink-0 flex flex-col"
            style={{
              height: '52%',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <BookSidebarIcon />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Knowledge
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledge(false)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2A2A40] transition-colors text-[#8888A8] hover:text-white"
              >
                <XSmSidebarIcon />
              </button>
            </div>
            <KnowledgePanel />
          </div>
        )}

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {/* Projects */}
          {projects.map((project) => {
            const projectSessions = projectMap.get(project.id) ?? []
            const isCollapsed = collapsedProjects.has(project.id)
            return (
              <div key={project.id}>
                {/* Project header */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-lg cursor-pointer group hover:bg-[#222236] transition-colors"
                  onClick={() => toggleCollapse(project.id)}
                >
                  <ChevronIcon collapsed={isCollapsed} />
                  <FolderIcon />
                  <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
                    {project.name}
                  </span>
                  <span className="text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>
                    {projectSessions.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onNewSessionInProject(project.id) }}
                    title="New chat in project"
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-[#3A3A50] transition-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <PlusSmIcon />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                    title="Delete project"
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:text-red-400 transition-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Project sessions */}
                {!isCollapsed && (
                  <div className="pl-4">
                    {projectSessions.length === 0 && (
                      <p className="px-3 py-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        No chats yet
                      </p>
                    )}
                    {projectSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        onSelect={onSelectSession}
                        onDelete={onDeleteSession}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* General (ungrouped) */}
          {ungrouped.length > 0 && (
            <div>
              {projects.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 mx-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    General
                  </span>
                </div>
              )}
              {ungrouped.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={onSelectSession}
                  onDelete={onDeleteSession}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              No sessions yet. Start a new chat.
            </p>
          )}
        </nav>

        {/* Footer nav */}
        <div className="shrink-0 px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setShowKnowledge((v) => !v)}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              showKnowledge
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <BookSidebarIcon />
            Docs
          </button>
          <button
            type="button"
            onClick={() => router.push('/memories')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/memories'
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <BrainIcon />
            Memories
          </button>
          <button
            type="button"
            onClick={() => router.push('/digest')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/digest'
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <DigestIcon />
            Digest
          </button>
                    <button
            type="button"
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
            type="button"
            onClick={() => router.push('/settings/proactive')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/settings/proactive'
                ? 'bg-[#2A2A40] text-white'
                : 'text-[#8888A8] hover:bg-[#222236] hover:text-white',
            ].join(' ')}
          >
            <ScheduleIcon />
            Proactive
          </button>
                    <button
            type="button"
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

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  isActive,
  onSelect,
  onDelete,
  onContextMenu,
}: {
  session: ChatSession
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, sessionId: string) => void
}) {
  return (
    <div
      className={[
        'group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-[#2A2A40]' : 'hover:bg-[#222236]',
      ].join(' ')}
      onClick={() => onSelect(session.id)}
      onContextMenu={(e) => onContextMenu(e, session.id)}
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
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:text-red-400 transition-all shrink-0"
        style={{ color: 'var(--text-muted)' }}
        title="Delete"
      >
        <TrashIcon />
      </button>
    </div>
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

function PlusSmIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="5" y1="1" x2="5" y2="9" />
      <line x1="1" y1="5" x2="9" y2="5" />
    </svg>
  )
}

function FolderPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" />
      <line x1="8" y1="8" x2="8" y2="12" />
      <line x1="6" y1="10" x2="10" y2="10" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
    >
      <polyline points="2,3 5,7 8,3" />
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

function BookSidebarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h5c.9 0 1.7.4 2 1 .3-.6 1.1-1 2-1h3v11h-3c-.9 0-1.7.4-2 1-.3-.6-1.1-1-2-1H2z" />
      <line x1="9" y1="3" x2="9" y2="13" />
    </svg>
  )
}

function XSmSidebarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="8" y2="8" />
      <line x1="8" y1="2" x2="2" y2="8" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/>
      <path d="M14.5 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
      <path d="M2 9.5A2.5 2.5 0 1 1 7 9.5 2.5 2.5 0 0 1 2 9.5z"/>
      <path d="M22 9.5A2.5 2.5 0 1 0 17 9.5a2.5 2.5 0 0 0 5 0z"/>
      <path d="M9.5 17a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
      <path d="M14.5 17a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/>
      <path d="M12 7v10M7 9.5h10"/>
    </svg>
  )
}

function DigestIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="2"/>
      <line x1="5" y1="6" x2="11" y2="6"/>
      <line x1="5" y1="8.5" x2="11" y2="8.5"/>
      <line x1="5" y1="11" x2="8" y2="11"/>
    </svg>
  )
}

function ScheduleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6"/>
      <polyline points="8,4 8,8 11,10"/>
    </svg>
  )
}
