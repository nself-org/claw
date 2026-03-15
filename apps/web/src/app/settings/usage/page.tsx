'use client'

// T-1177: Gateway usage dashboard — per-key filter, by-day bar chart, by-model table.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { fetchApiKeys, fetchGatewayUsage } from '@/lib/api'
import type { ApiKeyRecord, GatewayUsageRow } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export default function GatewayUsagePage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [rows, setRows] = useState<GatewayUsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load API key list once
  useEffect(() => {
    fetchApiKeys()
      .then(setKeys)
      .catch(() => { /* non-fatal */ })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await fetchGatewayUsage(selectedKeyId || undefined))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [selectedKeyId])

  useEffect(() => { load() }, [load])

  // Filter by selected key (server already filters, but keep for future local tweaks)
  const filtered = rows

  // Aggregate by day (last 14 days, descending)
  const byDay = filtered.reduce<Record<string, number>>((acc, r) => {
    acc[r.day] = (acc[r.day] ?? 0) + r.prompt_tokens + r.completion_tokens
    return acc
  }, {})
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a)).slice(0, 14)
  const dayChartData = sortedDays.map((day) => ({ day: day.slice(5), tokens: byDay[day] })).reverse()

  // Aggregate by model
  const byModel = filtered.reduce<Record<string, { tokens: number; cost: number }>>((acc, r) => {
    if (!acc[r.model]) acc[r.model] = { tokens: 0, cost: 0 }
    acc[r.model].tokens += r.prompt_tokens + r.completion_tokens
    acc[r.model].cost += r.cost_usd
    return acc
  }, {})
  const modelRows = Object.entries(byModel)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 10)

  const totalTokens = filtered.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0)
  const totalCost = filtered.reduce((s, r) => s + r.cost_usd, 0)

  function fmtTokens(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  return (
    <div className="min-h-full" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/settings/api-keys"
          className="text-sm flex items-center gap-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <BackIcon />
          <span>API Keys</span>
        </Link>
        <h1 className="flex-1 text-base font-semibold">Gateway Usage</h1>
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-[#2A2A40] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Key filter */}
        {keys.length > 0 && (
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Filter by key</label>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#6366F1]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="">All keys</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.key_prefix}…)
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            No usage recorded yet.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard label="Total tokens" value={fmtTokens(totalTokens)} icon="🔢" />
              <SummaryCard label="Est. cost" value={`$${totalCost.toFixed(4)}`} icon="💵" />
            </div>

            {/* By day */}
            {dayChartData.length > 0 && (
              <section
                className="rounded-xl p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h2 className="text-sm font-semibold mb-4">Tokens by day</h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayChartData} barSize={28}>
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#8888A8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#8888A8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickFormatter={(v: number) => fmtTokens(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          color: 'var(--text)',
                          fontSize: 12,
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        formatter={(v: number) => [fmtTokens(v), 'Tokens']}
                      />
                      <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                        {dayChartData.map((_, i) => (
                          <Cell key={i} fill="#6366F1" fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* By model */}
            {modelRows.length > 0 && (
              <section
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                <div
                  className="px-5 py-4"
                  style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="text-sm font-semibold">By model</h2>
                </div>
                <table className="w-full text-sm" style={{ background: 'var(--surface)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Model', 'Tokens', 'Est. cost'].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left font-medium text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelRows.map(([model, stats], i) => {
                      const maxTokens = modelRows[0][1].tokens
                      const pct = maxTokens > 0 ? (stats.tokens / maxTokens) * 100 : 0
                      return (
                        <tr
                          key={model}
                          style={i < modelRows.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}
                        >
                          <td className="px-5 py-3 font-medium font-mono text-xs">{model}</td>
                          <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-1.5 rounded-full overflow-hidden w-16 shrink-0"
                                style={{ background: 'rgba(99,102,241,0.2)' }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: '#6366F1' }}
                                />
                              </div>
                              {fmtTokens(stats.tokens)}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span style={{ color: stats.cost > 0 ? '#fb923c' : '#4ade80' }}>
                              ${stats.cost.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,2 4,7 9,12" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2.5A6.5 6.5 0 0 0 2.5 8" />
      <polyline points="1,5 2.5,8 5.5,6.5" />
      <path d="M3 13.5A6.5 6.5 0 0 0 13.5 8" />
      <polyline points="15,11 13.5,8 10.5,9.5" />
    </svg>
  )
}
