// ── Chat types ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tier_source?: string
  latency_ms?: number
  knowledge_used?: boolean
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  message_count: number
  project_id?: string
  // Local-only: messages loaded into memory
  messages?: ChatMessage[]
}

export interface Project {
  id: string
  name: string
  created_at: string
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

// ── API Gateway types ─────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  admin_allowed: boolean
  rpm_limit: number
  created_at: string
  last_used_at?: string
}

export interface CreatedApiKey extends ApiKeyRecord {
  key: string // show once only
}

export interface SystemPromptRecord {
  id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
}

export interface GatewayUsageRow {
  key_id: string
  day: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
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
