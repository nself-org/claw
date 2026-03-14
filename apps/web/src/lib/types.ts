// ── Chat types ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tier_source?: string
  latency_ms?: number
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  message_count: number
  // Local-only: messages loaded into memory
  messages?: ChatMessage[]
}

// ── Model types ───────────────────────────────────────────────────────────────

export interface LocalModel {
  name: string
  status: 'running' | 'available' | 'downloading' | string
  size_gb: number
}

// ── Admin types ───────────────────────────────────────────────────────────────

export type ServiceStatus = 'running' | 'stopped' | 'error' | 'restarting'

export interface AdminService {
  name: string
  display_name: string
  status: ServiceStatus
  uptime_seconds: number
  container_id?: string
}

export interface AdminMetrics {
  cpu_percent: number
  ram_percent: number
  disk_percent: number
}

export interface AuditLogEntry {
  id: string
  operation: string
  actor?: string
  created_at: string
  details?: string
}

export interface AdminQueryResult {
  columns: string[]
  rows: (string | number | boolean | null)[][]
  row_count: number
  message?: string
}

// ── Usage types ───────────────────────────────────────────────────────────────

export type UsagePeriod = 'today' | 'week' | 'month'

export interface ProviderRow {
  name: string
  requests: number
  tokens: number
  cost: number
}

export interface UsageSummary {
  total_requests: number
  cache_hits: number
  estimated_savings: number
  tier_breakdown: {
    local: number
    free_gemini: number
    api_key: number
  }
  providers: ProviderRow[]
}
