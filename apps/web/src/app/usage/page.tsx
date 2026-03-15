'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchUsage } from '@/lib/api'
import type { UsagePeriod, UsageSummary } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const PERIODS: { label: string; value: UsagePeriod }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const TIER_COLORS: Record<string, string> = {
  Local: '#4ade80',
  'Free Gemini': '#60a5fa',
  'API Key': '#fb923c',
}

export default function UsagePage() {
  const [period, setPeriod] = useState<UsagePeriod>('today')
  const [data, setData] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(p: UsagePeriod) {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchUsage(p)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(period)
  }, [period])

  return (
    <div
      className="min-h-full"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/"
          className="text-sm flex items-center gap-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <BackIcon />
          <span>Chat</span>
        </Link>
        <h1 className="flex-1 text-base font-semibold">Usage</h1>

        <button
          onClick={() => load(period)}
          className="p-1.5 rounded-lg hover:bg-[#2A2A40] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-[#6366F1] text-white'
                  : 'hover:bg-[#222236]',
              ].join(' ')}
              style={
                period !== p.value
                  ? { color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  : {}
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div
            className="p-4 rounded-xl text-sm flex items-center gap-3"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
            }}
          >
            <ErrorIcon />
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="Total Requests" value={String(data.total_requests)} />
              <SummaryCard label="Cache Hits" value={String(data.cache_hits)} />
              <SummaryCard
                label="Est. Savings"
                value={`$${data.estimated_savings.toFixed(2)}`}
                valueColor="#4ade80"
              />
            </div>

            {/* Tier breakdown */}
            <TierBreakdown breakdown={data.tier_breakdown} />

            {/* Provider table */}
            {data.providers.length > 0 && (
              <ProviderTable providers={data.providers} />
            )}
          </>
        )}

        {!loading && !error && !data && (
          <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No usage data for this period.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-2xl font-bold"
        style={{ color: valueColor ?? 'var(--text)' }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  )
}

// ── Tier breakdown ────────────────────────────────────────────────────────────

function TierBreakdown({
  breakdown,
}: {
  breakdown: UsageSummary['tier_breakdown']
}) {
  const rows = [
    { label: 'Local', key: 'local' as const, color: '#4ade80' },
    { label: 'Free Gemini', key: 'free_gemini' as const, color: '#60a5fa' },
    { label: 'API Key', key: 'api_key' as const, color: '#fb923c' },
  ]

  const total = rows.reduce((sum, r) => sum + (breakdown[r.key] ?? 0), 0)
  if (total === 0) return null

  // Bar chart data
  const chartData = rows.map((r) => ({
    name: r.label,
    value: breakdown[r.key] ?? 0,
    color: r.color,
  }))

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-sm font-semibold mb-4">Tier breakdown</h2>

      {/* Progress bars */}
      <div className="space-y-3 mb-5">
        {rows.map((r) => {
          const count = breakdown[r.key] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={r.key}>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ color: r.color }}>{pct}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: `${r.color}20` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: r.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={40}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#8888A8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8888A8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
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
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Provider table ────────────────────────────────────────────────────────────

function ProviderTable({ providers }: { providers: UsageSummary['providers'] }) {
  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold">By provider</h2>
      </div>
      <table className="w-full text-sm" style={{ background: 'var(--surface)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Provider', 'Requests', 'Tokens', 'Cost'].map((col) => (
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
          {providers.map((row, i) => (
            <tr
              key={row.name}
              style={
                i < providers.length - 1
                  ? { borderBottom: '1px solid var(--border)' }
                  : {}
              }
            >
              <td className="px-5 py-3 font-medium">{row.name}</td>
              <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                {row.requests}
              </td>
              <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                {fmtTokens(row.tokens)}
              </td>
              <td className="px-5 py-3">
                <span className={row.cost > 0 ? 'text-orange-400' : 'text-green-400'}>
                  ${row.cost.toFixed(4)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="7" />
      <line x1="8" y1="5" x2="8" y2="8" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  )
}
