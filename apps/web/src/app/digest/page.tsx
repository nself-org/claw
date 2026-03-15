'use client'

// T-1205 (partial): DigestViewer web page — shows current digest, pull-to-refresh.

import { useState, useEffect, useCallback } from 'react'
import { fetchProactiveDigest } from '@/lib/api'

export default function DigestPage() {
  const [text, setText] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProactiveDigest()
      setText(data.text)
      setGeneratedAt(data.generated_at)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function formatGeneratedAt(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #0F0F1A)', color: 'var(--text, #E4E4F0)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Daily Digest</h1>
            {generatedAt && (
              <p className="text-sm mt-1" style={{ color: '#8888A8' }}>
                Generated {formatGeneratedAt(generatedAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#2A2A40] disabled:opacity-50"
            style={{ color: '#8888A8', border: '1px solid #2A2A40' }}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#2d1a1a', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !text || text.trim() === '' ? (
          <div className="text-center py-16" style={{ color: '#8888A8' }}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Nothing to digest yet.</p>
            <p className="text-xs mt-1" style={{ color: '#666680' }}>
              The digest is generated once enough conversation history exists.
            </p>
          </div>
        ) : (
          <div
            className="px-6 py-5 rounded-xl leading-relaxed whitespace-pre-wrap text-sm"
            style={{ background: '#12121F', border: '1px solid #1E1E35', lineHeight: 1.7 }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  )
}
