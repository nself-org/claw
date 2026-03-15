'use client'

// T-1176: API Keys management page — full CRUD, show-once, system prompts section.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  fetchSystemPrompts,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
} from '@/lib/api'
import type { ApiKeyRecord, CreatedApiKey, SystemPromptRecord } from '@/lib/types'

type Tab = 'keys' | 'prompts'

export default function ApiKeysPage() {
  const [tab, setTab] = useState<Tab>('keys')

  return (
    <div className="min-h-full" style={{ background: 'var(--bg)' }}>
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
        <h1 className="flex-1 text-base font-semibold">API Keys</h1>
        <div className="flex gap-1">
          <Link
            href="/settings/usage"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Usage
          </Link>
          <Link
            href="/settings/integration"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Integration
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="flex px-6 gap-1 pt-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {([['keys', 'API Keys'], ['prompts', 'System Prompts']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'keys' ? <ApiKeysTab /> : <SystemPromptsTab />}
      </div>
    </div>
  )
}

// ── API Keys tab ───────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setKeys(await fetchApiKeys())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRevoke(key: ApiKeyRecord) {
    if (!confirm(`Revoke "${key.name}" (${key.key_prefix}...)? This cannot be undone.`)) return
    try {
      await revokeApiKey(key.id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke key')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          API keys let external apps call your nClaw server via the OpenAI-compatible API.
        </p>
        <button
          onClick={() => { setShowCreate(true); setCreatedKey(null) }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#6366F1] text-white hover:bg-[#5558e8] transition-colors"
        >
          <PlusIcon />
          New key
        </button>
      </div>

      {showCreate && (
        <CreateKeyForm
          onCreated={(k) => { setCreatedKey(k); setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {createdKey && (
        <ShowOnceBox keyValue={createdKey.key} onDismiss={() => setCreatedKey(null)} />
      )}

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && keys.length === 0 && (
        <EmptyState
          icon={<KeyIcon />}
          title="No API keys yet"
          action={<button onClick={() => setShowCreate(true)} className="text-sm text-[#6366F1] hover:underline">Create your first key</button>}
        />
      )}

      {!loading && keys.length > 0 && (
        <div className="space-y-2">
          {keys.map((k) => (
            <KeyCard key={k.id} record={k} onRevoke={() => handleRevoke(k)} />
          ))}
        </div>
      )}
    </>
  )
}

function CreateKeyForm({
  onCreated,
  onCancel,
}: {
  onCreated: (k: CreatedApiKey) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [rpmLimit, setRpmLimit] = useState(60)
  const [adminAllowed, setAdminAllowed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const created = await createApiKey(name.trim(), adminAllowed, rpmLimit)
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mb-4 space-y-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-sm font-semibold">Create API Key</h3>

      {error && <ErrorBox message={error} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Key name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My app"
            required
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#6366F1]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>RPM limit</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={rpmLimit}
            onChange={(e) => setRpmLimit(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#6366F1]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <div
              onClick={() => setAdminAllowed(!adminAllowed)}
              className={`w-9 h-5 rounded-full transition-colors ${adminAllowed ? 'bg-orange-500' : ''}`}
              style={!adminAllowed ? { background: 'var(--border)' } : {}}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ${adminAllowed ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            <span style={{ color: 'var(--text-muted)' }}>Admin mode</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg font-medium bg-[#6366F1] text-white hover:bg-[#5558e8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  )
}

function ShowOnceBox({ keyValue, onDismiss }: { keyValue: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(keyValue).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircleIcon className="text-green-400" />
        <span className="text-sm font-medium text-green-400">Key created — copy it now, it won't be shown again.</span>
      </div>
      <div
        className="font-mono text-xs px-3 py-2 rounded-lg select-all mb-3 break-all"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        {keyValue}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
        >
          <CopyIcon />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function KeyCard({ record, onRevoke }: { record: ApiKeyRecord; onRevoke: () => void }) {
  function fmtDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    return `${days}d ago`
  }

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{record.name}</span>
          {record.admin_allowed && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/15 text-orange-400">admin</span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-400">
            {record.rpm_limit} RPM
          </span>
        </div>
        <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {record.key_prefix}…
        </p>
        {record.last_used_at && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Last used {fmtDate(record.last_used_at)}
          </p>
        )}
      </div>
      <button
        onClick={onRevoke}
        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
        style={{ color: '#f87171' }}
        title="Revoke key"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── System Prompts tab ─────────────────────────────────────────────────────────

function SystemPromptsTab() {
  const [prompts, setPrompts] = useState<SystemPromptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<SystemPromptRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPrompts(await fetchSystemPrompts())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load system prompts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(p: SystemPromptRecord) {
    if (!confirm(`Delete system prompt "${p.name}"?`)) return
    try {
      await deleteSystemPrompt(p.id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          System prompts can be assigned per-key to pre-configure the assistant persona.
        </p>
        <button
          onClick={() => { setShowCreate(true); setEditing(null) }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#6366F1] text-white hover:bg-[#5558e8] transition-colors"
        >
          <PlusIcon />
          New prompt
        </button>
      </div>

      {(showCreate || editing) && (
        <PromptForm
          existing={editing}
          onSaved={() => { setShowCreate(false); setEditing(null); load() }}
          onCancel={() => { setShowCreate(false); setEditing(null) }}
        />
      )}

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}

      {!loading && !error && prompts.length === 0 && (
        <EmptyState
          icon={<DocIcon />}
          title="No system prompts yet"
          action={<button onClick={() => setShowCreate(true)} className="text-sm text-[#6366F1] hover:underline">Create one</button>}
        />
      )}

      {!loading && prompts.length > 0 && (
        <div className="space-y-2">
          {prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onEdit={() => { setEditing(p); setShowCreate(false) }}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function PromptForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: SystemPromptRecord | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [isDefault, setIsDefault] = useState(existing?.is_default ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    setLoading(true)
    setError(null)
    try {
      if (existing) {
        await updateSystemPrompt(existing.id, name.trim(), content.trim(), isDefault)
      } else {
        await createSystemPrompt(name.trim(), content.trim(), isDefault)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mb-4 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-sm font-semibold">{existing ? 'Edit' : 'Create'} System Prompt</h3>
      {error && <ErrorBox message={error} />}

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Friendly assistant"
          required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#6366F1]"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="You are a helpful assistant…"
          required
          rows={5}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#6366F1] resize-y"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="accent-indigo-500"
        />
        <span style={{ color: 'var(--text-muted)' }}>Set as default for all keys</span>
      </label>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg font-medium bg-[#6366F1] text-white hover:bg-[#5558e8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function PromptCard({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: SystemPromptRecord
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = prompt.content.length > 100 ? prompt.content.slice(0, 100) + '…' : prompt.content

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{prompt.name}</span>
            {prompt.is_default && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-400">default</span>
            )}
          </div>
          <p
            className="text-xs mt-0.5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? prompt.content : preview}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: '#f87171' }}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="p-3 rounded-lg text-sm"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
    >
      {message}
    </div>
  )
}

function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
      <div className="opacity-40">{icon}</div>
      <p className="text-sm">{title}</p>
      {action}
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,2 4,7 9,12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="7" y1="2" x2="7" y2="12" />
      <line x1="2" y1="7" x2="12" y2="7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h11M5 4V2h5v2M6 7v5M9 7v5M3 4l1 9h7l1-9" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2l3 3L5 13H2v-3L10 2z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M9 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="8" r="7" />
      <polyline points="5,8 7,10 11,6" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
