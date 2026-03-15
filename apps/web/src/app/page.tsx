import AuthGate from '@/components/AuthGate'
import ChatInterface from '@/components/ChatInterface'

// CLAW_WEB_PASSWORD is a server-only env var (no NEXT_PUBLIC_ prefix)
const webPassword = process.env.CLAW_WEB_PASSWORD ?? null

export default function HomePage() {
  return (
    <div className="h-full">
      <AuthGate password={webPassword}>
        <ChatInterface />
      </AuthGate>
    </div>
  )
}
