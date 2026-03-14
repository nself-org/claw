'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AdminService, AdminMetrics, AuditLogEntry, AdminQueryResult } from '@/lib/types'
import {
  fetchAdminServices,
  restartService,
  fetchAdminMetrics,
  runAdminQuery,
  fetchAuditLog,
} from '@/lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

function metricColor(pct: number): string {
  if (pct >= 90) return '#ef4444'
  if (pct >= 70) return '#f97316'
  return '#22c55e'
}

function statusColor(status: string): string {
  switch (status) {
    case 'running': return '#22c55e'
    case 'restarting': return '#f97316'
    case 'stopped': return '#8888A8'
    default: return '#ef4444'
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

// ── Metric Bar ────────────────────────────────────────────────────────────────

function MetricBar({ label, value }: { label: string; value: number | null }) {
  const color = value === null ? '#3A3A50' : metricColor(value)
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: value === null ? 'var(--text-muted)' : color }}>
          {value === null ? '—' : `${Math.round(value)}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-high)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${value ?? 0}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── Service Card ──────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: AdminService
  onRestart: (name: string) => void
  restarting: boolean
}

function ServiceCard({ service, onRestart, restarting }: ServiceCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const color = statusColor(service.status)

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
    >
      {/* Status dot */}
      <span
        className="shrink-0 w-2.5 h-2.5 rounded-full"
        style={{
          background: color,
          boxShadow: service.status === 'running' ? `0 0 6px ${color}` : 'none',
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
          {service.display_name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {service.status === 'running'
            ? `up ${formatUptime(service.uptime_seconds)}`
            : service.status}
        </p>
      </div>

      {/* Restart button */}
      <div className="shrink-0 relative">
        {confirmOpen ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Restart?</span>
            <button
              onClick={() => { setConfirmOpen(false); onRestart(service.name) }}
              className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-2 py-0.5 text-xs rounded hover:bg-[#2A2A40] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={restarting}
            title="Restart service"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2A2A40] transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
          >
            {restarting ? <SpinIcon /> : <RestartIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Query Results Table ───────────────────────────────────────────────────────

function QueryResultTable({ result }: { result: AdminQueryResult }) {
  if (result.message && result.columns.length === 0) {
    return (
      <p className="text-sm px-1 py-2" style={{ color: 'var(--text-muted)' }}>
        {result.message}
      </p>
    )
  }

  if (result.columns.length === 0) {
    return (
      <p className="text-sm px-1 py-2" style={{ color: 'var(--text-muted)' }}>
        No results
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)' }}>
            {result.columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: i < result.rows.length - 1 ? '1px solid var(--border)' : 'none' }}
              className="hover:bg-[#222236] transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 max-w-xs truncate" style={{ color: 'var(--text)' }}>
                  {cell === null ? <span style={{ color: 'var(--text-muted)' }}>null</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.row_count > 0 && (
        <div className="px-3 py-1.5" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span className="text-xs">{result.row_count} row{result.row_count !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [services, setServices] = useState<AdminService[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [loadingAudit, setLoadingAudit] = useState(true)
  const [restartingServices, setRestartingServices] = useState<Set<string>>(new Set())
  const [servicesError, setServicesError] = useState<string | null>(null)

  // NL query state
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<AdminQueryResult | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAll = useCallback(async () => {
    // Services
    fetchAdminServices()
      .then((data) => {
        setServices(data)
        setServicesError(null)
      })
      .catch((e) => setServicesError((e as Error).message))
      .finally(() => setLoadingServices(false))

    // Metrics
    fetchAdminMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoadingMetrics(false))

    // Audit log
    fetchAuditLog()
      .then(setAuditLog)
      .catch(() => setAuditLog([]))
      .finally(() => setLoadingAudit(false))
  }, [])

  useEffect(() => {
    loadAll()
    // Auto-refresh every 30 seconds
    autoRefreshRef.current = setInterval(loadAll, 30_000)
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [loadAll])

  const handleRestart = useCallback(async (name: string) => {
    setRestartingServices((prev) => new Set(prev).add(name))
    try {
      await restartService(name)
      // Reload services after a short delay (container needs time to register restart)
      setTimeout(() => {
        fetchAdminServices()
          .then(setServices)
          .catch(() => {})
        setRestartingServices((prev) => {
          const next = new Set(prev)
          next.delete(name)
          return next
        })
      }, 2000)
    } catch {
      setRestartingServices((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    }
  }, [])

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return
    setQueryLoading(true)
    setQueryError(null)
    setQueryResult(null)
    try {
      const result = await runAdminQuery(query.trim())
      setQueryResult(result)
    } catch (e) {
      setQueryError((e as Error).message)
    } finally {
      setQueryLoading(false)
    }
  }, [query])

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Admin
        </h1>
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[#222236]"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      {/* Metrics bar */}
      <div
        className="shrink-0 rounded-lg p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
          SYSTEM METRICS
        </p>
        {loadingMetrics ? (
          <div className="flex gap-4">
            {['CPU', 'RAM', 'Disk'].map((l) => <MetricBar key={l} label={l} value={null} />)}
          </div>
        ) : (
          <div className="flex gap-4">
            <MetricBar label="CPU" value={metrics?.cpu_percent ?? null} />
            <MetricBar label="RAM" value={metrics?.ram_percent ?? null} />
            <MetricBar label="Disk" value={metrics?.disk_percent ?? null} />
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left: service cards + audit log */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Service cards */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                SERVICES
              </p>
            </div>
            <div className="p-3 space-y-2">
              {loadingServices ? (
                <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading…
                </p>
              ) : servicesError ? (
                <p className="text-xs py-4 text-center text-red-400">
                  {servicesError}
                </p>
              ) : services.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No services reported
                </p>
              ) : (
                services.map((svc) => (
                  <ServiceCard
                    key={svc.name}
                    service={svc}
                    onRestart={handleRestart}
                    restarting={restartingServices.has(svc.name)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Audit log */}
          <div
            className="rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                RECENT ACTIVITY
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingAudit ? (
                <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading…
                </p>
              ) : auditLog.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No recent activity
                </p>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                          {entry.operation}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(entry.created_at)}
                        </span>
                      </div>
                      {(entry.actor || entry.details) && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {[entry.actor, entry.details].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: NL query */}
        <div
          className="rounded-lg overflow-hidden flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              DATABASE QUERY
            </p>
          </div>
          <div className="p-3 flex flex-col gap-3 flex-1 min-h-0">
            {/* Input */}
            <div className="flex gap-2">
              <textarea
                className="flex-1 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none transition-colors"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  minHeight: '72px',
                }}
                placeholder="Ask a question about your data, e.g. &quot;How many users signed up this week?&quot;"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleQuery()
                  }
                }}
              />
              <button
                onClick={handleQuery}
                disabled={queryLoading || !query.trim()}
                className="shrink-0 self-end px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: '#6366F1', color: 'white' }}
              >
                {queryLoading ? <SpinIcon /> : 'Run'}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tip: ⌘ Enter to run
            </p>

            {/* Result area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {queryError && (
                <p className="text-xs text-red-400 px-1">{queryError}</p>
              )}
              {queryResult && (
                <QueryResultTable result={queryResult} />
              )}
              {!queryResult && !queryError && !queryLoading && (
                <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                  Results will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function RestartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 1.5-4" />
      <polyline points="2,4 2,8 6,8" />
    </svg>
  )
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
      <path d="M8 2a6 6 0 0 1 6 6" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 1.5-4" />
      <polyline points="2,4 2,8 6,8" />
    </svg>
  )
}
