import type { ChatSession, ChatMessage, LocalModel, UsagePeriod, UsageSummary, AdminService, AdminMetrics, AuditLogEntry, AdminQueryResult } from './types'

// Base URL from env — no trailing slash
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_CLAW_URL ?? ''
  return url.replace(/\/$/, '')
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${getBaseUrl()}/claw/sessions`)
  if (!res.ok) throw new Error(`Sessions fetch failed: ${res.status}`)
  const data = await res.json() as { sessions: ChatSession[] }
  return data.sessions ?? []
}

export async function fetchSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${getBaseUrl()}/claw/sessions/${sessionId}/messages`)
  if (!res.ok) throw new Error(`Messages fetch failed: ${res.status}`)
  const data = await res.json() as { messages: ChatMessage[] }
  return (data.messages ?? []).map((m) => ({
    ...m,
    createdAt: m.createdAt ?? Date.now(),
  }))
}

// ── Models ────────────────────────────────────────────────────────────────────

export async function fetchLocalModels(): Promise<LocalModel[]> {
  const res = await fetch(`${getBaseUrl()}/ai/models/local`)
  if (!res.ok) throw new Error(`Models fetch failed: ${res.status}`)
  const data = await res.json() as { models: LocalModel[] }
  return data.models ?? []
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export async function fetchUsage(period: UsagePeriod): Promise<UsageSummary> {
  const res = await fetch(`${getBaseUrl()}/ai/usage?period=${period}`)
  if (!res.ok) throw new Error(`Usage fetch failed: ${res.status}`)
  return res.json() as Promise<UsageSummary>
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAdminServices(): Promise<AdminService[]> {
  const res = await fetch(`${getBaseUrl()}/claw/admin/services`)
  if (!res.ok) throw new Error(`Admin services fetch failed: ${res.status}`)
  const data = await res.json() as { services: AdminService[] }
  return data.services ?? []
}

export async function restartService(name: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/admin/services/${encodeURIComponent(name)}/restart`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Restart failed: ${res.status}`)
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch(`${getBaseUrl()}/claw/admin/metrics`)
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`)
  return res.json() as Promise<AdminMetrics>
}

export async function runAdminQuery(query: string): Promise<AdminQueryResult> {
  const res = await fetch(`${getBaseUrl()}/claw/admin/db-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status}`)
  return res.json() as Promise<AdminQueryResult>
}

export async function fetchAuditLog(): Promise<AuditLogEntry[]> {
  const res = await fetch(`${getBaseUrl()}/claw/admin/audit-log`)
  if (!res.ok) throw new Error(`Audit log fetch failed: ${res.status}`)
  const data = await res.json() as { entries: AuditLogEntry[] }
  return data.entries ?? []
}

// ── Streaming chat ────────────────────────────────────────────────────────────

export interface StreamChatOptions {
  message: string
  sessionId?: string
  model?: string
  onChunk: (chunk: string) => void
  onDone: (meta: { tier_source?: string; latency_ms?: number; session_id?: string }) => void
  onError: (err: Error) => void
  signal?: AbortSignal
}

export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const { message, sessionId, model, onChunk, onDone, onError, signal } = opts

  let res: Response
  try {
    res = await fetch(`${getBaseUrl()}/claw/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        model: model ?? undefined,
        stream: true,
      }),
      signal,
    })
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!res.ok) {
    onError(new Error(`Chat request failed: ${res.status}`))
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let tier_source: string | undefined
  let latency_ms: number | undefined
  let session_id: string | undefined

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (raw === '[DONE]') {
          onDone({ tier_source, latency_ms, session_id })
          return
        }
        try {
          const parsed = JSON.parse(raw) as {
            content?: string
            tier_source?: string
            latency_ms?: number
            session_id?: string
          }
          if (parsed.tier_source) tier_source = parsed.tier_source
          if (parsed.latency_ms) latency_ms = parsed.latency_ms
          if (parsed.session_id) session_id = parsed.session_id
          if (parsed.content) onChunk(parsed.content)
        } catch {
          // plain text chunk
          if (raw) onChunk(raw)
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return
    onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }

  onDone({ tier_source, latency_ms, session_id })
}
