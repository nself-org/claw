'use client'

// T-1178: Integration guide — Python/JS/curl code snippets with dynamic server URL + key, copy buttons.

import { useState } from 'react'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_CLAW_URL?.replace(/\/$/, '') ?? 'https://your-server.example.com'

type Lang = 'python' | 'javascript' | 'curl'

const LANG_LABELS: Record<Lang, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  curl: 'cURL',
}

function buildSnippets(apiKey: string, baseUrl: string): Record<Lang, string> {
  const url = `${baseUrl}/v1`
  return {
    python: `from openai import OpenAI

client = OpenAI(
    base_url="${url}",
    api_key="${apiKey}",
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Explain nSelf plugins"}],
)
print(response.choices[0].message.content)`,

    javascript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${url}",
  apiKey: "${apiKey}",
});

const response = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Explain nSelf plugins" }],
});
console.log(response.choices[0].message.content);`,

    curl: `curl ${url}/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Explain nSelf plugins"}]
  }'`,
  }
}

const MODELS = [
  { name: 'auto', note: 'Automatic routing — best available model' },
  { name: 'local', note: 'Local Ollama model (no API cost)' },
  { name: 'gpt-4o', note: 'OpenAI GPT-4o (requires OPENAI_API_KEY on server)' },
  { name: 'gemini-1.5-flash', note: 'Google Gemini Flash (free tier available)' },
  { name: 'claude-3-5-sonnet', note: 'Anthropic Claude (requires ANTHROPIC_API_KEY on server)' },
]

const HEADERS = [
  { name: 'x-nself-app', value: 'true', note: 'Inject nSelf expert system prompt' },
  { name: 'x-nself-admin', value: 'true', note: 'Enable admin mode (key must have admin_allowed=true)' },
  { name: 'x-nself-session-id', value: '<uuid>', note: 'Continue an existing chat session' },
  { name: 'x-nself-knowledge', value: 'true', note: 'Inject relevant nSelf knowledge into context' },
]

export default function IntegrationPage() {
  const [lang, setLang] = useState<Lang>('python')
  const [apiKey, setApiKey] = useState('sk-nself-your-key-here')
  const snippets = buildSnippets(apiKey, BASE_URL)

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
        <h1 className="flex-1 text-base font-semibold">Integration Guide</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Intro */}
        <section>
          <h2 className="text-sm font-semibold mb-2">OpenAI-compatible API</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Your nClaw server speaks the OpenAI Chat Completions API. Any existing OpenAI integration
            works by swapping in your server URL and a gateway key. No SDK changes needed.
          </p>
          <div
            className="mt-3 px-3 py-2 rounded-lg font-mono text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Base URL: <span style={{ color: 'var(--text)' }}>{BASE_URL}/v1</span>
          </div>
        </section>

        {/* Key input */}
        <section>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Your API key (paste here to fill examples)
          </label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-nself-…"
            className="w-full max-w-md px-3 py-2 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-[#6366F1]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            No key yet?{' '}
            <Link href="/settings/api-keys" className="text-indigo-400 hover:underline">
              Create one
            </Link>
          </p>
        </section>

        {/* Code snippets */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Quick start</h2>
          <div className="flex gap-1 mb-0">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3 py-1.5 text-xs rounded-t-lg font-medium transition-colors"
                style={{
                  background: lang === l ? 'var(--surface)' : 'transparent',
                  border: lang === l ? '1px solid var(--border)' : '1px solid transparent',
                  borderBottom: lang === l ? '1px solid var(--surface)' : '1px solid var(--border)',
                  color: lang === l ? 'var(--text)' : 'var(--text-muted)',
                  marginBottom: -1,
                  position: 'relative',
                  zIndex: lang === l ? 1 : 0,
                }}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <CodeBlock code={snippets[lang]} lang={lang} />
        </section>

        {/* Streaming */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Streaming</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Add <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: 'var(--surface)' }}>&quot;stream&quot;: true</code> for
            SSE streaming. The response uses the standard OpenAI chunk format.
          </p>
          <CodeBlock
            code={`curl ${BASE_URL}/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","stream":true,"messages":[{"role":"user","content":"Hello"}]}'`}
            lang="curl"
          />
        </section>

        {/* Models */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Available models</h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="w-full text-sm" style={{ background: 'var(--surface)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Model name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m, i) => (
                  <tr key={m.name} style={i < MODELS.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}>
                    <td className="px-4 py-3 font-mono text-xs">{m.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Use <code className="font-mono px-1" style={{ background: 'var(--surface)' }}>GET /v1/models</code> to list models
            currently available on your server.
          </p>
        </section>

        {/* Custom headers */}
        <section>
          <h2 className="text-sm font-semibold mb-2">nSelf custom headers</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            These optional headers activate nClaw-specific features.
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="w-full text-sm" style={{ background: 'var(--surface)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Header', 'Value', 'Effect'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEADERS.map((h, i) => (
                  <tr key={h.name} style={i < HEADERS.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{h.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{h.value}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Embeddings */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Embeddings</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Standard OpenAI embeddings endpoint. Uses Ollama nomic-embed-text locally, falls back to
            OpenAI text-embedding-3-small if configured.
          </p>
          <CodeBlock
            code={`curl ${BASE_URL}/v1/embeddings \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"nomic-embed-text","input":"nSelf plugin system"}'`}
            lang="curl"
          />
        </section>
      </div>
    </div>
  )
}

// ── CodeBlock ──────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors"
          style={{
            color: copied ? '#4ade80' : 'var(--text-muted)',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre
        className="p-4 text-xs overflow-x-auto leading-relaxed"
        style={{ color: 'var(--text)', margin: 0 }}
      >
        {code}
      </pre>
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

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M9 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  )
}
