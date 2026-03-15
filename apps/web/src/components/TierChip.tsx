interface TierChipProps {
  tierSource: string
  latencyMs?: number
}

function getTierColor(tierSource: string): { bg: string; text: string; border: string } {
  const lower = tierSource.toLowerCase()
  if (lower.includes('local') || lower.includes('phi') || lower.includes('llama') || lower.includes('ollama')) {
    return { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' }
  }
  if (lower.includes('free') || lower.includes('gemini') || lower.includes('flash')) {
    return { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
  }
  if (lower.includes('api') || lower.includes('claude') || lower.includes('openai') || lower.includes('gpt') || lower.includes('paid')) {
    return { bg: 'rgba(251,146,60,0.12)', text: '#fb923c', border: 'rgba(251,146,60,0.3)' }
  }
  return { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' }
}

export default function TierChip({ tierSource, latencyMs }: TierChipProps) {
  const colors = getTierColor(tierSource)
  const latency = latencyMs !== undefined ? ` • ${(latencyMs / 1000).toFixed(1)}s` : ''
  const label = `${tierSource}${latency}`

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  )
}
