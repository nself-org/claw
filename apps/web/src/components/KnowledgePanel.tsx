'use client'

// T-1148: KnowledgePanel — collapsible knowledge search panel for the sidebar.
//
// Features:
//   - Search field with BM25 results from /claw/knowledge/search
//   - Category filter pills (loaded from /claw/knowledge/categories)
//   - Expandable result cards with snippet, commands (copy on click), suggested actions
//   - Admin mode: "Run" button on command chips to insert into chat
//   - Version info footer

import { useState, useEffect, useCallback } from 'react'
import { getBaseUrl } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnowledgeChunk {
  id: string
  category: string
  title: string
  content: string
  keywords: string[]
  commands: string[]
  tags: string[]
  suggested_actions: string[]
  user_notes: string[]
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function searchKnowledge(
  q: string,
  category?: string,
  top = 8,
): Promise<KnowledgeChunk[]> {
  const params = new URLSearchParams({ q, top: String(top) })
  if (category) params.set('category', category)
  const res = await fetch(`${getBaseUrl()}/claw/knowledge/search?${params}`)
  if (!res.ok) return []
  const data = await res.json() as { chunks?: KnowledgeChunk[] }
  return data.chunks ?? []
}

async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${getBaseUrl()}/claw/knowledge/categories`)
  if (!res.ok) return []
  const data = await res.json() as { categories?: { category: string }[] }
  return (data.categories ?? []).map((c) => c.category).filter(Boolean)
}

async function fetchVersion(): Promise<{ version: string; total_chunks: number } | null> {
  const res = await fetch(`${getBaseUrl()}/claw/knowledge/version`)
  if (!res.ok) return null
  return res.json()
}

// ── Main component ────────────────────────────────────────────────────────────

interface KnowledgePanelProps {
  isAdmin?: boolean
  onRunCommand?: (cmd: string) => void
}

export default function KnowledgePanel({ isAdmin, onRunCommand }: KnowledgePanelProps) {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [results, setResults] = useState<KnowledgeChunk[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState<{ version: string; total_chunks: number } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [injectKnowledge, setInjectKnowledge] = useState(true)
  const [expertMode, setExpertMode] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories)
    fetchVersion().then(setVersion)
  }, [])

  const doSearch = useCallback(async (q: string, cat: string | null) => {
    if (!q.trim()) { setResults([]); setError(null); return }
    setLoading(true)
    setError(null)
    try {
      const chunks = await searchKnowledge(q.trim(), cat ?? undefined)
      setResults(chunks)
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(v: string) {
    setQuery(v)
    if (v.length >= 2) doSearch(v, selectedCategory)
    else setResults([])
  }

  function handleCategoryClick(cat: string | null) {
    setSelectedCategory(cat)
    if (query.length >= 2) doSearch(query, cat)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Settings toggle row */}
      <div className="px-3 pt-2 pb-1 shrink-0 flex justify-end">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          title="Knowledge settings"
          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
          style={{
            color: showSettings ? '#6366F1' : 'var(--text-muted)',
            background: showSettings ? 'rgba(99,102,241,0.1)' : 'transparent',
          }}
        >
          <GearIcon />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="mx-3 mb-2 rounded-lg px-3 py-2.5 space-y-2 shrink-0 text-xs"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <SettingsToggle
            label="Inject knowledge context"
            description="Include relevant docs in responses"
            checked={injectKnowledge}
            onChange={setInjectKnowledge}
          />
          <SettingsToggle
            label="nSelf expert mode"
            description="Prepend nSelf-expert system prompt"
            checked={expertMode}
            onChange={setExpertMode}
            disabled={!injectKnowledge}
          />
          {version && (
            <p className="pt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              nSelf v{version.version} · {version.total_chunks} articles · English only
            </p>
          )}
        </div>
      )}

      {/* Search input */}
      <div className="px-3 pt-2 pb-2 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8888A8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search nSelf docs…"
            className="w-full pl-8 pr-7 py-1.5 text-sm rounded-lg outline-none"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <SpinnerIcon />
            </div>
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8888A8] hover:text-white"
            >
              <XSmIcon />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="px-3 pb-2 shrink-0 flex gap-1.5 overflow-x-auto scrollbar-none">
          <CategoryPill
            label="All"
            active={selectedCategory === null}
            onClick={() => handleCategoryClick(null)}
          />
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => handleCategoryClick(cat)}
            />
          ))}
        </div>
      )}

      <div className="shrink-0" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {error && (
          <p className="text-xs text-red-400 px-2 py-1">{error}</p>
        )}

        {!error && results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <BookIcon className="text-[#8888A8]" size={28} />
            {query ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No results for &quot;{query}&quot;
              </p>
            ) : (
              <>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Search nSelf documentation
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  CLI commands, plugins, architecture…
                </p>
              </>
            )}
          </div>
        )}

        {results.map((chunk) => (
          <ChunkCard
            key={chunk.id}
            chunk={chunk}
            expanded={expandedId === chunk.id}
            onToggle={() => setExpandedId(expandedId === chunk.id ? null : chunk.id)}
            copied={copied}
            onCopy={handleCopy}
            isAdmin={isAdmin}
            onRunCommand={onRunCommand}
          />
        ))}
      </div>

      {/* Footer */}
      {version && (
        <div
          className="shrink-0 px-3 py-1.5 flex items-center gap-1.5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <InfoIcon className="text-[#8888A8]" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            nSelf v{version.version} · {version.total_chunks} articles
          </span>
        </div>
      )}
    </div>
  )
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-2 py-0.5 rounded-full text-xs transition-colors"
      style={{
        background: active ? '#6366F1' : 'var(--surface-elevated)',
        color: active ? 'white' : 'var(--text-muted)',
        border: `1px solid ${active ? '#6366F1' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  )
}

// ── Chunk result card ─────────────────────────────────────────────────────────

function ChunkCard({
  chunk,
  expanded,
  onToggle,
  copied,
  onCopy,
  isAdmin,
  onRunCommand,
}: {
  chunk: KnowledgeChunk
  expanded: boolean
  onToggle: () => void
  copied: string | null
  onCopy: (text: string) => void
  isAdmin?: boolean
  onRunCommand?: (cmd: string) => void
}) {
  const snippet = expanded
    ? chunk.content
    : chunk.content.length > 120
      ? `${chunk.content.slice(0, 120)}…`
      : chunk.content

  return (
    <div
      className="rounded-lg cursor-pointer transition-colors"
      style={{ border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}
    >
      <div className="px-3 py-2" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
              {chunk.title}
            </p>
            {chunk.category && (
              <p className="text-xs" style={{ color: '#6366F1' }}>{chunk.category}</p>
            )}
          </div>
          <ChevronSmIcon collapsed={!expanded} />
        </div>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {snippet}
        </p>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }} className="px-3 pb-3 pt-2 space-y-3">
          {/* Commands */}
          {chunk.commands.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Commands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chunk.commands.map((cmd) => (
                  <div key={cmd} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onCopy(cmd)}
                      title="Copy"
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition-colors"
                      style={{
                        background: copied === cmd ? '#22c55e22' : 'var(--surface)',
                        border: `1px solid ${copied === cmd ? '#22c55e' : 'var(--border)'}`,
                        color: copied === cmd ? '#22c55e' : 'var(--text)',
                      }}
                    >
                      <TerminalIcon />
                      {cmd}
                    </button>
                    {isAdmin && onRunCommand && (
                      <button
                        type="button"
                        onClick={() => onRunCommand(cmd)}
                        title="Insert into chat"
                        className="px-1.5 py-0.5 rounded text-xs transition-colors"
                        style={{
                          background: '#6366F122',
                          border: '1px solid #6366F144',
                          color: '#6366F1',
                        }}
                      >
                        Run
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested actions */}
          {chunk.suggested_actions.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chunk.suggested_actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onCopy(action)}
                    className="px-2 py-0.5 rounded-full text-xs transition-colors"
                    style={{
                      background: '#6366F114',
                      border: '1px solid #6366F133',
                      color: '#a5b4fc',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User notes */}
          {chunk.user_notes.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Notes
              </p>
              <div className="space-y-1">
                {chunk.user_notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <NoteIcon />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className={disabled ? 'opacity-40' : ''}>
        <p className="font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        <p style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className="shrink-0 w-8 h-4 rounded-full relative transition-colors mt-0.5"
        style={{ background: checked && !disabled ? '#6366F1' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
          style={{
            background: 'white',
            left: checked && !disabled ? '18px' : '2px',
          }}
        />
      </button>
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.42M11.54 4.46l1.41-1.41" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function XSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  )
}

function BookIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h5c.9 0 1.7.4 2 1 .3-.6 1.1-1 2-1h3v11h-3c-.9 0-1.7.4-2 1-.3-.6-1.1-1-2-1H2z" />
      <line x1="9" y1="3" x2="9" y2="13" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="11" />
      <circle cx="8" cy="5" r="0.5" fill="currentColor" />
    </svg>
  )
}

function ChevronSmIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0 mt-0.5 text-[#8888A8]"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
    >
      <polyline points="2,3 5,7 8,3" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 7,8 2,12" />
      <line x1="9" y1="12" x2="14" y2="12" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-[#a5b4fc]">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <line x1="5" y1="6" x2="11" y2="6" />
      <line x1="5" y1="9" x2="9" y2="9" />
    </svg>
  )
}
