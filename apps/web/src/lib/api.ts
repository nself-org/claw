import type { ChatSession, ChatMessage, LocalModel, UsagePeriod, UsageSummary, AdminService, AdminMetrics, AuditLogEntry, AdminQueryResult, ApiKeyRecord, CreatedApiKey, SystemPromptRecord, GatewayUsageRow } from './types'

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
  onDone: (meta: { tier_source?: string; latency_ms?: number; session_id?: string; knowledge_used?: boolean }) => void
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
  let knowledge_used = false

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
          onDone({ tier_source, latency_ms, session_id, knowledge_used })
          return
        }
        try {
          const parsed = JSON.parse(raw) as {
            content?: string
            tier_source?: string
            latency_ms?: number
            session_id?: string
            suggested_actions?: string[]
          }
          if (parsed.tier_source) tier_source = parsed.tier_source
          if (parsed.latency_ms) latency_ms = parsed.latency_ms
          if (parsed.session_id) session_id = parsed.session_id
          if (parsed.suggested_actions?.length) knowledge_used = true
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

  onDone({ tier_source, latency_ms, session_id, knowledge_used })
}

// ── API Keys (gateway) ────────────────────────────────────────────────────────

export async function fetchApiKeys(): Promise<ApiKeyRecord[]> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/api-keys`)
  if (!res.ok) throw new Error(`API keys fetch failed: ${res.status}`)
  const data = await res.json() as { keys: ApiKeyRecord[] }
  return data.keys ?? []
}

export async function createApiKey(
  name: string,
  adminAllowed: boolean,
  rpmLimit: number,
): Promise<CreatedApiKey> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, admin_allowed: adminAllowed, rpm_limit: rpmLimit }),
  })
  if (!res.ok) throw new Error(`Create API key failed: ${res.status}`)
  return res.json() as Promise<CreatedApiKey>
}

export async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/api-keys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Revoke API key failed: ${res.status}`)
}

// ── System Prompts (gateway) ──────────────────────────────────────────────────

export async function fetchSystemPrompts(): Promise<SystemPromptRecord[]> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/system-prompts`)
  if (!res.ok) throw new Error(`System prompts fetch failed: ${res.status}`)
  const data = await res.json() as { prompts: SystemPromptRecord[] }
  return data.prompts ?? []
}

export async function createSystemPrompt(
  name: string,
  content: string,
  isDefault: boolean,
): Promise<SystemPromptRecord> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/system-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, is_default: isDefault }),
  })
  if (!res.ok) throw new Error(`Create system prompt failed: ${res.status}`)
  return res.json() as Promise<SystemPromptRecord>
}

export async function updateSystemPrompt(
  id: string,
  name: string,
  content: string,
  isDefault: boolean,
): Promise<SystemPromptRecord> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/system-prompts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, is_default: isDefault }),
  })
  if (!res.ok) throw new Error(`Update system prompt failed: ${res.status}`)
  return res.json() as Promise<SystemPromptRecord>
}

export async function deleteSystemPrompt(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/v1/system-prompts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Delete system prompt failed: ${res.status}`)
}

// ── Memories ──────────────────────────────────────────────────────────────────

export interface MemoryRecord {
  id: string
  entity_id: string
  entity_type: string
  content: string
  confidence: number
  times_reinforced: number
  source: string
  created_at: string
}

export async function fetchMemories(userId: string): Promise<MemoryRecord[]> {
  const res = await fetch(`${getBaseUrl()}/claw/memories?user_id=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`Memories fetch failed: ${res.status}`)
  const data = await res.json() as { memories: MemoryRecord[] }
  return data.memories ?? []
}

export async function addMemory(userId: string, content: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content }),
  })
  if (!res.ok) throw new Error(`Add memory failed: ${res.status}`)
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/memories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Delete memory failed: ${res.status}`)
}

export async function clearMemories(userId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/memories?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Clear memories failed: ${res.status}`)
}

// ── Proactive scheduler ───────────────────────────────────────────────────────

export interface ProactiveJob {
  id: string
  job_type: string
  enabled: boolean
  cron_expression: string
  next_run_at: string | null
  last_run_at: string | null
  failure_count: number
  quiet_hours_start: number
  quiet_hours_end: number
  config: Record<string, unknown>
}

export async function fetchProactiveJobs(): Promise<ProactiveJob[]> {
  const res = await fetch(`${getBaseUrl()}/claw/proactive/jobs`)
  if (!res.ok) throw new Error(`Proactive jobs fetch failed: ${res.status}`)
  const data = await res.json() as { jobs: ProactiveJob[] }
  return data.jobs ?? []
}

export async function toggleProactiveJob(jobType: string, enabled: boolean): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/claw/proactive/jobs/${encodeURIComponent(jobType)}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error(`Toggle job failed: ${res.status}`)
}

export async function fetchProactiveDigest(): Promise<{ text: string; generated_at: string }> {
  const res = await fetch(`${getBaseUrl()}/claw/proactive/digest`)
  if (!res.ok) throw new Error(`Digest fetch failed: ${res.status}`)
  return res.json() as Promise<{ text: string; generated_at: string }>
}

// ── Gateway usage ─────────────────────────────────────────────────────────────

export async function fetchGatewayUsage(keyId?: string): Promise<GatewayUsageRow[]> {
  const url = keyId
    ? `${getBaseUrl()}/claw/v1/usage?key_id=${encodeURIComponent(keyId)}`
    : `${getBaseUrl()}/claw/v1/usage`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Gateway usage fetch failed: ${res.status}`)
  const data = await res.json() as { usage: GatewayUsageRow[] }
  return data.usage ?? []
}
