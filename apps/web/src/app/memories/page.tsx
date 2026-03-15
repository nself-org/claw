'use client'

// T-1203: Memories management page — table with filter, add modal, clear all.

import { useState, useEffect, useCallback } from 'react'
import { fetchMemories, addMemory, deleteMemory, clearMemories, type MemoryRecord } from '@/lib/api'

const ANONYMOUS_USER = 'web_user'

const ENTITY_TYPE_LABELS: Record<string, string> = {
  preference: 'Preference',
  fact: 'Fact',
  context: 'Context',
  instruction: 'Instruction',
  relationship: 'Relationship',
}

function confidenceColor(c: number): string {
  if (c >= 0.75) return '#4ade80'
  if (c >= 0.5) return '#facc15'
  return '#f87171'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMemories(ANONYMOUS_USER)
      setMemories(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const entityTypes = Array.from(new Set(memories.map((m) => m.entity_type)))
  const filtered = filterType === 'all' ? memories : memories.filter((m) => m.entity_type === filterType)

  async function handleAdd() {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      await addMemory(ANONYMOUS_USER, newContent.trim())
      setNewContent('')
      setShowAdd(false)
      await load()
    } catch (e) {
      setError(String(e))
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleClearAll() {
    setClearing(true)
    try {
      await clearMemories(ANONYMOUS_USER)
      setMemories([])
      setConfirmClear(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #0F0F1A)', color: 'var(--text, #E4E4F0)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Memories</h1>
            <p className="text-sm mt-1" style={{ color: '#8888A8' }}>
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} stored
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#2A2A40]"
              style={{ color: '#8888A8', border: '1px solid #2A2A40' }}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: '#6366F1', color: 'white' }}
            >
              + Add Memory
            </button>
            {memories.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-red-950"
                style={{ color: '#f87171', border: '1px solid #f87171' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#2d1a1a', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Filter chips */}
        {entityTypes.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', ...entityTypes].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: filterType === t ? '#6366F1' : '#1A1A2E',
                  color: filterType === t ? 'white' : '#8888A8',
                  border: `1px solid ${filterType === t ? '#6366F1' : '#2A2A40'}`,
                }}
              >
                {t === 'all' ? `All (${memories.length})` : `${ENTITY_TYPE_LABELS[t] ?? t} (${memories.filter((m) => m.entity_type === t).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#8888A8' }}>
            <p className="text-4xl mb-3">🧠</p>
            <p className="text-sm">No memories yet. ɳClaw learns from your conversations.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <MemoryRow key={m.id} memory={m} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Memory" onClose={() => setShowAdd(false)}>
          <textarea
            className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-[#6366F1]"
            style={{ background: '#1A1A2E', color: '#E4E4F0', border: '1px solid #2A2A40', minHeight: 80 }}
            placeholder="Enter a fact, preference, or instruction…"
            maxLength={500}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            autoFocus
          />
          <p className="text-xs mt-1 text-right" style={{ color: '#8888A8' }}>{newContent.length}/500</p>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#2A2A40]"
              style={{ color: '#8888A8' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!newContent.trim() || adding}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: '#6366F1', color: 'white' }}
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm clear modal */}
      {confirmClear && (
        <Modal title="Clear all memories?" onClose={() => setConfirmClear(false)}>
          <p className="text-sm" style={{ color: '#8888A8' }}>
            This will permanently delete all {memories.length} {memories.length === 1 ? 'memory' : 'memories'}. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-[#2A2A40] transition-colors"
              style={{ color: '#8888A8' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleClearAll()}
              disabled={clearing}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: '#ef4444', color: 'white' }}
            >
              {clearing ? 'Clearing…' : 'Clear all'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MemoryRow({ memory, onDelete }: { memory: MemoryRecord; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(memory.id)
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: '#12121F', border: '1px solid #1E1E35' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{memory.content}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#1A1A2E', color: '#8888A8', border: '1px solid #2A2A40' }}
          >
            {ENTITY_TYPE_LABELS[memory.entity_type] ?? memory.entity_type}
          </span>
          <span className="text-xs" style={{ color: '#8888A8' }}>
            confidence{' '}
            <span style={{ color: confidenceColor(memory.confidence), fontWeight: 600 }}>
              {Math.round(memory.confidence * 100)}%
            </span>
          </span>
          {memory.times_reinforced > 1 && (
            <span className="text-xs" style={{ color: '#8888A8' }}>
              ×{memory.times_reinforced}
            </span>
          )}
          <span className="text-xs" style={{ color: '#8888A8' }}>{formatDate(memory.created_at)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:text-red-400 transition-colors disabled:opacity-40"
        style={{ color: '#8888A8' }}
        title="Delete"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-md rounded-xl p-5 shadow-2xl"
        style={{ background: '#1A1A2E', border: '1px solid #2A2A40' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2A2A40] transition-colors"
            style={{ color: '#8888A8' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 14,4" />
      <path d="M6 4V2h4v2" />
      <rect x="3" y="4" width="10" height="10" rx="1" />
    </svg>
  )
}
