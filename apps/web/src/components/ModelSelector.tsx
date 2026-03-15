'use client'

import { useState, useEffect } from 'react'
import { fetchLocalModels } from '@/lib/api'
import type { LocalModel } from '@/lib/types'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<LocalModel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchLocalModels()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || models.length === 0) return null

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-colors"
      style={{
        background: 'var(--surface-high)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
      title="Select model"
    >
      <option value="">Auto</option>
      {models.map((m) => (
        <option key={m.name} value={m.name}>
          {m.name} ({m.size_gb.toFixed(1)}GB)
        </option>
      ))}
    </select>
  )
}
