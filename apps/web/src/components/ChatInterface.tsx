'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import ModelSelector from './ModelSelector'
import Sidebar from './Sidebar'
import { streamChat } from '@/lib/api'
import {
  loadSessions,
  saveSession,
  newSession,
  deleteSession,
  addMessageToSession,
} from '@/lib/storage'
import type { ChatMessage, ChatSession } from '@/lib/types'

// Web Speech API — use `any` since these types aren't in all TS DOM lib versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any
function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | null
}

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Detect Speech Recognition support on mount
  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null)
  }, [])

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = loadSessions()
    setSessions(stored)
    if (stored.length > 0) {
      const first = stored[0]
      setActiveSession(first)
      setMessages(first.messages ?? [])
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  function refreshSessions() {
    setSessions(loadSessions())
  }

  function handleNewSession() {
    const session = newSession()
    refreshSessions()
    setActiveSession(session)
    setMessages([])
    setSidebarOpen(false)
  }

  function handleSelectSession(id: string) {
    const all = loadSessions()
    const session = all.find((s) => s.id === id)
    if (!session) return
    setActiveSession(session)
    setMessages(session.messages ?? [])
    setSidebarOpen(false)
  }

  function handleDeleteSession(id: string) {
    deleteSession(id)
    refreshSessions()
    if (activeSession?.id === id) {
      const remaining = loadSessions()
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].id)
      } else {
        setActiveSession(null)
        setMessages([])
      }
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    setError(null)
    setInput('')

    // Ensure we have an active session
    let session = activeSession
    if (!session) {
      session = newSession()
      refreshSessions()
      setActiveSession(session)
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    addMessageToSession(session.id, userMsg)
    refreshSessions()

    // Placeholder assistant message for streaming
    const assistantId = crypto.randomUUID()
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }
    setMessages([...updatedMessages, assistantPlaceholder])
    setIsStreaming(true)
    setStreamingId(assistantId)

    const abort = new AbortController()
    abortRef.current = abort

    let accumulated = ''

    await streamChat({
      message: text,
      sessionId: session.id,
      model: selectedModel || undefined,
      signal: abort.signal,
      onChunk(chunk) {
        accumulated += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        )
      },
      onDone({ tier_source, latency_ms, session_id }) {
        const finalMsg: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: accumulated,
          tier_source,
          latency_ms,
          createdAt: Date.now(),
        }
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? finalMsg : m)))
        setIsStreaming(false)
        setStreamingId(null)

        // Save to storage
        addMessageToSession(session!.id, finalMsg)
        // If server returned a different session_id (new session created server-side), update
        if (session_id && session_id !== session!.id) {
          const updated: ChatSession = { ...session!, id: session_id }
          saveSession(updated)
        }
        refreshSessions()
      },
      onError(err) {
        if (abort.signal.aborted) return
        setError(err.message)
        setIsStreaming(false)
        setStreamingId(null)
        // Remove empty assistant placeholder
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
      },
    })
  }, [input, isStreaming, activeSession, messages, selectedModel])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function cancelStream() {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingId(null)
  }

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
      }
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSession?.id ?? null}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#2A2A40] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            <MenuIcon />
          </button>

          <h1 className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>
            {activeSession?.title ?? 'ɳClaw'}
          </h1>

          <ModelSelector value={selectedModel} onChange={setSelectedModel} />

          <button
            onClick={handleNewSession}
            title="New chat"
            className="hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-[#2A2A40] transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <PlusIcon />
            New
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.id === streamingId && isStreaming}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mx-4 mb-2 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Input bar */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="max-w-3xl mx-auto flex items-end gap-2 rounded-2xl px-4 py-2"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ɳClaw…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm outline-none py-1.5 placeholder-[#8888A8] disabled:opacity-50"
              style={{ color: 'var(--text)', maxHeight: '160px' }}
            />
            {/* Mic button — only shown when speech is supported and not streaming */}
            {speechSupported && !isStreaming && (
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                onKeyDown={(e) => e.key === ' ' && startListening()}
                onKeyUp={(e) => e.key === ' ' && stopListening()}
                title={isListening ? 'Listening… release to stop' : 'Hold to speak'}
                type="button"
                className={[
                  'shrink-0 self-end pb-1 w-8 h-8 flex items-center justify-center rounded-full transition-all',
                  isListening
                    ? 'bg-red-500/20 text-red-400 scale-110'
                    : 'text-[#8888A8] hover:text-white hover:bg-[#2A2A40]',
                ].join(' ')}
              >
                <MicIcon active={isListening} />
              </button>
            )}
            <div className="shrink-0 pb-1">
              {isStreaming ? (
                <button
                  onClick={cancelStream}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3A3A50] hover:bg-[#4A4A60] transition-colors"
                  title="Stop"
                >
                  <StopIcon />
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  <SendIcon />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        ɳ
      </div>
      <div>
        <h2 className="text-lg font-semibold">Ask ɳClaw anything</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Local AI • Free tier • Paid APIs — all in one place
        </p>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="5" x2="16" y2="5" />
      <line x1="2" y1="9" x2="16" y2="9" />
      <line x1="2" y1="13" x2="16" y2="13" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="14" y1="2" x2="1" y2="8" />
      <line x1="14" y1="2" x2="7" y2="15" />
      <line x1="14" y1="2" x2="1" y2="8" />
      <polyline points="1,8 7,15 14,2" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" rx="2" fill="var(--text-muted)" />
    </svg>
  )
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="1" width="6" height="9" rx="3" fill={active ? 'currentColor' : 'none'} />
      <path d="M2 8a6 6 0 0 0 12 0" />
      <line x1="8" y1="14" x2="8" y2="11" />
      <line x1="5" y1="14" x2="11" y2="14" />
    </svg>
  )
}
