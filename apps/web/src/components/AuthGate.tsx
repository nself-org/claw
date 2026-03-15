'use client'

import { useState, useEffect } from 'react'
import { getAuthCookie, setAuthCookie } from '@/lib/storage'

interface AuthGateProps {
  children: React.ReactNode
}

// CLAW_WEB_PASSWORD is exposed at build time (server-side only).
// The page passes it as a prop so the client doesn't need it directly.
export default function AuthGate({
  children,
  password,
}: AuthGateProps & { password: string | null }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!password) {
      setAuthed(true)
      return
    }
    const cookie = getAuthCookie()
    setAuthed(cookie === 'ok')
  }, [password])

  if (authed === null) return null // waiting for hydration

  if (authed) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (input === password) {
      setAuthCookie('ok', 24)
      setAuthed(true)
    } else {
      setError('Incorrect password')
      setInput('')
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-[#0F0F1A]">
      <form
        onSubmit={submit}
        className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-2">
          <span className="text-3xl font-bold text-[#6366F1]">ɳClaw</span>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Enter password to continue
          </p>
        </div>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366F1]"
          style={{
            background: 'var(--surface-high)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        {error && <p className="text-red-400 text-sm text-center -mt-2">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-colors text-white"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}
