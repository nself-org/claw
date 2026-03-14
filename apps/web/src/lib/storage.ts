import type { ChatSession, ChatMessage, Project } from './types'

const SESSIONS_KEY = 'nclaw_sessions'
const PROJECTS_KEY = 'nclaw_projects'
const AUTH_COOKIE = 'nclaw_auth'

// ── Project storage (localStorage) ───────────────────────────────────────────

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Project[]
  } catch {
    return []
  }
}

function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function newProject(name: string): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled Project',
    created_at: new Date().toISOString(),
  }
  const projects = loadProjects()
  projects.push(project)
  saveProjects(projects)
  return project
}

export function deleteProject(projectId: string): void {
  if (typeof window === 'undefined') return
  const projects = loadProjects().filter((p) => p.id !== projectId)
  saveProjects(projects)
  // Unassign sessions that belonged to this project
  const sessions = loadSessions().map((s) =>
    s.project_id === projectId ? { ...s, project_id: undefined } : s
  )
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function assignSessionToProject(sessionId: string, projectId: string | undefined): void {
  if (typeof window === 'undefined') return
  const sessions = loadSessions().map((s) =>
    s.id === sessionId ? { ...s, project_id: projectId } : s
  )
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

// ── Session storage (localStorage) ───────────────────────────────────────────

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ChatSession[]
  } catch {
    return []
  }
}

export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return
  const sessions = loadSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function deleteSession(sessionId: string): void {
  if (typeof window === 'undefined') return
  const sessions = loadSessions().filter((s) => s.id !== sessionId)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function addMessageToSession(sessionId: string, message: ChatMessage): void {
  if (typeof window === 'undefined') return
  const sessions = loadSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return
  session.messages = [...(session.messages ?? []), message]
  session.message_count = (session.messages ?? []).length
  // Update title from first user message if still default
  if (message.role === 'user' && session.title === 'New Chat') {
    session.title = message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '')
  }
  saveSession(session)
}

export function newSession(): ChatSession {
  const id = crypto.randomUUID()
  const session: ChatSession = {
    id,
    title: 'New Chat',
    created_at: new Date().toISOString(),
    message_count: 0,
    messages: [],
  }
  saveSession(session)
  return session
}

// ── Auth cookie helpers ───────────────────────────────────────────────────────

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function setAuthCookie(value: string, hours = 24): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString()
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}
